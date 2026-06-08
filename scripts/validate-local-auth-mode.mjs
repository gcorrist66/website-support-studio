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

function transpileModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-local-auth-mode-"));
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

function runModeChecks(rt) {
  const {
    createDevRoleSwitcherAuthState,
    createAdapterPrincipalAuthState,
    getActiveOperatorSession,
    getActiveCapabilityFlags,
    isAdapterModeAvailable,
    describeAuthMode,
    getOperatorCapabilityFlags,
    DEV_ADAPTER_PRINCIPAL_PRESETS,
    DEV_PREVIEW_OPERATOR_ROWS,
  } = rt;

  // dev_role_switcher returns expected sessions.
  const cs = createDevRoleSwitcherAuthState("cs_agent");
  const gary = createDevRoleSwitcherAuthState("gary_approver");
  const admin = createDevRoleSwitcherAuthState("agency_admin");
  const none = createDevRoleSwitcherAuthState("none");
  assert(cs.mode === "dev_role_switcher" && getActiveOperatorSession(cs)?.role === "cs_agent", "cs_agent dev session");
  assert(getActiveOperatorSession(gary)?.role === "gary_approver", "gary dev session");
  assert(getActiveOperatorSession(admin)?.role === "agency_admin", "admin dev session");
  assert(getActiveOperatorSession(none) === null, "none → no session");
  assert(getActiveCapabilityFlags(cs).canSeeCreateTicket === true && getActiveCapabilityFlags(cs).canSeeApproveReply === false, "cs flags");
  assert(getActiveCapabilityFlags(gary).canSeeApproveReply === true && getActiveCapabilityFlags(gary).canSeeCreateTicket === false, "gary flags");
  mark("dev_role_switcher mode returns expected sessions", true, "CS Agent / Gary / Agency Admin / none resolve correctly");

  // adapter_principal mode uses the adapter to resolve from a supplied principal.
  const preset = DEV_ADAPTER_PRINCIPAL_PRESETS.find((p) => p.role === "gary_approver");
  const adapterGary = createAdapterPrincipalAuthState({ id: preset.principalId }, DEV_PREVIEW_OPERATOR_ROWS);
  assert(adapterGary.mode === "adapter_principal", "adapter mode tag");
  assert(adapterGary.adapterResult && adapterGary.adapterResult.authenticated === true, "adapter result authenticated");
  assert(getActiveOperatorSession(adapterGary)?.role === "gary_approver", "adapter resolves gary session");
  assert(getActiveCapabilityFlags(adapterGary).canSeeApproveReply === true, "adapter gary capability flag");
  mark("adapter_principal mode uses resolveOperatorSessionFromAuthPrincipal", true, "preset principal resolves to the linked operator session");

  // adapter mode rejects email-only identity.
  const emailOnly = createAdapterPrincipalAuthState({ id: "", email: "cs.agent@wss-dev.test" }, DEV_PREVIEW_OPERATOR_ROWS);
  assert(getActiveOperatorSession(emailOnly) === null && emailOnly.adapterResult.authenticated === false, "email-only rejected");
  mark("adapter mode rejects email-only identity", true, "email is never a lookup key");

  // adapter mode without principal returns unauthenticated.
  const noPrincipal = createAdapterPrincipalAuthState(null, DEV_PREVIEW_OPERATOR_ROWS);
  assert(getActiveOperatorSession(noPrincipal) === null && noPrincipal.adapterResult.reason === "auth_principal_missing", "no principal → none");
  mark("adapter mode without principal returns unauthenticated", true, "null principal → no active session");

  // adapter mode with unlinked principal returns unauthenticated.
  const unlinked = createAdapterPrincipalAuthState({ id: "99999999-9999-4999-8999-999999999999" }, DEV_PREVIEW_OPERATOR_ROWS);
  assert(getActiveOperatorSession(unlinked) === null && unlinked.adapterResult.reason === "no_active_operator_for_principal", "unlinked → none");
  mark("adapter mode with unlinked principal returns unauthenticated", true, "principal with no linked operator → no session");

  // adapter mode does not write/link operators (input rows unchanged).
  const before = DEV_PREVIEW_OPERATOR_ROWS.map((r) => `${r.id}:${r.auth_user_id}`).join("|");
  createAdapterPrincipalAuthState({ id: preset.principalId }, DEV_PREVIEW_OPERATOR_ROWS);
  const after = DEV_PREVIEW_OPERATOR_ROWS.map((r) => `${r.id}:${r.auth_user_id}`).join("|");
  assert(before === after, "adapter mode must not mutate/link operator rows");
  mark("adapter mode does not write/link operators", true, "operator rows unchanged after adapter resolution");

  // capability flags derive from active session.
  assert(JSON.stringify(getActiveCapabilityFlags(adapterGary)) === JSON.stringify(getOperatorCapabilityFlags(getActiveOperatorSession(adapterGary))), "flags derive from session");
  mark("capability flags derive from active session", true, "getActiveCapabilityFlags == getOperatorCapabilityFlags(activeSession)");

  // helper coverage
  assert(isAdapterModeAvailable(DEV_PREVIEW_OPERATOR_ROWS) === true && isAdapterModeAvailable([]) === false, "isAdapterModeAvailable");
  assert(describeAuthMode("adapter_principal") === "Adapter Principal Preview" && describeAuthMode("dev_role_switcher") === "Dev Role Switcher", "describeAuthMode labels");
  mark("mode helpers behave correctly", true, "isAdapterModeAvailable + describeAuthMode");
}

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

  assert(srcFiles.filter((f) => /[\\/](app|pages|routes)[\\/]/.test(f.replaceAll("\\", "/"))).length === 0, "route-like paths exist");
  mark("no API routes exist", true, "no src/api|routes|server, no app/pages/routes");
  assert(srcFiles.filter((f) => /middleware\.(t|j)sx?$/.test(path.basename(f))).length === 0, "route middleware files exist");
  mark("no route middleware exists", true, "no middleware.* files present");

  const rls = /enable\s+row\s+level\s+security/i;
  for (const f of srcFiles) {
    assert(!rls.test(fs.readFileSync(f, "utf8")), `RLS enablement found in ${f}`);
  }
  mark("no RLS enabled", true, "no enable-row-level-security in src");

  // localAuthMode: no DB write, no linking, no supabase client, no service-role.
  const lam = fs.readFileSync(path.join(srcRoot, "auth", "localAuthMode.ts"), "utf8");
  assert(!/insert\s*\(|update\s*\(|upsert\s*\(|delete\s*\(|linkOperatorToAuthUser|@supabase\/[a-z-]+|createClient\s*\(|supabase\.auth/i.test(lam), "localAuthMode must not write/link/use supabase runtime");
  assert(!/service_role|sb_secret_|SUPABASE_SERVICE_ROLE/.test(lam), "service-role in localAuthMode");
  mark("no service-role key usage", true, "localAuthMode has no DB write/link/supabase-runtime/service-role");

  // AppShell UI checks.
  const appShell = fs.readFileSync(path.join(srcRoot, "components", "shell", "AppShell.tsx"), "utf8");
  assert(/Development Auth Mode/.test(appShell), "AppShell must contain 'Development Auth Mode'");
  mark("UI contains 'Development Auth Mode'", true, "development auth mode switch present in AppShell");
  assert(!/\blogin\b|\blogout\b|\bsignup\b|sign[\s-]up|\bpassword\b|magic[\s-]?link/i.test(appShell), "AppShell contains forbidden login/signup/password/magic wording");
  mark("UI contains no login/signup/password/magic-link wording", true, "no login/signup/password/magic-link copy in AppShell");
}

async function main() {
  try {
    runStaticChecks();
    const { tmpDir, targetRoot } = transpileModules();
    try {
      const rt = await loadModules(targetRoot);
      runModeChecks(rt);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    mark("local-auth-mode validation", true, "mode abstraction behavior + UI/static safety passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local-auth-mode validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
