# WSS Phase 9A — Customer Intake Plan (Planning Only)

Status: planning only. No public customer intake is implemented tonight.
Authority: local-only doc. No push, no deploy, no public endpoints.

## 1) Goal
Define a future, public-facing customer request intake path that creates a `received` ticket in the
correct tenant scope — without compromising the safety properties the MMVP currently guarantees
(no public mutation endpoints, no auth bypass, no autonomous customer communication).

## 2) Future Public Customer Request Form (plan)
- A per-site public form (or embeddable widget) that lets a customer submit a support request for a
  specific agency/client/site.
- Submission creates a ticket in `received` state via a tenant-scoped, rate-limited, validated endpoint
  — never the operator handlers directly, and never the service-role key.
- The form is the only public surface; it returns a minimal acknowledgement (e.g., a reference id),
  never internal draft/approval/audit data.

## 3) Required Fields
- Required: site/tenant routing token (resolved server-side to agency/client/site), submitter email,
  request title/subject, request body/message.
- Optional: submitter name, submitter-provided priority hint (operator re-triages authoritatively),
  page/url context.
- Server-derived: ticket id, ticket number, `received` status, `identity_confidence` (default
  `claimed`/`unknown` for public intake), timestamps, intake channel = `public_form`.

## 4) Validation Rules
- Email format sanity check; required title and body with length bounds (min + max).
- Reject missing/blank tenant routing token; reject tokens that do not resolve to an active site.
- Strip/escape all input; never trust submitter-provided role/tenant/priority as authoritative.
- Honeypot field + minimum time-to-submit to deter trivial bots.
- Normalize whitespace; cap body size; reject binary/oversized payloads.

## 5) Spam / Rate-Limit Considerations
- Per-IP and per-site rate limits with burst caps; global circuit breaker per site.
- Honeypot + timing heuristics; optional CAPTCHA/Turnstile if abuse appears.
- Deduplicate near-identical submissions within a short window per submitter/site.
- Backpressure: return a soft "received, may be delayed" response rather than exposing internals.

## 6) No-Auth vs Authenticated Submitter Model
- **v1 (no-auth):** anonymous public submission; `identity_confidence` defaults to `claimed`/`unknown`.
  Lowest friction; relies on rate-limiting + validation + operator triage.
- **v2 (authenticated/verified):** optional email-verification or a lightweight customer login so
  `identity_confidence` can be `known`. Higher trust, more friction.
- Recommendation: ship v1 (no-auth, heavily rate-limited) first, behind the same gating discipline,
  and only after operator auth (Phase 6) and a dedicated intake endpoint exist. Do not couple customer
  auth to operator auth.

## 7) Tenant / Site Routing
- The public form carries an opaque, non-enumerable site routing token (not raw site UUIDs).
- Server resolves token → agency/client/site, verifies the site is active and accepts intake, and
  stamps the ticket with the resolved tenant hierarchy.
- Never allow the submitter to set or change tenant scope directly; cross-tenant submission must be
  impossible by construction.

## 8) Attachment Deferral
- No attachments in the first public intake version (no file upload surface, no storage bucket, no
  virus scanning, no signed URLs). Attachments are deferred to a later, separately-gated phase.

## 9) Audit Event Requirements
- Every public submission that creates a ticket must emit the existing `ticket_created` audit event
  with intake metadata (intake channel = `public_form`, site of origin, raw message, submission
  timestamp, submitter identifier).
- Rejected submissions (validation/rate-limit/spam) should be counted/logged out-of-band (not as ticket
  audit rows) to avoid polluting the ticket audit trail, while still being observable for abuse.
- The created ticket flows into the existing operator workflow unchanged (triage → … → close).

## 10) Email Notification (future consideration)
- A future "we received your request" acknowledgement email and operator "new ticket" notification are
  **out of scope** until the email-provider track (Phase 10) is implemented and the approval-before-send
  and no-autonomous-send invariants are preserved. Intake must not auto-send any customer email.

## 11) What Must Be True Before Public Intake Is Enabled
1. Operator auth (Phase 6) implemented and enforced.
2. A dedicated, tenant-scoped, **authenticated-internally / rate-limited public** intake endpoint
   exists — separate from operator mutation handlers — passing the route-boundary controls in
   `PHASE3_ROUTE_SECURITY_PLAN.md`.
3. RLS enabled so public intake can only insert `received` tickets in the resolved tenant scope.
4. Validation, rate-limit, and spam protections implemented and tested.
5. No internal data (drafts/approvals/audit) is ever returned to the public surface.
6. Abuse monitoring + kill switch in place.
7. Full validation suite + route-boundary + security signoff pass.

## 12) Why Public Intake Is NOT Enabled Tonight
- Public intake is a public unauthenticated mutation surface — explicitly forbidden tonight and until
  the controls above exist.
- No auth, no public API routes, no rate-limiting, and no abuse protections are implemented yet.
- Enabling it now would violate the MMVP safety posture (currently zero public mutation surface).
- Tonight's work is limited to this plan; implementation is a future, separately-gated phase.
