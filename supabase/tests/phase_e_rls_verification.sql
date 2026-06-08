-- Phase E RLS verification — runnable, NON-DESTRUCTIVE (BEGIN/ROLLBACK) test harness.
--
-- Run on the DEV project only (e.g. `psql "$WSS_DEV_DB_URL" -v ON_ERROR_STOP=1 -f this.sql`)
-- AFTER applying all migrations through 20260608210000_phase_e_rls.sql. It seeds two agencies,
-- two customer orgs under agency 1, one org under agency 2, operators, and customers
-- (owner/admin/member/viewer), then asserts isolation by switching `role` + auth.uid() claims.
-- Every assertion RAISES on failure; the whole thing rolls back so nothing persists.
--
-- It exercises RLS as the real `authenticated`/`anon`/`service_role` roles (RLS does not apply to
-- the superuser running the file, hence the explicit `set local role`). auth.uid()/auth.role()
-- are driven via request.jwt.claims.

begin;

-- ---- Fixed test UUIDs ------------------------------------------------------
-- auth users
--   op1   = 11111111-1111-4111-8111-111111111111   (operator, agency 1, agency_admin)
--   op2   = 22222222-2222-4222-8222-222222222222   (operator, agency 2)
--   ownerA= aaaaaaa1-1111-4111-8111-111111111111   (org A owner)
--   memberA=aaaaaaa2-2222-4222-8222-222222222222   (org A member)
--   viewerA=aaaaaaa3-3333-4333-8333-333333333333   (org A viewer)
--   ownerB= bbbbbbb1-1111-4111-8111-111111111111   (org B owner)

-- ---- Seed auth.users (only `id` is NOT NULL without default on this project) ----
insert into auth.users (id, email) values
 ('11111111-1111-4111-8111-111111111111','op1@wss-dev.test'),
 ('22222222-2222-4222-8222-222222222222','op2@wss-dev.test'),
 ('aaaaaaa1-1111-4111-8111-111111111111','ownerA@wss-dev.test'),
 ('aaaaaaa2-2222-4222-8222-222222222222','memberA@wss-dev.test'),
 ('aaaaaaa3-3333-4333-8333-333333333333','viewerA@wss-dev.test'),
 ('bbbbbbb1-1111-4111-8111-111111111111','ownerB@wss-dev.test');

-- ---- Seed tenant data ------------------------------------------------------
insert into public.agencies (id, name, slug) values
 ('a0000000-0000-4000-8000-000000000001','Test Agency 1','test-agency-1'),
 ('a0000000-0000-4000-8000-000000000002','Test Agency 2','test-agency-2');

insert into public.clients (id, agency_id, name, slug) values
 ('c0000000-0000-4000-8000-00000000000a','a0000000-0000-4000-8000-000000000001','Org A','org-a'),
 ('c0000000-0000-4000-8000-00000000000b','a0000000-0000-4000-8000-000000000001','Org B','org-b'),
 ('c0000000-0000-4000-8000-00000000000c','a0000000-0000-4000-8000-000000000002','Org C','org-c');

insert into public.sites (id, agency_id, client_id, name, url, slug) values
 ('51700000-0000-4000-8000-00000000000a','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','Site A','https://a.example.com','site-a'),
 ('51700000-0000-4000-8000-00000000000b','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000b','Site B','https://b.example.com','site-b'),
 ('51700000-0000-4000-8000-00000000000c','a0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-00000000000c','Site C','https://c.example.com','site-c');

insert into public.tickets (id, agency_id, client_id, site_id, ticket_number, title) values
 ('TKT-A','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','51700000-0000-4000-8000-00000000000a','A-1','Ticket A'),
 ('TKT-B','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000b','51700000-0000-4000-8000-00000000000b','B-1','Ticket B'),
 ('TKT-C','a0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-00000000000c','51700000-0000-4000-8000-00000000000c','C-1','Ticket C');

-- Internal + customer-facing child rows for Ticket A (org A / agency 1).
-- Column sets match the live phase 2A/2B schema (author/actor are text; roles/dir/event are enums).
insert into public.ticket_messages (agency_id, client_id, site_id, ticket_id, author_id, author_role, message_body, message_direction)
 values ('a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','51700000-0000-4000-8000-00000000000a','TKT-A','seed-op','cs_agent','hello','inbound');
insert into public.ticket_draft_replies (agency_id, client_id, site_id, ticket_id, drafted_by, draft_body)
 values ('a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','51700000-0000-4000-8000-00000000000a','TKT-A','seed-op','internal draft');
insert into public.ticket_approvals (agency_id, client_id, site_id, ticket_id, requested_by, approver_role)
 values ('a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','51700000-0000-4000-8000-00000000000a','TKT-A','seed-op','gary_approver');
insert into public.ticket_audit_events (agency_id, client_id, site_id, ticket_id, actor_id, actor_role, event_type, summary)
 values ('a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','51700000-0000-4000-8000-00000000000a','TKT-A','seed-op','system','ticket_created','seed audit');

-- Operators linked to auth users
insert into public.operators (auth_user_id, agency_id, email, display_name, role, status) values
 ('11111111-1111-4111-8111-111111111111','a0000000-0000-4000-8000-000000000001','op1@wss-dev.test','Op One','agency_admin','active'),
 ('22222222-2222-4222-8222-222222222222','a0000000-0000-4000-8000-000000000002','op2@wss-dev.test','Op Two','agency_admin','active');

