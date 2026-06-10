-- V2.0 Foundation — one-time website PROJECTS (the missing noun for fixed-price engagements).
--
-- WSS 1.5 models recurring support work (subscriptions → tickets). It has no concept of a one-time,
-- fixed-price website project (e.g. a $500 build). This migration adds that, additively:
--   * A new `projects` table (tenant-keyed exactly like tickets: agency_id/client_id, site_id nullable
--     because a brand-new website has no site yet). Delivery lifecycle in `status`
--     (intake → scoping → in_progress → waiting_on_customer → in_review → delivered → closed, plus
--     blocked/cancelled); money state is the orthogonal `payment_status` (unpaid=Lead, paid=Purchased);
--     `target_delivery_date` powers the operator "overdue" view. See WSS_V2_FOUNDATION_PLAN.md Part II.
--   * A new `project_audit_events` governance trail (mirrors ticket_audit_events; free-text event_type
--     so it never couples to the support audit enum).
--   * OPERATOR-ONLY RLS. No customer policy → customers are denied by default (customer visibility is a
--     later phase, V2.3). No change to signup/onboarding/checkout/ticket flow.
--   * SECURITY DEFINER operator RPCs (operator_create_project, operator_set_project_status,
--     operator_update_project, operator_set_project_access) following the same self-authorizing
--     pattern as the operator_* ticket RPCs.
--   * Website Project MVP fields: website_url, platform, access_status (website_access_status enum)
--     — guided website access with NO OAuth and NO credential storage.
--   * A DEDICATED tenant-key guard for projects (new function — does NOT edit the shared
--     app_block_tenant_key_change used by the live ticket tables).
--
-- This migration creates ONLY new objects. It reads/writes no existing table, RPC, policy, function,
-- or trigger. It is intentionally NOT YET APPLIED: the Supabase CLI here is linked to production, and
-- WSS 1.5 signup hardening owns that DB. APPLY TO DEV FIRST AND VERIFY tenant isolation before any
-- production enablement, and only in a coordinated window.

