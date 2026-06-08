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
  if (!passed) {
    failures.push(`${name}: ${detail}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ---------------------------------------------------------------------------
// Migration / file checks
// ---------------------------------------------------------------------------

function loadOperatorMigration() {
  const migrationsDir = path.join(projectRoot, "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((n) => n.endsWith(".sql"));
  const match = files.find((n) => /operator/i.test(n));
  assert(match, "no operator migration file found under supabase/migrations");
  return {
    name: match,
    text: fs.readFileSync(path.join(migrationsDir, match), "utf8").toLowerCase(),
  };
}

function enumValues(text, enumName) {
  const block = new RegExp(`create type public\\.${enumName} as enum\\s*\\(([^)]*)\\)`, "i").exec(text)?.[1];
  if (!block) {
    return [];
  }
  return [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function runMigrationChecks() {
  const { text } = loadOperatorMigration();

  assert(/create table if not exists public\.operators\b/.test(text), "operators table missing from migration");
  mark("operators table exists in migration", true, "create table public.operators present");

  const roleValues = enumValues(text, "operator_role");
  const hasRoleEnum = roleValues.length > 0;
  const hasRoleCheck = /role[\s\S]*?in\s*\(/.test(text) && /agency_admin/.test(text);
  assert(hasRoleEnum || hasRoleCheck, "operator role enum or controlled role constraint missing");
  mark("operator_role enum or controlled role constraint exists", true, hasRoleEnum ? `enum: ${roleValues.join("|")}` : "role check constraint present");

  const statusValues = enumValues(text, "operator_status");
  const hasStatusEnum = statusValues.length > 0;
  assert(hasStatusEnum || /status[\s\S]*?in\s*\(/.test(text), "operator status enum or controlled status constraint missing");
  mark("operator_status enum or controlled status constraint exists", true, hasStatusEnum ? `enum: ${statusValues.join("|")}` : "status check constraint present");

  assert(/foreign key \(agency_id\)\s*references public\.agencies/.test(text), "agency_id FK missing");
  mark("agency_id FK exists", true, "operators.agency_id references public.agencies");

  assert(/\bauth_user_id\b/.test(text), "auth_user_id column missing");
  mark("auth_user_id column exists", true, "auth_user_id present (nullable, unlinked)");

  assert(/unique \(agency_id, email\)/.test(text), "unique (agency_id, email) missing");
  mark("unique agency_id + email exists", true, "operators_agency_email_unique present");

  assert(/create unique index[\s\S]*?operators[\s\S]*?\(auth_user_id\)[\s\S]*?where auth_user_id is not null/.test(text), "auth_user_id partial unique index missing");
  mark("auth_user_id uniqueness exists", true, "partial unique index on auth_user_id where not null");

  const expectedIndexes = [
    "operators_agency_id_idx",
    "operators_email_idx",
    "operators_role_idx",
    "operators_status_idx",
    "operators_agency_role_idx",
    "operators_agency_status_idx",
  ];
  for (const idx of expectedIndexes) {
    assert(text.includes(idx), `expected index missing: ${idx}`);
  }
  mark("expected indexes exist", true, expectedIndexes.join(", "));

  assert(/comment on table public\.operators/.test(text), "operators table comment missing");
  assert(/does not enable authentication|does not enable auth|not enable authentication/i.test(text) || /backs the local auth/i.test(text), "operators table comment should document non-auth intent");
  mark("expected comments exist", true, "table/column comments documenting internal-identity, non-auth intent");

  // RLS must NOT be enabled in this migration.
  const enablesRls = /alter table[\s\S]*?operators[\s\S]*?enable row level security/.test(text)
    || /enable row level security[\s\S]*?operators/.test(text);
  assert(!enablesRls, "RLS must not be enabled in this migration");
  assert(/rls[\s\S]*?not enabled|not enabled[\s\S]*?rls|intentionally not enabled/i.test(text), "migration should document that RLS is intentionally not enabled");
  mark("RLS is not enabled yet", true, "no enable-row-level-security on operators; documented as deferred");
}

function walkSrc(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(entry.name)) {
        continue;
      }
      walkSrc(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function runStaticSafetyChecks() {
  const srcRoot = path.join(projectRoot, "src");

  // No API route / server structures.
  for (const bad of ["api", "routes", "server"]) {
    assert(!fs.existsSync(path.join(srcRoot, bad)), `forbidden src/${bad} directory exists`);
  }
  const srcFiles = walkSrc(srcRoot);
  const routeLike = srcFiles.filter((f) => /[\\/](app|pages|routes)[\\/]/.test(f.replaceAll("\\", "/")));
  assert(routeLike.length === 0, `route-like paths exist: ${routeLike.join(", ")}`);
  mark("no API routes exist", true, "no src/api|routes|server and no app/pages/routes paths");

  // No login UI files.
  const loginLike = srcFiles.filter((f) => /(login|signin|sign-in|logout)/i.test(path.basename(f)));
  assert(loginLike.length === 0, `login UI files exist: ${loginLike.join(", ")}`);
  mark("no login UI files exist", true, "no Login/SignIn/Logout component files present");

  // No Supabase Auth runtime introduced in the operator persistence files.
  const supabaseAuthPattern = /@supabase\/supabase-js|createClient\s*\(|supabase\.auth/i;
  const serviceRolePattern = /service_role|sb_secret_|SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/;
  for (const file of ["src/persistence/operatorTypes.ts", "src/persistence/operatorMappers.ts", "src/auth/authTypes.ts", "src/auth/authGuards.ts"]) {
    const text = fs.readFileSync(path.join(projectRoot, file), "utf8");
    assert(!supabaseAuthPattern.test(text), `Supabase Auth runtime dependency found in ${file}`);
    assert(!serviceRolePattern.test(text), `service-role reference found in ${file}`);
  }
  mark("no Supabase Auth runtime is introduced", true, "operator/auth files have no supabase client/auth or service-role usage");
}

// ---------------------------------------------------------------------------
// Type / guard checks (transpile + run)
// ---------------------------------------------------------------------------

function transpileModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-operators-validate-"));
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
      throw new Error(`TypeScript transpile failure for ${file}: ${output.diagnostics[0].messageText}`);
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
  return { ...authTypes, ...authGuards, ...operatorTypes, ...operatorMappers };
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

function runGuardChecks(runtime, migrationRoleValues) {
  const {
    OperatorRole,
    OPERATOR_ROLES,
    isAuthenticatedOperator,
    canCreateTicket,
    canTriageTicket,
    canDraftReply,
    canRequestApproval,
    canApproveReply,
    canRejectReply,
    canSendReply,
    canCloseTicket,
    mapOperatorRowToSession,
    validateOperatorRow,
  } = runtime;

  // Auth roles align with DB roles.
  const authRoleValues = OPERATOR_ROLES.map((r) => String(r)).sort();
  const dbRoleValues = [...migrationRoleValues].sort();
  assert(
    JSON.stringify(authRoleValues) === JSON.stringify(["agency_admin", "cs_agent", "gary_approver"]),
    `auth OperatorRole values mismatch: ${authRoleValues.join("|")}`,
  );
  assert(
    JSON.stringify(dbRoleValues) === JSON.stringify(authRoleValues),
    `DB operator_role enum (${dbRoleValues.join("|")}) does not align with auth roles (${authRoleValues.join("|")})`,
  );
  mark("auth roles align with DB roles", true, "agency_admin|cs_agent|gary_approver match between src/auth and migration enum");

  // Operator row maps to OperatorSession (active).
  const adminRow = baseRow(OperatorRole.AGENCY_ADMIN, { client_ids: ["CLI-1"], site_ids: ["SITE-1"] });
  const adminSession = mapOperatorRowToSession(adminRow, { nowIso: NOW });
  assert(adminSession !== null, "active operator row should map to a session");
  assert(adminSession.operatorId === adminRow.id && adminSession.email === adminRow.email, "session fields should map from row");
  assert(adminSession.role === OperatorRole.AGENCY_ADMIN, "session role should map from row");
  assert(adminSession.agencyId === "AG-1", "session agencyId should map from row");
  assert(Array.isArray(adminSession.clientIds) && adminSession.clientIds[0] === "CLI-1", "session clientIds should map");
  assert(isAuthenticatedOperator(adminSession, NOW) === true, "mapped active session should be authenticated");
  mark("operator row maps to OperatorSession", true, "active row maps with role/agency/scope and authenticates");

  // agency_admin can perform internal actions.
  assert(
    [canCreateTicket, canTriageTicket, canDraftReply, canRequestApproval, canApproveReply, canRejectReply, canSendReply, canCloseTicket]
      .every((g) => g(adminSession, NOW) === true),
    "agency_admin should perform all internal operator actions",
  );
  mark("agency_admin guard can perform internal actions", true, "all operator capabilities granted");

  // cs_agent expected actions.
  const csSession = mapOperatorRowToSession(baseRow(OperatorRole.CS_AGENT), { nowIso: NOW });
  assert(csSession !== null, "cs_agent active row should map to session");
  assert(canCreateTicket(csSession, NOW) && canTriageTicket(csSession, NOW) && canDraftReply(csSession, NOW), "cs_agent core actions");
  assert(canRequestApproval(csSession, NOW) && canSendReply(csSession, NOW) && canCloseTicket(csSession, NOW), "cs_agent request/send/close");
  assert(canApproveReply(csSession, NOW) === false && canRejectReply(csSession, NOW) === false, "cs_agent cannot approve/reject");
  mark("cs_agent guard can perform expected actions", true, "create/triage/draft/request/send/close yes; approve/reject no");

  // gary_approver can approve/reject.
  const garySession = mapOperatorRowToSession(baseRow(OperatorRole.GARY_APPROVER), { nowIso: NOW });
  assert(garySession !== null, "gary_approver active row should map to session");
  assert(canApproveReply(garySession, NOW) === true && canRejectReply(garySession, NOW) === true, "gary can approve/reject");
  assert(canCreateTicket(garySession, NOW) === false && canSendReply(garySession, NOW) === false, "gary cannot create/send");
  mark("gary_approver guard can approve/reject", true, "approve/reject yes; create/send no");

  // suspended / archived / invited operators are rejected.
  for (const status of ["suspended", "archived", "invited"]) {
    const row = baseRow(OperatorRole.CS_AGENT, { status });
    assert(mapOperatorRowToSession(row, { nowIso: NOW }) === null, `${status} operator must not map to a session`);
  }
  mark("suspended/archived operators are rejected", true, "non-active operators do not produce a usable session");

  // unauthenticated / null / invalid operator rejected.
  assert(isAuthenticatedOperator(null, NOW) === false, "null is not authenticated");
  assert(mapOperatorRowToSession(baseRow("not_a_role"), { nowIso: NOW }) === null, "invalid role row must not map");
  assert(validateOperatorRow(null).ok === false, "null row fails validation");
  assert(validateOperatorRow(baseRow(OperatorRole.CS_AGENT, { email: "MixedCase@Agency.INTERNAL" })).ok === false, "non-normalized email fails validation");
  mark("unauthenticated/null operator rejected", true, "null/invalid-role/non-normalized rows rejected");
}

async function main() {
  try {
    runMigrationChecks();
    runStaticSafetyChecks();

    const { text } = loadOperatorMigration();
    const migrationRoleValues = enumValues(text, "operator_role");
    assert(migrationRoleValues.length === 3, "operator_role enum should declare exactly 3 roles");

    const { tmpDir, targetRoot } = transpileModules();
    try {
      const runtime = await loadModules(targetRoot);
      runGuardChecks(runtime, migrationRoleValues);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local operators validation", true, "migration, static-safety, and type/guard checks passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local operators validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
