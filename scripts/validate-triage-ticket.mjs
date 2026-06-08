import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-triage-ticket-validate-"));
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

  return { tmpDir, targetRoot };
}

async function loadRuntimeModules(tmpRoot) {
  const base = tmpRoot;

  const ticketLifecycle = await import(pathToFileURL(path.join(base, "domain", "ticketLifecycle.js")).href);
  const ticketStatus = await import(pathToFileURL(path.join(base, "domain", "ticketStatus.js")).href);
  const ticketWorkflowService = await import(pathToFileURL(path.join(base, "services", "ticketWorkflowService.js")).href);
  const ticketWorkflowHandlers = await import(pathToFileURL(path.join(base, "handlers", "ticketWorkflowHandlers.js")).href);
  const ticketRepository = await import(pathToFileURL(path.join(base, "services", "ticketRepository.js")).href);

  return {
    ...ticketLifecycle,
    ...ticketStatus,
    ...ticketWorkflowService,
    ...ticketWorkflowHandlers,
    ...ticketRepository,
  };
}

function expectFailureWithStatus(result, expectedPrefix, name) {
  assert(result.status === "error", `${name} expected error`);
  if (expectedPrefix && !`${result.error}`.toLowerCase().includes(expectedPrefix.toLowerCase())) {
    throw new Error(`${name} error mismatch: ${result.error}`);
  }
}

