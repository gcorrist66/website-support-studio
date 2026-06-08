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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-draft-reply-validate-"));
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

function runDraftReplyScenario(runtime) {
  const {
    ActorRole,
    handleCreateTicket,
    handleTriageTicket,
    handleDraftReply,
    querySql,
    cleanupWorkflowSession,
  } = runtime;

  const runId = randomUUID();

  const baseActor = {
    actorRole: ActorRole.CS_AGENT,
    actorReference: `operator-${runId}`,
  };

  const baseTenantContext = {
    agencyId: randomUUID(),
    clientId: randomUUID(),
    siteId: randomUUID(),
  };

  const receivedTenantContext = {
    agencyId: randomUUID(),
    clientId: randomUUID(),
    siteId: randomUUID(),
  };

  

  const createdForDraft = handleCreateTicket({
    tenantContext: baseTenantContext,
    actorContext: baseActor,
    ticket: {
      rawMessage: "Checkout widget intermittently fails on mobile.",
      intakeChannel: "operator_portal",
      source: "validate-draft-reply",
      title: "Create for draft path",
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: `${runId}+customer@example.com`,
      },
      priority: "high",
      identityConfidence: "known",
    },
  });
  assert(createdForDraft.status === "success", "create for draft scenario should succeed");
  const triagedTicketId = createdForDraft.response.ticketId;

  const triaged = handleTriageTicket({
    tenantContext: baseTenantContext,
    actorContext: baseActor,
    ticketId: triagedTicketId,
    rationale: "Phase 5D draft setup",
  });
  assert(triaged.status === "success", "triage required before draft should succeed");

  const draftText = "Drafted response: please clear cache and retry checkout flow.";
  const drafted = handleDraftReply({
    tenantContext: baseTenantContext,
    actorContext: baseActor,
    ticketId: triagedTicketId,
    draftText,
  });
  assert(drafted.status === "success", `triaged to draft should succeed (got ${drafted.status}: ${drafted.error ?? "no error"})`);
  assert(drafted.response.status === "reply_drafted", "reply draft response should return reply_drafted status");

  const statusRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${triagedTicketId}';`,
  );
  assert(statusRows[0]?.status === "reply_drafted", "ticket status should be reply_drafted after draft");

  const draftRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_draft_replies where ticket_id='${triagedTicketId}';`,
    ),
  );
  assert(draftRows === 1, `ticket draft row should be created for ticket ${triagedTicketId}`);

  const eventRows = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${triagedTicketId}' order by occurred_at asc;`,
  ).map((row) => row.event_type);
  assert(
    eventRows.includes("reply_drafted"),
    "reply_drafted audit event should be recorded for draft path",
  );

  const approvalRows = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.ticket_approvals where ticket_id='${triagedTicketId}';`),
  );
  const communicationRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${triagedTicketId}';`,
    ),
  );
  assert(approvalRows === 0, "draft should not create approval rows");
  assert(communicationRows === 0, "draft should not create communication rows");

  const receivedTicket = handleCreateTicket({
    tenantContext: receivedTenantContext,
    actorContext: baseActor,
    ticket: {
      rawMessage: "Cannot draft without triage.",
      intakeChannel: "operator_portal",
      source: "validate-draft-reply",
      title: "Draft from received should fail",
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: `${runId}+received-fail@example.com`,
      },
      priority: "normal",
      identityConfidence: "known",
    },
  });
  assert(receivedTicket.status === "success", "received ticket setup should succeed");
  const receivedTicketId = receivedTicket.response.ticketId;

  const receivedDraftFail = handleDraftReply({
    tenantContext: receivedTenantContext,
    actorContext: baseActor,
    ticketId: receivedTicketId,
    draftText: "Trying draft before triage",
  });
  expectFailureWithStatus(receivedDraftFail, "invalid_draft_state", "received → draft must fail");

  const unauthorizedDraft = handleDraftReply({
    tenantContext: baseTenantContext,
    actorContext: {
      actorRole: ActorRole.SITE_USER,
      actorReference: `site-user-${runId}`,
    },
    ticketId: triagedTicketId,
    draftText: "Unauthorized actor draft attempt",
  });
  expectFailureWithStatus(unauthorizedDraft, "actorRole", "unauthorized actor cannot draft");

  const emptyDraft = handleDraftReply({
    tenantContext: baseTenantContext,
    actorContext: baseActor,
    ticketId: triagedTicketId,
    draftText: "  \n\t",
  });
  expectFailureWithStatus(emptyDraft, "draft text", "empty draft body must fail");

  const tenantRows = queryRowsWithGuard(
    querySql,
    `select t.agency_id, t.client_id, t.site_id, c.agency_id as client_agency_id, s.client_id as site_client_id
       from public.tickets t
       join public.clients c on c.id = t.client_id
       join public.sites s on s.id = t.site_id
      where t.id='${triagedTicketId}';`,
  );
  assert(tenantRows.length === 1, "tenant hierarchy should remain persisted for draft flow");
  assert(tenantRows[0].agency_id === tenantRows[0].client_agency_id, "ticket agency_id should match client tenant");
  assert(tenantRows[0].client_id === tenantRows[0].site_client_id, "ticket client_id should match site tenant");

  if (typeof cleanupWorkflowSession === "function") {
    cleanupWorkflowSession(triagedTicketId);
    cleanupWorkflowSession(receivedTicketId);
  }

  const cleanupRows = [
    `delete from public.ticket_draft_replies where ticket_id='${triagedTicketId}' or ticket_id='${receivedTicketId}';`,
    `delete from public.ticket_approvals where ticket_id='${triagedTicketId}' or ticket_id='${receivedTicketId}';`,
    `delete from public.ticket_communications where ticket_id='${triagedTicketId}' or ticket_id='${receivedTicketId}';`,
    `delete from public.ticket_audit_events where ticket_id='${triagedTicketId}' or ticket_id='${receivedTicketId}';`,
    `delete from public.ticket_messages where ticket_id='${triagedTicketId}' or ticket_id='${receivedTicketId}';`,
    `delete from public.tickets where id='${triagedTicketId}' or id='${receivedTicketId}';`,
    `delete from public.sites where id='${baseTenantContext.siteId}' or id='${receivedTenantContext.siteId}';`,
    `delete from public.clients where id='${baseTenantContext.clientId}' or id='${receivedTenantContext.clientId}';`,
    `delete from public.agencies where id='${baseTenantContext.agencyId}' or id='${receivedTenantContext.agencyId}';`,
  ];

  for (const statement of cleanupRows) {
    try {
      queryRowsWithGuard(querySql, statement);
    } catch {
      // best-effort cleanup
    }
  }

  const postDraftTicketCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.tickets where id='${triagedTicketId}' or id='${receivedTicketId}';`,
    ),
  );
  const postDraftAuditCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_audit_events where ticket_id='${triagedTicketId}' or ticket_id='${receivedTicketId}';`,
    ),
  );

  assert(postDraftTicketCount === 0, "draft validation cleanup removes ticket rows");
  assert(postDraftAuditCount === 0, "draft validation cleanup removes audit rows");

  mark("triaged to reply_drafted transition", true, `ticket ${triagedTicketId} moved to reply_drafted`);
  mark("draft body required", true, "empty or missing draft body is rejected");
  mark("received draft is rejected", true, "received ticket draft draft path is blocked");
  mark("unauthorized actor cannot draft", true, "SITE_USER draft attempt is rejected");
  mark("draft row exists", true, "ticket_draft_replies row created for reply draft");
  mark("reply_drafted audit exists", true, "reply_drafted event recorded for valid draft");
  mark("no approval rows", true, "draft path does not create approval records");
  mark("no communication rows", true, "draft path does not create communication records");
  mark("tenant relationship integrity", true, "tenant references remain correct on draft");
  mark("cleanup works", true, "draft validation cleanup removed test rows");
}

async function main() {
  try {
    assertLocalExecutionGuard();
    assertLocalConfig();

    const { tmpDir, targetRoot } = transpileProjectModules();
    try {
      const modules = await loadRuntimeModules(targetRoot);
      runDraftReplyScenario(modules);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local Supabase execution guard", true, "WSS_ALLOW_SUPABASE_VALIDATION=dev and dev project ref set");
    mark("local draft-reply validation", true, "triaged->draft success/failure paths executed");

    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local draft-reply validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
