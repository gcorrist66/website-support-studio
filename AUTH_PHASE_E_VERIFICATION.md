# WSS Auth — Local Verification Plan (Fixed Locally → Verified Locally)

**Date:** 2026-06-08
**Status:** Verification-only. No code, no migrations, no commits, no production.
**Linked dev project:** `vrtfbbrwrxyljchywmzy` (DEV). **Never run any of this against production.**

> This sprint defines *how* to prove the local auth stack works on the dev DB and what cannot be trusted until executed. No new architecture, policies, or features are introduced.

---

## 1. Verification checklist

Each item = a concrete check + expected result. (E) = must execute on a real DB; structural review alone is insufficient.

### A. Canonical agency & slugs
- [ ] (E) Canonical agency `website-support-studio` exists exactly once after migrations.
- [ ] (E) `wss_slugify('Acme Corporation') = 'acme-corporation'`; `wss_slugify('Café & Co.!!!') = 'cafe-co'`.
- [ ] (E) `wss_extract_host('https://www.example.com/path?x=1') = 'example.com'`; `wss_extract_host('blog.example.com') = 'blog.example.com'`.
- [ ] (E) Two orgs named "Acme Corporation" → slugs `acme-corporation` then `acme-corporation-2`.

### B. Customer onboarding RPC
- [ ] (E) `complete_customer_onboarding(...)` with a valid `auth.uid()` creates: 1 `clients` row (under canonical agency), 1 `org_profiles`, 1 `org_members` (org_owner/active), 1 `sites` (valid URL).
- [ ] (E) `onboarding_status = 'complete'` when `primary_contact_email` + (site or `website_count`) present; else `onboarding_required`.
- [ ] (E) **Idempotent:** second call by the same uid returns the same `org_id` (`reused:true`), no duplicate org.
- [ ] (E) **Fail-closed:** with the canonical agency absent, the RPC raises `canonical_agency_missing` (never the dev seed, never an orphan).
- [ ] (E) Missing/invalid URL → org created with **no** site, status `onboarding_required`.

### C. Operator bootstrap
- [ ] (E) `bootstrap_first_operator(uid,'agency_admin',...)` as **service_role** creates+links the first operator under the canonical agency; re-run is a no-op (`reused:true`).
- [ ] (E) Called as `authenticated`/`anon` → raises `bootstrap_requires_service_role`.
- [ ] (E) Bootstrapped operator resolves to a session via the existing pipeline (resolve by `auth_user_id`).

### D. Operator invitation / linkage
- [ ] (E) `invite_operator(...)` by an active `agency_admin` creates an `invited` operator row + a `pending` invitation; invited operator yields **no** session.
- [ ] (E) `accept_operator_invitation(token_hash)` by the invitee binds `auth_user_id` + sets `active`; role/agency unchanged (no escalation).
- [ ] (E) Expired/revoked/wrong token → rejected; no link.
- [ ] (E) A second operator cannot bind an already-linked `auth_user_id` (one user ↔ one operator).
- [ ] (E) `revoke_operator_invitation(...)` sets invite `revoked` + archives the unlinked row; cannot revoke an accepted invite.
- [ ] (E) `unlink_operator(...)` clears `auth_user_id` only (row preserved).
- [ ] (E) **No email authorization:** a logged-in user whose email matches an unlinked/invited operator gets **no** session — only `auth_user_id` resolves.

### E. RLS isolation (the security gate)
- [ ] (E) anon sees nothing on every tenant table.
- [ ] (E) Customer A cannot see Customer B's clients/sites/tickets/org rows.
- [ ] (E) `org_viewer` cannot insert a ticket; `org_member` can — only in its own org.
- [ ] (E) Customer **cannot** read `ticket_draft_replies`, `ticket_approvals`, `ticket_audit_events`, `operator_audit_events`, `operator_invitations`.
- [ ] (E) Customer **can** read own `tickets`, `ticket_messages`, `ticket_communications`.
- [ ] (E) Operator sees agency-scoped tickets; cannot see another agency.
- [ ] (E) Tenant-hop `UPDATE` (changing `client_id`/`agency_id`/`site_id`) is blocked for end users.

