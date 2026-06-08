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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-approval-decision-validate-"));
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
      source: "validate-approval-decision",
      title: `Create for approval-decision path ${suffix}`,
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
    rationale: "Phase 5F approval-decision setup",
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

function driveToAwaitingApproval(runtime, tenantContext, baseActor, runId, suffix) {
  const { handleRequestApproval } = runtime;
  const ticketId = driveToReplyDrafted(runtime, tenantContext, baseActor, runId, suffix);

  const requested = handleRequestApproval({
    tenantContext,
    actorContext: baseActor,
    ticketId,
    requestNotes: "Phase 5F approval request",
  });
  assert(
    requested.status === "success" && requested.response.status === "awaiting_gary_approval",
    `request approval for ${suffix} should reach awaiting_gary_approval (got ${requested.status}: ${requested.error ?? "no error"})`,
  );
  return ticketId;
}

function runApprovalDecisionScenario(runtime) {
  const { ActorRole, handleApproveReply, handleRejectReply, querySql, cleanupWorkflowSession } = runtime;

  const runId = randomUUID();

  const baseActor = {
    actorRole: ActorRole.CS_AGENT,
    actorReference: `operator-${runId}`,
  };
  const garyActor = {
    actorRole: ActorRole.GARY_APPROVER,
    actorReference: `gary-${runId}`,
  };

  const approveTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const rejectTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const nonGaryTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };
  const wrongStateTenant = { agencyId: randomUUID(), clientId: randomUUID(), siteId: randomUUID() };

  // 1) Approval Success: awaiting_gary_approval -> approved_to_send.
  const approveTicketId = driveToAwaitingApproval(runtime, approveTenant, baseActor, runId, "approve");
  const approved = handleApproveReply({
    tenantContext: approveTenant,
    actorContext: garyActor,
    ticketId: approveTicketId,
    approvalId: approveTicketId,
    approvalNotes: "Approved by Gary in phase-5F validation",
  });
  assert(
    approved.status === "success",
    `approve should succeed (got ${approved.status}: ${approved.error ?? "no error"})`,
  );
  assert(approved.response.status === "approved_to_send", "approve response should return approved_to_send status");

  const approveStatusRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${approveTicketId}';`,
  );
  assert(approveStatusRows[0]?.status === "approved_to_send", "ticket status should be approved_to_send after approve");

  const approvalDecisionRows = queryRowsWithGuard(
    querySql,
    `select status from public.ticket_approvals where ticket_id='${approveTicketId}';`,
  );
  assert(approvalDecisionRows.length === 1, "exactly one approval row should exist after approve");
  assert(approvalDecisionRows[0]?.status === "approved", "approval row should become approved");

  const approveEvents = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${approveTicketId}' order by occurred_at asc;`,
  ).map((row) => row.event_type);
  assert(approveEvents.includes("approval_granted"), "approval_granted audit event should be recorded");

  const approveCommRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${approveTicketId}';`,
    ),
  );
  assert(approveCommRows === 0, "approve should not create communication rows");

  // No send occurs: ticket is approved_to_send (not sent) and no sent communications exist.
  const sentRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${approveTicketId}' and delivery_status='sent';`,
    ),
  );
  assert(sentRows === 0, "approve must not send any customer communication");
  assert(approveStatusRows[0]?.status !== "sent_to_customer", "approve must not advance ticket to sent_to_customer");

  // 2) Approval Reject: awaiting_gary_approval -> rejected (returns to reply_drafted route).
  const rejectTicketId = driveToAwaitingApproval(runtime, rejectTenant, baseActor, runId, "reject");
  const rejected = handleRejectReply({
    tenantContext: rejectTenant,
    actorContext: garyActor,
    ticketId: rejectTicketId,
    approvalId: rejectTicketId,
    rejectionNotes: "Returned for rework by Gary in phase-5F validation",
  });
  assert(
    rejected.status === "success",
    `reject should succeed (got ${rejected.status}: ${rejected.error ?? "no error"})`,
  );

  const rejectStatusRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${rejectTicketId}';`,
  );
  // Current deterministic state-machine routes a rejection back to reply_drafted.
  assert(
    rejectStatusRows[0]?.status === "reply_drafted",
    `rejected ticket should route to reply_drafted (got ${rejectStatusRows[0]?.status})`,
  );

  const rejectDecisionRows = queryRowsWithGuard(
    querySql,
    `select status from public.ticket_approvals where ticket_id='${rejectTicketId}';`,
  );
  assert(rejectDecisionRows.length === 1, "exactly one approval row should exist after reject");
  assert(rejectDecisionRows[0]?.status === "rejected", "approval row should become rejected");

  const rejectEvents = queryRowsWithGuard(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id='${rejectTicketId}' order by occurred_at asc;`,
  ).map((row) => row.event_type);
  assert(rejectEvents.includes("approval_rejected"), "approval_rejected audit event should be recorded");

  const rejectCommRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_communications where ticket_id='${rejectTicketId}';`,
    ),
  );
  assert(rejectCommRows === 0, "reject should not create communication rows");

  // 3a) Authorization: non-Gary actor cannot approve.
  const nonGaryTicketId = driveToAwaitingApproval(runtime, nonGaryTenant, baseActor, runId, "nongary");
  const nonGaryApprove = handleApproveReply({
    tenantContext: nonGaryTenant,
    actorContext: baseActor, // CS_AGENT, not an approver
    ticketId: nonGaryTicketId,
    approvalId: nonGaryTicketId,
    approvalNotes: "unauthorized approve attempt",
  });
  expectFailureWithStatus(nonGaryApprove, "may approve", "non-Gary actor cannot approve");

  const nonGaryReject = handleRejectReply({
    tenantContext: nonGaryTenant,
    actorContext: baseActor, // CS_AGENT, not an approver
    ticketId: nonGaryTicketId,
    approvalId: nonGaryTicketId,
    rejectionNotes: "unauthorized reject attempt",
  });
  expectFailureWithStatus(nonGaryReject, "may reject", "non-Gary actor cannot reject");

  // The unauthorized attempts must not have advanced the ticket nor decided the approval.
  const nonGaryStatusRows = queryRowsWithGuard(
    querySql,
    `select status from public.tickets where id='${nonGaryTicketId}';`,
  );
  assert(
    nonGaryStatusRows[0]?.status === "awaiting_gary_approval",
    "ticket should remain awaiting_gary_approval after unauthorized decision attempts",
  );
  const nonGaryDecisionRows = countRows(
    queryRowsWithGuard(
      querySql,
      `select count(*)::int as count from public.ticket_approvals where ticket_id='${nonGaryTicketId}' and status in ('approved','rejected');`,
    ),
  );
  assert(nonGaryDecisionRows === 0, "unauthorized actor must not produce an approved/rejected decision");

  // 3b) Authorization: non-awaiting_gary_approval ticket cannot be approved.
  const wrongStateTicketId = driveToReplyDrafted(runtime, wrongStateTenant, baseActor, runId, "wrongstate");
  const wrongStateApprove = handleApproveReply({
    tenantContext: wrongStateTenant,
    actorContext: garyActor,
    ticketId: wrongStateTicketId,
    approvalId: wrongStateTicketId,
    approvalNotes: "approve before approval was requested",
  });
  expectFailureWithStatus(wrongStateApprove, "approval_not_requested", "non-awaiting ticket cannot be approved");

  // Cleanup.
  const ticketIds = [approveTicketId, rejectTicketId, nonGaryTicketId, wrongStateTicketId];
  if (typeof cleanupWorkflowSession === "function") {
    for (const ticketId of ticketIds) {
      cleanupWorkflowSession(ticketId);
    }
  }

  const tenants = [approveTenant, rejectTenant, nonGaryTenant, wrongStateTenant];
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

  assert(postTicketCount === 0, "approval decision validation cleanup removes ticket rows");
  assert(postApprovalCount === 0, "approval decision validation cleanup removes approval rows");
  assert(postAuditCount === 0, "approval decision validation cleanup removes audit rows");

  mark("awaiting_gary_approval to approved_to_send transition", true, `ticket ${approveTicketId} approved`);
  mark("approval row becomes approved", true, "ticket_approvals row decision set to approved");
  mark("approval_granted audit exists", true, "approval_granted event recorded for approve");
  mark("approve creates no communication rows", true, "approve path creates no communication records");
  mark("no send occurs on approve", true, "no sent communications and ticket not advanced to sent_to_customer");
  mark("awaiting_gary_approval rejection path succeeds", true, `ticket ${rejectTicketId} rejected and routed to reply_drafted`);
  mark("approval row becomes rejected", true, "ticket_approvals row decision set to rejected");
  mark("approval_rejected audit exists", true, "approval_rejected event recorded for reject");
  mark("reject creates no communication rows", true, "reject path creates no communication records");
  mark("non-Gary actor cannot approve or reject", true, "CS_AGENT approve/reject attempts are rejected");
  mark("non-awaiting ticket cannot be approved", true, "reply_drafted ticket approve attempt is rejected");
  mark("cleanup works", true, "approval decision validation cleanup removed test rows");
}

async function main() {
  try {
    assertLocalExecutionGuard();
    assertLocalConfig();

    const { tmpDir, targetRoot } = transpileProjectModules();
    try {
      const modules = await loadRuntimeModules(targetRoot);
      runApprovalDecisionScenario(modules);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local Supabase execution guard", true, "WSS_ALLOW_SUPABASE_VALIDATION=dev and dev project ref set");
    mark("local approval-decision validation", true, "approve/reject success, authorization, and cleanup paths executed");

    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local approval-decision validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
