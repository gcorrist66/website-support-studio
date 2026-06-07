# Development Standards (Phase 1A)

## Scope

These standards govern repository preparation and documentation updates during Phase 1A only.

They are not production code standards and do not authorize API, workflow, or runtime implementation.

## Naming Conventions

- File names: UPPERCASE_WITH_UNDERSCORES for phase/planning docs already in use (e.g., `PHASE1_IMPLEMENTATION_PLAN.md`).
- Section headings: title case, concise, and outcome-oriented.
- Role names: match approved role set exactly (`Agency Admin`, `Client Admin`, `Site User`, `CS Agent`, `Gary / Human Approver`, `System`).
- Workflow states: use canonical states from the state machine (`received`, `triaged`, `reply_drafted`, `awaiting_gary_approval`, `approved_to_send`, `sent_to_customer`, `closed`, `blocked`).
- Statuses and reason codes: all lower_snake_case in code-agnostic planning tables.

## File Conventions

- Keep each planning artifact focused on one primary decision domain.
- Include a clear scope line at the top of each new planning doc.
- Add "Forbidden Work" and "Allowed Work" when creating implementation plans.
- Use explicit bullet list formatting for gated checks and evidence requirements.
- Prefer short paragraphs and deterministic checklists over verbose prose.

## Documentation Conventions

- Required source documents must be listed in any new plan or strategy document.
- Document all assumptions, especially around tenant boundaries and role authority.
- Include an explicit "Authorization Boundary" section whenever implementation-related claims are made.
- Add "Open Questions" for unresolved decisions before moving to the next phase.
- Maintain a "Do Not Build in This Phase" block in each major strategy document.

## Commit Conventions

- Use imperative, phase-scoped commit messages.
- Example format: `Add <artifact>`
  - `Add Foundation Architecture`
  - `Add Project Structure Recommendation`
- Reference scope in the body only when needed (e.g., `Phase 1A foundation pass only`).

## Branch Strategy

- Primary branch: `main`.
- Use temporary work branches for internal doc iterations only if needed, then rebase/sync before final merge.
- Avoid functional changes in the same commit as foundation planning updates.

## Code Review Expectations

For Phase 1A documents:
- Reviewer must validate:
  - tenant boundary consistency,
  - workflow boundary alignment,
  - no implementation bleed into code/DB/API/UI/integration/AI,
  - explicit authorization and risk controls.
- Reviewer must reject work that:
  - introduces concrete schema artifacts,
  - implies production runtime behavior,
  - or bypasses approval gate language from source documents.
- Suggested review format: "Approved", "Needs clarification", or "Blocked" with references.

## Quality Gates for Phase 1A

- No direct implementation files added.
- No API route, migration, or service stub added.
- Every strategy includes:
  - verification approach,
  - ownership signals,
  - and explicit open questions.
- Documentation references and links must remain current across key foundation artifacts.
