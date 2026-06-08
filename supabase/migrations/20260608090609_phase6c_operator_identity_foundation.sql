-- Phase 6C — Operator identity foundation.
--
-- Scope: internal operator identity METADATA only.
--   * This table records who the internal WSS operators are (agency staff), their role,
--     status, and optional tenant scoping. It is the persistence backing for the local
--     auth capability guards in src/auth (Phase 6B).
--   * It does NOT enable authentication by itself. No login occurs because of this table.
--   * Supabase Auth user linkage (operators.auth_user_id -> auth.users.id) is FUTURE work;
--     the column is intentionally nullable and unlinked for now.
--   * RLS is intentionally NOT enabled in this migration (see note at the bottom). Operator
--     auth, RLS policies, login UI, and route protection are later, separately-gated phases.
--   * No public API routes, no customer portal, no email provider are introduced here.
--
-- Safe to apply to the WSS Supabase DEV project only (project ref vrtfbbrwrxyljchywmzy).
-- Do NOT apply to any production customer database. Additive migration: no existing schema
-- is altered or dropped.

create extension if not exists pgcrypto;

-- Operator roles. Intentionally a NARROW enum matching the auth OperatorRole vocabulary
-- (src/auth/authTypes.ts): agency_admin, cs_agent, gary_approver. This is deliberately
-- distinct from the broader public.actor_role enum used by the ticket workflow.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'operator_role' and typnamespace = 'public'::regnamespace) then
    create type public.operator_role as enum (
      'agency_admin',
      'cs_agent',
      'gary_approver'
    );
  end if;
end
$$;

-- Operator lifecycle status. Controlled set; only 'active' operators should ever map to a
-- usable session in the application layer.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'operator_status' and typnamespace = 'public'::regnamespace) then
    create type public.operator_status as enum (
      'active',
      'invited',
      'suspended',
      'archived'
    );
  end if;
end
$$;

create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  -- Future Supabase Auth linkage; nullable and unlinked until auth is wired.
  auth_user_id uuid,
  agency_id uuid not null,
  email text not null,
  display_name text not null,
  role public.operator_role not null,
  status public.operator_status not null default 'active',
  -- Optional future tenant scoping helpers (subset of clients/sites within the agency).
  client_ids uuid[],
  site_ids uuid[],
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint operators_agency_fkey foreign key (agency_id)
    references public.agencies (id) on delete cascade,
  -- Email is stored normalized (lowercase) and non-blank.
  constraint operators_email_lowercase check (email = lower(email)),
  constraint operators_email_not_blank check (length(btrim(email)) > 0),
  constraint operators_display_name_not_blank check (length(btrim(display_name)) > 0),
  -- One operator email per agency (email already lowercased by the check above).
  constraint operators_agency_email_unique unique (agency_id, email)
);

-- auth_user_id must be unique when present (a Supabase Auth user maps to at most one operator).
create unique index if not exists operators_auth_user_id_unique_idx
  on public.operators (auth_user_id)
  where auth_user_id is not null;

-- Lookup indexes.
create index if not exists operators_agency_id_idx on public.operators (agency_id);
create index if not exists operators_email_idx on public.operators (email);
create index if not exists operators_role_idx on public.operators (role);
create index if not exists operators_status_idx on public.operators (status);
create index if not exists operators_agency_role_idx on public.operators (agency_id, role);
create index if not exists operators_agency_status_idx on public.operators (agency_id, status);

-- Keep updated_at fresh using the shared trigger function defined in the Phase 2A migration.
drop trigger if exists operators_timestamps_before_update on public.operators;
create trigger operators_timestamps_before_update
before update on public.operators
for each row
execute function public.touch_updated_at();

-- Documentation.
comment on table public.operators is
  'Internal WSS operator identity metadata (agency staff). Backs the local auth capability '
  'guards in src/auth. Does NOT enable authentication by itself; Supabase Auth linkage via '
  'auth_user_id is future work. RLS is intentionally NOT enabled yet. No login UI or routes '
  'are introduced by this table.';
comment on column public.operators.auth_user_id is
  'Future Supabase Auth user id (auth.users.id). Nullable and unlinked until auth is wired.';
comment on column public.operators.agency_id is
  'Owning agency. Every operator must belong to exactly one agency.';
comment on column public.operators.role is
  'Operator role (agency_admin | cs_agent | gary_approver) aligned with src/auth OperatorRole.';
comment on column public.operators.status is
  'Operator lifecycle status. Only ''active'' operators should map to a usable session.';
comment on column public.operators.client_ids is
  'Optional future client scoping (subset of the agency''s clients). Null means agency-wide.';
comment on column public.operators.site_ids is
  'Optional future site scoping (subset of sites within scope). Null means scope-wide.';

-- RLS NOTE: Row Level Security is intentionally NOT enabled on public.operators in this
-- migration. Enabling RLS, defining policies keyed off auth.uid(), and wiring Supabase Auth
-- are deferred to a later, separately-gated phase (see PHASE6_AUTH_BOUNDARY_PLAN.md).
