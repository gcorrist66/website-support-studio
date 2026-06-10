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
| **Feedback** | 🟡 Title-prefix only | NO dedicated RPC. `submitCustomerFeedback()` calls `submit_customer_request()` with `title = "Product feedback: <Category> - …"`; the category lives in the title string, not a column (see Part II §5 for the risk + fix) |
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
  target_delivery_date date                            -- powers operator "overdue" (Part II §2, §7)
  delivered_at    timestamptz
  closed_at       timestamptz
  created_at / updated_at timestamptz not null default now()

enum project_type:    new_website | rebuild | fix | update | migration | ongoing_ops | other
enum project_status:  intake | scoping | in_progress | waiting_on_customer | in_review | delivered | closed | blocked | cancelled
enum project_payment_status: unpaid | paid | refunded
```
> **Status model is finalized in Part II §3.** `status` is the delivery lifecycle; `payment_status`
> is the orthogonal money axis (`unpaid` = Lead, `paid` = Purchased). `waiting_on_customer` and
> `target_delivery_date` were added to the (still-unapplied) foundation migration this session.

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

---
---

# Part II — Project Layer Design (V2 deep design)

**Added:** 2026-06-09 · **Branch:** `v2-foundation` (never merged to main) · **Status:** DESIGN.
WSS 1.5 is live on `main` with real customers. This part defines the Project layer in full so it is
**ready to implement after 1.5 proves itself**. Milestones, deliverables, and the request↔project
link remain **design-only** here — no DDL for them is added to the migration yet. The only schema
touched this session is two additive fields on the (still-unapplied) `projects` table:
`waiting_on_customer` status + `target_delivery_date`.

## II.1 — Project Workflow & Object Mapping (Phase 1)

The model gains one layer. Today's production hierarchy is preserved as the *inside* of a project:

```
TODAY (WSS 1.5, unchanged):     Customer ─→ Site ─→ Request (ticket)

V2 (additive layer on top):     Customer (client/org)
                                   └─→ Project                     ← NEW noun
                                         ├─→ Milestones            (internal progress steps)
                                         ├─→ Deliverables          (customer-facing outputs)
                                         ├─→ Requests (tickets)    (work items; existing ticket engine)
                                         └─→ Site(s)               (what the project builds/operates on)
```

A **Project** is a scoped engagement (a build, redesign, or larger body of work). It *contains many
requests*, produces *deliverables*, and is tracked by *milestones*. The existing
`Customer → Site → Request` chain still works untouched: a request with no project is just ordinary
subscription support (see §5, "orphan requests").

| Future object | Maps to / built on | Status |
|---|---|---|
| **Customer** | `clients` (org) — unchanged | ✅ exists |
| **Project** | `projects` (new table) | ✅ in foundation migration (unapplied) |
| **Milestone** | `project_milestones` (new) | 🎯 design-only (§4) |
| **Deliverable** | `project_deliverables` (new) | 🎯 design-only (§4) |
| **Request** | `tickets` + nullable `project_id` | 🎯 design-only link (§5) |
| **Site** | `sites` — a project's `site_id` (nullable; a new build has no site yet) | ✅ exists |
| **Project communication** | `ticket_messages` (per request) now; `project_messages` later | reuse / defer |
| **Project audit** | `project_audit_events` (new table) | ✅ in foundation migration |
| **Money state** | `projects.payment_status` + Stripe fields | ✅ in foundation migration |

## II.2 — Project UX (Phase 2)

### Customer project view — must answer five questions
| Question | Surfaced by |
|---|---|
| **What project is active?** | Project card: `title`, `project_type`, customer status label (§3), payment badge. Most-recent active project shown first. |
| **What status is it in?** | Status label + one-line plain-language description + a progress bar = `done milestones / total`. |
| **What has been completed?** | Checklist of `done` milestones + list of `delivered`/`accepted` deliverables (with links / final URL). |
| **What is next?** | The first non-`done` milestone by `sort_order`; if status = `waiting_on_customer`, a prominent "We need your input" call-to-action. |
| **What requests belong to it?** | List of linked tickets (number, title, ticket status) — read-only, reuses existing ticket read path filtered by `project_id`. |

Placement: a **"Your Projects"** panel in the customer workspace, sibling to the existing requests
panel — never replacing it. Customers with no project see nothing new (1.5 experience intact).

### Operator project view — must answer four questions
| Question | Query |
|---|---|
| **What projects are active?** | `status in (scoping, in_progress, waiting_on_customer, in_review)` |
| **What is blocked?** | `status = blocked` |
| **What is waiting on customer?** | `status = waiting_on_customer` (first-class status, not a sub-reason — so it filters cleanly) |
| **What is overdue?** | `target_delivery_date < today AND status not in (delivered, closed, cancelled)` → computed badge |

Operator queue columns: customer · project # · type · status · payment · target date (overdue badge)
· # open requests · last activity. Detail pane reuses the ticket detail/audit component pattern:
status transitions, milestone checklist, deliverables, linked requests, `project_audit_events` timeline.

## II.3 — Project Status Model (Phase 3, FINAL recommendation)

**Two orthogonal axes** — this is the key decision. The example list mixed sales state with delivery
state; we separate them so each stays clean and filterable:

- **`payment_status`** (money): `unpaid` → **Lead**, `paid` → **Purchased**, `refunded`.
- **`status`** (delivery lifecycle): the recommended enum below.

```
intake ─→ scoping ─→ in_progress ─⇄─ waiting_on_customer ─→ in_review ─→ delivered ─→ closed
                          └──────────────── blocked ────────────────┘
                                    cancelled (terminal, any time)
