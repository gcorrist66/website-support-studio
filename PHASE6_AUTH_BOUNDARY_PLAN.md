# WSS Phase 6A — Operator Auth Boundary Plan

Status: planning only. No auth runtime is implemented in this phase.
Authority: local-only. No push, no deploy, no provider integration.

## 1) Current Unauthenticated State
- The production app (`https://website-support-studio.vercel.app/`) ships a read-only operator SPA.
- The production client bundle contains **no Supabase credentials** (the live-data guard requires
  non-`VITE_` `WSS_*` env vars that are absent from the browser bundle), so production runs in
  read-only **mock mode** with no live reads or writes.
- All mutating workflow actions (create/triage/draft/request/approve/reject/send/close) only execute
  in the locally guarded `supabase-dev-readonly` mode, gated by:
  - `WSS_ALLOW_SUPABASE_VALIDATION=dev`
  - `WSS_SUPABASE_ENVIRONMENT` in {dev,development,local}
  - `WSS_SUPABASE_PROJECT_REF=vrtfbbrwrxyljchywmzy`
- There is **no authentication and no authorization of a human operator** anywhere. The handler/service
  layer enforces a *role parameter* (`actorContext.actorRole`) but trusts whatever the caller supplies;
  there is no verified identity behind that role.

## 2) Why Auth Is Required Before Real Internal Use
- Today any caller that can reach the guarded mode can assert any role (including `gary_approver`).
  Role strings are self-asserted, not verified. This is acceptable for local validation but not for
  real internal use.
- Real internal use needs: verified operator identity, a session, role enforcement bound to that
  identity, and tenant scoping so an operator only sees/acts on their agency/client/site.
- The approval gate (Gary approves before send) is only meaningful if "who is Gary" is verified — i.e.
  the `gary_approver` role must be bound to an authenticated principal, not a request field.

## 3) Operator-Only Auth First (Scope)
- Phase 6+ introduces **operator (internal staff) authentication only**.
- **No customer portal / customer authentication** in this track. Customer intake is a separate,
  later, explicitly-gated plan (see `PHASE9_CUSTOMER_INTAKE_PLAN.md`).
- The first deliverable (Phase 6B, this session) is **local TypeScript auth contracts + guards only** —
  no Supabase Auth runtime, no login UI, no route middleware.

## 4) Recommended Operator Roles
- **agency_admin** — full operator capability within their agency scope, including approve/reject and
  close; can act across the agency's clients/sites.
- **cs_agent** — create, triage, draft, request approval, send (post-approval), close; cannot approve
  their own (or any) reply.
- **gary_approver** — the human approval authority: approve/reject; may also close and view; the
  approval gate is bound to this verified role.
- (Internal `system` actor remains for automated/seed paths and is never a login role.)

Mapping to existing domain `ActorRole` (`src/domain/ticketStatus.ts`): operator roles map 1:1 to
`agency_admin`, `cs_agent`, `gary_approver`. `site_user` is **not** an operator role and must be unable
to perform internal operator actions.

## 5) Supabase Auth Recommendation
- Use **Supabase Auth** (email magic-link or email+password to start) for operators, because the data
  already lives in Supabase and RLS can key off `auth.uid()`.
- Maintain an `operators` table keyed by `auth.users.id` holding: `operator_id`, `email`,
  `display_name`, `role`, `agency_id`, optional `client_ids`, optional `site_ids`, `is_active`.
- The operator's role and tenant scope come from this trusted server-side row — **never** from a
  client-supplied field.
- Do not use third-party SSO yet; keep the provider surface minimal.

## 6) Session Handling Plan
- Supabase client session (access + refresh token) stored by the Supabase JS client using its default
  secure storage; `persistSession` enabled only for the authenticated app (the current read-only data
  client keeps `persistSession:false`).
- On load: resolve the session → fetch the operator row → build an in-memory `OperatorSession`
  (see `src/auth/authTypes.ts`) → drive UI capability via guards.
- Sessions expire; the app must treat an expired/absent session as fully unauthenticated (no operator
  actions, read-only or login-gated UI only).
- The local `OperatorSession.expiresAt` contract already models expiry so guards can reject stale
  sessions deterministically (validated in Phase 6B without any runtime auth).

