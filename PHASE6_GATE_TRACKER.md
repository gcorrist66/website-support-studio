# WSS Phase 6 Gate Tracker — Operator Identity

Gated model: Diagnosed → Fixed Locally → Committed → Pushed → Deployed → Production Verified → Closed.

Local-only branch work. For every item below: Pushed / Deployed / Production Verified / Closed = not complete.
Production remains safe at `d5381fa` (read-only mock mode). Nothing pushed, nothing deployed.
Phase 6F has been applied to the Supabase **dev** project only (ref `vrtfbbrwrxyljchywmzy`); the
production customer database is untouched and RLS remains disabled.

Starting commit: `215ea49`.
Session commits: `e97d112` (6C migration), `364b209` (6D/6E/6G code), `8181d0b` (checkpoint),
plus the dev-apply evidence commit.

## Phase 6A — Operator Auth Boundary Plan
- Diagnosed: complete · Fixed Locally: complete (`PHASE6_AUTH_BOUNDARY_PLAN.md`) · Committed: complete (`f36ef0e`)
- Pushed/Deployed/Verified/Closed: not complete
- Planning only; no auth runtime.

## Phase 6B — Local Auth Contracts / Guards
- Diagnosed: complete · Fixed Locally: complete (`src/auth/authTypes.ts`, `src/auth/authGuards.ts`) · Committed: complete (`f36ef0e`)
- Pushed/Deployed/Verified/Closed: not complete
- Validation: `validate:auth-boundary` PASS. Local TS only; no Supabase Auth runtime, no login UI, no routes.

## Phase 6C — Operators Table Migration
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (`e97d112`)
- Pushed/Deployed/Verified/Closed: not complete
- File: `supabase/migrations/20260608090609_phase6c_operator_identity_foundation.sql`
- operators table + operator_role/operator_status enums + constraints + indexes + comments.
- RLS intentionally NOT enabled. Not yet applied to Supabase dev (see 6F).

## Phase 6D — Operator Persistence Types / Mappers
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (`364b209`)
- Pushed/Deployed/Verified/Closed: not complete
- Files: `src/persistence/operatorTypes.ts`, `src/persistence/operatorMappers.ts`
- Pure shapes + validation + row→session mapping. No Supabase client/auth, no service-role.

## Phase 6E — Operator Validation
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (`364b209`)
- Pushed/Deployed/Verified/Closed: not complete
- File: `scripts/validate-operators.mjs` (`npm run validate:operators`) — PASS (21 checks).
  Migration/file checks + type/guard checks (roles align, mapping, capabilities, rejection paths).

## Phase 6F — Dev Apply (Supabase dev only)
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (apply-evidence commit)
- Pushed/Deployed/Verified/Closed: not complete (production unaffected)
- Status: **APPLIED to the Supabase DEV project only (project ref `vrtfbbrwrxyljchywmzy`).**
- Method: reviewed migration → `npm run lint/typecheck/build`, `validate:operators`, `validate:operator-seed`
  all PASS → confirmed linked ref `vrtfbbrwrxyljchywmzy` → `supabase db push --dry-run` (only the
  phase6c migration pending) → `supabase db push --yes --linked`. No `--include-seed` (no seed data).
- Apply result: `Applying migration 20260608090609_phase6c_operator_identity_foundation.sql ... Finished`.
  Benign notices only (pgcrypto already exists; trigger drop-if-exists no-op).
- Remote verification (via `supabase db query`):
  - `public.operators` table exists; `relrowsecurity = false` (RLS NOT enabled).
  - `operator_role` enum = agency_admin, cs_agent, gary_approver.
  - `operator_status` enum = active, invited, suspended, archived.
  - Indexes present: operators_pkey, operators_agency_email_unique, operators_auth_user_id_unique_idx,
    operators_agency_id_idx, operators_email_idx, operators_role_idx, operators_status_idx,
    operators_agency_role_idx, operators_agency_status_idx.
  - Row count = 0 (no rows inserted).
  - `supabase migration list` now shows 20260608090609 on both Local and Remote.
- Production customer DB: untouched. No RLS enabled. No seed inserted.

