# WSS Phase 1 Implementation Plan (MMVP)

## 1) Current Project Status

- `README.md`, `VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TENANT_MODEL.md`, `PHASE0_SIGNOFF.md`, `PHASE1_STATE_MACHINE.md`, `PHASE1_TECHNICAL_DESIGN.md`, and `PHASE1_SCHEMA_PLAN.md` are committed and represent the accepted planning baseline.
- The latest commit affecting Phase 1 planning is `Add Phase 1 schema plan`.
- Repository remains in Phase 1 documentation state only: no schema, no API, no UI, no jobs, no integrations, no runnable app code.
- The next deliverable is the explicit, safe execution plan for Phase 1 MMVP implementation sequencing.

## 2) Implementation Authorization Boundary

### Authorized Today
- Planning and sequencing for Phase 1 MMVP implementation.
- Documentation alignment and pre-flight checks.
- Creating implementation-ready narratives, test scenarios, and review gates.

### Not Yet Authorized
- Any application implementation.
- Any schema, migration, API, integration, UI, automation, dependency, or behavior that changes runtime behavior.
- Any phase that expands beyond Phase 1 MMVP scope (e.g., dashboard, agent autonomy, customer portal, learning systems).

### Explicit Rule
- The implementation plan is review-required before any code or schema implementation starts.

## 3) Phase 1 Build Sequence

### Phase 1A — Repository/Application Foundation
- Scope: repository and execution governance preparation only.
- Focus: verify baseline consistency, lock terms/versioning, and establish the implementation sequence artifact set.

### Phase 1B — Conceptual Schema Translation
- Scope: translate the state-machine and tenant model into concrete conceptual structures only.
- Focus: entity roles, mandatory links, lifecycle metadata, and blocked/approval invariants.

### Phase 1C — Ticket Lifecycle Backend
- Scope: model deterministic lifecycle behavior for ticket states.
- Focus: transition rules, allowed actors, preconditions, and failure modes (still pre-implementation).

### Phase 1D — Internal Operator Workflow
- Scope: standardize how Agency Admin, CS Agent, Gary, and System participate.
- Focus: triage, drafting, rewrite, unblock, and closure workflows.

### Phase 1E — Approval Gate
- Scope: formalize the mandatory Gary gate.
- Focus: approval entry/exit criteria, evidence capture, and blocked-rewrite-return rules.

### Phase 1F — Customer Communication
- Scope: define outbound communication path and safeguards.
- Focus: pre-send criteria, email/contact requirements, and no-autonomy constraints.

### Phase 1G — Audit Trail
- Scope: establish immutable governance artifacts and event obligations.
- Focus: event names, actor attribution, rationale, and traceability checkpoints.

### Phase 1H — End-to-End Verification
- Scope: confirm sequence coverage before implementation starts.
- Focus: scenario matrix, evidence checklist, and gate-by-gate readiness for handoff.

## 4) Build Phase Definitions

### Phase 1A — Repository/Application Foundation

Goal:
- Finalize a stable, explicit implementation foundation contract for Phase 1.

Allowed work:
- Confirm repository conventions and required docs.
- Validate terminology (`ticket status`, `blocked`, `approval gate`, tenant hierarchy).
- Define file-level plan checkpoints and review criteria.
- Identify no-go zones and escalation boundaries in checklist format.

Forbidden work:
- No code changes.
- No schema, migrations, or data model artifacts.
- No service or integration implementation.
- No UI/API route work.

Exit criteria:
- All Phase 1 source documents are cross-referenced and consistent.
- A single Phase 1 authorization boundary is approved.
- Project owners agree Phase 1A artifacts are complete and complete enough for planning-only execution.

Verification evidence required:
- `PHASE1_IMPLEMENTATION_PLAN.md` completed and committed.
- Explicit owner acknowledgment that no implementation is authorized yet.

### Phase 1B — Conceptual Schema Translation

Goal:
- Translate architecture and state-machine requirements into the minimum conceptual data model required for implementation planning.

Allowed work:
- Define conceptual entity set and relationships.
- Define lifecycle metadata required per state.
- Define required status transitions and blocked reason handling in non-technical language.

