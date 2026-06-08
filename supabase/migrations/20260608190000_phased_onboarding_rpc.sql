-- Phase D (completion) — Canonical agency bootstrap, slug helpers, onboarding RPC.
--
-- Implements the decisions in AUTH_TENANT_MODEL_DECISION.md:
--   * Canonical first-party agency "Website Support Studio" (slug = 'website-support-studio'),
--     created with a generated UUID — NEVER the dev seed agency.
--   * Collision-safe, dependency-free slug generation for clients and sites.
--   * complete_customer_onboarding(...) — atomic, idempotent, fail-closed onboarding.
--
-- What this migration deliberately does NOT do:
--   * It does NOT enable RLS. Customer access / production OAuth remain OFF. The onboarding
--     RPC is SECURITY DEFINER so it is ready to operate once RLS is enabled (Phase E), but no
--     real customer can reach it until auth + RLS are wired and verified.
--   * It uses no extension that requires search_path juggling (slugify is pure SQL/translate).
--   * It never references the dev seed agency id.
--
-- Additive only. Safe to apply to the WSS DEV project (ref vrtfbbrwrxyljchywmzy) for verification.

create extension if not exists pgcrypto;

-- ============================================================================
-- Canonical WSS agency bootstrap (idempotent; generated UUID, not the dev seed).
-- ============================================================================
insert into public.agencies (name, slug)
values ('Website Support Studio', 'website-support-studio')
on conflict (slug) do nothing;

-- ============================================================================
-- Slug helpers
-- ============================================================================

-- Base slugify: lowercase, fold common Latin diacritics, non-alnum -> single hyphen,
-- trim/collapse hyphens, truncate. Pure and deterministic (IMMUTABLE). Dependency-free.
create or replace function public.wss_slugify(p_input text, p_max_len int default 50)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := lower(coalesce(p_input, ''));
  -- Fold the common Latin-1 / Latin Extended lowercase accented letters to ASCII.
  v := translate(
    v,
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿ',
    'aaaaaaceeeeiiiinooooouuuuyy'
  );
  v := regexp_replace(v, '[^a-z0-9]+', '-', 'g');   -- non-alnum runs -> single hyphen
  v := regexp_replace(v, '(^-+|-+$)', '', 'g');      -- trim leading/trailing hyphens
  v := left(v, greatest(p_max_len, 1));
  v := regexp_replace(v, '-+$', '', 'g');            -- trim trailing hyphen after truncation
  return v;
end;
$$;

-- Extract a clean host from a URL (or bare host): drop scheme, userinfo, port, path,
-- query, fragment; strip a leading 'www.'. Pure and deterministic (IMMUTABLE).
create or replace function public.wss_extract_host(p_url text)
returns text
language plpgsql
immutable
as $$
declare
  h text;
begin
  h := lower(btrim(coalesce(p_url, '')));
  h := regexp_replace(h, '^[a-z][a-z0-9+.\-]*://', '');  -- scheme://
  h := regexp_replace(h, '^[^/@]*@', '');                 -- userinfo@
  h := regexp_replace(h, '[/:?#].*$', '');                -- path / :port / ?query / #frag
  h := regexp_replace(h, '^www\.', '');                   -- leading www.
  return h;
end;
$$;

-- Lowest free client slug within an agency: base, then base-2, base-3, ...
create or replace function public.wss_next_client_slug(p_agency_id uuid, p_base text)
returns text
language plpgsql
as $$
declare
  v_candidate text := p_base;
  n int := 1;
begin
  loop
    if not exists (
      select 1 from public.clients where agency_id = p_agency_id and slug = v_candidate
    ) then
      return v_candidate;
    end if;
    n := n + 1;
    v_candidate := p_base || '-' || n;
  end loop;
end;
$$;

-- Lowest free site slug within a client: base, then base-2, base-3, ...
create or replace function public.wss_next_site_slug(p_client_id uuid, p_base text)
returns text
language plpgsql
as $$
declare
  v_candidate text := p_base;
  n int := 1;
begin
  loop
    if not exists (
      select 1 from public.sites where client_id = p_client_id and slug = v_candidate
    ) then
      return v_candidate;
    end if;
    n := n + 1;
    v_candidate := p_base || '-' || n;
  end loop;
end;
$$;

