# WSS Phase 5 Gate Tracker

## 1) Current Phase Status
- Current focus: Phase 5C (Triage Flow)
- Authority: local UI read-only proof only
- Deployment status: not deployed
- Push status: not pushed
- Auth: not implemented
- Customer communication: not implemented
- Mutations: create + triage-only path implemented locally

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

## 3) Previous Gate Notes
- Phase 4D remains the local mock UI baseline.
- This phase should not include API routes, auth, ticket mutations, communication integrations, or deploy behavior.
