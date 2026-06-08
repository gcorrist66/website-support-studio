# WSS Phase 10A — Email Provider Plan (Planning Only)

Status: planning only. No email provider is integrated tonight. No real email is sent.
Authority: local-only doc. No push, no deploy, no provider SDKs, no SMTP.

## 1) Current State: Communication Persistence Only
- The send action (`approved_to_send → sent_to_customer`) records a `ticket_communications` row and a
  `reply_sent` audit event. That is the entire effect.
- The communication row is written with `delivery_status='pending'`, `external_provider=NULL`, and
  `external_message_id=NULL`. **No real email is sent. No provider is contacted.**
- The send seam is `sendPersistedCustomerReplyLocalOnly` in `src/services/ticketWorkflowService.ts`; the
  domain (`sendApprovedCustomerReply`) enforces approval-before-send and the state machine.

## 2) No Real Email Is Sent (invariant today)
- There is no Resend/Postmark/SendGrid/SMTP/nodemailer dependency anywhere (enforced by
  `validate-route-boundary`, `validate-ui-boundary`, and contract provider-hint guards).
- The production client bundle contains no provider code and no credentials.

## 3) Provider Options
- **Resend** — modern API, simple DX, React Email template support, good deliverability, webhook events.
- **Postmark** — strong transactional deliverability and analytics, mature bounce/suppression handling,
  message streams separating transactional vs broadcast.

## 4) Recommended Provider
- **Postmark** for transactional customer replies, primarily for its deliverability track record and
  first-class bounce/suppression/complaint handling — important when emailing real customers from an
  agency context. Resend is an acceptable alternative if React Email templating and DX are weighted
  higher. Decision can be revisited; the integration seam should be provider-agnostic.

## 5) Required Templates
- Customer reply (the approved draft body, rendered with agency/site branding context).
- (Later, tied to Phase 9 intake) request-received acknowledgement; operator new-ticket notification.
- Templates must render only approved content; no template may inject unreviewed text into a customer
  email.

## 6) Approval-Before-Send Invariant (must be preserved)
- A real send may occur **only** for a ticket in `approved_to_send` with a matching `approved` approval
  record, exactly as enforced today. No autonomous send. No "approve-and-send" single step.
- The provider call replaces only the *delivery* step behind the existing seam; the approval/state gates
  remain authoritative and unchanged.
- The provider call must be made server-side with a server-held key — never from the browser.

## 7) Delivery Tracking
- Extend `ticket_communications` usage: on a real send, set `external_provider`, `external_message_id`,
  and transition `delivery_status` through `queued` → `sent` → `delivered` driven by provider webhooks.
- Persist provider message id for correlation; keep an audit event for the dispatch and for terminal
  delivery outcomes.

## 8) Failure Handling
- Treat provider errors as a failed delivery: keep the ticket's workflow state, mark the communication
  `failed` with an error reason, surface it to the operator, and allow an explicit retry — never auto-retry
  in a way that could duplicate customer emails.
- Idempotency: use a stable idempotency key (e.g., communication id) so retries do not double-send.

## 9) Audit Events
- Emit/extend audit events for: send dispatched (provider accepted), delivered, bounced, complained,
  failed. Keep these consistent with the existing audit metadata discipline in `ticketLifecycle.ts`.

## 10) Suppression / Bounce Handling
- Maintain a suppression list (hard bounces, spam complaints, unsubscribes where applicable).
- Block sends to suppressed addresses with a clear operator-visible reason; never silently drop.
- Process provider webhooks to update suppression and `delivery_status`.

## 11) Environment Variables Needed Later (not added tonight)
- `WSS_EMAIL_PROVIDER` (e.g., `postmark` | `resend`)
- `WSS_EMAIL_API_KEY` (server-side only; never `VITE_`-prefixed, never in the client bundle)
- `WSS_EMAIL_FROM_ADDRESS` / per-agency from-identity configuration
- `WSS_EMAIL_WEBHOOK_SECRET` (verify inbound delivery webhooks)
- All secrets via environment/secret manager only — never committed, never client-exposed.

## 12) Why No Provider Integration Is Added Tonight
- Real email is a high-blast-radius, outward-facing capability; it is explicitly forbidden tonight.
- It must sit behind operator auth (Phase 6), server routes with the Phase 3D controls, and a verified
  approval gate before any real customer email is possible.
- Persistence-only send already proves the workflow end-to-end without contacting customers.
- Tonight's deliverable is this plan only; integration is a future, separately-gated phase that must
  preserve every invariant above and pass full validation + security signoff before enablement.
