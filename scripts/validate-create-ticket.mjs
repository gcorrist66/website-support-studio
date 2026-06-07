import fs from "node:fs";
import os from "node:os";
import { randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = new Set(["dev", "development", "local"]);

const filesToCompile = [
  "src/domain/ticketStatus.ts",
  "src/domain/transitions.ts",
  "src/domain/ticketLifecycle.ts",
  "src/domain/types.ts",
  "src/contracts/ticketWorkflowContracts.ts",
  "src/contracts/contractGuards.ts",
  "src/persistence/schemaTypes.ts",
  "src/persistence/ticketMappers.ts",
  "src/persistence/persistenceGuards.ts",
  "src/persistence/supabaseAdapter.ts",
  "src/utils/runtimeUuid.ts",
  "src/services/ticketRepository.ts",
  "src/services/ticketWorkflowService.ts",
  "src/handlers/ticketWorkflowHandlers.ts",
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

function isSupabaseAuthFailure(message) {
  const normalized = `${message}`.toLowerCase();
  return normalized.includes("sasl") || normalized.includes("28p01") || normalized.includes("password authentication failed");
}

function queryRowsWithGuard(querySql, sql) {
  try {
    return querySql(sql);
  } catch (error) {
    const output = `${error?.message ?? ""} ${error?.stderr?.toString?.() ?? ""}`;
    if (isSupabaseAuthFailure(output)) {
      throw new Error("Supabase validation blocked by auth failure (SASL/28P01). Refresh local credentials and rerun with explicit dev env guard.");
    }
    throw error;
  }
}

function assertLocalExecutionGuard() {
  const allow = process.env.WSS_ALLOW_SUPABASE_VALIDATION;
  const environment = process.env.WSS_SUPABASE_ENVIRONMENT;
  const projectRef = process.env.WSS_SUPABASE_PROJECT_REF;

  assert(allow === "dev", "Set WSS_ALLOW_SUPABASE_VALIDATION=dev.");
  assert(Boolean(projectRef), "Set WSS_SUPABASE_PROJECT_REF.");
  assert(projectRef === DEV_PROJECT_REF, `Unexpected WSS_SUPABASE_PROJECT_REF ${projectRef}; expected ${DEV_PROJECT_REF}.`);
  assert(Boolean(environment), "Set WSS_SUPABASE_ENVIRONMENT.");
  assert(ALLOWED_NON_PRODUCTION_ENVS.has(environment.toLowerCase()), "Set WSS_SUPABASE_ENVIRONMENT to dev|development|local.");
}

function assertLocalConfig() {
  const configPath = path.join(projectRoot, ".supabase", "config.toml");
  assert(fs.existsSync(configPath), "Missing local Supabase link metadata (.supabase/config.toml).");
  const configText = fs.readFileSync(configPath, "utf8");
  assert(configText.includes(DEV_PROJECT_REF), "Local Supabase link is not expected WSS dev project reference.");
}

function countRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return 0;
  }
  const value = rows[0]?.count ?? rows[0]?.COUNT ?? 0;
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

function transpileProjectModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-create-ticket-validate-"));
  const targetRoot = path.join(tmpDir, "src");

  for (const file of filesToCompile) {
    const sourcePath = path.join(projectRoot, file);
    const sourceText = fs.readFileSync(sourcePath, "utf8");
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
      const firstDiagnostic = output.diagnostics[0];
      throw new Error(`TypeScript transpile failure for ${file}: ${firstDiagnostic.messageText}`);
    }

    const relativeOutput = file.replace(/^src\//, "").replace(/\.ts$/, ".js");
    const outputPath = path.join(targetRoot, relativeOutput);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output.outputText, "utf8");
  }

  return targetRoot;
}

async function loadRuntimeModules(targetRoot) {
  const base = targetRoot;

  const ticketLifecycle = await import(pathToFileURL(path.join(base, "domain", "ticketLifecycle.js")).href);
  const ticketStatus = await import(pathToFileURL(path.join(base, "domain", "ticketStatus.js")).href);
  const ticketWorkflowService = await import(
    pathToFileURL(path.join(base, "services", "ticketWorkflowService.js")).href,
  );
  const ticketWorkflowHandlers = await import(
    pathToFileURL(path.join(base, "handlers", "ticketWorkflowHandlers.js")).href,
  );
  const ticketRepository = await import(
    pathToFileURL(path.join(base, "services", "ticketRepository.js")).href,
  );

  return {
    ...ticketLifecycle,
    ...ticketStatus,
    ...ticketWorkflowService,
    ...ticketWorkflowHandlers,
    ...ticketRepository,
  };
}

