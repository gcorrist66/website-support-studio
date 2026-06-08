# WSS Customer Identity Model — Design

**Date:** 2026-06-08
**Status:** Design only. No code, no migrations, no commits. Companion to `AUTH_FOUNDATION_PLAN.md`.
**Constraint honored:** column/constraint specs below are *design recommendations*, not executable SQL.

> Anchor decision: **the customer-facing "Organization" is the existing `public.clients` row** — the canonical tenant in the Agency → Client → Site → Ticket hierarchy ("a contracted customer under an agency"). We do **not** introduce a parallel `organizations` table; that would fork the tenant hierarchy and double the RLS surface. Product/UX says "Organization"; the DB says `clients`. New customer tables reference `clients.id` as `org_id`.

---

## 1. User types

A single Supabase `auth.users` pool backs everyone. Identity *type* is determined by membership rows, never by `auth.users` itself.

| Type | Backing | Scope | Roles | Surface |
|---|---|---|---|---|
| **Operator** (internal staff) | `public.operators` (exists) | Agency | agency_admin, cs_agent, gary_approver | Operator console |
| **Customer** (external) | `public.org_members` (new) | Organization (`clients`) | org_owner, org_admin, org_member, org_viewer | Customer portal (future) |
| **Agency member** (future reseller/partner) | `public.agency_members` (new, future) | Agency | agency_owner, agency_admin, agency_staff | Agency console (future) |
| **Unlinked** | `auth.users` with no membership | none | none | "workspace setup required" (Phase A) |

Rules: an auth user MAY hold more than one membership (e.g., a person who is both WSS staff and the owner of their own customer org). Memberships are **never** implicitly created or promoted across types. Identity resolution is by `auth_user_id`, never email (invitation *acceptance* is the one email-bootstrapped exception — see §9).

---

## 2. Organization model

- **Organization = `public.clients`** (one row per customer company), always under the WSS `agencies` row today; under a partner agency in the future.
- Onboarding/profile metadata lives in a new **`public.org_profiles`** (1:1 with `clients`) so the lean `clients` row stays the tenant key and profile fields can evolve freely.
- An organization owns many **sites** (existing `public.sites`, `client_id` FK) — multi-site is already modeled at the tenant layer.

---

## 3. Membership model

**`public.org_members`** — the customer identity join (auth user ⇄ organization).

- One row per (org, user). A user in N orgs = N rows.
- Linkage key is `auth_user_id` (→ `auth.users.id`), mirroring `operators` (unique-when-present, lookups by id not email).
- Status lifecycle: `invited` → `active` → `suspended`/`removed`.
- Optional per-site scoping via **`public.org_member_sites`** (join) so a member can be limited to specific sites; absence of rows = all sites in the org (recommended default for owner/admin).

---

## 4. Roles

**Customer roles (org-scoped)** — deliberately distinct vocabulary from operator roles:

| Role | Intent |
|---|---|
| `org_owner` | The account principal. Billing, ownership transfer, delete org. Exactly **one per org**. |
| `org_admin` | Manage members, sites, settings, requests. Cannot transfer ownership or delete the org. |
| `org_member` | Submit and track requests (optionally scoped to assigned sites). |
| `org_viewer` | Read-only visibility into requests/status (optional; v1-deferrable). |

**Operator roles (agency-scoped, existing — unchanged):** `agency_admin`, `cs_agent`, `gary_approver`.

**Agency roles (future):** `agency_owner`, `agency_admin`, `agency_staff`.

> Customers **submit** requests; they never hold the outbound-change approval gate — that stays operator-side (`gary_approver`). This is a hard separation, not a permission toggle.

---

## 5. Permissions — role matrix

### Customer (org) role × action

| Action | org_owner | org_admin | org_member | org_viewer |
|---|:--:|:--:|:--:|:--:|
| View org requests/status | ✅ | ✅ | ✅ (scoped) | ✅ |
| Submit a support request | ✅ | ✅ | ✅ (scoped) | ❌ |
| Comment / add detail to own requests | ✅ | ✅ | ✅ | ❌ |
| Manage sites (add/edit/remove) | ✅ | ✅ | ❌ | ❌ |
| Invite / remove members | ✅ | ✅ | ❌ | ❌ |
| Assign member ↔ site scope | ✅ | ✅ | ❌ | ❌ |
| Edit org profile/settings | ✅ | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ◑ (configurable) | ❌ | ❌ |
| **Transfer ownership** | ✅ | ❌ | ❌ | ❌ |
| **Delete organization** | ✅ | ❌ | ❌ | ❌ |
| Approve outbound website changes | ❌ | ❌ | ❌ | ❌ (operator-only) |

### Domain separation (who sees what)

| Capability | Operator (staff) | Customer (org) |
|---|:--:|:--:|
| Operator console (queue/triage/approve) | ✅ (by operator role) | ❌ never |
| Cross-org visibility within agency scope | ✅ | ❌ |
| Customer portal (own org only) | ❌ (unless also a member) | ✅ |
| Approval gate on customer-facing changes | ✅ `gary_approver` | ❌ |

