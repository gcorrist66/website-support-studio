# WSS Preview Methodology V2

**SUPERSEDES V1**

This document is canonical for all future WSS preview work.

## NON-NEGOTIABLE RULES

1. **System is the lens.**
   - Every layout, hierarchy, and interaction must clearly reflect the assigned design system.
2. **Business is the subject.**
   - The output must visually and editorially prioritize the prospect business identity over WSS tooling context.
3. **Recognition Test required.**
   - A preview is only valid if an owner can recognize the business and 3+ identity assets are preserved.
4. **Keep vs Improve Matrix required.**
   - Document what is retained from the prior build and what improved, with evidence.
5. **Real assets before placeholders.**
   - Use real business assets (copy, values, contact, city/service context) before fallback placeholders.
6. **Identity wins over system.**
   - If there is conflict, preserve business identity and trust cues first, then apply system structure.
7. **No preview can pass without Recognition Test.**
   - If recognition fails, the preview is incomplete and blocked from completion.

## Required tests and pass gates

A preview must pass every test below before it can be marked complete.

### Recognition Test
- Would the owner recognize their company from this preview?
- Are 3+ identity assets preserved?

### Improvement Test
- Is conversion better than the prior version?
- Is hierarchy better than the prior version?
- Is mobile better than the prior version?

### System Test
- Does the assigned system read correctly and consistently (e.g., Lead Generation vs Modern Local)?

### No-Go Rule
If any test or question fails, the preview is **No-Go** and cannot be marked complete.

## Required outputs

Before any completion marking, include evidence for:
- Before screenshot set
- After screenshot set
- Full-page grayscale screenshot set
- Desktop QA screenshot set
- Mobile QA screenshot set
- Completed [Acceptance Checklist](./WSS_PREVIEW_ACCEPTANCE_CHECKLIST.md)

## Operational order for each preview

1. Run baseline capture.
2. Apply system-specific changes while preserving business identity.
3. Run required tests (Recognition / Improvement / System).
4. Capture after set.
5. Complete checklist and keep vs improve matrix.
6. Mark only when all checks pass.
