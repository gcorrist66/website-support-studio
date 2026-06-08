# WSS Phase 5 Gate Tracker

## 1) Current Phase Status
- Current focus: Phase 5 MMVP — production gate (closed)
- Authority: read-only operator UI shipped to production; mutations remain guarded/local-only
- Deployment status: deployed to production (Vercel)
- Push status: pushed (origin/main)
- Auth: not implemented
- Customer communication: persistence-only (local), no provider/email integration
- Mutations: full local lifecycle — create + triage + draft + request-approval + approval-decision + send (local-only) + close — implemented locally; production bundle has no Supabase credentials, so it runs read-only mock mode

## 0) Phase 5 MMVP Production Gate
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: complete — `origin/main` at `6db5b09`; branch `phase3-local-foundation` pushed and in sync
- Deployed: complete — Vercel production deployment `dpl_4ukhJE3Xe18B5oVD1ifztisTK9ot` (state READY, target production, commit SHA `6db5b09`)
- Production Verified: complete — see evidence below
- Closed: complete

### Local checkpoint reference
- Branch: `phase3-local-foundation`; checkpoint commit `6db5b09 Document Phase 5 MMVP local checkpoint`.
- Full lifecycle (create → triage → draft → request-approval → approve/reject → send (local-only) → close)
  implemented and validated locally. See `PHASE5_MMVP_LOCAL_CHECKPOINT.md`.

### Pre-push validation (all PASS)
- Standard: lint, typecheck, build, validate:domain, e2e, phase2a, persistence, contracts, handlers,
  route-boundary, ui-boundary, readonly-data.
- Guarded Supabase (sequential, dev guard, self-cleaning): draft-reply, request-approval,
  approval-decision, send-reply, close-ticket — all PASS.

### Push / merge
- Pushed `phase3-local-foundation` (`8f5f620..6db5b09`).
- `main` fast-forward-only merge of the branch succeeded (no force); pushed `main` (`4005ce9..6db5b09`).
- `origin/main` and local `main` in sync (0/0).

### Production verification (https://website-support-studio.vercel.app/)
- App loads: HTTP 200, text/html.
- Vercel production deployment READY for commit `6db5b09` (ref `main`).
- WSS operator UI present (bundle contains "Internal Operator Workspace").
- No API routes exposed: `/api/tickets` → 404 NOT_FOUND.
- No auth required yet: 200 with no login redirect / no 401.
- No real email provider active: only the defensive `hasNoProviderContractHints` reject-regex is present
  (no sendgrid/postmark/mailgun/resend/SMTP integration).
- No customer portal (single internal operator SPA).
- No service-role key exposed: only the defensive `isLikelyAnonKey` reject code is present; no
  `sb_secret_<key>`, no `eyJ…` JWT, and no `*.supabase.co` URL/anon credentials baked into the bundle —
  production therefore runs in read-only mock mode (the live-data guard requires non-VITE `WSS_*` vars
  absent from the client bundle).

### Recommended next step
- Secured API route + auth boundary (server-side actor identity + tenant scoping), then a real
  email/communication provider behind the existing local-only send seam
  (`sendPersistedCustomerReplyLocalOnly`). Keep each step gated and independently validated.

## 2) Phase 5A — Live Read-Only Supabase Data Integration
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Evidence
- Added read-only data helper layer: `src/data/readOnlyTicketData.ts`.
- Added mode detection with explicit guard:
  - `WSS_ALLOW_SUPABASE_VALIDATION=dev`
  - `WSS_SUPABASE_ENVIRONMENT` in `{dev,development,local}`
  - `WSS_SUPABASE_PROJECT_REF=\"vrtfbbrwrxyljchywmzy\"`
  - Supabase URL host includes expected dev project ref and `supabase.co`
  - Uses only anon-style key candidates; service-role key usage is blocked by guard.
- Implemented read paths only:
  - `getReadOnlyTicketQueue`
  - `getReadOnlyTicketDetail`
  - `getReadOnlyTicketAuditTimeline`
