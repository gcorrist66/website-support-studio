-- Phase D — Customer identity foundation (SCHEMA ONLY; NOT production-access-ready).
--
-- Scope: the persistence backing for CUSTOMER identity and onboarding, per
-- AUTH_CUSTOMER_IDENTITY_DESIGN.md. Adds three tables that hang off the existing
-- tenant hierarchy (Agency → Client → Site → Ticket), where the customer-facing
-- "Organization" IS the existing public.clients row (no separate organizations table):
--   * public.org_members      — customer membership (auth.users ⇄ clients), bound by auth_user_id.
--   * public.org_profiles      — 1:1 onboarding/company metadata per organization.
--   * public.org_invitations   — pending email invitations (token-based; bound to auth_user_id on accept).
--
-- What this migration deliberately does NOT do:
--   * It does NOT enable RLS. Customer access is NOT enabled. Policies keyed off auth.uid()
--     are a later, separately-gated phase (Phase E) and must be written AND verified before any
--     real customer can read or write data. THIS MIGRATION IS NOT PRODUCTION-ACCESS-READY.
--   * It does NOT implement the onboarding RPC. complete_customer_onboarding() is intentionally
--     deferred — see the "ONBOARDING RPC — DEFERRED" note at the bottom for the blocker.
--   * It does NOT create org_member_sites (per-site scoping is out of scope for v1).
--   * It does NOT link anyone by email, auto-create memberships, or promote anyone to operator.
--   * It introduces no auth runtime, login UI, routes, OAuth, or secrets.
--
-- Identity binding: membership is keyed by auth_user_id (→ auth.users.id), never by email.
-- Email on org_invitations is an addressing field only; acceptance binds the resulting
-- org_members row to auth_user_id (the durable link).
--
-- Additive only: no existing table/type/column is altered or dropped. Safe to apply to the
-- WSS Supabase DEV project (project ref vrtfbbrwrxyljchywmzy) for schema verification.
-- Do NOT treat as enabling customer login anywhere.

create extension if not exists pgcrypto;