function runTriageScenario(runtime) {
  const {
    ActorRole,
    handleCreateTicket,
    handleTriageTicket,
    cleanupWorkflowSession,
    querySql,
  } = runtime;

  const runId = randomUUID();

  const baseActor = {
    actorRole: ActorRole.CS_AGENT,
    actorReference: `operator-${runId}`,
  };

  const baseIds = {
    agency: randomUUID(),
    client: randomUUID(),
    site: randomUUID(),
  };
  const failIds = {
    agency: randomUUID(),
    client: randomUUID(),
    site: randomUUID(),
  };

  const baseTenantContext = {
    agencyId: baseIds.agency,
    clientId: baseIds.client,
    siteId: baseIds.site,
  };
  const unauthIds = {
    agency: randomUUID(),
    client: randomUUID(),
    site: randomUUID(),
  };

  const created = handleCreateTicket({
    tenantContext: {
      agencyId: baseIds.agency,
      clientId: baseIds.client,
      siteId: baseIds.site,
    },
    actorContext: baseActor,
    ticket: {
      rawMessage: "Checkout widget intermittently fails on mobile.",
      intakeChannel: "operator_portal",
      source: "validate-triage-ticket",
      title: "Checkout issue requires triage",
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: `${runId}+customer@example.com`,
      },
      priority: "high",
      identityConfidence: "known",
    },
  });

  assert(created.status === "success", "create helper should succeed");
  const firstTicketId = created.response.ticketId;
  assert(typeof firstTicketId === "string" && firstTicketId.length > 0, "created ticket id should be available");

  const triaged = handleTriageTicket({
    tenantContext: baseTenantContext,
    actorContext: baseActor,
    ticketId: firstTicketId,
    rationale: "CS agent triage from 5C validation",
  });
  assert(
    triaged.status === "success",
    `received ticket should triage to triaged (got ${triaged.status}: ${triaged.error ?? "no error"})`,
  );

  const triagedRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${firstTicketId}';`,
  );
  assert(triagedRows[0]?.status === "triaged", "ticket status should be triaged after triage transition");

  const triageEvents = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${firstTicketId}' order by occurred_at asc;`,
  ).map((row) => row.event_type);
  assert(
    triageEvents.includes("ticket_triaged"),
    "triage must emit ticket_triaged audit event",
  );

  const draftRows = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_draft_replies where ticket_id='${firstTicketId}';`),
  );
  const approvalRows = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_approvals where ticket_id='${firstTicketId}';`),
  );
  const communicationRows = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_communications where ticket_id='${firstTicketId}';`),
  );
  assert(draftRows === 0, "triage should not create draft replies");
  assert(approvalRows === 0, "triage should not create approvals");
  assert(communicationRows === 0, "triage should not create communications");

  const secondTicket = handleCreateTicket({
    tenantContext: {
      agencyId: failIds.agency,
      clientId: failIds.client,
      siteId: failIds.site,
    },
    actorContext: baseActor,
    ticket: {
      rawMessage: "Already triaged ticket should reject second triage attempt.",
      intakeChannel: "operator_portal",
      source: "validate-triage-ticket",
      title: "Second ticket for 5C non-received fail path",
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: `${runId}+second@example.com`,
      },
    },
  });
  assert(secondTicket.status === "success", "second create helper should succeed");
  const secondTicketId = secondTicket.response.ticketId;

  const duplicateTriaged = handleTriageTicket({
    tenantContext: {
      agencyId: failIds.agency,
      clientId: failIds.client,
      siteId: failIds.site,
    },
    actorContext: baseActor,
    ticketId: secondTicketId,
    rationale: "triage once",
  });
  assert(duplicateTriaged.status === "success", "second create should triage successfully once");

  const duplicateFail = handleTriageTicket({
    tenantContext: {
      agencyId: failIds.agency,
      clientId: failIds.client,
      siteId: failIds.site,
    },
    actorContext: baseActor,
    ticketId: secondTicketId,
    rationale: "invalid second triage attempt",
  });
  expectFailureWithStatus(duplicateFail, "invalid_transition", "non-received triage should fail");

  const unauthorizedTicketCreated = (() => {
    const createdTicket = handleCreateTicket({
      tenantContext: {
        agencyId: unauthIds.agency,
        clientId: unauthIds.client,
        siteId: unauthIds.site,
      },
      actorContext: baseActor,
      ticket: {
        rawMessage: "Site user should not triage.",
        intakeChannel: "operator_portal",
        source: "validate-triage-ticket",
        title: "Unauthorized triage actor check",
        submitter: {
          submitterName: "Validation Customer",
          submitterEmail: `${runId}+unauth@example.com`,
        },
      },
    });
    assert(createdTicket.status === "success", "unauthorized triage setup ticket should be created");
    return createdTicket.response.ticketId;
  })();

  const unauthorized = handleTriageTicket({
    tenantContext: {
      agencyId: unauthIds.agency,
      clientId: unauthIds.client,
      siteId: unauthIds.site,
    },
    actorContext: {
      actorRole: ActorRole.SITE_USER,
      actorReference: `site-user-${runId}`,
    },
    ticketId: unauthorizedTicketCreated,
    rationale: "unauthorized role triage attempt",
  });
  expectFailureWithStatus(unauthorized, "not allowed", "unauthorized triage actor should fail");

  const missingTenant = handleTriageTicket({
    actorContext: baseActor,
    ticketId: firstTicketId,
    rationale: "missing tenant context should fail",
  });
  expectFailureWithStatus(missingTenant, "tenant context", "missing tenant context should fail");

  const missingActor = handleTriageTicket({
    tenantContext: baseTenantContext,
    ticketId: firstTicketId,
    rationale: "missing actor context should fail",
  });
  expectFailureWithStatus(missingActor, "actor context", "missing actor context should fail");

  const tenantRows = queryRowsWithGuard(
    querySql,
    `select t.agency_id, t.client_id, t.site_id, c.agency_id as client_agency_id, s.client_id as site_client_id
       from public.tickets t
       join public.clients c on c.id = t.client_id
       join public.sites s on s.id = t.site_id
      where t.id='${firstTicketId}';`,
  );
  assert(tenantRows.length === 1, "tenant hierarchy should be persisted and queryable");
  assert(tenantRows[0].agency_id === tenantRows[0].client_agency_id, "ticket agency_id should match client tenant");
  assert(tenantRows[0].client_id === tenantRows[0].site_client_id, "ticket client_id should match site tenant");

  if (typeof cleanupWorkflowSession === "function") {
    cleanupWorkflowSession(firstTicketId);
    cleanupWorkflowSession(secondTicketId);
    cleanupWorkflowSession(unauthorizedTicketCreated);
  }

  const cleanupRows = [
    `delete from public.ticket_communications where ticket_id='${firstTicketId}' or ticket_id='${secondTicketId}' or ticket_id='${unauthorizedTicketCreated}';`,
    `delete from public.ticket_approvals where ticket_id='${firstTicketId}' or ticket_id='${secondTicketId}' or ticket_id='${unauthorizedTicketCreated}';`,
    `delete from public.ticket_draft_replies where ticket_id='${firstTicketId}' or ticket_id='${secondTicketId}' or ticket_id='${unauthorizedTicketCreated}';`,
    `delete from public.ticket_audit_events where ticket_id='${firstTicketId}' or ticket_id='${secondTicketId}' or ticket_id='${unauthorizedTicketCreated}';`,
    `delete from public.ticket_messages where ticket_id='${firstTicketId}' or ticket_id='${secondTicketId}' or ticket_id='${unauthorizedTicketCreated}';`,
    `delete from public.tickets where id='${firstTicketId}' or id='${secondTicketId}' or id='${unauthorizedTicketCreated}';`,
    `delete from public.sites where id='${baseIds.site}' or id='${failIds.site}' or id='${unauthIds.site}';`,
    `delete from public.clients where id='${baseIds.client}' or id='${failIds.client}' or id='${unauthIds.client}';`,
    `delete from public.agencies where id='${baseIds.agency}' or id='${failIds.agency}' or id='${unauthIds.agency}';`,
  ];

  for (const statement of cleanupRows) {
    try {
      queryRowsWithGuard(querySql, statement);
    } catch {
      // best-effort cleanup
    }
  }

  const postTicketCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.tickets where id='${firstTicketId}' or id='${secondTicketId}' or id='${unauthorizedTicketCreated}';`,
    ),
  );
  const postAuditCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_audit_events where ticket_id='${firstTicketId}' or ticket_id='${secondTicketId}' or ticket_id='${unauthorizedTicketCreated}';`,
    ),
  );

  assert(postTicketCount === 0, "cleanup should remove ticket test rows");
  assert(postAuditCount === 0, "cleanup should remove test audit rows");

  mark("received to triaged transition", true, `ticket ${firstTicketId} moved to triaged and preserved triage audit`);
  mark("non-received triage is blocked", true, "already triaged transition to triaged is rejected");
  mark("unauthorized actor blocked", true, "SITE_USER triage is rejected");
  mark("tenant context required", true, "missing tenant context is rejected");
  mark("actor context required", true, "missing actor context is rejected");
  mark("triage writes no drafts/approvals/communications", true, "no draft, approval, or communication rows created by triage");
  mark("triage cleanup works", true, "test ticket rows removed via best-effort cleanup");
}

async function main() {
  try {
    assertLocalExecutionGuard();
    assertLocalConfig();
    const { tmpDir, targetRoot } = transpileProjectModules();

    const modules = await loadRuntimeModules(targetRoot);
    runTriageScenario(modules);

    mark("local Supabase execution guard", true, "WSS_ALLOW_SUPABASE_VALIDATION=dev, correct project ref, and non-production env set");
    mark("local triage-ticket validation", true, "triage success and failure paths executed");

    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local triage-ticket validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
