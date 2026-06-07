# WSS Foundation Architecture (Phase 1A)

## Purpose

This document defines the repository and application foundation required before any Phase 1B+ implementation work begins.  
It is planning/documentation only and does not authorize any ticket, workflow, approval, communication, audit, integration, AI, or UI implementation.

## Recommended Application Architecture (Foundation)

WSS should start as a **policy-governed, documentation-first repository** with a clean separation of concerns:

1. Governance Layer (Documentation + Decisions)
- Purpose: own the contract for workflow rules, tenant boundaries, approvals, roles, and validation gates.
- Artifacts: this doc set, architecture documents, standards, and phase plans.

2. Domain Foundation Layer (Future Runtime Boundaries)
- Purpose: define the canonical domain terms and boundaries:
  - `Agency → Client → Site → Ticket`
  - lifecycle statuses, blocked reasons, and role permissions.
- Artifacts: tenant model docs and state machine references.

3. Orchestration Preparation Layer (Future Integration Surface)
- Purpose: define where future execution hooks should enter.
- Artifacts: project notes for HiveRunner-compatible handoff points and IntrynSync-compatible governance touchpoints.

4. Operations Layer (Future Controls)
- Purpose: define build, review, verification, and deployment governance processes.
- Artifacts: development standards, testing strategy, deployment strategy.

## Recommended Repository Structure (Planning Baseline)

- Keep documentation centralized at repository root for quick reviewer visibility.
- Keep operational scaffolding in a dedicated `/docs` directory.
- Keep future code in `/src` only after authorization to move beyond Phase 1A.
- Keep environment and deployment guidance explicit, but defer config files.
- Keep project planning artifacts in `/planning`.
- Keep architecture decision records and unresolved risks traceable and versioned with each phase.

## Recommended Project Organization

- Root:
  - README and core context documents.
  - Phase artifacts and planning outputs.
  - Project policy and standards documentation.

- `/docs`:
  - In-depth references that support implementation-ready decisions.
  - Change history for governance and approvals.

- `/planning`:
  - Build and implementation plans.
  - Milestones, scope boundaries, and phase transitions.

- `/templates` (future):
  - Process templates, review checklists, and evidence stubs.

- `/scripts` (future, gated):
  - Repository automation for checks once approved.

- `/src` (future, gated):
  - No code in Phase 1A.

## Reasoning for Decisions

- Documentation-first starts reduce ambiguity with minimal operational risk.
- Explicit separation of strategy vs implementation allows easy authorization tracking.
- Future-ready folder boundaries reduce rework when moving into Phase 1B-1H.
- Tenant and governance constraints must stay readable and enforced in planning before stateful behavior is implemented.
- No implementation artifacts are created in Foundation to avoid scope drift from authorized work.

## Conflicts Review

- No blocking conflicts were identified for Phase 1A.
- Existing source documents are consistent on:
  - standalone project position,
  - tenant hierarchy,
  - deterministic human-in-the-loop workflow,
  - non-goals for Phase 1.

## Compatibility Constraints

- HiveRunner: preserve lifecycle nomenclature and actor terminology for future orchestration handoff.
- IntrynSync: preserve audit-event, evidence, and approval checkpoints in planning metadata.
- Tenant model: enforce Agency/Client/Site/Ticket containment in all foundation language and folder naming assumptions.
