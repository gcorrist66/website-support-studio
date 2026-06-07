# Phase 0 Sign-Off

## Architecture Decision
WSS is confirmed as a standalone project (not Website Operations Desk, IntrynSync, or HiveRunner) with clear dependency integration boundaries:
- HiveRunner handles execution mechanics.
- IntrynSync provides governance controls.

## Tenant Model Decision
The tenant hierarchy is locked as:

**Agency → Client → Site → Ticket**

Containment rule: each Ticket belongs to one Site, each Site to one Client, each Client to one Agency.

Corriston Consulting example tenant is adopted as the baseline taxonomy reference.

## Workflow Governance Model
Phase 1 workflow remains deterministic and human-in-the-loop:
- strict step-by-step approvals
- no autonomous replies
- mandatory Gary approval gate
- deterministic state transitions

## Phase 1 Status Model
- received
- triaged
- reply_drafted
- awaiting_gary_approval
- approved_to_send
- sent_to_customer
- closed
- blocked

## Open Questions Before Build
1. Do we need a strict SLA target per Phase 1 status transition?
2. Should blocked states carry standardized reason codes, or is free-text sufficient for Phase 1?
3. What is the minimum required identity assurance level for submitter identity when known/unknown?
4. Should urgent production issues always bypass triage timeboxing?

## MODEL RECOMMENDATION
- **Recommended:** GPT-5.3 Codex Spark
- **Reason:** documentation and architecture cleanup only
- **Escalation trigger:** only if tenant architecture or governance model becomes ambiguous
