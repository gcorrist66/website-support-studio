# WSS Phase E — RLS Design (Security Gate)

**Date:** 2026-06-08
**Status:** Design pass. **RLS is NOT enabled by this document.** No code, no migration, no commits.
**Source of truth:** `AUTH_FOUNDATION_PLAN.md`, `AUTH_CUSTOMER_IDENTITY_DESIGN.md`, `AUTH_TENANT_MODEL_DECISION.md`.

> **Verdict up front (Task 6): NOT safe to enable now — requires one more implementation pass on a seeded test DB, plus prerequisites.** The policy set below is complete, internally consistent, and drop-in, but it must not be applied until: (1) operators are linked to `auth.users`, (2) the anon read path is retired, (3) the helper functions + column-protection triggers exist, and (4) isolation is *executed and verified* against a seeded database. Enabling RLS blind would lock out operators and risk a tenant leak.

---

## 1. RLS architecture

**Model:** deny-by-default. Enable RLS (and `force row level security`) on every tenant table; grant access only through explicit policies. Two authorization domains, both keyed **only on `auth.uid()`** (never email):

- **Customer** — access gated by an active `org_members` row for the row's organization (`client_id`/`org_id`).
- **Operator** — access gated by an active `operators` row whose `agency_id` owns the row.

**Recursion-safe via `SECURITY DEFINER` helpers.** Membership/operator checks read `org_members`/`operators` from inside `SECURITY DEFINER` functions (owner-privileged, RLS-bypassing), so a policy on `org_members` never recurses into `org_members` RLS. All helpers: `stable`, `set search_path = public`, `execute` granted to `authenticated`, revoked from `anon`/`public`.

**Privileged write paths (bypass RLS by design):**
- `service_role` (Supabase `BYPASSRLS`) — server-side only, **never** shipped to the browser.
- `SECURITY DEFINER` RPCs (existing `complete_customer_onboarding`; future invitation-accept / member-admin / ownership-transfer RPCs) — they run as owner and enforce invariants (single owner, token validation) that row policies cannot express.

