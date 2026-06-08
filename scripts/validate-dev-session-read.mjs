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
  "src/auth/supabaseAuthClientWrapper.ts",
  "src/auth/authPipeline.ts",
  "src/auth/devSupabaseSessionRead.ts",
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-dev-session-read-"));
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
    ["auth", "supabaseAuthClientWrapper"],
    ["auth", "authPipeline"],
    ["auth", "devSupabaseSessionRead"],
  ]) {
    Object.assign(out, await import(pathToFileURL(path.join(targetRoot, dir, `${name}.js`)).href));
  }
  return out;
}

const NOW = "2026-06-08T12:00:00.000Z";
const FUTURE = "2999-01-01T00:00:00.000Z";
const UUID_A = "11111111-1111-4111-8111-111111111111";

function row(role, authUserId, overrides = {}) {
  return {
    id: `op-${role}`,
    auth_user_id: authUserId,
    agency_id: "AG-1",
    email: `${role}@agency.internal`,
    display_name: `Operator ${role}`,
    role,
    status: "active",
    client_ids: null,
    site_ids: null,
    last_seen_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function runChecks(rt) {
  const {
    OperatorRole,
    createDisabledSessionReadState,
    createSyntheticSessionReadState,
    createExistingSessionShapeReadState,
    resolveDevSessionReadPipeline,
    describeDevSessionReadState,
    DEV_SESSION_READ_MODE_OPTIONS,
  } = rt;

  const opts = { nowIso: NOW };
  const linkedRows = [row(OperatorRole.GARY_APPROVER, UUID_A)];
  const unlinkedRows = [row(OperatorRole.CS_AGENT, null)];

  // disabled mode returns no session
  const disabled = createDisabledSessionReadState();
  assert(disabled.mode === "disabled" && disabled.session === null && disabled.principal === null && disabled.adapterResult === null, "disabled returns nothing");
  assert(Object.values(disabled.capabilityFlags).every((v) => v === false), "disabled has no capabilities");
  mark("disabled mode returns no session", true, "no session/principal/operator/flags");

  // synthetic session produces principal
  const synthLinked = createSyntheticSessionReadState({ id: UUID_A, expiresAtIso: FUTURE }, linkedRows, opts);
  assert(synthLinked.principal && synthLinked.principal.id === UUID_A, "synthetic session yields a principal");
  mark("synthetic session produces principal", true, "principal extracted from synthetic session");

  // existing session shape produces principal
  const existing = createExistingSessionShapeReadState({ user: { id: UUID_A }, expires_at: 32503680000 }, linkedRows, opts);
  assert(existing.principal && existing.principal.id === UUID_A, "existing session shape yields a principal");
  mark("existing session shape produces principal", true, "principal extracted from plain session shape");

  // pipeline consumes the session read result (operator session resolves for a linked principal)
  assert(synthLinked.adapterResult && synthLinked.adapterResult.authenticated === true && synthLinked.adapterResult.session?.role === "gary_approver", "synthetic linked → operator session");
  assert(existing.adapterResult && existing.adapterResult.session?.role === "gary_approver", "existing linked → operator session");
  assert(synthLinked.capabilityFlags.canSeeApproveReply === true && synthLinked.capabilityFlags.canSeeCreateTicket === false, "gary capability flags from session read");
  mark("pipeline consumes session read result", true, "linked synthetic/existing session → operator session + flags");

  // unlinked principal returns no operator session
  const synthUnlinked = createSyntheticSessionReadState({ id: UUID_A, expiresAtIso: FUTURE }, unlinkedRows, opts);
  assert(synthUnlinked.principal && synthUnlinked.adapterResult?.session === null, "unlinked principal → no operator session");
  assert(Object.values(synthUnlinked.capabilityFlags).every((v) => v === false), "unlinked → no capabilities");
  mark("unlinked principal returns no operator session", true, "principal extracted but no linked operator → null session");

  // linked synthetic operator resolves when provided a local linked row set
  const csRows = [row(OperatorRole.CS_AGENT, UUID_A)];
  const csState = createSyntheticSessionReadState({ id: UUID_A, expiresAtIso: FUTURE }, csRows, opts);
  assert(csState.adapterResult?.session?.role === "cs_agent" && csState.capabilityFlags.canSeeCreateTicket === true && csState.capabilityFlags.canSeeApproveReply === false, "cs linked resolves with cs capabilities");
  mark("linked synthetic operator resolves", true, "cs_agent linked synthetic session resolves with correct flags");

  // resolveDevSessionReadPipeline directly + describe + options
  const direct = resolveDevSessionReadPipeline({ user: { id: UUID_A }, expires_at: 32503680000 }, linkedRows, opts);
  assert(direct.principal?.id === UUID_A && direct.adapterResult.session?.role === "gary_approver", "resolveDevSessionReadPipeline resolves");
  assert(describeDevSessionReadState("synthetic_session") === "Synthetic Session" && describeDevSessionReadState("disabled") === "Disabled", "describe labels");
  assert(Array.isArray(DEV_SESSION_READ_MODE_OPTIONS) && DEV_SESSION_READ_MODE_OPTIONS.length === 3, "3 mode options");

  // no DB writes / no mutation: linked rows unchanged
  const snap = JSON.stringify(linkedRows);
  createSyntheticSessionReadState({ id: UUID_A, expiresAtIso: FUTURE }, linkedRows, opts);
  assert(JSON.stringify(linkedRows) === snap, "session read must not mutate operator rows");
  mark("no DB writes / no mutation", true, "read-only; operator rows unchanged");
}

function runStaticChecks() {
  const srcRoot = path.join(projectRoot, "src");
  const walk = (dir, acc = []) => {
    if (!fs.existsSync(dir)) return acc;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!["node_modules", "dist", ".git"].includes(e.name)) walk(path.join(dir, e.name), acc);
      } else {
        acc.push(path.join(dir, e.name));
      }
    }
    return acc;
  };
  const srcFiles = walk(srcRoot);

  // The dev session-read module: no auth creation / sign-in flows / redirects / writes / supabase runtime.
  const moduleText = fs.readFileSync(path.join(srcRoot, "auth", "devSupabaseSessionRead.ts"), "utf8");
  const forbidden = /signInWith|signIn\s*\(|signUp\s*\(|signOut\s*\(|resetPasswordForEmail|magic[\s_-]?link|verifyOtp|window\.location|router\.(push|replace)|\.redirect\s*\(|admin\.createUser|createUser\s*\(|insert\s*\(|update\s*\(|upsert\s*\(|delete\s*\(|@supabase\/[a-z-]+|createClient\s*\(|supabase\.auth/i;
  assert(!forbidden.test(moduleText), "dev session-read module contains a forbidden auth/redirect/write pattern");
  assert(!/sb_secret_[A-Za-z0-9._-]{12,}|SUPABASE_SERVICE_ROLE_KEY|WSS_SUPABASE_SERVICE_ROLE/i.test(moduleText), "service-role usage in dev session-read module");
  mark("no auth creation / sign-in / redirect / writes in module", true, "session-read module is read-only, no auth flows or redirects");
  mark("no service-role usage", true, "no service-role key/env in dev session-read module");

  // No login UI / signup / password / magic-link wording in the dev session-read module + UI card.
  const appShell = fs.readFileSync(path.join(srcRoot, "components", "shell", "AppShell.tsx"), "utf8");
  const wordCheck = /\bsign[\s-]?up\b|signup|\bpassword\b|magic[\s_-]?link/i;
  assert(!wordCheck.test(moduleText), "forbidden signup/password/magic wording in module");
  assert(!/\bsign[\s-]?up\b|signup|\bpassword\b|magic[\s_-]?link/i.test(appShell), "forbidden signup/password/magic wording in AppShell");
  mark("no signup/password/magic-link wording", true, "no sign-up/password/magic-link wording in module or AppShell");

  // No real login UI screen files.
  const loginLike = srcFiles.filter((f) => /(^|[^a-z])(login|signin|sign-in|signup|sign-up|logout)([^a-z]|$)/i.test(path.basename(f)));
  assert(loginLike.length === 0, `login UI screen files exist: ${loginLike.join(", ")}`);
  mark("no login UI", true, "no real Login/SignIn/SignUp/Logout screen files");

  // No route middleware / API routes / RLS.
  assert(srcFiles.filter((f) => /middleware\.(t|j)sx?$/.test(path.basename(f))).length === 0, "route middleware files exist");
  mark("no route middleware", true, "no middleware.* files");
  for (const bad of ["api", "routes", "server"]) {
    assert(!fs.existsSync(path.join(srcRoot, bad)), `forbidden src/${bad} exists`);
  }
  assert(srcFiles.filter((f) => /[\\/](app|pages|routes)[\\/]/.test(f.replaceAll("\\", "/"))).length === 0, "route-like paths exist");
  mark("no API routes", true, "no src/api|routes|server, no app/pages/routes");
  const rls = /enable\s+row\s+level\s+security/i;
  for (const f of srcFiles) {
    assert(!rls.test(fs.readFileSync(f, "utf8")), `RLS enablement found in ${f}`);
  }
  mark("no RLS", true, "no enable-row-level-security in src");

  // No auth redirects in the UI card (redirect/navigation calls). Prose mention of "no redirect" is fine.
  const redirectCalls = /window\.location\s*=|location\.assign\s*\(|location\.replace\s*\(|router\.(push|replace)\s*\(/i;
  assert(!redirectCalls.test(appShell), "auth redirect/navigation call in AppShell");
  mark("no auth redirects", true, "no navigation/redirect calls introduced in the UI");
}

async function main() {
  try {
    runStaticChecks();
    const { tmpDir, targetRoot } = transpileModules();
    try {
      const rt = await loadModules(targetRoot);
      runChecks(rt);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    mark("local dev-session-read validation", true, "session-read modes + pipeline consumption + static safety passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local dev-session-read validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