### F. service_role & RPC paths
- [ ] (E) `service_role` (BYPASSRLS) reads all rows across tenants.
- [ ] (E) `SECURITY DEFINER` RPCs (onboarding, operator RPCs) still succeed under RLS (definer/owner bypass).

### G. Internal-table protection (cross-cut of E)
- [ ] (E) `ticket_draft_replies`, `ticket_approvals`, `ticket_audit_events`, `operator_audit_events` have **0 customer-readable rows** for any customer identity.

---

## 2. Migration review (ordering / dependencies / idempotency / rollback)

Apply order (timestamp = correct dependency order):

| # | File | Creates | Depends on | Idempotent? |
|---|---|---|---|---|
| 1 | `…0001_phase2a` | agencies, clients, sites, tickets, ticket_audit_events, `touch_updated_at()` | — | ✅ (`if not exists`, guarded enums) |
| 2 | `…0002_phase2b` | ticket_messages/draft_replies/approvals/communications | 1 | ✅ |
| 3 | `…6c_operator_identity` | operators (+enums) | 1 (agencies) | ✅ (enum guards, `if not exists`) |
| 4 | `…180000_customer_identity` | org_members, org_profiles, org_invitations | 1 (clients), auth.users | ✅ |
| 5 | `…190000_onboarding_rpc` | canonical agency, slug helpers, `complete_customer_onboarding` | 1,4 | ✅ (`on conflict do nothing`, `create or replace`) |
| 6 | `…200000_operator_linkage_schema` | operators→auth.users FK, operator_invitations, operator_audit_events | 3, auth.users | ✅ (FK guarded via `pg_constraint`, `if not exists`) |
| 7 | `…200001_operator_linkage_rpcs` | bootstrap/invite/accept/revoke/unlink, `is_valid_uuid_text` | 3,5,6, canonical agency | ✅ (`create or replace`) |
| 8 | `…210000_phase_e_rls` | helpers, col-guard triggers, indexes, grants, enable+force RLS, **37 policies** | ALL prior | ⚠️ **partially** |

**Dependency conclusion:** ordering and dependencies are correct; every object exists before it is referenced.

**Idempotency finding (⚠️ migration 8):** `create policy` is **not** idempotent — there is no `drop policy if exists`/`if not exists`. **Re-running file 8 errors** ("policy already exists"). Functions, `enable/force RLS`, grants, indexes, and triggers in file 8 *are* idempotent; only the 37 `create policy` statements are not. Acceptable for a normal one-time `db push` (Supabase wraps each migration in a transaction, so a mid-file failure rolls the whole file back), but **not safe to re-apply** and a partial manual run could leave RLS enabled with incomplete policies.

**Rollback risks:**
1. **No down migration.** Reverting RLS requires a manual `alter table … disable row level security` + `drop policy …`. A bad RLS deploy with no quick revert path is the top operational risk. → Recommend authoring a tested down-migration (or a documented disable script) *before* prod.
2. **Lockout on partial apply.** If file 8 fails after `enable … force` but before policies for a table, that table is RLS-protected with no policy → no access (except service_role). The per-file transaction mitigates this on `db push`; verify the migration runner is transactional in the target environment.
3. **Anon read-path breakage.** Applying file 8 to dev makes `readOnlyTicketData` (`supabase-dev-readonly`) and `validate:readonly-data`/`validate:supabase:direct` return zero rows — expected, but those dev validators will "fail" until moved to seeded-auth/service-role. (App change, out of scope here.)

---

## 3. RLS verification-script review (`supabase/tests/phase_e_rls_verification.sql`)

**Mandated scenarios — all covered:** anon-nothing (1), A≠B (2/3), viewer-cannot-write (4), member-own-org-only (5), customer-cannot-read draft_replies/approvals/audit_events (6), operator-agency-scope (7), operator-not-other-agency (8), service_role-sees-all (9), tenant-hop-UPDATE-blocked (10). ✅

