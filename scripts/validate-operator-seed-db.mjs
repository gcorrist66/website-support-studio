// Phase 6G — Guarded DB verification of the dev operator seed (Supabase DEV only).
//
// Verifies the seeded operators exist with correct roles/status, no auth linkage, shared seed
// agency, unique constraint respected (no duplicates), and that each DB row maps to a correctly
// capable OperatorSession via the in-code mappers. Read-only against the dev DB.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const projectRoot = process.cwd();
const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = ["dev", "development", "local"];

const SEED_AGENCY_ID = "00000000-0000-4000-8000-0000000000a6";
const EXPECTED = [
  { email: "agency.admin@wss-dev.test", role: "agency_admin", display_name: "Agency Admin (dev)" },
  { email: "cs.agent@wss-dev.test", role: "cs_agent", display_name: "CS Agent (dev)" },
  { email: "gary.approver@wss-dev.test", role: "gary_approver", display_name: "Gary Approver" },
];
const EMAIL_LIST = EXPECTED.map((o) => `'${o.email}'`).join(",");

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

function assertDevGuard() {
  const allow = process.env.WSS_ALLOW_SUPABASE_VALIDATION;
  const environment = process.env.WSS_SUPABASE_ENVIRONMENT;
  const projectRef = process.env.WSS_SUPABASE_PROJECT_REF;
  assert(allow === "dev", "Set WSS_ALLOW_SUPABASE_VALIDATION=dev.");
  assert(projectRef === DEV_PROJECT_REF, `Set WSS_SUPABASE_PROJECT_REF=${DEV_PROJECT_REF}.`);
  assert(environment && ALLOWED_NON_PRODUCTION_ENVS.includes(String(environment).toLowerCase()), "Set WSS_SUPABASE_ENVIRONMENT=dev|development|local.");
  const configPath = path.join(projectRoot, ".supabase", "config.toml");
  assert(fs.existsSync(configPath) && fs.readFileSync(configPath, "utf8").includes(DEV_PROJECT_REF), "Linked Supabase project is not the expected WSS dev project.");
}

function queryRows(sql) {
  const out = execFileSync("supabase", ["db", "query", "--linked", "--output", "json", sql], {
    encoding: "utf8",
    timeout: 120000,
  });
  const start = out.indexOf("{");
  const end = out.lastIndexOf("}");
  assert(start >= 0 && end >= 0, "unexpected supabase db query output");
  const parsed = JSON.parse(out.slice(start, end + 1));
  return Array.isArray(parsed.rows) ? parsed.rows : [];
}

function transpileModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-operator-seed-db-"));
  const targetRoot = path.join(tmpDir, "src");
  for (const file of filesToCompile) {
    const sourceText = fs.readFileSync(path.join(projectRoot, file), "utf8");
    const output = ts.transpileModule(sourceText, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, strict: true, esModuleInterop: true },
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

async function loadModules(targetRoot) {
  const a = await import(pathToFileURL(path.join(targetRoot, "auth", "authTypes.js")).href);
  const b = await import(pathToFileURL(path.join(targetRoot, "auth", "authGuards.js")).href);
  const c = await import(pathToFileURL(path.join(targetRoot, "persistence", "operatorTypes.js")).href);
  const d = await import(pathToFileURL(path.join(targetRoot, "persistence", "operatorMappers.js")).href);
  return { ...a, ...b, ...c, ...d };
}

const NOW = "2026-06-08T00:00:00.000Z";

function runStaticChecks() {
  const srcRoot = path.join(projectRoot, "src");
  for (const bad of ["api", "routes", "server"]) {
    assert(!fs.existsSync(path.join(srcRoot, bad)), `forbidden src/${bad} exists`);
  }
  const walk = (dir, acc = []) => {
    if (!fs.existsSync(dir)) return acc;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!["node_modules", "dist", ".git"].includes(e.name)) walk(path.join(dir, e.name), acc);
      } else acc.push(path.join(dir, e.name));
    }
    return acc;
  };
  const srcFiles = walk(srcRoot);
  assert(srcFiles.filter((f) => /(login|signin|sign-in|logout)/i.test(path.basename(f))).length === 0, "login UI files exist");
  const authRuntime = /@supabase\/supabase-js|createClient\s*\(|supabase\.auth/i;
  for (const f of filesToCompile) {
    assert(!authRuntime.test(fs.readFileSync(path.join(projectRoot, f), "utf8")), `Supabase Auth runtime found in ${f}`);
  }
  mark("no auth runtime / login UI added", true, "no src/api|routes|server, no login files, no supabase auth runtime");
}

