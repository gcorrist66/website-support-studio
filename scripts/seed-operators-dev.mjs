// Phase 6G — Apply the dev-only operator seed to the Supabase DEV project.
//
// Guarded, idempotent, dev-only. Applies supabase/seed/phase6g_dev_operators.sql via
// `supabase db query --linked`. Refuses to run unless the explicit dev env guard is set AND
// the linked project is the expected dev project. Inserts NOTHING into production.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const projectRoot = process.cwd();
const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = ["dev", "development", "local"];
const SEED_FILE = path.join(projectRoot, "supabase", "seed", "phase6g_dev_operators.sql");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDevGuard() {
  const allow = process.env.WSS_ALLOW_SUPABASE_VALIDATION;
  const environment = process.env.WSS_SUPABASE_ENVIRONMENT;
  const projectRef = process.env.WSS_SUPABASE_PROJECT_REF;

  assert(allow === "dev", "Refusing to seed without explicit opt-in. Set WSS_ALLOW_SUPABASE_VALIDATION=dev.");
  assert(Boolean(projectRef), "Set WSS_SUPABASE_PROJECT_REF.");
  assert(projectRef === DEV_PROJECT_REF, `Unexpected WSS_SUPABASE_PROJECT_REF ${projectRef}; expected dev ref ${DEV_PROJECT_REF}.`);
  assert(Boolean(environment), "Set WSS_SUPABASE_ENVIRONMENT.");
  assert(
    ALLOWED_NON_PRODUCTION_ENVS.includes(String(environment).toLowerCase()),
    "Set WSS_SUPABASE_ENVIRONMENT to dev|development|local.",
  );

  const configPath = path.join(projectRoot, ".supabase", "config.toml");
  assert(fs.existsSync(configPath), "Missing local Supabase link (.supabase/config.toml).");
  const configText = fs.readFileSync(configPath, "utf8");
  assert(configText.includes(DEV_PROJECT_REF), "Linked Supabase project is not the expected WSS dev project.");
}

function stripSqlComments(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function splitStatements(sql) {
  return stripSqlComments(sql)
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => `${s};`);
}

function runSql(sql) {
  const out = execFileSync("supabase", ["db", "query", "--linked", "--output", "json", sql], {
    encoding: "utf8",
    timeout: 120000,
  });
  return out;
}

function main() {
  try {
    assertDevGuard();
    assert(fs.existsSync(SEED_FILE), `Missing seed file: ${SEED_FILE}`);

    const sql = fs.readFileSync(SEED_FILE, "utf8");
    const statements = splitStatements(sql);
    assert(statements.length >= 2, "expected at least the agency + operators seed statements");

    for (const statement of statements) {
      runSql(statement);
    }

    // Report the resulting seed state (count of the three seed operators).
    const verify = runSql(
      "select count(*)::int as seeded from public.operators where email in " +
        "('agency.admin@wss-dev.test','cs.agent@wss-dev.test','gary.approver@wss-dev.test');",
    );

    console.log(
      JSON.stringify(
        {
          status: "applied",
          statementsRun: statements.length,
          seedFile: "supabase/seed/phase6g_dev_operators.sql",
          devProjectRef: DEV_PROJECT_REF,
          verify: verify.includes('"seeded"') ? "seed operators present" : verify,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.log(JSON.stringify({ status: "fail", error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exit(1);
  }
}

main();
