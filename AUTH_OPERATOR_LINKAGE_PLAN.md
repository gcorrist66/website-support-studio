# WSS Operator Auth Linkage — Plan (Highest-Priority Blocker)

**Date:** 2026-06-08
**Status:** Design/plan pass. No code, no SQL, no migrations, no commits.
**Source of truth:** `AUTH_FOUNDATION_PLAN.md`, `AUTH_CUSTOMER_IDENTITY_DESIGN.md`, `AUTH_TENANT_MODEL_DECISION.md`, `AUTH_RLS_DESIGN_PHASE_E.md`.
**Why now:** Phase E (RLS) cannot be enabled or even tested until operators are bound to `auth.users` — operator policies key on `auth.uid() = operators.auth_user_id`, which is NULL for everyone today.

---

## 1. Current operator model (audit)

**Table `public.operators`** (Phase 6C):
- `id uuid pk`; **`auth_user_id uuid` — nullable, NO FK to `auth.users`**, partial-unique-when-not-null (`operators_auth_user_id_unique_idx`).
- `agency_id uuid NOT NULL` → `agencies(id)`; `email text` (lowercase + non-blank checks); `display_name`; `role` enum (`agency_admin | cs_agent | gary_approver`); `status` enum (`active | invited | suspended | archived`, default active); optional `client_ids[]`/`site_ids[]` (null = agency-wide); `last_seen_at`; timestamps.
- Constraints: unique `(agency_id, email)`; indexes on agency/email/role/status (+ composites). `updated_at` trigger via shared `touch_updated_at()`. **RLS not enabled.**

**Rows / linkage state:**
- **Production: ZERO operators.** No migration inserts operators; the canonical `website-support-studio` agency (created in Phase D) has no staff rows.
- **Dev only:** the `phase6g_dev_operators` *seed* (NOT a migration) inserts 3 operators (agency_admin, cs_agent, gary_approver) under the **dev seed agency** `…00a6`, `@wss-dev.test`, status active, **`auth_user_id` NULL**.
- **`auth_user_id` is unlinked everywhere.** No operator can resolve a session from a real Supabase user yet.

**Already built (reusable, pure):** `src/auth/operatorIdentityLinking.ts` models the link with invariants — valid-UUID id, **active-only** linking, one auth_user_id ↔ one operator, **linking never changes agency_id/role** (no elevation), idempotent, unlink preserves the row. Plus the resolver/adapter/pipeline (`resolveSessionFromAuthUser`, `supabaseAuthSessionAdapter`) already turn a verified principal into an `OperatorSession`. Dev validators exist (`validate-auth-linkage*.mjs`). **This is a persist + login gap, not a design gap.**

---

## 2. Recommended linkage model

**Bind `operators.auth_user_id = auth.uid()` of a verified Supabase session. Authorization is ALWAYS by `auth_user_id`, never email.**

Resolution at login (reusing the existing pipeline):
1. Verified session → `auth.uid()`.
2. Look up the operator **by `auth_user_id`** (the durable key). Found + active → `OperatorSession`. Not found → no operator session (fall through to customer/placeholder). **Email is never a resolution/authorization key.**

Binding (how `auth_user_id` first gets set) happens only through **two privileged, auditable paths**, never by an email match at authorization time:
- **Bootstrap** (first operator) — §3.
- **Token invitation acceptance** (all subsequent staff) — §4.

Invariants (carried straight from `operatorIdentityLinking.ts`, enforced in the DB):
- `auth_user_id` is a valid UUID; **one auth user ↔ at most one operator** (partial-unique index, to become a real constraint).
- Linking/accepting **never changes `agency_id` or `role`** → no privilege elevation via login.
- Idempotent: re-binding the same uid to the same row is a no-op; binding a uid already linked elsewhere is rejected.
- Unlink clears `auth_user_id` and preserves the row.
- **Safe under RLS:** binding/lookups run inside `SECURITY DEFINER` RPCs/helpers, so they work before RLS grants anything and don't recurse (consistent with the Phase E helper design).

**Deterministic & auditable:** binding targets a specific `auth.uid()` (provided out-of-band for bootstrap, or proven by token for invites), and every link/unlink/invite/accept/revoke writes an audit event (§5).

---

## 3. First operator (bootstrap) — recommendation

Production has **no operator and no inviter**, so evaluate:

| Option | Verdict |
|---|---|
| **Bootstrap migration that hard-links a uid** | ❌ The founder's `auth.uid()` doesn't exist until they log in; a migration can't know it, and matching by email at link time would be email-authorization. |
| **Manual / controlled bootstrap (service-role)** | ✅ **Recommended.** Deterministic, auditable, no email authorization. |
| **Invitation flow** | ❌ Chicken-and-egg: no admin exists yet to issue the first invite. |
| **Operator self-onboarding** | ❌ Never — operators must not self-provision (privilege-grant surface). |

**Recommended first-operator strategy:**
1. The founder (Gary) signs in once via OAuth on the **dev project** (dev flag on) → mints his `auth.users` row + `auth.uid()`.
2. A privileged operator runs a **service-role-only, idempotent** `bootstrap_first_operator(p_auth_user_id, p_role, p_display_name, p_email)` that, under the **canonical `website-support-studio` agency**, creates-and-links the first operator (status `active`) to that exact uid. It is gated (e.g. refuses if a linked operator already exists for that uid) and writes an audit event. Email is stored as metadata only; the binding key is the supplied uid.
3. Verify the founder now resolves to an `OperatorSession` through the existing pipeline.

