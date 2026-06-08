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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-send-reply-validate-"));
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
      source: "validate-send-reply",
      title: `Create for send path ${suffix}`,
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
    rationale: "Phase 5G send setup",
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

  return { ticketId, recipientEmail, draftReplyId: drafted.response.draftId };
}

function driveToApprovedToSend(runtime, tenantContext, baseActor, garyActor, runId, suffix) {
  const { handleRequestApproval, handleApproveReply } = runtime;
  const base = driveToReplyDrafted(runtime, tenantContext, baseActor, runId, suffix);

  const requested = handleRequestApproval({
    tenantContext,
    actorContext: baseActor,
    ticketId: base.ticketId,
    requestNotes: "Phase 5G approval request",
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
    approvalNotes: "Approved by Gary for phase-5G send",
  });
  assert(
    approved.status === "success" && approved.response.status === "approved_to_send",
    `approve for ${suffix} should reach approved_to_send (got ${approved.status}: ${approved.error ?? "no error"})`,
  );

  return {
    ...base,
    approvalId: approved.response.approvalId,
    approvedAt: approved.response.approvedAt,
    approvedByActorReference: garyActor.actorReference,
  };
}

function runSendReplyScenario(runtime) {
  const { ActorRole, handleSendApprovedReply, querySql, cleanupWorkflowSession } = runtime;

  const runId = randomUUID();

  const baseActor = { actorRole: ActorRole.CS_AGENT, actorReference: `operator-${runId}` };
  const garyActor = { actorRole: ActorRole.GARY_APPROVER, actorReference: `gary-${runId}` };
  const senderActor = { actorRole: ActorRole.CS_AGENT, actorReference: `sender-${runId}` };

  const sendTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const noEmailTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const noApprovalTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const unauthTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };

  // 1) Success: approved_to_send -> sent_to_customer.
  const sendCtx = driveToApprovedToSend(runtime, sendTenant, baseActor, garyActor, runId, "send");
  const sent = handleSendApprovedReply({
    tenantContext: sendTenant,
    actorContext: senderActor,
    ticketId: sendCtx.ticketId,
    draftReplyId: sendCtx.draftReplyId,
    recipientEmail: sendCtx.recipientEmail,
    approvalContext: {
      approvalId: sendCtx.approvalId,
      approvedByActorReference: sendCtx.approvedByActorReference,
      approvedAt: sendCtx.approvedAt,
    },
    rationale: "Customer reply recorded as sent (local-only)",
    communicationContext: { channel: "local_only" },
  });
  assert(sent.status === "success", `send should succeed (got ${sent.status}: ${sent.error ?? "no error"})`);
  assert(sent.response.status === "sent_to_customer", "send response should return sent_to_customer status");

  const sendStatusRows = queryRowsWithGuard(querySql, `select status from public.tickets where id='${sendCtx.ticketId}';`);
  assert(sendStatusRows[0]?.status === "sent_to_customer", "ticket status should be sent_to_customer after send");

  const commRows = queryRowsWithGuard(
    querySql,
    `select recipient_email, delivery_status, external_provider, external_message_id from public.ticket_communications where ticket_id='${sendCtx.ticketId}';`,
  );
  assert(commRows.length === 1, "exactly one communication row should exist after send");
  assert(commRows[0]?.recipient_email === sendCtx.recipientEmail, "communication row should record the recipient email");

  const sentEvents = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${sendCtx.ticketId}' order by occurred_at asc;`,
  ).map((row) => row.event_type);
  assert(sentEvents.includes("reply_sent"), "reply_sent audit event should be recorded");

  // No real email sent: nothing is marked delivered/sent, delivery stays local pending.
  const deliveredCount = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${sendCtx.ticketId}' and delivery_status='sent';`,
    ),
  );
  assert(deliveredCount === 0, "no communication should be marked as actually sent/delivered");
  assert(commRows[0]?.delivery_status !== "sent", "communication delivery_status must not be 'sent'");

  // No provider integration: provider/message-id columns remain null.
  assert(
    commRows[0]?.external_provider === null || commRows[0]?.external_provider === undefined,
    "communication must not record an external provider",
  );
  assert(
    commRows[0]?.external_message_id === null || commRows[0]?.external_message_id === undefined,
    "communication must not record an external provider message id",
  );

  // 2) Missing email fails.
  const noEmailCtx = driveToApprovedToSend(runtime, noEmailTenant, baseActor, garyActor, runId, "noemail");
  const noEmail = handleSendApprovedReply({
    tenantContext: noEmailTenant,
    actorContext: senderActor,
    ticketId: noEmailCtx.ticketId,
    draftReplyId: noEmailCtx.draftReplyId,
    recipientEmail: "",
    approvalContext: {
      approvalId: noEmailCtx.approvalId,
      approvedByActorReference: noEmailCtx.approvedByActorReference,
      approvedAt: noEmailCtx.approvedAt,
    },
    communicationContext: { channel: "local_only" },
  });
  expectFailureWithStatus(noEmail, "recipientEmail", "missing email send must fail");
  const noEmailComm = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${noEmailCtx.ticketId}';`,
    ),
  );
  assert(noEmailComm === 0, "missing email send must not create a communication row");
  const noEmailStatus = queryRowsWithGuard(querySql, `select status from public.tickets where id='${noEmailCtx.ticketId}';`);
  assert(noEmailStatus[0]?.status === "approved_to_send", "missing email send must not advance ticket status");

  // 3) Missing approval fails (ticket only drafted, no approval requested/approved).
  const noApprovalBase = driveToReplyDrafted(runtime, noApprovalTenant, baseActor, runId, "noapproval");
  const noApproval = handleSendApprovedReply({
    tenantContext: noApprovalTenant,
    actorContext: senderActor,
    ticketId: noApprovalBase.ticketId,
    draftReplyId: noApprovalBase.draftReplyId,
    recipientEmail: noApprovalBase.recipientEmail,
    approvalContext: {
      approvalId: randomUUID(),
      approvedByActorReference: senderActor.actorReference,
      approvedAt: new Date().toISOString(),
    },
    communicationContext: { channel: "local_only" },
  });
  expectFailureWithStatus(noApproval, "no approval found", "send without approval must fail");
  const noApprovalComm = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${noApprovalBase.ticketId}';`,
    ),
  );
  assert(noApprovalComm === 0, "send without approval must not create a communication row");
  const noApprovalStatus = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${noApprovalBase.ticketId}';`,
  );
  assert(noApprovalStatus[0]?.status === "reply_drafted", "send without approval must not advance ticket status");

  // 4) Unauthorized actor fails.
  const unauthCtx = driveToApprovedToSend(runtime, unauthTenant, baseActor, garyActor, runId, "unauth");
  const unauthorized = handleSendApprovedReply({
    tenantContext: unauthTenant,
    actorContext: {
      actorRole: ActorRole.SITE_USER,
      actorReference: `site-user-${runId}`,
    },
    ticketId: unauthCtx.ticketId,
    draftReplyId: unauthCtx.draftReplyId,
    recipientEmail: unauthCtx.recipientEmail,
    approvalContext: {
      approvalId: unauthCtx.approvalId,
      approvedByActorReference: unauthCtx.approvedByActorReference,
      approvedAt: unauthCtx.approvedAt,
    },
    communicationContext: { channel: "local_only" },
  });
  expectFailureWithStatus(unauthorized, "actorRole", "unauthorized actor send must fail");
  const unauthComm = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${unauthCtx.ticketId}';`,
    ),
  );
  assert(unauthComm === 0, "unauthorized actor send must not create a communication row");
  const unauthStatus = queryRowsWithGuard(querySql, `select status from public.tickets where id='${unauthCtx.ticketId}';`);
  assert(unauthStatus[0]?.status === "approved_to_send", "unauthorized actor send must not advance ticket status");

  // Cleanup.
  const ticketIds = [sendCtx.ticketId, noEmailCtx.ticketId, noApprovalBase.ticketId, unauthCtx.ticketId];
  if (typeof cleanupWorkflowSession === "function") {
    for (const ticketId of ticketIds) {
      cleanupWorkflowSession(ticketId);
    }
  }

  const tenants = [sendTenant, noEmailTenant, noApprovalTenant, unauthTenant];
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

  assert(postTicketCount === 0, "send validation cleanup removes ticket rows");
  assert(postCommCount === 0, "send validation cleanup removes communication rows");
  assert(postAuditCount === 0, "send validation cleanup removes audit rows");

  mark("approved_to_send to sent_to_customer transition", true, `ticket ${sendCtx.ticketId} sent (local-only)`);
  mark("communication row exists", true, "ticket_communications row created for send");
  mark("reply_sent audit exists", true, "reply_sent event recorded for send");
  mark("no real email sent", true, "no communication marked delivered/sent; delivery stays local pending");
  mark("no provider integration", true, "external_provider and external_message_id remain null");
  mark("missing email fails", true, "send without recipient email is rejected and persists nothing");
  mark("missing approval fails", true, "send without an approval record is rejected and persists nothing");
  mark("unauthorized actor fails", true, "SITE_USER send attempt is rejected and persists nothing");
  mark("cleanup works", true, "send validation cleanup removed test rows");
}

async function main() {
  try {
    assertLocalExecutionGuard();
    assertLocalConfig();

    const { tmpDir, targetRoot } = transpileProjectModules();
    try {
      const modules = await loadRuntimeModules(targetRoot);
      runSendReplyScenario(modules);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local Supabase execution guard", true, "WSS_ALLOW_SUPABASE_VALIDATION=dev and dev project ref set");
    mark("local send-reply validation", true, "approved_to_send->sent_to_customer success, failure, and cleanup paths executed");

    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local send-reply validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