**Helper functions (design):**
```
app_is_org_member(p_org_id uuid) -> bool      -- active org_members row for auth.uid()
app_is_org_contributor(p_org_id) -> bool      -- active + role in (owner,admin,member)  [not viewer]
app_is_org_admin(p_org_id)  -> bool           -- active + role in (owner,admin)
app_is_org_owner(p_org_id)  -> bool           -- active + role = owner
app_is_operator()           -> bool           -- active operators row for auth.uid()
app_operator_in_agency(p_agency_id uuid)->bool-- active operator whose agency_id = p_agency_id
app_operator_for_org(p_org_id uuid) -> bool    -- active operator whose agency owns that client/org
```
(Operator visibility is agency-wide in v1, matching today's model where `operators.client_ids`/`site_ids` are optional/null = agency-wide. Per-operator client/site scoping is a future refinement layered on the same helpers.)

---

## 2 & 3. Policy matrix

Legend: **member** = `app_is_org_member`, **contrib** = `app_is_org_contributor`, **admin** = `app_is_org_admin`, **owner** = `app_is_org_owner`, **op(agency)** = `app_operator_in_agency(agency_id)`, **op(org)** = `app_operator_for_org(org_id/client_id)`. "—" = no policy (denied for that role). "RPC" = performed only via `SECURITY DEFINER` RPC / service role.

### Tenant core

| Table | Op | Customer | Operator |
|---|---|---|---|
| **agencies** | SELECT | — | `op(agency on id)` |
| | INS/UPD/DEL | — | RPC / service |
| **clients** (= org) | SELECT | `member(id)` | `op(agency_id)` |
| | INSERT | RPC (onboarding) | `op(agency_id)` |
| | UPDATE | `admin(id)` †col-guard | `op(agency_id)` |
| | DELETE | RPC (owner) | service |
| **org_profiles** | SELECT | `member(org_id)` | `op(org_id)` |
| | UPDATE | `admin(org_id)` | `op(org_id)` |
| | INS/DEL | RPC | RPC / service |
| **sites** | SELECT | `member(client_id)` | `op(agency_id)` |
| | INSERT | `admin(client_id)` †col-guard | `op(agency_id)` |
| | UPDATE | `admin(client_id)` †col-guard | `op(agency_id)` |
| | DELETE | `admin(client_id)` | service |

### Tickets & children (all denormalize `client_id`/`agency_id`)

| Table | Op | Customer | Operator |
|---|---|---|---|
| **tickets** | SELECT | `member(client_id)` | `op(agency_id)` |
| | INSERT | `contrib(client_id)` †col-guard | `op(agency_id)` |
| | UPDATE | — (operator workflow only) | `op(agency_id)` |
| | DELETE | — | service |
| **ticket_messages** | SELECT | `member(client_id)` | `op(agency_id)` |
| | INSERT | `contrib(client_id)` †col-guard | `op(agency_id)` |
| | UPD/DEL | — | `op(agency_id)` / service |
| **ticket_communications** (customer-facing sends) | SELECT | `member(client_id)` | `op(agency_id)` |
| | INS/UPD/DEL | — | `op(agency_id)` |
| **ticket_draft_replies** (internal) | SELECT | **— (hidden)** | `op(agency_id)` |
| | INS/UPD/DEL | — | `op(agency_id)` |
| **ticket_approvals** (internal gate) | SELECT | **— (hidden)** | `op(agency_id)` |
| | INS/UPD/DEL | — | `op(agency_id)` |
| **ticket_audit_events** (governance) | SELECT | **— (hidden in v1)** | `op(agency_id)` |
| | INS/UPD/DEL | — | `op(agency_id)` / service |

> **Critical nuance:** a blanket `member(client_id)` SELECT must **not** be applied to `ticket_draft_replies`, `ticket_approvals`, or `ticket_audit_events` — those are internal/operator-only. Only `tickets`, `ticket_messages`, and `ticket_communications` are customer-visible. (A curated customer timeline can come later via a view/RPC.)

### Identity tables

| Table | Op | Customer | Operator |
|---|---|---|---|
| **operators** | SELECT | — | `op(agency_id)` (see colleagues) |
| | INS/UPD/DEL | — | RPC / service (agency_admin) |
| **org_members** | SELECT | `member(org_id)` (see co-members) | `op(org_id)` |
| | INS/UPD/DEL | RPC (invite-accept / admin / transfer) | RPC / service |
| **org_invitations** | SELECT | `admin(org_id)` (pending emails are sensitive) | `op(org_id)` |
| | INS/UPD/DEL | RPC (issue/revoke/accept) | RPC / service |

**† col-guard:** RLS is row-level, not column-level. Customer UPDATE/INSERT on `clients`/`sites`/`tickets`/`ticket_messages` must be prevented from changing tenant keys (`agency_id`, `client_id`, `site_id`, org `slug`) — otherwise a customer could tenant-hop via UPDATE. Enforce with **BEFORE INSERT/UPDATE triggers** (or `REVOKE UPDATE (agency_id, client_id, …)` column grants). Required before enabling.

**Service-role expectations:** `service_role` bypasses all of the above and is used only by trusted server code. The `anon` role receives **no** policies → no access once RLS is on (this is why the dev anon read path must be retired/replaced).

### Example policy expressions (drop-in once prerequisites met)
```
alter table public.tickets enable row level security;
alter table public.tickets force row level security;

create policy tickets_customer_select on public.tickets
  for select to authenticated using (app_is_org_member(client_id));

create policy tickets_customer_insert on public.tickets
  for insert to authenticated with check (app_is_org_contributor(client_id));

create policy tickets_operator_all on public.tickets
  for all to authenticated
  using (app_operator_in_agency(agency_id))
  with check (app_operator_in_agency(agency_id));
-- (no customer UPDATE/DELETE policy → denied for customers)
```

---

## 4. Required schema changes / prerequisites (before enabling)

1. **Operator ↔ `auth.users` linkage (hard blocker).** `operators.auth_user_id` is NULL for everyone and has no FK. Add `operators.auth_user_id → auth.users(id)` and a linking flow (operator login + first-login link by id, never email). **Without this, enabling operator policies locks out all staff** and there is nothing to test the operator side with.
2. **Retire/replace the anon read path.** `src/data/readOnlyTicketData.ts` (`supabase-dev-readonly`) and `validate:readonly-data` / `validate:supabase:direct` read with the anon key and will return zero rows under RLS. Decide: drop that mode, or move dev validation to seeded-auth / service-role.
3. **Helper functions** (the `app_*` set, §1) — must exist before any policy references them.
4. **Column-protection triggers/grants** (the †col-guard) on `clients`, `sites`, `tickets`, `ticket_messages` to block tenant-key changes via UPDATE/INSERT.
5. **`authenticated` GRANTs** aligned to intended policies (RLS narrows grants; it doesn't grant). Verify table privileges for `authenticated`.
6. **Perf indexes:** add `clients(agency_id)` and `sites(agency_id)` for operator agency scans. (`org_members(auth_user_id)`, `operators(auth_user_id)` already exist.)

---

## 5. Risks (ranked)

1. **Operator lockout (Critical).** Enabling before operator auth linkage = staff lose all access. → Gate on prerequisite #1.
2. **Cross-tenant leak (Critical).** A mis-scoped policy, a missing col-guard (UPDATE tenant-hop), or applying a customer SELECT to an internal table → data exposure. → Must be execution-verified.
3. **Untestable in this environment (Critical gate).** No seeded live DB with multiple `auth.uid()`s here → cannot prove isolation → must not enable.
4. **Policy recursion (High).** `org_members`/`operators` policies must use `SECURITY DEFINER` helpers, not inline subqueries. → Addressed by §1.
5. **Internal data to customers (High).** `ticket_draft_replies`/`ticket_approvals`/`ticket_audit_events` must be operator-only. → Addressed by the matrix.
6. **Definer hygiene (Medium).** Helpers/RPCs need `set search_path` and minimal grants to avoid privilege leakage.
7. **Anon read-path breakage (Medium).** Dev validation breaks. → Prerequisite #2.

---

## 6. Recommended implementation order

1. **Operator auth linkage** (FK + linking flow) — unblocks operator policies + lets staff log in. *(Its own task; dev-flag-gated.)*
2. **Retire/replace anon read path** + update affected validate scripts.
3. **Helper functions** (`app_*`) + **column-protection triggers** + perf indexes — additive, RLS still off; unit-test the helpers.
4. **Seeded test fixtures:** ≥2 agencies, ≥2 orgs, operators linked to test `auth.users`, customers across orgs (owner/admin/member/viewer), tickets + all child rows.
5. **Enable RLS + policies on a TEST/dev DB**, then run the verification suite (below). Iterate until green.
6. **Production:** apply only after green verification, *then* the production-enablement steps (prod Supabase, OAuth provider config, flip `VITE_WSS_REAL_AUTH_ENABLED`) — RLS verified is the gate for all of them.

### Verification suite (must pass before "verified")
- **Isolation:** customer A cannot SELECT/UPDATE/DELETE org B's `clients/sites/tickets/org_*` rows (expect 0 rows / denied).
- **Internal hiding:** customer SELECT on `ticket_draft_replies/approvals/audit_events` → 0 rows.
- **Tenant-hop blocked:** customer UPDATE attempting to change `client_id`/`agency_id` → rejected by col-guard.
- **Role gating:** `org_viewer` cannot INSERT tickets; `org_member` can; only `admin/owner` manage sites/members.
- **Operator scope:** operator sees only their agency; cannot see another agency's rows.
- **Anon:** anon role gets nothing on every table.
- **Definer paths:** onboarding RPC still works under RLS; invitation-accept RPC (future) works for a not-yet-member invitee.

---

## Conclusion (Task 6 answer)

**Implementation is NOT safe in this pass — another implementation+verification pass is required.** The RLS architecture and full policy matrix are complete and drop-in, but applying them depends on operator auth linkage, anon-path retirement, helper/col-guard DDL, and — non-negotiably — **execution-verified isolation on a seeded database**. This is the security gate before any customer access; per Gary's workflow it is not "done" until Production Verified, and it must not open until the verification suite passes. **No RLS was enabled, no production access enabled, no flags changed.**
