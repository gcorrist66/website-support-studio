-- Phase 6G — Dev operator seed (DEV ONLY, idempotent).
--
-- This is NOT a migration. It is dev-only seed data for the Supabase dev project
-- (project ref vrtfbbrwrxyljchywmzy). Never apply to any production/customer database.
--
-- It seeds:
--   1. A dedicated, synthetic dev "seed agency" with a fixed placeholder UUID so the seed is
--      deterministic, self-contained, and cleanly removable. This id is a synthetic test fixture,
--      not a real production agency id.
--   2. Three internal operators (agency_admin, cs_agent, gary_approver) for that agency.
--
-- Properties:
--   * Idempotent: re-running inserts nothing new (on conflict do nothing).
--   * No auth_user_id (Supabase Auth linkage is future work); column defaults to null.
--   * status = active; emails are lowercase + a non-production @wss-dev.test domain.
--   * No secrets, no credentials, no real PII.
--   * Does NOT enable RLS, add auth runtime, login UI, or routes.

insert into public.agencies (id, name, slug)
values ('00000000-0000-4000-8000-0000000000a6', 'WSS Dev Seed Agency', 'wss-dev-seed-agency')
on conflict (id) do nothing;

insert into public.operators (agency_id, email, display_name, role, status)
values
  ('00000000-0000-4000-8000-0000000000a6', 'agency.admin@wss-dev.test', 'Agency Admin (dev)', 'agency_admin', 'active'),
  ('00000000-0000-4000-8000-0000000000a6', 'cs.agent@wss-dev.test', 'CS Agent (dev)', 'cs_agent', 'active'),
  ('00000000-0000-4000-8000-0000000000a6', 'gary.approver@wss-dev.test', 'Gary Approver', 'gary_approver', 'active')
on conflict (agency_id, email) do nothing;
