-- V2.4 — Capacity accounting: the Capacity Unit ledger.  *** DRAFT — NOT APPLIED ***
--
-- Builds on V2.0–V2.3 (all unapplied on v2-foundation) and aligns with the capacity_ledger sketch in
-- MMVP_IMPLEMENTATION_PLAN.md, extended for projects. Apply order: V2.0 → V2.2 → V2.3 → V2.4, DEV ONLY,
-- coordinated window. The Supabase CLI is linked to PRODUCTION — do NOT `supabase db push`.
--
-- CORE PRINCIPLE: Capacity Units are the currency of SUBSCRIPTION support. Fixed-price PROJECTS are paid
-- in money (projects.price_cents), NOT in CU. A request consumes CU only when it is subscription-funded:
--   - orphan support request (tickets.project_id IS NULL)                    → CONSUMES CU
--   - in-scope project request / milestone / deliverable                      → does NOT consume CU
--   - out-of-scope ("overage") project work the operator routes to the plan   → CONSUMES CU (source=project_overage)
-- See WSS_V2_FOUNDATION_PLAN.md Part IV for the full rule set and visibility models.
--
-- This draft provides the LEDGER + read paths only. Auto-posting a consume entry at the support
-- approval gate is the one integration that touches a live RPC (operator_send_reply / approve) and is
-- DEFERRED to a careful lockstep change; until then operators post entries via operator_post_capacity_entry.

