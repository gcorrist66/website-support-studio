-- Phase E (follow-up) — Idempotent, RE-RUNNABLE Phase E RLS policy (re)application.
--
-- WHY: the original RLS migration (20260608210000) uses CREATE POLICY without IF NOT EXISTS, so
-- it cannot be re-applied. This migration is the CANONICAL, re-runnable definition of the Phase E
-- policy set: it drops-if-exists then recreates every policy and re-asserts ENABLE/FORCE RLS.
-- Running it any number of times converges to the same state. Use it to (re)establish or recover
-- the policy layer (see AUTH_PRODUCTION_ROLLOUT.md). Helper functions and column-guard triggers
-- live in 20260608210000 (already idempotent via CREATE OR REPLACE) and are unchanged here.
--
-- Does NOT enable OAuth, change feature flags, or alter customer/operator data. Safe to re-run.

-- Re-assert RLS enable + force (idempotent).
do $$
declare t text;
begin
  foreach t in array array[
    'agencies','clients','sites','tickets','ticket_messages','ticket_communications','ticket_draft_replies','ticket_approvals','ticket_audit_events','operators','org_members','org_profiles','org_invitations','operator_invitations','operator_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;

-- (Re)create every policy idempotently (drop-if-exists then create).
drop policy if exists agencies_operator_select on public.agencies;
create policy agencies_operator_select on public.agencies
  for select to authenticated using (app_operator_in_agency(id));

drop policy if exists clients_customer_select on public.clients;
create policy clients_customer_select on public.clients
  for select to authenticated using (app_is_org_member(id));

drop policy if exists clients_customer_update on public.clients;
create policy clients_customer_update on public.clients
  for update to authenticated using (app_is_org_admin(id)) with check (app_is_org_admin(id));

drop policy if exists clients_operator_select on public.clients;
create policy clients_operator_select on public.clients
  for select to authenticated using (app_operator_in_agency(agency_id));

drop policy if exists clients_operator_insert on public.clients;
create policy clients_operator_insert on public.clients
  for insert to authenticated with check (app_operator_in_agency(agency_id));

drop policy if exists clients_operator_update on public.clients;
create policy clients_operator_update on public.clients
  for update to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

drop policy if exists org_profiles_customer_select on public.org_profiles;
create policy org_profiles_customer_select on public.org_profiles
  for select to authenticated using (app_is_org_member(org_id));

drop policy if exists org_profiles_customer_update on public.org_profiles;
create policy org_profiles_customer_update on public.org_profiles
  for update to authenticated using (app_is_org_admin(org_id)) with check (app_is_org_admin(org_id));

drop policy if exists org_profiles_operator_select on public.org_profiles;
create policy org_profiles_operator_select on public.org_profiles
  for select to authenticated using (app_operator_for_org(org_id));

drop policy if exists sites_customer_select on public.sites;
create policy sites_customer_select on public.sites
  for select to authenticated using (app_is_org_member(client_id));

drop policy if exists sites_customer_insert on public.sites;
create policy sites_customer_insert on public.sites
  for insert to authenticated with check (app_is_org_admin(client_id));

drop policy if exists sites_customer_update on public.sites;
create policy sites_customer_update on public.sites
  for update to authenticated using (app_is_org_admin(client_id)) with check (app_is_org_admin(client_id));

drop policy if exists sites_customer_delete on public.sites;
create policy sites_customer_delete on public.sites
  for delete to authenticated using (app_is_org_admin(client_id));

drop policy if exists sites_operator_select on public.sites;
create policy sites_operator_select on public.sites
  for select to authenticated using (app_operator_in_agency(agency_id));

drop policy if exists sites_operator_insert on public.sites;
create policy sites_operator_insert on public.sites
  for insert to authenticated with check (app_operator_in_agency(agency_id));

drop policy if exists sites_operator_update on public.sites;
create policy sites_operator_update on public.sites
  for update to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

drop policy if exists tickets_customer_select on public.tickets;
create policy tickets_customer_select on public.tickets
  for select to authenticated using (app_is_org_member(client_id));

drop policy if exists tickets_customer_insert on public.tickets;
create policy tickets_customer_insert on public.tickets
  for insert to authenticated with check (app_is_org_contributor(client_id));

drop policy if exists tickets_operator_select on public.tickets;
create policy tickets_operator_select on public.tickets
  for select to authenticated using (app_operator_in_agency(agency_id));

drop policy if exists tickets_operator_insert on public.tickets;
create policy tickets_operator_insert on public.tickets
  for insert to authenticated with check (app_operator_in_agency(agency_id));

drop policy if exists tickets_operator_update on public.tickets;
create policy tickets_operator_update on public.tickets
  for update to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

drop policy if exists ticket_messages_customer_select on public.ticket_messages;
create policy ticket_messages_customer_select on public.ticket_messages
  for select to authenticated using (app_is_org_member(client_id));

drop policy if exists ticket_messages_customer_insert on public.ticket_messages;
create policy ticket_messages_customer_insert on public.ticket_messages
  for insert to authenticated with check (app_is_org_contributor(client_id));

drop policy if exists ticket_messages_operator_all on public.ticket_messages;
create policy ticket_messages_operator_all on public.ticket_messages
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

drop policy if exists ticket_communications_customer_select on public.ticket_communications;
create policy ticket_communications_customer_select on public.ticket_communications
  for select to authenticated using (app_is_org_member(client_id));

drop policy if exists ticket_communications_operator_all on public.ticket_communications;
create policy ticket_communications_operator_all on public.ticket_communications
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

drop policy if exists ticket_draft_replies_operator_all on public.ticket_draft_replies;
create policy ticket_draft_replies_operator_all on public.ticket_draft_replies
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

drop policy if exists ticket_approvals_operator_all on public.ticket_approvals;
create policy ticket_approvals_operator_all on public.ticket_approvals
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

drop policy if exists ticket_audit_events_operator_select on public.ticket_audit_events;
create policy ticket_audit_events_operator_select on public.ticket_audit_events
  for select to authenticated using (app_operator_in_agency(agency_id));

drop policy if exists ticket_audit_events_operator_insert on public.ticket_audit_events;
create policy ticket_audit_events_operator_insert on public.ticket_audit_events
  for insert to authenticated with check (app_operator_in_agency(agency_id));

drop policy if exists operators_operator_select on public.operators;
create policy operators_operator_select on public.operators
  for select to authenticated using (app_operator_in_agency(agency_id));

drop policy if exists org_members_customer_select on public.org_members;
create policy org_members_customer_select on public.org_members
  for select to authenticated using (app_is_org_member(org_id));

drop policy if exists org_members_operator_select on public.org_members;
create policy org_members_operator_select on public.org_members
  for select to authenticated using (app_operator_for_org(org_id));

drop policy if exists org_invitations_customer_select on public.org_invitations;
create policy org_invitations_customer_select on public.org_invitations
  for select to authenticated using (app_is_org_admin(org_id));

drop policy if exists org_invitations_operator_select on public.org_invitations;
create policy org_invitations_operator_select on public.org_invitations
  for select to authenticated using (app_operator_for_org(org_id));

drop policy if exists operator_invitations_operator_select on public.operator_invitations;
create policy operator_invitations_operator_select on public.operator_invitations
  for select to authenticated using (app_operator_in_agency(agency_id));

drop policy if exists operator_audit_events_operator_select on public.operator_audit_events;
create policy operator_audit_events_operator_select on public.operator_audit_events
  for select to authenticated using (app_operator_in_agency(agency_id));

