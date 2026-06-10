-- V2.2 — Project milestones, deliverables, and the request↔project link.  *** DRAFT — NOT APPLIED ***
--
-- Builds on the V2.0 foundation (20260610000000_v2_projects_foundation.sql) which is itself still
-- unapplied on the v2-foundation branch. Apply V2.0 first, then this. Apply to DEV ONLY, in a
-- coordinated window — the Supabase CLI here is linked to PRODUCTION. Do NOT `supabase db push`.
--
-- Scope (exactly four things + the operator write paths that make them usable):
--   1. project_milestones   — the plan/progress steps of a project (operator-managed; customer-read in V2.3)
--   2. project_deliverables — the tangible outputs handed to the customer
--   3. tickets.project_id   — nullable link so a request can belong to a project (orphan = support)
--   4. tickets.request_kind — structured category, replacing the fragile "Product feedback:" title prefix
--
-- Design notes: WSS_V2_2_IMPLEMENTATION_PLAN.md. Safety posture: additive only. The two NEW columns
-- on the live `tickets` table are nullable / defaulted (no row rewrite, no behavior change for existing
-- support flow). Customer-facing RLS for the new project tables is DEFERRED to V2.3 (operator-only here),
-- so this migration adds no new customer surface.

-- ============================================================================
-- 0. Enums (guarded — idempotent for dev re-verification).
-- ============================================================================
do $$ begin
  create type public.milestone_status as enum ('pending', 'in_progress', 'done', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deliverable_kind as enum ('link', 'file', 'note', 'credential');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deliverable_status as enum ('pending', 'delivered', 'accepted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_kind as enum ('support', 'product_feedback', 'bug_report', 'feature_request');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1. project_milestones — ordered progress steps. Tenant keys denormalized (agency_id/client_id)
--    so RLS predicates stay simple, matching the ticket-children pattern.
-- ============================================================================
create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  project_id uuid not null,
  title text not null,
  description text,
  status public.milestone_status not null default 'pending',
  sort_order integer not null default 0,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_milestones_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint project_milestones_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint project_milestones_project_fkey foreign key (project_id) references public.projects (id) on delete cascade
);

create index if not exists project_milestones_project_id_idx on public.project_milestones (project_id);
create index if not exists project_milestones_agency_id_idx on public.project_milestones (agency_id);
create index if not exists project_milestones_order_idx on public.project_milestones (project_id, sort_order);

-- ============================================================================
-- 2. project_deliverables — customer-facing outputs (live URL, files, handoff notes, credentials).
-- ============================================================================
create table if not exists public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,
  project_id uuid not null,
  title text not null,
  kind public.deliverable_kind not null default 'link',
  url text,
  status public.deliverable_status not null default 'pending',
  delivered_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_deliverables_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint project_deliverables_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint project_deliverables_project_fkey foreign key (project_id) references public.projects (id) on delete cascade
);

create index if not exists project_deliverables_project_id_idx on public.project_deliverables (project_id);
create index if not exists project_deliverables_agency_id_idx on public.project_deliverables (agency_id);

-- ============================================================================
-- 3. Dedicated tenant-key guard for project children (NEW function; does not touch shared guards).
--    Blocks end users from re-parenting a milestone/deliverable across tenants or projects.
-- ============================================================================
create or replace function public.app_block_project_child_tenant_key_change()
returns trigger language plpgsql as $$
begin
  if auth.role() is not null and auth.role() <> 'service_role' then
    if (new.agency_id is distinct from old.agency_id)
       or (new.client_id is distinct from old.client_id)
       or (new.project_id is distinct from old.project_id) then
      raise exception 'tenant_key_change_forbidden' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists project_milestones_block_tenant_key_change on public.project_milestones;
create trigger project_milestones_block_tenant_key_change before update on public.project_milestones
  for each row execute function public.app_block_project_child_tenant_key_change();
drop trigger if exists project_deliverables_block_tenant_key_change on public.project_deliverables;
create trigger project_deliverables_block_tenant_key_change before update on public.project_deliverables
  for each row execute function public.app_block_project_child_tenant_key_change();

-- ============================================================================
-- 4. RLS — OPERATOR ONLY (customers denied by default; customer SELECT lands in V2.3 alongside the
--    `projects` customer policy, as one isolation-tested step). Reuses app_operator_in_agency().
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array['project_milestones', 'project_deliverables'] loop
    execute format('revoke all on public.%I from anon;', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;

create policy project_milestones_operator_all on public.project_milestones
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));
create policy project_deliverables_operator_all on public.project_deliverables
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- ----------------------------------------------------------------------------
-- CUSTOMER READ (V2.3): handled by a column-whitelisting SECURITY DEFINER RPC (get_my_projects), NOT by
-- direct customer SELECT policies. The earlier sketch of per-table customer SELECT policies was
-- SUPERSEDED in V2.3 (20260612000000): a row-level customer policy on these tables / on `projects` would
-- also expose intake_notes + stripe ids (RLS filters rows, not columns; customers and operators share the
-- `authenticated` role). => these tables stay OPERATOR-ONLY; customers never read them directly.
-- ----------------------------------------------------------------------------