**Supplementary cases NOT yet asserted (recommend adding before calling RLS fully verified — not in this sprint):**
- `org_members`: customer sees co-members of own org only, not another org's.
- `org_invitations`: only `org_admin` sees pending; `org_member`/`org_viewer` see none.
- `operator_invitations` / `operator_audit_events`: customer sees nothing (currently relies on deny-by-default, untested).
- `ticket_communications`: customer **can** read (only `ticket_messages` is positively asserted today).
- Customer **cannot** `UPDATE`/`DELETE` `tickets` (no policy) — assert denial.
- `clients`/`sites`/`org_profiles`: admin-vs-member write boundaries (admin can, member cannot).
- Onboarding/operator **RPCs still succeed under RLS** (definer bypass) — functional, belongs in the RPC tests (§4 Step 3).

**Execution caveats in the script (must validate live):**
- The `auth.users` seed uses a minimal column set; some Supabase versions require more columns — adjust if the insert errors.
- The internal-child-table seeds (`ticket_draft_replies.body`, `ticket_approvals.decision`, `ticket_audit_events.event_type`) assume column names — adjust to the real NOT NULL columns if they error.
- Relies on `set local role authenticated` + `request.jwt.claims` driving `auth.uid()`/`auth.role()`; confirm the dev DB resolves these as expected.

---

## 4. Exact dev verification sequence

> Prereq: a dev DB connection string in `$WSS_DEV_DB_URL` (Supabase dashboard → Connection string; the **dev** project only). Use `npx supabase` if the CLI isn't on PATH.

**Step 0 — confirm target is DEV (never prod):**
```
grep project_ref .supabase/config.toml        # must be vrtfbbrwrxyljchywmzy
npx supabase projects list                      # confirm the linked ref
```
Pass: ref = `vrtfbbrwrxyljchywmzy`. **Fail/stop** if it is anything else.

**Step 1 — apply all migrations to dev:**
```
npx supabase db push                            # applies the 8 pending migrations to the linked DEV project
```
Pass: push completes; `select count(*) from supabase_migrations.schema_migrations;` includes `20260608210000`.

**Step 2 — schema presence checks (psql):**
```
psql "$WSS_DEV_DB_URL" -v ON_ERROR_STOP=1 -c "
  select count(*) filter (where proname like 'app\_%') as helpers,
         count(*) filter (where proname in ('complete_customer_onboarding','bootstrap_first_operator',
           'invite_operator','accept_operator_invitation','revoke_operator_invitation','unlink_operator')) as rpcs
  from pg_proc where pronamespace='public'::regnamespace;
  select count(*) as policies from pg_policies where schemaname='public';
  select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;"
```
Pass: helpers ≥ 7, rpcs = 6, policies = 37, `rowsecurity = true` on all 15 tenant tables.

**Step 3 — functional RPC tests (psql, transactional, rolled back):**
Run a script that (a) creates a test `auth.users` row, (b) `set local role authenticated` + claims sub, (c) calls `complete_customer_onboarding(p_company_name=>'Acme Corporation', p_website_url=>'https://www.acme.com', p_website_count=>1, p_primary_contact_email=>'a@acme.test', …)`, asserts org/profile/owner/site created + status `complete`; (d) re-calls → `reused:true`; (e) repeats company name → slug `acme-corporation-2`; (f) `reset role`; as `service_role` calls `bootstrap_first_operator(...)` then `invite_operator`→`accept_operator_invitation`→`revoke`→`unlink`; wraps all in `begin … rollback`.
Pass: every assertion holds; `rollback` leaves the DB unchanged.

**Step 4 — RLS isolation:**
```
psql "$WSS_DEV_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/phase_e_rls_verification.sql
```
Pass: prints `PHASE E RLS VERIFICATION: ALL SCENARIOS PASSED` and `rollback`s (no `FAIL …` raised, `ON_ERROR_STOP` did not trigger).

