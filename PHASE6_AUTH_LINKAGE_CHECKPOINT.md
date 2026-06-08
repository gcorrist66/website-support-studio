# WSS Phase 6L–6N — Operator ↔ Supabase Auth Linkage Checkpoint

Status: local-only progress. Not pushed, not deployed. Linkage foundation only — NOT login.
Branch: `phase3-local-foundation`. Latest starting commit: `e615641`.

## 1) Linkage Model

```
Supabase Auth User  →  auth_user_id  →  operators row  →  OperatorSession
```

- A Supabase Auth user (future) is linked to exactly one internal operator via `operators.auth_user_id`.
- `auth_user_id` is a nullable `uuid` with a partial unique index (one auth user ↔ one operator); it has
  no FK to `auth.users` yet, so dev linkage can use a synthetic uuid reversibly.
- `src/auth/operatorIdentityLinking.ts` (pure TS, no runtime auth) models the linkage:
  - `normalizeAuthUserId` / `isValidAuthUserId` — UUID validation + normalization (lowercase).
  - `isOperatorLinked` / `assertOperatorCanBeLinked` — link eligibility (ACTIVE operators only).
  - `linkOperatorToAuthUser` — pure transform setting `auth_user_id`; rejects non-active operators,
    invalid UUIDs, re-link to a different id, and (with `existingRows`) ids already owned by another
    operator. agency_id and role are preserved — linking never elevates permissions.
  - `unlinkOperatorFromAuthUser` — clears `auth_user_id`, preserves the operator row.
  - `resolveOperatorFromAuthUser` — unique lookup (throws on duplicate; undefined when absent).
  - `resolveSessionFromAuthUser` — resolves an `OperatorSession` via the existing
    `createOperatorSession` / `validateOperatorSession` (active-only).

## 2) Files Created
- `src/auth/operatorIdentityLinking.ts`
- `scripts/validate-auth-linkage.mjs`
- `scripts/validate-auth-linkage-db.mjs`
- `PHASE6_AUTH_LINKAGE_CHECKPOINT.md`

## 3) Files Modified
- `package.json` — `validate:auth-linkage`, `validate:auth-linkage-db` scripts.
- `PHASE6_GATE_TRACKER.md` — added 6L / 6M / 6M-DB / 6N.

## 4) Validation Evidence (all PASS)
- `npm run lint`, `typecheck`, `build`
- `validate:domain`, `e2e`, `phase2a`, `persistence`, `contracts`, `handlers`, `route-boundary`,
  `ui-boundary`, `readonly-data`, `auth-boundary`, `search-boundary`, `operators`, `operator-seed`,
  `operator-session`
- `validate:auth-linkage` (new, 19 checks) — UUID accept/reject; active link; suspended/archived
  rejected; invited → no session; resolve by auth_user_id; unlinked fails cleanly; duplicate rejected;
  role/agency preserved; unlink preserves row; resolved session works with auth guards; no login UI /
  middleware / routes / RLS / Supabase Auth runtime.

## 5) Was DB Linkage Validation Performed?
- **Yes** — `validate:auth-linkage-db` ran against Supabase **dev** (ref `vrtfbbrwrxyljchywmzy`), PASS (7 checks):
  seeded operators exist; linked one seed operator to a SYNTHETIC `auth_user_id`; read-back ok; the
  partial unique index rejected a duplicate link (no side effect on the second operator); the link was
  cleared and operator rows preserved; RLS remained disabled.
- **No real Supabase Auth users were created. No magic links. No login. No RLS.** Post-run query
  confirmed `0` linked operators (dev left clean).

## 6) What Remains Before Login UI
- A real sign-in surface that yields a verified Supabase Auth session, then `resolveSessionFromAuthUser`
  using the verified `auth.uid()` against the operator rows (replacing the dev operator switcher).
- A local-only Supabase Auth session adapter (read the session, look up the operator, build the session).

## 7) What Remains Before RLS
- Populate real `operators.auth_user_id` links (per agency) for authenticated operators.
- Enable RLS on tenant tables with policies keyed off the operator row for `auth.uid()`.
- Re-validate guarded flows under RLS (service-context for dev validators vs authenticated-context).

## 8) Intentionally NOT Built
- No login UI, no signup/password flow, no auth redirects, no route middleware.
- No RLS enablement, no public API routes, no customer portal, no email provider.
- No real Supabase Auth users, no magic links, no credentials; no service-role in client; no secrets committed.

## 9) Risks
- The linkage helpers are validated in-memory and against the real dev table shape, but no operator is
  persistently linked (dev links are set/cleared only during validation) — the first real link will
  occur when the Supabase Auth session adapter is built.
- `auth_user_id` has no FK to `auth.users` yet; integrity between a link and a real auth user will be
  enforced once auth is wired (and optionally via a FK in a later migration).

## 10) Recommended Next Task
- **B. Begin a local-only Supabase Auth session adapter** — a read-only adapter that, given a verified
  session's `auth.uid()`, looks up the operator row and builds the `OperatorSession` via
  `resolveSessionFromAuthUser`, behind a local/dev flag and with NO login UI yet. This is the natural
  next step now that the linkage foundation + dev DB behavior are proven. RLS enablement (C) and the
  login UI plan (D) follow once the adapter path is exercised locally.

## 11) Confirmations
- No push, no deploy. Production unchanged at `d5381fa`.
