# WSS V2 — Consolidated Architecture Summary

**Branch:** `v2-foundation` (never merged, never applied) · **Date:** 2026-06-09 · **Status:** PAUSED.
This is a digest of the V2 design drafted across V2.0–V2.4. **No new architecture.** V2.5 / AI /
analytics / reporting are explicitly **not** designed. Nothing here is applied to any database; the
Supabase CLI is linked to production and no `supabase db push` has run.

Full detail lives in `WSS_V2_FOUNDATION_PLAN.md` (Parts I–IV). This file is the one-page map + the
open-decisions register, so work can resume cleanly when customer feedback arrives.

---

## 1. The V2 Model in One View

WSS 1.5 (live on `main`) is **subscription support**: `Customer → Site → Request (ticket)`, metered in
monthly Capacity Units. V2 adds **one noun — `Project`** — as an additive layer; the 1.5 flow is untouched.

```
Customer (clients/org)
  └─ Project                         V2.0  one-time, fixed-price engagement (price in money, not CU)
       ├─ Milestones                 V2.2  ordered progress steps (the plan)
       ├─ Deliverables               V2.2  tangible outputs (the handoffs)
       ├─ Requests (tickets)         V2.2  tickets.project_id link; orphan = ordinary support
       └─ Site(s)                          what the project builds/operates on
  └─ Capacity Ledger                 V2.4  CU movements; CU = currency of SUBSCRIPTION support only
  └─ "Your Projects" (read)          V2.3  customer-safe visibility via one whitelisting RPC
```

| Phase | Adds | Draft migration (UNAPPLIED) | Customer-visible |
|---|---|---|---|
| **V2.0** | `projects` + `project_audit_events`, status lifecycle (`intake…closed` + `blocked`/`cancelled`), `payment_status` (Lead/Purchased), `target_delivery_date`; operator-only RLS; `operator_create_project` / `operator_set_project_status` | `20260610000000_v2_projects_foundation.sql` | no (operator-only) |
| **V2.2** | `project_milestones`, `project_deliverables`; `tickets.project_id` (nullable, same-org trigger); `tickets.request_kind` (structured category, replaces title-prefix); 6 operator RPCs | `20260611000000_v2_2_project_milestones_deliverables.sql` | no (operator-only) |
| **V2.3** | `get_my_projects()` — one column-whitelisting SECURITY DEFINER read RPC (projects + milestones + ready deliverables + linked requests); project tables stay operator-only | `20260612000000_v2_3_customer_project_visibility.sql` | **yes** (read) |
| **V2.4** | `capacity_ledger` (signed movements) + `tickets.effort_level` + `cu_cost()`; `operator_post_capacity_entry()`; `get_my_capacity()` (Included/Used/Remaining/Pending) | `20260613000000_v2_4_capacity_ledger.sql` | **yes** (4 numbers) |

**Apply order (dev only, coordinated window):** V2.0 → V2.2 → V2.3 → V2.4.

**Settled principles (do not re-litigate):**
- Project = money (`price_cents`); subscription support = Capacity Units. A request burns CU only when
  subscription-funded (orphan support, or operator-routed project overage).
- Two orthogonal axes on a project: `status` (delivery) and `payment_status` (money).
- Customer reads go through **column-whitelisting RPCs**, never direct table SELECT (prevents leaking
  `intake_notes` / Stripe ids). Project/ledger tables are operator-only.
- All V2 schema is additive; the two `tickets` columns and `*_id` links are nullable/defaulted (no rewrite,
  no change to the live support flow). CU consume happens at the **approval gate**, never at submit.

---

## 2. Open Decisions — Requiring **Gary** (business inputs)

