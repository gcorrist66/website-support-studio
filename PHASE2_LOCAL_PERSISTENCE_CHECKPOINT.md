# Phase 2 Local Persistence Checkpoint

## 1) Current Local Status

- Phase 2 local persistence foundation implemented through migration and mapping scaffolding.
- No push or deploy performed.
- No production data writes or API routes introduced.

## 2) Phase 2A Summary

Implemented first persistence slice for tenant + ticket + audit:
- `supabase/migrations/20260607000001_phase2a_core_ticket_foundation.sql`
- Core enums for status/priority/confidence/block/roles/events.
- Tables added: `agencies`, `clients`, `sites`, `tickets`, `ticket_audit_events`.
- Tenant indexes and search-oriented comments/TSV index included.

## 3) Phase 2B Summary

Implemented ticket detail tables:
- `supabase/migrations/20260607000002_phase2b_ticket_detail_tables.sql`
- Tables added: `ticket_messages`, `ticket_draft_replies`, `ticket_approvals`, `ticket_communications`.
- Added constraints/indices and comments about explicit-approval-only communication persistence.

## 4) Phase 2C Summary

Added local TypeScript persistence mapping helpers:
- `src/persistence/schemaTypes.ts`
- `src/persistence/ticketMappers.ts`
- `src/persistence/persistenceGuards.ts`
- Includes insert/row-domain mapping for agency/client/site/ticket/audit event shapes.
- Includes local shape validators.

## 5) Phase 2D Summary

Added local validation script:
- `scripts/validate-persistence.mjs`
- Checks required/forbidden migration tables, enums, tenant FKs, metadata shape requirements, comments for search compatibility, and no API folder assumptions.

## 6) Files Created

- `supabase/migrations/20260607000001_phase2a_core_ticket_foundation.sql`
- `supabase/migrations/20260607000002_phase2b_ticket_detail_tables.sql`
- `src/persistence/schemaTypes.ts`
- `src/persistence/ticketMappers.ts`
- `src/persistence/persistenceGuards.ts`
- `scripts/validate-persistence.mjs`
- `PHASE2_GATE_TRACKER.md`
- `PHASE2_LOCAL_PERSISTENCE_CHECKPOINT.md`

## 7) Files Modified

- `scripts/validate-phase2a.mjs`
- `package.json`
- `eslint.config.js` (global script lint adjustments already present from prior local changes)
- `PHASE1_GATE_TRACKER.md` (high-level tracker not replaced yet)

## 8) Validation Evidence

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run validate:domain`
- `npm run validate:e2e`
- `npm run validate:phase2a`
- `npm run validate:persistence`

## 9) What Was Intentionally Not Done

- No API routes or UI changes.
- No authentication implementation.
- No customer portal or email provider integration.
- No production Supabase apply/deploy.

## 10) Supabase Application Status

- Migration files exist locally only.
- Not applied to local/production Supabase yet.
- Schema scripts are local planning and verification artifacts.

## 11) Push/Deploy Status

- Pushed: no
- Deployed: no

## 12) Risks

- Mapping context ambiguity: domain models do not contain full tenant identifiers; context object is required for accurate row inserts.
- Current schema comments and constraints may need final tuning once actual workflow writes are implemented.
- Draft/audit shape coverage depends on future local service layer conventions.

## 13) Open Questions

- Should `sites.agency_id` be denormalized or derived from client only?
- Should communication table require nullable recipient email for draft records in early testing fixtures?
- Should ticket title be required in UI input phase 1 or derived server-side later?

## 14) Recommended Next Step

Option B: Apply migrations to Supabase local/dev project only.
