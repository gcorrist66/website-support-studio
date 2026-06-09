# Website Support Studio — V2 Foundation Plan

**Author:** Claude (V2 planning track)
**Date:** 2026-06-09
**Status:** PROPOSAL — no code applied, no DB changes made
**Constraint:** Codex owns WSS 1.5 stabilization + tomorrow's customer signup. This plan must not touch that path.

---

## 1. Executive Summary

WSS 1.5 (production) is a **subscription support platform**: a customer buys a recurring plan
(Operations $399/mo, Growth $899/mo), onboards an org + site, submits **support requests
(tickets)**, and operators move each ticket through a human-gated workflow
(`received → triaged → reply_drafted → awaiting_gary_approval → approved_to_send → sent_to_customer → closed`).
Capacity is metered in monthly **Capacity Units (CU)** held on the `subscriptions` row.

**The V2 business need is a different shape of work: a one-time, fixed-price website *project*
(e.g. the $500 build expected tomorrow).** Nothing in the current data model represents a
project, a fixed-price one-time payment, milestones, or deliverables. The current Stripe
checkout only knows recurring plans + small add-ons.

**The core architectural gap is one missing noun: `Project`.** Everything else V2 needs
(tenant isolation, operator workflow engine, messaging, audit, RLS helpers, capacity columns)
already exists and can be reused. V2 is therefore an **additive layer**, not a rebuild.

**Critical safety fact:** the Supabase CLI in this repo is now linked to the **production**
project `sfhllezyyylduxvwdxki` (`website-support-studio-prod`). Any `supabase db push` hits
production. The safe first build is a **migration file + operator-only UI on an unmerged
branch — written but NOT applied** until Codex confirms tomorrow's signup is locked.

**Tomorrow's $500 customer does not require any V2 code to ship.** They can be served with a
manual Stripe payment link/invoice (Stripe MCP is available) plus an internal project record.
V2 makes that repeatable; it is not on tomorrow's critical path.

---

## 2. Current System Audit (what already exists)

Source: full read of `supabase/migrations/*`, `supabase/functions/*`, `src/*`, `marketing/*`.

| Capability | Status | Where |
|---|---|---|
| **Customers / tenants** | ✅ Built | `agencies → clients (orgs) → sites`; `org_members` binds `auth_user_id`→org with roles (owner/admin/member/viewer); `org_profiles` holds onboarding state |
| **Sites** | ✅ Built | `sites` (client_id, url, slug); collision-safe slugs |
| **Subscriptions / billing** | ✅ Built (recurring only) | `subscriptions` (plan, status, `stripe_subscription_id`, `monthly_cu`, `sites_limit`, `buyer_email`, `owner_claimed`); `provision_paid_customer()`, `update_subscription_status()`, `claim_my_paid_org()` |
| **Tickets / requests** | ✅ Built | `tickets` + 8-state machine; `submit_customer_request()` (customer) and 7 `operator_*` workflow RPCs |
| **Messages / communication** | ✅ Built | `ticket_messages` (inbound/outbound), `ticket_draft_replies`, `ticket_approvals`, `ticket_communications` (approval-gated sends) |
| **Feedback** | ✅ Built | `submit_customer_feedback()` RPC; surfaced via `CustomerRequest.tsx` |
| **Operator console** | 🟡 Read-only | `AppShell.tsx`: queue + detail + filters/search render; action buttons exist but are **disabled in UI** (handlers/RPCs are complete underneath) |
| **Capacity units** | 🟡 Columns only | `subscriptions.monthly_cu` + `wss_plan_monthly_cu()`; **no ledger, no consumption engine** |
| **Customer workspace** | ✅ Built | `CustomerRequest.tsx`: plan/capacity summary, site list, submit request + feedback |
| **Onboarding** | ✅ Built | `OnboardingForm.tsx` + `complete_customer_onboarding()` / `complete_paid_onboarding()`; `claim_my_paid_org()` post-checkout |
| **Billing/pricing refs** | ✅ Built | `src/billing/plans.ts` + `marketing/.../pricing.astro`; LIVE Stripe prices for Operations/Growth/DNS; top-up prices TBD |
| **Security model** | ✅ Built | RLS deny-by-default on all tenant tables; `app_is_org_*` / `app_operator_*` helpers; tenant-key immutability trigger |
| **Edge functions** | ✅ Built | `create-checkout-session` (plan/add-on → Stripe Checkout), `stripe-webhook` (provisioning), `operator-pilot-status` (diagnostics) |

**Corrections to prior docs found during audit:**
- Docs claim production Supabase "not yet provisioned" — it **is** provisioned and linked (`...prod`).
- Docs claim onboarding collects `interested_in_rebuild/migration/native` flags — **not present** in schema or code.

---

## 3. V2 Gap Analysis (one-time website projects)

