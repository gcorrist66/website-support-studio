import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import process from "node:process";

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, "supabase", "migrations");
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => path.join(migrationsDir, name));

if (migrationFiles.length === 0) {
  throw new Error("No migration files found under supabase/migrations");
}

const migrationText = migrationFiles.map((file) => fs.readFileSync(file, "utf8").toLowerCase()).join("\n\n");

const requiredFiles = ["phase2a_core_ticket_foundation", "phase2b_ticket_detail_tables"];
for (const requiredFile of requiredFiles) {
  if (!migrationFiles.some((file) => path.basename(file).includes(requiredFile))) {
    throw new Error(`missing required migration file containing ${requiredFile}`);
  }
}

const requiredTables = [
  "agencies",
  "clients",
  "sites",
  "tickets",
  "ticket_audit_events",
  "ticket_messages",
  "ticket_draft_replies",
  "ticket_approvals",
  "ticket_communications",
];

for (const table of requiredTables) {
  if (!new RegExp(`create table if not exists public\\.${table}\\b`, "i").test(migrationText)) {
    throw new Error(`missing table in migrations: ${table}`);
  }
}

const forbiddenTables = ["ticket_submitters"];
for (const table of forbiddenTables) {
  if (new RegExp(`\\bpublic\\.${table}\\b`, "i").test(migrationText)) {
    throw new Error(`forbidden table present: ${table}`);
  }
}

const requiredEnumValues = {
  ticket_status: [
    "received",
    "triaged",
    "reply_drafted",
    "awaiting_gary_approval",
    "approved_to_send",
    "sent_to_customer",
    "closed",
    "blocked",
  ],
  ticket_priority: ["low", "normal", "high", "critical"],
  identity_confidence: ["known", "claimed", "unknown"],
  blocked_reason: [
    "awaiting_customer",
    "awaiting_access",
    "awaiting_vendor",
    "duplicate_ticket",
    "misrouted",
    "internal_review",
    "other",
  ],
  actor_role: [
    "agency_admin",
    "client_admin",
    "site_user",
    "cs_agent",
    "gary_approver",
    "system",
  ],
  audit_event_type: [
    "request_received",
    "ticket_created",
    "ticket_triaged",
    "reply_drafted",
    "approval_requested",
    "approval_granted",
    "approval_rejected",
    "reply_sent",
    "ticket_blocked",
    "ticket_unblocked",
    "ticket_closed",
  ],
};

for (const [enumName, values] of Object.entries(requiredEnumValues)) {
  const enumDecl = new RegExp(`create type(?: if not exists)? public\\.${enumName}[\\s\\S]*?;`, "i").exec(migrationText)?.[0];
  if (!enumDecl) {
    throw new Error(`missing enum declaration: ${enumName}`);
  }

  for (const value of values) {
    const safeValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`'${safeValue}'`).test(enumDecl)) {
      throw new Error(`enum ${enumName} missing value ${value}`);
    }
  }
}

const requiredFks = [
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
  "ticket_messages_ticket_fkey",
  "ticket_draft_replies_ticket_fkey",
  "ticket_approvals_ticket_fkey",
  "ticket_communications_ticket_fkey",
];

for (const fk of requiredFks) {
  if (!new RegExp(`constraint\\s+${fk}\\b`, "i").test(migrationText)) {
    throw new Error(`missing expected foreign key ${fk}`);
  }
}

const requiredColumns = {
  tickets: ["agency_id", "client_id", "site_id", "blocked_reason", "blocked_from_status", "blocked_notes", "submitter_name", "submitter_email", "closure_note", "closed_at"],
  ticket_audit_events: ["metadata", "agency_id", "client_id", "site_id"],
};

for (const [table, cols] of Object.entries(requiredColumns)) {
  const createMatch = new RegExp(`create table if not exists public\\.${table}[\\s\\S]*?;`, "i").exec(migrationText)?.[0];
  if (!createMatch) {
    throw new Error(`missing create table text for ${table}`);
  }

  for (const col of cols) {
    if (!new RegExp(`\\b${col}\\b`).test(createMatch)) {
      throw new Error(`missing required column ${col} on ${table}`);
    }
  }
}

const requiredCommentFragments = [
  "global card search",
  "project/site",
  "future full-text",
  "explicit approval",
  "no external",
];

for (const fragment of requiredCommentFragments) {
  if (!new RegExp(fragment, "i").test(migrationText)) {
    throw new Error(`missing persistence compatibility comment: ${fragment}`);
  }
}

const srcRoot = path.join(projectRoot, "src");
const badRoutes = [
  path.join(srcRoot, "api"),
  path.join(srcRoot, "routes"),
  path.join(srcRoot, "server"),
];
for (const routePath of badRoutes) {
  if (fs.existsSync(routePath)) {
    throw new Error(`API route/server structure exists and is not allowed in this phase: ${routePath}`);
  }
}

const phase4TrackerPath = path.join(projectRoot, "PHASE4_GATE_TRACKER.md");
const phase4Text = fs.existsSync(phase4TrackerPath)
  ? fs.readFileSync(phase4TrackerPath, "utf8")
  : "";
const allowUiFiles = /Phase 4A|Phase 4B/.test(phase4Text);

const gitStatus = execSync("git status --short", { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.replace(/^.../, "").trim())
  .map((line) => line.split(" ")[0]);

const disallowedChangedSrc = gitStatus.filter((p) => p.startsWith("src/components") || p.startsWith("src/main.tsx") || p.startsWith("src/styles.css"));
if (!allowUiFiles && disallowedChangedSrc.length > 0 && disallowedChangedSrc.some((p) => !p.startsWith("src/persistence"))) {
  throw new Error("UI/presentation files changed during local persistence foundation phase");
}
if (allowUiFiles) {
  // UI files are now allowed after Phase 4A/4B because this phase intentionally ships local
  // operator-facing placeholders while keeping all persistence-scoped rules and forbidden integrations intact.
}

const sourceText = fs.readFileSync(
  path.join(projectRoot, "src", "domain", "ticketLifecycle.ts"),
  "utf8",
).toLowerCase();

const productionSignals = [
  new RegExp(String.raw`from\s+['"]@supabase\/supabase-js['"]`, "i"),
  /supabase\s*=\s*createclient\b/i,
  /\bcreateclient\s*\(/i,
  /\bsupabase_url\b/i,
  /\bsupabase_anon_key\b/i,
  /\bprocess\.env\.[a-z0-9_]*(?:supabase|SUPABASE)[a-z0-9_]*\b/i,
  /\bsupabase\.auth\b/i,
];

if (productionSignals.some((signal) => signal.test(sourceText))) {
  throw new Error("Unexpected production-oriented Supabase client/auth logic detected in domain layer");
}

console.log("PASS: phase2 persistence migration and governance checks completed");