## 7) Route Protection Plan (future, not this session)
- When server routes are introduced (per `PHASE3_ROUTE_SECURITY_PLAN.md`), every mutating route must:
  1. require a valid Supabase session (verified server-side),
  2. resolve the operator row for `auth.uid()`,
  3. enforce role + tenant scope before calling the existing handler functions,
  4. continue to pass tenant + actor context into handlers (handlers stay pure/local).
- No public unauthenticated mutation routes. No "approve-and-send" single step. No autonomous send.

## 8) Role Enforcement Plan
- Two layers, defense in depth:
  - **Capability guards** (`src/auth/authGuards.ts`, Phase 6B): pure functions deciding whether a given
    `OperatorSession` may perform an action — used to drive UI affordances and (later) route checks.
  - **Domain/handler guards** (existing): the lifecycle state machine + `contractGuards` continue to
    enforce state transitions and the approver-only decision paths regardless of the UI.
- The capability layer is **advisory for UX + a first gate**; the domain layer remains the source of
  truth so a forged client cannot bypass approval/state rules.

## 9) RLS Implications
- Enable Row Level Security on all tenant tables (`tickets`, `ticket_*`, `agencies`, `clients`,
  `sites`) once operator auth exists.
- Policies key off the `operators` row for `auth.uid()`:
  - read: rows within the operator's `agency_id` (and, if scoped, `client_ids`/`site_ids`).
  - write: same tenant scope, plus role-appropriate operation (e.g., only `gary_approver`/`agency_admin`
    may write an `approved`/`rejected` approval decision).
- RLS must be additive to (not a replacement for) the domain guards.
- Migration note: today the dev validators run via the `supabase db query` CLI under a service-grade
  connection; enabling RLS must not break those guarded validators — they should move to an
  authenticated/role-scoped path or remain explicitly service-context for local validation only.

## 10) Service-Role Safety Rules
- The service-role key must **never** appear in browser/client code or any bundled file. (Enforced
  today by `validate-ui-boundary` and `validate-readonly-data`.)
- Service-role usage is limited to: migrations, trusted server-side jobs, and local guarded validation
  scripts — never the SPA.
- Phase 6B auth files must contain no service-role references (validated by `validate:auth-boundary`).

## 11) Browser Key Safety Rules
- The browser may only ever hold the **anon** key, and only in authenticated app builds where RLS is on.
- The current read-only data layer already restricts to anon-style keys and rejects `sb_secret_*`
  (`isLikelyAnonKey`). Keep this.
- No key of any kind should be committed; keys come from environment configuration only.

## 12) Migration Considerations
- New `operators` table + RLS policies are additive migrations; no destructive change to existing
  schema.
- Backfill: seed a small set of operator rows (agency_admin, cs_agent, gary_approver) for the real
  agency before enabling RLS-enforced reads in the app.
- Sequence RLS enablement carefully so guarded dev validators and the read-only app continue to pass at
  each step.

## 13) What NOT To Build Yet
- No Supabase Auth runtime wiring in the SPA.
- No login/logout UI.
- No route middleware or server routes.
- No RLS enablement against production data in this session.
- No customer authentication or customer portal.
- No password reset / invite flows yet.

## 14) Recommended Implementation Sequence
1. **6B (this session):** local auth contracts + capability guards + `validate:auth-boundary`
   (no runtime). ✅ allowed tonight.
2. Add `operators` table migration (dev first) + seed rows. (later)
3. Wire Supabase Auth session resolution behind a feature flag in a non-production build. (later)
4. Build login/logout UI; populate `OperatorSession` from the verified operator row. (later)
5. Drive UI affordances from capability guards using the real session. (later)
6. Enable RLS on dev tables; re-validate guarded flows. (later)
7. Introduce authenticated server routes (per Phase 3D plan) with role + tenant enforcement. (later)
8. Production verification + signoff before any public exposure. (later)

## 15) Invariants To Preserve Throughout
- Approval remains a precondition for customer send.
- No autonomous send; send stays explicit and post-approval.
- Customer communication remains persistence-only until the email-provider track is explicitly enabled.
- No service-role key in the browser; no secrets committed.
- Domain/state guards remain authoritative even after auth is added.
