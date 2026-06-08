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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-request-approval-validate-"));
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

function driveToReplyDrafted(runtime, tenantContext, baseActor, runId, suffix) {
  const { handleCreateTicket, handleTriageTicket, handleDraftReply } = runtime;

  const created = handleCreateTicket({
    tenantContext,
    actorContext: baseActor,
    ticket: {
      rawMessage: "Checkout widget intermittently fails on mobile.",
      intakeChannel: "operator_portal",
      source: "validate-request-approval",
      title: `Create for approval-request path ${suffix}`,
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: `${runId}+${suffix}@example.com`,
      },
      priority: "high",
      identityConfidence: "known",
    },
  });
  assert(created.status === "success", `create for ${suffix} scenario should succeed`);
  const ticketId = created.response.ticketId;

  const triaged = handleTriageTicket({
    tenantContext,
    actorContext: baseActor,
    ticketId,
    rationale: "Phase 5E approval-request setup",
  });
  assert(triaged.status === "success", `triage for ${suffix} should succeed`);

  const drafted = handleDraftReply({
    tenantContext,
    actorContext: baseActor,
    ticketId,
    draftText: "Drafted response: please clear cache and retry checkout flow.",
  });
  assert(
    drafted.status === "success" && drafted.response.status === "reply_drafted",
    `draft for ${suffix} should reach reply_drafted (got ${drafted.status}: ${drafted.error ?? "no error"})`,
  );

  return ticketId;
}

