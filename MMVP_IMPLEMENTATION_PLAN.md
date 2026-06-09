# WSS MMVP (V1.5) — Implementation Plan

**Date:** 2026-06-08 · **Branch:** main · **Base commit:** 5936feb
**Mission:** a real customer can **Pay → Onboard → Submit → Consume Capacity Units → Renew** with no manual intervention.
**Lens:** if it doesn't help acquire/qualify/sell/onboard/deliver/renew, it's lower priority. No V2, no website generation.

---

## 0. Critical sequencing insight (read first)

The success loop requires a customer to **log in** (to onboard, submit, track). OAuth is listed P4/last — but a self-serve loop can't exist without a customer login method. **Resolution: use magic-link (email OTP) for customer login at MMVP.** Supabase Auth supports magic links with zero provider config, it matches the post-checkout email we already have, and it unblocks the whole loop without the Google/GitHub OAuth provisioning. **OAuth (P4) then becomes a real "nice to have / fast follow," not a blocker.** The auth shell (`AuthProvider`, `realAuthClient`, `/auth/callback`) already supports this — add a magic-link call alongside the OAuth buttons.

This single decision removes OAuth from the critical path.

---

## 1. Current gap analysis

| Capability | State | Gap |
|---|---|---|
| Visit WSS / marketing | ✅ live | Pricing page is contact-sales (Desk/Operations/Growth, no figures) → needs the real $399/$899/Enterprise + CU + top-ups/DNS |
| Understand pricing | ⚠️ | Figures + CU semantics not shown |
| **Purchase a plan (Pay)** | ❌ none | **No Stripe in WSS** (only a SUBPROCESSORS mention). No products/prices/checkout/webhook |
| Account from payment | ❌ none | No pay→org linkage; org is created by onboarding RPC, not by purchase |
| Customer login | ⚠️ shell only | Auth shell exists but flag-off, no prod project, no magic-link wired |
| **Complete onboarding** | ⚠️ partial | `complete_customer_onboarding` exists; missing hosting_provider, website_age, V2-interest flags; not linked to a paid plan |
| **Submit requests** | ⚠️ operator-side only | Tickets exist + RLS allows customer insert (contributor), but **no customer UI** to submit |
| **Track requests** | ❌ none | No customer dashboard/portal |
| **Consume Capacity Units** | ❌ none | No plan/subscription/CU model at all |
| **Renew monthly** | ❌ none | No Stripe subscription / renewal CU replenish |
| Operator delivery | ✅ | Operator console + approval gate exist (human approval retained) |
| RLS / tenant isolation | ✅ verified (dev) | Needs prod apply + verify |

**Net:** the *foundation* (auth, identity, tenant, RLS, onboarding RPC, operator console) is done. The *revenue machine* (Stripe, plans/subscriptions, capacity units, customer portal, magic-link login, prod env) is entirely net-new.

---

## 2. Exact implementation order (fastest path to a paying, self-serve customer)

**Stage A — Sellable (P0 Revenue)**
1. Pricing config (single source of truth) + update marketing `/pricing` to real figures + CU.
2. Stripe products/prices (Operations, Growth, Enterprise-contact, + 3 top-ups, DNS).
3. `create-checkout-session` (Supabase Edge Function) + "Join Now/Choose plan" → Stripe Checkout (subscription mode).
4. `stripe-webhook` (Edge Function): on `checkout.session.completed`/`customer.subscription.created` → create org (`clients`) + `subscriptions` row + grant monthly CU + create a **pending owner membership** keyed to the buyer email.

**Stage B — Accessible (P1 Onboarding + login)**
5. Magic-link customer login (extend `LoginPage`/`AuthProvider`); claim pending membership on first login (link `auth.uid()` to the org, like operator accept).
6. Extend onboarding (RPC + form): hosting_provider, website_age, V2-interest; mark `onboarding_status='complete'`.

