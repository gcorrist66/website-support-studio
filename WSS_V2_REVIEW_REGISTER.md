# WSS V2 — Review Register (Decisions · Risks · Readiness)

**Branch:** `v2-foundation` · **Date:** 2026-06-09 (overnight consistency pass) · **Status:** PARKED, clean.
Output of a full consistency review of the parked V2 foundation (V2.0–V2.4 drafts + docs). **No migration
logic changed; no code modified; nothing applied.** Only documentation and one misleading migration
*comment* were corrected (logged below).

---

## A. Consistency Review Outcome

**Migrations (4):** internally consistent. Dependency order matches timestamp order
(`…610 → …611 → …612 → …613`); no enum/signature/grant/trigger/policy name clashes; balanced `$$`;
no references to objects not created earlier in the chain (base schema assumed at prod head). **No real
migration bug found** — so no migration logic was changed (per instruction, a real bug would be flagged,
not silently fixed).

**Inconsistencies found & fixed (docs/comments only):**

| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | `WSS_V2_FOUNDATION_PLAN.md` §I.7 & §I.9 | Migration filename typo `2026061000000…` (13 digits, missing a zero) | corrected to `20260610000000…` |
| 2 | `WSS_V2_FOUNDATION_PLAN.md` §I.4 | "Deliverables (V2.3 — defer)" — but `project_deliverables` ships in **V2.2** | relabelled "FINAL: V2.2 table; customer-visible V2.3" |
| 3 | `WSS_V2_FOUNDATION_PLAN.md` §I.4 | `project_messages` table sketched as a real future table — it was **never adopted** | marked NOT ADOPTED (communication reuses linked tickets) |
| 4 | `WSS_V2_FOUNDATION_PLAN.md` §II.7 phase map | V2.2 row missing `project_deliverables`; V2.3 row said "customer RLS read policies" (V2.3 actually uses an RPC) | V2.2 row now lists both tables; V2.3 row now says `get_my_projects()` RPC, not direct policies |
| 5 | `WSS_V2_FOUNDATION_PLAN.md` header | "tomorrow's $500 customer" reads as a current claim | added a dated reading-note: Part I is the original 2026-06-09 proposal; current state = the architecture summary |
| 6 | `20260611000000_v2_2_…sql` lines 132–139 (comment) | Commented "intended" customer SELECT policies imply V2.3 adds direct per-table policies — V2.3 **superseded** that with the RPC | comment rewritten to state the RPC supersession + column-safety reason (no SQL logic touched) |
| 7 | `WSS_V2_DEV_PROOF_CHECKLIST.md` | "tomorrow's production signup" now stale | → "the live production signup" |

**Confirmed already-consistent:** `WSS_V2_ARCHITECTURE_SUMMARY.md`, `WSS_V2_2_IMPLEMENTATION_PLAN.md`,
the apply-order tables, and the project-status enum listing (all include `waiting_on_customer`). No doc
overclaims implementation — all four migrations are consistently described as **drafts / unapplied**, and
no doc implies production readiness (gates explicitly unmet).

---

## B. Decision Register

Legend: **G** = needs Gary (business) · **Cust** = needs real-customer evidence · **DEV** = needs dev-DB proof.

| # | Decision | Current recommendation | G | Cust | DEV | Phase | Risk if wrong |
|---|---|---|:--:|:--:|:--:|---|---|
| D1 | **Low/Med/High → CU** (`cu_cost`) | default **1 / 3 / 8** (one function) | ✅ | ◐ | ✅ | V2.4 | mispriced capacity → oversell or thin margin |
| D2 | **Project work vs support CU** | in-scope project work burns **no** CU; only orphan support + routed overage do | ✅ | ✕ | ✅ | V2.4 | double-charge or unbilled work |
| D3 | **Top-up pricing** (50/100/250) | TBD — set in `plans.ts`/Stripe | ✅ | ✕ | ✕ | V2.4/billing | can't sell top-ups / wrong price |
| D4 | **Is $500 a standard project price?** | treat `price_cents` as per-quote until told otherwise | ✅ | ✅ | ✕ | V2.0/V2.1 | intake built on a wrong pricing model |
| D5 | **Show project price to customer?** | show the customer their **own** price | ✅ | ◐ | ✕ | V2.3 | unexpected price exposure / support confusion |
| D6 | **Project status labels** (copy map) | the calm 9-label map in Part III §III.2 | ◐ | ✅ | ✕ | V2.3 | confusing/alarming status copy |
| D7 | **Milestone granularity** | operator-defined, ordered; "next" = first non-done | ✕ | ✅ | ✕ | V2.2 | progress feels wrong to customers |
| D8 | **Deliverable acceptance** | `pending → delivered → accepted`; `accepted` = sign-off | ◐ | ✅ | ✕ | V2.2/V2.3 | no sign-off trail / disputes |
| D9 | **`request_kind` migration timing** | V2.2 column + backfill; app submit param in lockstep | ✕ | ✕ | ✅ | V2.2 | miscategorized feedback / backfill error |
| D10 | **Overage handling** | operator-flagged; money change-order **or** CU debit (`project_overage`) | ✅ | ◐ | ✅ | V2.4 | billing disputes |
| D11 | **Ongoing-ops funding** | treat as subscription support (CU) unless a retainer | ✅ | ◐ | ✕ | V2.4 | unprofitable ops work |
| D12 | **Intake path** | operator-initiated first; self-serve later | ✅ | ✅ | ✕ | V2.1 | wrong funnel / friction |
| D13 | **Customer read mechanism** | **DECIDED:** whitelisting RPC (`get_my_projects`/`get_my_capacity`), not direct RLS | ✕ | ✕ | ✅ | V2.3/V2.4 | column leak (intake_notes/stripe ids) if ever reverted |

