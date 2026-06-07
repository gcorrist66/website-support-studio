# WSS Phase 1 State Machine

## Architecture Review

Phase 1 remains documentation-governed and implementation-ready with strict boundaries:

- Human-in-the-loop deterministic workflow only.
- Core flow: `received` -> `triaged` -> `reply_drafted` -> `awaiting_gary_approval` -> `approved_to_send` -> `sent_to_customer` -> `closed`.
- `blocked` is only a temporary hold state for unresolved preconditions.
- No autonomous replies, no Dev Agent, no IntrynSync integration in this phase.
- No learning system, no customer dashboard, no session replay, no feature voting.
- No direct API/spec implementation in this phase; this document defines behavior for technical planning.

The accepted status model is the final authority and must be used by all technical design, playbooks, and QA scenarios.

## Approved Phase 1 Statuses

`received`, `triaged`, `reply_drafted`, `awaiting_gary_approval`, `approved_to_send`, `sent_to_customer`, `closed`, `blocked`.

## State Definitions

### 1) `received`

1. Purpose
- Capture a valid inbound customer request and create a ticket record.

2. Entry Criteria
- Customer request is submitted through a supported intake channel.
- Minimum capture includes customer message, source, and site or site candidate.
- Duplicate check is evaluated (can remain unresolved briefly until triage).

3. Required Metadata
- ticket_id
- ticket_source
- site_of_origin
- submitter_identifier (if known)
- submission_timestamp
- raw_customer_message
- intake_channel
- priority (from framework)
- identity_confidence

4. Allowed Actors
- System (primary)
- Agency Admin (manual intake exception only)

5. Allowed Next States
- `triaged`
- `blocked` (if immediate blocker is detected before CS review)

6. Invalid Transitions
- `approved_to_send`
- `sent_to_customer`
- `closed`

7. Audit Events Required
- request_received
- ticket_created
- initial_classification_attempt

8. Notes
- Do not draft a reply or approval decision in this state.
- This is the entry point only.

---

### 2) `triaged`

1. Purpose
- CS Agent determines intent, urgency, and routeability before drafting.

2. Entry Criteria
- Ticket exists in `received`.
- Customer request is readable and mapped to tenant/site context.
- CS Agent confirms triage decision.

3. Required Metadata
- triage_timestamp
- triage_owner (CS Agent)
- classification (ticket type/category)
- urgency_reason
- routing_target
- triage_notes
- is_sensitive_check (true/false)
- tentative_response_plan

4. Allowed Actors
- CS Agent
- Agency Admin (rare operational override)

5. Allowed Next States
- `reply_drafted`
- `blocked`

6. Invalid Transitions
- `approved_to_send`
- `sent_to_customer`
- `closed`
- `received` (re-entry not allowed)

7. Audit Events Required
- triage_completed
- classification_recorded
- routing_decision_recorded

8. Notes
- If classification is unclear, move to `blocked` with a reason.
- Sensitive/private content should be flagged before drafting.

---

### 3) `reply_drafted`

1. Purpose
- Capture a proposed human-readable response prepared for approval.

2. Entry Criteria
- CS Agent has completed triage and classification.
- Draft content is present and maps to customer request.

3. Required Metadata
- drafted_reply_text
- drafting_agent
- draft_timestamp
- evidence_reference
- classification_confirmation
- draft_assumptions
- quality_check_flag

4. Allowed Actors
- CS Agent

5. Allowed Next States
- `awaiting_gary_approval`
- `blocked`

6. Invalid Transitions
- `sent_to_customer`
- `approved_to_send` (cannot skip explicit approval gate)
- `closed`
- `received`

7. Audit Events Required
- reply_drafted
- draft_snapshot_stored

8. Notes
- Draft can be revised only while remaining in `reply_drafted`.
- Never send from this state.

---

### 4) `awaiting_gary_approval`

1. Purpose
- Hold draft for mandatory human approval by Gary before any customer-facing send.

2. Entry Criteria
- Ticket is in `reply_drafted`.
- Draft exists and is attached.
- No unresolved hard block remains.

3. Required Metadata
- gary_assigned
- draft_reference
- approval_request_timestamp
- approval_deadline_guidance (non-SLA)
- risk_flags

4. Allowed Actors
- System (state movement)
- Gary / Human Approver
- Agency Admin (administrative re-route only)