**Stage C — Usable (P2 Capacity + P3 Dashboard)**
7. Capacity engine: `subscriptions` + `capacity_ledger` + `org_capacity_remaining()` + request CU columns.
8. Customer dashboard: Plan, Capacity Remaining, Open/Completed Requests, Recent Activity.
9. Submit-request UI (customer) → ticket created (status `received`); operator classifies CU level (human approval) → CU consumed on approval/delivery.

**Stage D — Recurring (P0 Renew) + Top-ups**
10. Webhook `invoice.paid` (renewal) → replenish monthly CU for the new period.
11. Top-up + DNS one-time checkouts → webhook adds CU ledger entry / flags DNS task.
12. Stripe billing portal session (self-serve renew/cancel/update card).

**Stage E — Production**
13. Provision prod Supabase, apply migrations (`…180000 → …220000` + new ones), verify RLS on prod.
14. Wire Stripe live keys + webhook endpoint; bootstrap first operator; staging smoke test; flip `VITE_WSS_REAL_AUTH_ENABLED`.

Stages A→B→C are the minimum for "pay + onboard + submit + consume"; Stage D adds "renew"; Stage E ships it.

---

## 3. Files to change / create

**Pricing + marketing**
- `marketing/src/consts.ts` — add `PLANS` (figures, CU, site limits) + add-ons (top-ups, DNS).
- `marketing/src/pages/pricing.astro` — show Operations $399 / Growth $899 / Enterprise (contact) + CU + top-ups/DNS; CTA per plan → checkout.
- (new) `src/billing/plans.ts` — app-side plan/price/CU config (shared source of truth; mirrors marketing consts).

**Stripe (server-side; secrets never in browser)**
- (new) `supabase/functions/create-checkout-session/index.ts` — Deno Edge Function.
- (new) `supabase/functions/stripe-webhook/index.ts` — signature-verified webhook.
- (new) `supabase/functions/create-billing-portal-session/index.ts`.
- (new) `supabase/functions/_shared/stripe.ts`, `cors.ts`.

**Auth / login**
- `src/components/auth/LoginPage.tsx` — add magic-link (email) flow.
- `src/auth/AuthProvider.tsx` — add `signInWithMagicLink(email)`.
- (new) `src/auth/claimMembership.ts` (or an RPC call) — link first login to a pending org membership.

**Customer portal (new surface)**
- `src/app/AppRouter.tsx` — add customer routes (`/dashboard`, `/requests`, `/requests/new`, `/requests/:id`) gated to active `org_members`.
- (new) `src/components/customer/Dashboard.tsx`, `CapacityCard.tsx`, `RequestList.tsx`, `NewRequestForm.tsx`, `RequestDetail.tsx`.
- (new) `src/data/customerData.ts` — supabase-js reads (RLS-scoped) for plan/capacity/requests.
- `src/components/auth/WorkspaceSetupRequired.tsx` — route a paid-but-not-onboarded user into onboarding instead of a dead end.

**Onboarding**
- (new/extended) onboarding form component + call to the extended RPC.

**Operator console (capacity classification)**
- `src/components/tickets/*` + `src/handlers/ticketWorkflowHandlers.ts` — add CU-level classification at triage/approval (operator sets Low/Medium/High; CU consumed on approval).

---

## 4. Database changes (new migrations, additive; RLS on each)

