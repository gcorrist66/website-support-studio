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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-auth-adapter-"));
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
  ]) {
    Object.assign(out, await import(pathToFileURL(path.join(targetRoot, dir, `${name}.js`)).href));
  }
  return out;
}

const NOW = "2026-06-08T00:00:00.000Z";
const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";
const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

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

function runAdapterChecks(rt) {
  const {
    OperatorRole,
    normalizeSupabaseAuthPrincipal,
    assertSupabaseAuthPrincipal,
    assertAuthAdapterGuard,
    mapAuthPrincipalToOperatorLookup,
    resolveOperatorSessionFromAuthPrincipal,
    createUnauthenticatedSessionResult,
    canApproveReply,
    canRejectReply,
    canCreateTicket,
    getOperatorCapabilityFlags,
  } = rt;

  const opts = { nowIso: NOW };

  // Adapter guard: dev requires a non-production env; misconfig throws.
  assertAuthAdapterGuard({ expectedProjectRef: "vrtfbbrwrxyljchywmzy", environment: "dev", allowDevValidation: true });
  throws(() => assertAuthAdapterGuard({ expectedProjectRef: "vrtfbbrwrxyljchywmzy", environment: "production", allowDevValidation: true }), "dev guard rejects production env");
  throws(() => assertAuthAdapterGuard({ expectedProjectRef: "", environment: "dev", allowDevValidation: true }), "dev guard requires project ref");
  mark("adapter environment guard works", true, "dev path requires non-production env + project ref");

  // valid auth principal maps to auth_user_id lookup (id only, not email)
  const lookup = mapAuthPrincipalToOperatorLookup({ id: UUID_A, email: "ignored@x.test" });
  assert(lookup.authUserId === UUID_A, "lookup must use the auth_user_id (principal id)");
  assert(!("email" in lookup), "lookup must not expose an email key");
  mark("valid auth principal maps to auth_user_id lookup", true, "lookup key is the principal id (UUID)");

  // invalid UUID fails
  throws(() => assertSupabaseAuthPrincipal({ id: "not-a-uuid" }), "invalid id assert throws");
  assert(resolveOperatorSessionFromAuthPrincipal({ id: "not-a-uuid" }, [row(OperatorRole.CS_AGENT, UUID_A)], opts).authenticated === false, "invalid UUID principal not authenticated");
  mark("invalid UUID fails", true, "non-UUID principal id rejected");

  // missing principal fails safely (no throw)
  const missing = resolveOperatorSessionFromAuthPrincipal(null, [], opts);
  assert(missing.authenticated === false && missing.session === null && missing.reason === "auth_principal_missing", "null principal handled safely");
  mark("missing principal fails safely", true, "null principal returns unauthenticated, no throw");

  // email-only identity is rejected (no valid id, even if an operator has that email)
  const csLinked = row(OperatorRole.CS_AGENT, UUID_A, { email: "cs@agency.internal" });
  const emailOnly = resolveOperatorSessionFromAuthPrincipal({ id: "", email: "cs@agency.internal" }, [csLinked], opts);
  assert(emailOnly.authenticated === false, "email-only identity must not authenticate");
  mark("email-only identity is rejected", true, "email is never a lookup key; no valid id → rejected");

  // unlinked auth_user_id fails (operator exists but not linked)
  const unlinkedRows = [row(OperatorRole.CS_AGENT, null)];
  const unlinked = resolveOperatorSessionFromAuthPrincipal({ id: UUID_A }, unlinkedRows, opts);
  assert(unlinked.authenticated === false && unlinked.reason === "no_active_operator_for_principal", "unlinked id fails");
  mark("unlinked auth_user_id fails", true, "no operator linked to the principal id → unauthenticated");

  // linked active operator resolves session
  const active = resolveOperatorSessionFromAuthPrincipal({ id: UUID_A }, [row(OperatorRole.GARY_APPROVER, UUID_A)], opts);
  assert(active.authenticated === true && active.session !== null, "linked active operator authenticates");
  assert(active.session.role === OperatorRole.GARY_APPROVER && active.session.agencyId === "AG-1", "resolved session carries role + agency");
  assert(active.principalId === UUID_A, "result carries principal id");
  mark("linked active operator resolves session", true, "active linked operator → authenticated session");

  // linked suspended / archived operators fail
  for (const status of ["suspended", "archived"]) {
    const res = resolveOperatorSessionFromAuthPrincipal({ id: UUID_A }, [row(OperatorRole.CS_AGENT, UUID_A, { status })], opts);
    assert(res.authenticated === false && res.session === null, `${status} linked operator must not authenticate`);
  }
  mark("linked suspended operator fails", true, "suspended linked operator → unauthenticated");
  mark("linked archived operator fails", true, "archived linked operator → unauthenticated");

  // invited operator does not create active session
  const invited = resolveOperatorSessionFromAuthPrincipal({ id: UUID_A }, [row(OperatorRole.CS_AGENT, UUID_A, { status: "invited" })], opts);
  assert(invited.authenticated === false && invited.session === null, "invited linked operator → no session");
  mark("invited operator does not create active session", true, "invited linked operator → unauthenticated");

  // expired auth principal fails
  const expired = resolveOperatorSessionFromAuthPrincipal({ id: UUID_A, expiresAt: PAST }, [row(OperatorRole.CS_AGENT, UUID_A)], opts);
  assert(expired.authenticated === false && expired.reason === "auth_principal_expired", "expired principal → unauthenticated");
  // future-expiry principal still resolves
  const fut = resolveOperatorSessionFromAuthPrincipal({ id: UUID_A, expiresAt: FUTURE }, [row(OperatorRole.CS_AGENT, UUID_A)], opts);
  assert(fut.authenticated === true, "future-expiry principal resolves");
  mark("expired auth principal rejected", true, "past expiresAt → unauthenticated; future → resolves");

  // resolved session works with capability guards
  const garyRes = resolveOperatorSessionFromAuthPrincipal({ id: UUID_A }, [row(OperatorRole.GARY_APPROVER, UUID_A)], opts);
  assert(canApproveReply(garyRes.session, NOW) && canRejectReply(garyRes.session, NOW), "gary session approves/rejects");
  const csRes = resolveOperatorSessionFromAuthPrincipal({ id: UUID_B }, [row(OperatorRole.CS_AGENT, UUID_B)], opts);
  assert(canCreateTicket(csRes.session, NOW) && canApproveReply(csRes.session, NOW) === false, "cs session create yes / approve no");
  const flags = getOperatorCapabilityFlags(garyRes.session, NOW);
  assert(flags.canSeeApproveReply === true && flags.canSeeCreateTicket === false, "capability flags match resolved gary session");
  mark("resolved session works with capability guards", true, "adapter sessions drive auth guards + capability flags");

  // normalize lowercases id
  assert(normalizeSupabaseAuthPrincipal({ id: UUID_A.toUpperCase() }).id === UUID_A, "principal id normalized to lowercase");
  // helper result shape
  const u = createUnauthenticatedSessionResult("x");
  assert(u.authenticated === false && u.session === null && u.reason === "x", "unauthenticated result shape");
  mark("principal normalization + result helpers", true, "id normalized; result helpers shaped correctly");
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
  mark("no RLS enabled", true, "no enable-row-level-security in src");

  const adapter = fs.readFileSync(path.join(srcRoot, "auth", "supabaseAuthSessionAdapter.ts"), "utf8");
  assert(!/@supabase\/supabase-js|createClient\s*\(|supabase\.auth|signInWith|signUp|magiclink|magic_link|resetPasswordForEmail|exchangeCodeForSession/i.test(adapter), "Supabase Auth runtime/login dependency in adapter");
  assert(!/service_role|sb_secret_|SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/.test(adapter), "service-role reference in adapter");
  mark("no service-role key usage", true, "adapter has no service-role token");
  mark("no Supabase Auth runtime/login dependency introduced", true, "no supabase client/auth, signIn/signUp/magiclink/password in adapter");
}

async function main() {
  try {
    runStaticSafetyChecks();
    const { tmpDir, targetRoot } = transpileModules();
    try {
      const rt = await loadModules(targetRoot);
      runAdapterChecks(rt);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    mark("local supabase-auth-adapter validation", true, "adapter resolution + capability + static safety passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local supabase-auth-adapter validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