- Added mock fallback paths for all read helpers when guard conditions are not met.
- Updated `AppShell` to use adapter and show read-only mode label.
- Added validation script `scripts/validate-readonly-data.mjs`.
- Added npm script `validate:readonly-data`.
- Updated `src/components/shell/AppShell.tsx` to load queue/detail/audit from `src/data/readOnlyTicketData.ts` with guarded live-read fallback.
- Added `getReadOnlyApprovalQueue` helper for approved/awaiting-approval queue support and safe mode fallback.
- Added local read-only checks to `scripts/validate-readonly-data.mjs`.
- Updated phase boundary validation script `scripts/validate-ui-boundary.mjs` for phase naming in disabled-action copy checks.
- Validation output (all pass) for:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run validate:domain`
  - `npm run validate:e2e`
  - `npm run validate:phase2a`
  - `npm run validate:persistence`
  - `npm run validate:contracts`
  - `npm run validate:handlers`
  - `npm run validate:route-boundary`
  - `npm run validate:ui-boundary`
  - `npm run validate:readonly-data`
- Constraint checks:
  - Reads only in `src/data/readOnlyTicketData.ts` (queue/detail/audit).
  - No mutations, no writes, no approvals or close/send logic invoked.
  - Live read path requires guarded validation mode and anon key, with mock fallback for missing/failed reads.
  - No service-role key references in UI/browser source.

### Phase 5A Hardening Pass
- Completed targeted read-only boundary hardening checks:
  - `scripts/validate-readonly-data.mjs` now enforces:
    - no `insert/update/delete/upsert/rpc` calls in `src/data/readOnlyTicketData.ts`
    - explicit mock fallback branches are present
    - anon-env-only client key usage (service-role key names rejected)
    - no customer communication/provider phrases in read-only layer + AppShell
  - `scripts/validate-ui-boundary.mjs` now enforces no service-role token references in UI source.
  - Added explicit checks for no service-role exposure, explicit mock fallback assertions, and customer communication absence.
- Validation commands rerun:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run validate:domain`
  - `npm run validate:e2e`
  - `npm run validate:phase2a`
  - `npm run validate:persistence`
  - `npm run validate:contracts`
  - `npm run validate:handlers`
  - `npm run validate:route-boundary`
  - `npm run validate:ui-boundary`
  - `npm run validate:readonly-data`
- Outcome: all commands pass; no browser/service-role leakage, no mutating calls in read-only data layer, and UI still remains read-only/disconnected.

### Constraints checked for Phase 5A
- Queue/detail/audit reads are sourced only through helper functions in `src/data`.
- No insert/update/delete/upsert call sites were introduced in the read-only data helper file.
- No API route files were added.
- No live mutations/handlers were wired into UI actions (disabled placeholders only).

## 4) Phase 5B — Local Create Ticket Flow
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Evidence
- Added local create-ticket form component `src/components/tickets/CreateTicketForm.tsx` with fields:
  - title
  - description
  - client
  - site
  - submitter name
  - submitter email
  - priority
- Added local validation in form and handler:
  - required title
  - required description
  - required client/site context
  - required submitter email
  - submitter email format sanity check
- Wired form into `AppShell` and `handleCreateTicket` path for local create-only flow.
- Create flow writes ticket + `ticket_created` audit event only in local write path.
- Added dedicated validator `scripts/validate-create-ticket.mjs` and npm script `validate:create-ticket`.
- Added validation scenarios proving:
  - valid create persists ticket and audit
  - missing title rejected
  - missing description rejected
  - missing email rejected
  - no approval rows written on create
  - no draft rows written on create
  - no message rows written on create
  - no communication rows written on create
  - cleanup removes created ticket/audit records
- Added hardening checks:
  - tenant context required by create
  - actor context required by create
  - tenant/client/site hierarchy integrity check
  - exactly one ticket row required for create
  - explicit local validation guard enforcement
  - local create cleanup reliability check
- No `ticket_messages`, `ticket_draft_replies`, `ticket_approvals`, and `ticket_communications` are now part of create-only persistence assertions.
- Constraint checks for Phase 5B:
  - No triage, approval, send, or close actions introduced.
  - No customer portal changes.
  - No API route files introduced.
  - No auth provider wiring.

## 5) Phase 5C — Local Triage Flow
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Evidence
- Added local triage path in service and handler layers:
  - `src/services/ticketWorkflowService.ts: triagePersistedTicket` now accepts `actorRole` and applies transition validation.
  - `src/handlers/ticketWorkflowHandlers.ts` now passes validated actor role into triage service calls.
- Added UI triage action:
  - `src/components/tickets/ReadOnlyTicketDetail.tsx` exposes `Triage Ticket` when ineligible state is disabled.
  - `src/components/shell/AppShell.tsx` wires triage action in guarded Supabase-dev mode and shows triage outcome.
