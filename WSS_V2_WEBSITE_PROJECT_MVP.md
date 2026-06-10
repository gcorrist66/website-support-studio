# WSS V2 — Website Project MVP (first implementable slice)

**Branch:** `v2-foundation` · **Date:** 2026-06-09 · **Status:** PLAN / SPEC — **not built** (awaiting GO).
**Trigger:** ~2 live customers waiting for the website-project feature. This narrows the parked V2 design
to the **smallest shippable slice** that lets Gary support real project customers without disrupting WSS 1.5.

Builds on the existing drafts: V2.0 projects, V2.2 milestones/deliverables/`project_id`, V2.3
`get_my_projects()`. **Not** needed for this slice: V2.4 capacity ledger (projects are money-priced),
self-serve checkout, OAuth, credential storage.

---

## 1. Executive Summary

Ship **operator-led project creation + a read-only customer "My Website Project" view + a guided website-
access status**, proven on a **dev** DB first. Gary manually creates a project after a customer purchases
(payment is operator-marked — **no Stripe code needed**). The customer sees what they bought, the stage,
what's next, what WSS needs from them, completed milestones, deliverables, and linked requests. Milestones
come from one of three templates (new build / redesign / cleanup). **Recommendation: GO to build this slice
on `v2-foundation` against a dev DB**, with a hard gate that nothing reaches production until dev-verified,
Codex-coordinated, and the V2 migrations are renumbered after `20260614000000`.

---

## 2. Website Project MVP Scope (Phase 1)

| Question the customer/operator must answer | Field |
|---|---|
| **What did they buy?** | `projects.title`, `project_type`, `price_cents` |
| **What website is this for?** | `projects.website_url` (NEW) + `platform` (NEW); `site_id` if an existing site |
| **What stage is the project in?** | `projects.status` → customer label (Planning / In progress / …) |
| **What is next?** | next milestone (first non-done) |
| **What does WSS need from them?** | derived `needs_from_you` (access + assets + any `waiting_on_customer`) |
| **What has been completed?** | done milestones + delivered/accepted deliverables |
| **What deliverables exist?** | `project_deliverables` (ready ones) |

**In scope:** operator creation, customer read-only view, milestones, deliverables, linked requests,
guided website-access status (WordPress + Shopify). **Out of scope (this slice):** self-serve checkout,
capacity/credits on projects, Wix guided access, credential storage, OAuth, project-scoped request
*submission* (read-only links only for now).

---

## 3. Operator Workflow (Phase 2) — operator-led, no self-serve

Gary creates the project **after** the customer pays (manual payment confirmation). The operator "New
Project" form collects:

| Form field | Maps to | Notes |
|---|---|---|
| Customer / org | `client_id` | picker over existing orgs |
| Project title | `title` | |
| Project type | `project_type` | build=`new_website`, redesign=`rebuild`, cleanup=`update`/`fix` |
| Website URL | `website_url` (NEW) | current or target |
| Platform | `platform` (NEW) | wordpress / shopify (wix later) |
| Price | `price_cents` | what they paid |
| Target delivery date | `target_delivery_date` | |
| Status | `status` | starts `scoping` or `in_progress` |
| Notes | `intake_notes` | |
| First milestone / template | seeds `project_milestones` | pick a template (§6) |
| Payment | `payment_status='paid'` | operator sets manually (no Stripe) |
| Access | `access_status='access_needed'` | initial state |

**Steps:** create project → apply a milestone template → set `access_status` → mark `payment_status=paid`
→ set `status=in_progress`. Then track: advance milestones, add/deliver deliverables, update access status.

---

## 4. Customer Workflow (Phase 3) — read-only "My Website Project"

A read-only panel (in the routed customer console) fed by `get_my_projects()`. Shows:

- **Project name** + type
- **Status** (customer-safe label) + progress bar
- **Target delivery date**
- **Next milestone** ("Next: First draft")
- **What we need from you** — derived: e.g. *"Grant WordPress access"* (access_status), *"Send your logo
  & copy"* (assets milestone pending), or the active `waiting_on_customer` ask
