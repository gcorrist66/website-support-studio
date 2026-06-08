-- Phase E — Row Level Security (the security gate before any customer access).
--
-- Implements AUTH_RLS_DESIGN_PHASE_E.md: deny-by-default RLS on every tenant table, two
-- authorization domains keyed ONLY on auth.uid() (never email), recursion-safe via SECURITY
-- DEFINER helpers, and internal operator-only tables hidden from customers.
--
-- This migration does NOT change production flags, enable OAuth, or grant any access by itself
-- beyond what auth.uid()-scoped membership allows. service_role (BYPASSRLS) and SECURITY DEFINER
-- RPCs remain the privileged server/RPC write paths. APPLY TO DEV FIRST AND VERIFY (see
-- supabase/tests/phase_e_rls_verification.sql) BEFORE production.
--
-- NOTE: enabling RLS makes the anon read path (src/data/readOnlyTicketData.ts 'supabase-dev-
-- readonly') return zero rows by design. Dev validation that used the anon key must move to
-- seeded-auth/service-role. That app change is intentionally out of scope here.

-- ============================================================================
-- 1. Helper functions (SECURITY DEFINER, STABLE, pinned search_path).
--    They read org_members/operators as owner (BYPASSRLS), so policies that use them never
--    recurse into the same table's RLS. Authorization key is always auth.uid().
-- ============================================================================
create or replace function public.app_is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.auth_user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.app_is_org_contributor(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.auth_user_id = auth.uid() and m.status = 'active'
      and m.role in ('org_owner', 'org_admin', 'org_member')
  );
$$;

create or replace function public.app_is_org_admin(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.auth_user_id = auth.uid() and m.status = 'active'
      and m.role in ('org_owner', 'org_admin')
  );
$$;

create or replace function public.app_is_org_owner(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = p_org_id and m.auth_user_id = auth.uid() and m.status = 'active'
      and m.role = 'org_owner'
  );
$$;

create or replace function public.app_is_operator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.operators o
    where o.auth_user_id = auth.uid() and o.status = 'active'
  );
$$;

create or replace function public.app_operator_in_agency(p_agency_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.operators o
    where o.auth_user_id = auth.uid() and o.status = 'active' and o.agency_id = p_agency_id
  );
$$;

create or replace function public.app_operator_for_org(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.operators o
    join public.clients c on c.agency_id = o.agency_id
    where c.id = p_org_id and o.auth_user_id = auth.uid() and o.status = 'active'
  );
$$;

revoke all on function
  public.app_is_org_member(uuid), public.app_is_org_contributor(uuid),
  public.app_is_org_admin(uuid), public.app_is_org_owner(uuid),
  public.app_is_operator(), public.app_operator_in_agency(uuid),
  public.app_operator_for_org(uuid)
from public, anon;
grant execute on function
  public.app_is_org_member(uuid), public.app_is_org_contributor(uuid),
  public.app_is_org_admin(uuid), public.app_is_org_owner(uuid),
  public.app_is_operator(), public.app_operator_in_agency(uuid),
  public.app_operator_for_org(uuid)
to authenticated;

-- ============================================================================
-- 2. Column-guard: block tenant-key changes via UPDATE for end users (prevents tenant-hop).
--    service_role and direct DB admin (no JWT role) may re-parent. Short-circuit AND means the
--    client_id/site_id checks never evaluate on tables lacking those columns (e.g. clients).
-- ============================================================================
create or replace function public.app_block_tenant_key_change()
returns trigger language plpgsql as $$
begin
  if auth.role() is not null and auth.role() <> 'service_role' then
    if (new.agency_id is distinct from old.agency_id)
       or (tg_table_name in ('sites', 'tickets', 'ticket_messages') and new.client_id is distinct from old.client_id)
       or (tg_table_name in ('tickets', 'ticket_messages') and new.site_id is distinct from old.site_id) then
      raise exception 'tenant_key_change_forbidden' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists clients_block_tenant_key_change on public.clients;
create trigger clients_block_tenant_key_change before update on public.clients
  for each row execute function public.app_block_tenant_key_change();
drop trigger if exists sites_block_tenant_key_change on public.sites;
create trigger sites_block_tenant_key_change before update on public.sites
  for each row execute function public.app_block_tenant_key_change();
drop trigger if exists tickets_block_tenant_key_change on public.tickets;
create trigger tickets_block_tenant_key_change before update on public.tickets
  for each row execute function public.app_block_tenant_key_change();
drop trigger if exists ticket_messages_block_tenant_key_change on public.ticket_messages;
create trigger ticket_messages_block_tenant_key_change before update on public.ticket_messages
  for each row execute function public.app_block_tenant_key_change();

-- ============================================================================
-- 3. Perf indexes for agency-scoped operator scans.
-- ============================================================================
create index if not exists sites_agency_id_idx on public.sites (agency_id);
create index if not exists tickets_agency_id_idx on public.tickets (agency_id);
create index if not exists tickets_client_id_idx on public.tickets (client_id);