| V2 need | Exists today? | Gap |
|---|---|---|
| One-time website project entity | ❌ | No `projects` table. Tickets are per-site support units, not engagements. |
| $500 fixed-price intake | ❌ | Checkout only does recurring plans + add-ons. No one-time project price/flow. |
| Project status lifecycle | ❌ | Ticket state machine is support-shaped, not delivery-shaped (intake→scoping→build→review→deliver). |
| Project milestones | ❌ | No milestone concept. |
| Customer deliverables | ❌ | No deliverable/handoff record (links, files, final URL). |
| Operator project workflow | 🟡 | Operator engine + audit pattern exist and are reusable; no project-specific actions. |
| Project ↔ ticket relationship | ❌ | `tickets` has no `project_id`. A project's change-requests can't be linked to it. |
| Customer project communication | 🟡 | `ticket_messages` pattern is reusable; nothing scopes messages to a project. |
| Project visibility for customer | ❌ | `CustomerRequest.tsx` shows tickets/plan, not projects. |
| Capacity/credit accounting | 🟡 | CU columns exist; no ledger and no notion of a project consuming/being-priced-in credits. |

**Conclusion:** the gap is narrow and well-bounded. Add `Project` (+ later milestones/deliverables),
reuse the existing operator-workflow, messaging, audit, and RLS machinery, and add a one-time
payment path. Nothing existing needs to change for the foundation.

---

## 4. Recommended V2 Data Model (smallest safe set)

Design principles: **additive only** (new tables; existing tables get at most a *nullable* FK
later), reuse the proven tenant-key + RLS pattern, operator-first then expose to customers.

### Core (V2.0)
```
projects
  id              uuid pk
  agency_id       uuid not null  -> agencies(id)      -- tenant key (immutable, guarded)
  client_id       uuid not null  -> clients(id)       -- tenant key (the customer org)
  site_id         uuid null      -> sites(id)         -- nullable: a "new website" has no site yet
  project_number  text not null                       -- human-friendly id (e.g. PRJ-0001)
  title           text not null
  summary         text
  project_type    project_type not null               -- enum below
  status          project_status not null default 'intake'
  price_cents     integer                              -- e.g. 50000 for $500
  currency        text not null default 'usd'
  payment_status  project_payment_status not null default 'unpaid'
  stripe_checkout_session_id text
  stripe_payment_intent_id   text
  intake_notes    text
  delivered_at    timestamptz
  closed_at       timestamptz
  created_at / updated_at timestamptz not null default now()

enum project_type:    new_website | rebuild | fix | update | migration | ongoing_ops | other
enum project_status:  intake | scoping | in_progress | in_review | delivered | closed | blocked | cancelled
enum project_payment_status: unpaid | paid | refunded
```

### Milestones (V2.2 — defer)
```
project_milestones
  id, project_id -> projects(id), agency_id, client_id   -- tenant keys carried for RLS
  title, description
  status   milestone_status default 'pending'   -- pending | in_progress | done
  sort_order int, due_at, completed_at, created_at/updated_at
```

### Deliverables (V2.3 — defer)
```
project_deliverables
  id, project_id, agency_id, client_id
  title, kind (link|file|note), url, status, delivered_at, created_at/updated_at
```

### Messages (V2.3 — defer; or reuse tickets)
```
project_messages   -- mirrors ticket_messages exactly
  id, project_id, agency_id, client_id, author_id, author_role,
  message_body, message_direction, created_at
```

### Project ↔ Ticket link (V2.2 — defer, additive)
```
ALTER TABLE tickets ADD COLUMN project_id uuid NULL REFERENCES projects(id);
-- nullable, no default → zero behavioral change to existing support flow
```

### Capacity (V2.4 — defer)
Introduce `capacity_ledger` (org-scoped credit/debit entries) so both **subscription CU
consumption** and **project pricing** post against one balance. Projects either (a) are pure
one-time revenue outside CU, or (b) optionally debit a fixed CU amount — decide at V2.4.

**RLS:** mirror the ticket pattern exactly.
- Operators: `ALL using app_operator_in_agency(agency_id)`.
- Customers (only from V2.3): `SELECT using app_is_org_member(client_id)`; no customer writes
  except a scoped `submit_project_message` RPC.
- Add `projects`, `project_messages` to the tenant-key immutability trigger.

---

## 5. Recommended Routes / UI

Reuse the existing shells; add project surfaces alongside, never inside, the support flow.

**Operator console (`AppShell`) — V2.2**
- New "Projects" tab beside the ticket queue: `ProjectQueue` (status filters) + `ProjectDetail`
  (status transitions, milestones, deliverables, message thread, audit).
- Reuses the exact read-only-queue / detail-pane component pattern already built for tickets.

**Customer workspace (`CustomerRequest`) — V2.3**
- "Your Projects" panel: project cards with status, milestones, deliverables, message thread.
- A new request can optionally be attached to a project.

