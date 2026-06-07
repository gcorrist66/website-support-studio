-- Phase 2A Supabase persistence slice: agencies, clients, sites, tickets, ticket_audit_events
-- Scope-limited migration: no ticket_messages, ticket_draft_replies, ticket_approvals, or ticket_communications.
-- Future search/card-search compatibility goals:
-- - global card search: (status, priority, search_text tsquery over ticket_id/site_id/metadata)
-- - project/site-scoped search: by site_id and status/priority
-- - status/priority/client/site filters: indexed on (site_id,status,priority) and (ticket_id,status,priority)

create type if not exists public.ticket_status as enum (
  'received',
  'triaged',
  'reply_drafted',
  'awaiting_gary_approval',
  'approved_to_send',
  'sent_to_customer',
  'closed',
  'blocked'
);

create type if not exists public.ticket_priority as enum (
  'low',
  'normal',
  'high',
  'critical'
);

create type if not exists public.identity_confidence as enum (
  'known',
  'claimed',
  'unknown'
);

create type if not exists public.actor_role as enum (
  'agency_admin',
  'client_admin',
  'site_user',
  'cs_agent',
  'gary_approver',
  'system'
);

create type if not exists public.blocked_reason as enum (
  'awaiting_customer',
  'awaiting_access',
  'awaiting_vendor',
  'duplicate_ticket',
  'misrouted',
  'internal_review',
  'other'
);

create type if not exists public.audit_event_type as enum (
  'request_received',
  'ticket_created',
  'ticket_triaged',
  'initial_classification_attempt',
  'triage_completed',
  'classification_recorded',
  'routing_decision_recorded',
  'reply_drafted',
  'draft_snapshot_stored',
  'approval_requested',
  'approval_gate_entered',
  'approval_waiting_timepoint',
  'approval_granted',
  'approval_rejected',
  'approved_reply_frozen',
  'approval_context_recorded',
  'response_sent',
  'reply_sent',
  'customer_communication_confirmation',
  'sent_message_hash_or_reference',
  'ticket_blocked',
  'ticket_unblocked',
  'ticket_closed',
  'closure_note_recorded',
  'final_state_hash_snapshot',
  'blocked_entered',
  'blocker_recorded',
  'action_requested'
);

create extension if not exists pgcrypto;

create table if not exists public.agencies (
  agency_id uuid primary key default gen_random_uuid(),
  agency_name text not null,
  policy_profile text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  client_id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clients_agency_fkey foreign key (agency_id) references public.agencies (agency_id) on delete cascade
);

create table if not exists public.sites (
  site_id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  site_name text not null,
  canonical_domain text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sites_client_fkey foreign key (client_id) references public.clients (client_id) on delete cascade
);

create table if not exists public.tickets (
  ticket_id text not null primary key,
  site_id uuid not null,
  submitter_id uuid,
  status public.ticket_status not null default 'received',
  priority public.ticket_priority not null default 'normal',
  identity_confidence public.identity_confidence not null default 'unknown',
  current_actor_role public.actor_role not null default 'system',
  current_blocked_reason public.blocked_reason,
  blocked_context jsonb,
  blocked_at timestamptz,
  closure_note text,
  closed_at timestamptz,
  search_vector tsvector,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tickets_site_fkey foreign key (site_id) references public.sites (site_id) on delete cascade,
  constraint tickets_current_blocked_reason_requires_context check (
    current_blocked_reason is null or blocked_context is not null
  ),
  constraint tickets_status_blocked_context check (
    current_blocked_reason is not null or blocked_context is null
  )
);

create table if not exists public.ticket_audit_events (
  audit_id uuid not null primary key default gen_random_uuid(),
  ticket_id text not null,
  actor_id text not null,
  event_type public.audit_event_type not null,
  actor_role public.actor_role not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  actor_reference text,
  occurred_at timestamptz not null default timezone('utc', now()),
  state_before public.ticket_status,
  state_after public.ticket_status not null,
  rationale text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ticket_audit_events_ticket_fkey foreign key (ticket_id) references public.tickets (ticket_id) on delete cascade
);

create index if not exists agencies_created_at_idx on public.agencies (created_at);
create index if not exists clients_agency_id_idx on public.clients (agency_id);
create index if not exists clients_created_at_idx on public.clients (created_at);
create index if not exists sites_client_id_idx on public.sites (client_id);
create index if not exists sites_created_at_idx on public.sites (created_at);
create index if not exists tickets_site_id_status_priority_idx on public.tickets (site_id, status, priority);
create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_priority_idx on public.tickets (priority);
create index if not exists tickets_updated_at_idx on public.tickets (updated_at);
create index if not exists ticket_audit_events_ticket_id_occured_idx on public.ticket_audit_events (ticket_id, occurred_at);
create index if not exists ticket_audit_events_event_type_occured_idx on public.ticket_audit_events (event_type, occurred_at);
create index if not exists ticket_audit_events_actor_role_idx on public.ticket_audit_events (actor_role, occurred_at);

create index if not exists tickets_search_vector_idx on public.tickets using gin (search_vector);
create index if not exists tickets_client_site_status_priority_idx on public.tickets (site_id, status, priority);

-- Future compatibility: site-scoped ticket search uses tickets_site_id_status_priority_idx.
-- Global card search can use (search_vector) plus (site_id,status,priority) filters.
-- Project-wide filter path remains open via join to sites/clients/agencies using these FK indexes.

create or replace function public.update_tickets_search_vector()
returns trigger as $$
begin
  new.search_vector := to_tsvector('simple', coalesce(new.ticket_id, '') || ' ' || coalesce(new.status::text, '') || ' ' || coalesce(new.priority::text, ''));
  return new;
end;
$$ language plpgsql;

create or replace trigger tickets_search_vector_set
before insert or update on public.tickets
for each row
execute function public.update_tickets_search_vector();

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger agencies_timestamps_before_update
before update on public.agencies
for each row
execute function public.touch_updated_at();

create trigger clients_timestamps_before_update
before update on public.clients
for each row
execute function public.touch_updated_at();

create trigger sites_timestamps_before_update
before update on public.sites
for each row
execute function public.touch_updated_at();

create trigger tickets_timestamps_before_update
before update on public.tickets
for each row
execute function public.touch_updated_at();

create trigger ticket_audit_events_timestamps_before_update
before update on public.ticket_audit_events
for each row
execute function public.touch_updated_at();
