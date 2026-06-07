import fs from "node:fs";
import path from "node:path";
import process from "node:process";

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
  agencies: ["agency_id", "agency_name", "created_at", "updated_at"],
  clients: ["client_id", "agency_id", "client_name", "created_at", "updated_at"],
  sites: ["site_id", "client_id", "site_name", "created_at", "updated_at"],
  tickets: [
    "ticket_id",
    "site_id",
    "status",
    "priority",
    "identity_confidence",
    "current_actor_role",
    "created_at",
    "updated_at",
  ],
  ticket_audit_events: [
    "audit_id",
    "ticket_id",
    "actor_id",
    "event_type",
    "actor_role",
    "summary",
    "metadata",
    "occurred_at",
    "state_after",
    "created_at",
  ],
};

const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260607000000_phase2a_initial_core_tables.sql");
const migrationText = fs.readFileSync(migrationPath, "utf8");

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
  for (const col of cols) {
    const pattern = new RegExp(`${col}\\b`, "i");
    if (!pattern.test(migrationText.match(new RegExp(`create table if not exists public\\.${table}[\\s\\S]*?;`, "i"))?.[0] || "")) {
      failures.push(`missing column ${col} on ${table}`);
    }
  }
}

const requiredConstraints = [
  "clients_agency_fkey",
  "sites_client_fkey",
  "tickets_site_fkey",
  "ticket_audit_events_ticket_fkey",
  "tickets_current_blocked_reason_requires_context",
];

for (const constraint of requiredConstraints) {
  if (!new RegExp(`constraint\\s+${constraint}\\b`, "i").test(migrationText)) {
    failures.push(`missing constraint: ${constraint}`);
  }
}

if (!/create or replace function public\.update_tickets_search_vector/i.test(migrationText)) {
  failures.push("missing global search helper function");
}

if (!/tickets_search_vector_idx/i.test(migrationText)) {
  failures.push("missing ticket search index for future card search");
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
