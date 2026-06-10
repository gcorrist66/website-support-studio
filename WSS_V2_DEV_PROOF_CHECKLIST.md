# WSS V2 — DEV-Only Proof Checklist

**Branch:** `v2-foundation` · **Date:** 2026-06-09 · **Status:** READY TO RUN LATER (not run yet).
**Purpose:** prove the four parked V2 draft migrations on a **dev** database, with zero risk to the live
WSS 1.5 production signup.

> ⛔ **Hard safety line.** This repo's Supabase CLI is linked to **production** (`sfhllezyyylduxvwdxki`).
> Therefore: **never run `supabase db push`** and **never run `supabase db reset --linked`** while this proof
> is in flight — both target the linked **prod** remote. Use a **local stack** (recommended) or a **separate
> dev project**. Nothing in this checklist touches production. Do not merge, push, or apply to prod.

---

## 1. Executive Summary

The V2 layer is four additive, unapplied draft migrations (V2.0 Projects → V2.2 Milestones/Deliverables/
request linkage → V2.3 Customer visibility → V2.4 Capacity ledger). Static review found **no blocking
issues**: dependency order matches timestamp order, and every migration layers cleanly on the base schema.
This document is the single, ordered recipe to **apply and verify** them on dev — covering apply order,
tenant isolation, the operator write paths, the two customer read RPCs (`get_my_projects`,
`get_my_capacity`), sensitive-field non-leakage, and the capacity ledger — plus a dev rollback and the
production-readiness gates. **No migrations were written or applied; static-only.**

## 2. V2 Migration Review

| Migration | Defines | Depends on | Notes |
|---|---|---|---|
| `20260610000000_v2_projects_foundation` | `projects`, `project_audit_events`; `app_operator_project_ctx`, `app_project_audit`; `operator_create_project`, `operator_set_project_status`; project tenant guard; operator-only RLS | base (`app_operator_in_agency`, `subscriptions`, `clients/agencies/operators`) | status incl. `waiting_on_customer`; `target_delivery_date` |
| `20260611000000_v2_2_…` | `project_milestones`, `project_deliverables`; `tickets.project_id` (+ same-org trigger), `tickets.request_kind` (+ backfill); 6 operator RPCs | **V2.0** (ctx/audit) + base (`app_operator_ticket_ctx`, `tickets`) | two new `tickets` columns are nullable/defaulted |
| `20260612000000_v2_3_…` | `get_my_projects()` (column-whitelisting read RPC) | **V2.0 + V2.2** + base (`org_members`) | project tables stay operator-only |
| `20260613000000_v2_4_…` | `capacity_ledger`; `tickets.effort_level`; `cu_cost()`; `operator_post_capacity_entry()`; `get_my_capacity()` | **V2.2** (`tickets.project_id`) + base (`subscriptions`) | auto-consume at approval gate intentionally NOT wired |

**Preconditions:** the dev DB must already be at **production's current migration head** (all base
migrations applied) before the V2 four run. Apply strictly in timestamp order.

**⚠ Reconciliation with `main` (added 2026-06-09 — see Foundation Plan Part V):** `main` now has
`20260614000000_request_attachments.sql`, whose `submit_customer_request_with_attachments` RPC **writes
`tickets.request_kind`** — a column **only V2.2 creates**. So **V2.2 must apply before the attachments
migration**. Revised combined order:
`base (≤20260609170500) → V2.0(610) → V2.2(611, creates request_kind) → V2.3(612) → V2.4(613) → attachments(614)`.
The natural timestamp order already satisfies this. **But** prod already carries `614`, and the V2 files are
stamped *earlier* — applying earlier-stamped migrations after a later applied one is unsafe. **Required at
rebase: renumber the four V2 migrations to AFTER `20260614000000`.** Do not renumber now (no rebase yet).

**Static findings:** balanced `$$` in all four; no function/trigger name clashes with base (`tickets`
keeps its base `tickets_block_tenant_key_change`; V2 adds `tickets_project_same_org_check`); three distinct
tenant-key guards (project / project-child / capacity) — no overlap. **No critical issue in the V2
migrations.** (Cross-branch `request_kind` ownership is an apply-order/coordination item, not a V2 bug — see Part V.)

## 3. DEV Verification Checklist

### 3.0 — Set up an isolated dev DB (pick ONE)
- **A. Local stack (recommended — fully isolated):**
  `supabase start` → `supabase db reset` (LOCAL; applies every migration incl. the V2 drafts). No remote.
