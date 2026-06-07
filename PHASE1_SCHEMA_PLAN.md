# WSS Phase 1 Schema Planning (Pre-Schema)

## 1. Architecture Validation

Phase 1 requirements are represented cleanly by the approved architecture and state machine.

- **Independent project scope** is preserved: WSS is standalone and separate from Website Operations Desk, IntrynSync, and HiveRunner implementations.
- **Hierarchical tenant model** is stable: Agency → Client → Site → Ticket.
- **Workflow governance** is deterministic and human-in-the-loop.
- **State machine** already defines a finite, auditable lifecycle with explicit allowed/invalid transitions.
- **Non-goals** and scope boundaries remain intact, preventing drift into automation or integration work.

Conclusion: the approved model is sufficiently normalized for a clean schema planning phase.

## 2. Core Entity Inventory

Conceptual entities required for Phase 1:

- Agency
- Client
- Site
- Ticket
- Ticket Submitter
- Ticket Message
- Ticket Draft Reply
- Ticket Approval
- Ticket Audit Event

## 3. Ownership Relationships

- **Agency owns Clients**
  - One Agency has many Clients.
  - A Client belongs to exactly one Agency.

- **Client owns Sites**
  - One Client has many Sites.
  - A Site belongs to exactly one Client.

- **Site owns Tickets**
  - One Site has many Tickets.
  - A Ticket belongs to exactly one Site.

- **Ticket owns**:
  - Messages (one-to-many)
  - Draft Replies (one-to-many or latest active draft)
  - Approvals (one-to-many for review attempts)
  - Audit Events (one-to-many append-only)

## 4. Lifecycle Data Requirements

Information that must persist for the ticket throughout its life:

- Canonical identifiers: `agency_id`, `client_id`, `site_id`, `ticket_id`.
- Current status and history of status transitions.
- Priority (`low`, `normal`, `high`, `critical`).
- Identity confidence (`known`, `claimed`, `unknown`).
- Submitter metadata sufficient for traceability and evidence.
- Message and communication artifacts:
  - raw request content,
  - drafted reply text,
  - approved reply snapshot,
  - outgoing communication record.
- Actor context for each action and transition.
- Closure artifacts:
  - closure_note,
  - closure timestamp,
  - closer identity.
- Blocked state context:
  - reason,
  - blocker owner,
  - mitigation plan,
  - unblock evidence.

These fields are necessary to reconstruct lifecycle decisions after the fact and to avoid ambiguity in operational behavior.

## 5. Governance Data Requirements

Required data to support governance controls:

- **Mandatory approval**
  - who approved,
  - approval timestamp,
  - explicit decision outcome,
  - approver rationale/notes,
  - approved reply snapshot linkage.

- **Auditability**
  - immutable event identity for transitions,
  - actor identity,
  - action timestamp,
  - before/after status,
  - contextual evidence references.

- **Human review**
  - triage actor,
  - triage notes,
  - classification,
  - routing decision,
  - risk flags,
  - review escalation path and reasons.

- **Deterministic transitions**
  - strict transition event ordering,
  - invalid transition prevention metadata,
  - blocked reason and required unblock conditions,
  - explicit state entry/exit audit records.

## 6. Audit Model Requirements

Required event categories (Phase 1):

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

Each category should be represented as an immutable event with:
- event type,
- ticket identifier,
- actor,
- timestamp,
- state-before,
- state-after (if transition event),
- rationale/reason reference.

## 7. Communication Data Requirements

Data required before reply can be sent:

- ticket status is `approved_to_send` and transition event is recorded,
- customer/recipient contact is present (email required in Phase 1 workflow),
- approved reply snapshot is available,
- sender channel is defined,
- communication confirmation/attempt evidence exists.

If contact is missing or uncertain, ticket must be blocked with `awaiting_customer` and cannot move to send.

## 8. Identity Confidence Requirements

- **known**
  - Identity confirmed through reliable identifier.
  - Preferred for final customer communication.

- **claimed**
  - Identity is plausible and provided.
  - Requires heightened caution and explicit human verification checkpoints if sensitive handling is likely.

- **unknown**
  - No reliable identity evidence yet.
  - Must trigger strict review/verification and can block outward communication until resolved.

## 9. Priority Requirements

Priority is intended for handling order only (no SLA implementation included in this document):

- **low**: routine requests.
- **normal**: standard request handling.
- **high**: elevated impact requests.
- **critical**: production-impacting or urgent requests; still follow the same approval flow and blocking rules.

## 10. Blocked Ticket Requirements

Approved blocked reasons are:

- awaiting_customer
- awaiting_access
- awaiting_vendor
- duplicate_ticket
- misrouted
- internal_review
- other

Additional preconditions for blocked state:
- reason must be selected from approved set,
- blocker owner must be assigned,
- mitigation or next action must be captured,
- blocking evidence must be retained,
- transition must emit `ticket_blocked` event.

Unblock requirements:
- blocker resolution documented,
- owner confirms resolution,
- required next-state entry criteria met,
- `ticket_unblocked` event emitted.

## 11. Future Compatibility Review

### HiveRunner
- Current schema planning can preserve deterministic state transitions as a standalone lifecycle model.
- Mapping exists conceptually for execution orchestration but no coupling should be implemented in Phase 1.

### IntrynSync
- Governance categories and audit event structure are already named for straightforward future mapping.
- IntrynSync can be layered later as a policy/analytics sink without changing core ticket state semantics.

### Customer Portal
- No portal data contract is introduced in Phase 1.
- Keep entities internally consistent and role-scoped so external read surfaces can be added without state model rewrites.

### Email Ingestion
- Required communication/submitter data fields already isolate inbound communication metadata from core state semantics.
- Future ingestion can map into `received` entry criteria without altering lifecycle logic.

### Session Audit
- Event model with immutable event categories supports later session-level audit expansion.
- No session infrastructure is designed in Phase 1.

## 12. Risks

- Relationship ambiguity without strict containment rules can create tenant boundary leakage.
- Under-specified blocked reason governance can lead to unresolved tickets.
- Missing identity-confidence handling can lead to unsafe communication progression.
- Incomplete audit evidence can weaken approval traceability.
- Too much optional metadata can reduce consistency in a strict deterministic workflow.

## 13. Open Questions

1. Should `known` identity be mandatory before all outbound communication, including `claimed` for low-impact requests?
2. Do we need a single “latest draft” pointer or versioned draft sequence in planning terms?
3. Should `approved_to_send` support multiple approval attempts while preserving immutable approval history?
4. Does `client admin` require visibility rights in Phase 1, or remain escalation-only?
5. Should `other` blocked reasons be free-text or require a constrained sub-code list for reporting consistency?

## 14. Architecture Readiness Decision

**READY FOR IMPLEMENTATION PLANNING**

Reason: Core workflow, governance constraints, tenant model, actor permissions, lifecycle metadata, and audit categories are now consistently representable at the schema-planning level, and all required Phase 1 non-goals and boundaries are documented. Schema/API/UI design can now begin in a follow-on step.

## Recommended follow-up

Proceed to explicit schema artifact planning only, keeping implementation work gated behind the decision boundary and Phase 1 non-goals.