5. Allowed Next States
- `approved_to_send`
- `blocked`

6. Invalid Transitions
- `sent_to_customer`
- `closed`
- `received`
- `triaged`
- `reply_drafted` (re-entry only via explicit rewrite path below)

7. Audit Events Required
- approval_requested
- approval_gate_entered
- approval_waiting_timepoint

8. Notes
- If Gary requests changes, return to `reply_drafted` with explicit review comments.
- Keep this state until a clear approval decision is stored.

---

### 5) `approved_to_send`

1. Purpose
- Record explicit approval to communicate draft externally.

2. Entry Criteria
- Gary or designated Human Approver explicitly approves the draft.
- Approval includes confirmation that no blocking constraints remain.

3. Required Metadata
- approver_id
- approver_signature_or_identity_reference
- approval_timestamp
- approval_decision = `approved`
- approval_notes
- approved_reply_snapshot

4. Allowed Actors
- Gary / Human Approver
- Agency Admin (only in emergency override with explicit reason and evidence)

5. Allowed Next States
- `sent_to_customer`

6. Invalid Transitions
- `awaiting_gary_approval` (must not be used for post-approval reversals)
- `blocked`
- `closed`
- `received`

7. Audit Events Required
- approval_granted
- approved_reply_frozen
- approval_context_recorded

8. Notes
- This is a short-lived state. If anything materially changes, move to `reply_drafted` for revision via re-draft process.

---

### 6) `sent_to_customer`

1. Purpose
- Capture confirmed outbound customer communication.

2. Entry Criteria
- Ticket is `approved_to_send`.
- Final approved reply is sent.
- Delivery channel recorded.

3. Required Metadata
- sent_timestamp
- communication_channel
- recipient_contact
- sent_payload_reference
- delivery_status (attempted/sent)
- sent_confirmation
- customer_notification_copy

4. Allowed Actors
- System
- CS Agent (operational action execution under approved template)

5. Allowed Next States
- `closed`

6. Invalid Transitions
- `received`
- `triaged`
- `reply_drafted`
- `awaiting_gary_approval`
- `approved_to_send`

7. Audit Events Required
- response_sent
- customer_communication_confirmation
- sent_message_hash_or_reference

8. Notes
- No autonomous sending is allowed.
- Communication is explicitly operator-assisted and approval-led.

---

### 7) `closed`

1. Purpose
- Mark work complete after successful communication and post-send closure note.

2. Entry Criteria
- Ticket is in `sent_to_customer`.
- Closure note exists.
- No open blocking reason remains.

3. Required Metadata
- closure_timestamp
- closed_by
- closure_note
- final_status_summary
- closure_verifier (if applicable)

4. Allowed Actors
- CS Agent
- Agency Admin
- Gary / Human Approver

5. Allowed Next States
- _No outgoing transitions_ (terminal state)

6. Invalid Transitions
- Any state transition out of `closed`.
- Reopening is not allowed in Phase 1.

7. Audit Events Required
- ticket_closed
- closure_note_recorded
- final_state_hash_snapshot

8. Notes
- Phase 1 explicitly forbids self-closing; closure must be workflow-driven.

---

### 8) `blocked`

1. Purpose
- Pause progression due to missing input, wrong routing, safety concerns, or duplicate handling.

2. Entry Criteria
- At least one blocking reason is present from approved `blocked_reason` values.
- Entry requirement for reason has been satisfied.
- Next step cannot proceed until reason is cleared.

3. Required Metadata
- blocked_reason
- blocked_reason_detail
- blocked_timestamp
- blocker_owner
- mitigation_plan
- blocking_evidence
- next_action
- next_action_deadline_guidance (non-SLA)

4. Allowed Actors
- CS Agent
- Agency Admin
- Gary / Human Approver
- System (for auto-flagging scenarios)

5. Allowed Next States
- From `received`: `triaged`
- From `triaged`: `reply_drafted`
- From `reply_drafted`: `awaiting_gary_approval`
- From `awaiting_gary_approval`: `reply_drafted` (after revision request) or back to `awaiting_gary_approval` upon re-request

6. Invalid Transitions
- `closed`
- `received`
- `approved_to_send`
- `sent_to_customer`

7. Audit Events Required
- blocked_entered
- blocker_recorded
- action_requested

8. Notes
- Blocked is used to avoid unsafe, incorrect, or unauthorized actions.
- A ticket may enter `blocked` from any non-terminal state.