## Phase 6G — Operator Dev Seed (APPLIED to dev)
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (seed commit)
- Pushed/Deployed/Verified/Closed: not complete (production unaffected)
- Status: **APPLIED to Supabase DEV only** (ref `vrtfbbrwrxyljchywmzy`). Three operators seeded
  idempotently under a synthetic dev seed agency. No production data; no auth linkage; no RLS.
- Files: `supabase/seed/phase6g_dev_operators.sql`, `scripts/seed-operators-dev.mjs`
  (`npm run seed:operators-dev`), `scripts/validate-operator-seed-db.mjs`
  (`npm run validate:operator-seed-db`), `scripts/validate-operator-seed.mjs` (shape-only).
- Evidence: `validate:operator-seed-db` PASS (operators inserted, roles correct, unique respected,
  auth_user_id null, active, RLS disabled, rows map to capable sessions, rerun-safe). Direct query:
  `count(public.operators) = 3` (no duplicates after applying twice).
- Cleanup: `delete from public.operators where agency_id='00000000-0000-4000-8000-0000000000a6';`
  (then optionally remove the seed agency). See `PHASE6_OPERATOR_DEV_SEED_PLAN.md`.

## Phase 6H — Local Checkpoint
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (checkpoint commit)
- Pushed/Deployed/Verified/Closed: not complete
- Files: `PHASE6_OPERATOR_IDENTITY_CHECKPOINT.md`, this tracker.

## Phase 6I — Runtime Auth Session Resolution
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6I commit)
- Pushed/Deployed/Verified/Closed: not complete
- File: `src/auth/operatorSessionResolver.ts` — `resolveOperatorSession`, `createOperatorSession`,
  `resolveOperatorByEmail`, `resolveOperatorByAuthUserId`, `validateOperatorSession`. Pure, local;
  active-only (suspended/archived rejected; invited surfaced but not fully active); agency + role
  required. No Supabase Auth runtime, no login UI, no routes, no RLS.

## Phase 6J — Local UI Capability Gating
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6J commit)
- Pushed/Deployed/Verified/Closed: not complete
- Files: `src/auth/operatorCapabilities.ts` (`canSee*` over the existing guards),
  `src/auth/devOperatorSession.ts` (DEV-only synthetic session factory),
  `src/components/shell/AppShell.tsx` (operator switcher "Development Mode Only"; actions gated by
  capability AND ticket state; create form gated by capability), `src/styles.css`.
- Note: refined `scripts/validate-readonly-data.mjs` (`noAuthAddedInUI`) to permit local
  `src/auth` capability imports while still blocking real auth runtime/login (next-auth, supabase.auth,
  OAuth, login/logout, bearer, auth SDKs); and `scripts/validate-auth-boundary.mjs` to scan all
  `src/auth/*.ts` for service-role/runtime (instead of an exact two-file list). Security intent preserved;
  no guard removed.

## Phase 6K — Validation + Checkpoint
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6K commit)
- Pushed/Deployed/Verified/Closed: not complete
- File: `scripts/validate-operator-session.mjs` (`npm run validate:operator-session`) — PASS:
  active resolves; suspended/archived/missing-agency/missing-role rejected; invited not fully active;
  session created correctly; auth guards consume the session; capability mapping matches roles;
  no login UI / route middleware / API routes / RLS introduced. Checkpoint: `PHASE6_RUNTIME_AUTH_CHECKPOINT.md`.

## Phase 6L — Operator ↔ Supabase Auth Linkage Helpers
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6L commit)
- Pushed/Deployed/Verified/Closed: not complete
- File: `src/auth/operatorIdentityLinking.ts` — `normalizeAuthUserId`, `isValidAuthUserId`,
  `isOperatorLinked`, `assertOperatorCanBeLinked`, `linkOperatorToAuthUser`,
  `unlinkOperatorFromAuthUser`, `resolveOperatorFromAuthUser`, `resolveSessionFromAuthUser`.
  Pure TS. Active-only linking; UUID-validated; one auth_user_id ↔ one operator; agency/role
  preserved (no elevation); unlink preserves the row. No Supabase Auth runtime, no login.