◐ = helpful but not blocking.

---

## C. Risk Register

| # | Risk | Severity | Where introduced | Mitigation | Proof required before prod |
|---|---|:--:|---|---|---|
| R1 | Auto-consume hook edits the **live** approval RPC | **High** | V2.4 (deferred, not in draft) | kept out of the draft; lands lockstep after ledger proven | dev proof of ledger + staging test of the support flow |
| R2 | Customer read **column leak** (intake_notes/stripe ids) | **High** | V2.3 | whitelisting RPC; project tables operator-only; no direct customer policy | dev: payload has none of the sensitive fields |
| R3 | **Cross-tenant** exposure on new tables | **High** | V2.0/V2.2/V2.4 | operator-only RLS + 3 tenant-key guards | dev: customer/anon see 0 rows; cross-org link rejected |
| R4 | `tickets` column adds cause **lock/rewrite** | Med | V2.2 (`project_id`,`request_kind`), V2.4 (`effort_level`) | all nullable / constant default | apply on a prod-sized copy; observe no rewrite |
| R5 | `tickets_project_same_org_check` cost on hot path | Med | V2.2 | trigger does work only when `project_id` set | benchmark vs baseline |
| R6 | `cu_cost` values unset/incorrect | Med | V2.4 | single function; default flagged "pending Gary" | Gary confirm + dev reconciliation of Used/Remaining |
| R7 | `request_kind` backfill mis-tags a real support ticket | Low | V2.2 | coarse by design; operator-correctable via `operator_set_ticket_kind` | dev: spot-check backfilled rows |
| R8 | No-rollover / period-boundary errors | Med | V2.4 | period scoped to subscription dates | dev: simulate `invoice.paid` renewal |
| R9 | `get_my_projects` nested-subquery performance | Low–Med | V2.3 | fine at realistic project counts | benchmark with many projects |
| R10 | Branch drift / merge conflict (`CustomerRequest.tsx`) | Med | process | rebase onto `main`; coordinate with Codex before merge | clean rebase + review |
| R11 | Migrations applied **out of order** | Med | process | timestamp order = dependency order | apply strictly `…610→…611→…612→…613` |
| R12 | **Accidental prod apply** (CLI linked to prod) | **High** | env | never `supabase db push` / `db reset --linked`; use local stack | checklist hard-line obeyed |

---

## D. Implementation Readiness Map

**Build safely first (when greenlit; additive, low-risk, after the dev proof):**
- Operator project console (queue + detail) — reads existing operator RLS.
- Customer "Your Projects" panel — read-only, empty-state renders nothing; one `get_my_projects()` call.
- Operator milestone/deliverable controls + ticket link-to-project action.
- Capacity: operator ledger view; swap the `buildCapacityModel` placeholder for `get_my_capacity()`.
- Structured `request_kind` categorization (+ backward-compatible submit params).

**Requires DEV DB proof first (the checklist):** all four migrations apply in order; tenant isolation;
zero customer rows from project/ledger tables; no sensitive-field leak; no `tickets` rewrite/lock;
trigger correctness + cost; period/no-rollover; backfill correctness. (Risks R2–R8, R11.)

**Requires customer feedback first:** the **premise** (do customers buy repeatable projects?); status-copy
clarity; milestone granularity; the "Pending CU" concept; project-scoped request submission; N:1 vs M:N
(decisions D4–D8, D12).

**Must NOT be touched until later:**
- Auto-consume hook at the support approval gate (live RPC change) — R1.
- Any production apply / merge to `main` / push — R12.
- V2.1 self-serve project checkout (one-time Stripe path) — design not started.
- V2.5 / AI / analytics / reporting — explicitly **out of scope** (no new architecture).

---

## E. Remaining Open Questions

1. Gary's numbers: `cu_cost` (D1), top-up prices (D3), standard project price (D4), overage policy (D10),
   ongoing-ops funding (D11) — these unblock V2.4 metering and V2.1 intake.
2. The premise gate (D-level C1 in the architecture summary): is the project layer wanted by real
   customers? V2 stays paused until that evidence arrives.
3. Branch reconciliation: when V2 eventually merges, how is Codex's `CustomerRequest.tsx` (and other `main`
   advances) reconciled? (R10) — coordinate before any rebase.

**Recommended next step:** none required now — V2 is parked cleanly. When the premise gate opens, run the
DEV proof checklist on a local stack, then bring Gary's business inputs (Section B) to close D1–D5/D10–D11
before building. Do not apply, merge, or push.
