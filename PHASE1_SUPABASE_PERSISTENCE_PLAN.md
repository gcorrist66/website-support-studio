# Phase 1I — Supabase Persistence Planning

## 1) Purpose

This document defines the persistence planning needed before implementing Phase 1 persistence work in Supabase. It is planning only: no SQL, migrations, or Supabase environment changes are created in this phase.

## 2) Proposed Supabase table list

- `agencies`
- `clients`
- `sites`
- `tickets`
- `ticket_submitters`
- `ticket_messages`
- `ticket_draft_replies`
- `ticket_approvals`
- `ticket_communications`
- `ticket_audit_events`

## 3) Entity-to-table mapping

### `agencies`

- Maps to `Agency`
- Fields:
  - `agency_id` (PK)
  - `agency_name`
  - `policy_profile`
  - `created_at`
  - `updated_at`

### `clients`

- Maps to `Client`
- Fields:
  - `client_id` (PK)
  - `agency_id` (FK)
  - `client_name`
  - `created_at`
  - `updated_at`

### `sites`

- Maps to `Site`
- Fields:
  - `site_id` (PK)
  - `client_id` (FK)
  - `site_name`
  - `canonical_domain`
  - `created_at`
  - `updated_at`

### `tickets`

- Maps to `Ticket`
- Fields:
  - `ticket_id` (PK)
  - `site_id` (FK)
  - `submitter_id` (FK)
  - `status`
  - `priority`
  - `identity_confidence`
  - `current_actor_role`
  - `current_blocked_reason`
  - `blocked_context`
  - `blocked_at` (denormalized for active blocked state)
  - `closed_at`
  - `created_at`
  - `updated_at`

### `ticket_submitters`

- Maps to `TicketSubmitter`
- Fields:
  - `submitter_id` (PK)
  - `site_id` (FK)
  - `submitter_name`
  - `submitter_email`
  - `submitter_reference`
  - `identity_confidence`
  - `created_at`
  - `updated_at`

### `ticket_messages`

- Maps to `TicketMessage`
- Fields:
  - `message_id` (PK)
  - `ticket_id` (FK)
  - `submitted_by_submitter_id` (FK)
  - `raw_message`
  - `intake_channel`
  - `source`
  - `received_at`
  - `created_at`
  - `updated_at`

### `ticket_draft_replies`

- Maps to `TicketDraftReply`
- Fields:
  - `draft_id` (PK)
  - `ticket_id` (FK)
  - `draft_text`
  - `drafting_agent_role`
  - `drafted_at`
  - `draft_version`
  - `draft_assumptions`
  - `evidence_reference`
  - `quality_check_flag`
  - `created_at`
  - `updated_at`

### `ticket_approvals`

- Maps to `TicketApproval`
- Fields:
  - `approval_id` (PK)
  - `ticket_id` (FK)
  - `approver_role`
  - `decision`
  - `decision_notes`
  - `decision_at`
  - `approver_reference`
  - `approved_reply_snapshot`
  - `created_at`
  - `updated_at`

### `ticket_communications`

- Maps to `TicketCommunicationRecord`
- Fields:
  - `communication_id` (PK)
  - `ticket_id` (FK)
  - `draft_id` (FK, nullable)
  - `sent_by_role`
  - `sent_at`
  - `recipient_email`
  - `message_preview`
  - `communication_channel`
  - `rationale`
  - `created_at`
  - `updated_at`

### `ticket_audit_events`

- Maps to `TicketAuditEvent`
- Fields:
  - `audit_id` (PK)
  - `ticket_id` (FK)
  - `actor_id`
  - `event_type`
  - `actor_role`
  - `summary`
  - `metadata`
  - `actor_reference`
  - `occurred_at`
  - `state_before`
  - `state_after`
  - `rationale`
  - `created_at`

## 4) Tenant hierarchy persistence plan

Persist tenant structure exactly as the approved hierarchy:

- `agencies` 1→N `clients`
- `clients` 1→N `sites`
- `sites` 1→N `tickets`
- `submitters` constrained to site context via `site_id`
- `tickets` always resolve to a `site_id` at persistence time
- Every operational query for ticket behavior must be join-safe through `ticket_id` and `site_id`.

## 5) Ticket lifecycle persistence plan

- Persist `Ticket.status` and transition history in `ticket_audit_events` for all state moves.
- Keep current state on `tickets` for operational control and quick reads.
- Enforce `PHASE1_STATE_MACHINE.md` transitions in application/service layer before write.
- Include immutable audit fields for each transition in `ticket_audit_events`:
  - `state_before`
  - `state_after`
  - `occurred_at`
  - `actor_id`
  - `rationale`
- Blocked flow persistence:
  - `tickets.current_blocked_reason`
  - `blocked_context` JSON for mitigation/owner/evidence
  - additional unblock transition in audit trail

## 6) Approval persistence plan