- Added mapping from read-only queue/detail rows to workflow IDs so UI actions can target persisted ticket rows:
  - `src/ui/mockData.ts`
  - `src/data/readOnlyTicketData.ts`
- Added validation script `scripts/validate-triage-ticket.mjs` covering:
  - received → triaged succeeds
  - non-received triage fails
  - missing tenant context fails
  - missing actor context fails
  - unauthorized actor fails
  - tenant integrity is enforced
  - `ticket_triaged` audit exists
  - triage does not create draft/approval/communication rows
  - cleanup removes test rows
- Added npm script `validate:triage-ticket`.
- Local-only validation status:
  - No send/approval/close controls are present in this phase.
  - No customer communication providers or API routes added.
  - Triaged updates are write-only to local/Supabase path as intended.

## 6) Phase 5D — Draft Reply Flow
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Evidence
- Added draft reply form action in local detail view for triaged tickets:
  - `src/components/tickets/ReadOnlyTicketDetail.tsx` exposes `Draft Reply` for draft-eligible tickets.
  - `src/components/shell/AppShell.tsx` provides draft text state, action wiring, and status/error messaging.
- Added draft service/handler hardening:
  - `src/handlers/ticketWorkflowHandlers.ts` validates draft requests and actor context.
  - `src/services/ticketWorkflowService.ts` validates non-empty draft text and persists draft + audit outputs.
- Domain transition and actor constraints remain in force (CS-agent only and triaged state requirement).
- Added draft validator:
  - `scripts/validate-draft-reply.mjs`
  - npm script `validate:draft-reply`
- Validation status:
  - `WSS_ALLOW_SUPABASE_VALIDATION=dev`
  - `WSS_SUPABASE_ENVIRONMENT=dev`
  - `WSS_SUPABASE_PROJECT_REF=vrtfbbrwrxyljchywmzy`
  - `npm run validate:draft-reply`
- Validation checks to cover:
  - triaged → reply_drafted transition
  - received → draft is blocked
  - unauthorized actor blocked
  - empty draft text blocked
  - `ticket_draft_replies` row exists
  - `reply_drafted` audit emitted
  - no approvals/communications created
  - cleanup path removes created rows
- Boundary update:
  - `scripts/validate-readonly-data.mjs` now permits `handleDraftReply` usage in UI shell only, while still blocking create/approval/send/close handlers and API routes.
- Validation outcomes:
  - `npm run lint` PASS
  - `npm run typecheck` PASS
  - `npm run build` PASS
  - `npm run validate:domain` PASS
  - `npm run validate:e2e` PASS
  - `npm run validate:phase2a` PASS
  - `npm run validate:persistence` PASS
  - `npm run validate:contracts` PASS
  - `npm run validate:handlers` PASS
  - `npm run validate:route-boundary` PASS
  - `npm run validate:ui-boundary` PASS
  - `npm run validate:readonly-data` PASS
  - `npm run validate:draft-reply` PASS

### Controls preserved in Phase 5D
- No API routes added
- No auth/auth provider wiring
- No customer portal
- No customer communication/send/approve/close/write UI actions
- No service role key in browser code (guarded/placeholder checks still in place)

## 7) Phase 5E — Request Approval Flow
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Scope
- Only `reply_drafted → awaiting_gary_approval` is implemented.
- Not implemented: approve, reject, send, close, auth, API routes, customer communication, email provider.

### Evidence
- Request-approval action wired through existing service/handler layers:
  - `src/services/ticketWorkflowService.ts: requestPersistedApproval` persists the pending approval + `approval_requested` audit via `markReplyReadyForApproval` (CS-agent/internal actor only).
  - `src/handlers/ticketWorkflowHandlers.ts: handleRequestApproval` validates tenant/actor context and the allowed guard role before requesting approval.
- Added UI request-approval action:
  - `src/components/tickets/ReadOnlyTicketDetail.tsx` exposes `Request Gary Approval`, enabled only when eligible (reply_drafted in guarded mode).
  - When ineligible the action is disabled with copy `Not active for this ticket state`.
  - No Approve / Reject / Send / Close controls were added.
  - `src/components/shell/AppShell.tsx` wires the action in guarded Supabase-dev mode (`canRequestApprovalSelected = reply_drafted`), shows status/error messaging, and refreshes detail/audit after success.
