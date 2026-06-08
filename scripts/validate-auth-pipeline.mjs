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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-auth-pipeline-"));
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

function runPipelineChecks(rt) {
  const {
    OperatorRole,
    getSessionPrincipal,
    extractPrincipalFromUser,
    createSyntheticSession,
    createSyntheticUser,
    mapAuthPrincipalToOperatorLookup,
    resolveOperatorSessionFromSession,
    resolveOperatorSessionFromUser,
    resolveCapabilityFlagsFromSession,
  } = rt;

  const opts = { nowIso: NOW };

  // valid session produces principal
  const session = createSyntheticSession({ id: UUID_A, email: "gary@x.test", expiresAtIso: FUTURE });
  const principal = getSessionPrincipal(session);
  assert(principal && principal.id === UUID_A, "session produces a principal with the user id");
  assert(principal.expiresAt === FUTURE, "principal carries the session expiry");
  mark("valid session produces principal", true, "session.user.id → principal.id; expiry carried");

  // valid principal produces operator lookup
  const lookup = mapAuthPrincipalToOperatorLookup(principal);
  assert(lookup.authUserId === UUID_A, "principal maps to an auth_user_id lookup");
  mark("valid principal produces operator lookup", true, "principal → { authUserId }");

  // linked operator produces session (full pipeline)
  const garyRows = [row(OperatorRole.GARY_APPROVER, UUID_A)];
  const sessionResult = resolveOperatorSessionFromSession(session, garyRows, opts);
  assert(sessionResult.authenticated === true && sessionResult.session?.role === "gary_approver", "linked operator resolves through the pipeline");
  const userResult = resolveOperatorSessionFromUser(createSyntheticUser({ id: UUID_A }), garyRows, opts);
  assert(userResult.authenticated === true && userResult.session?.role === "gary_approver", "user-shape path resolves too");
  mark("linked operator produces session", true, "session/user → principal → adapter → operator session");

  // capability flags resolve correctly
  const flags = resolveCapabilityFlagsFromSession(session, garyRows, opts);
  assert(flags.canSeeApproveReply === true && flags.canSeeCreateTicket === false, "gary capability flags from pipeline");
  const csFlags = resolveCapabilityFlagsFromSession(createSyntheticSession({ id: UUID_A, expiresAtIso: FUTURE }), [row(OperatorRole.CS_AGENT, UUID_A)], opts);
  assert(csFlags.canSeeCreateTicket === true && csFlags.canSeeApproveReply === false, "cs capability flags from pipeline");
  mark("capability flags resolve correctly", true, "flags derive from the resolved operator session");

  // invalid session fails
  assert(resolveOperatorSessionFromSession(null, garyRows, opts).authenticated === false, "null session unauthenticated");
  assert(resolveOperatorSessionFromSession({}, garyRows, opts).authenticated === false, "empty session unauthenticated");
  assert(resolveOperatorSessionFromSession("garbage", garyRows, opts).authenticated === false, "non-object session unauthenticated");
  mark("invalid session fails", true, "null/empty/garbage sessions → unauthenticated");

  // missing user fails
  const noUser = resolveOperatorSessionFromSession({ expires_at: 9999999999 }, garyRows, opts);
  assert(noUser.authenticated === false && noUser.reason === "no_session_principal", "session without user fails");
  assert(getSessionPrincipal({ expires_at: 1 }) === null, "no user → null principal");
  mark("missing user fails", true, "session with no user yields no principal");

  // email-only identity rejected
  const emailOnlySession = { expires_at: 9999999999, user: { email: "gary@x.test" } };
  assert(getSessionPrincipal(emailOnlySession) === null, "email-only user → null principal (no id)");
  assert(resolveOperatorSessionFromSession(emailOnlySession, garyRows, opts).authenticated === false, "email-only session unauthenticated");
  const blankIdUser = extractPrincipalFromUser({ id: "", email: "gary@x.test" });
  assert(blankIdUser === null, "blank id user → null principal");
  mark("email-only identity rejected", true, "email is never sufficient; no valid id → no principal");

  // unlinked principal fails; no DB writes / rows unchanged
  const unlinkedRows = [row(OperatorRole.CS_AGENT, null)];
  const beforeSnap = JSON.stringify(unlinkedRows);
  const unlinked = resolveOperatorSessionFromSession(session, unlinkedRows, opts);
  assert(unlinked.authenticated === false, "unlinked principal unauthenticated");
  assert(JSON.stringify(unlinkedRows) === beforeSnap, "pipeline must not mutate operator rows");
  mark("no DB writes / no mutation", true, "pipeline resolves read-only; operator rows unchanged");
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
  assert(srcFiles.filter((f) => /(^|[^a-z])(login|signin|sign-in|logout)([^a-z]|$)/i.test(path.basename(f))).length === 0, "login UI files exist");
  mark("no login UI exists", true, "no Login/SignIn/Logout files present");
  assert(srcFiles.filter((f) => /middleware\.(t|j)sx?$/.test(path.basename(f))).length === 0, "route middleware files exist");
  mark("no route middleware exists", true, "no middleware.* files present");

  const rls = /enable\s+row\s+level\s+security/i;
  for (const f of srcFiles) {
    assert(!rls.test(fs.readFileSync(f, "utf8")), `RLS enablement found in ${f}`);
  }
  mark("no RLS enabled", true, "no enable-row-level-security in src");

  // The wrapper + pipeline perform no auth flows, no user creation, no writes, no supabase runtime.
  const forbidden = /admin\.createUser|createUser\s*\(|signUp\s*\(|signIn\w*\s*\(|signOut\s*\(|resetPasswordForEmail|magic[_-]?link|verifyOtp|insert\s*\(|update\s*\(|upsert\s*\(|delete\s*\(|@supabase\/[a-z-]+|createClient\s*\(|supabase\.auth/i;
  for (const file of ["src/auth/supabaseAuthClientWrapper.ts", "src/auth/authPipeline.ts"]) {
    const text = fs.readFileSync(path.join(projectRoot, file), "utf8");
    assert(!forbidden.test(text), `forbidden auth-flow/runtime/write pattern in ${file}`);
    assert(!/service_role|sb_secret_|SUPABASE_SERVICE_ROLE/.test(text), `service-role reference in ${file}`);
  }
  mark("no auth creation / no writes / no supabase runtime", true, "wrapper + pipeline have no auth flows, user creation, writes, or supabase client");
  mark("no service-role usage", true, "no service-role tokens in wrapper/pipeline");
}

async function main() {
  try {
    runStaticChecks();
    const { tmpDir, targetRoot } = transpileModules();
    try {
      const rt = await loadModules(targetRoot);
      runPipelineChecks(rt);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    mark("local auth-pipeline validation", true, "session→principal→adapter→session→flags + static safety passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local auth-pipeline validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