| # | Decision | Where it bites | Current placeholder |
|---|---|---|---|
| G1 | **Effort → CU mapping** `cu_cost(low/med/high)` | V2.4 metering | default **1 / 3 / 8** (one function to change) |
| G2 | **Top-up prices** (50 / 100 / 250 CU) | billing | TBD in `plans.ts`/Stripe |
| G3 | **Project price catalog** (is $500 a standard, or per-quote?) | V2.0/V2.1 intake | `price_cents` free-form |
| G4 | **Overage policy default**: out-of-scope project work → money change-order vs CU debit | V2.4 rule | operator-flagged `project_overage`; default unset |
| G5 | **Ongoing-ops funding**: CU-funded support vs separate retainer | V2.4 rule | default = treat as subscription support |
| G6 | **Does a project price ever debit CU?** (pure revenue vs bundled CU) | V2.0/V2.4 | default: no CU coupling |
| G7 | **Project intake path**: operator-initiated vs customer self-serve checkout | V2.1 (undesigned) | operator-initiated assumed |
| G8 | **Show project price to customers?** | V2.3 read model | currently included as "their own price" |

## 3. Open Decisions — Requiring **Real Customers** (validate assumptions)

| # | Question to learn from customers |
|---|---|
| C1 | **Premise:** do customers actually buy repeatable *projects* (vs one-offs handled manually)? — the stop-condition gate |
| C2 | Do the **status labels / calm copy** ("Getting started", "Needs your input", …) read clearly? |
| C3 | Does **milestone/deliverable granularity** match how customers think about progress? |
| C4 | Is the **"Pending" CU** concept clarifying or confusing on the customer panel? |
| C5 | Do customers want to **submit requests *into* a project**, or is operator-linking enough? |
| C6 | Is **one-project-per-request** (N:1) sufficient, or does real work need M:N? |
| C7 | Is the **project vs support** distinction intuitive, or should it be invisible to customers? |

## 4. Open Decisions — Requiring **Technical Proof** (verify on dev before prod)

| # | Must prove on a dev DB |
|---|---|
| T1 | Migrations apply clean in order V2.0→V2.2→V2.3→V2.4 on a populated dev copy |
| T2 | **RLS isolation:** a customer `auth.uid()` sees **zero** rows from `projects`/milestones/deliverables/`capacity_ledger` |
| T3 | **No column leakage:** `get_my_projects()` / `get_my_capacity()` payloads never contain `intake_notes` or Stripe ids |
| T4 | `tickets` column adds (`project_id`, `request_kind`, `effort_level`) apply with **no table rewrite / lock** on real rows |
| T5 | The `tickets_project_same_org_check` trigger enforces tenant alignment; negligible cost on the hot path |
| T6 | `get_my_projects()` nested-subquery performance is fine for realistic project counts |
| T7 | Capacity **period boundaries / no-rollover** are correct across an `invoice.paid` renewal |
| T8 | `request_kind` **backfill** from the legacy title prefix tags rows correctly |
| T9 | Auto-consume at the approval gate (the one **live-RPC** change) works **after** the ledger is proven — lockstep deploy |

## 5. Items Safe to Implement Later (additive, low-risk, when greenlit)

All sit behind the unapplied migrations; none touches the live 1.5 support/signup path:
- Operator **project console** (queue + detail) — reads existing operator RLS.
- Customer **"Your Projects" panel** — read-only, empty-state renders nothing; one `get_my_projects()` call.
- Operator **milestone/deliverable controls** + ticket **link-to-project** action.
- **Capacity:** operator ledger view; swap the `buildCapacityModel` placeholder for `get_my_capacity()`.
- **Structured categorization:** move feedback/bug/feature off the title prefix onto `request_kind`
  (+ optional `submit_customer_request` `p_project_id`/`p_kind` params, backward-compatible defaults).

> Sequencing when resumed: prove on dev (T1–T8) → operator project UI → customer read panel →
> capacity wiring → finally the approval-gate auto-consume (T9). Gary's inputs (G1–G8) unblock metering
> and intake; customer feedback (C1–C7) gates whether to proceed at all.

---

## 6. Status

V2 foundation is **sufficient and paused.** Five commits on `v2-foundation`
(`dcf7c07 → 6488f18 → cbd2210 → 74874c1 → 8c88a70`), all drafts, none applied, none merged, none pushed;
`main` untouched. **No further V2 architecture until customer feedback arrives.**