- Every decision is persisted as a row in `ticket_approvals`.
- Approval history kept as append-only rows and ordered by `decision_at`.
- Local governance requirements reflected in persistence:
  - only approved roles can record `approved` / `rejected`
  - decision states must preserve last `decision` and reason
  - approval must exist before `approved_to_send` transition
  - `approved_reply_snapshot` stored to support immutability audit.

## 7) Communication persistence plan

- Persist send attempts and successful sends in `ticket_communications`.
- Each record includes:
  - `recipient_email`
  - `communication_channel`
  - `message_preview`
  - `rationale`
- Enforce in persistence reads/writes:
  - no send before approval
  - no send without email
  - no self-closing at send
- Local-only channel constraint in Phase 1 (`in_memory_record`) maps to a constrained enum/rule in migration planning.

## 8) Audit event persistence plan

- Persist all required event types:
  - `ticket_created`
  - `ticket_triaged`
  - `reply_drafted`
  - `approval_requested`
  - `approval_granted`
  - `approval_rejected`
  - `reply_sent`
  - `ticket_blocked`
  - `ticket_unblocked`
  - `ticket_closed`
- Include event payload in `metadata` with required keys defined in `src/domain/ticketLifecycle.ts` + validator expectations.
- Treat table as append-only; updates to historical rows are disallowed by policy.
- Index recommendations: `(ticket_id, occurred_at)` and `(event_type, occurred_at)`.

## 9) Search/card-search future compatibility note

The current local design can support future card/search surfaces without changing core tables by:

- exposing read models based on denormalized ticket status/priority/channel fields
- adding dedicated projection views later for search ranking
- keeping immutable event log (`ticket_audit_events`) as source of history and traceability for full-card timeline reconstruction.

## 10) RLS considerations

- Enable row-level security on all tables in future persistence implementation.
- Recommended role families:
  - tenant service actor role (internal service)
  - service admin role
- Scope predicates should enforce:
  - `agency_id`/`client_id` boundary integrity
  - no cross-tenant reads/writes
  - write restrictions for approval-sensitive states.
- Begin with conservative RLS disabled in local development environment until policy design is validated, then tighten before staging.

## 11) Auth considerations

Phase 1 remains non-UI and non-runtime auth implementation phase, but persistence planning should preserve:

- actor identity and role columns for all mutating actions
- immutable references to actor role (`ActorRole`)
- actor context in both `ticket_audit_events` and ticket state rows
- no direct auth table ownership assumptions in domain persistence yet.

## 12) Migration sequencing

### Recommended first migration slice
1. `agencies`
2. `clients`
3. `sites`
4. `tickets`
5. `ticket_audit_events`

### Later slices
- `ticket_messages`
- `ticket_draft_replies`
- `ticket_approvals`
- `ticket_submitters`
- `ticket_communications`

Rationale:
- first slice enables foundational tenant + ticket + immutable history baseline
- subsequent slices add append-only operational evidence without blocking core lifecycle persistence.

## 13) Seed-data strategy

- Seed minimal canonical records only for development test fixtures:
  - one local agency
  - one client per agency
  - one site per client
  - role-safe actor seed references
- Seed audit and test event rows only where needed for local workflow simulation.
- No production seed assumptions; no external integrations in this phase.

## 14) Local validation strategy (planning stage)

- Keep existing domain validation scripts as local source of truth:
  - `scripts/validate-domain.mjs`
  - `scripts/validate-e2e.mjs`
- Validate that all planned table contracts can satisfy required invariants from these scripts:
  - required states
  - required transitions
  - required approval preconditions
  - required audit events and metadata shape
  - no autonomous send path
- Add persistence-specific mock mapping validation in a follow-on planning verification step before coding migrations.

## 15) Risks

- Tenant boundary leakage if FK constraints/policies are weak.
- Data loss risk for blocked context if migration omits historical fields.
- RLS over-restriction can block legitimate internal service writes.
- Approval identity drift if actor role is not strongly validated at write time.
- Snapshot integrity risk for sent payload references if draft link is not preserved.

## 16) Open questions

- Should `communication_channel` remain constrained to `in_memory_record` during Phase 1 persistence seed, or should it already include provider enum placeholders for future?
- Do we persist blocked context only as JSON, or normalize fields for operational querying?
- Do we index `current_blocked_reason` for operational search in Phase 1 or defer?
- Should client/site onboarding use one default seed record in local fixtures or remain empty until API/workflow is introduced?
- Do we need explicit `identity_confidence` transition triggers per state, or keep governance checks in service layer only?

## 17) Recommended next migration slice

Proceed with foundational persistence planning and implementation in this order:
1. `agencies`
2. `clients`
3. `sites`
4. `tickets`
5. `ticket_audit_events`

Then add, in order:
- `ticket_messages`
- `ticket_draft_replies`
- `ticket_approvals`
- `ticket_communications`
- `ticket_submitters`