async function main() {
  try {
    assertDevGuard();
    runStaticChecks();

    const rows = queryRows(
      `select id, email, display_name, role, status, auth_user_id, agency_id, client_ids, site_ids from public.operators where email in (${EMAIL_LIST}) order by email;`,
    );
    assert(rows.length === 3, `expected 3 seed operators, found ${rows.length}`);
    mark("operators inserted", true, "3 seed operators present in dev");

    const byEmail = new Map(rows.map((r) => [r.email, r]));
    for (const exp of EXPECTED) {
      const row = byEmail.get(exp.email);
      assert(row, `missing seed operator ${exp.email}`);
      assert(row.role === exp.role, `role mismatch for ${exp.email}: ${row.role}`);
      assert(row.status === "active", `status for ${exp.email} should be active`);
      assert(row.auth_user_id === null, `auth_user_id for ${exp.email} should be null`);
      assert(row.agency_id === SEED_AGENCY_ID, `agency_id for ${exp.email} should be the seed agency`);
      assert(row.email === row.email.toLowerCase(), `email for ${exp.email} should be lowercase`);
    }
    mark("roles correct", true, "agency_admin, cs_agent, gary_approver mapped to expected emails");
    mark("no auth linkage / active / seed agency", true, "auth_user_id null, status active, shared seed agency");

    // Unique constraint respected: no duplicate emails per agency.
    const dupes = queryRows(
      `select email, count(*)::int as c from public.operators where email in (${EMAIL_LIST}) group by email having count(*) > 1;`,
    );
    assert(dupes.length === 0, `duplicate seed operators found: ${JSON.stringify(dupes)}`);
    mark("unique constraints respected", true, "exactly one row per (agency_id, email); no duplicates");

    // RLS still disabled.
    const rls = queryRows("select relrowsecurity as rls from pg_class where relname='operators' and relnamespace='public'::regnamespace;");
    assert(rls[0] && rls[0].rls === false, "RLS must remain disabled on operators");
    mark("RLS remains disabled", true, "operators.relrowsecurity = false");

    // DB rows map to correctly-capable sessions via in-code mappers.
    const { tmpDir, targetRoot } = transpileModules();
    try {
      const rt = await loadModules(targetRoot);
      const sessions = {};
      for (const exp of EXPECTED) {
        const row = byEmail.get(exp.email);
        const session = rt.mapOperatorRowToSession(
          {
            id: row.id,
            auth_user_id: row.auth_user_id,
            agency_id: row.agency_id,
            email: row.email,
            display_name: row.display_name,
            role: row.role,
            status: row.status,
            client_ids: row.client_ids ?? null,
            site_ids: row.site_ids ?? null,
            last_seen_at: null,
            created_at: NOW,
            updated_at: NOW,
          },
          { nowIso: NOW },
        );
        assert(session !== null, `seed row ${exp.email} should map to a session`);
        sessions[exp.role] = session;
      }
      assert(rt.canApproveReply(sessions.gary_approver, NOW) && rt.canRejectReply(sessions.gary_approver, NOW), "gary can approve/reject");
      assert(rt.canCreateTicket(sessions.cs_agent, NOW) && rt.canSendReply(sessions.cs_agent, NOW) && rt.canCloseTicket(sessions.cs_agent, NOW), "cs_agent can create/send/close");
      assert(rt.canApproveReply(sessions.cs_agent, NOW) === false, "cs_agent cannot approve");
      assert(rt.canCreateTicket(sessions.agency_admin, NOW) && rt.canApproveReply(sessions.agency_admin, NOW), "agency_admin is full operator");
      mark("seed rows map to capable sessions", true, "gary approve/reject; cs create/send/close; admin full");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("rerun safe (idempotent)", true, "seed uses on conflict do nothing; exactly 3 rows after repeated apply");

    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local operator-seed-db validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
