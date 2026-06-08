// Dev-only SHAPE validation for the proposed Phase 6G operator seed.
// This script inserts NOTHING into any database. It only constructs the proposed dev seed
// operator inserts and validates their shape + capability mapping in memory.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();

const filesToCompile = [
  "src/auth/authTypes.ts",
  "src/auth/authGuards.ts",
  "src/persistence/operatorTypes.ts",
  "src/persistence/operatorMappers.ts",
];

const checks = [];
const failures = [];

function mark(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) failures.push(`${name}: ${detail}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function transpile() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-operator-seed-validate-"));
  const targetRoot = path.join(tmpDir, "src");
  for (const file of filesToCompile) {
    const sourceText = fs.readFileSync(path.join(projectRoot, file), "utf8");
    const output = ts.transpileModule(sourceText, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        strict: true,
        esModuleInterop: true,
      },
      fileName: path.basename(file),
      reportDiagnostics: true,
    });
    if (output.diagnostics && output.diagnostics.length > 0) {
      throw new Error(`transpile failure for ${file}: ${output.diagnostics[0].messageText}`);
    }
    const rel = file.replace(/^src\//, "").replace(/\.ts$/, ".js");
    const outPath = path.join(targetRoot, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output.outputText, "utf8");
  }
  return { tmpDir, targetRoot };
}

async function load(targetRoot) {
  const authTypes = await import(pathToFileURL(path.join(targetRoot, "auth", "authTypes.js")).href);
  const authGuards = await import(pathToFileURL(path.join(targetRoot, "auth", "authGuards.js")).href);
  const operatorTypes = await import(pathToFileURL(path.join(targetRoot, "persistence", "operatorTypes.js")).href);
  const operatorMappers = await import(pathToFileURL(path.join(targetRoot, "persistence", "operatorMappers.js")).href);
  return { ...authTypes, ...authGuards, ...operatorTypes, ...operatorMappers };
}

// A clearly synthetic, non-production dev agency placeholder. Never a real id.
const DEV_AGENCY_ID = "00000000-0000-4000-8000-000000000000";
const DEV_EMAIL_DOMAIN = "@wss-dev.test";
const NOW = "2026-06-08T00:00:00.000Z";

function proposedSeed(OperatorRole) {
  return [
    { display_name: "Gary Approver", role: OperatorRole.GARY_APPROVER, email: `gary.approver${DEV_EMAIL_DOMAIN}` },
    { display_name: "CS Agent (dev)", role: OperatorRole.CS_AGENT, email: `cs.agent${DEV_EMAIL_DOMAIN}` },
    { display_name: "Agency Admin (dev)", role: OperatorRole.AGENCY_ADMIN, email: `agency.admin${DEV_EMAIL_DOMAIN}` },
  ].map((o) => ({
    agency_id: DEV_AGENCY_ID,
    email: o.email,
    display_name: o.display_name,
    role: o.role,
    status: "active",
    // auth_user_id intentionally omitted/null — no Supabase Auth linkage yet.
  }));
}

function runSeedChecks(runtime) {
  const {
    OperatorRole,
    validateOperatorInsert,
    mapOperatorRowToSession,
    normalizeOperatorEmail,
    canApproveReply,
    canRejectReply,
    canCreateTicket,
    canSendReply,
    canCloseTicket,
  } = runtime;

  const seed = proposedSeed(OperatorRole);
  assert(seed.length === 3, "seed should contain exactly 3 operators");

  // Each insert is shape-valid and carries no auth linkage / no secrets.
  for (const insert of seed) {
    const result = validateOperatorInsert(insert);
    assert(result.ok, `seed insert invalid (${insert.email}): ${result.errors.join(", ")}`);
    assert(insert.email === normalizeOperatorEmail(insert.email), `seed email must be normalized: ${insert.email}`);
    assert(insert.email.endsWith(DEV_EMAIL_DOMAIN), `seed email must use dev domain: ${insert.email}`);
    assert(insert.auth_user_id === undefined || insert.auth_user_id === null, "seed must not link an auth user");
    assert(insert.status === "active", "seed operators are active");
    assert(insert.agency_id === DEV_AGENCY_ID, "seed uses the synthetic dev agency placeholder");
  }
  mark("seed inserts are shape-valid", true, "3 dev operators validate, normalized emails, no auth linkage");

  // Required roles are present.
  const roles = seed.map((s) => s.role).sort();
  assert(JSON.stringify(roles) === JSON.stringify(["agency_admin", "cs_agent", "gary_approver"]), "seed must cover all three roles");
  mark("seed covers gary_approver, cs_agent, agency_admin", true, roles.join("|"));

  // Each seed maps (as a would-be active row) to a correctly-capable session.
  const asRow = (insert, id) => ({
    id,
    auth_user_id: null,
    agency_id: insert.agency_id,
    email: insert.email,
    display_name: insert.display_name,
    role: insert.role,
    status: "active",
    client_ids: null,
    site_ids: null,
    last_seen_at: null,
    created_at: NOW,
    updated_at: NOW,
  });

  const gary = mapOperatorRowToSession(asRow(seed[0], "seed-gary"), { nowIso: NOW });
  const cs = mapOperatorRowToSession(asRow(seed[1], "seed-cs"), { nowIso: NOW });
  const admin = mapOperatorRowToSession(asRow(seed[2], "seed-admin"), { nowIso: NOW });
  assert(gary && cs && admin, "all active seed rows should map to sessions");
  assert(canApproveReply(gary, NOW) && canRejectReply(gary, NOW), "Gary Approver seed can approve/reject");
  assert(canCreateTicket(cs, NOW) && canSendReply(cs, NOW) && canCloseTicket(cs, NOW), "CS Agent seed can create/send/close");
  assert(canApproveReply(cs, NOW) === false, "CS Agent seed cannot approve");
  assert(canApproveReply(admin, NOW) && canCreateTicket(admin, NOW), "Agency Admin seed is full operator");
  mark("seed sessions have correct capabilities", true, "gary approve/reject; cs create/send/close; admin full");

  mark("no database insert performed", true, "this validator inserts nothing; shape-only");
}

async function main() {
  try {
    const { tmpDir, targetRoot } = transpile();
    try {
      const runtime = await load(targetRoot);
      runSeedChecks(runtime);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    mark("local operator-seed validation", true, "dev seed shapes and capabilities validated (no inserts)");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local operator-seed validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