- **B. Separate dev cloud project:** `supabase link --project-ref <DEV_REF>` (a NON-prod ref) → `supabase db push`.
  ⚠ Re-link back only after; never push while linked to prod.

### 3.1 — Apply order
- [ ] Base schema present (production head). Then the four V2 migrations apply with **no error**, in order
      `…610 → …611 → …612 → …613`.
- [ ] Apply the **attachments** migration (`…614`) **after V2.2** and confirm its
      `submit_customer_request_with_attachments` RPC creates cleanly (it references `request_kind`, created by V2.2).
- [ ] `request_kind` backfill ran: existing `Product feedback:%` tickets now `request_kind = 'product_feedback'`;
      all others `'support'`.
- [ ] `tickets` gained `project_id`, `request_kind`, `effort_level` with **no table rewrite / lock** on a
      populated copy (check `\d+ public.tickets`; confirm columns nullable/defaulted).

### 3.2 — Seed (service-role / SQL)
- [ ] Two orgs (clients) **A** and **B** under the WSS agency; one operator (active); two auth users
      `userA`∈A, `userB`∈B via `org_members`; a `subscriptions` row for A (`monthly_cu=50`, period dates).

### 3.3 — Operator write paths (simulate the operator's `auth.uid()`)
```sql
-- simulate operator
set local role authenticated;
set local request.jwt.claims = '{"sub":"<operator_auth_user_id>"}';
```
- [ ] `operator_create_project(<A>, 'Build site', 'new_website', …)` → returns `project_id`, status `intake`.
- [ ] `operator_set_project_status(<proj>, 'in_progress')` → status updates; `project_audit_events` row added.
- [ ] `operator_add_milestone(<proj>, 'Design', …)` and a second milestone → rows created, ordered by `sort_order`.
- [ ] `operator_set_milestone_status(<m1>, 'done')` → `completed_at` stamped.
- [ ] `operator_add_deliverable(<proj>, 'Live URL', 'link', 'https://…')` → row; `operator_set_deliverable_status(<d>, 'delivered')` stamps `delivered_at`.
- [ ] Create a ticket in org A, then `operator_link_ticket_to_project(<ticket>, <proj>)` → `tickets.project_id` set.
- [ ] **Cross-tenant link is rejected:** linking an org-B ticket to org-A's project raises `project_not_in_org`.
- [ ] `operator_set_ticket_kind(<ticket>, 'bug_report')` → `tickets.request_kind` updates.
- [ ] `operator_post_capacity_entry(<A>, 'support_consume', -3, 'Medium support', <ticket>, null, 'medium')` → ledger row.

### 3.4 — Customer read paths (simulate `userA`)
```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"<userA_auth_user_id>"}';
```
- [ ] `get_my_projects()` returns org-A's project with: status, `next_milestone`, `milestone_progress`,
      milestones[], **only delivered/accepted** deliverables, linked `requests[]`, `action_needed`.
- [ ] `get_my_capacity()` returns `included` (= 50 + topups), `used` (= 3), `remaining` (= 47), `pending`,
      period dates — and `has_plan=true`.
- [ ] Numbers reconcile: post another `support_consume -8`; `used` → 11, `remaining` → 39.

## 4. Security / RLS Checklist

- [ ] **Tenant isolation:** as `userA`, `select * from projects;` / `project_milestones` /
      `project_deliverables` / `capacity_ledger` each return **0 rows** (operator-only tables; no customer policy).
- [ ] **Cross-tenant:** `userB` cannot see org-A's anything; `get_my_projects()` as `userB` returns `[]`.
- [ ] **No column leak:** the `get_my_projects()` payload contains **no** `intake_notes`,
      `stripe_checkout_session_id`, `stripe_payment_intent_id`; pending deliverables are absent.
- [ ] **Raw ledger hidden:** as `userA`, `select * from capacity_ledger;` → 0 rows; customers only ever get
      the 4 summary numbers from `get_my_capacity()`.
- [ ] **Anon:** with no JWT (`role anon`), every V2 table and both customer RPCs return nothing / are denied.
- [ ] **Operator still scoped:** the operator sees only their **agency's** projects/ledger (not other agencies).
- [ ] **Tenant-key immutability:** as a non-service role, updating `agency_id`/`client_id`/`project_id` on
      a milestone/deliverable, or `agency_id`/`client_id` on a ledger row, raises `tenant_key_change_forbidden`.

## 5. Rollback Plan (DEV)

- **Local stack:** simplest — `supabase db reset` rebuilds from migrations; to drop just V2, delete the four
  files locally first, then reset. (Never `--linked`.)
