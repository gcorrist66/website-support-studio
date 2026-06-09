# WSS Auth/RLS — Production Rollout & RLS Emergency Runbook

**Date:** 2026-06-08
**Status:** Rollout preparation. No production changes performed. OAuth disabled; `VITE_WSS_REAL_AUTH_ENABLED` not flipped; production Supabase untouched.
**Scope:** Phase E RLS is verified locally on DEV (`vrtfbbrwrxyljchywmzy`). This doc covers safe recovery, the production rollout sequence, and the post-RLS dev validation approach.

---

## 1. RLS emergency rollback / disable plan

### Affected tables (15)
`agencies, clients, sites, tickets, ticket_messages, ticket_communications, ticket_draft_replies, ticket_approvals, ticket_audit_events, operators, org_members, org_profiles, org_invitations, operator_invitations, operator_audit_events`.

### Key fact
`ALTER TABLE … DISABLE ROW LEVEL SECURITY` **does not drop policies** — it only stops enforcing them. Re-enabling reactivates the existing policies. So disable→fix→enable is clean; you only need to recreate policies if they were actually altered/dropped (use the idempotent migration in §2).

### EMERGENCY DISABLE (last resort — removes tenant isolation)
Run as a **DB admin / project owner** (Supabase Dashboard → SQL Editor, or `psql` with admin creds). Do **not** run from the app.
```sql
-- EMERGENCY: disables RLS enforcement on all WSS tenant tables.
-- WARNING: while disabled, any role WITH table grants (authenticated) can read ALL tenants'
-- rows — tenant isolation is OFF. Treat the disabled window as a data-exposure incident.
do $$
declare t text;
begin
  foreach t in array array[
    'agencies','clients','sites','tickets','ticket_messages','ticket_communications',
    'ticket_draft_replies','ticket_approvals','ticket_audit_events','operators',
    'org_members','org_profiles','org_invitations','operator_invitations','operator_audit_events'
  ] loop
    execute format('alter table public.%I disable row level security;', t);
  end loop;
end $$;
```
(`anon` remains revoked at the grant level, so anon stays blocked even with RLS off.)

### RE-ENABLE after the fix (restores isolation)
```sql
-- Policies persist across DISABLE, so re-enabling reactivates them.
do $$
declare t text;
begin
  foreach t in array array[
    'agencies','clients','sites','tickets','ticket_messages','ticket_communications',
    'ticket_draft_replies','ticket_approvals','ticket_audit_events','operators',
    'org_members','org_profiles','org_invitations','operator_invitations','operator_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
  end loop;
end $$;
```
If policies were dropped/altered (not just disabled), instead re-apply the canonical, re-runnable policy migration `20260608220000_phase_e_rls_policies_idempotent.sql` (it re-asserts enable/force AND recreates all 37 policies idempotently).

### Verify after re-enable
Re-run `supabase/tests/phase_e_rls_verification.sql` (must print `ALL SCENARIOS PASSED`).

### Who may run it
Only personnel with **direct database admin / service-role** access (project owner via Dashboard SQL Editor, or admin `psql`). Never the application, never a browser, never with a service-role key shipped client-side.

### When to USE it
- A **confirmed, production-wide lockout**: legitimate operators/customers cannot access their *own* data because of an RLS defect, **and** a forward fix can't ship fast enough. Disable → restore access → fix policies → re-enable → verify.

### When NOT to use it
- Routine bugs or a **single tenant/user** problem → diagnose the specific policy/helper instead; do not disable globally.
- To "make anon reads work" or unblock dev tooling → never (see §3).
- Any time tenant isolation must hold → DISABLE removes it for all authenticated callers; it is a break-glass action, not a fix. Re-enable ASAP and file an incident for the exposure window.

---

## 2. Re-runnable policy migration (fixes the CREATE POLICY non-idempotency)

**Decision: add a follow-up idempotent migration** (chosen over a runbook-only approach because the security layer must be safely re-establishable during an incident, in version control).

- New file: `supabase/migrations/20260608220000_phase_e_rls_policies_idempotent.sql`.
- For each of the 37 policies it does `drop policy if exists … ;` then the exact `create policy …` from `20260608210000`; it also re-asserts `enable`/`force` RLS. Generated directly from `…210000` to avoid drift.
- Historical migration `…210000` is left **untouched** (immutable history). `…220000` is the **canonical, maintained, re-runnable** source going forward.
- **Verified re-runnable:** executed twice in one transaction against DEV with no error (converged to 37 policies), then rolled back — DEV unchanged.
- Helper functions and column-guard triggers in `…210000` are already idempotent (`create or replace`) and are not duplicated.

