# WSS Phase 7C — Row Level Security (RLS) Plan (Planning Only)

Status: planning only. **No RLS migration is created here. RLS remains DISABLED.**
Authority: local doc. No push, no deploy, no production data changes.

## 1) Current RLS State
- RLS is **disabled** on every table: `operators`, `agencies`, `clients`, `sites`, `tickets`,
  `ticket_messages`, `ticket_draft_replies`, `ticket_approvals`, `ticket_communications`,
  `ticket_audit_events`.
- The dev DB is currently reached via the guarded `supabase db query` CLI path (service-grade
  connection) for validation only; the SPA carries no credentials in production (mock mode).

## 2) Why RLS Must NOT Be Enabled Before Auth Session Is Proven
- RLS policies key off `auth.uid()` and the operator's row. If RLS is enabled **before** a verified
  Supabase Auth session and a real `operators.auth_user_id` linkage exist, then `auth.uid()` is null for
  every request and **all reads/writes break** — including the dev read-only UI and the guarded
  validators.
- Enabling RLS prematurely would also give a **false sense of security** while the actual access path
  (login → session → operator) is still unproven.
- The correct order is: **prove auth session + operator linkage end-to-end → then enable RLS in stages
  on dev → re-validate → only then consider production.** (The auth pipeline is proven; the real session
  source/login is not built yet — so RLS is not started.)

## 3) Tenant Hierarchy (what policies must respect)
```
Agency → Client → Site → Ticket
```
- Every tenant row carries `agency_id` (and clients/sites/tickets carry the deeper ids). An operator
  belongs to exactly one `agency_id` and may optionally be scoped to `client_ids` / `site_ids`.
- Policies must constrain reads/writes to the operator's agency (and client/site scope when set), never
  across tenant boundaries.

## 4) Operators Table Role in RLS
- The `operators` row is the **authorization source of truth**: for a request,
  `auth.uid()` → `operators` row (active, by `auth_user_id`) → `agency_id` + role + optional scope.
- Policies reference this row (e.g., via a `security definer` helper or a join) to decide visibility and
  operation rights. `operators` itself needs an RLS policy so an operator can read only their own row
  (and admins, their agency's operators) — and never write role/agency for themselves.

## 5) Proposed RLS Stages (dev-first, each separately gated)
1. **Stage 1 — dev-only SELECT policies**: enable RLS + read policies on tenant tables so an
   authenticated operator can SELECT only rows within their agency (and scope). Verify the read-only UI
   and validators still work under an authenticated dev session.
2. **Stage 2 — dev-only operator-role policies**: refine SELECT/visibility by role (e.g., approver vs
   cs_agent views), plus the `operators` self/agency read policy.
3. **Stage 3 — write policies for the ticket lifecycle**: INSERT/UPDATE policies for
   create/triage/draft/request/approve/reject/send/close, each gated by role + tenant + state, mirroring
   the domain guards (RLS is additive to, not a replacement for, the domain/state machine).
4. **Stage 4 — audit insert restrictions**: `ticket_audit_events` is append-only — INSERT allowed within
   tenant scope, **no UPDATE/DELETE**; ensure audit rows cannot be forged across tenants.
5. **Stage 5 — production dry-run / review**: validate the full policy set on dev under real sessions,
   run the guarded workflow validators under RLS, security signoff, then a production dry-run before
   enabling on production data.

## 6) Risks
- **Lockout / breakage**: enabling RLS without correct policies (or before linkage exists) blocks all
  access. Mitigate by staging on dev, keeping a service-context path for validators, and testing each
  stage.
- **Validator coupling**: the existing guarded validators use a service connection that bypasses RLS;
  under RLS they must either keep an explicit service context (dev only) or move to an authenticated
  context. Plan this before Stage 1.
- **Policy gaps vs domain guards**: RLS must not contradict or weaken the domain state machine /
  approval gate; it is defense in depth, not the only control.
- **Performance**: policy subqueries on `operators`/tenant joins should be indexed (the operators table
  already has `agency_id`/role/status indexes).

## 7) Validation Requirements (before any RLS apply)
- Auth session source + real `operators.auth_user_id` linkage proven in dev.
- A test matrix: for each role and tenant scope, assert allowed reads/writes succeed and disallowed ones
  are denied (cross-tenant, wrong role, inactive operator).
- The full existing validation suite still passes; new RLS-specific validators added per stage.
- No service-role key in the browser; anon key only.

## 8) Rollback Plan
- Each stage is an additive, reversible migration. Rollback = a follow-up migration that
  `DISABLE ROW LEVEL SECURITY` and/or `DROP POLICY` for the affected tables, returning to the
  current known-good (RLS-off) state. Because stages are dev-first and gated, a bad stage is reverted on
  dev before it ever reaches production.
- Production enablement is the **last** step and only after dev is fully proven; production rollback is a
  single revert migration plus re-verification.

**No RLS migration is created in this phase.**
