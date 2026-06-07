# Website Support Studio (WSS)

## Purpose
Website Support Studio (WSS) is a standalone project for operationalizing website support workflows.

It is **not**:
- Website Operations Desk
- IntrynSync
- HiveRunner

WSS may evolve into a multi-tenant SaaS platform, but for Phase 1 it starts as a single project space with explicit tenant boundaries defined in architecture documentation.

## Project Nature
WSS is a documentation-first, architecture-first initiative. This repository currently captures:

- Strategic vision
- Foundational hierarchy and domain model
- Phase 1 MMVP scope
- Recommended build sequence

No application code, APIs, databases, tickets, agents, or UI are created in this phase.

## Positioning
WSS runs on:
- **HiveRunner** as execution layer (operational task flows, scheduling, task state handling, human coordination)
- **IntrynSync** as governance layer (auditability, policy/compliance checks, process controls)

Although WSS uses these shared services, WSS is a **separate and independent** project.

## Phase 0 Architecture Sign-Off Baseline
This repository is complete for architecture documentation cleanup and is ready for implementation planning once the sign-off questions are resolved.