- **Completed milestones** (checklist)
- **Deliverables** (delivered/accepted, with links)
- **Linked requests** (read-only summaries; they keep their attachments)
- **website_access status** (the 5-state guided status, §5)

**Required of the customer:** grant website access; provide assets; answer any "Needs your input".
**Optional:** view deliverables / accept (sign-off later). **Never re-asked:** org/CMS/contact (onboarding).

---

## 5. Website Access Integration (Phase 4) — guided status, no credentials

A new enum on the project drives a **guided** access flow — **no OAuth, no credential storage**:

```
website_access_status: access_needed → access_requested → access_received → verified
                                                      ↘ blocked
```

| State | Meaning |
|---|---|
| `access_needed` | WSS needs access; customer hasn't acted |
| `access_requested` | WSS asked / sent instructions |
| `access_received` | customer says access is granted |
| `verified` | WSS confirmed it can reach the site |
| `blocked` | something is wrong (wrong role, expired invite) |

**Platform-guided copy (UI only, keyed off `platform`):**
- **WordPress:** "Add `support@websitesupportstudio.com` as an **Administrator** under Users → Add New."
- **Shopify:** "Send a **staff/collaborator** invite to `support@websitesupportstudio.com`."
- **Wix:** *next, not P0.*

The customer self-reports "I've granted access" (→ `access_received`); the operator confirms (→ `verified`)
or flags `blocked`. **Surface in the V2 project panel first**; deeper integration into 1.5's `/website_access`
section is a **coordinated follow-up with Codex** (that section is 1.5-owned) — avoids clobbering their work.

---

## 6. Milestone Templates (Phase 5)

Default ordered milestones per project type (applied at creation; operator can edit):

**1. New website (`new_website`):**
`Intake → Access received → Content & assets received → First draft → Revisions → Final review → Launch / handoff`

**2. Redesign (`rebuild`):**
`Intake → Access received → Content & assets received → Design direction → First draft → Revisions → Final review → Launch`

**3. Cleanup / update (`update` / `fix`):**
`Intake → Access received → Audit & scope → Updates / fixes → Review → Done / handoff`

Implemented as either a server RPC `operator_apply_milestone_template(project_id, template)` (atomic —
preferred) or the operator UI looping `operator_add_milestone` (no new RPC — acceptable fallback).

---

## 7. Implementation Plan (Phase 6)

**Safest rollout path (ordered):**
1. **On `v2-foundation` (no prod):** fold the website-project columns into the V2 drafts and **renumber**
   the V2 migrations to **after `20260614000000`** (Part V hazard). Consolidate to one applyable set.
2. **Prove on DEV (local stack):** apply base→V2→attachments; run the DEV proof checklist + the new checks
   (operator create + template + access; `get_my_projects()` returns the new fields; customer sees zero raw
   rows; no sensitive-field leak).
3. **Operator UI:** "New Project" form + a project detail view (status, milestone checklist, deliverables,
   access status) — mounted as an **additive tab** in the operator console (`OperatorBoard`/`AppShell`).
4. **Customer UI:** read-only "My Website Project" panel — mounted as an **additive view** in the routed
   customer console (e.g. under `/requests` or a new `/project` view), fed by `get_my_projects()`.
5. **No Stripe, no capacity, WP/Shopify only.** Manual payment; operator marks `payment_status=paid`.
6. **Prod only after** dev-verified + Codex-coordinated + renumbered migrations + a backup/rollback window.

**What can be built WITHOUT touching Stripe:** the **entire slice** — payment is operator-marked.
**What must wait:** self-serve one-time checkout (Stripe one-time branch), capacity auto-consume, Wix guided
access, credential storage / OAuth, project-scoped request *submission*.

---

## 8. Migration / RPC Plan (Phase 8)

**Schema delta (additive; folded into the renumbered V2 set):**
```sql
-- new enum
create type public.website_access_status as enum
  ('access_needed','access_requested','access_received','blocked','verified');

-- projects gains 3 columns (all additive; defaults => no rewrite)
alter table public.projects add column website_url text;
alter table public.projects add column platform text;          -- 'wordpress' | 'shopify' | 'wix' | 'other'
alter table public.projects add column access_status public.website_access_status
  not null default 'access_needed';
```

