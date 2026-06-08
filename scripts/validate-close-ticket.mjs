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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-close-ticket-validate-"));
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
  const recipientEmail = `${runId}+${suffix}@example.com`;

  const created = handleCreateTicket({
    tenantContext,
    actorContext: baseActor,
    ticket: {
      rawMessage: "Checkout widget intermittently fails on mobile.",
      intakeChannel: "operator_portal",
      source: "validate-close-ticket",
      title: `Create for close path ${suffix}`,
      submitter: {
        submitterName: "Validation Customer",
        submitterEmail: recipientEmail,
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
    rationale: "Phase 5H close setup",
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
    `draft for ${suffix} should reach reply_drafted`,
  );

  return { ticketId, recipientEmail, draftReplyId: drafted.response.draftId };
}

function driveToApprovedToSend(runtime, tenantContext, baseActor, garyActor, runId, suffix) {
  const { handleRequestApproval, handleApproveReply } = runtime;
  const base = driveToReplyDrafted(runtime, tenantContext, baseActor, runId, suffix);

  const requested = handleRequestApproval({
    tenantContext,
    actorContext: baseActor,
    ticketId: base.ticketId,
    requestNotes: "Phase 5H approval request",
  });
  assert(
    requested.status === "success" && requested.response.status === "awaiting_gary_approval",
    `request approval for ${suffix} should reach awaiting_gary_approval`,
  );

  const approved = handleApproveReply({
    tenantContext,
    actorContext: garyActor,
    ticketId: base.ticketId,
    approvalId: base.ticketId,
    approvalNotes: "Approved by Gary for phase-5H close path",
  });
  assert(
    approved.status === "success" && approved.response.status === "approved_to_send",
    `approve for ${suffix} should reach approved_to_send`,
  );

  return {
    ...base,
    approvalId: approved.response.approvalId,
    approvedAt: approved.response.approvedAt,
    approvedByActorReference: garyActor.actorReference,
  };
}

function driveToSentToCustomer(runtime, tenantContext, baseActor, garyActor, senderActor, runId, suffix) {
  const { handleSendApprovedReply } = runtime;
  const ctx = driveToApprovedToSend(runtime, tenantContext, baseActor, garyActor, runId, suffix);

  const sent = handleSendApprovedReply({
    tenantContext,
    actorContext: senderActor,
    ticketId: ctx.ticketId,
    draftReplyId: ctx.draftReplyId,
    recipientEmail: ctx.recipientEmail,
    approvalContext: {
      approvalId: ctx.approvalId,
      approvedByActorReference: ctx.approvedByActorReference,
      approvedAt: ctx.approvedAt,
    },
    rationale: "Customer reply recorded as sent (local-only)",
    communicationContext: { channel: "local_only" },
  });
  assert(
    sent.status === "success" && sent.response.status === "sent_to_customer",
    `send for ${suffix} should reach sent_to_customer (got ${sent.status}: ${sent.error ?? "no error"})`,
  );

  return ctx;
}

function runCloseTicketScenario(runtime) {
  const { ActorRole, handleCloseTicket, querySql, cleanupWorkflowSession } = runtime;

  const runId = randomUUID();

  const baseActor = { actorRole: ActorRole.CS_AGENT, actorReference: `operator-${runId}` };
  const garyActor = { actorRole: ActorRole.GARY_APPROVER, actorReference: `gary-${runId}` };
  const senderActor = { actorRole: ActorRole.CS_AGENT, actorReference: `sender-${runId}` };
  const closerActor = { actorRole: ActorRole.CS_AGENT, actorReference: `closer-${runId}` };

  const closeTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const noNoteTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const wrongStateTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const unauthTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };

  const closureNote = "Resolved: customer confirmed checkout works after cache clear.";

  // 1) Success: sent_to_customer -> closed.
  const closeCtx = driveToSentToCustomer(runtime, closeTenant, baseActor, garyActor, senderActor, runId, "close");

  const commBeforeClose = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${closeCtx.ticketId}';`,
    ),
  );

  const closed = handleCloseTicket({
    tenantContext: closeTenant,
    actorContext: closerActor,
    ticketId: closeCtx.ticketId,
    closureNote,
  });
  assert(closed.status === "success", `close should succeed (got ${closed.status}: ${closed.error ?? "no error"})`);
  assert(closed.response.status === "closed", "close response should return closed status");

  const closedRows = queryRowsWithGuard(
    querySql,
    `select status, closure_note, closed_at from public.tickets where id='${closeCtx.ticketId}';`,
  );
  assert(closedRows[0]?.status === "closed", "ticket status should be closed after close");
  assert(closedRows[0]?.closure_note === closureNote, "closure_note should be persisted");
  assert(
    Boolean(closedRows[0]?.closed_at) && `${closedRows[0]?.closed_at}`.length > 0,
    "closed_at should be set after close",
  );

  const closeEvents = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${closeCtx.ticketId}' order by occurred_at asc;`,
  ).map((row) => row.event_type);
  assert(closeEvents.includes("ticket_closed"), "ticket_closed audit event should be recorded");

  const commAfterClose = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${closeCtx.ticketId}';`,
    ),
  );
  assert(commAfterClose === commBeforeClose, "close must not create a communication row");

  // Closed ticket cannot transition out: a second close on the closed ticket must fail (terminal).
  const reClose = handleCloseTicket({
    tenantContext: closeTenant,
    actorContext: closerActor,
    ticketId: closeCtx.ticketId,
    closureNote: "second close attempt",
  });
  expectFailureWithStatus(reClose, "terminal", "closed ticket cannot transition out");
  const stillClosedRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${closeCtx.ticketId}';`,
  );
  assert(stillClosedRows[0]?.status === "closed", "ticket should remain closed after a re-close attempt");

  // 2) Missing closure note fails.
  const noNoteCtx = driveToSentToCustomer(runtime, noNoteTenant, baseActor, garyActor, senderActor, runId, "nonote");
  const noNote = handleCloseTicket({
    tenantContext: noNoteTenant,
    actorContext: closerActor,
    ticketId: noNoteCtx.ticketId,
    closureNote: "",
  });
  expectFailureWithStatus(noNote, "closureNote", "missing closure note must fail");
  const noNoteStatus = queryRowsWithGuard(querySql, `select status from public.tickets where id='${noNoteCtx.ticketId}';`);
  assert(noNoteStatus[0]?.status === "sent_to_customer", "missing closure note must not advance ticket status");
  const noNoteClosedEvents = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_audit_events where ticket_id='${noNoteCtx.ticketId}' and event_type='ticket_closed';`,
    ),
  );
  assert(noNoteClosedEvents === 0, "missing closure note must not create a ticket_closed audit event");

  // 3) Non-sent_to_customer status fails (ticket only approved_to_send).
  const wrongStateCtx = driveToApprovedToSend(runtime, wrongStateTenant, baseActor, garyActor, runId, "wrongstate");
  const wrongState = handleCloseTicket({
    tenantContext: wrongStateTenant,
    actorContext: closerActor,
    ticketId: wrongStateCtx.ticketId,
    closureNote: "attempting to close an unsent ticket",
  });
  expectFailureWithStatus(wrongState, "invalid_transition", "non-sent_to_customer close must fail");
  const wrongStateStatus = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${wrongStateCtx.ticketId}';`,
  );
  assert(wrongStateStatus[0]?.status === "approved_to_send", "non-sent close must not advance ticket status");

  // 4) Unauthorized actor fails.
  const unauthCtx = driveToSentToCustomer(runtime, unauthTenant, baseActor, garyActor, senderActor, runId, "unauth");
  const unauthorized = handleCloseTicket({
    tenantContext: unauthTenant,
    actorContext: {
      actorRole: ActorRole.SITE_USER,
      actorReference: `site-user-${runId}`,
    },
    ticketId: unauthCtx.ticketId,
    closureNote: "unauthorized close attempt",
  });
  expectFailureWithStatus(unauthorized, "actorRole", "unauthorized actor close must fail");
  const unauthStatus = queryRowsWithGuard(querySql, `select status from public.tickets where id='${unauthCtx.ticketId}';`);
  assert(unauthStatus[0]?.status === "sent_to_customer", "unauthorized close must not advance ticket status");

  // Cleanup.
  const ticketIds = [closeCtx.ticketId, noNoteCtx.ticketId, wrongStateCtx.ticketId, unauthCtx.ticketId];
  if (typeof cleanupWorkflowSession === "function") {
    for (const ticketId of ticketIds) {
      cleanupWorkflowSession(ticketId);
    }
  }

  const tenants = [closeTenant, noNoteTenant, wrongStateTenant, unauthTenant];
  const ticketIdList = ticketIds.map((id) => `'${id}'`).join(", ");
  const siteIdList = tenants.map((tenant) => `'${tenant.siteId}'`).join(", ");
  const clientIdList = tenants.map((tenant) => `'${tenant.clientId}'`).join(", ");
  const agencyIdList = tenants.map((tenant) => `'${tenant.agencyId}'`).join(", ");

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
  const postCommCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id in (${ticketIdList});`,
    ),
  );
  const postAuditCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_audit_events where ticket_id in (${ticketIdList});`,
    ),
  );

  assert(postTicketCount === 0, "close validation cleanup removes ticket rows");
  assert(postCommCount === 0, "close validation cleanup removes communication rows");
  assert(postAuditCount === 0, "close validation cleanup removes audit rows");

  mark("sent_to_customer to closed transition", true, `ticket ${closeCtx.ticketId} closed`);
  mark("closure_note persisted", true, "closure_note stored on closed ticket");
  mark("closed_at set", true, "closed_at populated on close");
  mark("ticket_closed audit exists", true, "ticket_closed event recorded for close");
  mark("no communication row created by close", true, "communication count unchanged across close");
  mark("closed ticket cannot transition out", true, "second close on closed ticket rejected as terminal");
  mark("missing closure note fails", true, "close without closure note is rejected and persists nothing");
  mark("non-sent_to_customer status fails", true, "approved_to_send close attempt rejected as invalid transition");
  mark("unauthorized actor fails", true, "SITE_USER close attempt is rejected and persists nothing");
  mark("cleanup works", true, "close validation cleanup removed test rows");
}

async function main() {
  try {
    assertLocalExecutionGuard();
    assertLocalConfig();

    const { tmpDir, targetRoot } = transpileProjectModules();
    try {
      const modules = await loadRuntimeModules(targetRoot);
      runCloseTicketScenario(modules);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local Supabase execution guard", true, "WSS_ALLOW_SUPABASE_VALIDATION=dev and dev project ref set");
    mark("local close-ticket validation", true, "sent_to_customer->closed success, failure, and cleanup paths executed");

    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local close-ticket validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
