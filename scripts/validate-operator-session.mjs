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
  "src/auth/operatorCapabilities.ts",
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-operator-session-"));
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
  const authTypes = await import(pathToFileURL(path.join(targetRoot, "auth", "authTypes.js")).href);
  const authGuards = await import(pathToFileURL(path.join(targetRoot, "auth", "authGuards.js")).href);
  const operatorTypes = await import(pathToFileURL(path.join(targetRoot, "persistence", "operatorTypes.js")).href);
  const operatorMappers = await import(pathToFileURL(path.join(targetRoot, "persistence", "operatorMappers.js")).href);
  const resolver = await import(pathToFileURL(path.join(targetRoot, "auth", "operatorSessionResolver.js")).href);
  const capabilities = await import(pathToFileURL(path.join(targetRoot, "auth", "operatorCapabilities.js")).href);
  return { ...authTypes, ...authGuards, ...operatorTypes, ...operatorMappers, ...resolver, ...capabilities };
}

const NOW = "2026-06-08T00:00:00.000Z";

function baseRow(role, overrides = {}) {
  return {
    id: `op-${role}`,
    auth_user_id: null,
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

function runResolverChecks(rt) {
  const {
    OperatorRole,
    resolveOperatorSession,
    resolveOperatorByEmail,
    resolveOperatorByAuthUserId,
    createOperatorSession,
    validateOperatorSession,
    isAuthenticatedOperator,
  } = rt;

  // Active operator resolves.
  const active = resolveOperatorSession(baseRow(OperatorRole.CS_AGENT), { nowIso: NOW });
  assert(active.ok === true && active.session !== null, "active operator should resolve to a session");
  assert(active.session.role === OperatorRole.CS_AGENT, "resolved session role should match row");
  assert(active.session.agencyId === "AG-1", "resolved session agency should match row");
  assert(active.operatorStatus === "active" && active.pendingInvite === false, "active resolution status flags");
  assert(isAuthenticatedOperator(active.session, NOW) === true, "resolved active session authenticates");
  mark("active operator resolves", true, "active row → usable session");

  // Suspended / archived rejected.
  const suspended = resolveOperatorSession(baseRow(OperatorRole.CS_AGENT, { status: "suspended" }), { nowIso: NOW });
  assert(suspended.ok === false && suspended.session === null && /suspended/.test(suspended.reason), "suspended rejected");
  const archived = resolveOperatorSession(baseRow(OperatorRole.CS_AGENT, { status: "archived" }), { nowIso: NOW });
  assert(archived.ok === false && archived.session === null && /archived/.test(archived.reason), "archived rejected");
  mark("suspended rejected", true, "suspended operator produces no session");
  mark("archived rejected", true, "archived operator produces no session");

  // Invited surfaced but not fully active.
  const invited = resolveOperatorSession(baseRow(OperatorRole.CS_AGENT, { status: "invited" }), { nowIso: NOW, allowInvited: true });
  assert(invited.ok === false && invited.session === null && invited.pendingInvite === true, "invited not fully active");
  mark("invited not fully active", true, "invited operator surfaced as pendingInvite, no session");

  // Missing agency rejected.
  const noAgency = resolveOperatorSession(baseRow(OperatorRole.CS_AGENT, { agency_id: "" }), { nowIso: NOW });
  assert(noAgency.ok === false && noAgency.session === null, "missing agency rejected");
  mark("missing agency rejected", true, "row without agency_id does not resolve");

  // Missing role rejected.
  const noRole = baseRow(OperatorRole.CS_AGENT);
  delete noRole.role;
  const noRoleRes = resolveOperatorSession(noRole, { nowIso: NOW });
  assert(noRoleRes.ok === false && noRoleRes.session === null, "missing role rejected");
  mark("missing role rejected", true, "row without role does not resolve");

  // Operator session created correctly (fields).
  const session = createOperatorSession(baseRow(OperatorRole.AGENCY_ADMIN, { client_ids: ["CLI-1"], site_ids: ["SITE-1"] }), { nowIso: NOW });
  assert(session && session.operatorId === "op-agency_admin" && session.email === "agency_admin@agency.internal", "session fields mapped");
  assert(Array.isArray(session.clientIds) && session.clientIds[0] === "CLI-1", "session scope mapped");
  assert(validateOperatorSession(session, NOW).ok === true, "validateOperatorSession accepts a valid active session");
  assert(validateOperatorSession(null, NOW).ok === false, "validateOperatorSession rejects null");
  mark("operator session created correctly", true, "createOperatorSession maps fields; validateOperatorSession works");

  // Lookups.
  const rows = [baseRow(OperatorRole.CS_AGENT, { email: "Person@Agency.Internal", auth_user_id: "auth-1" }), baseRow(OperatorRole.GARY_APPROVER)];
  assert(resolveOperatorByEmail(rows, "person@agency.internal")?.auth_user_id === "auth-1", "resolveOperatorByEmail is case-insensitive");
  assert(resolveOperatorByAuthUserId(rows, "auth-1")?.role === OperatorRole.CS_AGENT, "resolveOperatorByAuthUserId matches");
  assert(resolveOperatorByAuthUserId(rows, "nope") === undefined, "resolveOperatorByAuthUserId returns undefined when absent");
  mark("operator lookups work", true, "by-email (case-insensitive) and by-auth-user-id lookups resolve");
}

function runGuardConsumptionChecks(rt) {
  const {
    OperatorRole,
    createOperatorSession,
    canApproveReply,
    canRejectReply,
    canCreateTicket,
    canSendReply,
    canCloseTicket,
    canSeeCreateTicket,
    canSeeTriage,
    canSeeDraftReply,
    canSeeRequestApproval,
    canSeeApproveReply,
    canSeeRejectReply,
    canSeeSendReply,
    canSeeCloseTicket,
    canSeeSearch,
    canSeeOperatorAdmin,
    getOperatorCapabilityFlags,
  } = rt;

  const admin = createOperatorSession(baseRow(OperatorRole.AGENCY_ADMIN), { nowIso: NOW });
  const cs = createOperatorSession(baseRow(OperatorRole.CS_AGENT), { nowIso: NOW });
  const gary = createOperatorSession(baseRow(OperatorRole.GARY_APPROVER), { nowIso: NOW });

  // Auth guards consume the resolved session.
  assert(canApproveReply(gary, NOW) && canRejectReply(gary, NOW), "auth guards: gary approve/reject");
  assert(canCreateTicket(cs, NOW) && canSendReply(cs, NOW) && canCloseTicket(cs, NOW), "auth guards: cs create/send/close");
  assert(canApproveReply(cs, NOW) === false, "auth guards: cs cannot approve");
  mark("auth guards consume session correctly", true, "resolved sessions drive the existing auth guards");

  // Capability mapping matches role expectations.
  // CS Agent: create/triage/draft/request/send/close + search; not approve/reject/admin.
  assert(canSeeCreateTicket(cs, NOW) && canSeeTriage(cs, NOW) && canSeeDraftReply(cs, NOW) && canSeeRequestApproval(cs, NOW) && canSeeSendReply(cs, NOW) && canSeeCloseTicket(cs, NOW) && canSeeSearch(cs, NOW), "cs capability visible set");
  assert(canSeeApproveReply(cs, NOW) === false && canSeeRejectReply(cs, NOW) === false && canSeeOperatorAdmin(cs, NOW) === false, "cs capability hidden set");
  // Gary Approver: approve/reject + close + search (per the Phase 6B matrix and the domain, which
  // allows sent_to_customer -> closed for gary_approver); not create/triage/draft/request/send/admin.
  assert(canSeeApproveReply(gary, NOW) && canSeeRejectReply(gary, NOW) && canSeeCloseTicket(gary, NOW) && canSeeSearch(gary, NOW), "gary capability visible set");
  assert(canSeeCreateTicket(gary, NOW) === false && canSeeTriage(gary, NOW) === false && canSeeDraftReply(gary, NOW) === false && canSeeRequestApproval(gary, NOW) === false && canSeeSendReply(gary, NOW) === false && canSeeOperatorAdmin(gary, NOW) === false, "gary capability hidden set");
  // Agency Admin: full + operator admin.
  const adminFlags = getOperatorCapabilityFlags(admin, NOW);
  assert(Object.values(adminFlags).every((v) => v === true), "agency_admin sees all capabilities incl operator admin");
  // Signed-out (null) session: nothing visible.
  const noneFlags = getOperatorCapabilityFlags(null, NOW);
  assert(Object.values(noneFlags).every((v) => v === false), "no session → no capabilities");
  mark("capability mapping matches role expectations", true, "cs/gary/admin/none capability sets correct");
}

function runStaticSafetyChecks() {
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

  const routeLike = srcFiles.filter((f) => /[\\/](app|pages|routes)[\\/]/.test(f.replaceAll("\\", "/")));
  assert(routeLike.length === 0, `route-like paths exist: ${routeLike.join(", ")}`);
  mark("no API routes created", true, "no src/api|routes|server, no app/pages/routes paths");

  const loginLike = srcFiles.filter((f) => /(^|[^a-z])(login|signin|sign-in|logout)([^a-z]|$)/i.test(path.basename(f)));
  assert(loginLike.length === 0, `login UI files exist: ${loginLike.join(", ")}`);
  mark("no login UI created", true, "no Login/SignIn/Logout files present");

  // No route middleware files.
  const middlewareLike = srcFiles.filter((f) => /middleware\.(t|j)sx?$/.test(path.basename(f)));
  assert(middlewareLike.length === 0, `route middleware files exist: ${middlewareLike.join(", ")}`);
  mark("no route middleware created", true, "no middleware.* files present");

  // No Supabase Auth runtime / service-role in the new auth files; no RLS introduced anywhere new.
  const authRuntime = /@supabase\/supabase-js|createClient\s*\(|supabase\.auth/i;
  const serviceRole = /service_role|sb_secret_|SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/;
  for (const f of ["src/auth/operatorSessionResolver.ts", "src/auth/operatorCapabilities.ts", "src/auth/devOperatorSession.ts"]) {
    const text = fs.readFileSync(path.join(projectRoot, f), "utf8");
    assert(!authRuntime.test(text), `Supabase Auth runtime found in ${f}`);
    assert(!serviceRole.test(text), `service-role reference found in ${f}`);
  }
  mark("no auth runtime / no Supabase Auth", true, "session resolver/capabilities/dev-session use no runtime auth or service-role");

  const rlsPattern = /enable\s+row\s+level\s+security/i;
  for (const f of srcFiles) {
    assert(!rlsPattern.test(fs.readFileSync(f, "utf8")), `RLS enablement found in ${f}`);
  }
  mark("no RLS introduced", true, "no enable-row-level-security in src");
}

async function main() {
  try {
    runStaticSafetyChecks();
    const { tmpDir, targetRoot } = transpileModules();
    try {
      const rt = await loadModules(targetRoot);
      runResolverChecks(rt);
      runGuardConsumptionChecks(rt);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    mark("local operator-session validation", true, "session resolution + capability gating + safety checks passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local operator-session validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