## Phase 6M — Auth Linkage Validation
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6M commit)
- Pushed/Deployed/Verified/Closed: not complete
- File: `scripts/validate-auth-linkage.mjs` (`npm run validate:auth-linkage`) — PASS (19 checks):
  UUID accept/reject; active link; suspended/archived rejected; invited→no session; resolve by
  auth_user_id; unlinked fails cleanly; duplicate rejected; role/agency preserved; unlink preserves
  row; resolved session works with auth guards; no login UI / middleware / routes / RLS / Supabase Auth runtime.

## Phase 6M-DB — Dev Linkage DB Validation (performed)
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6M commit)
- Pushed/Deployed/Verified/Closed: not complete (dev only; production untouched)
- File: `scripts/validate-auth-linkage-db.mjs` (`npm run validate:auth-linkage-db`, guarded) — PASS (7 checks).
  Ran against Supabase dev (ref `vrtfbbrwrxyljchywmzy`): seeded operators exist; linked a seed operator
  to a SYNTHETIC auth_user_id; read-back ok; the partial unique index rejected a duplicate link; the
  link was cleared and the operator rows preserved; RLS remained disabled. No real auth users created;
  no login; dev left clean (0 linked operators).

## Phase 6N — Checkpoint
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6N commit)
- File: `PHASE6_AUTH_LINKAGE_CHECKPOINT.md`, this tracker.

## Phase 6O — Local Supabase Auth Session Adapter
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6O commit)
- Pushed/Deployed/Verified/Closed: not complete
- File: `src/auth/supabaseAuthSessionAdapter.ts` — `SupabaseAuthPrincipal` (type shape only),
  `SupabaseAuthSessionAdapterOptions`, `normalizeSupabaseAuthPrincipal`, `assertSupabaseAuthPrincipal`,
  `assertAuthAdapterGuard`, `mapAuthPrincipalToOperatorLookup`, `resolveOperatorSessionFromAuthPrincipal`,
  `createUnauthenticatedSessionResult`, `createAuthenticatedOperatorSessionResult`. Pure TS; bridges a
  verified `auth.uid()` → `operators.auth_user_id` → `OperatorSession` via the existing
  `resolveSessionFromAuthUser`. Linkage source of truth is auth_user_id (never email). No Supabase Auth
  runtime/login, no service-role, no secrets.

## Phase 6P — Adapter Validation
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6P commit)
- Pushed/Deployed/Verified/Closed: not complete
- File: `scripts/validate-supabase-auth-adapter.mjs` (`npm run validate:supabase-auth-adapter`) — PASS (20 checks):
  valid principal → auth_user_id lookup; invalid UUID / missing principal / email-only / unlinked rejected;
  linked active resolves; suspended/archived/invited do not create active sessions; expired principal
  rejected; resolved session works with capability guards; no login UI / middleware / routes / RLS /
  service-role / Supabase Auth runtime.

## Phase 6P-DB — Dev Adapter DB Validation (performed)
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6P commit)
- Pushed/Deployed/Verified/Closed: not complete (dev only; production untouched)
- File: `scripts/validate-supabase-auth-adapter-db.mjs` (`npm run validate:supabase-auth-adapter-db`, guarded) — PASS (7 checks).
  Ran against Supabase dev (ref `vrtfbbrwrxyljchywmzy`): linked a seeded operator to a SYNTHETIC
  auth_user_id, resolved an `OperatorSession` through the adapter from a synthetic principal, verified
  capability flags (gary approve/reject), confirmed an unlinked principal is unauthenticated, then
  cleared the link and preserved rows; RLS remained disabled. No real auth users, no magic links, no
  login; dev left clean (0 linked operators).

## Phase 6Q — Checkpoint
- Diagnosed: complete · Fixed Locally: complete · Committed: complete (6Q commit)
- File: `PHASE6_SUPABASE_AUTH_ADAPTER_CHECKPOINT.md`, this tracker.

## Safety Posture (unchanged)
- No push, no deploy, no Vercel trigger.
- No RLS enabled, no login UI, no public API routes, no customer portal, no email provider.
- No production data changes; no secrets committed; no service-role key in client code.
- No existing validation weakened; MMVP workflow unchanged. Dev auth_user_id linkage/adapter checks are
  reversible metadata tests only (no real Supabase Auth users, no magic links, no credentials).
