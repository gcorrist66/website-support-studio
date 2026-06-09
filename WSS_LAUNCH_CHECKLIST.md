# Website Support Studio — Launch Checklist

**Date:** 2026-06-08 · **Branch:** main · **Owner of this doc:** Gary (founder)
**Status legend:** ✅ done/verified · 🟡 in progress / partial · ⬜ not started · 🚧 blocked (needs input)
**Owner key:** **F** = Founder (Gary) · **E** = Engineering · **F+E** = shared

> **Mission lens:** every item is judged by "does it help a real customer Pay → Onboard → Submit → Consume Capacity → Renew?" If not, it's P2.

---

## Verified state today (what's already done)

| Area | State |
|---|---|
| Marketing site (Astro) + pricing page ($399 / $899 / Enterprise + add-ons, green "join now") | ✅ live / built |
| Auth foundation (Vite app, router, Supabase auth client, Google OAuth shell) | ✅ built; feature-flagged OFF |
| Customer identity, tenant model, canonical agency, operator linkage | ✅ verified on DEV |
| RLS (Phase E) — 37 policies, helpers, column guard | ✅ verified on DEV (incl. a real trigger bug found + fixed) |
| Stage A billing — `subscriptions`, `provision_paid_customer`, webhook RPCs | ✅ verified on DEV |
| Stage B — `claim_my_paid_org`, `complete_paid_onboarding` (Google login → owner → onboarding) | ✅ verified on DEV |
| Stripe products/prices: **Operations $399/mo, Growth $899/mo, Enterprise (product), DNS $100** | ✅ created **LIVE** |
| Stripe top-ups (50/100/250 CU) | 🟡 250 product exists (no price); 50/100 not created; **amounts TBD** |
| Edge functions deployed, webhook registered, prod Supabase, prod verification, auth flag | ⬜ not started |

**Nothing is in production yet.** All verification is on the DEV project `vrtfbbrwrxyljchywmzy`. `VITE_WSS_REAL_AUTH_ENABLED` is OFF everywhere.

---

## P0 — Must complete before the FIRST paying customer

The end-to-end loop must work for one real customer (pay → log in → onboard → request delivered).