---

## 6. Agency support

- **Today:** one agency (Corriston/WSS). Every customer `clients` row hangs off it. No customer touches the agency layer.
- **Future (reseller/white-label):** a partner agency manages many client orgs. Modeled by **`public.agency_members`** (auth user ⇄ `agencies`, with agency roles) — the agency-scope analogue of `org_members`. An agency member sees all `clients` (orgs) under their `agency_id`; an org member sees only their one org.
- **Promotion path:** an org can be "graduated" by re-parenting its `clients.agency_id` to a partner agency without touching the org's members or sites — the hierarchy already supports it.
- Operators remain a separate, internal concept even when partner agencies exist (staff who *operate* the platform vs. partners who *resell* it).

---

## 7. Multi-site support

- Sites already belong to an org (`sites.client_id`). Onboarding's "number of websites" seeds initial `sites` rows.
- **Owners/admins:** implicit access to all sites in the org.
- **Members/viewers:** optionally restricted via `org_member_sites` (member_id ⇄ site_id). No rows = all sites (simplest default); presence = allowlist.
- Requests (`tickets`) are already site-scoped (`tickets.site_id`), so per-site member scoping flows straight into request visibility and RLS.

---

## 8. Ownership transfer

- Invariant: **exactly one `org_owner` per org** (enforce with a partial unique index on `(org_id) where role='org_owner' and status='active'`).
- Transfer is atomic (RPC): target must already be an `active` member → promote target to `org_owner`, demote current owner to `org_admin`, write an audit event. Never two owners, never zero.
- Guards: cannot remove/suspend the last owner; deleting an org requires `org_owner`; ownership cannot be transferred to an `invited`/`suspended` member.

---

## 9. Invitations

**`public.org_invitations`** — pending invites by email, before an `auth.users` row may even exist.

Lifecycle: `pending` → `accepted` | `revoked` | `expired`.

Flow keys on a **single-use, expiring token**; the *resulting membership* is still keyed by `auth_user_id`.

> Email-vs-id nuance: the "never link by email" rule governs **identity resolution** (you cannot become an operator/member just because your email matches a row). Invitations are different: an admin *explicitly* issues a token to an email; acceptance requires possessing that token **and** signing in, after which the membership is bound to `auth_user_id`. Email is the addressing mechanism, the token is the authorization, and `auth_user_id` is the durable link.

Columns (design): `id`, `org_id (→clients.id)`, `email (citext, normalized)`, `role (org role, not owner)`, `token_hash`, `invited_by (→auth.users.id)`, `status`, `expires_at`, `accepted_by (→auth.users.id, null until accepted)`, `accepted_at`, timestamps. Constraints: one active pending invite per (org_id, email); `org_owner` cannot be issued via invite (ownership comes only via transfer).

---

## 10. Operator vs customer separation (summary)

- **Two membership domains, one auth pool.** `operators` (agency-scoped staff) and `org_members` (org-scoped customers) are independent tables with independent role vocabularies.
- **No implicit elevation.** Signing in resolves memberships explicitly; an unlinked user gets the placeholder (Phase A). A customer is never shown the operator console; an operator is never auto-granted an org.
- **RLS will enforce it** (Phase E): operator policies key on an active `operators` row + agency/scope; customer policies key on an active `org_members` row for the row's `client_id`. The two policy families never overlap.
- **Both-roles edge case** is allowed and harmless: distinct rows, distinct surfaces, distinct policies.

---

## ERD (text)

```
                         ┌───────────────┐
                         │  auth.users   │  (Supabase-managed identity pool)
                         └───────┬───────┘
              ┌──────────────────┼───────────────────────┬───────────────────┐
              │ auth_user_id     │ auth_user_id           │ invited_by /      │ auth_user_id
              ▼                  ▼                        │ accepted_by       ▼
      ┌───────────────┐   ┌────────────────┐             │            ┌──────────────────┐
      │  operators    │   │  org_members   │◀────────────┘            │ agency_members   │ (future)
      │ (staff)       │   │ (customers)    │   org_invitations        │ (partner agency) │
      │ agency_id ───┐│   │ org_id ──┐     │   org_id ─┐              │ agency_id ─┐     │
      │ role(op)     ││   │ role(org)│     │   token   │              │ role(agency)│    │
      └──────────────┘│   └────┬─────┘     └───────────┘              └────────────┘│    │
                      │        │ member_id                                          │    │
                      │        ▼                                                    │    │
                      │  ┌──────────────────┐                                       │    │
                      │  │ org_member_sites │ (site scoping)                        │    │
                      │  │ member_id, site_id                                       │    │
                      │  └─────────┬────────┘                                       │    │
                      │            │ site_id                                        │    │
   ┌──────────┐       │   ┌────────▼────┐   ┌──────────────┐   ┌──────────┐         │    │
   │ agencies │◀──────┴───│   clients   │◀──│ org_profiles │   │  sites   │         │    │
   │          │◀──────────│ (= Organization)│ (1:1 onboarding)│ client_id│◀────────┘    │
   │   id     │ agency_id │  agency_id  │   │  org_id      │   │ agency_id│              │
   └────┬─────┘           └──────┬──────┘   └──────────────┘   └────┬─────┘              │
        │ agency_id              │ client_id                        │ site_id            │
        └────────────────────────┴───────── tickets ────────────────┘ (existing)         │
        agency_members.agency_id ───────────────────────────────────────────────────────┘
```

