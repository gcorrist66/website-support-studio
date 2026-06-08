// Phase 6M-DB — Guarded dev verification of operator ↔ auth_user_id linkage (Supabase DEV only).
//
// Temporarily links a seeded dev operator to a SYNTHETIC auth_user_id (NOT a real Supabase Auth
// user), reads it back, proves the unique-link constraint rejects a duplicate, then clears the link
// and verifies cleanup. Never creates real auth users, never logs in, never enables RLS.
//
// auth_user_id has no FK to auth.users (it is a plain nullable uuid with a partial unique index),
// so a synthetic uuid is safe and fully reversible.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const projectRoot = process.cwd();
const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = ["dev", "development", "local"];

const SYNTHETIC_AUTH_USER_ID = "00000000-0000-4000-8000-00000000a001";
const SEED_EMAILS = ["agency.admin@wss-dev.test", "cs.agent@wss-dev.test", "gary.approver@wss-dev.test"];
const EMAIL_LIST = SEED_EMAILS.map((e) => `'${e}'`).join(",");
const LINK_TARGET = "cs.agent@wss-dev.test";
const DUP_TARGET = "gary.approver@wss-dev.test";

const checks = [];
const failures = [];

function mark(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) failures.push(`${name}: ${detail}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertDevGuard() {
  assert(process.env.WSS_ALLOW_SUPABASE_VALIDATION === "dev", "Set WSS_ALLOW_SUPABASE_VALIDATION=dev.");
  assert(process.env.WSS_SUPABASE_PROJECT_REF === DEV_PROJECT_REF, `Set WSS_SUPABASE_PROJECT_REF=${DEV_PROJECT_REF}.`);
  const env = process.env.WSS_SUPABASE_ENVIRONMENT;
  assert(env && ALLOWED_NON_PRODUCTION_ENVS.includes(String(env).toLowerCase()), "Set WSS_SUPABASE_ENVIRONMENT=dev|development|local.");
  const configPath = path.join(projectRoot, ".supabase", "config.toml");
  assert(fs.existsSync(configPath) && fs.readFileSync(configPath, "utf8").includes(DEV_PROJECT_REF), "Linked Supabase project is not the expected WSS dev project.");
}

function runSqlRaw(sql) {
  return execFileSync("supabase", ["db", "query", "--linked", "--output", "json", sql], { encoding: "utf8", timeout: 120000 });
}

function queryRows(sql) {
  const out = runSqlRaw(sql);
  const start = out.indexOf("{");
  const end = out.lastIndexOf("}");
  assert(start >= 0 && end >= 0, "unexpected supabase db query output");
  const parsed = JSON.parse(out.slice(start, end + 1));
  return Array.isArray(parsed.rows) ? parsed.rows : [];
}

function runExpectingError(sql) {
  try {
    runSqlRaw(sql);
    return { errored: false, output: "" };
  } catch (error) {
    const output = `${error?.message ?? ""} ${error?.stderr?.toString?.() ?? ""} ${error?.stdout?.toString?.() ?? ""}`;
    return { errored: true, output };
  }
}

function clearLinks() {
  try {
    runSqlRaw(`update public.operators set auth_user_id = null where email in (${EMAIL_LIST});`);
  } catch {
    // best-effort cleanup
  }
}

function main() {
  try {
    assertDevGuard();

    // Seeded operators exist.
    const seedRows = queryRows(`select email from public.operators where email in (${EMAIL_LIST}) order by email;`);
    assert(seedRows.length === 3, `expected 3 seeded dev operators, found ${seedRows.length}`);
    mark("seeded operators exist", true, "3 dev operators present");

    // Start clean.
    clearLinks();

    // Link one operator to a synthetic auth_user_id.
    runSqlRaw(`update public.operators set auth_user_id = '${SYNTHETIC_AUTH_USER_ID}' where email = '${LINK_TARGET}';`);
    const linked = queryRows(`select email, auth_user_id from public.operators where auth_user_id = '${SYNTHETIC_AUTH_USER_ID}';`);
    assert(linked.length === 1 && linked[0].email === LINK_TARGET, "linked operator should read back by auth_user_id");
    mark("operator links to synthetic auth_user_id", true, `${LINK_TARGET} linked and resolvable by auth_user_id`);

    // Unique behavior: a second operator cannot take the same auth_user_id.
    const dup = runExpectingError(`update public.operators set auth_user_id = '${SYNTHETIC_AUTH_USER_ID}' where email = '${DUP_TARGET}';`);
    assert(dup.errored, "duplicate auth_user_id link should be rejected by the DB");
    assert(/unique|duplicate|operators_auth_user_id_unique_idx/i.test(dup.output), `duplicate rejection should cite the unique index (got: ${dup.output.slice(0, 200)})`);
    mark("unique auth_user_id enforced", true, "second operator rejected by partial unique index");

    // The duplicate-target operator remains unlinked.
    const dupRow = queryRows(`select auth_user_id from public.operators where email = '${DUP_TARGET}';`);
    assert(dupRow.length === 1 && dupRow[0].auth_user_id === null, "duplicate-target operator must remain unlinked");
    mark("rejected link left no side effect", true, `${DUP_TARGET} stays unlinked after rejected duplicate`);

    // Cleanup: clear the link, operator rows preserved.
    runSqlRaw(`update public.operators set auth_user_id = null where email = '${LINK_TARGET}';`);
    const afterClear = queryRows(`select count(*)::int as linked from public.operators where email in (${EMAIL_LIST}) and auth_user_id is not null;`);
    assert(afterClear[0]?.linked === 0, "all seed operators should be unlinked after cleanup");
    const stillThree = queryRows(`select count(*)::int as c from public.operators where email in (${EMAIL_LIST});`);
    assert(stillThree[0]?.c === 3, "operator rows must be preserved after unlinking");
    mark("unlink clears auth_user_id and preserves rows", true, "links cleared; 3 operator rows intact");

    // RLS still disabled.
    const rls = queryRows("select relrowsecurity as rls from pg_class where relname='operators' and relnamespace='public'::regnamespace;");
    assert(rls[0] && rls[0].rls === false, "RLS must remain disabled on operators");
    mark("RLS remains disabled", true, "operators.relrowsecurity = false");

    mark("local auth-linkage-db validation", true, "dev linkage set/read/unique/cleanup verified; no real auth users; no RLS");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local auth-linkage-db validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    clearLinks();
    process.exit(1);
  } finally {
    // Ensure no link is left behind under any outcome.
    clearLinks();
  }
}

main();
