# WSS Phase 6V–6Y — Auth Pipeline Foundation Checkpoint

Status: local-only progress. Not pushed, not deployed. Final auth plumbing path before login UI — NOT login.
Branch: `phase3-local-foundation`. Latest starting commit: `fafd276`.

## 1) Auth Pipeline Design

```
Supabase session source  →  SupabaseAuthPrincipal  →  SupabaseAuthSessionAdapter  →  OperatorSession  →  Capability Flags
```

- `src/auth/supabaseAuthClientWrapper.ts` (Phase 6V) — read-only mapping of an ALREADY-VERIFIED
  Supabase session/user shape to a `SupabaseAuthPrincipal`:
  - `SupabaseSessionLike` / `SupabaseUserLike` — minimal plain shapes (the fields the wrapper reads).
  - `extractPrincipalFromUser` / `extractPrincipalFromSession` / `getSessionPrincipal` — produce a
    principal (carrying the session expiry, converted from Supabase's unix-seconds `expires_at`); return
    null when there is no user / no id.
  - `createSyntheticSession` / `createSyntheticUser` — DEV-only synthetic fixtures (not real auth).
  - No sign-in/up/out, no password reset, no magic link/OTP, no auth user creation, no DB writes, no
    Supabase client runtime, no network, no secrets. Token verification is assumed upstream.
- `src/auth/authPipeline.ts` (Phase 6W) — composes the full path with pure functions:
  - `resolveOperatorSessionFromSession(session, rows, options)` → `AuthAdapterResult`.
  - `resolveOperatorSessionFromUser(user, rows, options)` → `AuthAdapterResult`.
  - `resolveCapabilityFlagsFromSession(session, rows, options)` → `OperatorCapabilityFlags`.
  - Resolution reuses the existing adapter (`resolveOperatorSessionFromAuthPrincipal`, active-only) and
    `getOperatorCapabilityFlags`. No login, redirects, middleware, writes, or auth creation.

## 2) Files Created
- `src/auth/supabaseAuthClientWrapper.ts`
- `src/auth/authPipeline.ts`
- `scripts/validate-auth-pipeline.mjs`
- `scripts/validate-auth-pipeline-db.mjs`
- `PHASE6_AUTH_PIPELINE_CHECKPOINT.md`

## 3) Files Modified
- `package.json` — `validate:auth-pipeline`, `validate:auth-pipeline-db` scripts.
- `PHASE6_GATE_TRACKER.md` — added 6V / 6W / 6X / 6X-DB / 6Y.

## 4) Validation Evidence (all PASS)
- `npm run lint`, `typecheck`, `build`
- `validate:domain`, `e2e`, `phase2a`, `persistence`, `contracts`, `handlers`, `route-boundary`,
  `ui-boundary`, `readonly-data`, `auth-boundary`, `search-boundary`, `operators`, `operator-seed`,
  `operator-session`, `auth-linkage`, `supabase-auth-adapter`, `local-auth-mode`
- `validate:auth-pipeline` (new, 15 checks) — valid session → principal; principal → operator lookup;
  linked operator → session; capability flags resolve; invalid session / missing user / email-only
  rejected; no DB writes / no mutation; no auth creation / no supabase runtime; no login UI / route
  middleware / API routes / RLS / service-role.

## 5) DB Validation Evidence
- `validate:auth-pipeline-db` ran against Supabase **dev** (ref `vrtfbbrwrxyljchywmzy`), PASS (7 checks):
  linked a seeded operator to a SYNTHETIC `auth_user_id`, built a SYNTHETIC session, ran the FULL
  pipeline (session → principal → adapter → operator session), verified capability flags (gary
  approve/reject), confirmed the pipeline linked nothing, cleared the link and preserved rows; RLS
  remained disabled. No real Supabase Auth users, no magic links, no login. Post-run query confirmed
  `0` linked operators (dev left clean).

## 6) What Remains Before Login UI
- The only missing piece is the actual session SOURCE: a real Supabase Auth session (from a sign-in
  surface). Everything downstream — wrapper → principal → adapter → operator session → capability flags
  → UI gating — is implemented and validated. A login UI plugs a verified session into
  `getSessionPrincipal` / `resolveOperatorSessionFromSession`; no pipeline change is needed.

## 7) What Remains Before Route Protection
- Authenticated server routes (per `PHASE3_ROUTE_SECURITY_PLAN.md`) that verify the session
  server-side, run the pipeline to resolve the operator session, and enforce role + tenant before
  invoking handlers. No routes/middleware exist yet.

## 8) What Remains Before RLS
- Persist real `operators.auth_user_id` links for authenticated operators; enable RLS on tenant tables
  with policies keyed off the operator row for `auth.uid()`; re-validate guarded flows under RLS.

## 9) Intentionally NOT Built
- No login screen, no signup/password flow, no auth redirects, no magic links, no route middleware.
- No RLS enablement, no public API routes, no customer portal, no email provider.
- No real Supabase Auth users; no Supabase Auth client/runtime dependency; no network calls; no
  service-role; no secrets.

## 10) Risks
- The pipeline trusts that the supplied session/user is ALREADY VERIFIED; real token verification must
  happen at the session source (the future login/client integration), not in this pure layer.
- `auth_user_id` still has no FK to `auth.users`; integrity to a real auth user is enforced once auth is
  wired (optionally a later FK migration).
- Browser preview still resolves only against in-memory dev fixtures; resolution against real dev
  linkage is proven by the guarded DB validators, not the browser.

## 11) Recommended Next Task
- **A. Plan login UI** — the full local auth plumbing (session → … → capability flags) is now
  implemented and validated end-to-end (including against dev). The next meaningful step is a written
  login-UI plan: the session source (Supabase Auth sign-in surface), how the verified session feeds
  `getSessionPrincipal`, session lifecycle/expiry handling, and the gating that swaps the dev/preview
  principal for the real one — without yet building screens. Route protection planning (D) and RLS
  planning (C) follow; a local login UI prototype (B) should come only after the plan is reviewed.

## 12) Confirmations
- No push, no deploy. Production unchanged at `d5381fa`.
