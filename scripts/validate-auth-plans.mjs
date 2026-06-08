import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const PLAN_FILES = [
  "PHASE7_LOGIN_UI_PLAN.md",
  "PHASE7_ROUTE_PROTECTION_PLAN.md",
  "PHASE7_RLS_PLAN.md",
  "PHASE7_PRODUCTION_AUTH_SAFETY_CHECKLIST.md",
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

function main() {
  try {
    // 1) Plan docs exist.
    for (const file of PLAN_FILES) {
      assert(fs.existsSync(path.join(projectRoot, file)), `missing plan doc: ${file}`);
    }
    mark("all Phase 7 plan docs exist", true, PLAN_FILES.join(", "));

    const combined = PLAN_FILES.map((f) => fs.readFileSync(path.join(projectRoot, f), "utf8")).join("\n\n");

    // 2) Required concepts appear in the plans.
    assert(/no public signup/i.test(combined), "plans must state: no public signup");
    mark("plans mention no public signup", true, "'no public signup' present");

    assert(/no service-role key in the browser|no service-role in (the )?browser|service-role key never appears/i.test(combined), "plans must state: no service-role in browser");
    mark("plans mention no service-role in browser", true, "no service-role key in browser stated");

    assert(/(rls|row level security)[\s\S]{0,120}(before|until)[\s\S]{0,60}auth|before auth session is proven|not be enabled before auth|rls\s+remains\s+disabled/i.test(combined), "plans must state: no RLS until auth proven");
    mark("plans mention no RLS until auth proven", true, "RLS deferred until auth session proven");

    assert(/auth_user_id/i.test(combined) && /link(age|ed)/i.test(combined), "plans must mention operator auth_user_id linkage");
    mark("plans mention operator auth_user_id linkage", true, "auth_user_id linkage referenced");

    assert(/no customer portal/i.test(combined), "plans must state: no customer portal yet");
    mark("plans mention no customer portal yet", true, "'no customer portal' present");

    // 3) Static safety: no login UI / route middleware / API routes / RLS migration / service-role in src.
    const srcRoot = path.join(projectRoot, "src");
    const srcFiles = walk(srcRoot);

    const loginLike = srcFiles.filter((f) => /(^|[^a-z])(login|signin|sign-in|signup|sign-up|logout)([^a-z]|$)/i.test(path.basename(f)));
    assert(loginLike.length === 0, `login UI files exist: ${loginLike.join(", ")}`);
    mark("no login UI files exist", true, "no Login/SignIn/SignUp/Logout files present");

    const middlewareLike = srcFiles.filter((f) => /middleware\.(t|j)sx?$/.test(path.basename(f)));
    assert(middlewareLike.length === 0, `route middleware files exist: ${middlewareLike.join(", ")}`);
    mark("no route middleware exists", true, "no middleware.* files present");

    for (const bad of ["api", "routes", "server"]) {
      assert(!fs.existsSync(path.join(srcRoot, bad)), `forbidden src/${bad} directory exists`);
    }
    const routeLike = srcFiles.filter((f) => /[\\/](app|pages|routes)[\\/]/.test(f.replaceAll("\\", "/")));
    assert(routeLike.length === 0, `route-like paths exist: ${routeLike.join(", ")}`);
    mark("no API route files exist", true, "no src/api|routes|server, no app/pages/routes");

    const migrationsDir = path.join(projectRoot, "supabase", "migrations");
    const migrationText = fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir).filter((n) => n.endsWith(".sql")).map((n) => fs.readFileSync(path.join(migrationsDir, n), "utf8")).join("\n")
      : "";
    assert(!/enable\s+row\s+level\s+security/i.test(migrationText), "an RLS migration (enable row level security) was added");
    mark("no RLS migration added", true, "no enable-row-level-security in supabase/migrations");

    // A real service-role KEY value (sb_secret_<key>) or a service-role env-var NAME used to build a
    // privileged client. A bare `startsWith("sb_secret_")` rejection guard (defensive, rejects secret
    // keys) is intentionally NOT flagged — that is the opposite of exposure.
    const serviceRolePattern = /sb_secret_[A-Za-z0-9._-]{12,}|SUPABASE_SERVICE_ROLE_KEY|WSS_SUPABASE_SERVICE_ROLE/i;
    const offenders = srcFiles
      .filter((f) => /\.(ts|tsx|js|jsx)$/.test(f))
      .filter((f) => serviceRolePattern.test(fs.readFileSync(f, "utf8")));
    assert(offenders.length === 0, `service-role key reference in source: ${offenders.join(", ")}`);
    mark("no service-role key in source", true, "no real service-role key value or service-role env-name in src");

    mark("local auth-plans validation", true, "plan docs present + required content + static safety");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local auth-plans validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
