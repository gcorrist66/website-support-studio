-- Phase 2A core persistence slice.
-- Scope: first Supabase foundation slice (no API/UI/auth behavior, no production deployment).

create extension if not exists pgcrypto;

create type public.ticket_status as enum (
  'received',
  'triaged',
  'reply_drafted',
  'awaiting_gary_approval',
  'approved_to_send',
  'sent_to_customer',
  'closed',
  'blocked'
);

create type public.ticket_priority as enum (
  'low',
  'normal',
  'high',
  'critical'
);

create type public.identity_confidence as enum (
  'known',
  'claimed',
  'unknown'
);

create type public.blocked_reason as enum (
  'awaiting_customer',
  'awaiting_access',
  'awaiting_vendor',
  'duplicate_ticket',
  'misrouted',
  'internal_review',
  'other'
);

create type public.actor_role as enum (
  'agency_admin',
  'client_admin',
  'site_user',
  'cs_agent',
  'gary_approver',
  'system'
);

create type public.audit_event_type as enum (
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

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  name text not null,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint clients_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint clients_slug_per_agency unique (agency_id, slug)
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  name text not null,
  url text,
  slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sites_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint sites_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint sites_slug_per_client unique (client_id, slug)
);

create table if not exists public.tickets (
  id text primary key,
  agency_id uuid not null,
  client_id uuid not null,
  site_id uuid not null,
  ticket_number text not null,
  title text not null,
  description text,
  status public.ticket_status not null default 'received',
  priority public.ticket_priority not null default 'normal',
  identity_confidence public.identity_confidence not null default 'unknown',
  submitter_name text,
  submitter_email text,
  blocked_reason public.blocked_reason,
  blocked_from_status public.ticket_status,
  blocked_notes text,
  closure_note text,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tickets_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint tickets_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint tickets_site_fkey foreign key (site_id) references public.sites (id) on delete cascade,
  constraint tickets_blocked_reason_or_null check (
    blocked_reason is null or blocked_from_status is not null
  )
);

create table if not exists public.ticket_audit_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  site_id uuid not null,
  ticket_id text not null,
  actor_id text not null,
  actor_role public.actor_role not null,
  event_type public.audit_event_type not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ticket_audit_events_ticket_fkey foreign key (ticket_id) references public.tickets (id) on delete cascade,
  constraint ticket_audit_events_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint ticket_audit_events_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint ticket_audit_events_site_fkey foreign key (site_id) references public.sites (id) on delete cascade
);

-- Tenant lookup indexes
create index if not exists tickets_agency_id_idx on public.tickets (agency_id);
create index if not exists tickets_client_id_idx on public.tickets (client_id);
create index if not exists tickets_site_id_idx on public.tickets (site_id);
create index if not exists ticket_audit_events_ticket_id_idx on public.ticket_audit_events (ticket_id);
create index if not exists ticket_audit_events_agency_id_idx on public.ticket_audit_events (agency_id);
create index if not exists ticket_audit_events_client_id_idx on public.ticket_audit_events (client_id);
create index if not exists ticket_audit_events_site_id_idx on public.ticket_audit_events (site_id);

-- Ticket search / card search indexes
create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_priority_idx on public.tickets (priority);
create index if not exists tickets_created_at_idx on public.tickets (created_at desc);
create index if not exists tickets_ticket_number_idx on public.tickets (ticket_number);
create index if not exists tickets_client_site_status_priority_idx on public.tickets (client_id, site_id, status, priority);
create index if not exists ticket_audit_events_event_type_idx on public.ticket_audit_events (event_type, occurred_at desc);

-- Optional: future full-text/card search index strategy.
-- Future global card search should combine tenant scope + status/priority filters.
-- Example query pattern: project/site-scoped filter via site_id + client_id and status + priority filters with search on title/description.
create index if not exists tickets_fulltext_idx on public.tickets using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

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