function runCreateTicketScenarios(runtime) {
  const {
    handleCreateTicket,
    cleanupWorkflowSession,
    getWorkflowSession,
    ActorRole,
    querySql,
    assertLocalExecutionGate,
  } = runtime;

  assertLocalExecutionGate();
  queryRowsWithGuard(querySql, "select 'phase5b-smoke' as smoke_check;");

  const runId = randomUUID();
  const tenantContext = {
    agencyId: randomUUID(),
    clientId: randomUUID(),
    siteId: randomUUID(),
  };
  const actorContext = {
    actorRole: ActorRole.CS_AGENT,
    actorReference: `cs-${runId}`,
  };

  const created = handleCreateTicket({
    tenantContext,
    actorContext,
    ticket: {
      rawMessage: "Customer reports login issues after deployment.",
      intakeChannel: "operator_portal",
      source: "validate-create-ticket",
      title: "Customer cannot log in",
      priority: "high",
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: `${runId}+customer@example.com`,
      },
    },
  });
  assert(created.status === "success", "valid create request should succeed");

  const ticketId = created.response.ticketId;
  const ticketRows = queryRowsWithGuard(
    querySql,
    `select id, agency_id, client_id, site_id, status from public.tickets where id='${ticketId}';`,
  );
  assert(ticketRows.length === 1, "created ticket row should be persisted");
  assert(ticketRows[0].agency_id === tenantContext.agencyId, "agency_id should persist");
  assert(ticketRows[0].client_id === tenantContext.clientId, "client_id should persist");
  assert(ticketRows[0].site_id === tenantContext.siteId, "site_id should persist");
  assert(ticketRows[0].status === "received", "create should persist status=received");

  const auditRows = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${ticketId}' order by occurred_at asc;`,
  );
  const eventTypes = auditRows.map((row) => row.event_type);
  assert(eventTypes.includes("ticket_created"), "ticket_created audit event should exist");

  const draftCount = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_draft_replies where ticket_id='${ticketId}';`),
  );
  const approvalCount = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_approvals where ticket_id='${ticketId}';`),
  );
  const communicationCount = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_communications where ticket_id='${ticketId}';`),
  );
  assert(draftCount === 0, "create should not write draft replies");
  assert(approvalCount === 0, "create should not write approvals");
  assert(communicationCount === 0, "create should not write communication rows");

  const invalidTitle = handleCreateTicket({
    tenantContext,
    actorContext,
    ticket: {
      rawMessage: "missing title",
      intakeChannel: "operator_portal",
      source: "validate-create-ticket",
      submitter: {
        submitterEmail: `${runId}+missing-title@example.com`,
      },
    },
  });
  assert(invalidTitle.status === "error", "missing title should fail");

  const invalidDescription = handleCreateTicket({
    tenantContext,
    actorContext,
    ticket: {
      title: "Missing description",
      rawMessage: "   ",
      intakeChannel: "operator_portal",
      source: "validate-create-ticket",
      submitter: {
        submitterEmail: `${runId}+missing-description@example.com`,
      },
    },
  });
  assert(invalidDescription.status === "error", "missing description should fail");

  const invalidEmail = handleCreateTicket({
    tenantContext,
    actorContext,
    ticket: {
      title: "Missing email",
      rawMessage: "Missing submitter email test",
      intakeChannel: "operator_portal",
      source: "validate-create-ticket",
    },
  });
  assert(invalidEmail.status === "error", "missing submitter email should fail");

  mark("valid create persists ticket", true, `ticket ${ticketId} persisted with status ${ticketRows[0].status}`);
  mark("create audit coverage", true, "ticket_created audit event persisted");
  mark("create does not create draft/approval/communication rows", true, "zero draft/approval/communication rows for create-only flow");
  mark("invalid create cases rejected", true, "title, description, email validation guards are enforced");

  const session = getWorkflowSession(ticketId);
  if (session && typeof cleanupWorkflowSession === "function") {
    cleanupWorkflowSession(ticketId);
  }

  const cleanupRows = [
    `delete from public.ticket_communications where ticket_id='${ticketId}';`,
    `delete from public.ticket_approvals where ticket_id='${ticketId}';`,
    `delete from public.ticket_draft_replies where ticket_id='${ticketId}';`,
    `delete from public.ticket_messages where ticket_id='${ticketId}';`,
    `delete from public.ticket_audit_events where ticket_id='${ticketId}';`,
    `delete from public.tickets where id='${ticketId}';`,
    `delete from public.sites where id='${tenantContext.siteId}';`,
    `delete from public.clients where id='${tenantContext.clientId}';`,
    `delete from public.agencies where id='${tenantContext.agencyId}';`,
  ];

  for (const statement of cleanupRows) {
    try {
      queryRowsWithGuard(querySql, statement);
    } catch {
      // best-effort cleanup
    }
  }

  const ticketPostCount = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.tickets where id='${ticketId}';`),
  );
  const auditPostCount = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_audit_events where ticket_id='${ticketId}';`),
  );
  assert(ticketPostCount === 0, "ticket cleanup should remove ticket row");
  assert(auditPostCount === 0, "cleanup should remove ticket audits");
  mark("cleanup removes test records", true, "created ticket rows and audit rows removed");
}

async function main() {
  try {
    assertLocalExecutionGuard();
    assertLocalConfig();

    const tmpDir = transpileProjectModules();
    try {
      const runtime = await loadRuntimeModules(tmpDir);
      runCreateTicketScenarios(runtime);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local Supabase execution guard", true, "WSS_ALLOW_SUPABASE_VALIDATION=dev, correct project ref, and non-production env set");
    mark("local create-ticket validation", true, "create, invalid validation, and cleanup scenarios passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local create-ticket validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