-- ============================================================================
-- 0. Enums.
-- ============================================================================
do $$ begin
  create type public.capacity_source as enum (
    'monthly_grant',     -- plan allotment for a period (usually implicit from subscriptions.monthly_cu)
    'topup',             -- purchased top-up (50/100/250) added to the period
    'support_consume',   -- a support request consumed CU (debit)
    'project_overage',   -- out-of-scope project work routed to the subscription (debit)
    'adjustment',        -- manual correction (+/-)
    'refund'             -- CU returned (credit)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.effort_level as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- 1. tickets.effort_level — operator's Low/Medium/High classification (drives consume amount + pending).
--    Additive, nullable: existing rows read NULL (unclassified), no behavior change.
-- ============================================================================
alter table public.tickets
  add column if not exists effort_level public.effort_level;

create index if not exists tickets_effort_level_idx on public.tickets (effort_level);

-- ============================================================================
-- 2. cu_cost(effort) — the ONE place CU pricing lives. DEFAULT mapping, pending Gary's confirmation.
--    Low=1, Medium=3, High=8 (Operations 50 CU ≈ 50 low / 16 medium / 6 high per month; Growth 150).
-- ============================================================================
create or replace function public.cu_cost(p_effort public.effort_level)
returns integer language sql immutable as $$
  select case p_effort
    when 'low' then 1
    when 'medium' then 3
    when 'high' then 8
  end;
$$;

-- ============================================================================
-- 3. capacity_ledger — append-only movements. `amount_cu` is a SIGNED delta:
--    credits (+): monthly_grant, topup, refund, positive adjustment
--    debits  (−): support_consume, project_overage, negative adjustment
--    The base plan allotment is the SOURCE OF TRUTH on subscriptions.monthly_cu; the ledger records
--    movements ON TOP of it (so a fresh org with no ledger rows simply has Included = monthly_cu).
-- ============================================================================
create table if not exists public.capacity_ledger (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null,
  client_id uuid not null,                    -- the org whose balance this affects
  subscription_id uuid,                       -- the subscription/period this belongs to (nullable)
  period_start date,                          -- billing period scoping (no rollover across periods)
  period_end date,
  source public.capacity_source not null,
  amount_cu integer not null,                 -- SIGNED (+credit / −debit)
  effort_level public.effort_level,           -- set on support_consume / project_overage
  ticket_id text,                             -- the request that moved CU (nullable)
  project_id uuid,                            -- the project, when project-related (nullable)
  reason text,                                -- human-readable explanation
  created_by text not null default 'system',  -- operator email or 'system'
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint capacity_ledger_agency_fkey foreign key (agency_id) references public.agencies (id) on delete cascade,
  constraint capacity_ledger_client_fkey foreign key (client_id) references public.clients (id) on delete cascade,
  constraint capacity_ledger_subscription_fkey foreign key (subscription_id) references public.subscriptions (id) on delete set null,
  constraint capacity_ledger_ticket_fkey foreign key (ticket_id) references public.tickets (id) on delete set null,
  constraint capacity_ledger_project_fkey foreign key (project_id) references public.projects (id) on delete set null,
  constraint capacity_ledger_amount_nonzero check (amount_cu <> 0)
);

create index if not exists capacity_ledger_client_id_idx on public.capacity_ledger (client_id);
create index if not exists capacity_ledger_client_period_idx on public.capacity_ledger (client_id, period_start);
create index if not exists capacity_ledger_ticket_id_idx on public.capacity_ledger (ticket_id);
create index if not exists capacity_ledger_project_id_idx on public.capacity_ledger (project_id);

-- ============================================================================
-- 4. RLS — operator-only at the table level (append-only governance record). Customers read their
--    summary via get_my_capacity() (a column-safe RPC), never the raw ledger.
-- ============================================================================
revoke all on public.capacity_ledger from anon;
grant select, insert, update, delete on public.capacity_ledger to authenticated;
alter table public.capacity_ledger enable row level security;
alter table public.capacity_ledger force row level security;

create policy capacity_ledger_operator_all on public.capacity_ledger
  for all to authenticated using (app_operator_in_agency(agency_id)) with check (app_operator_in_agency(agency_id));

-- Tenant-key guard (reuse the project-child guard shape via a dedicated function).
create or replace function public.app_block_capacity_tenant_key_change()
returns trigger language plpgsql as $$
begin
  if auth.role() is not null and auth.role() <> 'service_role' then
    if (new.agency_id is distinct from old.agency_id) or (new.client_id is distinct from old.client_id) then
      raise exception 'tenant_key_change_forbidden' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists capacity_ledger_block_tenant_key_change on public.capacity_ledger;
create trigger capacity_ledger_block_tenant_key_change before update on public.capacity_ledger
  for each row execute function public.app_block_capacity_tenant_key_change();

-- ============================================================================
-- 5. Operator write path — post a ledger entry (manual until the approval-gate auto-hook lands).
--    Derives agency_id from the org; binds ticket/project when supplied. Self-authorizes as operator.
-- ============================================================================
create or replace function public.operator_post_capacity_entry(
  p_client_id uuid,
  p_source text,
  p_amount_cu integer,
  p_reason text default null,
  p_ticket_id text default null,
  p_project_id uuid default null,
  p_effort text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_agency uuid;
  v_op record;
  v_src public.capacity_source;
  v_eff public.effort_level;
  v_sub record;
  v_id uuid := gen_random_uuid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_amount_cu = 0 then raise exception 'amount_must_be_nonzero' using errcode = '22023'; end if;

  select c.agency_id into v_agency from public.clients c where c.id = p_client_id;
  if v_agency is null then raise exception 'client_not_found' using errcode = 'P0001'; end if;

  select o.id, o.email into v_op
  from public.operators o where o.auth_user_id = v_uid and o.agency_id = v_agency and o.status = 'active';
  if v_op.id is null then raise exception 'not_authorized_operator' using errcode = '42501'; end if;

  begin v_src := p_source::public.capacity_source;
  exception when others then raise exception 'invalid_source_%', p_source using errcode = '22023'; end;
  begin v_eff := nullif(p_effort, '')::public.effort_level; exception when others then v_eff := null; end;

  -- Scope to the org's current subscription period when available.
  select id, current_period_start, current_period_end into v_sub
  from public.subscriptions where org_id = p_client_id order by created_at desc limit 1;

  insert into public.capacity_ledger
    (id, agency_id, client_id, subscription_id, period_start, period_end, source, amount_cu,
     effort_level, ticket_id, project_id, reason, created_by)
  values
    (v_id, v_agency, p_client_id, v_sub.id,
     (v_sub.current_period_start)::date, (v_sub.current_period_end)::date,
     v_src, p_amount_cu, v_eff, p_ticket_id, p_project_id,
     nullif(btrim(coalesce(p_reason, '')), ''), v_op.email);

  return jsonb_build_object('entry_id', v_id, 'client_id', p_client_id, 'source', v_src::text, 'amount_cu', p_amount_cu);
end; $$;

-- ============================================================================
-- 6. Customer read path — get_my_capacity(): Included / Used / Remaining / Pending, no accounting detail.
--    Included = plan monthly_cu + period credits (topup/grant/refund/+adj)
--    Used     = period debits (support_consume/project_overage/−adj)
--    Pending  = Σ cu_cost(effort) over the org's OPEN subscription requests not yet consumed
-- ============================================================================
create or replace function public.get_my_capacity()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_sub record;
  v_ps date; v_pe date;
  v_credits integer; v_debits integer; v_pending integer;
  v_included integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  select om.org_id into v_org
  from public.org_members om where om.auth_user_id = v_uid and om.status = 'active' limit 1;
  if v_org is null then return jsonb_build_object('has_plan', false); end if;

  select id, monthly_cu, status, current_period_start, current_period_end into v_sub
  from public.subscriptions where org_id = v_org order by created_at desc limit 1;
  if v_sub.id is null then return jsonb_build_object('has_plan', false); end if;

  v_ps := coalesce(v_sub.current_period_start::date, date_trunc('month', timezone('utc', now()))::date);
  v_pe := coalesce(v_sub.current_period_end::date, (date_trunc('month', timezone('utc', now())) + interval '1 month')::date);

  select
    coalesce(sum(amount_cu) filter (where amount_cu > 0), 0),
    coalesce(-sum(amount_cu) filter (where amount_cu < 0), 0)
  into v_credits, v_debits
  from public.capacity_ledger
  where client_id = v_org and occurred_at >= v_ps and occurred_at < v_pe;

  v_included := coalesce(v_sub.monthly_cu, 0) + v_credits;

  -- Pending: open subscription requests (orphan, not closed) with an effort set and no consume entry yet.
  select coalesce(sum(public.cu_cost(t.effort_level)), 0) into v_pending
  from public.tickets t
  where t.client_id = v_org and t.project_id is null and t.effort_level is not null
    and t.status <> 'closed'
    and not exists (
      select 1 from public.capacity_ledger l
      where l.ticket_id = t.id and l.source = 'support_consume'
    );

  return jsonb_build_object(
    'has_plan', true,
    'status', v_sub.status,
    'period_start', v_ps,
    'period_end', v_pe,
    'included', v_included,
    'used', v_debits,
    'remaining', greatest(v_included - v_debits, 0),
    'pending', v_pending
  );
end; $$;

-- ============================================================================
-- 7. Grants — helpers internal; operator + customer RPCs callable by authenticated (self-authorizing).
-- ============================================================================
revoke all on function public.app_block_capacity_tenant_key_change() from public, anon, authenticated;
revoke all on function public.operator_post_capacity_entry(uuid, text, integer, text, text, uuid, text) from public, anon;
grant execute on function public.operator_post_capacity_entry(uuid, text, integer, text, text, uuid, text) to authenticated;
revoke all on function public.get_my_capacity() from public, anon;
grant execute on function public.get_my_capacity() to authenticated;
-- cu_cost is a pure helper; safe to expose.
grant execute on function public.cu_cost(public.effort_level) to authenticated;

-- ============================================================================
-- END V2.4 DRAFT. NOT APPLIED. The auto-consume hook at the support approval gate is intentionally
-- NOT wired here (it would modify a live support RPC) — see Part IV "Integration & Rollout".
-- ============================================================================
