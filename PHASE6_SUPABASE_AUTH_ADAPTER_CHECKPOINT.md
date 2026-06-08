# WSS Phase 6O–6Q — Supabase Auth Session Adapter Checkpoint

Status: local-only progress. Not pushed, not deployed. Adapter bridge only — NOT login.
Branch: `phase3-local-foundation`. Latest starting commit: `adc0342`.

## 1) Adapter Model

```
verified Supabase auth.uid()  →  operators.auth_user_id  →  OperatorSession  →  existing auth guards / capability gates
```

- `src/auth/supabaseAuthSessionAdapter.ts` (pure TS, no runtime auth) bridges a VERIFIED Supabase Auth
  principal to an internal `OperatorSession`:
  - `SupabaseAuthPrincipal` — a local TYPE SHAPE of the relevant fields of a verified session's user
    (`id`, `email?`, `aud?`, `role?`, `expiresAt?`). No Supabase Auth client is imported.
  - `normalizeSupabaseAuthPrincipal` / `assertSupabaseAuthPrincipal` — normalize + require a valid UUID
    id. Email is never sufficient; an email-only identity is rejected.
  - `assertAuthAdapterGuard(options)` — local config sanity guard (dev path requires a non-production
    environment + a project ref). Touches no client.
  - `mapAuthPrincipalToOperatorLookup` — reduces a principal to its lookup key, which is ONLY the
    normalized `auth_user_id` (the linkage source of truth) — never the email.
  - `resolveOperatorSessionFromAuthPrincipal(principal, rows, options)` — validates the principal,
    rejects expired sessions, and delegates to the existing `resolveSessionFromAuthUser`
    (active-only). Returns a structured `AuthAdapterResult` (`authenticated`, `session`, `reason`,
    `principalId`); never throws on normal rejection paths.
  - `createUnauthenticatedSessionResult` / `createAuthenticatedOperatorSessionResult` — result helpers.
- No new session logic: resolution reuses `resolveSessionFromAuthUser` → `createOperatorSession` /
  `validateOperatorSession`. Only active operators produce a session; suspended/archived/invited do not.

## 2) Files Created
- `src/auth/supabaseAuthSessionAdapter.ts`
- `scripts/validate-supabase-auth-adapter.mjs`
- `scripts/validate-supabase-auth-adapter-db.mjs`
- `PHASE6_SUPABASE_AUTH_ADAPTER_CHECKPOINT.md`

## 3) Files Modified
- `package.json` — `validate:supabase-auth-adapter`, `validate:supabase-auth-adapter-db` scripts.
- `PHASE6_GATE_TRACKER.md` — added 6O / 6P / 6P-DB / 6Q.

## 4) Validation Evidence (all PASS)
- `npm run lint`, `typecheck`, `build`
- `validate:domain`, `e2e`, `phase2a`, `persistence`, `contracts`, `handlers`, `route-boundary`,
  `ui-boundary`, `readonly-data`, `auth-boundary`, `search-boundary`, `operators`, `operator-seed`,
  `operator-session`, `auth-linkage`
- `validate:supabase-auth-adapter` (new, 20 checks) — valid principal → auth_user_id lookup; invalid
  UUID / missing principal / email-only / unlinked rejected; linked active resolves; suspended/archived/
  invited do not create active sessions; expired principal rejected; resolved session works with
  capability guards; no login UI / middleware / routes / RLS / service-role / Supabase Auth runtime.

## 5) Was DB Validation Performed?
- **Yes** — `validate:supabase-auth-adapter-db` ran against Supabase **dev** (ref `vrtfbbrwrxyljchywmzy`),
  PASS (7 checks): seeded operators exist; linked a seed operator to a SYNTHETIC `auth_user_id`;
  resolved an `OperatorSession` through the adapter from a synthetic principal; capability flags correct
  (gary approve/reject yes, create/send no); an unlinked principal was unauthenticated; the link was
  cleared and operator rows preserved; RLS remained disabled.
- **No real Supabase Auth users were created. No magic links. No login. No RLS.** Post-run query
  confirmed `0` linked operators (dev left clean).

## 6) What Remains Before Login UI
- A real sign-in surface (Supabase Auth) that produces a verified session whose `user` becomes the
  `SupabaseAuthPrincipal`. The adapter then resolves the operator session — no adapter change needed.
- A local-only auth-mode switch to consume `resolveOperatorSessionFromAuthPrincipal` and replace the
  dev operator switcher with the adapter result (behind a flag), still without a login screen.

## 7) What Remains Before Route Protection
- Authenticated server routes (per `PHASE3_ROUTE_SECURITY_PLAN.md`) that, after verifying the session
  server-side, call the adapter to resolve the operator session and enforce role + tenant before
  invoking handlers. No routes/middleware exist yet.

## 8) What Remains Before RLS
- Persist real `operators.auth_user_id` links for authenticated operators.
- Enable RLS on tenant tables with policies keyed off the operator row for `auth.uid()`; re-validate
  guarded flows under RLS.

## 9) Intentionally NOT Built
- No login UI, no signup/password flow, no auth redirects, no magic links, no route middleware.
- No RLS enablement, no public API routes, no customer portal, no email provider.
- No real Supabase Auth users; no Supabase Auth client/runtime dependency; no service-role; no secrets.

## 10) Risks
- The adapter is validated in-memory and against real dev rows, but no operator is persistently linked
  (dev links are set/cleared only during validation). The first persistent link occurs when a real
  verified session is wired in.
- `SupabaseAuthPrincipal` trusts that the caller has ALREADY verified the session server-side; the
  adapter does not verify tokens itself (by design). Token verification must happen upstream before the
  principal is handed to the adapter.
- `auth_user_id` still has no FK to `auth.users`; integrity to a real auth user is enforced once auth is
  wired (optionally via a later FK migration).

## 11) Recommended Next Task
- **B. Create a local-only auth-mode switch to consume the adapter result** — a dev/local toggle in the
  operator workspace that, when enabled, derives the `OperatorSession` from
  `resolveOperatorSessionFromAuthPrincipal` (using a supplied/verified principal) instead of the dev
  role switcher, with NO login screen yet. This exercises the adapter in the UI path. Login UI (C) and
  RLS enablement (D) follow once that local switch is proven; the guarded DB adapter validation (A) is
  already done.

## 12) Confirmations
- No push, no deploy. Production unchanged at `d5381fa`.