Forbidden work:
- No DB DDL, migration files, ORMs, or type definitions.
- No indexing or persistence mechanism choices.
- No API contract implementation.

Exit criteria:
- Tenant containment model is consistently mapped to ticket ownership.
- Core entities and lifecycle fields are unambiguously named.
- No contradiction with `PHASE1_STATE_MACHINE.md`.

Verification evidence required:
- Signed-off conceptual entity mapping doc.
- Matrix mapping states to required metadata per state.

### Phase 1C — Ticket Lifecycle Backend

Goal:
- Define deterministic lifecycle behavior before implementation.

Allowed work:
- Define phase-by-phase transition guardrails and failure handling.
- Define who may move each state and required evidence per transition.
- Define blocked/retry/rewrite behavior and explicit prohibitions.

Forbidden work:
- No coding task handlers, workers, serverless functions, or state stores.
- No command-line schema application.

Exit criteria:
- Every transition in the approved state machine has entry, exit, allowed actors, and forbidden transitions documented.
- All non-terminal states include required closure of metadata and evidence dependencies.

Verification evidence required:
- Transition matrix review against `PHASE1_STATE_MACHINE.md`.
- Deterministic-rule checklist signed by owner.

### Phase 1D — Internal Operator Workflow

Goal:
- Define operational roles and responsibilities for ticket handling with zero ambiguity.

Allowed work:
- Clarify role/action permissions.
- Define operational sequence from intake to draft to close.
- Define ownership for blocked tickets and escalation.

Forbidden work:
- No role-based code enforcement.
- No assignment automation or queue processing implementation.

Exit criteria:
- Unambiguous role-action ownership for triage, drafting, approval request, send support, and close.
- Escalation path and exception ownership for each blocked reason.

Verification evidence required:
- Role matrix reviewed against technical design and state machine.
- Blocker-owner mapping for each blocked reason.

### Phase 1E — Approval Gate

Goal:
- Lock mandatory approval checkpoint before any outbound customer communication.

Allowed work:
- Define explicit requirements to enter and exit `awaiting_gary_approval`.
- Define `approved_to_send` semantics and rework path.
- Define escalation and rewrite loop controls.

Forbidden work:
- No auto-approval logic or confidence-score-based bypass.
- No approval bypass workflows.

Exit criteria:
- The only valid send path includes Gary approval in all cases.
- Rework and reject flows are documented with state re-entry rules.

Verification evidence required:
- `approval gate` checklist with required actor, snapshot, rationale, and timestamp fields.
- Evidence list showing no skip paths for send.

### Phase 1F — Customer Communication

Goal:
- Define safe outbound communication flow and preconditions.

Allowed work:
- Define required recipient/contact criteria.
- Define communication channels, payload proof requirements, and confirmation artifacts.
- Define what must happen when mandatory contact is missing.

Forbidden work:
- No sender integration setup.
- No autoresponders or autonomous messaging.

Exit criteria:
- `sent_to_customer` is only reachable from `approved_to_send` in planning.
- Missing contact and sensitive cases are mapped to blocked handling.

Verification evidence required:
- Communication rule matrix signed against state machine.
- Evidence requirements for outgoing payload and recipient confirmation.

### Phase 1G — Audit Trail

Goal:
- Ensure governance traceability is planned before implementation.

Allowed work:
- Define immutable event set and required fields.
- Define evidence references for each important lifecycle action.
- Define closure proof requirements and final-state snapshot concept.

Forbidden work:
- No observability stack, logging platform selection, or database persistence implementation.
- No integration to external audit systems yet.

Exit criteria:
- Event taxonomy is complete and covers all state transitions and major decisions.
- Audit evidence requirements mapped to each transition.

Verification evidence required:
- Event name-to-state/action trace map.
- “No gaps” evidence checklist across `received` to `closed`.

### Phase 1H — End-to-End Verification

Goal:
- Validate that planned implementation path is executable, safe, and within scope.

Allowed work:
- Scenario-based review using standard, duplicate, and critical workflows.
- Validate each phase transition and evidence gate.
- Define production-verification gates for implementation handoff.

