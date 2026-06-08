import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();

const STATE_FILE = "src/auth/loginShellState.ts";
const UI_FILE = "src/components/auth/LoginShell.tsx";

const checks = [];
const failures = [];

function mark(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) failures.push(`${name}: ${detail}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function transpileStateModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-login-shell-"));
  const targetRoot = path.join(tmpDir, "src");
  // loginShellState imports authTypes + operatorCapabilities (which imports authGuards/authTypes).
  for (const file of [
    "src/auth/authTypes.ts",
    "src/auth/authGuards.ts",
    "src/auth/operatorCapabilities.ts",
    "src/auth/loginShellState.ts",
  ]) {
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

async function loadState(targetRoot) {
  return import(pathToFileURL(path.join(targetRoot, "auth", "loginShellState.js")).href);
}

const REQUIRED_STATUSES = [
  "loading",
  "unauthenticated",
  "authenticated_no_operator",
  "authenticated_operator",
  "suspended_operator",
  "archived_operator",
  "invited_operator",
  "expired_session",
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!["node_modules", "dist", ".git"].includes(e.name)) walk(path.join(dir, e.name), acc);
    } else {
      acc.push(path.join(dir, e.name));
    }
  }
  return acc;
}

async function main() {
  try {
    // Files exist.
    assert(fs.existsSync(path.join(projectRoot, UI_FILE)), "LoginShell component missing");
    mark("LoginShell component exists", true, UI_FILE);
    assert(fs.existsSync(path.join(projectRoot, STATE_FILE)), "loginShellState missing");
    mark("loginShellState exists", true, STATE_FILE);

    // All required states exist as factory output.
    const { tmpDir, targetRoot } = transpileStateModule();
    try {
      const mod = await loadState(targetRoot);
      const produced = new Set();
      const factories = {
        loading: mod.createLoadingState,
        unauthenticated: mod.createUnauthenticatedState,
        authenticated_no_operator: mod.createAuthenticatedNoOperatorState,
        suspended_operator: mod.createSuspendedOperatorState,
        archived_operator: mod.createArchivedOperatorState,
        invited_operator: mod.createInvitedOperatorState,
        expired_session: mod.createExpiredSessionState,
      };
      for (const [status, fn] of Object.entries(factories)) {
        assert(typeof fn === "function", `missing factory for ${status}`);
        const state = fn();
        assert(state.status === status, `factory ${status} returned status ${state.status}`);
        assert(state.canAccessWorkspace === false, `${status} must not grant workspace access`);
        produced.add(state.status);
      }
      // authenticated_operator requires a session and grants workspace.
      const sample = { operatorId: "x", email: "a@b.test", displayName: "X", role: "agency_admin", agencyId: "AG-1", expiresAt: "2999-01-01T00:00:00.000Z" };
      const opState = mod.createAuthenticatedOperatorState(sample);
      assert(opState.status === "authenticated_operator" && opState.canAccessWorkspace === true && opState.operatorSession, "authenticated_operator must grant workspace with a session");
      produced.add(opState.status);

      for (const status of REQUIRED_STATUSES) {
        assert(produced.has(status), `required state not produced: ${status}`);
      }
      // buildLoginShellState maps each status.
      for (const status of REQUIRED_STATUSES) {
        const built = mod.buildLoginShellState(status, sample);
        assert(built.status === status || (status === "authenticated_operator" && built.canAccessWorkspace), `buildLoginShellState(${status}) mismatch`);
      }
      assert(Array.isArray(mod.LOGIN_SHELL_STATUS_OPTIONS) && mod.LOGIN_SHELL_STATUS_OPTIONS.length === REQUIRED_STATUSES.length, "status options list incomplete");
      mark("all required auth states exist", true, REQUIRED_STATUSES.join(", "));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    // Forbidden auth-surface wording in the login shell module + component.
    const shellText = [STATE_FILE, UI_FILE].map((f) => fs.readFileSync(path.join(projectRoot, f), "utf8")).join("\n");
    assert(!/type=["']password["']|password/i.test(shellText), "login shell must not contain password fields/wording");
    mark("no password fields", true, "no password input or wording");
    assert(!/\bsign[\s-]?up\b|signup/i.test(shellText), "login shell must not contain signup UI");
    mark("no signup UI", true, "no sign-up wording");
    assert(!/magic[\s_-]?link/i.test(shellText), "login shell must not mention magic link");
    mark("no magic-link wording", true, "no magic link wording");
    assert(!/\bOTP\b|one[\s-]time[\s-]password|verifyOtp/i.test(shellText), "login shell must not mention OTP");
    mark("no OTP wording", true, "no OTP wording");
    assert(!/reset[\s_-]?password|resetPasswordForEmail/i.test(shellText), "login shell must not mention reset password");
    mark("no reset-password wording", true, "no reset-password wording");

    // No Supabase auth runtime in the login shell module/component.
    assert(!/@supabase\/[a-z-]+|createClient\s*\(|supabase\.auth|signInWith|signUp\s*\(/i.test(shellText), "login shell must not call Supabase auth");
    mark("no Supabase auth calls", true, "no supabase client/auth/signIn/signUp in login shell");

    // Repo-wide static safety.
    const srcRoot = path.join(projectRoot, "src");
    const srcFiles = walk(srcRoot);
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

    const serviceRolePattern = /sb_secret_[A-Za-z0-9._-]{12,}|SUPABASE_SERVICE_ROLE_KEY|WSS_SUPABASE_SERVICE_ROLE/i;
    assert(!serviceRolePattern.test(shellText), "service-role usage in login shell");
    mark("no service-role usage", true, "no service-role key/env in login shell");

    mark("local login-shell validation", true, "state model + UI + static safety passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local login-shell validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
