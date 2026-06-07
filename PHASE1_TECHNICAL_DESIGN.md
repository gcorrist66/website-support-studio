# WSS Phase 1 Technical Design

## 1) Current Architecture Summary

WSS is a standalone support workflow project with the approved tenant and status model:

- Project: independent from Website Operations Desk, IntrynSync, and HiveRunner implementations.
- Canonical hierarchy: **Agency → Client → Site → Ticket**.
- Phase 1 MMVP flow is deterministic and human-in-the-loop:
  - Customer submits request
  - Ticket created
  - CS Agent triages
  - Draft response created
  - Gary approves response
  - Customer communication
  - Ticket closure
- Phase 1 is planning only; no implementation artifacts are produced in this phase.

References used:
- README.md
- VISION.md
- ARCHITECTURE.md
- ROADMAP.md
- TENANT_MODEL.md
- PHASE0_SIGNOFF.md
- PHASE1_STATE_MACHINE.md

## 2) Phase 1 Scope

In-scope behavior for Phase 1:

- State machine implementation for ticket lifecycle.
- Deterministic transitions among approved statuses.
- Human approval gate behavior.
- Role-based progression control.
- Required metadata and audit evidence per state/transition.
- Blocked handling and unblock logic.

Out of scope for this phase:

- No Dev Agent.
- No autonomous replies.
- No IntrynSync integration.
- No email ingestion.
- No customer dashboard.
- No session replay or learning engine.
- No feature voting.

## 3) Non-Goals

- API design or route implementation.
- Database schema creation.
- UI implementation.
- New dependencies.
- Operational execution integrations to HiveRunner/IntrynSync.
- Any autonomous decision-making engine.

## 4) Actors and Permissions

- **Agency Admin**
  - Governance and tenant access posture owner.
  - Performs high-level overrides and exception routing where policy allows.

- **Client Admin**
  - Represents client-level administration.
  - May escalate and request clarification when request origin or rights are unclear.

- **Site User**
  - Customer/recipient initiating request from a site context.
  - Limited lifecycle visibility and no state-transition authority in Phase 1.

- **CS Agent**
  - Triage tickets.
  - Draft replies.
  - Move blocked tickets after collecting missing inputs or completing required evidence.

- **Gary / Human Approver**
  - Mandatory approver before any outbound customer communication.
  - Grants or rejects approval and annotates outcomes.

- **System**
  - Captures transitions, metadata, and audit events.
  - Enforces deterministic transition constraints.

## 5) Core Entities (Conceptual)

Define entities conceptually for architecture planning only.

- **Agency**
  - Identity: `agency_id`, `agency_name`, policy profile.
  - Owns multiple clients.

- **Client**
  - Identity: `client_id`, `client_name`, `agency_id`.
  - Belongs to one agency.

- **Site**
  - Identity: `site_id`, `site_name`, `client_id`, optional `canonical_domain`.
  - Belongs to one client.

- **Ticket**
  - Identity: `ticket_id`, `site_id`, `status`, `priority`, `identity_confidence`, lifecycle timestamps.
  - Central control record for state transitions and audit reference.

- **Ticket Submitter**
  - Capture of customer contact source: `submitter_name`, `submitter_email`, `submitter_reference`, contact confidence.
  - May be `known`, `claimed`, or `unknown`.

- **Ticket Message**
  - Customer-originated content object.
  - Stores raw request text and any extracted context.

- **Ticket Draft Reply**
  - Draft body and metadata created by CS Agent before approval.
  - Becomes source for approval and send snapshot.

- **Ticket Approval**
  - Record of Gary/Human approver actions: decision, rationale, decision timestamp, actor identity.

- **Ticket Audit Event**
  - Immutable event record concept for each significant action/state transition.
  - Includes event type, actor, timestamp, source references, and rationale.

## 6) Ticket Lifecycle

Map directly to `PHASE1_STATE_MACHINE.md` states:

- `received` → `triaged` → `reply_drafted` → `awaiting_gary_approval` → `approved_to_send` → `sent_to_customer` → `closed`
- `blocked` can be entered from supported states when prerequisites are missing or safety/accuracy checks fail.

## 7) Permission Matrix

| Action | Agency Admin | Client Admin | Site User | CS Agent | Gary / Human Approver | System |
|---|---|---|---|---|---|---|
| Create ticket | conditional manual intake exception | conditional | yes (initiates request) | yes (if intake route available) | no | yes (automated intake normalization) |
| View ticket | yes | yes | no (Phase 1 admin visibility not implemented) | yes | yes | yes |
| Triage ticket | no (operational override only) | no | no | yes | no | yes |
| Draft reply | no | no | no | yes | no | no |
| Approve reply | no (rare override path only) | no | no | no | yes | no |
| Send reply | no (operational execution by system) | no | no | yes (under approval state constraints) | no | yes |
| Close ticket | yes | no | no | yes | yes | yes |
| Block ticket | yes | no | no | yes | yes | yes |
| Reopen / unblock ticket | yes | no | no | yes | yes | yes |

Notes:
- CS Agent to send reply is allowed only through approved state transitions and never autonomously.
- Agency Admin/Client Admin receive policy and escalation authority but do not replace approval gate.

## 8) Audit Requirements

Required audit events per transition/point:

