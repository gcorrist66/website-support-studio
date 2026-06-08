# WSS Phase 5 Gate Tracker

## 1) Current Phase Status
- Current focus: Phase 5G (Customer Communication — local-only send)
- Authority: local UI read-only proof only
- Deployment status: not deployed
- Push status: not pushed
- Auth: not implemented
- Customer communication: persistence-only (local), no provider/email integration
- Mutations: create + triage + draft + request-approval + approval-decision + send (local-only) path implemented locally

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

## 3) Previous Gate Notes
- Phase 4D remains the local mock UI baseline.
- This phase should not include API routes, auth, ticket mutations, communication integrations, or deploy behavior.