**Intake — V2.1**
- Operator-initiated intake first (operator creates a project from a sales conversation, sends a
  Stripe payment link). Customer-facing self-serve project intake/checkout is a later, optional step.
- Marketing: a "Start a website project" CTA can point to a contact/intake form, not a self-serve
  one-time checkout, until V2.1 is proven.

---

## 6. Safe Build Plan (phased)

| Phase | Scope | Risk | DB change |
|---|---|---|---|
| **V2.0 Foundation** | `projects` table + enums + RLS (operator-only) + `operator_create_project` / `operator_set_project_status` RPCs + project audit. Migration file written, **not applied**. | None to prod (additive new table, no existing object touched) | New migration, **applied only after Codex green-light** |
| **V2.1 Project Intake** | One-time payment path: Stripe one-time price/payment-link; webhook handles `payment_intent`/one-time `checkout.session.completed` → set `payment_status='paid'`. Operator intake UI. | Low (extends webhook with a new branch; guard by `mode`/metadata so recurring flow is untouched) | RPC + edge fn edit |
| **V2.2 Operator Project Mgmt** | Projects tab in console; status transitions; `project_milestones`; nullable `tickets.project_id`. | Low (additive) | Additive migration |
| **V2.3 Customer Visibility** | Customer RLS read policies; "Your Projects" panel; `project_messages` + `submit_project_message`. | Low–Med (first customer-facing RLS on new tables — verify isolation) | Additive migration |
| **V2.4 Capacity/Credit Accounting** | `capacity_ledger`; consume-at-approval for tickets; project↔credit policy. | Med (touches billing semantics — do last, behind a flag) | Additive migration |

**Coordination rule:** no migration in any phase is applied to `...prod` while Codex's
tomorrow-signup work is open. V2 migrations are numbered `20260610+` to sit cleanly after the
current head (`20260609170500`).

---

## 7. First Implementation Recommendation

**Build V2.0 as files on an unmerged `v2-foundation` branch. Apply nothing to the database yet.**

Concretely, the first safe artifact is a single migration file
`supabase/migrations/2026061000000_v2_projects_foundation.sql` containing:
1. `project_type`, `project_status`, `project_payment_status` enums.
2. `projects` table with tenant keys + indexes.
3. RLS enabled, **operator-only** policies (`app_operator_in_agency`), customers denied by default.
4. `projects` added to the tenant-key immutability trigger.
5. `operator_create_project()` and `operator_set_project_status()` SECURITY DEFINER RPCs + a
   `project_audit_events` insert (or reuse a generic audit) for governance parity with tickets.

Why this is safe:
- It creates **only new objects**; it reads/writes **no existing table, RPC, policy, or function**.
- It is **operator-only** — no new customer-facing surface, no change to signup/onboarding/checkout.
- It is **not applied** until Codex confirms; until then it is inert text in the repo.

For **tomorrow's actual $500 customer**, the recommended path needs none of the above code:
create a one-time Stripe payment link (Stripe MCP), take payment, and track the engagement
manually until V2.0 is live. This keeps tomorrow entirely on Codex's hardened path.

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Migration applied to linked **prod** DB collides with Codex's signup hardening | High | Do **not** `supabase db push`. Hold V2 migration unapplied; coordinate a window after the customer is through. |
| One-time payment branch in `stripe-webhook` accidentally affects recurring provisioning | High | Branch strictly on event `mode`/metadata; add tests before touching the live function; deploy only after Codex sign-off. |
| Customer RLS on new tables leaks cross-tenant project data | Med | Defer customer policies to V2.3; reuse proven `app_is_org_member` helper; run an isolation test like `phase_e_rls_verification.sql`. |
| Scope creep into a full project-management product | Med | Hard-stop at the smallest noun (`Project`); milestones/deliverables/ledger are explicitly deferred phases. |
| Divergence from Codex on shared files (`stripe-webhook`, `AppShell`, plans) | Med | V2.0/2.1 touch new files only; coordinate before editing any shared file; keep work on a branch. |
| Doc drift (prod state, interest flags) misleads planning | Low | Audit corrected both; trust schema/linked-project over older docs. |

---

## 9. Exact Next Step

1. **Confirm with Codex** that tomorrow's signup work does not need the DB locked tonight, and
   agree a window for applying any V2 migration. (Coordination, not code.)
2. On a new `v2-foundation` branch, **write** `2026061000000_v2_projects_foundation.sql` (the
   V2.0 migration above) and review it — **do not apply, do not merge, do not push to prod.**
3. For tomorrow's customer specifically: prepare a **one-time $500 Stripe payment link** (manual,
   via Stripe MCP) and a lightweight internal note to track the engagement until V2.0 lands.

Nothing in steps 2–3 touches WSS 1.5 production or Codex's signup path.
