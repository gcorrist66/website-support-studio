# WSS — Founder Launch Day (do this in one sitting)

**Goal:** take Website Support Studio from *verified on dev* → *live in production*, and prove the full loop:
**Customer pays → logs in → onboards → creates request → operator delivers → customer gets a response.**

**Time:** ~90–120 min. **You'll need open:** Supabase dashboard, Google Cloud Console, Stripe dashboard, Vercel dashboard, a terminal in `/Users/corristonconsulting/Projects/website-support-studio`, and the Supabase CLI logged in (`supabase projects list` should work).

**Conventions:** `<PROD_REF>` = the new prod project ref you create in Step 1. Tick each `[ ]`. Verify lines say what "good" looks like. If anything breaks, see **If it breaks** at the bottom.

> Tip: do the whole first pass in **Stripe TEST mode** (test keys + a $0 promo code) to prove the loop with zero money, then flip to live keys. The live products/prices already exist; test mode needs test-mode products (Step 3 covers both).

---

## 1. Production Supabase project + migrations  (~20 min)

- [ ] **Create the project:** Supabase dashboard → New project → name `website-support-studio-prod`, region `us-east-1` (or nearest), set a strong **DB password** (save it). Wait for it to provision.
- [ ] Copy from **Settings → API**: the **Project URL** (`https://<PROD_REF>.supabase.co`), the **anon** key, and the **service_role** key. (Keep service_role secret.)
- [ ] **Link + apply migrations** (terminal):
  ```
  supabase link --project-ref <PROD_REF>      # enter the DB password
  supabase db push                            # applies all 15 migrations
  supabase db push --dry-run                  # must say: Remote database is up to date
  ```
- [ ] **Verify schema** — Supabase → SQL Editor, run:
  ```
  select count(*) from pg_policies where schemaname='public';                 -- expect 37
  select count(*) from agencies where slug='website-support-studio';          -- expect 1
  select count(*) from pg_proc where proname in
    ('provision_paid_customer','claim_my_paid_org','resolve_my_identity',
     'bootstrap_first_operator','operator_triage_ticket','operator_send_reply'); -- expect 6
  ```
  ✔ Good: 37 policies, 1 canonical agency, 6 functions.

---

## 2. Google OAuth  (~20 min)

- [ ] **Google Cloud Console** → APIs & Services → Credentials → **Create OAuth client ID** → type **Web application**.
  - Authorized **redirect URI**: `https://<PROD_REF>.supabase.co/auth/v1/callback`
  - Authorized **JavaScript origin**: `https://app.websitesupportstudio.com`
  - (If prompted, configure the OAuth consent screen first — External, app name "Website Support Studio", your support email.)
  - [ ] Copy the **Client ID** and **Client secret**.
- [ ] **Supabase → Authentication → URL Configuration:**
  - Site URL: `https://app.websitesupportstudio.com`
  - Redirect URLs (add both): `https://app.websitesupportstudio.com/auth/callback` and `http://localhost:5173/auth/callback`
- [ ] **Supabase → Authentication → Providers → Google:** toggle **Enabled**, paste Client ID + Client secret, save.
  ✔ Good: Google shows "Enabled."

---

## 3. Stripe  (~20 min)

> If doing a TEST-mode dry run first: switch the Stripe dashboard to **Test mode**, create test products for Operations/Growth/DNS (same prices), and use the **test** secret/price IDs below. The **live** price IDs already created are:
> Operations `price_1TgE1f0AxyxlKIBMfAgvXUh7` · Growth `price_1TgE1u0AxyxlKIBMwYifh5id` · DNS `price_1TgE220AxyxlKIBMw1UjGfXm`.

- [ ] **Deploy the edge functions** (terminal, project still linked to `<PROD_REF>`):
  ```
  supabase functions deploy create-checkout-session
  supabase functions deploy stripe-webhook
  ```
  Function URLs become `https://<PROD_REF>.supabase.co/functions/v1/{create-checkout-session,stripe-webhook}`.