-- ============================================================================
-- 1. Enums (guarded so dev re-verification runs are idempotent).
-- ============================================================================
do $$ begin
  create type public.project_type as enum (
    'new_website', 'rebuild', 'fix', 'update', 'migration', 'ongoing_ops', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_status as enum (
    'intake', 'scoping', 'in_progress', 'waiting_on_customer', 'in_review', 'delivered', 'closed', 'blocked', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_payment_status as enum ('unpaid', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

-- Website Project MVP: guided website-access lifecycle (NO OAuth, NO credential storage).
--   access_needed → access_requested → access_received → verified ; `blocked` is the off-ramp.
do $$ begin
  create type public.website_access_status as enum (
    'access_needed', 'access_requested', 'access_received', 'verified', 'blocked'
  );
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 2. Tables.
-- ============================================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  site_id uuid,
  project_number text not null,
  title text not null,
  summary text,
  project_type public.project_type not null default 'new_website',
  status public.project_status not null default 'intake',
  price_cents integer,
  currency text not null default 'usd',
  payment_status public.project_payment_status not null default 'unpaid',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  intake_notes text,
  target_delivery_date date,
  delivered_at timestamptz,
  closed_at timestamptz,
  -- Website Project MVP fields (additive; safe defaults => no row rewrite on re-apply).
  website_url text,                                              -- current or target site URL
  platform text,                                                 -- 'wordpress' | 'shopify' | 'wix' | 'other'
  access_status public.website_access_status not null default 'access_needed',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint projects_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint projects_site_fkey foreign key (site_id) references public.sites (id) on delete set null,
  constraint projects_number_per_agency unique (agency_id, project_number),
  constraint projects_price_nonneg check (price_cents is null or price_cents >= 0),
  constraint projects_platform_known check (platform is null or platform in ('wordpress', 'shopify', 'wix', 'other'))
);

-- Idempotent guard: if a prior dev-verification run already created `projects` WITHOUT the MVP
-- columns, `create table if not exists` above is a no-op, so re-add the columns/constraint here.
do $$ begin
  alter table public.projects add column if not exists website_url text;
  alter table public.projects add column if not exists platform text;
  alter table public.projects add column if not exists access_status public.website_access_status not null default 'access_needed';
exception when others then null; end $$;
do $$ begin
  alter table public.projects add constraint projects_platform_known
    check (platform is null or platform in ('wordpress', 'shopify', 'wix', 'other'));
exception when duplicate_object then null; end $$;

create index if not exists projects_agency_id_idx on public.projects (agency_id);
create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_target_delivery_date_idx on public.projects (target_delivery_date);
create index if not exists projects_access_status_idx on public.projects (access_status);

create table if not exists public.project_audit_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  project_id uuid not null,
  actor_id text not null,
  actor_role text not null,
  event_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_audit_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint project_audit_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint project_audit_project_fkey foreign key (project_id) references public.projects (id) on delete cascade
);

create index if not exists project_audit_project_id_idx on public.project_audit_events (project_id);
create index if not exists project_audit_agency_id_idx on public.project_audit_events (agency_id);

-- ============================================================================
-- 3. Dedicated tenant-key guard (NEW function — does not touch the shared ticket guard).
--    Blocks end users from re-parenting a project across tenants; service_role may re-parent.
-- ============================================================================
create or replace function public.app_block_project_tenant_key_change()
returns trigger language plpgsql as $$
begin
  if auth.role() is not null and auth.role() <> 'service_role' then
    if (new.agency_id is distinct from old.agency_id)
       or (new.client_id is distinct from old.client_id)
       or (new.site_id is distinct from old.site_id) then
      raise exception 'tenant_key_change_forbidden' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists projects_block_tenant_key_change on public.projects;
create trigger projects_block_tenant_key_change before update on public.projects
  for each row execute function public.app_block_project_tenant_key_change();

-- ============================================================================
-- 4. RLS — OPERATOR ONLY. Deny-by-default: no customer policy means customers cannot see projects.
--    Reuses the proven app_operator_in_agency() helper (read-only call; not modified here).
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['projects', 'project_audit_events'] loop
    execute format('revoke all on public.%I from anon;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;

create policy projects_operator_all on public.projects
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

create policy project_audit_events_operator_select on public.project_audit_events
  for select to authenticated using (app_operator_in_agency(agency_id));
create policy project_audit_events_operator_insert on public.project_audit_events
  for insert to authenticated with check (app_operator_in_agency(agency_id));

-- ============================================================================
-- 5. Operator RPCs (SECURITY DEFINER, self-authorizing — same pattern as operator_* ticket RPCs).
-- ============================================================================

-- helper: resolve operator + project context, or raise.
create or replace function public.app_operator_project_ctx(
  p_project_id uuid,
  out operator_id uuid, out operator_email text, out operator_role text,
  out agency_id uuid, out client_id uuid, out site_id uuid, out project_status text
)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select p.agency_id, p.client_id, p.site_id, p.status::text
    into agency_id, client_id, site_id, project_status
  from public.projects p where p.id = p_project_id;
  if agency_id is null then raise exception 'project_not_found' using errcode = 'P0001'; end if;
  select o.id, o.email, o.role::text into operator_id, operator_email, operator_role
  from public.operators o
  where o.auth_user_id = v_uid and o.agency_id = app_operator_project_ctx.agency_id and o.status = 'active';
  if operator_id is null then raise exception 'not_authorized_operator' using errcode = '42501'; end if;
end;
$$;

create or replace function public.app_project_audit(
  p_agency uuid, p_client uuid, p_project uuid,
  p_actor_id uuid, p_actor_role text, p_event text, p_summary text
) returns void language sql security definer set search_path = public as $$
  insert into public.project_audit_events (agency_id, client_id, project_id, actor_id, actor_role, event_type, summary)
  values (p_agency, p_client, p_project, p_actor_id::text, p_actor_role, p_event, p_summary);
$$;

-- Create a project for an existing customer org. agency_id is derived server-side from the client
-- (no tenant hopping). Caller must be an active operator in that agency.
-- MVP: extended with optional website_url / platform / target_delivery_date (backward-compatible
-- defaults). The old 7-arg signature is dropped first so a re-verification dev DB has exactly one
-- overload (avoids ambiguous-function errors); fresh apply just creates this one.
drop function if exists public.operator_create_project(uuid, text, text, text, uuid, integer, text);
create or replace function public.operator_create_project(
  p_client_id uuid,
  p_title text,
  p_project_type text default 'new_website',
  p_summary text default null,
  p_site_id uuid default null,
  p_price_cents integer default null,
  p_intake_notes text default null,
  p_website_url text default null,
  p_platform text default null,
  p_target_delivery_date date default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_agency uuid;
  v_op record;
  v_type public.project_type;
  v_platform text;
  v_id uuid := gen_random_uuid();
  v_num text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if btrim(coalesce(p_title, '')) = '' then raise exception 'title_required' using errcode = '22023'; end if;

  select c.agency_id into v_agency from public.clients c where c.id = p_client_id;
  if v_agency is null then raise exception 'client_not_found' using errcode = 'P0001'; end if;

  select o.id, o.email, o.role::text as role into v_op
  from public.operators o where o.auth_user_id = v_uid and o.agency_id = v_agency and o.status = 'active';
  if v_op.id is null then raise exception 'not_authorized_operator' using errcode = '42501'; end if;

  -- If a site is given it must belong to the same org (no cross-tenant linkage).
  if p_site_id is not null then
    if not exists (select 1 from public.sites s where s.id = p_site_id and s.client_id = p_client_id) then
      raise exception 'site_not_in_org' using errcode = '42501';
    end if;
  end if;

  begin v_type := p_project_type::public.project_type;
  exception when others then v_type := 'new_website'; end;

  v_platform := lower(nullif(btrim(coalesce(p_platform, '')), ''));
  if v_platform is not null and v_platform not in ('wordpress', 'shopify', 'wix', 'other') then
    raise exception 'invalid_platform_%', p_platform using errcode = '22023';
  end if;

  v_num := 'PRJ-' || upper(substr(replace(v_id::text, '-', ''), 1, 8));

  insert into public.projects
    (id, agency_id, client_id, site_id, project_number, title, summary, project_type, status, price_cents,
     intake_notes, website_url, platform, target_delivery_date)
  values
    (v_id, v_agency, p_client_id, p_site_id, v_num, btrim(p_title),
     nullif(btrim(coalesce(p_summary, '')), ''), v_type, 'intake', p_price_cents,
     nullif(btrim(coalesce(p_intake_notes, '')), ''),
     nullif(btrim(coalesce(p_website_url, '')), ''), v_platform, p_target_delivery_date);

  perform public.app_project_audit(v_agency, p_client_id, v_id, v_op.id, v_op.role, 'project_created', 'Project created at intake');

  return jsonb_build_object('project_id', v_id, 'project_number', v_num, 'status', 'intake');
end;
$$;

-- Move a project to a new status. Delivery workflow is intentionally looser than the gated ticket
-- flow: an operator may set any valid status. delivered_at/closed_at are stamped on the matching state.
create or replace function public.operator_set_project_status(
  p_project_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_new public.project_status;
begin
  ctx := public.app_operator_project_ctx(p_project_id);

  begin v_new := p_status::public.project_status;
  exception when others then raise exception 'invalid_status_%', p_status using errcode = '22023'; end;

  update public.projects
    set status = v_new,
        delivered_at = case when v_new = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
        closed_at = case when v_new in ('closed', 'cancelled') then coalesce(closed_at, now()) else closed_at end,
        updated_at = now()
  where id = p_project_id;

  perform public.app_project_audit(ctx.agency_id, ctx.client_id, p_project_id, ctx.operator_id, ctx.operator_role,
    'project_status_changed', coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'Status → ' || v_new::text));

  return jsonb_build_object('project_id', p_project_id, 'status', v_new::text);
end;
$$;

-- MVP: edit a project's customer-facing + intake fields, and mark payment (operator-led, no Stripe).
-- Partial update — a NULL argument means "leave unchanged"; an empty string clears a nullable text
-- field. Title can never be blanked. Platform/payment_status are validated if provided.
create or replace function public.operator_update_project(
  p_project_id uuid,
  p_title text default null,
  p_summary text default null,
  p_website_url text default null,
  p_platform text default null,
  p_price_cents integer default null,
  p_target_delivery_date date default null,
  p_intake_notes text default null,
  p_payment_status text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_platform text; v_pay public.project_payment_status; v_summary text;
begin
  ctx := public.app_operator_project_ctx(p_project_id);

  if p_platform is not null then
    v_platform := lower(nullif(btrim(p_platform), ''));
    if v_platform is not null and v_platform not in ('wordpress', 'shopify', 'wix', 'other') then
      raise exception 'invalid_platform_%', p_platform using errcode = '22023';
    end if;
  end if;

  if p_payment_status is not null then
    begin v_pay := p_payment_status::public.project_payment_status;
    exception when others then raise exception 'invalid_payment_status_%', p_payment_status using errcode = '22023'; end;
  end if;

  update public.projects set
    title = coalesce(nullif(btrim(coalesce(p_title, '')), ''), title),
    summary = case when p_summary is null then summary else nullif(btrim(p_summary), '') end,
    website_url = case when p_website_url is null then website_url else nullif(btrim(p_website_url), '') end,
    platform = case when p_platform is null then platform else v_platform end,
    price_cents = coalesce(p_price_cents, price_cents),
    target_delivery_date = coalesce(p_target_delivery_date, target_delivery_date),
    intake_notes = case when p_intake_notes is null then intake_notes else nullif(btrim(p_intake_notes), '') end,
    payment_status = coalesce(v_pay, payment_status),
    updated_at = now()
  where id = p_project_id;

  v_summary := case when v_pay is not null then 'Project updated · payment_status → ' || v_pay::text
                    else 'Project details updated' end;
  perform public.app_project_audit(ctx.agency_id, ctx.client_id, p_project_id, ctx.operator_id, ctx.operator_role,
    'project_updated', v_summary);

  return jsonb_build_object('project_id', p_project_id, 'updated', true);
end;
$$;

-- MVP: guided website-access transition (no OAuth/credentials — operator self-reports the state).
create or replace function public.operator_set_project_access(
  p_project_id uuid,
  p_access_status text,
  p_note text default null
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_new public.website_access_status;
begin
  ctx := public.app_operator_project_ctx(p_project_id);

  begin v_new := p_access_status::public.website_access_status;
  exception when others then raise exception 'invalid_access_status_%', p_access_status using errcode = '22023'; end;

  update public.projects set access_status = v_new, updated_at = now() where id = p_project_id;

  perform public.app_project_audit(ctx.agency_id, ctx.client_id, p_project_id, ctx.operator_id, ctx.operator_role,
    'project_access_changed', coalesce(nullif(btrim(coalesce(p_note, '')), ''), 'Access → ' || v_new::text));

  return jsonb_build_object('project_id', p_project_id, 'access_status', v_new::text);
end;
$$;

-- ============================================================================
-- 6. Grants: helpers stay internal; operator RPCs are callable by authenticated operators
--    (they self-authorize). anon gets nothing.
-- ============================================================================
revoke all on function public.app_operator_project_ctx(uuid) from public, anon, authenticated;
revoke all on function public.app_project_audit(uuid, uuid, uuid, uuid, text, text, text) from public, anon, authenticated;

revoke all on function public.operator_create_project(uuid, text, text, text, uuid, integer, text, text, text, date) from public, anon;
grant execute on function public.operator_create_project(uuid, text, text, text, uuid, integer, text, text, text, date) to authenticated;
revoke all on function public.operator_set_project_status(uuid, text, text) from public, anon;
grant execute on function public.operator_set_project_status(uuid, text, text) to authenticated;
revoke all on function public.operator_update_project(uuid, text, text, text, text, integer, date, text, text) from public, anon;
grant execute on function public.operator_update_project(uuid, text, text, text, text, integer, date, text, text) to authenticated;
revoke all on function public.operator_set_project_access(uuid, text, text) from public, anon;
grant execute on function public.operator_set_project_access(uuid, text, text) to authenticated;

-- ============================================================================
-- END V2.0. New objects only. NOT APPLIED to production. Verify tenant isolation on dev first
-- (a customer auth.uid() must see zero rows from public.projects), then coordinate prod enablement.
-- ============================================================================