**Step 5 — record anon-path consequence:**
Confirm `validate:readonly-data` now returns nothing under RLS (expected) and log it as the required app/dev-tooling follow-up.

**SQL execution order:** migrations 1→8 (Step 1) → schema presence (Step 2) → RPC functional (Step 3) → RLS isolation (Step 4). Steps 3–4 are independent and each self-rolls-back.

---

## 5. What must be executed live / cannot be trusted without execution

**Cannot be trusted without execution (all of §1 marked (E)):**
- Every RLS isolation outcome — Postgres evaluates policies at runtime; static review proves intent, not behavior.
- The verification script's own `auth.users` seed + internal-child seeds (column compatibility).
- `force row level security` + `SECURITY DEFINER`/owner bypass actually letting RPCs through.
- `auth.uid()`/`auth.role()` resolving from `request.jwt.claims` under `set local role`.
- RPC behavior: onboarding idempotency/fail-closed/slug collision; bootstrap service-role gate; invite/accept/one-user-one-operator/no-escalation.
- Migration `db push` applying cleanly in order on a real DB (e.g., the operators→auth.users FK, enum guards).

**Trustworthy from static review (already validated):**
- Migration ordering/dependencies; idempotency per-statement (and the non-idempotent `create policy` finding); `typecheck`/`build` unaffected; no secrets; no production flags; internal tables have 0 customer policies; no email-based authorization in policies/RPCs.

---

## 6. Pass/fail matrix

| Check group | Method | Pass criteria | Trust w/o exec? |
|---|---|---|---|
| Migrations apply | `db push` | All 8 applied; `…210000` recorded | No |
| Schema presence | psql (Step 2) | helpers ≥7, rpcs=6, policies=37, RLS on ×15 | No |
| Slugs/agency | psql (Step 3) | exact slug outputs; agency once | No |
| Onboarding RPC | psql (Step 3) | creates rows; idempotent; fail-closed | No |
| Operator RPCs | psql (Step 3) | bootstrap/invite/accept/revoke/unlink behave; no escalation | No |
| RLS isolation | Step 4 script | "ALL SCENARIOS PASSED", no FAIL | No |
| service_role/definer | Step 4 (s.9) + Step 3 | sees all; RPCs succeed under RLS | No |
| Internal protection | Step 4 (s.6) | 0 customer-readable internal rows | No |
| Structural/lint/build | done locally | typecheck/build clean; no secrets/flags | Yes ✅ |

A run is **Verified Locally** only when every "No" row above has been **executed on dev and passed**, plus the §3 supplementary RLS cases are added and pass.

---

## 7. Production readiness assessment

**Current state: Fixed Locally.** All migrations + the RLS layer + RPCs exist and pass static review, but **nothing has been executed on a database**, so isolation is *unproven*. This sprint does not change that — it defines the path.

**To reach Verified Locally:** execute Steps 0–5 on dev; all §6 "No" rows green; add + pass the §3 supplementary RLS assertions.

**Still required before production OAuth / customer access (in order, none done):**
1. **Verified Locally on dev** (Steps 0–5 green) — the immediate next action.
2. **Author a down-migration / RLS-disable rollback** and a re-runnable policy guard (`drop policy if exists`) — close the rollback + non-idempotency risk.
3. **Fix the anon read-path** (move `readOnlyTicketData`/dev validators off the anon key under RLS).
4. **Provision the production Supabase project** (ref TBD), apply all migrations, and **re-run the full verification there**.
5. **OAuth provider config** (Google/GitHub) + Site/redirect URLs on prod.
6. **Flip `VITE_WSS_REAL_AUTH_ENABLED=true` in production — last**, only after 1–5.

**Verdict:** **Not production-ready.** The architecture is complete and internally consistent; readiness now hinges on *execution* (dev verification), a *rollback path*, and the *prod project + OAuth + flag* enablement — not on further design. Per Gary's workflow, this remains pre-"Production Verified."