- Boundary update:
  - `scripts/validate-readonly-data.mjs` now permits `handleRequestApproval` usage in the UI shell only, while still blocking create/approve/reject/send/close/block/unblock handlers and API routes.
- Added request-approval validator:
  - `scripts/validate-request-approval.mjs`
  - npm script `validate:request-approval`
- Validation proofs (all pass):
  - reply_drafted → awaiting_gary_approval succeeds
  - triaged → awaiting_gary_approval fails (`invalid_reply_draft_state`)
  - unauthorized actor (SITE_USER) fails
  - pending approval row exists (status = pending)
  - approval_requested audit event exists
  - no communication rows created
  - no approved/rejected decision created
  - cleanup removes created rows
- Validation outcomes:
  - `npm run lint` PASS
  - `npm run typecheck` PASS
  - `npm run build` PASS
  - `npm run validate:domain` PASS
  - `npm run validate:e2e` PASS
  - `npm run validate:phase2a` PASS
  - `npm run validate:persistence` PASS
  - `npm run validate:contracts` PASS
  - `npm run validate:handlers` PASS
  - `npm run validate:route-boundary` PASS
  - `npm run validate:ui-boundary` PASS
  - `npm run validate:readonly-data` PASS
  - `npm run validate:draft-reply` PASS (guarded dev env)
  - `npm run validate:request-approval` PASS (guarded dev env)

### Controls preserved in Phase 5E
- No API routes added
- No auth/auth provider wiring
- No customer portal
- No approve / reject / send / close UI actions or handlers wired into the UI
- No customer communication / email provider wiring
- No service role key in browser code (guarded/placeholder checks still in place)

## 8) Phase 5F — Gary Approval Decision Flow
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Scope
- Implemented only the approval-decision transitions:
  - `awaiting_gary_approval → approved_to_send` (Approve Reply)
  - `awaiting_gary_approval → reply_drafted` (Reject Reply, current deterministic state-machine route)
    - Reject transiently passes through `blocked` then auto-unblocks back to `reply_drafted`,
      matching the existing `rejectDraftReply` state machine. No new state route was introduced.
- Not implemented: send email, customer communication, close ticket, auth, API routes, customer portal, deployment, push.

### Evidence
- Persistence fix (required for decision durability):
  - `src/services/ticketWorkflowService.ts: approvePersistedReply` / `rejectPersistedReply` now upsert the
    decided approval row (via new `collectDecidedApproval`) instead of `filterNewById`. The pending approval
    row was already persisted during request-approval, so the prior filter would have excluded the decision
    update and left the row `pending`. The decision now lands as `approved`/`rejected`.
- Handlers (already present, reused): `handleApproveReply` / `handleRejectReply`
  - Validate tenant/actor context and allowed guard role.
  - Enforce Gary/Human approver gate: only `gary_approver` or `agency_admin` may approve/reject.
- Approve path: status → `approved_to_send`, approval row → `approved`, `approval_granted` audit, no communication rows, no send.
- Reject path: approval row → `rejected`, `approval_rejected` audit, no communication rows, ticket returns to `reply_drafted`.
- UI approval-decision controls:
  - `src/components/tickets/ReadOnlyTicketDetail.tsx` exposes `Approve Reply` and `Reject Reply`, enabled only when
    eligible (awaiting_gary_approval in guarded mode); otherwise disabled with copy `Not active for this ticket state`.
  - No Send Reply / Send Email / Close Ticket controls were added.
  - `src/components/shell/AppShell.tsx` wires the decisions in guarded Supabase-dev mode using the `gary_approver`
    actor (`canDecideApprovalSelected = awaiting_gary_approval`), shows status/error messaging, and refreshes detail/audit.
- Boundary update:
  - `scripts/validate-readonly-data.mjs` now permits `handleApproveReply` / `handleRejectReply` in the UI shell only,
    while still blocking create/send/close/block/unblock handlers and API routes.
- Added approval-decision validator:
  - `scripts/validate-approval-decision.mjs`
  - npm script `validate:approval-decision`
- Validation proofs (all pass, guarded dev env):
  - awaiting_gary_approval → approved_to_send succeeds
  - approval row becomes approved
  - approval_granted audit exists
  - approve creates no communication rows; no send occurs
  - awaiting_gary_approval rejection path succeeds (routes to reply_drafted)
  - approval row becomes rejected
  - approval_rejected audit exists
  - reject creates no communication rows
  - non-Gary actor (cs_agent) cannot approve or reject
  - non-awaiting_gary_approval ticket cannot be approved
  - cleanup removes created rows; database left clean