| # | Item | Owner | Status | Dependencies | Verification |
|---|---|---|---|---|---|
| 1 | **Production Supabase project** provisioned (separate from dev) | F | ⬜ | — | Project ref exists; CLI linked to it |
| 2 | **Apply migrations to prod** (`…180000 → …250000`) | E | ⬜ | #1 | `supabase db push` clean; canonical agency `website-support-studio` row present |
| 3 | **Production verification** — run RLS harness + Stage B chain sim on prod | E | ⬜ | #2 | `phase_e_rls_verification.sql` → "ALL SCENARIOS PASSED"; provision→claim→onboard green |
| 4 | **Google OAuth configured** (Google Cloud client + Supabase provider) | F+E | 🚧 needs Google client ID/secret | #1 | Real Google login returns a session at `/auth/callback`. Site URL `https://app.websitesupportstudio.com`; redirects incl. `https://app.websitesupportstudio.com/auth/callback` + `http://localhost:5173/auth/callback`; provider URI `https://<prod-ref>.supabase.co/auth/v1/callback` |
| 5 | **Deploy Stripe Edge Functions** (`create-checkout-session`, `stripe-webhook`) | E | ⬜ | #1 | `supabase functions deploy`; checkout fn returns a Stripe URL |
| 6 | **Set function secrets** (`STRIPE_SECRET_KEY`, price IDs, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`/`SITE_URL`) | F+E | ⬜ | #5 | `supabase secrets list` shows all; checkout creates a live session |
| 7 | **Register Stripe webhook** endpoint → capture `STRIPE_WEBHOOK_SECRET` | F | ⬜ | #5 | Stripe test event → 200; `provision_paid_customer` creates a subscription+org row |
| 8 | **Set `PUBLIC_WSS_CHECKOUT_URL`** in the marketing build | E | ⬜ | #5 | Marketing "join now" redirects to Stripe Checkout (not /contact) |
| 9 | **Bootstrap first production operator** (Gary) | F+E | ⬜ | #2, #4 (login to mint `auth.uid`) | `bootstrap_first_operator(<uid>,'agency_admin',…)`; operator resolves a session |
| 10 | **Operator access under production auth** — a logged-in operator reaches the console and can triage/approve/deliver | E | ⬜ **(gap)** | #9, auth flag | With the flag on, an operator login routes to the operator console (today it routes to the customer gate). Needs operator-vs-customer routing wired. Verify: Gary can approve+send a request |
| 11 | **RLS rollback runbook** ready (disable/re-enable) | E | 🟡 documented, not rehearsed | — | Dry-run disable→enable on dev; confirm policies reactivate |
| 12 | **Enable auth flag in production** (`VITE_WSS_REAL_AUTH_ENABLED=true`) | F | ⬜ | #1–#10 | Set in prod build only |
| 13 | **End-to-end smoke (live)** — one real/test purchase → login → onboard → operator delivers | F+E | ⬜ | all above | Pay (real or Stripe test card) → Google login → claim → onboarding complete → operator sees + delivers the request |

> **Note on "Consume Capacity Units":** for the very first customer this can be tracked **manually** by the operator. Automated capacity is P1 (#below). Renewal billing works automatically via the Stripe subscription + `invoice.paid` handler (CU replenish is P1).

---

## P1 — Must complete before PUBLIC launch (self-serve at scale)

| # | Item | Owner | Status | Dependencies | Verification |
|---|---|---|---|---|---|
| 14 | **Capacity Unit engine** — classification (Low/Med/High), ledger, remaining balance, consume-at-approval, renewal replenish (`invoice.paid`) | E | ⬜ | P0 done | Submitting + approving a request debits CU; renewal credits monthly allotment; remaining calculates correctly |
| 15 | **Customer dashboard** — Plan, Capacity Remaining, Open/Completed Requests, Recent Activity (capacity only, no hours) | E | ⬜ | #14 | Customer sees own plan + capacity + requests (RLS-scoped); no internal data leaks |
| 16 | **Customer submit/track request UI** | E | ⬜ | #15 | Customer creates a request → ticket appears for operators; status visible to customer |
| 17 | **Capacity top-ups** — 50/100/250 CU prices + one-time checkout → CU credit | F (amounts) + E | 🚧 amounts TBD; clean up stray priceless 250 product | #14 | One-time purchase adds CU to balance |
| 18 | **Stripe billing portal** (self-serve renew/cancel/update card) | E | ⬜ | P0 #5–#7 | Customer can manage subscription from the app |
| 19 | **Fix dev anon read path** (`readOnlyTicketData` / `validate:*`) under RLS — move to service-role/seeded auth | E | 🟡 documented | — | Dev validation passes without granting anon |
| 20 | **Email notifications** (request received/updated, low capacity, payment failed) | E | ⬜ | Resend wired | Customer/operator receive transactional emails |
| 21 | **Down-migration / RLS recovery rehearsed**; idempotent policy migration as the recovery lever | E | 🟡 migration exists | — | Recovery path tested on dev |
| 22 | **Marketing/legal polish** — security/trust page, SLA/response expectations, escalation, CTA consistency (from the earlier enterprise audit) | F+E | ⬜ | — | Enterprise-credible content live |

---

## P2 — Post-launch improvements

| # | Item | Owner | Status | Notes |
|---|---|---|---|---|
| 23 | **Website Launch Package (V2)** — website generation / migration / native build | F | ⬜ roadmap only | **Do not build.** Only the store-only interest flags (rebuild/migration/native) are collected. V2 starts after MMVP is proven. |
| 24 | GitHub OAuth (optional secondary login) | E | ⬜ | Google is primary; add if requested |
| 25 | Per-operator client/site scoping + operator invitation UI | E | ⬜ | Operator RPCs exist; needs admin UI |
| 26 | Operational reporting / throughput metrics | E | ⬜ | Capacity-based, not hours |
| 27 | Top-up rollover policy, usage analytics, dunning refinements | E | ⬜ | After CU engine is live |
| 28 | Multi-agency / reseller (white-label) | E | ⬜ | Tenant model already supports it additively |
| 29 | SOC 2 / formal security program | F | ⬜ | Enterprise sales enabler |

---

## Critical path to first revenue (shortest sequence)

1 → 2 → 3 (prod DB ready & verified) · 4 (Google login) · 5 → 6 → 7 → 8 (Stripe live) · 9 → 10 (operator can deliver) · 11 (safety) · 12 → 13 (turn on + smoke test).

**Top blockers needing the founder right now:** (a) **Google Cloud OAuth client ID/secret** (#4), (b) **production Supabase project** decision (#1), (c) **Stripe webhook registration** (#7), and (d) the **top-up amounts** (#17, P1). The one engineering gap to flag early is **#10 — operator routing under real auth** (today a logged-in operator hits the customer gate, not the console).

---

*No code was written and nothing was committed or pushed in producing this checklist.*
