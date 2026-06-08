# WSS — Codex Handoff (after Phase 7G)

Purpose: hand off the local-only Phase 7 auth foundation to the next Codex/agent session with the exact
state, guardrails, and next task. **Nothing has been pushed or deployed.**

## 1) Repository State
- **Current branch:** `phase3-local-foundation`
- **Latest local commit:** `8b0bce3 Add Phase 7G dev session read preview`
- **Production commit (live):** `d5381fa Close Phase 5 MMVP production gate` — read-only mock mode, no
  credentials in the client bundle. **Production is unchanged and safe.**
- **Local commits ahead of `origin/phase3-local-foundation`:** **16 (unpushed)**.
- `main` and `origin/main` are identical (0/0); `main` has NOT been touched.

## 2) Completed MMVP Workflow (live in production at d5381fa)
```
Create Ticket → Triage → Draft Reply → Request Approval → Approve / Reject → Send (local-only) → Close
```
- Full lifecycle implemented, validated, and production-verified. Customer "send" is persistence-only
  (no real email, no provider). No public mutation surface, no auth wall, no service-role in the bundle.

## 3) Completed Auth Foundation (local only, not wired to a real login)
All of the following exist locally on `phase3-local-foundation` and are validated; none is enabled in
production:
- **Operators identity:** `operators` table migrated to Supabase **dev** (RLS disabled); 3 dev operators
  seeded; persistence types/mappers.
- **Capability guards:** `src/auth/authTypes.ts`, `authGuards.ts`, `operatorCapabilities.ts` (role →
  capability flags; separation of duties).
- **Session resolution + linkage:** `operatorSessionResolver.ts`, `operatorIdentityLinking.ts`
  (active-only; `auth_user_id` is the linkage source of truth; never email).
- **Supabase auth adapter:** `supabaseAuthSessionAdapter.ts` (verified principal → OperatorSession).
- **Auth client wrapper + pipeline:** `supabaseAuthClientWrapper.ts`, `authPipeline.ts`
  (session/user shape → principal → adapter → operator session → capability flags).
- **Local auth mode switch:** `localAuthMode.ts` + AppShell "Development Auth Mode".
- **Login shell simulator:** `loginShellState.ts` + `components/auth/LoginShell.tsx` + AppShell "Auth
  View" toggle (8 modeled states; simulator only, no real auth/protection).
- **Plans:** `PHASE7_LOGIN_UI_PLAN.md` (recommends invite-only first, then Supabase OTP/magic link),
  `PHASE7_ROUTE_PROTECTION_PLAN.md`, `PHASE7_RLS_PLAN.md`, `PHASE7_PRODUCTION_AUTH_SAFETY_CHECKLIST.md`.

The full chain is implemented and proven end-to-end:
```
verified session (plain shape) → SupabaseAuthPrincipal → auth pipeline → OperatorSession → capability flags
```
The **only** missing piece is the real session SOURCE (a sign-in surface).

## 4) Latest Phase 7G Result — Dev-Only Supabase Session Read
- New module `src/auth/devSupabaseSessionRead.ts`: `DevSupabaseSessionReadMode`
  (`disabled | synthetic_session | existing_session_shape`) + `createDisabled/Synthetic/
  ExistingSessionShapeReadState`, `resolveDevSessionReadPipeline`, `describeDevSessionReadState`.
  Read-only; reuses `getSessionPrincipal` + auth pipeline; consumes plain session-like objects only.
- AppShell "Development Session Read Preview" card: choose mode + a synthetic principal id (preset or
  free text); shows principal extracted, operator session resolved (role/name) or
  **"No linked operator for this session principal."**, and capability flags. No real sign-in, no
  redirect, no writes, no operator linking.
- **Guarded DB validation ran against Supabase dev** (ref `vrtfbbrwrxyljchywmzy`): linked a seeded
  operator to a SYNTHETIC `auth_user_id`, ran the read path with a SYNTHETIC session, verified the
  OperatorSession + capability flags (cs_agent), cleared the link, RLS stayed disabled, dev left clean
  (0 linked). No real auth users, no sign-in.

