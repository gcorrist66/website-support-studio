// Phase 6T-DB — Guarded dev verification of localAuthMode adapter_principal mode (Supabase DEV only).
//
// Temporarily links a seeded dev operator to a SYNTHETIC auth_user_id, then resolves an
// OperatorSession through localAuthMode's adapter_principal path against the real dev rows, checks
// capability flags, and clears the link. No real auth users, no login, no RLS; fully reversible.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const projectRoot = process.cwd();
const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = ["dev", "development", "local"];

const SYNTHETIC_AUTH_USER_ID = "00000000-0000-4000-8000-00000000e001";
const SEED_EMAILS = ["agency.admin@wss-dev.test", "cs.agent@wss-dev.test", "gary.approver@wss-dev.test"];
const EMAIL_LIST = SEED_EMAILS.map((e) => `'${e}'`).join(",");
const LINK_TARGET = "cs.agent@wss-dev.test";
const NOW = "2026-06-08T12:00:00.000Z";
const FUTURE = "2999-01-01T00:00:00.000Z";

const filesToCompile = [
  "src/auth/authTypes.ts",
  "src/auth/authGuards.ts",
  "src/persistence/operatorTypes.ts",
  "src/persistence/operatorMappers.ts",
  "src/auth/operatorSessionResolver.ts",
  "src/auth/operatorIdentityLinking.ts",
  "src/auth/operatorCapabilities.ts",
  "src/auth/supabaseAuthSessionAdapter.ts",
  "src/auth/devOperatorSession.ts",
  "src/auth/localAuthMode.ts",
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
  assert(process.env.WSS_ALLOW_SUPABASE_VALIDATION === "dev", "Set WSS_ALLOW_SUPABASE_VALIDATION=dev.");
  assert(process.env.WSS_SUPABASE_PROJECT_REF === DEV_PROJECT_REF, `Set WSS_SUPABASE_PROJECT_REF=${DEV_PROJECT_REF}.`);
  const env = process.env.WSS_SUPABASE_ENVIRONMENT;
  assert(env && ALLOWED_NON_PRODUCTION_ENVS.includes(String(env).toLowerCase()), "Set WSS_SUPABASE_ENVIRONMENT=dev|development|local.");
  const configPath = path.join(projectRoot, ".supabase", "config.toml");
  assert(fs.existsSync(configPath) && fs.readFileSync(configPath, "utf8").includes(DEV_PROJECT_REF), "Linked Supabase project is not the expected WSS dev project.");
}

function runSqlRaw(sql) {
  return execFileSync("supabase", ["db", "query", "--linked", "--output", "json", sql], { encoding: "utf8", timeout: 120000 });
}

function queryRows(sql) {
  const out = runSqlRaw(sql);
  const start = out.indexOf("{");
  const end = out.lastIndexOf("}");
  assert(start >= 0 && end >= 0, "unexpected supabase db query output");
  const parsed = JSON.parse(out.slice(start, end + 1));
  return Array.isArray(parsed.rows) ? parsed.rows : [];
}

function clearLinks() {
  try {
    runSqlRaw(`update public.operators set auth_user_id = null where email in (${EMAIL_LIST});`);
  } catch {
    // best-effort cleanup
  }
}

function transpile() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-local-auth-mode-db-"));
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
  const out = {};
  for (const [dir, name] of [
    ["auth", "authTypes"],
    ["auth", "authGuards"],
    ["persistence", "operatorTypes"],
    ["persistence", "operatorMappers"],
    ["auth", "operatorSessionResolver"],
    ["auth", "operatorIdentityLinking"],
    ["auth", "operatorCapabilities"],
    ["auth", "supabaseAuthSessionAdapter"],
    ["auth", "devOperatorSession"],
    ["auth", "localAuthMode"],
  ]) {
    Object.assign(out, await import(pathToFileURL(path.join(targetRoot, dir, `${name}.js`)).href));
  }
  return out;
}

async function main() {
  let tmpDir;
  try {
    assertDevGuard();

    const seed = queryRows(`select email from public.operators where email in (${EMAIL_LIST});`);
    assert(seed.length === 3, `expected 3 seeded dev operators, found ${seed.length}`);
    mark("seeded operators exist", true, "3 dev operators present");

    clearLinks();
    runSqlRaw(`update public.operators set auth_user_id = '${SYNTHETIC_AUTH_USER_ID}' where email = '${LINK_TARGET}';`);

    const dbRows = queryRows(
      `select id, auth_user_id, agency_id, email, display_name, role, status, client_ids, site_ids, last_seen_at, created_at, updated_at from public.operators where email in (${EMAIL_LIST});`,
    );
    const operatorRows = dbRows.map((r) => ({
      id: r.id,
      auth_user_id: r.auth_user_id ?? null,
      agency_id: r.agency_id,
      email: r.email,
      display_name: r.display_name,
      role: r.role,
      status: r.status,
      client_ids: r.client_ids ?? null,
      site_ids: r.site_ids ?? null,
      last_seen_at: r.last_seen_at ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    ({ tmpDir } = transpile());
    const rt = await loadModules(path.join(tmpDir, "src"));

    // localAuthMode adapter_principal mode against the real dev rows.
    const state = rt.createAdapterPrincipalAuthState(
      { id: SYNTHETIC_AUTH_USER_ID, email: "synthetic@wss-dev.test", expiresAt: FUTURE },
      operatorRows,
      { nowIso: NOW },
    );
    assert(state.mode === "adapter_principal", "state is adapter_principal mode");
    const session = rt.getActiveOperatorSession(state);
    assert(session !== null && session.email === LINK_TARGET && session.role === "cs_agent", `adapter mode should resolve ${LINK_TARGET} (reason: ${state.adapterResult?.reason})`);
    mark("localAuthMode adapter mode resolves dev session", true, `${LINK_TARGET} resolved via auth_user_id through localAuthMode`);

    const flags = rt.getActiveCapabilityFlags(state);
    assert(flags.canSeeCreateTicket === true && flags.canSeeCloseTicket === true && flags.canSeeApproveReply === false, "cs_agent capability flags correct");
    mark("capability flags correct", true, "cs_agent create/close yes; approve no");

    // No operator rows were mutated/linked by the adapter mode.
    assert(operatorRows.filter((r) => r.auth_user_id === SYNTHETIC_AUTH_USER_ID).length === 1, "only the DB-linked operator carries the synthetic id");
    mark("adapter mode wrote nothing", true, "resolution did not link/mutate any operator");

    // Cleanup + verify.
    clearLinks();
    const afterClear = queryRows(`select count(*)::int as linked from public.operators where email in (${EMAIL_LIST}) and auth_user_id is not null;`);
    assert(afterClear[0]?.linked === 0, "links cleared after cleanup");
    const stillThree = queryRows(`select count(*)::int as c from public.operators where email in (${EMAIL_LIST});`);
    assert(stillThree[0]?.c === 3, "operator rows preserved");
    mark("cleanup clears link and preserves rows", true, "auth_user_id cleared; 3 rows intact");

    const rls = queryRows("select relrowsecurity as rls from pg_class where relname='operators' and relnamespace='public'::regnamespace;");
    assert(rls[0] && rls[0].rls === false, "RLS must remain disabled");
    mark("RLS remains disabled", true, "operators.relrowsecurity = false");

    mark("local-auth-mode-db validation", true, "dev localAuthMode adapter resolution verified; no real auth users; no RLS; cleaned up");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local-auth-mode-db validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    clearLinks();
    process.exit(1);
  } finally {
    clearLinks();
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

main();