> Apply order on a fresh project: `…210000` (helpers/triggers/grants/enable/policies) then `…220000` (re-asserts policies idempotently). On an existing project, `…220000` is the safe re-apply/recovery tool.

---

## 3. Dev validation approach under RLS (do NOT weaken RLS)

**Browser operator console — already safe, no change needed.** Every read in `src/data/readOnlyTicketData.ts` falls back to mock on error/empty (`if (query.error || !query.data) return createMockFallback…`). Under RLS the anon read returns a privilege error → the console transparently shows **mock data**. Real data in the console will come from an **authenticated operator session** once app auth is wired (post-rollout) — not from anon.

**Node validators are the part that "breaks."** `validate:readonly-data` and `validate:supabase:direct` read the dev DB with the **anon** key; under RLS that returns permission-denied / 0 rows. They are **deprecated as-is**. Replace with one of:

1. **RLS SQL harness (recommended):** run `supabase/tests/phase_e_rls_verification.sql` via `psql`/a Postgres client with the dev connection. It seeds, asserts isolation as real roles, and rolls back. This is the authoritative post-RLS validation (already proven on dev).
2. **Service-role read (server-side only):** for data-presence checks, use the **service-role key** from a **non-`VITE_` env** (e.g. `WSS_SUPABASE_SERVICE_ROLE_KEY`) inside the Node script only. `service_role` bypasses RLS. **Never** put the service-role key in a `VITE_*` var or the browser.
3. **Seeded authenticated user:** create a seeded operator/customer `auth.users` row, mint a JWT for it, and validate through that identity (mirrors production access paths).

**Forbidden:** granting `anon` access or relaxing policies to make the old validators pass.

> Action item (tracked, not done here to avoid scope creep): update/retire `validate:readonly-data` + `validate:supabase:direct` to use approach (1) or (2); mark them deprecated in `package.json` scripts.

---

## 4. Production rollout checklist (ordered; all gated; none performed here)

1. **Provision the production Supabase project** (ref TBD — distinct from dev `vrtfbbrwrxyljchywmzy`).
2. **Apply migrations to prod** in order: `…180000 → …190000 → …200000 → …200001 → …210000 → …220000` (via `supabase db push` against the prod-linked project). Confirm the canonical agency row (`website-support-studio`) exists.
3. **Run the verification suite on prod** (`phase_e_rls_verification.sql`) → must be `ALL SCENARIOS PASSED`. Do **not** proceed otherwise.
4. **Bootstrap the first prod operator:** the founder logs in once (in a controlled prod-auth test) to mint `auth.uid()`, then run `select bootstrap_first_operator('<uid>','agency_admin',…)` as **service_role**. Confirm the operator resolves a session.
5. **Configure OAuth on prod:** Google + GitHub providers; **Site URL** `https://app.websitesupportstudio.com`; **Redirect URLs** incl. `https://app.websitesupportstudio.com/auth/callback`; provider redirect URI = `https://<prod-ref>.supabase.co/auth/v1/callback`. Set prod env `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon only).
6. **Smoke-test in a staging/preview** with the flag on for a test account: login → callback → `workspace setup required` (until onboarding wired) or onboarding → workspace; confirm RLS isolation with two test tenants.
7. **Flip `VITE_WSS_REAL_AUTH_ENABLED=true` in production — LAST**, only after 1–6 and explicit sign-off.
8. **Post-launch:** monitor; keep the §1 runbook on hand; have `…220000` ready as the recovery lever.

**Pre-req hardening before step 1:** the dev-validator replacement (§3) and confirming the down/disable runbook (§1) are rehearsed.

---

## 5. Build & validation results (this prep pass)
- `npm run typecheck` → clean.
- `npm run build` (root) → builds.
- `cd marketing && npm run build` → builds.
- Idempotent migration `…220000` → generated from `…210000`; **ran twice on DEV without error**, rolled back.
- No production touched; OAuth not enabled; `VITE_WSS_REAL_AUTH_ENABLED` not flipped; nothing committed/pushed.

(See the turn report for exact command outputs.)

---

## 6. Remaining steps before enabling OAuth
1. Update/retire the anon Node validators per §3 (use the RLS harness or a service-role/Node path).
2. Rehearse the §1 emergency disable/re-enable on dev (optional but recommended).
3. Provision prod Supabase + apply migrations (`…180000 … …220000`) + **verify on prod**.
4. Bootstrap the first prod operator.
5. Configure Google/GitHub OAuth + Site/redirect URLs + prod anon env.
6. Staging smoke test with the flag on for a test tenant pair.
7. **Then** flip `VITE_WSS_REAL_AUTH_ENABLED=true` in production (last, with sign-off).