```

| `status` | Customer-facing label | Meaning |
|---|---|---|
| `intake` | "Getting started" | Project created; gathering basics |
| `scoping` | "Planning" | Requirements / scope being defined |
| `in_progress` | "In progress" | Active build/work |
| `waiting_on_customer` | "Needs your input" | Paused pending customer info/approval/assets |
| `in_review` | "In review" | Work done, customer reviewing |
| `delivered` | "Delivered" | Output handed over (`delivered_at` stamped) |
| `closed` | "Complete" | Accepted & archived (`closed_at` stamped) |
| `blocked` | "On hold" | Stalled on a non-customer dependency (vendor/access/internal) |
| `cancelled` | "Cancelled" | Terminated before delivery (`closed_at` stamped) |

**Why not put Lead/Purchased in the lifecycle enum?** Because they're about money, already captured by
`payment_status`. A "Lead" = `payment_status = unpaid` (typically at `intake`/`scoping`); "Purchased"
= `payment_status = paid`. Keeping them separate means an operator can have a *paid* project still in
`scoping`, or an *unpaid* lead already being scoped, without contradictory states.

**Why `waiting_on_customer` as a status (vs a `blocked_reason`)?** The operator view must answer
"waiting on customer" and "blocked" as *separate* questions. A first-class status filters in one
predicate; a reason-column would require parsing `blocked` + reason. Foundation cost is one enum value.

## II.4 — Milestone & Deliverable Model (Phase 4, DESIGN ONLY — no DDL added)

```
project_milestones                          project_deliverables
  id            uuid pk                        id            uuid pk
  project_id    -> projects(id)                project_id    -> projects(id)
  agency_id, client_id  (tenant keys)          agency_id, client_id  (tenant keys)
  title         text                           title         text
  description   text                           kind          enum: link | file | note | credential
  status        enum: pending|in_progress      url           text                (for link/file)
                |done|skipped                   status        enum: pending|delivered|accepted
  sort_order    int                            delivered_at  timestamptz
  due_at        timestamptz                    accepted_at   timestamptz
  completed_at  timestamptz                    created_at/updated_at
  created_at/updated_at
