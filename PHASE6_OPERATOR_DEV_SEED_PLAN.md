# WSS Phase 6G — Operator Dev Seed (Dev-Only)

Status: **APPLIED to Supabase dev.** Three dev operators are seeded (idempotently) into the dev
`operators` table. Scope: WSS Supabase **dev** project (`vrtfbbrwrxyljchywmzy`) only. Never production.

Artifacts:
- `supabase/seed/phase6g_dev_operators.sql` — idempotent dev seed (synthetic seed agency + 3 operators).
- `scripts/seed-operators-dev.mjs` (`npm run seed:operators-dev`) — guarded apply (dev env + linked-ref guard).
- `scripts/validate-operator-seed-db.mjs` (`npm run validate:operator-seed-db`) — guarded DB verification.
- `scripts/validate-operator-seed.mjs` (`npm run validate:operator-seed`) — shape-only validation (no DB).

Seed agency: a dedicated synthetic dev fixture `00000000-0000-4000-8000-0000000000a6`
("WSS Dev Seed Agency" / `wss-dev-seed-agency`) — deterministic, not a real production id.

## 1) Purpose
Define a small, deterministic set of internal operators to seed into the **dev** `operators`
table (Phase 6C) once the migration is applied to dev. This unblocks local mapping of
operator rows → `OperatorSession` and exercises the capability guards (Phase 6B) end-to-end —
without enabling runtime auth, login UI, RLS, or any production data change.

## 2) Required Agency Reference
- Seeding requires a real **dev** agency id (`operators.agency_id` references `public.agencies(id)`).
- Resolve it at apply time from the dev DB (e.g. select an existing dev agency), or create a
  dedicated dev agency first. Do not hardcode a real id in committed files.
- All seed operators belong to that single dev agency. `client_ids`/`site_ids` are left `null`
  (agency-wide) for the initial seed.

## 3) Seed Operators (dev-only)
| display_name        | role           | status | email (dev/test)               | auth_user_id |
|---------------------|----------------|--------|--------------------------------|--------------|
| Gary Approver       | gary_approver  | active | gary.approver@wss-dev.test     | null         |
| CS Agent (dev)      | cs_agent       | active | cs.agent@wss-dev.test          | null         |
| Agency Admin (dev)  | agency_admin   | active | agency.admin@wss-dev.test      | null         |

- Emails use a clearly non-production `@wss-dev.test` domain and are stored lowercase
  (matches the DB `operators_email_lowercase` check).
- `auth_user_id` is **null** for every seed row — Supabase Auth linkage is future work
  (do not link to real auth users until auth is wired).
- `status = active` so each maps to a usable session; add a `suspended`/`archived` example
  later only if needed to exercise rejection paths (the validation already covers those in-memory).

## 4) No Production Seed / No Secrets
- No seeding against any production/customer database.
- No secrets (keys, tokens, passwords) are part of the seed; operators carry no credentials.
- No real customer or staff PII — all values are synthetic dev placeholders.

## 5) Apply Strategy (when dev apply happens)
1. Apply the Phase 6C migration to dev first (review → `supabase db push`).
2. Resolve/choose the dev `agency_id`.
3. Insert the three rows (idempotently — e.g. `on conflict (agency_id, email) do nothing`,
   matching the `operators_agency_email_unique` constraint).
4. Insert via the established dev workflow (tracked migration seed, or a guarded dev-only
   `supabase db query` using the same env guard pattern as the existing validators). Never the
   browser, never the service-role key in client code.

## 6) Cleanup Strategy
- Seed rows are removable by `(agency_id, email)`:
  `delete from public.operators where email in
   ('gary.approver@wss-dev.test','cs.agent@wss-dev.test','agency.admin@wss-dev.test');`
- Because rows carry no `auth_user_id` and no FKs point at operators, deletion is safe and leaves
  no orphans. The dev agency reference is untouched.

## 7) Validation Strategy
- Shape validation (no DB) is provided by `scripts/validate-operator-seed.mjs`
  (`npm run validate:operator-seed`): it builds the three proposed operator inserts, runs
  `validateOperatorInsert`, confirms normalized emails, correct roles, null `auth_user_id`,
  `active` status, synthetic dev domain, and that each maps to a correctly-capable session
  (gary→approve/reject; cs_agent→create/triage/draft/request/send/close; admin→all).
- Post-apply DB verification (dev only, when applied): confirm the three rows exist with the
  expected roles/status, that no extra rows were inserted, and that RLS remains disabled.

## 8) Apply Evidence (Supabase dev)
- Applied via `npm run seed:operators-dev` (guarded). Run twice to confirm idempotency.
- Verified via `npm run validate:operator-seed-db` (all checks pass) and direct queries:
  - 3 operators present under agency `00000000-0000-4000-8000-0000000000a6`:
    `agency.admin@wss-dev.test` (agency_admin), `cs.agent@wss-dev.test` (cs_agent),
    `gary.approver@wss-dev.test` (gary_approver) — all `status=active`, `auth_user_id=null`.
  - `select count(*) from public.operators` = 3 (only the seed; no duplicates after repeated apply).
  - `operators.relrowsecurity = false` (RLS still disabled).

## 9) What Is NOT Done
- No production seed; no rows in any production/customer database.
- No `auth_user_id` linkage; no auth runtime; no login UI; no RLS; no routes.
- No secrets; no real PII (synthetic `@wss-dev.test` operators under a synthetic dev agency).