1. **`public.subscriptions`** — `id`, `org_id → clients`, `plan text check (operations|growth|enterprise)`, `status text (trialing|active|past_due|canceled)`, `stripe_customer_id`, `stripe_subscription_id`, `sites_limit int`, `monthly_cu int`, `current_period_start/end timestamptz`, timestamps. One active subscription per org (partial unique). RLS: customer select own (`app_is_org_member`), writes via webhook/service-role only.
2. **`public.capacity_ledger`** (append-only) — `id`, `org_id → clients`, `period_start/period_end`, `delta int` (+grant/+topup, −consume), `kind text (monthly_grant|topup|consume|adjustment)`, `request_id text → tickets(id) null`, `note`, `created_at`. RLS: customer select own; inserts via service-role/RPC only.
3. **Function `public.org_capacity_remaining(p_org_id uuid) returns int`** — `sum(delta)` over the active period (SECURITY DEFINER; used by dashboard).
4. **Tickets CU columns** — add `cu_level text check (low|medium|high|enterprise)`, `cu_cost int`, `cu_charged_at timestamptz` to `public.tickets` (consumed on approval; ledger entry written then).
5. **`org_profiles` extension** — add `hosting_provider text`, `website_age text`, `interested_in_rebuild bool default false`, `interested_in_migration bool default false`, `interested_in_native bool default false` (store-only, never surfaced publicly).
6. **Pending-membership support** — either reuse `org_invitations` (a checkout creates a pending invite keyed to buyer email + token) **or** allow `org_members.status='invited'` rows created by the webhook; first login claims via an RPC `claim_org_membership(token|email-verified)` binding `auth.uid()` (durable key = `auth_user_id`, email is bootstrap only).
7. **Extend `complete_customer_onboarding`** — add the §5 onboarding params; do not create the subscription (the webhook owns that); set `onboarding_status='complete'`.
8. **RLS** — enable + policies for `subscriptions`, `capacity_ledger` (customer-read-own, service/RPC-write); add to the idempotent policy migration. Re-verify with the harness.

**Capacity policy decisions (MMVP, keep simple):** monthly allotment is granted as a `monthly_grant` ledger entry at each period (webhook); top-ups add a `topup` entry to the current period; **no rollover** at MMVP (document). Remaining = `org_capacity_remaining`. CU is **consumed at operator approval** (human gate retained), not at submit, so a customer can submit even at 0 CU but delivery requires capacity/top-up.

---

## 5. Stripe changes

**Products & prices (live + test):**
| Object | Type | Price |
|---|---|---|
| Operations | product → recurring price | $399/mo |
| Growth | product → recurring price | $899/mo |
| Enterprise | product (no public price) | contact-sales (manual invoice) |
| Top-up 50 CU | product → one-time price | TBD |
| Top-up 100 CU | product → one-time price | TBD |
| Top-up 250 CU | product → one-time price | TBD |
| DNS Assistance | product → one-time price | $100 |

(Top-up prices are a business decision — flagged as a required input.)

**Checkout flow:** marketing/dashboard "Choose plan" → `create-checkout-session` (mode `subscription`, line item = plan price, `customer_email` = buyer, `metadata.plan` + `metadata.intent='new_org'`, success/cancel URLs) → Stripe Checkout → success URL on `app.websitesupportstudio.com`.

**Customer creation flow:** Stripe creates the Customer at checkout; webhook stores `stripe_customer_id` on the new `subscriptions`/org. Buyer email becomes the pending-owner email.

**Recurring billing flow:** Stripe subscription bills monthly; `invoice.paid` (cycle) → webhook writes a `monthly_grant` CU ledger entry for the new period + advances `current_period_*`. `customer.subscription.deleted`/`past_due` → set subscription status (gate delivery, not data access).

**Add-ons:** top-up/DNS via one-time Checkout (mode `payment`, `metadata.org_id`, `metadata.kind`) → webhook `checkout.session.completed` → `topup` ledger entry (CU) or DNS task flag.

**Webhook events handled:** `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`. Signature-verified with `STRIPE_WEBHOOK_SECRET`. **Secrets (`STRIPE_SECRET_KEY`, webhook secret) live only in Edge Function env — never `VITE_*`.**

**Billing portal:** `create-billing-portal-session` → Stripe Customer Portal for self-serve renew/cancel/update card (covers "Renew" + dunning).

---

## 6. Dashboard changes (customer portal — capacity only, no hours)