- [ ] **Register the webhook:** Stripe → Developers → Webhooks → **Add endpoint**:
  - URL: `https://<PROD_REF>.supabase.co/functions/v1/stripe-webhook`
  - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
  - [ ] Copy the **Signing secret** (`whsec_…`).
- [ ] **Set function secrets** (terminal):
  ```
  supabase secrets set \
    STRIPE_SECRET_KEY=sk_live_or_test_… \
    STRIPE_WEBHOOK_SECRET=whsec_… \
    STRIPE_PRICE_OPERATIONS=price_1TgE1f0AxyxlKIBMfAgvXUh7 \
    STRIPE_PRICE_GROWTH=price_1TgE1u0AxyxlKIBMwYifh5id \
    STRIPE_PRICE_DNS=price_1TgE220AxyxlKIBMw1UjGfXm \
    SUPABASE_URL=https://<PROD_REF>.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
    APP_URL=https://app.websitesupportstudio.com \
    SITE_URL=https://websitesupportstudio.com \
    ALLOWED_ORIGINS=https://websitesupportstudio.com,https://www.websitesupportstudio.com,https://app.websitesupportstudio.com
  supabase secrets list   # confirm all keys present
  ```
  (Use the **test** secret key + **test** price IDs if doing the dry run first.)
  ✔ Good: functions deployed; webhook endpoint shows "Enabled"; `secrets list` shows every key.

---

## 4. Vercel env vars + deploy  (~15 min)

Two Vercel projects (one repo): **marketing** (root dir `marketing/`, domain `websitesupportstudio.com`) and **app/console** (root dir `./`, domain `app.websitesupportstudio.com`).

- [ ] **Marketing project → Settings → Environment Variables (Production):**
  - `PUBLIC_WSS_CHECKOUT_URL=https://<PROD_REF>.supabase.co/functions/v1/create-checkout-session`
  - (optional) `PUBLIC_GA4_ID` / `PUBLIC_GTM_ID`
- [ ] **App/console project → Environment Variables (Production):**
  - `VITE_SUPABASE_URL=https://<PROD_REF>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<anon key>`
  - **Leave `VITE_WSS_REAL_AUTH_ENABLED` UNSET for now** (you flip it on in Step 7, last).
- [ ] Confirm domains: apex → marketing project (with `www` → apex redirect); `app.` → console project.
- [ ] **Redeploy both** so the env vars take effect.
  ✔ Good: `https://websitesupportstudio.com/pricing` loads; `https://app.websitesupportstudio.com` loads (still shows the dev console because the flag is off — expected).

---

## 5. Bootstrap the first operator (you)  (~10 min)

The flag is still off, so log in via a temporary local run to mint your auth user — or flip the flag (Step 7) first and do this between 7a and 7b. Recommended order: do **5** right after **7a**.

- [ ] **(after enabling the flag, Step 7a)** Go to `https://app.websitesupportstudio.com`, click **continue with google**, complete login. This creates your `auth.users` row.
- [ ] **Get your user id:** Supabase → Authentication → Users → click your account → copy the **UID**.
- [ ] **Bootstrap yourself as operator** — Supabase → SQL Editor (runs as service role):
  ```
  select public.bootstrap_first_operator('<your-uid>','agency_admin','Gary','gary.corriston@gmail.com');
  ```
- [ ] **Verify:** in SQL Editor:
  ```
  select role, status from operators where email='gary.corriston@gmail.com';   -- agency_admin / active
  ```
  ✔ Good: one active `agency_admin` operator = you.

---

## 6. Customer test purchase  (~15 min)

> Cheapest real proof: create a **100% off** coupon/promo code in Stripe (the checkout has promo codes enabled), then "pay" $0 with a real card-less flow. Or use a real card and refund after.