-- Customers (org members)
insert into public.org_members (org_id, auth_user_id, role, status) values
 ('c0000000-0000-4000-8000-00000000000a','aaaaaaa1-1111-4111-8111-111111111111','org_owner','active'),
 ('c0000000-0000-4000-8000-00000000000a','aaaaaaa2-2222-4222-8222-222222222222','org_member','active'),
 ('c0000000-0000-4000-8000-00000000000a','aaaaaaa3-3333-4333-8333-333333333333','org_viewer','active'),
 ('c0000000-0000-4000-8000-00000000000b','bbbbbbb1-1111-4111-8111-111111111111','org_owner','active');

-- Helper to set the acting identity (role + auth.uid()/auth.role() via JWT claims).
create or replace function pg_temp.act_as(p_db_role text, p_uid text)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  execute format('set local role %I', p_db_role);
end $$;

-- ====================================================================================
-- SCENARIOS
-- ====================================================================================

-- (1) anon sees nothing. (anon is revoked at the grant level AND has no policy, so either a
--     privilege denial or a 0-row result counts as "sees nothing".)
select pg_temp.act_as('anon', '00000000-0000-0000-0000-000000000000');
do $$ declare n int; begin
  begin
    select count(*) into n from public.tickets;
    if n <> 0 then raise exception 'FAIL 1: anon sees tickets'; end if;
  exception when insufficient_privilege then null; end;
  begin
    select count(*) into n from public.clients;
    if n <> 0 then raise exception 'FAIL 1: anon sees clients'; end if;
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- (2)/(3) customer A sees only org A; cannot see customer B.
select pg_temp.act_as('authenticated', 'aaaaaaa1-1111-4111-8111-111111111111');
do $$ begin
  if (select count(*) from public.tickets) <> 1 then raise exception 'FAIL 2: ownerA ticket count <> 1'; end if;
  if exists (select 1 from public.tickets where id = 'TKT-B') then raise exception 'FAIL 3: ownerA can see org B ticket'; end if;
  if exists (select 1 from public.clients where id = 'c0000000-0000-4000-8000-00000000000b') then raise exception 'FAIL 3: ownerA can see org B client'; end if;
end $$;
reset role;

-- (4) org_viewer cannot write (insert ticket denied).
select pg_temp.act_as('authenticated', 'aaaaaaa3-3333-4333-8333-333333333333');
do $$ declare ok boolean := false; begin
  begin
    insert into public.tickets (id, agency_id, client_id, site_id, ticket_number, title)
    values ('TKT-VIEWER','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','51700000-0000-4000-8000-00000000000a','V-1','nope');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL 4: org_viewer was able to insert a ticket'; end if;
end $$;
reset role;

-- (5) org_member can create ticket in own org, NOT another org.
select pg_temp.act_as('authenticated', 'aaaaaaa2-2222-4222-8222-222222222222');
do $$ declare blocked boolean := false; begin
  insert into public.tickets (id, agency_id, client_id, site_id, ticket_number, title)
  values ('TKT-A2','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000a','51700000-0000-4000-8000-00000000000a','A-2','member own org');
  begin
    insert into public.tickets (id, agency_id, client_id, site_id, ticket_number, title)
    values ('TKT-B2','a0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-00000000000b','51700000-0000-4000-8000-00000000000b','B-2','member other org');
  exception when others then blocked := true; end;
  if not blocked then raise exception 'FAIL 5: org_member inserted into another org'; end if;
end $$;
reset role;

-- (6) customer cannot read internal tables.
select pg_temp.act_as('authenticated', 'aaaaaaa1-1111-4111-8111-111111111111');
do $$ begin
  if (select count(*) from public.ticket_draft_replies) <> 0 then raise exception 'FAIL 6: customer read ticket_draft_replies'; end if;
  if (select count(*) from public.ticket_approvals) <> 0 then raise exception 'FAIL 6: customer read ticket_approvals'; end if;
  if (select count(*) from public.ticket_audit_events) <> 0 then raise exception 'FAIL 6: customer read ticket_audit_events'; end if;
  -- but customer-facing children are visible:
  if (select count(*) from public.ticket_messages) < 1 then raise exception 'FAIL 6: customer cannot read own ticket_messages'; end if;
end $$;
reset role;

-- (7)/(8) operator sees agency-scoped tickets, not another agency.
select pg_temp.act_as('authenticated', '11111111-1111-4111-8111-111111111111');
do $$ begin
  if (select count(*) from public.tickets where agency_id = 'a0000000-0000-4000-8000-000000000001') < 2
     then raise exception 'FAIL 7: operator cannot see both agency-1 tickets'; end if;
  if exists (select 1 from public.tickets where id = 'TKT-C') then raise exception 'FAIL 8: operator sees another agency ticket'; end if;
  -- operator CAN read internal tables within their agency:
  if (select count(*) from public.ticket_draft_replies) < 1 then raise exception 'FAIL 7: operator cannot read agency draft replies'; end if;
end $$;
reset role;

-- (10) tenant-hop UPDATE is blocked (operator attempts to move Ticket A to org B).
select pg_temp.act_as('authenticated', '11111111-1111-4111-8111-111111111111');
do $$ declare blocked boolean := false; begin
  begin
    update public.tickets set client_id = 'c0000000-0000-4000-8000-00000000000b' where id = 'TKT-A';
  exception when others then blocked := true; end;
  if not blocked then raise exception 'FAIL 10: tenant-hop UPDATE was allowed'; end if;
end $$;
reset role;

-- (9) service_role / RPC paths still work (BYPASSRLS sees everything).
set local role service_role;
do $$ begin
  if (select count(*) from public.tickets) < 3 then raise exception 'FAIL 9: service_role cannot see all tickets'; end if;
end $$;
reset role;

-- All assertions passed if we reach here.
do $$ begin raise notice 'PHASE E RLS VERIFICATION: ALL SCENARIOS PASSED'; end $$;

rollback;  -- non-destructive: nothing is persisted.
