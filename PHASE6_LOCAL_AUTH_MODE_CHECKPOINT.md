# WSS Phase 6R–6U — Local Auth Mode Switch Checkpoint

Status: local-only progress. Not pushed, not deployed. Local/dev preview switch only — NOT login.
Branch: `phase3-local-foundation`. Latest starting commit: `c63a423`.

## 1) Local Auth Mode Model
`src/auth/localAuthMode.ts` lets the operator workspace derive its `OperatorSession` from one of two
LOCAL sources, selected at runtime:

- **`dev_role_switcher`** — `createDevRoleSwitcherAuthState(role)` builds a synthetic dev session via
  the existing `devOperatorSession.ts` factory.
- **`adapter_principal`** — `createAdapterPrincipalAuthState(principal, operatorRows)` resolves a
  session through the REAL adapter (`resolveOperatorSessionFromAuthPrincipal`) from an explicitly
  supplied synthetic auth principal against EXISTING operator linkage rows.

Both return a `LocalAuthModeState { mode, selectedDevRole, syntheticPrincipal?, adapterResult?,
activeSession, capabilityFlags }`. Accessors `getActiveOperatorSession` / `getActiveCapabilityFlags`
feed the UI's existing capability gating. The module is PURE: no login, no redirect, no magic link, no
password, no DB writes, no operator creation/linking. Adapter mode only CONSUMES linkage state; a
missing / invalid / email-only / unlinked principal yields no active session.

Dev preview fixtures (`DEV_ADAPTER_PRINCIPAL_PRESETS`, `DEV_PREVIEW_OPERATOR_ROWS` in
`devOperatorSession.ts`) are in-memory, clearly-labeled synthetic rows representing existing linkage —
never written to any database.

## 2) UI Behavior (`AppShell.tsx`)
- A **"Development Auth Mode"** switch with two options: **Dev Role Switcher** and
  **Adapter Principal Preview**.
- Dev Role Switcher: the existing role dropdown (Agency Admin / CS Agent / Gary Approver / none).
- Adapter Principal Preview: a preset dropdown + free-text **synthetic auth principal id** input
  (id only — no email/password, no login button, no magic link, no real auth user creation). It shows
  whether the principal resolves to an operator session, or **"No linked operator for this principal in
  dev."** when it does not. Capability flags update from the resolved session.
- All ticket actions remain gated by **capability flags AND ticket state**. The UI never writes to
  Supabase.

## 3) Files Created
- `src/auth/localAuthMode.ts`
- `scripts/validate-local-auth-mode.mjs`
- `scripts/validate-local-auth-mode-db.mjs`
- `PHASE6_LOCAL_AUTH_MODE_CHECKPOINT.md`

## 4) Files Modified
- `src/auth/devOperatorSession.ts` — adapter-preview fixtures (presets + in-memory rows).
- `src/components/shell/AppShell.tsx` — Development Auth Mode switch; session/capabilities now flow
  through `localAuthMode`.
- `src/styles.css` — auth-mode + adapter-preview styling.
- `package.json` — `validate:local-auth-mode`, `validate:local-auth-mode-db` scripts.
- `scripts/validate-auth-boundary.mjs` — narrowed the Supabase-runtime pattern (block real `@supabase/`
  imports / `createClient(` / `supabase.auth`; allow local relative imports of our own
  `supabaseAuthSessionAdapter` module). Security intent preserved; no guard removed.
- `PHASE6_GATE_TRACKER.md` — added 6R / 6S / 6T / 6T-DB / 6U.

## 5) Validation Evidence (all PASS)
- `npm run lint`, `typecheck`, `build`
- `validate:domain`, `e2e`, `phase2a`, `persistence`, `contracts`, `handlers`, `route-boundary`,
  `ui-boundary`, `readonly-data`, `auth-boundary`, `search-boundary`, `operators`, `operator-seed`,
  `operator-session`, `auth-linkage`, `supabase-auth-adapter`
- `validate:local-auth-mode` (new, 15 checks) — dev_role_switcher sessions; adapter mode via the real
  resolver; email-only / no-principal / unlinked rejected; adapter writes/links nothing; capability
  flags derive from active session; UI has "Development Auth Mode" and no login/signup/password/
  magic-link wording; no middleware/routes/RLS/service-role.

## 6) Was DB Validation Performed?
- **Yes** — `validate:local-auth-mode-db` ran against Supabase **dev** (ref `vrtfbbrwrxyljchywmzy`),
  PASS (7 checks): linked a seeded operator to a SYNTHETIC `auth_user_id`, resolved an
  `OperatorSession` through `localAuthMode` adapter_principal mode, verified capability flags (cs_agent),
  confirmed nothing was linked by the adapter, cleared the link and preserved rows; RLS remained
  disabled. No real Supabase Auth users, no magic links, no login. Post-run query confirmed `0` linked
  operators (dev left clean).

## 7) What Remains Before Login UI
- A real sign-in surface (Supabase Auth) producing a verified session whose user becomes the
  `SupabaseAuthPrincipal`. The local auth-mode switch is the seam: replace the dev/preview principal
  with the verified one; no adapter or capability change needed.
- A local-only Supabase Auth client wrapper to obtain/verify the session (still no login screen) before
  any login UI is designed.

## 8) What Remains Before Route Protection
- Authenticated server routes (per `PHASE3_ROUTE_SECURITY_PLAN.md`) that verify the session
  server-side, resolve the operator session via the adapter, and enforce role + tenant before handlers.
  No routes/middleware exist yet.

## 9) What Remains Before RLS
- Persist real `operators.auth_user_id` links for authenticated operators; enable RLS on tenant tables
  with policies keyed off the operator row for `auth.uid()`; re-validate guarded flows under RLS.

## 10) Intentionally NOT Built
- No login screen, no signup/password flow, no auth redirects, no magic links, no route middleware.
- No RLS enablement, no public API routes, no customer portal, no email provider.
- No real Supabase Auth users; no Supabase Auth client/runtime dependency; no service-role; no secrets.

## 11) Risks
- Adapter-preview mode in the UI resolves only against the in-memory dev fixture (the browser has no DB
  access and performs no writes). Resolution against real dev linkage is proven by the guarded DB
  validator, not the browser.
- `SupabaseAuthPrincipal` is trusted as already-verified; token verification must happen upstream when a
  real session is wired in.
- `auth_user_id` still has no FK to `auth.users`; integrity is enforced once auth is wired (optionally a
  later FK migration).

## 12) Recommended Next Task
- **C. Create a local-only Supabase Auth client wrapper** — a thin, read-only wrapper that obtains the
  current verified session (if any) and produces a `SupabaseAuthPrincipal`, which the existing
  `localAuthMode` adapter_principal path then consumes. This is the last seam before any login UI: it
  exercises a real verified principal through the adapter without a login screen. Login UI (B) and RLS
  dev enablement (D) follow once the wrapper is proven; the guarded DB auth-mode validation (A) is done.

## 13) Confirmations
- No push, no deploy. Production unchanged at `d5381fa`.