---

## Table recommendations (new — design specs only)

> All FKs `on delete cascade` from the tenant down. All get RLS in Phase E (not now). All timestamps `timestamptz default now()`.

**`public.org_members`** — customer membership
- `id uuid pk`
- `org_id uuid not null → clients.id`
- `auth_user_id uuid → auth.users.id` (nullable until accepted; unique-when-present)
- `email citext not null` (normalized; for invite matching/display)
- `role public.org_role not null` (enum: org_owner, org_admin, org_member, org_viewer)
- `status public.org_member_status not null default 'invited'` (enum: invited, active, suspended, removed)
- `invited_by uuid → auth.users.id`, `last_seen_at`, `created_at`, `updated_at`
- Constraints: unique `(org_id, auth_user_id)`; unique `(org_id, email)`; partial unique `(org_id) where role='org_owner' and status='active'` (one owner).

**`public.org_profiles`** — onboarding/company metadata (1:1 with org)
- `org_id uuid pk → clients.id`
- `company_name text`, `primary_website_url text`, `number_of_websites int`, `cms_platform text`,
  `primary_contact_name text`, `support_email citext`, `onboarded_by uuid → auth.users.id`, timestamps.

**`public.org_member_sites`** — per-member site scoping (optional)
- `member_id uuid → org_members.id`, `site_id uuid → sites.id`, pk `(member_id, site_id)`.

**`public.org_invitations`** — see §9 columns.

**`public.agency_members`** (future) — partner-agency membership
- `id`, `agency_id → agencies.id`, `auth_user_id → auth.users.id`, `email`, `role public.agency_role`, `status`, timestamps; unique `(agency_id, auth_user_id)`.

**Enums (new):** `org_role`, `org_member_status`, `agency_role`. (Operator enums unchanged.)

---

## Onboarding flow (first customer login)

1. User signs in (Google/GitHub/magic link) → `auth.users` row exists.
2. Resolver checks `operators` then `org_members` by `auth_user_id`. **Also check `org_invitations` by verified email** (§ invitation path).
3. **No membership, no invite** → onboarding form: company name, website URL, number of websites, CMS/platform, primary contact, support email.
4. **Onboarding RPC (atomic, `security definer`, idempotent on `auth.uid()`):**
   a. create `clients` (organization) under the WSS agency,
   b. create `org_profiles` (the captured metadata),
   c. create first `sites` row(s) from the submitted URL / count,
   d. create `org_members` row: this user as `org_owner`, `status='active'`,
   e. emit an onboarding audit event.
5. Land in the customer portal scoped to the new org (empty request queue).
6. Idempotency: if a membership already exists, skip creation (prevents duplicate orgs on double-submit).

---

## Invitation flow

1. Owner/admin invites `email` + `role` (not owner) → `org_invitations` row (`pending`, hashed token, `expires_at`), email sent via Resend with the token link.
2. Invitee opens link → signs in (OAuth/magic link).
3. Acceptance RPC: validate token (unexpired, pending) **and** verified email matches → create/activate `org_members` (`status='active'`, `auth_user_id` bound), mark invite `accepted` (`accepted_by`, `accepted_at`).
4. Guards: single-use token; expired/revoked → safe error; one active pending invite per (org,email); re-invite reissues a fresh token.
5. Revoke: owner/admin sets invite `revoked`; pending links stop working.

---

## Future agency flow

1. Stand up `agency_members` + `agency_role` enum (mirror of org membership at agency scope).
2. A partner signs up → create a new `agencies` row + `agency_members` (agency_owner).
3. Partner's customer orgs are `clients` rows with `agency_id` = the partner agency; agency members see all orgs under their agency, org members still see only their own org.
4. Graduate an existing org to a partner agency by re-parenting `clients.agency_id` — members, sites, and tickets ride along unchanged.
5. Billing/roll-up reporting aggregates at the agency layer; RLS gains an agency-scope policy family alongside the operator and customer families.

---

## Open decisions to confirm before Phase D
- Include `org_viewer` and `org_member_sites` in v1, or defer (recommend: ship `org_owner/admin/member`, defer viewer + per-site scoping).
- `citext` extension for case-insensitive email (recommended) vs. lowercased `text` + check (as `operators` does today).
- Billing role: fold into owner/admin for v1 (recommended) vs. a dedicated `org_billing`.
- Whether self-serve onboarding creates a `clients` row immediately, or a "pending org" state until first request (recommend: create immediately; simpler RLS).