New authenticated customer surface (RLS-scoped via `org_members`):
- **Dashboard (`/dashboard`):** Plan name + limits; **Capacity Remaining** (`org_capacity_remaining`) with period reset date; Open requests count; Completed count; Recent Activity (last N ticket events the customer is allowed to see — `tickets`/`ticket_messages`/`ticket_communications` only; never draft_replies/approvals/audit).
- **Requests list (`/requests`):** open + completed, with status + CU cost.
- **New request (`/requests/new`):** title, description, site (from org's sites), optional priority → creates a `tickets` row (`received`); shows estimated CU after operator classification.
- **Request detail (`/requests/:id`):** status timeline (customer-visible events), messages thread (customer can add `ticket_messages`).
- **Top-up CTA** when capacity is low → one-time checkout.
No hours, no engineering metrics — capacity units only.

---

## 7. Customer onboarding changes

Flow: **pay → (webhook creates org + pending owner) → magic-link login → onboarding form → dashboard.**
Onboarding form collects: **Company, Website URL, Platform (cms_platform), Hosting Provider (new), Website Age (new), Primary Contact, Support Email**, plus store-only **Interested in Rebuild / Migration / WSS-Native** (new booleans). Calls the extended `complete_customer_onboarding` (which now fills profile + creates first site + sets `onboarding_status='complete'`; the org/subscription already exist from the webhook). V2 interest is **stored only**, never shown or marketed.

---

## 8. Estimated effort (engineer-days; sizing, not a schedule)

| Stage | Work | Est. |
|---|---|---|
| A | Pricing config + marketing pricing rewrite + Stripe products/prices + checkout fn + webhook (org/sub/CU grant) | 4–6 d |
| B | Magic-link login + pending-membership claim + onboarding extension (RPC + form) | 3–4 d |
| C | Capacity engine (subscriptions, ledger, remaining fn, ticket CU columns, operator classification) + customer dashboard + submit/track UI | 6–9 d |
| D | Renewal CU replenish + top-up/DNS one-time + billing portal | 2–3 d |
| E | Prod Supabase provision + migrate + RLS verify + Stripe live + smoke test + flag flip | 2–3 d |
| — | RLS re-verify across new tables + buffer | 1–2 d |
| **Total** | **MMVP** | **~18–27 eng-days** |

Stages A+B (sellable + accessible) ≈ 7–10 days get the first dollar in; C makes it deliverable; D makes it recurring.

---

## 9. Remaining blockers

**Critical (block first paying customer)**
1. **No Stripe integration** — products/prices/checkout/webhook all net-new (Stage A).
2. **No plan/subscription model** — `subscriptions` table + webhook population (Stage A).
3. **Customer login not live** — wire **magic-link** + prod Supabase + flip flag (Stages B/E). (Removes OAuth from the critical path.)
4. **Pay→account linkage** — webhook→pending-owner→first-login claim (Stages A/B).
5. **Prod Supabase not provisioned / RLS not on prod** — Stage E (migrations `…180000 → …220000` + new).

**High (block "consume + track + renew")**
6. **No Capacity Unit engine** — ledger + remaining + ticket CU + operator classification (Stage C).
7. **No customer dashboard / submit UI** — Stage C.
8. **Renewal CU replenish** — `invoice.paid` handler (Stage D).
9. **Onboarding missing fields** — hosting/age/V2-interest + extended RPC (Stage B).

**Medium (polish / self-serve completeness)**
10. Top-up + DNS one-time flows; billing portal (Stage D).
11. Email notifications (request received/updated, low-capacity, payment failed).
12. Retire anon dev validators under RLS (from rollout doc); author Stripe price-IDs/top-up pricing (business input).

**Business inputs required (not code):** top-up prices (50/100/250 CU), Enterprise handling (manual invoice vs contact form), and confirmation that DNS assistance is a one-time $100 task flag.

---

## Guardrails honored
No V2 / website generation / hosting automation / platform recommendations — V2 interest is **stored only**. Human approval gate retained (CU consumed at approval). Capacity-only customer metrics (no hours). Nothing built, committed, or pushed in this planning pass.
