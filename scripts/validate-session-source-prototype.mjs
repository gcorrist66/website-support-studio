import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const SOURCE_FILE = path.join(projectRoot, "src/components/auth/SessionSourcePrototype.tsx");
const APP_FILE = path.join(projectRoot, "src/components/shell/AppShell.tsx");
const CHECKS = [];
const failures = [];

function mark(name, passed, detail) {
  CHECKS.push({ name, passed, detail });
  if (!passed) failures.push(`${name}: ${detail}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(entry.name)) {
        continue;
      }
      walk(path.join(dir, entry.name), acc);
    } else {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

try {
  // Files exist and are import-linked.
  assert(fs.existsSync(SOURCE_FILE), "SessionSourcePrototype component missing");
  mark("session-source component exists", true, "src/components/auth/SessionSourcePrototype.tsx");

  const appText = fs.readFileSync(APP_FILE, "utf8");
  const sourceText = fs.readFileSync(SOURCE_FILE, "utf8");

  assert(/SessionSourcePrototype/.test(appText), "AppShell must import and render SessionSourcePrototype");
  assert(/<SessionSourcePrototype\s*\/>/.test(appText), "AppShell must render SessionSourcePrototype");
  mark("AppShell references SessionSourcePrototype", true, "prototype card is rendered in AppShell");

  assert(/createExistingSessionShapeReadState/.test(sourceText), "prototype must read through existing session-read pipeline helper");
  assert(/statusFromReadState|statusFrom/.test(sourceText), "prototype must translate read results into shell states");
  mark("prototype wired to read-path helper", true, "session read path used directly in prototype");

  const banned = /\bmagic[\s_-]?link\b|OTP|one[\s-]time[\s-]password|reset\s*password|resetPassword|sign[\s-]up|signup|password\b/i;
  assert(!banned.test(sourceText), "prototype must not include forbidden auth setup wording");
  mark("no forbidden auth setup wording", true, "no signup/password/magic-link/OTP wording in prototype file");

  assert(!/signInWith\(|signUp\(|signOut\(|resetPasswordForEmail|admin\.createUser|createUser\(/i.test(sourceText), "prototype must not call auth runtime");
  mark("no auth runtime calls", true, "prototype does not call Supabase auth runtime");

  // Security posture checks: no sign-in pages / middleware introduced by this phase.
  const srcFiles = walk(path.join(projectRoot, "src"));
  const loginFileExceptions = new Set(["loginshell.tsx", "loginshellstate.ts", "sessionsourceprototype.tsx"]);
  const badLoginUi = srcFiles.filter((filePath) => {
    const baseName = path.basename(filePath).toLowerCase();
    if (loginFileExceptions.has(baseName)) {
      return false;
    }
    return /(login|signin|sign-in|signup|sign-up|logout)(?!-[a-z])/i.test(baseName);
  }).length;
  assert(badLoginUi === 0, `login UI files remain absent after prototype: ${badLoginUi} matches`);
  const middlewareLike = srcFiles.filter((f) => /middleware\.(t|j)sx?$/i.test(path.basename(f))).length;
  assert(middlewareLike === 0, `route middleware files exist: ${middlewareLike}`);
  for (const bad of ["api", "routes", "server"]) {
    assert(!fs.existsSync(path.join(projectRoot, "src", bad)), `forbidden src/${bad} exists`);
  }
  mark("no route middleware / API routes", true, "no middleware, api, routes, or server directories");

  // Route prototype behavior marker.
  assert(/route simulation|access denied|protected route simulation/i.test(sourceText), "prototype should expose protected route simulation");
  mark("route-guard simulation present", true, "prototype includes local protected-route decision");

  console.log(JSON.stringify({ status: "pass", checks: CHECKS }, null, 2));
} catch (error) {
  mark("session-source prototype validation", false, error instanceof Error ? error.message : String(error));
  console.log(JSON.stringify({ status: "fail", checks: CHECKS, failures }, null, 2));
  process.exit(1);
}
