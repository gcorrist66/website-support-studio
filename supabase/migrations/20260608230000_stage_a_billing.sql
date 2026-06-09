-- Stage A — Billing foundation (subscriptions + paid-customer creation). Revenue path only.
--
-- Scope: the persistence + RPCs that turn a successful Stripe payment into a WSS customer:
--   organization (clients) + subscription + pending-onboarding + a pending owner that the
--   buyer claims on first login. NO dashboard, NO portal, NO capacity engine, NO onboarding UI.
--
-- Identity is bound by auth_user_id, never email (email is only the pending-owner *claim* key at
-- first login, exactly like invitation acceptance). Writes happen via SECURITY DEFINER RPCs called
-- by the Stripe webhook (service_role) — never directly by customers. RLS is enabled.
--
-- Additive. Apply to DEV first and verify before production.

create extension if not exists pgcrypto;

-- ============================================================================
-- subscriptions — one row per Stripe subscription (the paid relationship).
-- ============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  plan text not null check (plan in ('operations', 'growth', 'enterprise')),
  status text not null default 'incomplete'
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text,
  buyer_email text,
  owner_claimed boolean not null default false,
  monthly_cu integer not null default 0,   -- plan allotment (capacity engine consumes later)
  sites_limit integer not null default 1,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint subscriptions_org_fkey foreign key (org_id) references public.clients (id) on delete cascade
);

create unique index if not exists subscriptions_stripe_sub_id_idx
  on public.subscriptions (stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists subscriptions_org_id_idx on public.subscriptions (org_id);
create index if not exists subscriptions_buyer_email_lower_idx on public.subscriptions (lower(buyer_email));
create index if not exists subscriptions_stripe_customer_idx on public.subscriptions (stripe_customer_id);

drop trigger if exists subscriptions_timestamps_before_update on public.subscriptions;
create trigger subscriptions_timestamps_before_update
before update on public.subscriptions
for each row execute function public.touch_updated_at();

-- ============================================================================
-- Plan -> (monthly_cu, sites_limit) — authoritative server-side mapping.
-- ============================================================================
create or replace function public.wss_plan_monthly_cu(p_plan text)
returns integer language sql immutable as $$
  select case p_plan when 'operations' then 50 when 'growth' then 150 else 0 end;
$$;
create or replace function public.wss_plan_sites_limit(p_plan text)
returns integer language sql immutable as $$
  select case p_plan when 'operations' then 1 when 'growth' then 5 else 0 end;
$$;

-- ============================================================================
-- provision_paid_customer — called by the Stripe webhook (service_role) when a
-- subscription is created/paid. Idempotent on stripe_subscription_id. Creates the
-- organization + profile (onboarding_required) + subscription, and records the
-- buyer_email as the pending owner (claimed at first login). Does NOT create the
-- org_members owner row (no auth.uid yet) and creates no UI.
-- ============================================================================
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
          stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id)
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

-- ============================================================================
-- update_subscription_status — webhook updates on subscription/invoice events.
-- ============================================================================
create or replace function public.update_subscription_status(
  p_stripe_subscription_id text,
  p_status text,
  p_current_period_start timestamptz default null,
  p_current_period_end timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_caller_role text := auth.role(); v_id uuid;
begin
  if v_caller_role is not null and v_caller_role <> 'service_role' then
    raise exception 'update_requires_service_role' using errcode = '42501';
  end if;
  update public.subscriptions
    set status = p_status,
        current_period_start = coalesce(p_current_period_start, current_period_start),
        current_period_end = coalesce(p_current_period_end, current_period_end)
    where stripe_subscription_id = p_stripe_subscription_id
    returning id into v_id;
  if v_id is null then
    raise exception 'subscription_not_found' using errcode = 'P0001';
  end if;
  return jsonb_build_object('subscription_id', v_id, 'status', p_status);
end;
$$;

-- ============================================================================
-- claim_paid_org — first-login claim of the pending owner. Binds auth.uid() to the
-- org as org_owner IFF the caller's verified email matches the subscription buyer_email
-- and the org has no active owner yet. Email is the one-time claim key; the durable link
-- is auth_user_id. (Invoked post-login; no UI built here.)
-- ============================================================================
create or replace function public.claim_paid_org(p_subscription_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_sub public.subscriptions%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into v_sub from public.subscriptions where id = p_subscription_id;
  if v_sub.id is null then raise exception 'subscription_not_found' using errcode = 'P0001'; end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  if v_email is null or v_sub.buyer_email is null or v_email <> lower(v_sub.buyer_email) then
    raise exception 'claim_email_mismatch' using errcode = '42501';
  end if;

  -- Idempotent: if caller already owns this org, return it.
  if exists (select 1 from public.org_members m
             where m.org_id = v_sub.org_id and m.auth_user_id = v_uid and m.role = 'org_owner' and m.status = 'active') then
    update public.subscriptions set owner_claimed = true where id = v_sub.id;
    return jsonb_build_object('org_id', v_sub.org_id, 'reused', true);
  end if;
  -- Refuse if an owner already exists (single-owner invariant) or this user owns another org row here.
  if exists (select 1 from public.org_members m where m.org_id = v_sub.org_id and m.role = 'org_owner' and m.status = 'active') then
    raise exception 'org_already_has_owner' using errcode = '23505';
  end if;

  insert into public.org_members (org_id, auth_user_id, role, status)
  values (v_sub.org_id, v_uid, 'org_owner', 'active');
  update public.subscriptions set owner_claimed = true where id = v_sub.id;

  return jsonb_build_object('org_id', v_sub.org_id, 'reused', false);
end;
$$;

-- ============================================================================
-- Grants + RLS for subscriptions (customer-read-own; writes via RPC/service only).
-- ============================================================================
revoke all on function public.provision_paid_customer(text,text,text,text,text,text,timestamptz,timestamptz) from public;
revoke all on function public.update_subscription_status(text,text,timestamptz,timestamptz) from public;
revoke all on function public.claim_paid_org(uuid) from public, anon;
grant execute on function public.provision_paid_customer(text,text,text,text,text,text,timestamptz,timestamptz) to service_role;
grant execute on function public.update_subscription_status(text,text,timestamptz,timestamptz) to service_role;
grant execute on function public.claim_paid_org(uuid) to authenticated;

revoke all on public.subscriptions from anon;
grant select, insert, update, delete on public.subscriptions to authenticated;
alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;

drop policy if exists subscriptions_customer_select on public.subscriptions;
create policy subscriptions_customer_select on public.subscriptions
  for select to authenticated using (app_is_org_member(org_id));
drop policy if exists subscriptions_operator_select on public.subscriptions;
create policy subscriptions_operator_select on public.subscriptions
  for select to authenticated using (app_operator_for_org(org_id));
-- (no customer/operator write policy -> writes only via SECURITY DEFINER RPCs / service_role)

comment on table public.subscriptions is
  'Stripe-backed paid subscription per organization. Populated by the stripe-webhook via '
  'provision_paid_customer/update_subscription_status (service_role). Customers read their own; '
  'writes are RPC/service-role only. RLS enabled.';