```

- **Milestones** = the *plan* (internal-leaning progress steps the customer can watch). Ordered by
  `sort_order`. "What's next" = first non-`done`. `skipped` keeps history honest without faking `done`.
- **Deliverables** = the *outputs* (the live URL, design files, a handoff doc, DNS credentials).
  `accepted` (vs just `delivered`) lets a customer acknowledge receipt — the basis for sign-off.
- **Completion tracking:** project progress % = `count(status='done') / count(*)` over milestones.
  A project may auto-suggest `delivered` when all milestones are `done` and all deliverables
  `delivered` — operator still confirms (human gate, consistent with the ticket approval philosophy).
- **RLS (when built):** mirror `projects` — operator `ALL` via `app_operator_in_agency(agency_id)`;
  customer `SELECT` via `app_is_org_member(client_id)` from V2.3; add both tables to the tenant-key guard.

## II.5 — Request Relationship Model (Phase 5)

**The link is one nullable column** (additive, zero behavioral change to 1.5):
```
ALTER TABLE public.tickets ADD COLUMN project_id uuid NULL REFERENCES public.projects(id);
```

| Concept | Rule |
|---|---|
| **One project, many requests** | `tickets.project_id` is N:1 → projects. A project aggregates its requests via `where project_id = :id`. |
| **A request has at most one project** | Single nullable FK (not a join table) — simplest correct model; revisit only if many-to-many is ever real. |
| **Orphan requests** | `project_id IS NULL` = ordinary **support request** (the entire current 1.5 flow). This is the default; nothing changes for subscription customers. |
| **Support vs project request** | `project_id IS NULL` → support (subscription-metered via CUs). `project_id IS NOT NULL` → **project request** (part of the fixed-price engagement). |

**How requests attach (V2.2):**
1. Customer submits from inside a project view → `submit_customer_request` gains an optional
   `p_project_id`; the RPC validates the project belongs to the caller's org (same server-side
   tenant check already used for `p_site_id` — no tenant hopping).
2. Operator links/moves an existing ticket to a project from the operator detail pane.

**Capacity interaction (defer to V2.4 — flagged, not decided):** do project requests consume
subscription Capacity Units, or are they covered by the project's fixed price? Recommended default:
**project requests do NOT burn subscription CUs** (they're inside the paid scope); only orphan
support requests do. Final call belongs to the capacity-ledger phase.

**Feedback categorization (current risk, ties to Phase 5):** product feedback today is *only* a ticket
whose `title` starts with `"Product feedback:"` — there is no category column (the earlier-claimed
`submit_customer_feedback()` RPC does not exist). This is fragile (a customer literally titling a
support request that way is miscategorized). The same structured-column fix helps both feedback and
project-requests: add a `request_kind` (`support | product_feedback | bug_report | feature_request`)
**and** the `project_id` link in one V2.2 migration, then categorization stops being string-parsing.

## II.6 — Customer & Operator Visibility Summary

- **Customer sees:** their projects only (RLS `app_is_org_member(client_id)`, added V2.3), with status
  label, progress, completed work, what's next, linked requests, deliverables. Never internal audit,
  never another tenant, never Stripe IDs.
- **Operator sees:** all projects in their agency (RLS `app_operator_in_agency(agency_id)`, already in
  the foundation migration), with the four operational filters (active / blocked / waiting / overdue),
  full audit trail, and status-transition controls. Customers are denied by default until V2.3.

## II.7 — Updated Phase Map (supersedes Part I §6 for the Project layer)

| Phase | Adds | Migration? |
|---|---|---|
| **V2.0 Foundation** (this branch) | `projects` + `project_audit_events` + enums (incl. `waiting_on_customer`) + `target_delivery_date` + operator-only RLS + `operator_create_project` / `operator_set_project_status`. **Written, NOT applied.** | unapplied file |
| **V2.1 Project Intake** | one-time Stripe payment path; operator intake UI | edge fn + RPC |
| **V2.2 Operator Project Mgmt** | `project_milestones`; `tickets.project_id` + `request_kind`; Projects tab + detail pane | additive |
| **V2.3 Customer Visibility** | customer RLS read policies; "Your Projects" panel; `project_deliverables` | additive |
| **V2.4 Capacity/Credit** | `capacity_ledger`; project-request vs CU policy | additive |

**Still true:** no migration is applied to `…prod` outside a coordinated window; everything in Part II
beyond the two `projects` field additions is design-only.

---
---

# Part III — V2.3 Customer Project Visibility (design + draft)

**Added:** 2026-06-09 · **Branch:** `v2-foundation` · **Status:** DESIGN + DRAFT MIGRATION (not applied).
**Draft migration:** `supabase/migrations/20260612000000_v2_3_customer_project_visibility.sql`.
Customers who bought a website project need to see — in calm, plain language — what they bought, where
it stands, what's done, what's next, what's needed from them, which requests belong to it, and which
deliverables are ready.

## III.1 — Customer Project Visibility Design (Phase 1)

A **"Your Projects"** panel, shown only when the customer has ≥1 project. Each question maps to a field
in the read model (§III.3):

| Question | Answered by |
|---|---|
| What is my active project? | project card: `title`, `project_type`, `project_number` |
| What status is it in? | `status` → customer-safe label (§III.2) + progress bar from `milestone_progress` |
| What is finished? | `done` milestones + `delivered`/`accepted` deliverables |
| What is next? | `next_milestone` (first non-done/non-skipped by order) |
| What do you need from me? | `action_needed` (= status `waiting_on_customer`) → a prompt banner |
| What requests are part of this project? | `requests[]` (linked tickets: number, title, status) |
| What deliverables are ready? | `deliverables[]` (READY only — pending/WIP never shown) |

## III.2 — Customer-Safe Status Copy (Phase 2)

`status` is internal; the UI renders these labels. Calm, non-alarming language:

| Internal status | Customer label | Micro-copy (optional sub-text) |
|---|---|---|
| `intake` | Getting started | "We're setting things up." |
| `scoping` | Planning | "We're mapping out the work." |
| `in_progress` | In progress | "We're building." |
| `waiting_on_customer` | Needs your input | "We need something from you to continue." |
| `in_review` | In review | "Take a look and let us know." |
| `delivered` | Delivered | "Your work is ready." |
| `closed` | Complete | "All wrapped up." |
| `blocked` | On hold | "Paused for now — we're on it." |
| `cancelled` | Cancelled | "This project was cancelled." |

Payment (from `payment_status`, optional badge): `unpaid` → "Awaiting payment", `paid` → "Paid",
`refunded` → "Refunded".

## III.3 — Customer Read Model (Phase 3)

Returned by `get_my_projects()` per project (safe fields only):

```
project_number, title, summary, project_type, status, payment_status,
price_cents, currency, target_delivery_date, delivered_at, closed_at, created_at,
action_needed: bool,                         // status == waiting_on_customer
next_milestone: { id, title, status, due_at } | null,
milestone_progress: { done, total },         // total excludes skipped
milestones[]:   { id, title, description, status, sort_order, due_at, completed_at },
deliverables[]: { id, title, kind, url, status, delivered_at, accepted_at }   // delivered/accepted ONLY
requests[]:     { ticket_number, title, status, request_kind, created_at }    // the customer's own tickets
```

**Never exposed:** `intake_notes`, `stripe_checkout_session_id`, `stripe_payment_intent_id`,
`project_audit_events`, draft replies/approvals, any other tenant's data, or pending deliverables.

## III.4 — RLS / Security Plan (Phase 4)

**Decision:** customer reads go through ONE column-whitelisting SECURITY DEFINER RPC
(`get_my_projects()`), not direct table policies. **Why:** RLS filters rows, not columns; customers and
operators share the `authenticated` role, so a `projects` customer SELECT policy would also expose
`intake_notes` + stripe ids (column GRANTs can't separate the two cohorts on one role). The RPC returns
only safe columns and self-authorizes by joining `org_members` (active membership in the project's org)
— so it returns only the caller's org's projects, milestones, deliverables, and linked requests.

- Project tables stay **operator-only** at the row level (V2.0/V2.2 policies unchanged).
- This **supersedes** the V2.2 commented "direct customer SELECT" sketch — that sketch is not enabled.
- `tickets` already has `tickets_customer_select`; the RPC reads them as definer and filters by
  `client_id`, so no ticket-policy change is needed.
- Verify on dev: a member sees only their org's projects (safe columns); a non-member/anon gets nothing;
  the payload never contains intake_notes or stripe ids.

## III.5 — UI Proposal (Phase 5)

Smallest safe surface — **no dashboard redesign**:
- Add a **"Your Projects"** panel to the existing customer workspace (`CustomerRequest.tsx`), sibling to
  the requests panel. One `get_my_projects()` call on load.
- **Empty state = render nothing** (no header, no placeholder) so subscription-only customers see no clutter.
- Per project: a card with status pill (§III.2 label), progress bar (`done/total`), a "Next: …" line
  (`next_milestone.title`), and — when `action_needed` — a gentle "Needs your input" banner.
- Expandable detail: milestone checklist, ready-deliverable links (`url`), and linked request rows.
- Read-only in V2.3. (Submitting a request *into* a project rides the V2.2 `submit_customer_request`
  `p_project_id` change, landed in lockstep — not part of this read-only step.)
- Implementation note: this is a **new data module + new panel component**; it must NOT disturb Codex's
  in-flight `CustomerRequest.tsx` edits — coordinate placement before wiring.

## III.6 — Rollout Plan

1. Apply V2.0 → V2.2 → V2.3 to **dev** (coordinated window); run §III.4 verification + the V2.2 checks.
2. Seed a demo project (operator RPCs) and confirm `get_my_projects()` returns the safe shape.
3. Build the read-only "Your Projects" panel behind the existing auth/customer gate; ship empty-state-safe.
4. Only after that, enable project-scoped request submission (V2.2 app change) and any write surfaces.
5. Production only after WSS 1.5 is proven and a window is agreed. No merge/push/apply before then.

**Design-only / not built this session:** the panel + data module (would be production code) are
specified here, not written; only the read RPC migration is drafted (and unapplied).
