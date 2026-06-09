-- Stage B — Become Customer: claim the paid org at first login + finalize onboarding.
--
-- Completes Pay -> Login -> Become Customer. The Stripe webhook (Stage A) already created the
-- org + subscription + pending owner (buyer_email). Here:
--   * claim_my_paid_org()      — first-login claim by VERIFIED email -> org_owner membership.
--   * complete_paid_onboarding — owner fills the profile + first site, marks onboarding complete.
--
-- Identity bound by auth.uid(); email is only the one-time claim key (durable link = auth_user_id).
-- No dashboard, portal, or capacity engine. SECURITY DEFINER (callers can't SELECT their pending
-- subscription under RLS before they are a member — that's the chicken-and-egg this resolves).
-- Additive; apply to dev first.

-- ============================================================================
-- claim_my_paid_org — idempotent. Returns the caller's owned org (claiming a pending paid
-- subscription if the verified email matches and it is unclaimed). Drives the post-login gate.
-- Returns: { has_org bool, org_id uuid|null, onboarding_status text|null, claimed bool }
-- ============================================================================
create or replace function public.claim_my_paid_org()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_org_id uuid;
  v_status text;
  v_sub public.subscriptions%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Already an owner? Return that org (idempotent; handles repeat logins).
  select m.org_id into v_org_id
  from public.org_members m
  where m.auth_user_id = v_uid and m.role = 'org_owner' and m.status = 'active'
  order by m.created_at asc limit 1;
  if v_org_id is not null then
    select onboarding_status into v_status from public.org_profiles where org_id = v_org_id;
    return jsonb_build_object('has_org', true, 'org_id', v_org_id,
                             'onboarding_status', coalesce(v_status, 'onboarding_required'), 'claimed', false);
  end if;

  -- Find an unclaimed paid subscription for the caller's verified email.
  select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  if v_email is null then
    return jsonb_build_object('has_org', false, 'org_id', null, 'onboarding_status', null, 'claimed', false);
  end if;

  select * into v_sub from public.subscriptions s
  where lower(s.buyer_email) = v_email and s.owner_claimed = false
    and s.status in ('active', 'trialing', 'past_due', 'incomplete')
  order by s.created_at desc limit 1;
  if v_sub.id is null then
    return jsonb_build_object('has_org', false, 'org_id', null, 'onboarding_status', null, 'claimed', false);
  end if;

  -- Guard the single-owner invariant.
  if exists (select 1 from public.org_members m
             where m.org_id = v_sub.org_id and m.role = 'org_owner' and m.status = 'active') then
    update public.subscriptions set owner_claimed = true where id = v_sub.id;
    select onboarding_status into v_status from public.org_profiles where org_id = v_sub.org_id;
    return jsonb_build_object('has_org', false, 'org_id', null, 'onboarding_status', null, 'claimed', false);
  end if;

  insert into public.org_members (org_id, auth_user_id, role, status)
  values (v_sub.org_id, v_uid, 'org_owner', 'active');
  update public.subscriptions set owner_claimed = true where id = v_sub.id;

  select onboarding_status into v_status from public.org_profiles where org_id = v_sub.org_id;
  return jsonb_build_object('has_org', true, 'org_id', v_sub.org_id,
                           'onboarding_status', coalesce(v_status, 'onboarding_required'), 'claimed', true);
end;
$$;

-- ============================================================================
-- complete_paid_onboarding — owner finalizes onboarding for an EXISTING paid org (the org was
-- created by the Stripe webhook). Updates company name + profile, creates the first site, and
-- marks onboarding complete. Caller must be the org_owner.
-- ============================================================================
create or replace function public.complete_paid_onboarding(
  p_org_id uuid,
  p_company_name text default null,
  p_website_url text default null,
  p_website_count integer default null,
  p_cms_platform text default null,
  p_primary_contact_name text default null,
  p_primary_contact_email text default null,
  p_support_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_agency_id uuid;
  v_host text;
  v_site_base text;
  v_site_slug text;
  v_has_site boolean;
  v_status text;
  v_tries int := 0;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.org_members m
                 where m.org_id = p_org_id and m.auth_user_id = v_uid and m.role = 'org_owner' and m.status = 'active') then
    raise exception 'not_org_owner' using errcode = '42501';
  end if;

  select agency_id into v_agency_id from public.clients where id = p_org_id;
  if v_agency_id is null then raise exception 'org_not_found' using errcode = 'P0001'; end if;

  if btrim(coalesce(p_company_name, '')) <> '' then
    update public.clients set name = btrim(p_company_name) where id = p_org_id;
  end if;

  -- First site (only if none exists yet and a usable URL is supplied).
  select exists (select 1 from public.sites where client_id = p_org_id) into v_has_site;
  if not v_has_site then
    v_host := public.wss_extract_host(p_website_url);
    if length(v_host) > 0 then
      v_site_base := public.wss_slugify(v_host, 63);
      if v_site_base = '' then v_site_base := 'site'; end if;
      loop
        v_site_slug := public.wss_next_site_slug(p_org_id, v_site_base);
        begin
          insert into public.sites (agency_id, client_id, name, url, slug)
          values (v_agency_id, p_org_id, v_host, btrim(p_website_url), v_site_slug);
          v_has_site := true; exit;
        exception when unique_violation then
          v_tries := v_tries + 1; if v_tries > 10 then raise; end if;
        end;
      end loop;
    end if;
  end if;

  if btrim(coalesce(p_primary_contact_email, '')) <> '' and (v_has_site or coalesce(p_website_count, 0) > 0) then
    v_status := 'complete';
  else
    v_status := 'onboarding_required';
  end if;

  insert into public.org_profiles (org_id, website_count, cms_platform, primary_contact_name,
                                   primary_contact_email, support_email, onboarding_status)
  values (p_org_id, p_website_count, p_cms_platform, p_primary_contact_name,
          p_primary_contact_email, p_support_email, v_status)
  on conflict (org_id) do update set
    website_count = coalesce(excluded.website_count, public.org_profiles.website_count),
    cms_platform = coalesce(excluded.cms_platform, public.org_profiles.cms_platform),
    primary_contact_name = coalesce(excluded.primary_contact_name, public.org_profiles.primary_contact_name),
    primary_contact_email = coalesce(excluded.primary_contact_email, public.org_profiles.primary_contact_email),
    support_email = coalesce(excluded.support_email, public.org_profiles.support_email),
    onboarding_status = excluded.onboarding_status;

  return jsonb_build_object('org_id', p_org_id, 'onboarding_status', v_status);
end;
$$;

revoke all on function public.claim_my_paid_org() from public, anon;
revoke all on function public.complete_paid_onboarding(uuid,text,text,integer,text,text,text,text) from public, anon;
grant execute on function public.claim_my_paid_org() to authenticated;
grant execute on function public.complete_paid_onboarding(uuid,text,text,integer,text,text,text,text) to authenticated;
