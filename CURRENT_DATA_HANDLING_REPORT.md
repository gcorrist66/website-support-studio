# Current Data Handling Report

Effective audit date: June 15, 2026

Scope audited:

- Public marketing site: `https://websitesupportstudio.com` and `https://www.websitesupportstudio.com`
- Customer/operator app: `https://app.websitesupportstudio.com`
- Implementation repository: `/Users/corristonconsulting/Projects/website-support-studio`

## Current State

Website Support Studio is operated by Corriston Consulting, LLC. The public marketing site is an Astro static site hosted on Vercel. The customer/operator app is a Vite React app hosted on Vercel. Application data, authentication, storage, and serverless edge functions are implemented with Supabase. Payments are handled through Stripe. The public site currently loads Google Analytics 4 in production. The app deployment sends `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.

The apex domain `https://websitesupportstudio.com` redirects to `https://www.websitesupportstudio.com`. Canonical metadata in the current marketing implementation uses `https://websitesupportstudio.com`.

## Data Collected

Public marketing site:

- Contact email interactions through `mailto:corristonconsulting@gmail.com`.
- Booking interactions through the linked Google Calendar booking URL.
- Pricing and checkout intent, including selected plan/add-on, when a visitor clicks checkout.
- Google Analytics 4 usage data when the analytics environment variable is configured. The current production marketing page loads `gtag.js` with anonymized IP configuration.
- Technical request logs collected by Vercel as hosting provider.

Checkout and billing:

- Stripe Checkout receives payment details and buyer information.
- The Supabase `create-checkout-session` edge function receives selected plan/add-on and optional email, then creates a Stripe Checkout Session.
- The Stripe webhook writes subscription status, Stripe customer ID, Stripe subscription ID, buyer email, plan, current period dates, and owner-claim state to Supabase.

App and portal:

- Supabase Auth handles Google OAuth login when real auth is enabled and configured.
- Supabase Auth sessions are persisted by the Supabase browser client.
- Customer onboarding collects company name, website URL, website count, CMS/platform, primary contact name, primary contact email, and support email.
- Customer requests collect site ID, title, description, priority, submitter email from the authenticated user, ticket status, ticket number, and related audit events.
- Optional request attachments are uploaded to the Supabase `request_attachments` storage bucket and recorded with file name, MIME type, file size, storage path, and creator.
- Customer project views expose a limited RPC payload containing project identity, status, payment status, price, website URL, platform, access status, milestones, deliverables, and linked requests. Internal project notes, Stripe IDs, and audit records are intentionally not exposed through the customer RPC.
- Operator/admin flows include operator identity, role, agency, ticket workflow records, audit events, draft replies, approval records, communication records, and project administration data.

## Contact Forms

The current public contact page does not use an embedded form. It provides a pricing entry point, a Google Calendar booking link, and a `mailto:` email link.

The customer app includes authenticated request submission forms and feedback/request flows. These write to Supabase RPCs rather than direct unauthenticated inserts.

## User Accounts And Authentication

The app uses Supabase Auth when `VITE_WSS_REAL_AUTH_ENABLED=true` and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are configured. Login currently presents Google OAuth. Identity resolution is by `auth.uid()` for operators and customers. Customer paid-org claiming uses the verified auth email only as a first-login claim key for an unclaimed Stripe buyer email; durable authorization is by `auth_user_id`.

## Analytics And Cookies

The production marketing page currently loads Google Analytics 4. The implementation supports GA4 and Google Tag Manager only when public analytics environment variables are configured. The app initial HTML does not include analytics scripts.

No advertising, retargeting, or cross-site marketing pixel was found in the implementation. No `document.cookie` writes were found in app or marketing source. Supabase Auth stores browser session data when real auth is enabled. Stripe, Google OAuth, Google Analytics, Google Calendar, and LinkedIn may set cookies or storage on their own domains when users interact with those services.

## Email Collection And Communications

Email addresses are collected through Stripe buyer records, Supabase Auth identities, onboarding contact fields, request submitter data, and direct email contact. The current workflow stores communication records and recipient email fields. Existing UI text notes that some reply-send behavior is persistence-only where no real email delivery is active. The constants list Resend as the intended transactional/notification email provider.

## Third-Party Services

- Vercel: static marketing site hosting, app hosting, edge delivery, and build infrastructure.
- Supabase: database, authentication, storage, RPCs, edge functions, and audit data.
- Stripe: checkout, subscriptions, payment processing, customer/payment identifiers, and webhook events.
- Google: Analytics 4, Tag Manager when configured, Fonts, Google OAuth, and Google Calendar booking.
- LinkedIn: outbound company profile link.
- Resend: listed in the implementation as transactional/notification email delivery provider.

## Customer Portals

The app contains customer login, onboarding, workspace/project visibility, request submission, attachment upload, request history, and project status surfaces. Operator/admin console routes are also present. The app deployment is intentionally noindexed by Vercel headers.

## Security And Access Controls Observed In Code

- App deployment has `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
- Supabase service-role keys are used only in edge functions/webhook server contexts, not browser code.
- Customer ticket creation goes through `SECURITY DEFINER` RPCs that derive agency/client context server-side.
- Project customer visibility is through a column-whitelisting RPC rather than direct table reads.
- RLS migrations exist for tenant-scoped access.

## Gaps Addressed In This Work

- Added production legal URLs: `/privacy-policy`, `/terms-of-service`, `/cookie-policy`.
- Updated marketing footer legal links to those URLs.
- Excluded old `/privacy`, `/terms`, and `/cookies` routes from generated sitemap output to avoid duplicate legal URLs.
- Added legal links to the app login screen.