-- ============================================================================
-- 4. Grants: anon gets nothing; authenticated gets DML that RLS then narrows; service_role
--    bypasses RLS. Deny-by-default means no policy = no access even when granted.
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'agencies','clients','sites','tickets','ticket_messages','ticket_communications',
    'ticket_draft_replies','ticket_approvals','ticket_audit_events','operators',
    'org_members','org_profiles','org_invitations','operator_invitations','operator_audit_events'
  ] loop
    execute format('revoke all on public.%I from anon;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;

-- ============================================================================
-- 5. Policies (deny-by-default; only what is listed is allowed). "for all" = select+ins+upd+del.
-- ============================================================================

-- agencies: operator-only read; writes via service.
create policy agencies_operator_select on public.agencies
  for select to authenticated using (app_operator_in_agency(id));

-- clients (= organizations)
create policy clients_customer_select on public.clients
  for select to authenticated using (app_is_org_member(id));
create policy clients_customer_update on public.clients
  for update to authenticated using (app_is_org_admin(id)) with check (app_is_org_admin(id));
create policy clients_operator_select on public.clients
  for select to authenticated using (app_operator_in_agency(agency_id));
create policy clients_operator_insert on public.clients
  for insert to authenticated with check (app_operator_in_agency(agency_id));
create policy clients_operator_update on public.clients
  for update to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- org_profiles
create policy org_profiles_customer_select on public.org_profiles
  for select to authenticated using (app_is_org_member(org_id));
create policy org_profiles_customer_update on public.org_profiles
  for update to authenticated using (app_is_org_admin(org_id)) with check (app_is_org_admin(org_id));
create policy org_profiles_operator_select on public.org_profiles
  for select to authenticated using (app_operator_for_org(org_id));

-- sites
create policy sites_customer_select on public.sites
  for select to authenticated using (app_is_org_member(client_id));
create policy sites_customer_insert on public.sites
  for insert to authenticated with check (app_is_org_admin(client_id));
create policy sites_customer_update on public.sites
  for update to authenticated using (app_is_org_admin(client_id)) with check (app_is_org_admin(client_id));
create policy sites_customer_delete on public.sites
  for delete to authenticated using (app_is_org_admin(client_id));
create policy sites_operator_select on public.sites
  for select to authenticated using (app_operator_in_agency(agency_id));
create policy sites_operator_insert on public.sites
  for insert to authenticated with check (app_operator_in_agency(agency_id));
create policy sites_operator_update on public.sites
  for update to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- tickets: customer read own org + contributor create; updates are operator-only.
create policy tickets_customer_select on public.tickets
  for select to authenticated using (app_is_org_member(client_id));
create policy tickets_customer_insert on public.tickets
  for insert to authenticated with check (app_is_org_contributor(client_id));
create policy tickets_operator_select on public.tickets
  for select to authenticated using (app_operator_in_agency(agency_id));
create policy tickets_operator_insert on public.tickets
  for insert to authenticated with check (app_operator_in_agency(agency_id));
create policy tickets_operator_update on public.tickets
  for update to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- ticket_messages: customer read + contributor create; operators full.
create policy ticket_messages_customer_select on public.ticket_messages
  for select to authenticated using (app_is_org_member(client_id));
create policy ticket_messages_customer_insert on public.ticket_messages
  for insert to authenticated with check (app_is_org_contributor(client_id));
create policy ticket_messages_operator_all on public.ticket_messages
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- ticket_communications: customer read-only (customer-facing sends); operators full.
create policy ticket_communications_customer_select on public.ticket_communications
  for select to authenticated using (app_is_org_member(client_id));
create policy ticket_communications_operator_all on public.ticket_communications
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- ticket_draft_replies: INTERNAL — operators only (NO customer policy → customers denied).
create policy ticket_draft_replies_operator_all on public.ticket_draft_replies
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- ticket_approvals: INTERNAL — operators only.
create policy ticket_approvals_operator_all on public.ticket_approvals
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- ticket_audit_events: INTERNAL/governance — operators only.
create policy ticket_audit_events_operator_select on public.ticket_audit_events
  for select to authenticated using (app_operator_in_agency(agency_id));
create policy ticket_audit_events_operator_insert on public.ticket_audit_events
  for insert to authenticated with check (app_operator_in_agency(agency_id));

-- operators: operator sees colleagues in their agency; writes via RPC/service.
create policy operators_operator_select on public.operators
  for select to authenticated using (app_operator_in_agency(agency_id));

-- org_members: customer sees co-members (helper avoids recursion); operator sees org's members.
create policy org_members_customer_select on public.org_members
  for select to authenticated using (app_is_org_member(org_id));
create policy org_members_operator_select on public.org_members
  for select to authenticated using (app_operator_for_org(org_id));

-- org_profiles operator already covered above.

-- org_invitations: org admins see pending invites; operators see org's invites.
create policy org_invitations_customer_select on public.org_invitations
  for select to authenticated using (app_is_org_admin(org_id));
create policy org_invitations_operator_select on public.org_invitations
  for select to authenticated using (app_operator_for_org(org_id));

-- operator_invitations: agency operators read; writes via RPC/service.
create policy operator_invitations_operator_select on public.operator_invitations
  for select to authenticated using (app_operator_in_agency(agency_id));

-- operator_audit_events: INTERNAL — agency operators read; writes via RPC/service.
create policy operator_audit_events_operator_select on public.operator_audit_events
  for select to authenticated using (app_operator_in_agency(agency_id));

-- ============================================================================
-- RLS is now ENABLED on all tenant tables. No customer/operator can read or write outside their
-- auth.uid()-scoped membership. Internal tables (draft_replies/approvals/audit) have NO customer
-- policy and are therefore invisible to customers. Verify on dev before any production enablement.
-- ============================================================================
