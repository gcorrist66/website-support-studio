# Project Structure Recommendation (Phase 1A)

## Recommended Folder Structure

- `README.md`
- `VISION.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `TENANT_MODEL.md`
- `PHASE0_SIGNOFF.md`
- `PHASE1_STATE_MACHINE.md`
- `PHASE1_TECHNICAL_DESIGN.md`
- `PHASE1_SCHEMA_PLAN.md`
- `PHASE1_IMPLEMENTATION_PLAN.md`
- `FOUNDATION_ARCHITECTURE.md`
- `DEVELOPMENT_STANDARDS.md`
- `DEPLOYMENT_STRATEGY.md`
- `TESTING_STRATEGY.md`
- `PROJECT_STRUCTURE_RECOMMENDATION.md`

- `planning/`
  - `README.md` (planning index)
  - `phase-1a-checklist.md`
  - `phase-1a-risk-log.md`

- `docs/`
  - `roles.md`
  - `tenant-boundaries.md`
  - `state-machine-notes.md`

- `templates/`
  - `governance-checklist-template.md`
  - `review-gate-template.md`

- `artifacts/`
  - `phase1a-evidence-register.md`

- `tools/` (future)
  - reserved for non-functional utilities when approved

## Folder Governance Rules

- Foundation artifacts stay in root for immediate reviewer visibility.
- Planning and evidence artifacts stay in `planning/`.
- Future implementation folders (`src/`, `tests/`, `infra/`) are declared but not created in Phase 1A.

## Rationale

- Keeps context in one place for stakeholders.
- Preserves decision history separately from future runtime code.
- Supports future phase-by-phase expansion without destabilizing root planning documents.

## Note

Only this structure is recommended in documentation during Phase 1A.
No folders or files are required to be created beyond this document.