- Validation outcomes:
  - `npm run lint` PASS
  - `npm run typecheck` PASS
  - `npm run build` PASS
  - `npm run validate:domain` PASS
  - `npm run validate:e2e` PASS
  - `npm run validate:phase2a` PASS
  - `npm run validate:persistence` PASS
  - `npm run validate:contracts` PASS
  - `npm run validate:handlers` PASS
  - `npm run validate:route-boundary` PASS
  - `npm run validate:ui-boundary` PASS
  - `npm run validate:readonly-data` PASS
  - `npm run validate:draft-reply` PASS (guarded dev env)
  - `npm run validate:request-approval` PASS (guarded dev env)
  - `npm run validate:approval-decision` PASS (guarded dev env)
  - Note: the guarded Supabase validators contend on the shared dev DB if run concurrently; run them sequentially.

### Controls preserved in Phase 5F
- No API routes added
- No auth/auth provider wiring
- No customer portal
- No send reply / send email / customer communication wiring
- No close ticket UI action or handler wired into the UI
- No service role key in browser code (guarded/placeholder checks still in place)

## 9) Phase 5G — Customer Communication (local-only send)
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Scope
- Implemented only `approved_to_send → sent_to_customer` (Send Reply).
- Communication is persistence-only: a `ticket_communications` row is recorded locally.
- Not implemented: real email send, provider integration (Resend/SendGrid/SMTP/etc.),
  ticket closure, auth, API routes, customer portal, deployment, push.

### Evidence
- Handlers/service/domain reused (already present): `handleSendApprovedReply` →
  `sendPersistedCustomerReplyLocalOnly` → domain `sendApprovedCustomerReply`.
  - Send requires: ticket in `approved_to_send`, an `approved` approval record, a recipient
    customer email, and a valid actor context.
  - Send records a `ticket_communications` row (`delivery_status='pending'`, `external_provider`
    and `external_message_id` NULL — no provider, nothing actually delivered), transitions the
    ticket to `sent_to_customer`, and emits a `reply_sent` audit event.
- Read-only support helper (reads only, no mutations):
  - `src/data/readOnlyTicketData.ts: getReadOnlySendContext` resolves the approved approval id /
    approver reference / approved-at, the latest draft id, and the recipient email for a ticket so
    the UI can issue a send that satisfies the handler's approval-context validation.
- UI send action:
  - `src/components/tickets/ReadOnlyTicketDetail.tsx` exposes `Send Reply`, enabled only when
    eligible (approved_to_send in guarded mode); otherwise disabled with copy
    `Not active for this ticket state`. No Close Ticket control added.
  - `src/components/shell/AppShell.tsx` wires the send in guarded Supabase-dev mode
    (`canSendReplySelected = approved_to_send`), resolves send context read-only, shows
    status/error messaging, and refreshes detail/audit.
- Boundary update:
  - `scripts/validate-readonly-data.mjs` now permits `handleSendApprovedReply` in the UI shell only,
    while still blocking create/close/block/unblock handlers and API routes.
- Added send validator:
  - `scripts/validate-send-reply.mjs`
  - npm script `validate:send-reply`
- Validation proofs (all pass, guarded dev env):
  - approved_to_send → sent_to_customer succeeds
  - communication row exists (recipient recorded)
  - reply_sent audit exists
  - no real email sent (nothing marked delivered/sent; delivery stays local pending)
  - no provider integration (external_provider / external_message_id remain NULL)
  - missing email fails (and persists nothing)
  - missing approval fails (and persists nothing)
  - unauthorized actor fails (and persists nothing)
  - cleanup removes created rows; database left clean
- Validation outcomes:
  - `npm run lint` PASS
  - `npm run typecheck` PASS
  - `npm run build` PASS
  - `npm run validate:domain` PASS
  - `npm run validate:e2e` PASS
  - `npm run validate:phase2a` PASS
  - `npm run validate:persistence` PASS
  - `npm run validate:contracts` PASS
  - `npm run validate:handlers` PASS
  - `npm run validate:route-boundary` PASS
  - `npm run validate:ui-boundary` PASS
  - `npm run validate:readonly-data` PASS
  - `npm run validate:draft-reply` PASS (guarded dev env)
  - `npm run validate:request-approval` PASS (guarded dev env)
  - `npm run validate:approval-decision` PASS (guarded dev env)
  - `npm run validate:send-reply` PASS (guarded dev env)
  - Note: run the guarded Supabase validators sequentially; concurrent runs contend on the shared dev DB.

