import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();

const authFiles = [
  "src/auth/authTypes.ts",
  "src/auth/authGuards.ts",
];

const checks = [];
const failures = [];

function mark(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) {
    failures.push(`${name}: ${detail}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function transpileAuthModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-auth-boundary-validate-"));
  const targetRoot = path.join(tmpDir, "src");

  for (const file of authFiles) {
    const sourceText = fs.readFileSync(path.join(projectRoot, file), "utf8");
    assert(sourceText.length > 0, `Unable to load source file: ${file}`);

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
      throw new Error(`TypeScript transpile failure for ${file}: ${output.diagnostics[0].messageText}`);
    }

    const relativeOutput = file.replace(/^src\//, "").replace(/\.ts$/, ".js");
    const outputPath = path.join(targetRoot, relativeOutput);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output.outputText, "utf8");
  }

  return { tmpDir, targetRoot };
}

async function loadAuthModules(targetRoot) {
  const authTypes = await import(pathToFileURL(path.join(targetRoot, "auth", "authTypes.js")).href);
  const authGuards = await import(pathToFileURL(path.join(targetRoot, "auth", "authGuards.js")).href);
  return { ...authTypes, ...authGuards };
}

function futureIso() {
  // Fixed-relative timestamps passed explicitly to guards so behavior is deterministic.
  return "2999-01-01T00:00:00.000Z";
}

function pastIso() {
  return "2000-01-01T00:00:00.000Z";
}

const NOW = "2026-06-07T00:00:00.000Z";

function runAuthScenarios(runtime) {
  const {
    OperatorRole,
    isAuthenticatedOperator,
    canCreateTicket,
    canTriageTicket,
    canDraftReply,
    canRequestApproval,
    canApproveReply,
    canRejectReply,
    canSendReply,
    canCloseTicket,
    canViewTicket,
    canSearchTickets,
    operatorCanAccessTenant,
  } = runtime;

  const allActionGuards = [
    canCreateTicket,
    canTriageTicket,
    canDraftReply,
    canRequestApproval,
    canApproveReply,
    canRejectReply,
    canSendReply,
    canCloseTicket,
    canViewTicket,
    canSearchTickets,
  ];

  const baseSession = (role) => ({
    operatorId: `op-${role}`,
    email: `${role}@agency.internal`,
    displayName: `Operator ${role}`,
    role,
    agencyId: "AG-1",
    expiresAt: futureIso(),
  });

  // 1) Unauthenticated (null / undefined) cannot perform any operator action.
  for (const guard of allActionGuards) {
    assert(guard(null, NOW) === false, "null session must deny all operator actions");
    assert(guard(undefined, NOW) === false, "undefined session must deny all operator actions");
  }
  assert(isAuthenticatedOperator(null, NOW) === false, "null is not an authenticated operator");

  // 2) Expired session is treated as unauthenticated.
  const expired = { ...baseSession(OperatorRole.AGENCY_ADMIN), expiresAt: pastIso() };
  assert(isAuthenticatedOperator(expired, NOW) === false, "expired session must be unauthenticated");
  for (const guard of allActionGuards) {
    assert(guard(expired, NOW) === false, "expired session must deny all operator actions");
  }

  // 3) Site User (non-operator role) cannot perform internal operator actions.
  const siteUser = { ...baseSession("site_user"), role: "site_user" };
  assert(isAuthenticatedOperator(siteUser, NOW) === false, "site_user is not an operator");
  for (const guard of allActionGuards) {
    assert(guard(siteUser, NOW) === false, "site_user must be denied all operator actions");
  }

  // Malformed sessions (missing fields) are unauthenticated.
  const missingRole = { ...baseSession(OperatorRole.CS_AGENT) };
  delete missingRole.role;
  assert(isAuthenticatedOperator(missingRole, NOW) === false, "missing role must be unauthenticated");
  const blankAgency = { ...baseSession(OperatorRole.CS_AGENT), agencyId: "  " };
  assert(isAuthenticatedOperator(blankAgency, NOW) === false, "blank agencyId must be unauthenticated");

  // 4) CS Agent can create/triage/draft/request/send/close + view/search; cannot approve/reject.
  const csAgent = baseSession(OperatorRole.CS_AGENT);
  assert(isAuthenticatedOperator(csAgent, NOW) === true, "cs_agent base session should be authenticated");
  assert(canCreateTicket(csAgent, NOW) === true, "cs_agent can create");
  assert(canTriageTicket(csAgent, NOW) === true, "cs_agent can triage");
  assert(canDraftReply(csAgent, NOW) === true, "cs_agent can draft");
  assert(canRequestApproval(csAgent, NOW) === true, "cs_agent can request approval");
  assert(canSendReply(csAgent, NOW) === true, "cs_agent can send");
  assert(canCloseTicket(csAgent, NOW) === true, "cs_agent can close");
  assert(canViewTicket(csAgent, undefined, NOW) === true, "cs_agent can view");
  assert(canSearchTickets(csAgent, NOW) === true, "cs_agent can search");
  assert(canApproveReply(csAgent, NOW) === false, "cs_agent cannot approve");
  assert(canRejectReply(csAgent, NOW) === false, "cs_agent cannot reject");

  // 5) Gary Approver can approve/reject (+ close/view/search); cannot create/triage/draft/request/send.
  const gary = baseSession(OperatorRole.GARY_APPROVER);
  assert(canApproveReply(gary, NOW) === true, "gary_approver can approve");
  assert(canRejectReply(gary, NOW) === true, "gary_approver can reject");
  assert(canCloseTicket(gary, NOW) === true, "gary_approver can close");
  assert(canViewTicket(gary, undefined, NOW) === true, "gary_approver can view");
  assert(canSearchTickets(gary, NOW) === true, "gary_approver can search");
  assert(canCreateTicket(gary, NOW) === false, "gary_approver cannot create");
  assert(canTriageTicket(gary, NOW) === false, "gary_approver cannot triage");
  assert(canDraftReply(gary, NOW) === false, "gary_approver cannot draft");
  assert(canRequestApproval(gary, NOW) === false, "gary_approver cannot request approval");
  assert(canSendReply(gary, NOW) === false, "gary_approver cannot send");

  // Agency admin is a full operator within scope.
  const admin = baseSession(OperatorRole.AGENCY_ADMIN);
  for (const guard of [canCreateTicket, canTriageTicket, canDraftReply, canRequestApproval, canApproveReply, canRejectReply, canSendReply, canCloseTicket, canSearchTickets]) {
    assert(guard(admin, NOW) === true, "agency_admin should have full operator capability");
  }

  // 6) Tenant scope: view is denied outside the operator's agency/client/site scope.
  const scopedAgent = { ...baseSession(OperatorRole.CS_AGENT), clientIds: ["CLI-1"], siteIds: ["SITE-1"] };
  assert(
    canViewTicket(scopedAgent, { agencyId: "AG-1", clientId: "CLI-1", siteId: "SITE-1" }, NOW) === true,
    "scoped agent can view in-scope ticket",
  );
  assert(
    canViewTicket(scopedAgent, { agencyId: "AG-2", clientId: "CLI-1", siteId: "SITE-1" }, NOW) === false,
    "scoped agent cannot view other-agency ticket",
  );
  assert(
    canViewTicket(scopedAgent, { agencyId: "AG-1", clientId: "CLI-9", siteId: "SITE-1" }, NOW) === false,
    "scoped agent cannot view out-of-scope client",
  );
  assert(operatorCanAccessTenant(null, { agencyId: "AG-1" }, NOW) === false, "null cannot access any tenant");

  mark("unauthenticated denied all operator actions", true, "null/undefined sessions denied across all guards");
  mark("expired session treated as unauthenticated", true, "expired session denied across all guards");
  mark("site_user cannot perform operator actions", true, "non-operator role denied across all guards");
  mark("cs_agent capabilities correct", true, "create/triage/draft/request/send/close yes; approve/reject no");
  mark("gary_approver capabilities correct", true, "approve/reject/close/view/search yes; create/draft/send no");
  mark("agency_admin has full operator capability", true, "all operator capabilities granted within scope");
  mark("tenant scope enforced for view", true, "out-of-agency and out-of-scope client views denied");
}

function runStaticSourceChecks() {
  const serviceRolePattern = /service_role|sb_secret_|SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/;
  // Blocks the real Supabase SDK / auth runtime (package imports, createClient, supabase.auth).
  // Local relative imports of our own modules (e.g. "./supabaseAuthSessionAdapter", whose filename
  // merely contains "supabase") are allowed — they are pure local TS, not a runtime dependency.
  const supabaseRuntimePattern = /@supabase\/[a-z-]+|createClient\s*\(|supabase\.auth|from\s+["']https?:\/\/[^"']*supabase/i;

  const authDir = path.join(projectRoot, "src", "auth");
  const entries = fs.readdirSync(authDir, { withFileTypes: true });

  // Scan EVERY local auth source file (the auth module grows across phases: contracts/guards plus
  // session resolution and capability mapping). All must remain free of service-role keys and any
  // Supabase Auth / runtime client dependency.
  const authSourceFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".ts")).map((e) => e.name);
  for (const name of authSourceFiles) {
    const text = fs.readFileSync(path.join(authDir, name), "utf8");
    assert(!serviceRolePattern.test(text), `service-role reference found in src/auth/${name}`);
    assert(!supabaseRuntimePattern.test(text), `Supabase runtime dependency found in src/auth/${name}`);
  }
  mark("no service-role key in auth files", true, `no service_role/sb_secret/SERVICE_ROLE tokens across ${authSourceFiles.length} src/auth files`);
  mark("no Supabase Auth runtime dependency yet", true, "no @supabase/supabase-js, createClient, or supabase.auth in src/auth");

  // No route files / route-like directories under src/auth; TypeScript source only.
  const routeLike = entries.filter((e) => e.isDirectory() && ["app", "pages", "routes", "api"].includes(e.name));
  assert(routeLike.length === 0, `route-like directory found under src/auth: ${routeLike.map((e) => e.name).join(", ")}`);
  const onlyTsFiles = entries.filter((e) => e.isFile()).every((e) => e.name.endsWith(".ts"));
  assert(onlyTsFiles, "src/auth must contain only local TypeScript auth source files (no route/.js files)");
  mark("no route files created", true, "src/auth contains only local TypeScript auth source files");
}

async function main() {
  try {
    runStaticSourceChecks();

    const { tmpDir, targetRoot } = transpileAuthModules();
    try {
      const runtime = await loadAuthModules(targetRoot);
      runAuthScenarios(runtime);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local auth-boundary validation", true, "capability matrix and static safety checks passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local auth-boundary validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