This produces the first `agency_admin`/`gary_approver` who can then invite the rest of the staff.

---

## 4. Future operator invitation flow

Mirrors the customer `org_invitations` model, token-based (no email authorization):

```
invite      → an existing operator admin (agency_admin) calls invite_operator(agency, email, role):
              creates an operators row (status='invited', auth_user_id NULL) + an
              operator_invitations row (hashed single-use token, expires_at); email delivers the link.
   ↓
OAuth login → invitee signs in (Google/GitHub) → verified session + auth.uid().
   ↓
link operator → accept_operator_invitation(p_token): SECURITY DEFINER RPC validates the token
              (pending + unexpired) AND the caller's auth.uid(); then atomically sets
              auth_user_id = auth.uid() and status='active' on the invited operator row;
              marks the invite accepted (accepted_by_auth_user_id, accepted_at).
              Role/agency are taken from the pre-created row and never elevated.
   ↓
activate    → the operator now resolves to an OperatorSession (active + linked).
```

Guards: single-use, expiring token; authorization = **token + auth.uid()** (email is delivery only); revoke sets the invite `revoked`; one invite-per-(agency,email) pending; accepting can never create or elevate to `gary_approver`/owner beyond the role the admin chose.

---

## 5. Implementation readiness

### Schema changes required
1. **`operators.auth_user_id` FK → `auth.users(id) on delete set null`** (currently just `uuid`). Keeps the row, unlinks if the auth user is deleted. Promote the partial-unique index intent to a hard guarantee.
2. **New `public.operator_invitations`** (parallel to `org_invitations`): `id`, `agency_id → agencies`, `operator_id → operators` (the pre-created invited row), `email`, `role` (operator role, not elevated), `token_hash`, `status` (pending/accepted/revoked/expired), `invited_by_auth_user_id`, `accepted_by_auth_user_id`, `expires_at`, `accepted_at`, timestamps; indexes on `agency_id`, `lower(email)`, **unique** `token_hash`; `updated_at` trigger (`touch_updated_at`).
3. **New `public.operator_audit_events`** (lightweight): `id`, `agency_id`, `operator_id`, `event_type` (`linked|unlinked|invited|accepted|revoked|bootstrapped`), `actor_auth_user_id`, `metadata jsonb`, `created_at` — satisfies the "auditable" requirement.

### RPCs (SECURITY DEFINER, `set search_path = public`, never email-authorized)
- `bootstrap_first_operator(p_auth_user_id, p_role, p_display_name, p_email)` — service-role only, idempotent (§3).
- `invite_operator(p_agency_id, p_email, p_role)` — caller must be an active `agency_admin` of that agency.
- `accept_operator_invitation(p_token)` — invitee; binds + activates (§4).
- `revoke_operator_invitation(p_invitation_id)`; `unlink_operator(p_operator_id)` — admin/service.

### Migration requirements
- Additive; apply to **dev first**. The FK to `auth.users` requires the Supabase `auth` schema (present on Supabase). **Do NOT enable RLS here** (that stays Phase E). Functions are `SECURITY DEFINER` so they work pre-RLS and continue to under RLS.

### Operator bootstrap plan
1. Apply the linkage migration on the **dev** project.
2. Founder OAuth login (dev) → capture `auth.uid()`.
3. Run `bootstrap_first_operator(uid, 'agency_admin', …)` (service role).
4. Confirm the founder resolves to an `OperatorSession`; founder then invites staff via `invite_operator` → they `accept_operator_invitation`.

### Verification plan (dev DB)
- **Bootstrap:** creates + links the first operator; re-run is a no-op (idempotent).
- **Invite → accept:** invited operator yields **no** session until accepted; valid token + matching session links + activates → session resolves.
- **Negative tokens:** expired / revoked / wrong token → rejected, no link.
- **Uniqueness:** a second operator cannot bind an already-linked `auth_user_id` (partial-unique enforced).
- **No elevation:** link/accept never changes `agency_id`/`role`.
- **No email authorization (key test):** a logged-in user whose email matches an operator row that is unlinked/invited gets **no** session — only `auth_user_id` resolves.
- **Unlink:** clears `auth_user_id`, preserves the row; the user then resolves to no operator.
- **Audit:** every link/unlink/invite/accept/revoke writes an `operator_audit_events` row.
- **Post-condition:** with ≥1 linked operator, the **operator side of Phase E RLS becomes testable** (the dependency this whole task unblocks).

---

## 6. Remaining blockers after linkage

1. **RLS (Phase E)** — now *unblocked*: with operators linked + the verification fixtures, the operator policy family can be enabled and isolation-verified on a seeded DB. This becomes the next and essentially final foundational gate.
2. **Production Supabase project + OAuth provider config** (Google/GitHub redirect URLs; prod ref still TBD).
3. **Flip `VITE_WSS_REAL_AUTH_ENABLED` in production** — last, gated on RLS verified + Production Verified.

After operator linkage lands and is verified on dev, **RLS (Phase E) is the only remaining foundational blocker** before the production-enablement sequence.

---

## Guardrail check
This pass changed nothing: **no RLS, no production OAuth, no customer access, no onboarding-RPC behavior change, no flag changes, no commits, no pushes.** It is a plan only.