Forbidden work:
- No production-like execution or staging deployment at this phase.
- No feature expansion outside MMVP scenarios.

Exit criteria:
- All scenario checks pass against approval, blocked handling, and audit requirements.
- No unresolved scope-gap or ownership-gap issues before implementation start.

Verification evidence required:
- Signed scenario results.
- Formal go/no-go decision for moving from plan into Phase 1A implementation.

## 5) Minimum Viable Data Model Planning (Conceptual Only)

- Agency: unique tenant owner identity, policy scope, and client membership.
- Client: client identity, parent agency link, and site membership.
- Site: site identity, parent client link, optional domain/contact anchors.
- Ticket: ticket identity, parent site link, status lifecycle, priority, identity confidence, closure flags.
- Ticket Submitter: submitter identity hints, contact method, confidence level.
- Ticket Message: raw customer request and intake metadata.
- Draft Reply: draft text, draft owner, draft version, draft assumptions.
- Ticket Approval: approver identity, decision, rationale, signature/reference, decision timestamp.
- Ticket Audit Event: immutable action record with event type, actor, timestamps, state before/after, reason evidence.
- Blocked Context: reason, owner, remediation plan, evidence, unblock evidence.

No tables, SQL, indexes, migrations, ORMs, or persistence implementations are included at this step.

## 6) First Implementation Slice Recommendation

Recommended first slice: **Phase 1A only**.

- Rationale:
  - It is the lowest-risk, highest-leverage starting point.
  - It stabilizes terminology, ownership, and gate boundaries before implementation planning artifacts are translated into execution work.
  - It prevents scope drift while preserving MMVP constraints and authorization control.
- Immediate next action after Phase 1A approval: begin Phase 1B conceptual schema translation.

## 7) Production Verification Requirements (Gary Gated Model)

Apply the following completion gates in order for each coded Phase 1 slice:

1. Diagnosed
2. Fixed Locally
3. Committed
4. Pushed
5. Deployed
6. Production Verified
7. Closed

Each gate must include:
- Scope statement for the slice.
- Artifact proof that all gate conditions were met.
- Explicit statement of no approval bypass and no unauthorized scope expansion.

## 8) Risk Controls

- Scope creep
  - Risk control: lock allowed/disallowed work list per phase; explicit stop criteria.
  - Owner: Project lead with Phase boundary review.
- Autonomous behavior
  - Risk control: enforce explicit human gate by phase design and deny no-approval transitions.
  - Owner: Implementation reviewer against this plan.
- Approval bypass
  - Risk control: no send transition without approved-to-send evidence.
  - Owner: Governance steward.
- Ticket ownership ambiguity
  - Risk control: assign blocker owner and role actor matrix before moving to lifecycle implementation.
  - Owner: Operations lead.
- Audit gaps
  - Risk control: event-per-state and event-per-transition checks in phase planning.
  - Owner: Audit and compliance lead.
- Tenant leakage
  - Risk control: strict entity containment checks in all planned transitions and docs.
  - Owner: Data/tenant model steward.

## 9) Open Questions Before First Code

1. Is `identity_confidence = known` mandatory for all outbound customer communication or only for sensitive/critical cases?
2. What is the minimum accepted payload for customer contact when intake is unknown (email required vs validated email required)?
3. Should `blocked` reason `other` be constrained (enum + free-text detail) during Phase 1?
4. Who is the tie-break approver when Gary is unavailable and an urgent Phase 1 critical ticket is blocked at `awaiting_gary_approval`?
5. Do we need a mandatory review timestamp for blocked-to-unblock transitions in audit proofing?

## 10) Recommended First Codex Build Prompt (Phase 1A Only)

Use this for the next Codex task:

“Create only Phase 1A of `PHASE1_IMPLEMENTATION_PLAN.md`. Do **not** implement code, schemas, migrations, routes, UI, integrations, dependencies, or any work outside Phase 1 MMVP.  
Your deliverable is a planning-only foundation pass that:
- confirms all required source documents are consistent,
- captures the final scope boundary statement and authorization boundary,
- defines the implementation boundary checklist for Phase 1A,
- records unresolved questions and approvals needed before Phase 1B.
Pause for review before moving to Phase 1B.”
