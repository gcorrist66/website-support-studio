# WSS Roadmap (Foundational)

## Phase 0 – Foundation (Current)
- Define independent project scope (standalone)
- Publish architecture and operating model
- Capture tenant boundaries and MMVP process
- Align governance/approval expectations
- Complete sign-off cleanup and exception/evidence documentation

## Phase 1 – MMVP
### Recommended Build Order
1. Domain taxonomy and terminology lock
   - Finalize Agency → Client → Site → Ticket model
   - Confirm identifiers, role names, and status vocabulary

2. Tenant model implementation plan (documentation and operating contract only in this phase)
   - Record Corriston Consulting example and naming conventions
   - Define site lifecycle assumptions and naming collisions strategy

3. Workflow blueprint
   - Formalize the six-step MMVP flow
   - Define entry and exit criteria for each status
   - Define deterministic approval and rollback rules

4. Governance checkpoints (IntrynSync-facing)
   - Specify required approval points and audit obligations
   - Define escalation and exception pathways

5. Execution readiness (HiveRunner-facing)
   - Define task handoff semantics between Intake, CS Agent, Gary, Customer, Closure
   - Define communication and closure timing assumptions

6. Implementation preflight
   - Validate independence from Website Operations Desk, IntrynSync implementation, and HiveRunner implementation
   - Confirm all Phase 1 out-of-scope boundaries

## Future Phases (beyond MMVP)
- Controlled integration of IntrynSync
- Expanded analytics and learning capture
- Feature request intake and voting
- Agent-assisted response drafting and optional autonomy tiers
- Customer-facing visibility surfaces