-- ============================================================================
-- 5. tickets.project_id — nullable link. Orphan (NULL) = ordinary support request (1.5 flow, unchanged).
--    Single-column FK with ON DELETE SET NULL; a same-org trigger enforces tenant alignment (a
--    composite FK can't ON DELETE SET NULL here because client_id is NOT NULL).
-- ============================================================================
alter table public.tickets
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists tickets_project_id_idx on public.tickets (project_id);

create or replace function public.app_tickets_project_same_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.project_id is not null then
    if not exists (
      select 1 from public.projects p where p.id = new.project_id and p.client_id = new.client_id
    ) then
      raise exception 'project_not_in_org' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tickets_project_same_org_check on public.tickets;
create trigger tickets_project_same_org_check
  before insert or update of project_id, client_id on public.tickets
  for each row execute function public.app_tickets_project_same_org();

-- ============================================================================
-- 6. tickets.request_kind — structured category (default 'support', constant default = no row rewrite).
--    Replaces the title-prefix heuristic. App submit path (submit_customer_request / submitCustomerFeedback)
--    is updated in lockstep with the V2.3 app change — see WSS_V2_2_IMPLEMENTATION_PLAN.md §6.
--    RECONCILIATION (2026-06-09): main's later migration 20260614000000_request_attachments.sql has an RPC
--    (submit_customer_request_with_attachments) that WRITES this column. V2.2 is the PRODUCER of request_kind;
--    it MUST be applied before that attachments migration. See WSS_V2_FOUNDATION_PLAN.md Part V. (no logic change)
-- ============================================================================
alter table public.tickets
  add column if not exists request_kind public.request_kind not null default 'support';

create index if not exists tickets_request_kind_idx on public.tickets (request_kind);

-- Optional one-time backfill of historical feedback (idempotent: only touches still-default rows that
-- match the legacy prefix). Coarse — maps every "Product feedback:%" ticket to 'product_feedback'.
update public.tickets
  set request_kind = 'product_feedback'
  where request_kind = 'support' and title like 'Product feedback:%';

-- ============================================================================
-- 7. Operator write paths (SECURITY DEFINER, self-authorizing — same pattern as the V2.0 operator_*
--    RPCs). All resolve the project via app_operator_project_ctx and write a project_audit_event.
-- ============================================================================

-- 7a. Milestones ------------------------------------------------------------
create or replace function public.operator_add_milestone(
  p_project_id uuid, p_title text, p_description text default null,
  p_sort_order integer default 0, p_due_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_id uuid := gen_random_uuid();
begin
  ctx := public.app_operator_project_ctx(p_project_id);
  if btrim(coalesce(p_title, '')) = '' then raise exception 'title_required' using errcode = '22023'; end if;
  insert into public.project_milestones (id, agency_id, client_id, project_id, title, description, sort_order, due_at)
  values (v_id, ctx.agency_id, ctx.client_id, p_project_id, btrim(p_title),
          nullif(btrim(coalesce(p_description, '')), ''), coalesce(p_sort_order, 0), p_due_at);
  perform public.app_project_audit(ctx.agency_id, ctx.client_id, p_project_id, ctx.operator_id, ctx.operator_role,
    'milestone_added', 'Milestone added: ' || btrim(p_title));
  return jsonb_build_object('milestone_id', v_id, 'project_id', p_project_id);
end; $$;

create or replace function public.operator_set_milestone_status(p_milestone_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_proj uuid; v_new public.milestone_status;
begin
  select project_id into v_proj from public.project_milestones where id = p_milestone_id;
  if v_proj is null then raise exception 'milestone_not_found' using errcode = 'P0001'; end if;
  ctx := public.app_operator_project_ctx(v_proj);
  begin v_new := p_status::public.milestone_status;
  exception when others then raise exception 'invalid_status_%', p_status using errcode = '22023'; end;
  update public.project_milestones
    set status = v_new,
        completed_at = case when v_new = 'done' then coalesce(completed_at, now()) else completed_at end,
        updated_at = now()
  where id = p_milestone_id;
  perform public.app_project_audit(ctx.agency_id, ctx.client_id, v_proj, ctx.operator_id, ctx.operator_role,
    'milestone_status_changed', 'Milestone → ' || v_new::text);
  return jsonb_build_object('milestone_id', p_milestone_id, 'status', v_new::text);
end; $$;

-- 7b. Deliverables ----------------------------------------------------------
create or replace function public.operator_add_deliverable(
  p_project_id uuid, p_title text, p_kind text default 'link', p_url text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_id uuid := gen_random_uuid(); v_kind public.deliverable_kind;
begin
  ctx := public.app_operator_project_ctx(p_project_id);
  if btrim(coalesce(p_title, '')) = '' then raise exception 'title_required' using errcode = '22023'; end if;
  begin v_kind := p_kind::public.deliverable_kind; exception when others then v_kind := 'link'; end;
  insert into public.project_deliverables (id, agency_id, client_id, project_id, title, kind, url)
  values (v_id, ctx.agency_id, ctx.client_id, p_project_id, btrim(p_title), v_kind,
          nullif(btrim(coalesce(p_url, '')), ''));
  perform public.app_project_audit(ctx.agency_id, ctx.client_id, p_project_id, ctx.operator_id, ctx.operator_role,
    'deliverable_added', 'Deliverable added: ' || btrim(p_title));
  return jsonb_build_object('deliverable_id', v_id, 'project_id', p_project_id);
end; $$;

create or replace function public.operator_set_deliverable_status(p_deliverable_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_proj uuid; v_new public.deliverable_status;
begin
  select project_id into v_proj from public.project_deliverables where id = p_deliverable_id;
  if v_proj is null then raise exception 'deliverable_not_found' using errcode = 'P0001'; end if;
  ctx := public.app_operator_project_ctx(v_proj);
  begin v_new := p_status::public.deliverable_status;
  exception when others then raise exception 'invalid_status_%', p_status using errcode = '22023'; end;
  update public.project_deliverables
    set status = v_new,
        delivered_at = case when v_new in ('delivered', 'accepted') then coalesce(delivered_at, now()) else delivered_at end,
        accepted_at = case when v_new = 'accepted' then coalesce(accepted_at, now()) else accepted_at end,
        updated_at = now()
  where id = p_deliverable_id;
  perform public.app_project_audit(ctx.agency_id, ctx.client_id, v_proj, ctx.operator_id, ctx.operator_role,
    'deliverable_status_changed', 'Deliverable → ' || v_new::text);
  return jsonb_build_object('deliverable_id', p_deliverable_id, 'status', v_new::text);
end; $$;

-- 7c. Link an existing ticket to a project (operator). Validates same-org via the ticket context +
--     the project's client_id; the same-org trigger (§5) is the backstop.
create or replace function public.operator_link_ticket_to_project(p_ticket_id text, p_project_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tctx record; v_proj_client uuid;
begin
  tctx := public.app_operator_ticket_ctx(p_ticket_id);   -- authorizes operator in the ticket's agency
  if p_project_id is not null then
    select client_id into v_proj_client from public.projects where id = p_project_id;
    if v_proj_client is null then raise exception 'project_not_found' using errcode = 'P0001'; end if;
    if v_proj_client <> tctx.client_id then raise exception 'project_not_in_org' using errcode = '42501'; end if;
  end if;
  update public.tickets set project_id = p_project_id, updated_at = now() where id = p_ticket_id;
  if p_project_id is not null then
    perform public.app_project_audit(tctx.agency_id, tctx.client_id, p_project_id, tctx.operator_id, tctx.operator_role,
      'request_linked', 'Request ' || p_ticket_id || ' linked to project');
  end if;
  return jsonb_build_object('ticket_id', p_ticket_id, 'project_id', p_project_id);
end; $$;

-- 7d. Set a ticket's structured kind (operator).
create or replace function public.operator_set_ticket_kind(p_ticket_id text, p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tctx record; v_kind public.request_kind;
begin
  tctx := public.app_operator_ticket_ctx(p_ticket_id);
  begin v_kind := p_kind::public.request_kind;
  exception when others then raise exception 'invalid_kind_%', p_kind using errcode = '22023'; end;
  update public.tickets set request_kind = v_kind, updated_at = now() where id = p_ticket_id;
  return jsonb_build_object('ticket_id', p_ticket_id, 'request_kind', v_kind::text);
end; $$;

-- ============================================================================
-- 8. Grants — internal helpers stay internal; operator RPCs callable by authenticated operators.
-- ============================================================================
revoke all on function public.app_block_project_child_tenant_key_change() from public, anon, authenticated;
revoke all on function public.app_tickets_project_same_org() from public, anon, authenticated;

do $$ declare f text; begin
  foreach f in array array[
    'operator_add_milestone(uuid,text,text,integer,timestamptz)',
    'operator_set_milestone_status(uuid,text)',
    'operator_add_deliverable(uuid,text,text,text)',
    'operator_set_deliverable_status(uuid,text)',
    'operator_link_ticket_to_project(text,uuid)',
    'operator_set_ticket_kind(text,text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon;', f);
    execute format('grant execute on function public.%s to authenticated;', f);
  end loop;
end $$;

-- ============================================================================
-- END V2.2 DRAFT. NOT APPLIED. Order: apply V2.0 then this, on DEV only, in a coordinated window.
-- Customer RLS for the new project tables is intentionally deferred to V2.3.
-- ============================================================================