- `ticket created` — when ticket transitions into `received`.
- `ticket triaged` — when `received` to `triaged` completed.
- `reply drafted` — when draft is first saved in `reply_drafted`.
- `approval requested` — when ticket enters `awaiting_gary_approval`.
- `approval granted` — when transition to `approved_to_send` occurs.
- `approval rejected` — when approver declines draft and it returns to draft path.
- `reply sent` — when entering `sent_to_customer`.
- `ticket blocked` — when transition into `blocked` occurs.
- `ticket unblocked` — when blocked precondition is resolved and ticket re-enters allowed next state.
- `ticket closed` — when terminal closure recorded.

## 9) Metadata Requirements

### Common metadata (all active states)
- ticket_id
- current_status
- priority (`low`/`normal`/`high`/`critical`)
- identity_confidence (`known`/`claimed`/`unknown`)
- site_of_origin
- actor_context
- timestamps for each state transition

### State-specific

- `received`
  - ticket_source, intake_channel, submitter_identifier, raw_customer_message, submission_timestamp

- `triaged`
  - triage_owner, triage_timestamp, classification, routing_target, triage_notes, urgency_reason

- `reply_drafted`
  - drafted_reply_text, drafting_agent, draft_timestamp, draft_assumptions, evidence_reference

- `awaiting_gary_approval`
  - gary_assigned, approval_request_timestamp, draft_reference, risk_flags

- `approved_to_send`
  - approver_id, approval_timestamp, approval_notes, approved_reply_snapshot, approval_decision

- `sent_to_customer`
  - communication_channel, recipient_contact, sent_payload_reference, sent_confirmation

- `closed`
  - closure_note, closure_timestamp, closed_by, final_status_summary

- `blocked`
  - blocked_reason, blocked_reason_detail, blocker_owner, mitigation_plan, blocking_evidence, next_action, blocked_timestamp

## 10) Communication Rules

- No autonomous customer communication.
- No send without Gary approval.
- Customer email required before `sent_to_customer`.
  - If missing, ticket must be `blocked` with `awaiting_customer`.
- Missing email routes to blocked.
- Sensitive/private data requires `internal_review` blocked handling.
- No direct send from any pre-approval state.

## 11) Blocked Ticket Handling

Approved blocked reason codes (from `PHASE1_STATE_MACHINE.md`):

- `awaiting_customer`
- `awaiting_access`
- `awaiting_vendor`
- `duplicate_ticket`
- `misrouted`
- `internal_review`
- `other`

### Entry requirements

- Valid blocked_reason selected.
- Owner and remediation action captured.
- Evidence supporting the block recorded.
- State preserved until remediation complete.

### Exit requirements

- Blocking condition resolved or sufficiently mitigated.
- `ticket unblocked` evidence recorded.
- Next-state entry criteria satisfied.

### Audit requirements

- `ticket blocked` with reason + evidence.
- `ticket unblocked` with blocker owner and resolution summary.
- Any route-change rationale preserved for traceability.

## 12) Priority Framework

Priority is intended-use only for sequencing and workload handling.

- `low`: routine, non-urgent.
- `normal`: standard requests.
- `high`: elevated impact, prioritize ahead of low/normal.
- `critical`: urgent production-impacting issues; still follow same deterministic path and blocked safeguards.

## 13) Identity Confidence Handling

Identity confidence is intended-use only and can influence comms safeguards:

- `known`: verified identity and confirmed contact.
- `claimed`: plausible identity, not independently verified.
- `unknown`: no reliable identity data at intake.

If `unknown`, require stronger evidence or blocking steps before sending.

## 14) Future Integration Boundaries

Design boundaries for future phases; not to be implemented in Phase 1:

- HiveRunner future execution layer: keep state lifecycle semantics implementation-ready but do not build execution orchestration integrations now.
- IntrynSync future governance layer: keep evidence schema concept for future mapping; do not implement integration logic now.
- Email ingestion future phase: currently assume manual/validated intake.
- Customer portal future phase: no customer-facing surfaces in Phase 1.
- Session audit future phase: audit events are required conceptually but no telemetry stack in this phase.

## 15) Implementation Readiness Checklist

Before proceeding to any schema/API/UI work:

- State definitions and transitions are approved.
- Permission matrix is validated against each actor.
- All required metadata is assigned per state.
- Allowed transitions and invalid transitions are unambiguous.
- Blocked reason lifecycle and audit events are standardized.
- Communication rules explicitly forbid autonomous and unapproved sends.
- Non-goals and future integration boundaries are signed off.
- Open questions from design review are resolved.

## 16) Risks

- Ambiguous manual escalation paths could create inconsistent approvals.
- Weak submitter identity handling can delay communication if not explicitly governed.
- Incomplete metadata capture can break deterministic progression and audit traceability.
- Blocked reason misuse can create queue deadlock.
- Rework loops can occur if rewrite/review criteria are underspecified.

## 17) Open Questions

1. Should Client Admin be able to view tickets or only escalate issues in Phase 1?
2. Is identity confidence `unknown` sufficient to prevent send, or do we require explicit `known` for all production communication?
3. Should duplicate detection happen before triage (automatic hint) or during triage for strict rule determinism?
4. Which role is responsible for final blocked-to-closure resolution if no additional customer action is possible?
5. Should `internal_review` require explicit second approver for high/critical tickets?

## 18) Recommended Next Step

Approve this technical design and then move to:

**PHASE1_SCHEMA_PLAN.md**

Reason: schema planning is the next planning artifact after this workflow/behavior design and keeps Phase 1 strictly implementation-ready without implementation execution.
