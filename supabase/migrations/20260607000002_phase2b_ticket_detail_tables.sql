-- Phase 2B ticket detail persistence slice.
-- Scope: detail/auditability tables only, no email provider behavior, no external send actions.

create type public.message_direction as enum (
  'inbound',
  'outbound'
);

create type public.draft_reply_status as enum (
  'drafting',
  'ready_for_approval',
  'superseded',
  'sent'
);

create type public.approval_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.communication_status as enum (
  'pending',
  'sent',
  'failed',
  'blocked'
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  site_id uuid not null,
  ticket_id text not null,
  author_id text not null,
  author_role public.actor_role not null,
  message_body text not null,
  message_direction public.message_direction not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ticket_messages_ticket_fkey foreign key (ticket_id) references public.tickets (id) on delete cascade,
  constraint ticket_messages_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint ticket_messages_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint ticket_messages_site_fkey foreign key (site_id) references public.sites (id) on delete cascade
);

create table if not exists public.ticket_draft_replies (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  site_id uuid not null,
  ticket_id text not null,
  drafted_by text not null,
  draft_body text not null,
  status public.draft_reply_status not null default 'drafting',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ticket_draft_replies_ticket_fkey foreign key (ticket_id) references public.tickets (id) on delete cascade,
  constraint ticket_draft_replies_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint ticket_draft_replies_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint ticket_draft_replies_site_fkey foreign key (site_id) references public.sites (id) on delete cascade
);

create table if not exists public.ticket_approvals (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  site_id uuid not null,
  ticket_id text not null,
  draft_reply_id uuid,
  requested_by text not null,
  approver_id text,
  approver_role public.actor_role not null,
  status public.approval_status not null default 'pending',
  decision_note text,
  requested_at timestamptz not null default timezone('utc', now()),
  decided_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ticket_approvals_ticket_fkey foreign key (ticket_id) references public.tickets (id) on delete cascade,
  constraint ticket_approvals_draft_reply_fkey foreign key (draft_reply_id) references public.ticket_draft_replies (id) on delete set null,
  constraint ticket_approvals_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint ticket_approvals_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint ticket_approvals_site_fkey foreign key (site_id) references public.sites (id) on delete cascade
);

create table if not exists public.ticket_communications (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  site_id uuid not null,
  ticket_id text not null,
  draft_reply_id uuid,
  approval_id uuid,
  recipient_email text not null,
  subject text,
  body text not null,
  delivery_status public.communication_status not null default 'pending',
  external_provider text,
  external_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint ticket_communications_ticket_fkey foreign key (ticket_id) references public.tickets (id) on delete cascade,
  constraint ticket_communications_draft_reply_fkey foreign key (draft_reply_id) references public.ticket_draft_replies (id) on delete set null,
  constraint ticket_communications_approval_fkey foreign key (approval_id) references public.ticket_approvals (id) on delete set null,
  constraint ticket_communications_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint ticket_communications_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint ticket_communications_site_fkey foreign key (site_id) references public.sites (id) on delete cascade,
  constraint ticket_communications_requires_approval_record check (
    approval_id is not null
  ),
  constraint ticket_communications_no_autonomous_send check (
    delivery_status <> 'sent' or approval_id is not null
  )
);

create index if not exists ticket_messages_ticket_id_idx on public.ticket_messages (ticket_id);
create index if not exists ticket_messages_site_id_idx on public.ticket_messages (site_id);
create index if not exists ticket_messages_created_at_idx on public.ticket_messages (created_at desc);

create index if not exists ticket_draft_replies_ticket_id_idx on public.ticket_draft_replies (ticket_id);
create index if not exists ticket_draft_replies_site_id_idx on public.ticket_draft_replies (site_id);
create index if not exists ticket_draft_replies_status_idx on public.ticket_draft_replies (status);

create index if not exists ticket_approvals_ticket_id_idx on public.ticket_approvals (ticket_id);
create index if not exists ticket_approvals_draft_reply_id_idx on public.ticket_approvals (draft_reply_id);
create index if not exists ticket_approvals_status_idx on public.ticket_approvals (status);

create index if not exists ticket_communications_ticket_id_idx on public.ticket_communications (ticket_id);
create index if not exists ticket_communications_approval_id_idx on public.ticket_communications (approval_id);
create index if not exists ticket_communications_status_idx on public.ticket_communications (delivery_status);

comment on table public.ticket_messages is 'Inbound and outbound ticket message records for history and triage traceability.';
comment on table public.ticket_draft_replies is 'Draft reply bodies under Gary approval workflow control.';
comment on table public.ticket_approvals is 'Approval decisions captured explicitly after review; autonomous approval is not possible in this phase.';
comment on table public.ticket_communications is 'Communication records are persistence placeholders only and must only be created after explicit approval. No provider integrations in this phase.';

comment on column public.ticket_communications.delivery_status is 'Future sync from provider outcomes; status remains local/pending in Phase 2 persistence foundation.';

create or replace trigger ticket_draft_replies_timestamps_before_update
before update on public.ticket_draft_replies
for each row
execute function public.touch_updated_at();

create or replace trigger ticket_approvals_timestamps_before_update
before update on public.ticket_approvals
for each row
execute function public.touch_updated_at();

create or replace trigger ticket_communications_timestamps_before_update
before update on public.ticket_communications
for each row
execute function public.touch_updated_at();

-- Phase 2B comments for future behavior:
-- - communication rows are written after approval intent exists.
-- - there is no external provider send action in schema/plumbing.
-- - integration with SendGrid/Resend/Postmark is intentionally deferred to later phase.
