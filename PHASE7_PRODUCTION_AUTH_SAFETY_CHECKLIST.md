# WSS Phase 7D — Production Auth Safety Checklist (Planning Only)

Status: planning only. A gating checklist that MUST pass before any production auth rollout.
Authority: local doc. No push, no deploy. Production unchanged at `d5381fa`.

This checklist gates the eventual production rollout of operator authentication. Every item must be
**verified true** before login/auth is enabled against production. Today most items are intentionally
not-yet-applicable because no auth UI/runtime exists — the checklist is the gate, not a claim of done.

## A. Browser / Client Bundle Safety
- [ ] **No service-role key in the browser** — the service-role key never appears in client/bundled
      source. (Enforced today by `validate:ui-boundary` and `validate:readonly-data`; the production
      bundle currently contains no Supabase credentials at all.)
- [ ] **Anon key only in the browser** — the browser may hold only the Supabase **anon** key (and only
      once real reads are enabled), never a secret/service key.
- [ ] No secrets committed to the repo; all keys come from environment configuration.

## B. Access Surface
- [ ] **No public signup** — there is no self-service account creation; access is invite-only.
- [ ] **No customer portal** — no customer-facing app or login.
- [ ] **No public mutation routes** — no unauthenticated endpoints that create/triage/draft/approve/
      send/close. (Enforced today by `validate:route-boundary`; `/api/*` returns 404 in production.)
- [ ] **Protected internal workspace** — the operator workspace is gated behind a verified
      session → active operator; unauthenticated/no-operator/inactive states render no workspace.

## C. Operator Identity & Linkage
- [ ] **Operator table populated** — real operators exist for the production agency (invite-only).
- [ ] **auth_user_id linked** — each production operator's `operators.auth_user_id` is linked to a real
      verified Supabase Auth user.
- [ ] **Suspended/archived/invited blocked** — non-active operators cannot obtain a usable session
      (adapter is active-only; verified by `validate:auth-pipeline` / `validate:operator-session`).
- [ ] Role/agency are server-trusted from the `operators` row, never from client input.

## D. RLS / Data Boundary
- [ ] RLS enabled on tenant tables with policies keyed off the operator row for `auth.uid()`
      (per `PHASE7_RLS_PLAN.md`), proven on dev under real sessions first.
- [ ] Audit table is append-only under RLS (no cross-tenant forge; no UPDATE/DELETE).
- [ ] Server route guards enforce role + tenant before handlers for any write path.

## E. Environment & Deployment
- [ ] **Production environment variables verified** — correct Supabase URL + anon key for production;
      no service-role/secret exposed to the client; the live-data guard does not silently enable live
      mode with the wrong project.
- [ ] **Vercel preview checked** — a preview deployment exercises the auth path before promoting to
      production; no service-role leakage in the preview bundle.
- [ ] Branch protection respected — production only updates via the reviewed `main` flow.

## F. Production Verification Steps (at rollout)
1. Confirm the production bundle contains no service-role key and only the anon key (grep the deployed
   JS, as done for the MMVP gate).
2. Confirm `/api/*` returns 404 (no public routes) and there is no public signup.
3. Confirm an unauthenticated visitor sees only the sign-in surface / safe state — no workspace/data.
4. Confirm a linked active operator resolves to the correct role + tenant scope and capability gating.
5. Confirm a non-operator / inactive operator is safely denied.
6. Confirm RLS denies cross-tenant and wrong-role reads/writes.
7. Confirm audit events are recorded and append-only.
8. Explicit security signoff recorded.

## G. Rollback Plan
- **Auth UI/runtime**: feature-flag the login surface so it can be disabled, returning the app to the
  current read-only/no-auth state without a redeploy where possible.
- **RLS**: a single revert migration disabling policies (per `PHASE7_RLS_PLAN.md`) returns the DB to the
  known-good RLS-off state.
- **Deployment**: production is recoverable by reverting `main` to the last known-good commit
  (currently `d5381fa`) and redeploying; Vercel retains prior deployments for rollback.
- Any rollback is followed by re-running the production verification steps.

## Current Posture (today)
- No auth UI/runtime, no RLS, no API routes, no customer portal, no public signup, no email provider.
- No service-role key in client; no secrets committed. Production remains the safe MMVP read-only build.
- This checklist is the **gate**; none of the production-rollout items are executed in Phase 7.
