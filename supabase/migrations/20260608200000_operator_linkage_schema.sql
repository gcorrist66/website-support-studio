-- Phase (operator linkage) — schema: auth.users FK, operator_invitations, operator_audit_events.
--
-- Implements AUTH_OPERATOR_LINKAGE_PLAN.md §5 (schema changes). Binds operators to Supabase
-- Auth by auth_user_id only. Does NOT enable RLS, customer access, production OAuth, or flags,
-- and does NOT modify the onboarding RPC or the customer identity model.
--
-- Additive only. Apply to the WSS DEV project first. RLS remains a later, separately-gated phase.

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. FK: operators.auth_user_id -> auth.users(id) ON DELETE SET NULL.
--    (The column + partial-unique-when-not-null index already exist from Phase 6C.)
--    Added via guard so the migration is idempotent.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'operators_auth_user_fkey'
      and conrelid = 'public.operators'::regclass
  ) then
    alter table public.operators
      add constraint operators_auth_user_fkey
      foreign key (auth_user_id) references auth.users (id) on delete set null;
  end if;
end
$$;

-- ============================================================================
-- 2. operator_invitations — token-based staff invitations (parallel to org_invitations).
--    Email is an addressing field only; acceptance binds by auth_user_id (never email auth).
--    Each invite targets a pre-created, invited operator row; role comes from that row and is
--    never elevated at accept time.
-- ============================================================================
create table if not exists public.operator_invitations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  operator_id uuid not null,
  email text not null,
  role public.operator_role not null,
  token_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by_auth_user_id uuid,
  accepted_by_auth_user_id uuid,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint operator_invitations_agency_fkey foreign key (agency_id)
    references public.agencies (id) on delete cascade,
  constraint operator_invitations_operator_fkey foreign key (operator_id)
    references public.operators (id) on delete cascade,
  constraint operator_invitations_invited_by_fkey foreign key (invited_by_auth_user_id)
    references auth.users (id) on delete set null,
  constraint operator_invitations_accepted_by_fkey foreign key (accepted_by_auth_user_id)
    references auth.users (id) on delete set null
);

create index if not exists operator_invitations_agency_id_idx on public.operator_invitations (agency_id);
create index if not exists operator_invitations_operator_id_idx on public.operator_invitations (operator_id);
create index if not exists operator_invitations_email_lower_idx on public.operator_invitations (lower(email));
create unique index if not exists operator_invitations_token_hash_idx on public.operator_invitations (token_hash);

drop trigger if exists operator_invitations_timestamps_before_update on public.operator_invitations;
create trigger operator_invitations_timestamps_before_update
before update on public.operator_invitations
for each row
execute function public.touch_updated_at();

-- ============================================================================
-- 3. operator_audit_events — append-only audit of identity actions (auditable invariant).
-- ============================================================================
create table if not exists public.operator_audit_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid,
  operator_id uuid,
  event_type text not null
    check (event_type in ('bootstrapped', 'invited', 'accepted', 'revoked', 'linked', 'unlinked')),
  actor_auth_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint operator_audit_events_agency_fkey foreign key (agency_id)
    references public.agencies (id) on delete set null,
  constraint operator_audit_events_operator_fkey foreign key (operator_id)
    references public.operators (id) on delete set null,
  constraint operator_audit_events_actor_fkey foreign key (actor_auth_user_id)
    references auth.users (id) on delete set null
);

create index if not exists operator_audit_events_operator_id_idx on public.operator_audit_events (operator_id);
create index if not exists operator_audit_events_agency_id_idx on public.operator_audit_events (agency_id);
create index if not exists operator_audit_events_created_at_idx on public.operator_audit_events (created_at);

-- Documentation
comment on table public.operator_invitations is
  'Token-based operator (staff) invitations. Email is addressing only; acceptance binds the '
  'pre-created operator row to auth_user_id. Role/agency are never elevated at accept.';
comment on table public.operator_audit_events is
  'Append-only audit trail of operator identity actions (bootstrap/invite/accept/revoke/link/unlink).';

-- RLS NOTE: Row Level Security is intentionally NOT enabled on operator_invitations or
-- operator_audit_events in this migration. RLS for the operator + customer domains is the
-- next, separately-gated phase (Phase E) and must be written AND verified before any access.