## 5) Validations Passed (Phase 7G session — all PASS)
- `npm run lint`, `typecheck`, `build`
- `validate:domain`, `e2e`, `phase2a`, `persistence`, `contracts`, `handlers`, `route-boundary`,
  `ui-boundary`, `readonly-data`, `auth-boundary`, `search-boundary`, `operators`, `operator-seed`,
  `operator-session`, `auth-linkage`, `supabase-auth-adapter`, `local-auth-mode`, `auth-pipeline`,
  `auth-plans`, `login-shell`, `dev-session-read` (16 checks)
- Guarded dev DB: `validate:dev-session-read-db` (7 checks) PASS; dev left clean.
- No existing validation was weakened across Phase 6–7.

## 6) Intentionally NOT Built
- No real login UI / sign-in surface; no signup/password flow; no magic links; no auth redirects.
- No route middleware; no public API routes; no customer portal; no email provider.
- No RLS enabled (no RLS migration); no real Supabase Auth users created.
- No service-role key in client/bundle; no secrets committed.
- No push, no deploy, no Vercel trigger; `main` untouched.

## 7) Current Risks
- **Simulator/preview ≠ protection.** The login shell and session-read preview are visualizations
  driven by synthetic sessions and in-memory dev fixtures. Real protection requires a verified session
  source + (later) server route guards + RLS. Do not mistake the preview for enforcement.
- **Trusted-upstream assumption.** The pipeline treats the supplied session as ALREADY verified; real
  token verification must happen at the session source when a real login is wired in.
- **`auth_user_id` has no FK to `auth.users`** yet (dev links are synthetic and reversible); integrity
  is enforced when real auth lands (optionally a later FK migration).
- **RLS sequencing is the highest-risk operational step** (lockout / validator coupling); follow the
  staged dev-first plan in `PHASE7_RLS_PLAN.md` and keep a service-context path for validators.
- **16 unpushed commits** live only on this machine's branch; they are not backed up to origin.

## 8) Exact Next Recommended Codex Task
**Login UI prototype PLAN (planning only — no screens, no real auth).**
- Create `PHASE7_LOGIN_UI_PROTOTYPE_PLAN.md` describing the actual sign-in surface (the session source):
  how a verified Supabase Auth session is obtained and handed to `getSessionPrincipal` / the dev
  session-read path; session lifecycle (loading/active/expired/no-operator) mapped to the existing
  `loginShellState`; the dev-flag behind which a prototype would sit; and the failure states
  (no operator / suspended / archived) reusing the adapter (active-only).
- Add a `validate:login-ui-prototype-plan` style doc-validator if useful (assert the plan exists +
  states no public signup / no service-role in browser / no RLS until auth proven / invite-only-first).
- Keep it consistent with `PHASE7_LOGIN_UI_PLAN.md` (invite-only first, then Supabase OTP/magic link).
- A **local** login UI prototype (still dev-flagged, feeding a synthetic/verified session into the
  proven pipeline) may follow ONLY after the plan is reviewed. Route protection and RLS remain on their
  own gated tracks.

## 9) Strict Guardrails (must hold for the next session)
- **Do NOT push. Do NOT deploy. Do NOT push `main`. Do NOT trigger Vercel.**
- **Do NOT add a real login form, signup, or password flow. Do NOT send magic links. Do NOT add auth
  redirects.**
- **Do NOT add route middleware. Do NOT add public API routes. Do NOT add a customer portal. Do NOT add
  an email provider.**
- **Do NOT enable RLS. Do NOT create real Supabase Auth users.**
- **Do NOT put a service-role key in client/browser code. Do NOT commit secrets.**
- **Do NOT weaken or delete existing validations.** If a validator conflicts with newly-authorized work,
  refine it precisely (preserving the security intent) and document why — never remove a guard.
- Guarded Supabase checks: dev project ref `vrtfbbrwrxyljchywmzy` only, behind
  `WSS_ALLOW_SUPABASE_VALIDATION=dev WSS_SUPABASE_ENVIRONMENT=dev WSS_SUPABASE_PROJECT_REF=…`; always
  clean up (no lingering `auth_user_id` links); run sequentially (the shared dev DB contends under
  concurrency).
- Work local-first: small commits, run the full validation suite, update the gate tracker + a checkpoint
  doc each phase. Production stays at `d5381fa` until an explicit, reviewed production gate.

## 10) Confirmations
- Branch `phase3-local-foundation`; HEAD `8b0bce3`; 16 commits ahead of origin (unpushed); `main`
  untouched. Not pushed. Not deployed. Production unchanged and safe at `d5381fa`.