- [ ] **(Stripe)** Products → Coupons → create **100% off**, once; Promotions → create a **promotion code** (e.g. `LAUNCHTEST`).
- [ ] **Pay:** in a fresh browser (or incognito), go to `https://websitesupportstudio.com/pricing` → **join now** on **Operations** → on Stripe Checkout, enter a **different email than your operator email** (e.g. `+test`), apply `LAUNCHTEST`, complete.
- [ ] **Verify the webhook fired:** Supabase → SQL Editor:
  ```
  select plan, status, owner_claimed, buyer_email from subscriptions order by created_at desc limit 1;  -- operations / active / false / your test email
  select name, slug from clients order by created_at desc limit 1;                                       -- new org
  select onboarding_status from org_profiles order by created_at desc limit 1;                            -- onboarding_required
  ```
  ✔ Good: a subscription + org + profile row for the test buyer.

---

## 7. Production verification (the loop)  (~20 min)

**7a. Enable auth (the switch).**
- [ ] App/console Vercel project → set `VITE_WSS_REAL_AUTH_ENABLED=true` (Production) → **redeploy**.
  ✔ Good: `https://app.websitesupportstudio.com` now shows the **login** screen.
- [ ] *(Now do Step 5 — log in as yourself + bootstrap operator — if not already done.)*

**7b. Customer side.**
- [ ] In the **test buyer's** browser, go to `app.websitesupportstudio.com` → **continue with google** (use the test buyer's Google account / same email as the purchase) → you should land on **onboarding** (not the console).
- [ ] Complete the onboarding form (company, website URL, contact, support email) → "you're all set."
  ✔ Verify (SQL): `select onboarding_status from org_profiles order by created_at desc limit 1;` → **complete**; a `sites` row exists for the org.

**7c. Operator side (you).**
- [ ] In **your** browser (operator), `app.websitesupportstudio.com` → you land on the **operator console** (queue), and you can **see the customer's org/ticket** for your agency.
  - *(MMVP note: if the customer-facing "create request" UI isn't live yet, create the first request from the console or have the test customer email it; the deliverable being proven is operator visibility + delivery.)*
- [ ] **Deliver:** on the ticket → **triage → draft reply → request approval → approve (as Gary) → send → close.** Each step updates status and writes the audit trail.
  ✔ Verify (SQL):
  ```
  select status from tickets order by created_at desc limit 1;                          -- closed
  select count(*) from ticket_communications;                                            -- >= 1 (the sent reply)
  select count(*) from ticket_audit_events;                                              -- several
  ```

**7d. Customer receives response.**
- [ ] The send recorded a `ticket_communications` row. *(Outbound email to the customer requires the Resend provider wired — fast-follow. For launch-day proof, the recorded communication + visible status is the delivery record.)*

- [ ] **Clean up the test:** Stripe → cancel/refund the test subscription; optionally delete the test org rows in SQL.

**PRODUCTION VERIFIED** when 7a–7c are green: a paid customer logged in, onboarded, and you delivered + closed their request in production. 🎯

---

## If it breaks
- **"join now" doesn't redirect** → `PUBLIC_WSS_CHECKOUT_URL` not set / marketing not redeployed.
- **Webhook didn't create rows** → check the Stripe webhook "Recent deliveries" (should be 200); verify `STRIPE_WEBHOOK_SECRET` matches; check `supabase functions logs stripe-webhook`.
- **Google login fails** → redirect URI mismatch (must be the `…supabase.co/auth/v1/callback`, not the app URL); provider not enabled; Site URL wrong.
- **Operator sees customer onboarding (or vice-versa)** → operator not bootstrapped / not linked; re-run Step 5 and check `resolve_my_identity()`.
- **RLS lockout / emergency** → see `AUTH_PRODUCTION_ROLLOUT.md` §1 (disable/re-enable SQL). Recovery policy migration: `…220000`.

## Fast-follows (not blocking launch)
- Customer "create request" UI + outbound email via Resend (so the customer literally receives the reply by email).
- Capacity-Unit metering on requests; customer dashboard; capacity top-up checkout (need top-up prices).
- Hide the dev role-switcher in the operator console under a real session.