**RPC delta:**
- **Extend** `operator_create_project(...)` with optional `p_website_url`, `p_platform`,
  `p_target_delivery_date` (backward-compatible defaults).
- **New** `operator_update_project(p_project_id, …)` — edit title/url/platform/price/target date/notes.
- **New** `operator_set_project_access(p_project_id, p_access_status)` — guided access transitions + audit.
- **New** `operator_apply_milestone_template(p_project_id, p_template)` — seed §6 milestones (or UI loop).
- **Extend** `get_my_projects()` payload with `website_url`, `platform`, `access_status`, and a derived
  `needs_from_you` array. Still column-whitelisted (no `intake_notes`/stripe ids).

All operator RPCs follow the existing self-authorizing `app_operator_project_ctx` + `app_project_audit`
pattern. No change to any live 1.5 RPC. **No migration is applied in this slice's design** — these are the
exact changes to make *at build time*, on dev first.

---

## 9. UI Plan (Phase 9)

| Surface | Where | Build |
|---|---|---|
| Operator "New Project" form | operator console (new tab/route, additive) | create + template + access + mark paid |
| Operator project detail | operator console | status transitions, milestone checklist, deliverables, access status |
| Customer "My Website Project" | routed customer console (additive view) | read-only from `get_my_projects()` |
| Access status surface | inside the customer project panel first | guided copy by platform; `/website_access` integration is a Codex-coordinated follow-up |

Mount everything **additively** on top of **main's** current shells — never carry V2's older
`CustomerRequest.tsx`/`AppShell.tsx` forward (Part V).

---

## 10. Conflict Risks (Phase 7)

| main change | Impact | Handling |
|---|---|---|
| **routed operations_console** (`/overview /board /requests …`) | operator/customer mount points moved | mount V2 as additive tabs/views; take main's shells as base |
| **website_access section** | nominally 1.5-owned; we add project `access_status` | surface in the V2 project panel first; coordinate `/website_access` integration with Codex |
| **request attachments** (`614`) | linked requests keep attachments | none — orthogonal; just display them read-only |
| **_new_request modal / RequestComposer** | project-scoped *submission* would target `submit_customer_request_with_attachments` | deferred (read-only links this slice) |
| **profile / billing / credits** | founder pricing + credit model are subscription-side | projects are money-priced; keep separate; don't entangle |
| **AppShell / CustomerRequest changes** | heavy refactor on main | additive mounts only; deliberate merge, never auto |
| **`request_kind` ownership** (Part V) | `614` writes it, V2.2 creates it | V2.2 before `614`; renumber V2 > `614`; confirm prod state with Codex |

---

## 11. Recommended First Build Slice

> **Operator-led project creation + read-only customer project view + guided website-access status**,
> built on `v2-foundation` and proven on a **dev** DB. Concretely:
> - one renumbered V2 migration set (projects + milestones + deliverables + the 3 access fields +
>   extended `get_my_projects()` + the 4 operator RPCs);
> - operator "New Project" form + project detail (additive console tab);
> - customer read-only "My Website Project" panel (additive console view);
> - **manual payment** (`payment_status` set by operator), **no Stripe, no capacity, WordPress + Shopify only**.

This is the minimum that lets Gary onboard the ~2 waiting customers end-to-end (buy → project exists →
operator tracks → customer sees status → milestones/deliverables guide the work) with **zero risk to WSS 1.5**.

---

## 12. GO / NO-GO

- **GO** — build the §11 slice on `v2-foundation`, **dev-only**, pending your explicit authorization.
- **HARD GATES before production:** dev proof green (RLS isolation + no leak) · V2 migrations renumbered
  after `20260614000000` · Codex coordination on the shared shells + `/website_access` + `request_kind` ·
  backup + rollback window.
- **NO-GO (explicitly excluded from this slice):** self-serve Stripe checkout · capacity/credits on
  projects · Wix guided access · credential storage / OAuth · any production apply before the gates.

**Awaiting your GO to start building on `v2-foundation` (dev only).** Nothing is built until you authorize.