## State Transition Rules

1. No skipping of approval states.
- `reply_drafted` must precede `awaiting_gary_approval`.
- `approved_to_send` must precede `sent_to_customer`.

2. No direct close from `received`.

3. No direct send without approval.
- Transition to `sent_to_customer` is only valid from `approved_to_send`.

4. No autonomous customer communication.
- All communication is via explicit state progression and human approval.

5. No self-closing tickets.
- Tickets must not close without moving through `sent_to_customer`.

6. No external edits after approval.
- `approved_to_send` does not permit revision without a controlled return to `reply_drafted` and re-approval.

7. Deterministic and reversible policy.
- Forward transitions only by valid state actions.
- `closed` is terminal in Phase 1.

## Transition Matrix

| From \ To | received | triaged | reply_drafted | awaiting_gary_approval | approved_to_send | sent_to_customer | closed | blocked |
|---|---|---|---|---|---|---|---|---|
| received | no | yes | no | no | no | no | no | yes |
| triaged | no | no | yes | no | no | no | no | yes |
| reply_drafted | no | no | no | yes | no | no | no | yes |
| awaiting_gary_approval | no | no | allowed-with-rewrite | no | yes | no | no | yes |
| approved_to_send | no | no | no | no | no | yes | no | no |
| sent_to_customer | no | no | no | no | no | no | yes | no |
| blocked | no | yes (if triage unresolved) | yes (if draft required) | yes (revision path) | no | no | no | yes (if recurred) |
| closed | no | no | no | no | no | no | no | no |

> `blocked` transition paths are conditional on reason resolution and responsible actor action.

## BLOCKED STATE FRAMEWORK

### blocked_reason values

- `awaiting_customer`
- `awaiting_access`
- `awaiting_vendor`
- `duplicate_ticket`
- `misrouted`
- `internal_review`
- `other`

### Entry Requirements
- A valid reason from the list is selected.
- Required context includes owner, impact statement, and next action.
- Evidence supporting the block is attached.

### Exit Requirements
- Blocker resolved and documented.
- Corrective action completed.
- Re-entry criteria for the next target state satisfied.
- Required audit event written.

### Audit Requirements
- blocked_entered
- blocker_owner_assigned
- blocker_resolution_plan
- unblock_timestamp
- exit_reason

## PRIORITY FRAMEWORK

Priority expresses urgency for sequencing only; no SLA logic is defined in Phase 1.

- `low`: Non-urgent, routine request.
- `normal`: Standard business request.
- `high`: Customer-impacting issue with elevated handling expectation.
- `critical`: Service-affecting or urgent production-impacting issue; still uses same deterministic workflow with blocked and escalation fields.

## IDENTITY CONFIDENCE MODEL

Identity confidence affects routing and communication care.

- `known`: Customer identity confirmed against verified information.
- `claimed`: Identity provided by user and plausible but not yet verified.
- `unknown`: Identity cannot be validated from request alone.

## PHASE 1 NON-GOALS

- No Dev Agent
- No Auto Reply
- No IntrynSync
- No HiveRunner dependency
- No Learning Engine
- No Autonomous Actions

## Risks

- Over-broad or inconsistent reason text in `blocked` can reduce audit clarity.
- Missing mandatory metadata fields can create non-deterministic behavior.
- Repeated rework loops may occur if `reply_drafted` to `awaiting_gary_approval` to `blocked` without strict rewrite completion criteria.
- Premature transitions can create audit gaps unless transition events are enforced as required.

## Open Questions

1. Is `awaiting_access` ever used for permission failures only, or also for credentials/time-based dependency waits?
2. Should all `critical` tickets auto-enter `awaiting_gary_approval` with priority override tags?
3. Does `blocked` require a standardized `other` taxonomy suffix for reporting consistency?
4. Should `awaiting_vendor` and `duplicate_ticket` capture separate resolution owners by default?
5. What minimum identity-confidence threshold should block outbound customer communication?

## Recommendation for Technical Design Readiness

Proceed to technical design after a dry-run of this state machine against at least three representative request scenarios:
- standard request
- duplicate request
- urgent production issue

For each scenario, verify:
- state progression only uses allowed transitions,
- required metadata is present in every non-terminal state,
- approval gate is mandatory,
- blocked entry and exit are traceable via audit events.
