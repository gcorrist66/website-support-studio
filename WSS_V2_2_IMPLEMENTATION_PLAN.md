# WSS V2.2 — Project Milestones, Deliverables & Request Linkage (Implementation Plan)

**Branch:** `v2-foundation` (never merged to main) · **Status:** DESIGN + DRAFT MIGRATION (not applied)
**Date:** 2026-06-09 · **Builds on:** V2.0 foundation (`20260610000000_v2_projects_foundation.sql`, unapplied)
**Migration draft:** `supabase/migrations/20260611000000_v2_2_project_milestones_deliverables.sql`

> Safety: nothing here is applied. The Supabase CLI is linked to **production** — no `supabase db push`.
> Apply V2.0 then V2.2 to a **dev** project only, in a coordinated window. No production code is modified
> by this session; app-side changes (§6) are **specified, not written**.

---

## 1. Scope

Exactly four schema additions plus the operator write-paths that make them usable:

| # | Item | Kind | Customer-visible? |
|---|---|---|---|
| 1 | `project_milestones` | new table | V2.3 (operator-only now) |
| 2 | `project_deliverables` | new table | V2.3 (operator-only now) |
| 3 | `tickets.project_id` | new nullable column on live table | yes (read), via existing ticket read path |
| 4 | `tickets.request_kind` | new defaulted column on live table | yes (read) |

Out of scope (later phases): customer RLS on project tables (V2.3), customer project UI (V2.3),
self-serve project intake/payment (V2.1), capacity ledger (V2.4).

---

## 2. Data Model

### project_milestones — the *plan* (ordered progress steps)
`id · agency_id · client_id · project_id · title · description · status(milestone_status) ·
sort_order · due_at · completed_at · created_at/updated_at`
- `milestone_status = pending | in_progress | done | skipped` — `skipped` keeps history honest without
  faking `done`.
- **"What's next"** = first milestone (by `sort_order`) whose status ∉ {done, skipped}.
- **Progress %** = `count(status='done') / count(status <> 'skipped')`.

### project_deliverables — the *outputs* (tangible handoffs)
`id · agency_id · client_id · project_id · title · kind(deliverable_kind) · url ·
status(deliverable_status) · delivered_at · accepted_at · created_at/updated_at`
- `deliverable_kind = link | file | note | credential` (the live URL, design files, a handoff note, DNS creds).
- `deliverable_status = pending | delivered | accepted` — `accepted` is the customer's acknowledgement,
  the basis for sign-off. `delivered_at` stamps on delivered/accepted; `accepted_at` on accepted.

Both tables denormalize `agency_id`/`client_id` (set server-side from the project in the RPC) so RLS
predicates are a single `app_operator_in_agency(agency_id)` — identical to the ticket-children pattern.

### tickets.project_id — the request↔project link
- Nullable single-column FK → `projects(id)` `ON DELETE SET NULL`.
- **Orphan (`NULL`) = ordinary support request** = the entire current 1.5 flow, unchanged.
- **`NOT NULL` = project request** = part of a scoped engagement.
- **Tenant alignment** enforced by a `BEFORE INSERT OR UPDATE` trigger
  (`tickets_project_same_org_check`): if `project_id` is set, the project's `client_id` must equal the
  ticket's `client_id`. (A composite FK can't be used with `ON DELETE SET NULL` because `client_id` is
  `NOT NULL`; the trigger is the clean alternative and only does work when `project_id` is set.)

### tickets.request_kind — structured category
- `request_kind = support | product_feedback | bug_report | feature_request`, `NOT NULL DEFAULT 'support'`.
- Constant default ⇒ **no table rewrite** (metadata-only add on modern Postgres); existing rows read as
  `'support'`.
- Replaces the fragile `title LIKE 'Product feedback:%'` heuristic (see §6). A one-time, idempotent
  backfill maps legacy `"Product feedback:%"` titles to `'product_feedback'`.

---

## 3. Status / Completion Tracking

- Project progress is **derived**, never stored: milestones give the %, deliverables give the artifacts.
- An operator may be prompted to move the project to `delivered` once **all milestones are done/skipped
  and all deliverables are at least delivered** — but the transition stays a human action
  (`operator_set_project_status`, from V2.0), consistent with WSS's human-gate philosophy. No automatic
  status flips in this migration.

---

## 4. Security / RLS

- New tables: **operator-only** (`*_operator_all` using `app_operator_in_agency(agency_id)`); customers
  denied by default (no policy). Customer `SELECT` is written in V2.3 **together with** the `projects`
  customer policy, as one isolation-tested step. The intended customer policies are included as a
  commented block in the migration so the shape is on record.