function runRequestApprovalScenario(runtime) {
  const { ActorRole, handleRequestApproval, querySql, cleanupWorkflowSession } = runtime;

  const runId = randomUUID();

  const baseActor = {
    actorRole: ActorRole.CS_AGENT,
    actorReference: `operator-${runId}`,
  };

  const approvalTenantContext = {
    agencyId: randomUUID(),
    clientId: randomUUID(),
    siteId: randomUUID(),
  };
  const triagedTenantContext = {
    agencyId: randomUUID(),
    clientId: randomUUID(),
    siteId: randomUUID(),
  };
  const unauthTenantContext = {
    agencyId: randomUUID(),
    clientId: randomUUID(),
    siteId: randomUUID(),
  };

  // 1) Happy path: reply_drafted -> awaiting_gary_approval succeeds.
  const approvalTicketId = driveToReplyDrafted(runtime, approvalTenantContext, baseActor, runId, "approval");

  const requested = handleRequestApproval({
    tenantContext: approvalTenantContext,
    actorContext: baseActor,
    ticketId: approvalTicketId,
    requestNotes: "Phase 5E approval request",
  });
  assert(
    requested.status === "success",
    `reply_drafted to awaiting_gary_approval should succeed (got ${requested.status}: ${requested.error ?? "no error"})`,
  );
  assert(
    requested.response.status === "awaiting_gary_approval",
    "request approval response should return awaiting_gary_approval status",
  );

  const statusRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${approvalTicketId}';`,
  );
  assert(
    statusRows[0]?.status === "awaiting_gary_approval",
    "ticket status should be awaiting_gary_approval after request approval",
  );

  // Pending approval row exists.
  const approvalStatusRows = queryRowsWithGuard(
    querySql,
    `select status from public.ticket_approvals where ticket_id='${approvalTicketId}';`,
  );
  assert(approvalStatusRows.length === 1, "exactly one approval row should exist after request approval");
  assert(approvalStatusRows[0]?.status === "pending", "approval row should be pending after request approval");

  // No approved/rejected decision created.
  const decidedRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_approvals where ticket_id='${approvalTicketId}' and status in ('approved','rejected');`,
    ),
  );
  assert(decidedRows === 0, "request approval must not create an approved/rejected decision");

  // approval_requested audit event exists.
  const eventRows = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${approvalTicketId}' order by occurred_at asc;`,
  ).map((row) => row.event_type);
  assert(
    eventRows.includes("approval_requested"),
    "approval_requested audit event should be recorded for request approval path",
  );

  // No communication rows created.
  const communicationRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${approvalTicketId}';`,
    ),
  );
  assert(communicationRows === 0, "request approval should not create communication rows");

  // 2) triaged -> awaiting_gary_approval fails.
  const triagedTicketCreated = runtime.handleCreateTicket({
    tenantContext: triagedTenantContext,
    actorContext: baseActor,
    ticket: {
      rawMessage: "Cannot request approval without a draft.",
      intakeChannel: "operator_portal",
      source: "validate-request-approval",
      title: "Request approval from triaged should fail",
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: `${runId}+triaged-fail@example.com`,
      },
      priority: "normal",
      identityConfidence: "known",
    },
  });
  assert(triagedTicketCreated.status === "success", "triaged-fail setup ticket should be created");
  const triagedTicketId = triagedTicketCreated.response.ticketId;

  const triagedOnly = runtime.handleTriageTicket({
    tenantContext: triagedTenantContext,
    actorContext: baseActor,
    ticketId: triagedTicketId,
    rationale: "triage only, no draft",
  });
  assert(triagedOnly.status === "success", "triaged-fail setup triage should succeed");

  const triagedRequestFail = handleRequestApproval({
    tenantContext: triagedTenantContext,
    actorContext: baseActor,
    ticketId: triagedTicketId,
    requestNotes: "trying approval before draft",
  });
  expectFailureWithStatus(triagedRequestFail, "invalid_reply_draft_state", "triaged → request approval must fail");

  // 3) Unauthorized actor fails (on a valid reply_drafted ticket).
  const unauthTicketId = driveToReplyDrafted(runtime, unauthTenantContext, baseActor, runId, "unauth");
  const unauthorizedRequest = handleRequestApproval({
    tenantContext: unauthTenantContext,
    actorContext: {
      actorRole: ActorRole.SITE_USER,
      actorReference: `site-user-${runId}`,
    },
    ticketId: unauthTicketId,
    requestNotes: "unauthorized actor approval attempt",
  });
  expectFailureWithStatus(unauthorizedRequest, "actorRole", "unauthorized actor cannot request approval");

  // Unauthorized attempt must not have advanced the ticket or created a decision.
  const unauthStatusRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${unauthTicketId}';`,
  );
  assert(
    unauthStatusRows[0]?.status === "reply_drafted",
    "ticket should remain reply_drafted after unauthorized request approval",
  );
  const unauthApprovalRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_approvals where ticket_id='${unauthTicketId}';`,
    ),
  );
  assert(unauthApprovalRows === 0, "unauthorized request approval must not create approval rows");

  // Cleanup.
  const ticketIds = [approvalTicketId, triagedTicketId, unauthTicketId];
  if (typeof cleanupWorkflowSession === "function") {
    for (const ticketId of ticketIds) {
      cleanupWorkflowSession(ticketId);
    }
  }

  const tenantContexts = [approvalTenantContext, triagedTenantContext, unauthTenantContext];
  const ticketIdList = ticketIds.map((id) => `'${id}'`).join(", ");
  const siteIdList = tenantContexts.map((tenant) => `'${tenant.siteId}'`).join(", ");
  const clientIdList = tenantContexts.map((tenant) => `'${tenant.clientId}'`).join(", ");
  const agencyIdList = tenantContexts.map((tenant) => `'${tenant.agencyId}'`).join(", ");

  const cleanupRows = [
    `delete from public.ticket_communications where ticket_id in (${ticketIdList});`,
    `delete from public.ticket_approvals where ticket_id in (${ticketIdList});`,
    `delete from public.ticket_draft_replies where ticket_id in (${ticketIdList});`,
    `delete from public.ticket_audit_events where ticket_id in (${ticketIdList});`,
    `delete from public.ticket_messages where ticket_id in (${ticketIdList});`,
    `delete from public.tickets where id in (${ticketIdList});`,
    `delete from public.sites where id in (${siteIdList});`,
    `delete from public.clients where id in (${clientIdList});`,
    `delete from public.agencies where id in (${agencyIdList});`,
  ];

  for (const statement of cleanupRows) {
    try {
      queryRowsWithGuard(querySql, statement);
    } catch {
      // best-effort cleanup
    }
  }

  const postTicketCount = countRows(
    queryRowsWithGuard(querySql, `select count(*)::int as count from public.tickets where id in (${ticketIdList});`),
  );
  const postApprovalCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_approvals where ticket_id in (${ticketIdList});`,
    ),
  );
  const postAuditCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_audit_events where ticket_id in (${ticketIdList});`,
    ),
  );

  assert(postTicketCount === 0, "request approval validation cleanup removes ticket rows");
  assert(postApprovalCount === 0, "request approval validation cleanup removes approval rows");
  assert(postAuditCount === 0, "request approval validation cleanup removes audit rows");

  mark("reply_drafted to awaiting_gary_approval transition", true, `ticket ${approvalTicketId} moved to awaiting_gary_approval`);
  mark("triaged request approval is rejected", true, "triaged ticket cannot request approval");
  mark("unauthorized actor cannot request approval", true, "SITE_USER request approval attempt is rejected");
  mark("pending approval row exists", true, "ticket_approvals pending row created for request approval");
  mark("approval_requested audit exists", true, "approval_requested event recorded for valid request");
  mark("no communication rows", true, "request approval path does not create communication records");
  mark("no approved/rejected decision", true, "request approval does not create an approval/rejection decision");
  mark("cleanup works", true, "request approval validation cleanup removed test rows");
}

async function main() {
  try {
    assertLocalExecutionGuard();
    assertLocalConfig();

    const { tmpDir, targetRoot } = transpileProjectModules();
    try {
      const modules = await loadRuntimeModules(targetRoot);
      runRequestApprovalScenario(modules);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local Supabase execution guard", true, "WSS_ALLOW_SUPABASE_VALIDATION=dev and dev project ref set");
    mark("local request-approval validation", true, "reply_drafted->awaiting_gary_approval success/failure paths executed");

    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local request-approval validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