-- ============================================================================
-- complete_customer_onboarding(...) — atomic, idempotent, fail-closed.
--
-- Param names are p_-prefixed to avoid collisions with org_profiles column names
-- (website_count, cms_platform, primary_contact_*, support_email). Callable shape:
--   complete_customer_onboarding(
--     p_company_name, p_website_url, p_website_count, p_cms_platform,
--     p_primary_contact_name, p_primary_contact_email, p_support_email)
-- Returns jsonb: { "org_id": <uuid>, "onboarding_status": "<status>", "reused": <bool> }
-- ============================================================================
create or replace function public.complete_customer_onboarding(
  p_company_name text,
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
  c_agency_slug constant text := 'website-support-studio';
  v_reserved constant text[] := array[
    'admin','api','app','auth','login','logout','callback','settings','billing','new','org','www'
  ];
  v_uid uuid;
  v_agency_id uuid;
  v_org_id uuid;
  v_existing_org uuid;
  v_existing_status text;
  v_base text;
  v_slug text;
  v_host text;
  v_site_base text;
  v_site_slug text;
  v_has_site boolean := false;
  v_status text;
  v_tries int;
begin
  -- 1. Require an authenticated caller.
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Serialize concurrent onboarding for the same user (prevents duplicate orgs).
  perform pg_advisory_xact_lock(hashtext('wss_onboarding:' || v_uid::text));

  -- 2. Idempotency: if this user already owns an active org, return it unchanged.
  select m.org_id into v_existing_org
  from public.org_members m
  where m.auth_user_id = v_uid and m.role = 'org_owner' and m.status = 'active'
  order by m.created_at asc
  limit 1;

  if v_existing_org is not null then
    select p.onboarding_status into v_existing_status
    from public.org_profiles p where p.org_id = v_existing_org;
    return jsonb_build_object(
      'org_id', v_existing_org,
      'onboarding_status', coalesce(v_existing_status, 'onboarding_required'),
      'reused', true
    );
  end if;

  -- 3. Resolve the canonical agency by slug. FAIL CLOSED if it is missing — never
  --    fall back to the dev seed agency or create an orphaned organization.
  select a.id into v_agency_id from public.agencies a where a.slug = c_agency_slug;
  if v_agency_id is null then
    raise exception 'canonical_agency_missing' using errcode = 'P0001';
  end if;

  -- Company name is required to create an organization.
  if p_company_name is null or btrim(p_company_name) = '' then
    raise exception 'company_name_required' using errcode = '22023';
  end if;

  -- 4. Create the client organization with a collision-safe slug.
  v_base := public.wss_slugify(p_company_name, 50);
  if v_base = '' or v_base = any (v_reserved) then
    v_base := 'org';
  end if;

  v_tries := 0;
  loop
    v_slug := public.wss_next_client_slug(v_agency_id, v_base);
    begin
      insert into public.clients (agency_id, name, slug)
      values (v_agency_id, btrim(p_company_name), v_slug)
      returning id into v_org_id;
      exit;
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries > 10 then
        raise;
      end if;
    end;
  end loop;

  -- 5. Create the first site when a usable URL is supplied (Option A, graceful fallback).
  v_host := public.wss_extract_host(p_website_url);
  if length(v_host) > 0 then
    v_site_base := public.wss_slugify(v_host, 63);
    if v_site_base = '' then
      v_site_base := 'site';
    end if;
    v_tries := 0;
    loop
      v_site_slug := public.wss_next_site_slug(v_org_id, v_site_base);
      begin
        insert into public.sites (agency_id, client_id, name, url, slug)
        values (v_agency_id, v_org_id, v_host, btrim(p_website_url), v_site_slug);
        v_has_site := true;
        exit;
      exception when unique_violation then
        v_tries := v_tries + 1;
        if v_tries > 10 then
          raise;
        end if;
      end;
    end loop;
  end if;

  -- 6. Determine onboarding completeness (required data present?).
  if btrim(coalesce(p_primary_contact_email, '')) <> ''
     and (v_has_site or coalesce(p_website_count, 0) > 0) then
    v_status := 'complete';
  else
    v_status := 'onboarding_required';
  end if;

  -- 7. Create the org profile (1:1 with the organization).
  insert into public.org_profiles (
    org_id, website_count, cms_platform, primary_contact_name,
    primary_contact_email, support_email, onboarding_status
  )
  values (
    v_org_id, p_website_count, p_cms_platform, p_primary_contact_name,
    p_primary_contact_email, p_support_email, v_status
  );

  -- 8. Create the owner membership (single active owner enforced by the partial unique index).
  insert into public.org_members (org_id, auth_user_id, role, status)
  values (v_org_id, v_uid, 'org_owner', 'active');

  -- 9. Return the result.
  return jsonb_build_object(
    'org_id', v_org_id,
    'onboarding_status', v_status,
    'reused', false
  );
end;
$$;

comment on function public.complete_customer_onboarding(
  text, text, integer, text, text, text, text
) is
  'Atomic, idempotent customer onboarding: resolves the canonical WSS agency (fail-closed), '
  'creates the client organization + org_profile + org_owner membership, and a first site when '
  'a valid URL is given. SECURITY DEFINER. Binds identity by auth.uid(), never email. RLS is '
  'not yet enabled; customer access remains gated until Phase E policies are verified.';
