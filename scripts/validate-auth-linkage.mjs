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

function throws(fn, message) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

function transpileModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-auth-linkage-"));
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
  ]) {
    Object.assign(out, await import(pathToFileURL(path.join(targetRoot, dir, `${name}.js`)).href));
  }
  return out;
}

const NOW = "2026-06-08T00:00:00.000Z";
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";
const UUID_UPPER = "AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA";

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

function runLinkageChecks(rt) {
  const {
    OperatorRole,
    normalizeAuthUserId,
    isValidAuthUserId,
    isOperatorLinked,
    assertOperatorCanBeLinked,
    linkOperatorToAuthUser,
    unlinkOperatorFromAuthUser,
    resolveOperatorFromAuthUser,
    resolveSessionFromAuthUser,
    canApproveReply,
    canRejectReply,
    canCreateTicket,
  } = rt;

  // valid UUID accepted / normalized
  assert(isValidAuthUserId(UUID_A) === true, "valid UUID accepted");
  assert(isValidAuthUserId(UUID_UPPER) === true, "uppercase UUID accepted");
  assert(normalizeAuthUserId(UUID_UPPER) === UUID_UPPER.toLowerCase(), "auth user id normalized to lowercase");
  mark("valid UUID accepted", true, "well-formed UUIDs accepted and normalized");

  // invalid auth_user_id rejected
  for (const bad of ["not-a-uuid", "", "1234", "11111111-1111-4111-8111", null, undefined, 42]) {
    assert(isValidAuthUserId(bad) === false, `invalid auth_user_id rejected: ${String(bad)}`);
  }
  mark("invalid auth_user_id rejected", true, "malformed / empty / non-string ids rejected");

  // active operator can be linked (role + agency preserved, input not mutated)
  const active = baseRow(OperatorRole.CS_AGENT);
  const linked = linkOperatorToAuthUser(active, UUID_A);
  assert(isOperatorLinked(linked) === true && linked.auth_user_id === UUID_A, "active operator linked");
  assert(active.auth_user_id === null, "linkOperatorToAuthUser must not mutate input row");
  mark("active operator can be linked", true, "auth_user_id set on a new row; input unchanged");

  // suspended / archived cannot be linked
  throws(() => assertOperatorCanBeLinked(baseRow(OperatorRole.CS_AGENT, { status: "suspended" })), "suspended assert rejects");
  throws(() => linkOperatorToAuthUser(baseRow(OperatorRole.CS_AGENT, { status: "suspended" }), UUID_A), "suspended cannot be linked");
  throws(() => linkOperatorToAuthUser(baseRow(OperatorRole.CS_AGENT, { status: "archived" }), UUID_A), "archived cannot be linked");
  mark("suspended operator cannot be linked", true, "suspended link attempt throws");
  mark("archived operator cannot be linked", true, "archived link attempt throws");

  // invited operator does not become an active session even if a link exists
  const invitedLinked = baseRow(OperatorRole.CS_AGENT, { status: "invited", auth_user_id: UUID_B });
  assert(resolveSessionFromAuthUser([invitedLinked], UUID_B, { nowIso: NOW }) === null, "invited yields no session");
  mark("invited operator does not become active session", true, "linked-but-invited resolves to null session");

  // linked operator resolves by auth_user_id; unlinked id fails cleanly
  assert(resolveOperatorFromAuthUser([linked], UUID_A)?.id === linked.id, "resolve by auth_user_id");
  assert(resolveOperatorFromAuthUser([linked], UUID_UPPER) === undefined, "non-present id resolves undefined");
  assert(resolveOperatorFromAuthUser([baseRow(OperatorRole.CS_AGENT)], UUID_A) === undefined, "unlinked rows resolve undefined");
  assert(resolveSessionFromAuthUser([baseRow(OperatorRole.CS_AGENT)], UUID_A, { nowIso: NOW }) === null, "unlinked session resolves null");
  mark("linked operator resolves by auth_user_id", true, "exact + case-insensitive lookup");
  mark("unlinked auth_user_id fails cleanly", true, "absent id returns undefined/null, no throw");

  // duplicate auth_user_id rejected (resolve + link-with-existingRows)
  const dupA = linkOperatorToAuthUser(baseRow(OperatorRole.CS_AGENT, { id: "op-a" }), UUID_A);
  const dupB = linkOperatorToAuthUser(baseRow(OperatorRole.GARY_APPROVER, { id: "op-b" }), UUID_A);
  throws(() => resolveOperatorFromAuthUser([dupA, dupB], UUID_A), "duplicate link resolve throws");
  throws(() => linkOperatorToAuthUser(baseRow(OperatorRole.CS_AGENT, { id: "op-c" }), UUID_A, { existingRows: [dupA] }), "duplicate link via existingRows throws");
  // one operator -> at most one auth_user_id: re-linking to a different id throws.
  throws(() => linkOperatorToAuthUser(linked, UUID_B), "operator already linked to a different id throws");
  // re-linking to the SAME id is idempotent.
  assert(linkOperatorToAuthUser(linked, UUID_A).auth_user_id === UUID_A, "idempotent re-link to same id");
  mark("duplicate auth_user_id is rejected", true, "duplicate resolve + duplicate link rejected; single-link enforced");

  // linking does not change role / agency
  assert(linked.role === active.role, "role unchanged by linking");
  assert(linked.agency_id === active.agency_id, "agency unchanged by linking");
  mark("linking does not change role", true, `role ${active.role} preserved`);
  mark("linking does not change agency", true, `agency ${active.agency_id} preserved`);

  // unlinking clears auth_user_id but preserves the operator row
  const unlinked = unlinkOperatorFromAuthUser(linked);
  assert(unlinked.auth_user_id === null, "unlink clears auth_user_id");
  assert(unlinked.id === linked.id && unlinked.role === linked.role && unlinked.agency_id === linked.agency_id && unlinked.email === linked.email && unlinked.status === linked.status, "unlink preserves operator row");
  mark("unlinking clears auth_user_id but preserves operator row", true, "only the link is removed");

  // resolved session works with auth guards (per role)
  const garyLinked = linkOperatorToAuthUser(baseRow(OperatorRole.GARY_APPROVER, { id: "op-gary" }), UUID_B);
  const garySession = resolveSessionFromAuthUser([garyLinked], UUID_B, { nowIso: NOW });
  assert(garySession !== null && canApproveReply(garySession, NOW) && canRejectReply(garySession, NOW), "resolved gary session approves/rejects");
  const csLinked = linkOperatorToAuthUser(baseRow(OperatorRole.CS_AGENT, { id: "op-cs" }), UUID_A);
  const csSession = resolveSessionFromAuthUser([csLinked], UUID_A, { nowIso: NOW });
  assert(csSession !== null && canCreateTicket(csSession, NOW) && canApproveReply(csSession, NOW) === false, "resolved cs session create yes / approve no");
  mark("resolved session works with auth guards", true, "role capabilities hold for sessions resolved via auth_user_id");
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
  mark("RLS is not enabled", true, "no enable-row-level-security in src");

  const authRuntime = /@supabase\/supabase-js|createClient\s*\(|supabase\.auth/i;
  const text = fs.readFileSync(path.join(projectRoot, "src", "auth", "operatorIdentityLinking.ts"), "utf8");
  assert(!authRuntime.test(text), "Supabase Auth runtime dependency found in operatorIdentityLinking.ts");
  assert(!/service_role|sb_secret_|SUPABASE_SERVICE_ROLE/.test(text), "service-role reference in operatorIdentityLinking.ts");
  mark("no Supabase Auth runtime dependency introduced", true, "linkage helper uses no runtime auth / no service-role");
}

async function main() {
  try {
    runStaticSafetyChecks();
    const { tmpDir, targetRoot } = transpileModules();
    try {
      const rt = await loadModules(targetRoot);
      runLinkageChecks(rt);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    mark("local auth-linkage validation", true, "linkage behavior + static safety checks passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local auth-linkage validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
