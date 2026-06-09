# WSS — Production Go-Live Runbook (Verified Locally → Production Verified)

**Date:** 2026-06-08 · **State:** code + migrations + functions ready; **fully verified on DEV**. Production not yet provisioned.
**Owner key:** **F** = Founder (your cloud accounts / browser) · **A** = Agent (I can run once you grant access/values).

> **Honest status:** every step below is **F** (or requires real browser/card/Google actions). I cannot self-provision a billable Supabase project, obtain Google OAuth secrets, register a live Stripe webhook, or pay/login as a human. I've made each step copy-paste exact. Where marked **A**, I can run it the moment you provide the project link + secret values.

Migrations to apply (in this order): `…0001, …0002, …6c, …180000, …190000, …200000, …200001, …210000, …220000, …230000, …240000, …250000, …260000, …270000, …280000`.
Live Stripe price IDs (already created): Operations `price_1TgE1f0AxyxlKIBMfAgvXUh7` · Growth `price_1TgE1u0AxyxlKIBMwYifh5id` · DNS `price_1TgE220AxyxlKIBMw1UjGfXm` · Enterprise product `prod_UfZ8i5eJOq0b3S` (no price).

---

## P0.1 — Production Supabase project (F)
Decision required (org, region, name, DB password — billable):
```
supabase projects create "website-support-studio-prod" --org-id izcpxzxpvisqntwvqmrc --region us-east-1   # choose; prompts for DB password
```
Then capture `<PROD_REF>`, the anon key, and the service-role key (Dashboard → Settings → API).
> Why F: creating a billable project + choosing org/region/password is your account decision. (Alternatively designate an existing project as prod.)

## P0.2 — Apply all migrations to prod (A, once linked)
```
supabase link --project-ref <PROD_REF>     # F provides the DB password
supabase db push --yes                      # applies all 15 migrations
supabase db push --dry-run                  # expect "Remote database is up to date"
```
Verify (A): canonical agency present (`select 1 from agencies where slug='website-support-studio'`), 37 policies, RLS on 15 tables, the workflow/identity/billing RPCs exist — same checks proven on dev.

## P0.3 — Google OAuth production config (F — needs Google Cloud)
1. Google Cloud Console → APIs & Services → Credentials → **OAuth 2.0 Client ID (Web)**.
   - Authorized redirect URI: `https://<PROD_REF>.supabase.co/auth/v1/callback`
   - Authorized JS origins: `https://app.websitesupportstudio.com`
2. Supabase (prod) → Auth → URL Configuration:
   - Site URL: `https://app.websitesupportstudio.com`
   - Redirect URLs: `https://app.websitesupportstudio.com/auth/callback` (+ `http://localhost:5173/auth/callback` for testing)
3. Supabase → Auth → Providers → **Google**: enable, paste Client ID + Secret.
> Why F: requires your Google Cloud project + secret. I have no Google credentials.

## P0.4 — Deploy Stripe edge functions to prod (A, once linked)
```
supabase functions deploy create-checkout-session --project-ref <PROD_REF>
supabase functions deploy stripe-webhook --project-ref <PROD_REF>
```
Function URLs: `https://<PROD_REF>.supabase.co/functions/v1/{create-checkout-session,stripe-webhook}`.

## P0.5 — Register Stripe webhook (F — Stripe dashboard, live)
Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://<PROD_REF>.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed`
- Capture the **Signing secret** (`whsec_…`).
> Why F: live-Stripe mutation + the signing secret is yours.

## P0.6 — Configure production secrets (F provides values; A can set)
```
supabase secrets set --project-ref <PROD_REF> \
  STRIPE_SECRET_KEY=sk_live_… \
  STRIPE_WEBHOOK_SECRET=whsec_… \
  STRIPE_PRICE_OPERATIONS=price_1TgE1f0AxyxlKIBMfAgvXUh7 \
  STRIPE_PRICE_GROWTH=price_1TgE1u0AxyxlKIBMwYifh5id \
  STRIPE_PRICE_DNS=price_1TgE220AxyxlKIBMw1UjGfXm \
  SUPABASE_URL=https://<PROD_REF>.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=… \
  APP_URL=https://app.websitesupportstudio.com SITE_URL=https://websitesupportstudio.com
```
Hosting env (Vercel) — marketing: `PUBLIC_WSS_CHECKOUT_URL=https://<PROD_REF>.supabase.co/functions/v1/create-checkout-session`; app: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon only).

## P0.7 — Bootstrap first operator (F login + A/F run)
1. F logs in once via Google on the app (mints `auth.users` row). Capture the `auth.uid()`.
2. As service_role: `select bootstrap_first_operator('<gary-uid>','agency_admin','Gary','gary@…')`.
3. Verify: `resolve_my_identity()` → `kind=operator`.

## P0.8 — Enable auth flag (F)
Set `VITE_WSS_REAL_AUTH_ENABLED=true` in the **production app** build env (Vercel) and redeploy the app. **Last step**, only after P0.1–P0.7.

---

## Production verification (the loop) — requires real browser + card (F)
1. **Customer Pays** — open `https://websitesupportstudio.com/pricing`, click join now → Stripe Checkout → pay (real card or, in test mode, a test card). *(Agent cannot enter a card.)*
2. **Logs in** — Google login on `app.` → `/auth/callback`. *(Agent cannot complete Google consent.)*
3. **Onboards** — claim → onboarding form → complete. *(verified on dev via RPC sim.)*
4. **Creates request** — (customer request UI is the next stage; at MMVP, the request can be taken via the operator console / email until the customer submit UI ships — see note.)
5. **Operator logs in** (Gary, Google) → console → **sees request** (RLS-scoped).
6. **Operator delivers** — triage → draft → approve (Gary gate) → send → close. *(verified on dev: 11/11.)*
7. **Customer receives response** — `ticket_communications` row created on send; delivery email requires the email provider wired (Resend) — currently the send records the communication; outbound email delivery is a fast-follow.

> The data/logic of steps 3–6 is verified on dev end-to-end. Steps 1–2 (and 7's email) require real browser/card/Google + the email provider, which are F/external.

---

## Hard blockers (why "Production Verified" can't be reached from here)
1. **No production Supabase project** + creating one is a billable, org/region/password account decision (F).
2. **Google OAuth secrets** — require your Google Cloud OAuth client (F); I cannot create or hold them.
3. **Live Stripe webhook + prod secrets** — your Stripe dashboard + secret values (F).
4. **The verification loop needs real human browser actions** — paying with a card and completing Google login cannot be performed by an agent.
5. (Fast-follows, not strictly P0 for "pays→delivers": customer request-submit UI and outbound email via Resend.)

**What I can do the instant you unblock:** once you (a) create/designate the prod project + share the link/DB password and (b) provide the Stripe/Supabase secret values + Google provider configured, I will run P0.2, P0.4, P0.6 (secrets), and the P0.7 bootstrap RPC, and re-run the full DB-layer verification suite against prod. The browser/card/Google steps remain yours.