### Controls preserved in Phase 5G
- No API routes added
- No auth/auth provider wiring
- No customer portal
- No real email send and no provider integration (Resend/SendGrid/SMTP/etc.) — persistence-only
- No close ticket UI action or handler wired into the UI
- No service role key in browser code (guarded/placeholder checks still in place)

## 10) Phase 5H — Ticket Closure Flow
- Diagnosed: complete
- Fixed Locally: complete
- Committed: complete
- Pushed: not complete
- Deployed: not complete
- Production Verified: not complete
- Closed: not complete

### Scope
- Implemented only `sent_to_customer → closed` (Close Ticket).
- Close requires a closure note, an internal actor context, and `sent_to_customer` status.
- Not implemented: auth, API routes, customer portal, deployment, push, additional communication providers.

### Evidence
- Handlers/service/domain reused (already present): `handleCloseTicket` → `closePersistedTicket` →
  domain `closeTicket`.
  - Only `sent_to_customer` tickets may close (state machine: `SENT_TO_CUSTOMER → CLOSED`,
    authorized for cs_agent / agency_admin / gary_approver). `closed` is terminal.
  - Closing sets status `closed`, stores `closure_note`, sets `closed_at`, and emits a
    `ticket_closed` audit event. No communication row is created by close; close does not send
    email, reopen the ticket, or auto-close after send.
- UI close action:
  - `src/components/tickets/ReadOnlyTicketDetail.tsx` exposes a closure-note field and a
    `Close Ticket` action, enabled only when eligible (sent_to_customer in guarded mode and a
    non-empty closure note); otherwise disabled with copy `Not active for this ticket state`.
  - `src/components/shell/AppShell.tsx` wires the close in guarded Supabase-dev mode
    (`canCloseTicketSelected = sent_to_customer`) with a required closure note, shows status/error
    messaging, and refreshes detail/audit.
- Boundary update:
  - `scripts/validate-readonly-data.mjs` now permits `handleCloseTicket` in the UI shell only,
    while still blocking create/block/unblock handlers and API routes.
- Added close validator:
  - `scripts/validate-close-ticket.mjs`
  - npm script `validate:close-ticket`
- Validation proofs (all pass, guarded dev env):
  - sent_to_customer → closed succeeds
  - closure_note persisted
  - closed_at set
  - ticket_closed audit exists
  - no communication row created by close (communication count unchanged across close)
  - closed ticket cannot transition out (second close rejected as terminal)
  - missing closure note fails (and persists nothing)
  - non-sent_to_customer status fails (approved_to_send close rejected as invalid transition)
  - unauthorized actor fails (and persists nothing)
  - cleanup removes created rows; database left clean
- Validation outcomes:
  - `npm run lint` PASS
  - `npm run typecheck` PASS
  - `npm run build` PASS
  - `npm run validate:domain` PASS
  - `npm run validate:e2e` PASS
  - `npm run validate:phase2a` PASS
  - `npm run validate:persistence` PASS
  - `npm run validate:contracts` PASS
  - `npm run validate:handlers` PASS
  - `npm run validate:route-boundary` PASS
  - `npm run validate:ui-boundary` PASS
  - `npm run validate:readonly-data` PASS
  - `npm run validate:draft-reply` PASS (guarded dev env)
  - `npm run validate:request-approval` PASS (guarded dev env)
  - `npm run validate:approval-decision` PASS (guarded dev env)
  - `npm run validate:send-reply` PASS (guarded dev env)
  - `npm run validate:close-ticket` PASS (guarded dev env)
  - Note: run the guarded Supabase validators sequentially; concurrent runs contend on the shared dev DB.

### Controls preserved in Phase 5H
- No API routes added
- No auth/auth provider wiring
- No customer portal
- No email send and no provider integration (close creates no communication row)
- No ticket reopen and no auto-close after send
- No service role key in browser code (guarded/placeholder checks still in place)

## 3) Previous Gate Notes
- Phase 4D remains the local mock UI baseline.
- This phase should not include API routes, auth, ticket mutations, communication integrations, or deploy behavior.
