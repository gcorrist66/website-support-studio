# WSS Phase 6I–6K — Runtime Auth Session Resolution Checkpoint

Status: local-only progress. Not pushed, not deployed. Internal-only; no login UI, no runtime auth.
Branch: `phase3-local-foundation`. Starting commit: `646279d`.

## 1) Operator Session Design
Pipeline (all local, pure, no Supabase Auth runtime):

```
Operator Identity (operators row)  →  Operator Session  →  Auth Guards  →  UI Capability Gating
```

- `src/auth/operatorSessionResolver.ts`:
  - `resolveOperatorByEmail(rows, email)` / `resolveOperatorByAuthUserId(rows, authUserId)` — find a
    trusted operator row (already fetched upstream; the resolver never fetches or authenticates).
  - `createOperatorSession(row, options)` — thin wrapper over `mapOperatorRowToSession`; returns a
    usable session only for **active** operators.
  - `resolveOperatorSession(row, options)` — detailed outcome `{ ok, session, reason, operatorStatus,
    pendingInvite }` applying the status policy:
    - active → usable session
    - invited → `pendingInvite: true`, no session (optionally supported, not fully active)
    - suspended / archived → rejected
    - invalid / missing agency / missing role → rejected
  - `validateOperatorSession(session, nowIso?)` — confirms agency + role present and
    `isAuthenticatedOperator` (valid shape, known role, non-expired).

## 2) Capability Model
- `src/auth/operatorCapabilities.ts`: `canSee*` wrappers over the existing Phase 6B auth guards plus
  `canSeeOperatorAdmin` (agency_admin only) and `getOperatorCapabilityFlags(session)`.
- Role → visible actions (authoritative matrix lives in `src/auth/authGuards.ts`):
  - **agency_admin** — full (create, triage, draft, request, approve, reject, send, close, search, operator admin).
  - **cs_agent** — create, triage, draft, request, send, close, search. Not approve/reject/admin.
  - **gary_approver** — approve, reject, close, search. Not create/triage/draft/request/send/admin.
  - **none (signed out)** — nothing.
- The capability layer is advisory for UX and a first gate; the domain/state guards remain authoritative.

## 3) UI Gating Approach
- `src/components/shell/AppShell.tsx`:
  - A **"Operator (Development Mode Only)"** card with a role switcher (Agency Admin / CS Agent /
    Gary Approver / No operator). Clearly labelled as a local capability preview — NOT a sign-in,
    no credential check, no production auth behaviour.
  - `buildDevOperatorSession(role)` (`src/auth/devOperatorSession.ts`) builds a synthetic in-memory
    session via the real resolver; `getOperatorCapabilityFlags` computes visibility.
  - Each workflow action is offered only when **ticket-state eligibility AND operator capability** hold
    (e.g. Approve/Reject only for gary/admin; Send/Create hidden for gary; create form hidden when the
    role cannot create). Existing disabled-state behaviour is preserved.

## 4) Validations (all PASS)
- `npm run lint`, `typecheck`, `build`
- `validate:domain`, `e2e`, `phase2a`, `persistence`, `contracts`, `handlers`, `route-boundary`,
  `ui-boundary`, `readonly-data`, `auth-boundary`, `search-boundary`, `operators`, `operator-seed`
- `validate:operator-session` (new) — active resolves; suspended/archived/missing-agency/missing-role
  rejected; invited not fully active; session created correctly; auth guards consume the session;
  capability mapping matches roles; no login UI / route middleware / API routes / RLS.
- Validator refinements (intent preserved, no guard removed):
  - `validate-readonly-data` `noAuthAddedInUI`: now permits local `src/auth` capability imports while
    still blocking real auth runtime/login (next-auth, supabase.auth, OAuth, login/logout, bearer, SDKs).
  - `validate-auth-boundary`: scans all `src/auth/*.ts` for service-role/runtime (was an exact two-file list).

## 5) What Remains Before Login UI
- A real sign-in surface (e.g. Supabase Auth email magic-link/password) that yields a verified session.
- Replace the dev operator switcher with a session derived from the authenticated principal.
- Session lifecycle UI (signed-in identity, sign-out, expiry handling).

## 6) What Remains Before RLS
- Seed/define `operators.auth_user_id` linkage to `auth.users`.
- Enable RLS on tenant tables with policies keyed off the operator row for `auth.uid()`.
- Re-validate guarded flows under RLS; ensure the dev validators still pass (service-context vs
  authenticated-context).

## 7) What Remains Before Production Auth
- Operator `auth_user_id` linkage + verified sessions + RLS enabled and tested on dev.
- Authenticated server routes (per `PHASE3_ROUTE_SECURITY_PLAN.md`) enforcing role + tenant before
  calling handlers; rate limiting; audit correlation.
- Security signoff; then (separately) any push/deploy. None of this is done or enabled here.

## 8) Confirmations
- No login UI, no auth pages, no route middleware, no API routes, no RLS, no customer portal.
- No service-role key in client code; no secrets committed.
- No push, no deploy; production unchanged at `d5381fa`.