- New tables added to a dedicated tenant-key guard (`app_block_project_child_tenant_key_change`) blocking
  re-parenting of `agency_id`/`client_id`/`project_id` by non-service-role — mirrors the V2.0 project guard,
  touches no shared function.
- `tickets` gains columns but **no new customer-write surface**: customers still have no UPDATE policy on
  tickets, so only operators (and SECURITY DEFINER RPCs) can set `project_id`/`request_kind`.

---

## 5. Operator Write Paths (RPCs in the draft)

All SECURITY DEFINER, self-authorizing via the V2.0/ticket context helpers, each writing a
`project_audit_event`:

| RPC | Purpose |
|---|---|
| `operator_add_milestone(project, title, desc, sort_order, due_at)` | create a milestone |
| `operator_set_milestone_status(milestone, status)` | advance a milestone (stamps `completed_at` on done) |
| `operator_add_deliverable(project, title, kind, url)` | add a deliverable |
| `operator_set_deliverable_status(deliverable, status)` | deliver/accept (stamps `delivered_at`/`accepted_at`) |
| `operator_link_ticket_to_project(ticket, project)` | link/unlink a request (same-org validated; pass NULL to unlink) |
| `operator_set_ticket_kind(ticket, kind)` | set a ticket's structured `request_kind` |

---

## 6. App-Side Changes (SPECIFIED, not written — land in lockstep when V2.2 is applied)

These touch production code paths and are therefore **not implemented in this session**. When V2.2 is
applied (with V2.3 customer surface), update:

1. **`submit_customer_request` RPC** — add backward-compatible params (existing 4-arg callers keep working):
   ```sql
   -- p_project_id uuid default null, p_kind text default 'support'
   -- validate (like the existing p_site_id check) that the project belongs to the caller's org,
   -- then insert tickets.project_id + tickets.request_kind. No tenant id ever comes from the client.
   ```
2. **`src/data/customerRequests.ts`** — `submitCustomerFeedback()` stops encoding category in the title;
   it passes `p_kind` (`feedback→product_feedback`, `feature_request`, `bug_report`, `other→product_feedback`)
   and optionally `p_project_id`. The `"Product feedback:"` title prefix becomes display sugar, not data.
3. **`src/domain/requestKind.ts`** (currently on `main`) — switch readers from `parseRequestKind(title)`
   to the structured `tickets.request_kind` column; keep the parser only as a fallback for un-backfilled rows.
4. **Operator console** — add milestone/deliverable controls + a "link to project" action (V2.2 operator UI).
5. **Customer workspace** — "Your Projects" panel reads milestones/deliverables/linked requests (V2.3).

Until these land, the draft is inert: the new columns simply default to `'support'`/`NULL` and the legacy
title-prefix flow continues to work.

---

## 7. Apply Order & Verification (dev only, coordinated window)

1. Apply `20260610000000` (V2.0), then `20260611000000` (V2.2) to a **dev** Supabase project.
2. Verify additive safety: existing tickets still readable; `request_kind` defaulted to `'support'`;
   feedback rows backfilled to `'product_feedback'`.
3. RLS isolation: a **customer** `auth.uid()` sees **zero** rows from `project_milestones` /
   `project_deliverables` (operator-only at V2.2); a customer can still read their own tickets including
   the new columns.
4. Same-org guard: linking a ticket to a project in a *different* org raises `project_not_in_org`.
5. Operator RPCs: add/advance a milestone and deliverable; confirm `project_audit_events` rows appear.

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Two new columns on the **live `tickets`** table | Med | Both additive/defaulted/nullable → no row rewrite, no behavior change; deploy app readers after. |
| New `BEFORE INSERT OR UPDATE` trigger on the hot ticket path | Low–Med | Only does a lookup when `project_id` is set; negligible otherwise. Benchmark on dev. |
| Backfill mis-tags a real support ticket literally titled "Product feedback:…" | Low | Coarse by design; operator can correct via `operator_set_ticket_kind`. Document. |
| Depends on V2.0 helpers/tables being applied first | Med | Migration ordering enforced (20260610 < 20260611); apply V2.0 first. |
| Customer RLS accidentally enabled early | Med | Kept commented; flipped only in V2.3 with an isolation test. |
| Divergence from `main` (request_kind also referenced by `src/domain/requestKind.ts` on main) | Med | App switch to the column is a V2.2/V2.3 follow-up; keep parser as fallback. |

---

## 9. Recommended Next Step

Keep V2.2 as a draft on `v2-foundation`. When WSS 1.5 is proven and a dev DB window opens: apply V2.0 →
V2.2 to **dev**, run §7 verification, then build the V2.2 operator UI (milestones/deliverables + link
action) before turning on the V2.3 customer surface. Do not merge, push, or apply to production.
