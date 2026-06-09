-- Fix — backfill buyer_email on reused paid-customer provisioning rows.
--
-- Root cause: Stripe can emit `customer.subscription.created` before
-- `checkout.session.completed`. If the first event provisions the subscription
-- with a null buyer email, the later checkout event reuses the existing row but
-- previously did not backfill `buyer_email`. That left `claim_my_paid_org()`
-- unable to match the signed-in buyer to the subscription, so real customers
-- fell through to the workspace-setup placeholder instead of onboarding.

create or replace function public.provision_paid_customer(
  p_stripe_subscription_id text,
  p_stripe_customer_id text,
  p_plan text,
  p_buyer_email text,
  p_company_name text default null,
  p_status text default 'active',
  p_current_period_start timestamptz default null,
  p_current_period_end timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_agency_slug constant text := 'website-support-studio';
  v_caller_role text := auth.role();
  v_agency_id uuid;
  v_org_id uuid;
  v_sub_id uuid;
  v_base text;
  v_slug text;
  v_name text;
  v_tries int := 0;
begin
  -- Service-role only (the webhook). Block end users.
  if v_caller_role is not null and v_caller_role <> 'service_role' then
    raise exception 'provision_requires_service_role' using errcode = '42501';
  end if;
  if p_plan not in ('operations', 'growth', 'enterprise') then
    raise exception 'invalid_plan' using errcode = '22023';
  end if;

  -- Idempotency: if this Stripe subscription is already provisioned, update + return it.
  select s.id, s.org_id into v_sub_id, v_org_id
  from public.subscriptions s where s.stripe_subscription_id = p_stripe_subscription_id;
  if v_sub_id is not null then
    update public.subscriptions
      set status = coalesce(p_status, status),
          current_period_start = coalesce(p_current_period_start, current_period_start),
          current_period_end = coalesce(p_current_period_end, current_period_end),
          stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
          buyer_email = coalesce(nullif(lower(btrim(p_buyer_email)), ''), buyer_email),
          plan = coalesce(p_plan, plan)
      where id = v_sub_id;
    return jsonb_build_object('org_id', v_org_id, 'subscription_id', v_sub_id, 'reused', true);
  end if;

  -- Resolve canonical agency (fail closed).
  select a.id into v_agency_id from public.agencies a where a.slug = c_agency_slug;
  if v_agency_id is null then
    raise exception 'canonical_agency_missing' using errcode = 'P0001';
  end if;

  v_name := coalesce(nullif(btrim(p_company_name), ''), split_part(coalesce(p_buyer_email, 'customer'), '@', 1));
  v_base := public.wss_slugify(v_name, 50);
  if v_base = '' then v_base := 'org'; end if;

  loop
    v_slug := public.wss_next_client_slug(v_agency_id, v_base);
    begin
      insert into public.clients (agency_id, name, slug) values (v_agency_id, v_name, v_slug)
      returning id into v_org_id;
      exit;
    exception when unique_violation then
      v_tries := v_tries + 1; if v_tries > 10 then raise; end if;
    end;
  end loop;

  insert into public.org_profiles (org_id, onboarding_status)
  values (v_org_id, 'onboarding_required')
  on conflict (org_id) do nothing;

  insert into public.subscriptions (
    org_id, plan, status, stripe_customer_id, stripe_subscription_id, buyer_email,
    monthly_cu, sites_limit, current_period_start, current_period_end
  ) values (
    v_org_id, p_plan, coalesce(p_status, 'active'), p_stripe_customer_id, p_stripe_subscription_id,
    lower(btrim(p_buyer_email)), public.wss_plan_monthly_cu(p_plan), public.wss_plan_sites_limit(p_plan),
    p_current_period_start, p_current_period_end
  ) returning id into v_sub_id;

  return jsonb_build_object('org_id', v_org_id, 'subscription_id', v_sub_id, 'reused', false);
end;
$$;
