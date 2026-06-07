import fs from "node:fs";
import path from "node:path";

const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260607000001_phase2a_core_ticket_foundation.sql");
const migrationText = fs.readFileSync(migrationPath, "utf8");

const requiredTables = [
  "agencies",
  "clients",
  "sites",
  "tickets",
  "ticket_audit_events",
];

const forbiddenTables = [
  "ticket_messages",
  "ticket_draft_replies",
  "ticket_approvals",
  "ticket_communications",
];

const requiredColumns = {
  agencies: ["id", "name", "slug", "created_at", "updated_at"],
  clients: ["id", "agency_id", "name", "slug", "created_at", "updated_at"],
  sites: ["id", "agency_id", "client_id", "name", "url", "slug", "created_at", "updated_at"],
  tickets: [
    "id",
    "agency_id",
    "client_id",
    "site_id",
    "ticket_number",
    "title",
    "status",
    "priority",
    "identity_confidence",
    "submitter_name",
    "submitter_email",
    "blocked_reason",
    "blocked_from_status",
    "blocked_notes",
    "closure_note",
    "created_at",
    "updated_at",
    "closed_at",
  ],
  ticket_audit_events: [
    "id",
    "agency_id",
    "client_id",
    "site_id",
    "ticket_id",
    "actor_id",
    "actor_role",
    "event_type",
    "summary",
    "metadata",
    "occurred_at",
    "created_at",
  ],
};

const failures = [];

for (const table of requiredTables) {
  if (!new RegExp(`create table if not exists public\\.${table}\\b`, "i").test(migrationText)) {
    failures.push(`missing table: ${table}`);
  }
}

for (const table of forbiddenTables) {
  if (new RegExp(`\\bpublic\\.${table}\\b`, "i").test(migrationText)) {
    failures.push(`forbidden table present: ${table}`);
  }
}

for (const [table, cols] of Object.entries(requiredColumns)) {
  const createMatch = migrationText.match(new RegExp(`create table if not exists public\\.${table}[\\s\\S]*?;`, "i"))?.[0] ?? "";
  for (const col of cols) {
    if (!new RegExp(`\\b${col}\\b`, "i").test(createMatch)) {
      failures.push(`missing column ${col} on ${table}`);
    }
  }
}

const requiredConstraints = [
  "clients_agency_fkey",
  "sites_agency_fkey",
  "sites_client_fkey",
  "tickets_agency_fkey",
  "tickets_client_fkey",
  "tickets_site_fkey",
  "ticket_audit_events_ticket_fkey",
  "ticket_audit_events_agency_fkey",
  "ticket_audit_events_client_fkey",
  "ticket_audit_events_site_fkey",
];

for (const constraint of requiredConstraints) {
  if (!new RegExp(`constraint\\s+${constraint}\\b`, "i").test(migrationText)) {
    failures.push(`missing constraint: ${constraint}`);
  }
}

if (!/tickets_fulltext_idx/i.test(migrationText)) {
  failures.push("missing future full-text/candidate card search index");
}

if (failures.length > 0) {
  console.error("FAIL: phase2a migration validation failed");
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exitCode = 1;
  throw new Error("Phase 2A migration validation failed");
}

console.log("PASS: phase2a migration validation completed");
