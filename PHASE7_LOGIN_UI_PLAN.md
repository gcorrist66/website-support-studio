# WSS Phase 7A — Login UI + Auth Rollout Plan (Planning Only)

Status: planning only. No login UI, no auth pages, no auth runtime, no RLS, no routes are built here.
Authority: local doc. No push, no deploy. Production unchanged at `d5381fa`.

## 1) Current State
- **No login UI**, no auth pages, no sign-in surface of any kind.
- **No route middleware**, no public API routes, no customer portal.
- **No RLS** enabled on any table (operators or tenant tables).
- The full **local auth pipeline is complete and validated** (incl. against Supabase dev):
  - `src/auth/supabaseAuthClientWrapper.ts` — maps an already-verified session/user → `SupabaseAuthPrincipal` (read-only; no Supabase client runtime).
  - `src/auth/supabaseAuthSessionAdapter.ts` — principal → `OperatorSession` (active-only; auth_user_id is the lookup key; email never trusted alone).
  - `src/auth/authPipeline.ts` — `resolveOperatorSessionFromSession` / `…FromUser` / `resolveCapabilityFlagsFromSession`.
  - `src/auth/operatorSessionResolver.ts`, `operatorIdentityLinking.ts`, `operatorCapabilities.ts`, `authGuards.ts` — resolution, linkage, capability flags, role guards.
  - `src/auth/localAuthMode.ts` + the AppShell "Development Auth Mode" switch — dev preview of the adapter path.
- The **operators table exists in Supabase dev**, is **seeded** (3 dev operators), and the
  **`auth_user_id` linkage** + adapter + pipeline have been verified end-to-end against dev (set/clear
  of a synthetic `auth_user_id`, resolved through the pipeline, cleaned up). RLS stayed disabled.
- The only missing piece before a login UI is the **session SOURCE** (a real verified Supabase Auth
  session). Everything downstream is implemented.

## 2) Recommended Auth Method
Options considered:
- **A — Supabase email OTP / magic link**: low friction, no password storage; but it implies an email
  send surface and a "request link" flow that looks like self-service.
- **B — Supabase email/password**: familiar; but introduces password storage/reset flows and a larger
  attack surface we don't need for a small internal operator set.
- **C — Invite-only operator setup first**: operators are provisioned by an admin (the `operators` row
  is created and, later, linked to a real auth user); only known, pre-provisioned operators can ever
  obtain a session.

**Recommendation: Invite-only operator setup first, then Supabase OTP/magic link later (C → A).**

Why:
- The system is a **small internal operator tool**, not a public product — there should be **no public
  signup** and no way for an unknown person to create access.
- Invite-only matches the existing model: an operator only works if there is an **active `operators`
  row linked to a verified `auth_user_id`**. The `operators` table is the gate; auth is just identity.
- It is the **safest first step**: we can link a real dev auth user to a seeded operator and prove the
  end-to-end path before any self-service surface exists.
- OTP/magic link can be **layered on later** as the sign-in mechanism for those invited operators —
  passwordless, minimal storage — once the invite + linkage + protection model is proven. Email/password
  (B) can remain a fallback option but is not the first choice (more surface, no real benefit here).

## 3) Login UI Scope (future)
The future login screen must:
- Collect **email only** (when using OTP) — no password field unless option B is later chosen.
- **Never expose the service-role key** (browser holds the anon key only).
- **Never allow public signup** — no "create account" path.
- **Only allow known operators** — a verified session resolves to an operator **only** via an existing,
  active `operators` row linked by `auth_user_id`.
- Show a **safe failure if no operator row exists** for the verified auth user (generic "not an
  operator / access not provisioned"), without leaking whether the email exists.
- Show a **safe failure if the operator is inactive / suspended / archived** (generic "access
  unavailable").
- Feed the **verified session into the existing auth pipeline** (`getSessionPrincipal` →
  `resolveOperatorSessionFromSession` → `OperatorSession` → capability flags) — no new resolution logic.

## 4) Session Lifecycle (states the UI must handle)
- **loading** — resolving the current session; show a neutral loading state, no actions.
- **unauthenticated** — no session; show the sign-in surface only; no operator workspace.
- **authenticated but no operator** — verified auth user with no linked active `operators` row →
  safe "access not provisioned" state; no workspace, no actions.
- **authenticated + linked active operator** — full operator workspace, gated by capability flags +
  ticket state (exactly today's gating, driven by the real session).
- **suspended / archived (or invited)** — resolves to no usable session (adapter is active-only) →
  safe "access unavailable" state.
- **expired session** — treated as unauthenticated; principal/operator session is rejected on expiry.
- **sign out (later)** — clears the session and returns to unauthenticated; no destructive side effects.

## 5) Operator Resolution
```
Session
  → Principal (SupabaseAuthPrincipal, id = auth.uid())
  → auth_user_id (lookup key; never email)
  → operators row (active, in-agency)
  → OperatorSession
  → capability flags (UI gating)
```
This is already implemented by `authPipeline.ts` + the adapter/resolver/capabilities; the login UI only
supplies the verified session at the top.

## 6) Failure States (all resolve to "no active session" / safe copy)
- **no auth user** — no verified session → unauthenticated.
- **auth user not linked to an operator** — no `operators` row for that `auth_user_id` →
  `no_active_operator_for_principal`.
- **operator inactive** — suspended/archived/invited → no usable session.
- **operator wrong tenant** — capability/tenant guards (`operatorCanAccessTenant`) deny out-of-scope
  views/actions; resolution must never cross tenant boundaries.
- **missing agency** — a row without `agency_id` fails validation → no session.
- **unknown role** — a role outside `agency_admin|cs_agent|gary_approver` fails validation → no session.

## 7) What NOT To Build Yet
- No public signup; no customer login; no customer portal.
- No RLS yet; no API routes yet; no route middleware yet.
- No production auth rollout; no real Supabase Auth users created here; no magic links sent.
- No email provider (OTP delivery is a later, separately-gated concern).

## 8) Recommended Implementation Sequence
1. **Phase 7B (later) — local login shell**: a local-only, behind-a-dev-flag sign-in placeholder that
   feeds a (still synthetic) verified session into the pipeline. No real auth, no email.
2. **Phase 7C (later) — dev-only Supabase Auth session read**: a read-only client that obtains the
   current verified session in dev and produces a `SupabaseAuthPrincipal` (no sign-in flow yet).
3. **Phase 7D (later) — link a real dev auth user to a seeded operator**: create ONE real dev auth user
   (dev project only) and set `operators.auth_user_id`; prove the pipeline resolves it.
4. **Phase 7E (later) — protect the UI locally**: gate the operator workspace behind a resolved session
   (client-side app guard) in dev.
5. **Phase 7F (later) — RLS plan** (see `PHASE7_RLS_PLAN.md`), then **7G — RLS dev apply**.
6. **Phase 7H (later) — production gate**: full safety checklist
   (`PHASE7_PRODUCTION_AUTH_SAFETY_CHECKLIST.md`) + verification before any production exposure.

Each step stays gated, local-first, and independently validated; nothing is pushed or deployed until the
production gate.