-- ============================================================================
-- public.org_members — customer membership (auth.users ⇄ organization = clients)
-- ============================================================================
create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  -- Organization = the existing public.clients row.
  org_id uuid not null,
  -- The durable identity link. Membership is resolved by this id, never by email.
  auth_user_id uuid not null,
  role text not null check (role in ('org_owner', 'org_admin', 'org_member', 'org_viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint org_members_org_fkey foreign key (org_id)
    references public.clients (id) on delete cascade,
  constraint org_members_auth_user_fkey foreign key (auth_user_id)
    references auth.users (id) on delete cascade,
  -- One membership row per (organization, user).
  constraint org_members_org_user_unique unique (org_id, auth_user_id)
);

create index if not exists org_members_auth_user_id_idx on public.org_members (auth_user_id);
create index if not exists org_members_org_id_idx on public.org_members (org_id);

-- Design invariant (AUTH_CUSTOMER_IDENTITY_DESIGN.md §8): exactly one ACTIVE owner per org.
-- Ownership transfer (later RPC) must demote the current owner in the same transaction.
create unique index if not exists org_members_one_active_owner_idx
  on public.org_members (org_id)
  where role = 'org_owner' and status = 'active';

-- ============================================================================
-- public.org_profiles — 1:1 onboarding / company metadata per organization
-- ============================================================================
create table if not exists public.org_profiles (
  org_id uuid primary key,
  website_count integer,
  cms_platform text,
  primary_contact_name text,
  primary_contact_email text,
  support_email text,
  onboarding_status text not null default 'onboarding_required'
    check (onboarding_status in ('onboarding_required', 'complete')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint org_profiles_org_fkey foreign key (org_id)
    references public.clients (id) on delete cascade
);

-- ============================================================================
-- public.org_invitations — pending, token-based email invitations
-- ============================================================================
create table if not exists public.org_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  -- Addressing field only. Invitations are never an identity-resolution key; the accepted
  -- membership binds to auth_user_id. Owner cannot be granted via invite (transfer-only).
  email text not null,
  role text not null check (role in ('org_admin', 'org_member', 'org_viewer')),
  token_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by_auth_user_id uuid,
  accepted_by_auth_user_id uuid,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint org_invitations_org_fkey foreign key (org_id)
    references public.clients (id) on delete cascade,
  constraint org_invitations_invited_by_fkey foreign key (invited_by_auth_user_id)
    references auth.users (id) on delete set null,
  constraint org_invitations_accepted_by_fkey foreign key (accepted_by_auth_user_id)
    references auth.users (id) on delete set null
);

create index if not exists org_invitations_org_id_idx on public.org_invitations (org_id);
create index if not exists org_invitations_email_lower_idx on public.org_invitations (lower(email));
-- Tokens are random and single-use, so the lookup index is also a uniqueness guarantee.
create unique index if not exists org_invitations_token_hash_idx on public.org_invitations (token_hash);

-- ============================================================================
-- updated_at — reuse the shared trigger function defined in the Phase 2A migration.
-- ============================================================================
drop trigger if exists org_members_timestamps_before_update on public.org_members;
create trigger org_members_timestamps_before_update
before update on public.org_members
for each row
execute function public.touch_updated_at();

drop trigger if exists org_profiles_timestamps_before_update on public.org_profiles;
create trigger org_profiles_timestamps_before_update
before update on public.org_profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists org_invitations_timestamps_before_update on public.org_invitations;
create trigger org_invitations_timestamps_before_update
before update on public.org_invitations
for each row
execute function public.touch_updated_at();

-- ============================================================================
-- Documentation
-- ============================================================================
comment on table public.org_members is
  'Customer membership: links a Supabase Auth user (auth_user_id) to an Organization '
  '(public.clients). Distinct from public.operators (internal staff). RLS NOT enabled yet; '
  'customer access is NOT enabled by this table.';
comment on column public.org_members.org_id is 'Organization = public.clients row.';
comment on column public.org_members.auth_user_id is
  'Durable identity link to auth.users.id. Membership is resolved by this id, never by email.';
comment on column public.org_members.role is
  'Customer role: org_owner | org_admin | org_member | org_viewer (distinct from operator roles).';
comment on table public.org_profiles is
  'One-to-one onboarding/company metadata per organization. onboarding_status stays '
  '''onboarding_required'' until the required data exists.';
comment on table public.org_invitations is
  'Pending, token-based email invitations. Email is an addressing field only; the accepted '
  'membership binds to auth_user_id. org_owner is never issued via invitation (transfer-only).';

-- ============================================================================
-- RLS NOTE
-- Row Level Security is intentionally NOT enabled on org_members / org_profiles /
-- org_invitations in this migration. These tables hold tenant data; until RLS policies
-- keyed off auth.uid() are written AND verified (Phase E), NO real customer access may be
-- enabled. This migration is SCHEMA-ONLY and NOT production-access-ready.
-- ============================================================================

-- ============================================================================
-- ONBOARDING RPC — DEFERRED (not implemented here; see report + design doc).
--
-- complete_customer_onboarding(company_name, website_url, website_count, cms_platform,
--   primary_contact_name, primary_contact_email, support_email) is intentionally NOT created
-- in this migration. A safe implementation is blocked on:
--   1. clients.agency_id: clients requires a NOT NULL agency_id, but no CANONICAL PRODUCTION
--      WSS agency exists. The only agencies row is a DEV-ONLY synthetic seed
--      ('00000000-0000-4000-8000-0000000000a6', explicitly "not a real production agency id").
--      The RPC has no agency_id parameter and cannot safely choose one.
--   2. Required slugs: clients (unique(agency_id, slug)) and sites (unique(client_id, slug))
--      both require NOT NULL slugs that the RPC params do not supply; collision-safe slug
--      generation must be designed + verified, not guessed inside a migration.
--   3. RLS is not enabled: a security-definer write path for customer orgs is premature before
--      policies exist, and customer access is not to be enabled in this task.
-- Resolution path is documented in the Phase-D report and AUTH_CUSTOMER_IDENTITY_DESIGN.md.
-- ============================================================================
