# WSS Phase 3B API Contract Plan

## 1) Minimal Phase 3 API Surface (Not Implemented Yet)

The next step is to define an internal-only contract surface that binds the current local repository/service layer to future route handlers without implementing runtime endpoints.

Planned endpoint candidates (non-implemented placeholders):

- `POST /tickets` → create ticket (maps to `createPersistedTicket`)
- `POST /tickets/{ticketId}/triage` → triage ticket (`triagePersistedTicket`)
- `POST /tickets/{ticketId}/draft-reply` → draft reply (`draftPersistedReply`)
- `POST /tickets/{ticketId}/approval/request` → request approval (`requestPersistedApproval`)
- `POST /tickets/{ticketId}/approval/approve` → approve draft (`approvePersistedReply`)
- `POST /tickets/{ticketId}/approval/reject` → reject draft (`rejectDraftReply`)
- `POST /tickets/{ticketId}/reply/send` → send draft locally (`sendPersistedCustomerReplyLocalOnly`)
- `POST /tickets/{ticketId}/close` → close ticket (`closePersistedTicket`)
- `POST /tickets/{ticketId}/block` → block ticket
- `POST /tickets/{ticketId}/unblock` → unblock ticket

All routes above are for planning only and are **not implemented** in this phase.

## 2) Request/Response Shapes

`src/contracts/ticketWorkflowContracts.ts` defines the future contract shape to ensure:

- consistent actor/tenant framing
- explicit workflow state transition intent
- explicit approval and communication guards
- closure metadata requirements
- canonical audit event expectations

Each request includes:
- `tenantContext` (agency/client/site identifiers)
- `actorContext` (actor role + reference)

Each response includes:
- canonical ticket status/identity
- updated ticket id
- optional `auditEvents` snapshot
- `validation` summary

## 3) Required Actor Context

Workflow actions require explicit actor identity context, even for local-in-memory phases:

- `actorRole` must be one of approved roles
- `actorReference` must be supplied
- role-specific guarding will be enforced in implementation phases and service layer wrappers

## 4) Required Tenant Context

Tenant context is mandatory on every request because persistence is tenant-scoped:

- `agencyId`
- `clientId`
- `siteId`

Service-level validation remains the runtime enforcement for this boundary.

## 5) Validation Rules

- All create/triage/draft/approval/send/close actions require tenant and actor context.
- `send` action requires explicit approval context (`approvalId`, `approvedByActorReference`, `approvedAt`).
- `close` action requires `closureNote` (non-empty).
- `block`/`unblock` actions require `blockedReason` / `targetStatus` and actor context.
- Contracts must not include provider send details (external provider, message id, SMTP, or API token fields).
- No contract may imply autonomous behavior (`autoSend`/`autoReply` flags are forbidden).

## 6) Approval Guard Requirements

- approval actions must only transition from `awaiting_gary_approval`
- approval required before any customer send request contract path
- rejected approval path should return safe draft/rewrite route in later service validation layers

## 7) Communication Guard Requirements

- Communication contract requires `actorContext` + `tenantContext` + `approvalContext` + `recipientEmail`.
- `recipientEmail` is mandatory.
- contract requires `communicationContext` to indicate no external provider details are embedded in the payload.
- no autonomous send field is part of the send request.

## 8) Audit Requirements

Contract responses must expose
- `auditEvents` with required event `summary` and metadata references,
- no silent state transitions without an audit trace record in planning representation.

## 9) Forbidden Behavior

This phase explicitly forbids:

- adding runtime routes
- authentication/authz implementation
- UI integration
- customer portal wiring
- email provider integrations
- external automation/scheduling beyond local-only contract definition

## 10) Future Auth Boundary

Authentication and token scoping are intentionally deferred to a future phase and documented as:

- no authentication enforcement in contract planning
- no protected endpoint implementation now
- runtime authorization checks to be introduced in later phase (after API layer planning)

## 11) Future UI Boundary

Customer and operator UIs remain deferred:

- no dashboard routes
- no form handlers
- no portal workflows
- contract plan stays transport-agnostic and service-ready