- **Dev cloud project:** run a down-script (reverse dependency order) **on the dev DB only**:
  ```sql
  -- functions first
  drop function if exists public.get_my_capacity();
  drop function if exists public.operator_post_capacity_entry(uuid,text,integer,text,text,uuid,text);
  drop function if exists public.cu_cost(public.effort_level);
  drop function if exists public.get_my_projects();
  drop function if exists public.operator_set_ticket_kind(text,text);
  drop function if exists public.operator_link_ticket_to_project(text,uuid);
  drop function if exists public.operator_set_deliverable_status(uuid,text);
  drop function if exists public.operator_add_deliverable(uuid,text,text,text);
  drop function if exists public.operator_set_milestone_status(uuid,text);
  drop function if exists public.operator_add_milestone(uuid,text,text,integer,timestamptz);
  drop function if exists public.operator_set_project_status(uuid,text,text);
  drop function if exists public.operator_create_project(uuid,text,text,text,uuid,integer,text);
  drop function if exists public.app_project_audit(uuid,uuid,uuid,uuid,text,text,text);
  drop function if exists public.app_operator_project_ctx(uuid);
  -- triggers + guard funcs
  drop trigger if exists tickets_project_same_org_check on public.tickets;
  drop function if exists public.app_tickets_project_same_org();
  drop trigger if exists capacity_ledger_block_tenant_key_change on public.capacity_ledger;
  drop function if exists public.app_block_capacity_tenant_key_change();
  drop function if exists public.app_block_project_child_tenant_key_change();
  drop function if exists public.app_block_project_tenant_key_change();
  -- tables
  drop table if exists public.capacity_ledger;
  drop table if exists public.project_deliverables;
  drop table if exists public.project_milestones;
  drop table if exists public.project_audit_events;
  drop table if exists public.projects;
  -- ticket columns
  alter table public.tickets drop column if exists effort_level;
  alter table public.tickets drop column if exists request_kind;
  alter table public.tickets drop column if exists project_id;
  -- enums last
  drop type if exists public.capacity_source;
  drop type if exists public.effort_level;
  drop type if exists public.request_kind;
  drop type if exists public.deliverable_status;
  drop type if exists public.deliverable_kind;
  drop type if exists public.milestone_status;
  drop type if exists public.project_payment_status;
  drop type if exists public.project_status;
  drop type if exists public.project_type;
  ```
- **Note:** the project-table FKs are `ON DELETE CASCADE`, so dropping `projects` clears children; the
  `request_kind` backfill is not auto-reverted (drop-column removes it anyway).

## 6. Production Readiness Gates (ALL must pass before V2 → prod)

1. **Dev proof green:** §3–§4 fully pass on dev (incl. zero-leak and zero cross-tenant).
2. **Performance:** `get_my_projects()` and the `tickets_project_same_org_check` trigger benchmarked on a
   production-sized copy; no regression to the live ticket path.
3. **No-rollover / renewal:** capacity period boundaries verified across a simulated `invoice.paid`.
4. **Gary's business inputs locked:** `cu_cost` (Low/Med/High), top-up prices, project pricing, overage
   policy, ongoing-ops funding — (open-decisions G1–G8 in `WSS_V2_ARCHITECTURE_SUMMARY.md`).
5. **Customer-feedback gate:** the project premise is validated by real customers (C1–C7) — V2 is paused
   until then by explicit instruction.
6. **Lockstep app changes staged:** operator project UI, customer "Your Projects" panel, `get_my_capacity`
   wiring, structured `request_kind` submit params — reviewed but not yet shipped.
7. **Auto-consume hook** (the one live-RPC change at the approval gate) designed, reviewed, and scheduled as
   a separate lockstep deploy **after** the ledger is proven.
8. **Ops:** prod backup taken; this rollback rehearsed on dev; a coordinated apply window agreed; apply runs
   in timestamp order; post-apply smoke test of the live 1.5 signup path.
9. **Branch hygiene:** `v2-foundation` rebased onto current `main` and conflicts (e.g. `CustomerRequest.tsx`)
   resolved with Codex before any merge.

## 7. Files Changed

This document only (`WSS_V2_DEV_PROOF_CHECKLIST.md`). No migrations written or modified; no code changed.

## 8. Recommended Next Step

Hold until the customer-feedback gate (#5) opens. When greenlit for a dev proof: stand up a **local**
Supabase stack, run §3 in order, then §4; record results against this checklist; if all green, advance the
production-readiness gates (§6). Do not push, merge, or apply to production at any point.
