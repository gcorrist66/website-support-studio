import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";

const filesToCompile = [
  "src/domain/ticketStatus.ts",
  "src/domain/types.ts",
  "src/domain/transitions.ts",
  "src/domain/ticketLifecycle.ts",
  "src/persistence/schemaTypes.ts",
  "src/persistence/ticketMappers.ts",
  "src/persistence/persistenceGuards.ts",
  "src/persistence/supabaseAdapter.ts",
  "src/services/ticketRepository.ts",
  "src/services/ticketWorkflowService.ts",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function compileProjectModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-workflow-service-validate-"));
  const targetRoot = path.join(tmpDir, "src");

  for (const file of filesToCompile) {
    const sourcePath = path.join(projectRoot, file);
    const sourceText = fs.readFileSync(sourcePath, "utf8");
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

    const outputPath = path.join(targetRoot, file.replace(/\.ts$/, ".js"));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output.outputText, "utf8");
  }

  return {
    tmpDir,
    modules: {
      workflowService: import(
        pathToFileURL(path.join(targetRoot, "src", "services", "ticketWorkflowService.js")).href
      ),
      ticketRepository: import(
        pathToFileURL(path.join(targetRoot, "src", "services", "ticketRepository.js")).href
      ),
      ticketStatus: import(pathToFileURL(path.join(targetRoot, "src", "domain", "ticketStatus.js")).href),
    },
  };
}

function assertLocalExecutionGuard() {
  assert(process.env.WSS_ALLOW_SUPABASE_VALIDATION === "dev", "Refusing workflow service validation without explicit local opt-in: set WSS_ALLOW_SUPABASE_VALIDATION=dev.");
  const providedRef = process.env.WSS_SUPABASE_PROJECT_REF;
  assert(Boolean(providedRef), "Set WSS_SUPABASE_PROJECT_REF before running validation.");
  assert(providedRef === DEV_PROJECT_REF, `Unexpected WSS_SUPABASE_PROJECT_REF ${providedRef}; expected ${DEV_PROJECT_REF}.`);

  const allowed = ["dev", "development", "local"];
  assert(Boolean(process.env.WSS_SUPABASE_ENVIRONMENT) && allowed.includes(process.env.WSS_SUPABASE_ENVIRONMENT.toLowerCase()), "Set WSS_SUPABASE_ENVIRONMENT=dev|development|local before running validation.");

  const configPath = path.join(projectRoot, ".supabase", "config.toml");
  assert(fs.existsSync(configPath), "Missing local Supabase link metadata (.supabase/config.toml).");
  const configText = fs.readFileSync(configPath, "utf8");
  assert(configText.includes(DEV_PROJECT_REF), "Local Supabase link is not the expected WSS dev project reference.");
}

function queryRows(querySql, sql) {
  const rows = querySql(sql);
  return rows;
}

function queryCount(querySql, sql) {
  const rows = queryRows(querySql, sql);
  return Number(rows[0]?.count ?? rows[0]?.COUNT ?? 0);
}

function requireLocalEmail(value, message) {
  assert(typeof value === "string" && value.endsWith("@example.com"), message);
}

function requireAuditCoverage(querySql, ticketId, expectedEvents) {
  const eventRows = queryRows(
    querySql,
    `select event_type from public.ticket_audit_events where ticket_id = '${ticketId}' order by occurred_at;`,
  ).map((row) => row.event_type);

  const eventSet = new Set(eventRows);
  for (const expected of expectedEvents) {
    assert(eventSet.has(expected), `missing expected audit event ${expected}`);
  }
  assert(eventRows.length >= expectedEvents.length, "audit event count must include required lifecycle transitions");
}

function verifyTenantRoundtrip(querySql, ticketId, tenant) {
  const ticketRows = queryRows(
    querySql,
    `select id, agency_id, client_id, site_id, submitter_email, status, closure_note from public.tickets where id='${ticketId}';`,
  );
  assert(ticketRows.length === 1, "ticket should be persisted");

  const ticketRow = ticketRows[0];
  assert(ticketRow.agency_id === tenant.agencyId, "tenant agency should persist");
  assert(ticketRow.client_id === tenant.clientId, "tenant client should persist");
  assert(ticketRow.site_id === tenant.siteId, "tenant site should persist");

  const messageCount = queryCount(querySql, `select count(*)::int as count from public.ticket_messages where ticket_id='${ticketId}';`);
  const draftCount = queryCount(querySql, `select count(*)::int as count from public.ticket_draft_replies where ticket_id='${ticketId}';`);
  const approvalCount = queryCount(querySql, `select count(*)::int as count from public.ticket_approvals where ticket_id='${ticketId}';`);
  const communicationCount = queryCount(querySql, `select count(*)::int as count from public.ticket_communications where ticket_id='${ticketId}';`);

  assert(messageCount >= 1, "expected inbound message persisted");
  assert(draftCount >= 1, "expected draft persisted");
  assert(approvalCount >= 1, "expected approval persisted");
  assert(communicationCount >= 1, "expected communication persisted");

  requireLocalEmail(ticketRow.submitter_email, "submitter email should use local placeholder");

  const commRows = queryRows(
    querySql,
    `select external_provider, external_message_id, recipient_email, approval_id, delivery_status from public.ticket_communications where ticket_id='${ticketId}';`,
  );
  assert(commRows.length >= 1, "expected communication row");
  assert(commRows[0].external_provider === null, "external provider must be null");
  assert(commRows[0].external_message_id === null, "external message id must be null");
  requireLocalEmail(commRows[0].recipient_email, "recipient email should use local placeholder");
}

function ensureFailure(label, fn) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(`${label}: expected failure did not occur`);
}

function cleanupTicket(querySql, tenant) {
  querySql(`delete from public.ticket_communications where ticket_id = '${tenant.ticketId}';`);
  querySql(`delete from public.ticket_approvals where ticket_id = '${tenant.ticketId}';`);
  querySql(`delete from public.ticket_draft_replies where ticket_id = '${tenant.ticketId}';`);
  querySql(`delete from public.ticket_messages where ticket_id = '${tenant.ticketId}';`);
  querySql(`delete from public.ticket_audit_events where ticket_id = '${tenant.ticketId}';`);
  querySql(`delete from public.tickets where id = '${tenant.ticketId}';`);
  querySql(`delete from public.sites where id='${tenant.siteId}';`);
  querySql(`delete from public.clients where id='${tenant.clientId}';`);
  querySql(`delete from public.agencies where id='${tenant.agencyId}';`);
}

async function run() {
  assertLocalExecutionGuard();
  const { tmpDir, modules } = compileProjectModules();
  const workflowService = await modules.workflowService;
  const ticketRepository = await modules.ticketRepository;
  const ticketStatus = await modules.ticketStatus;

  const { ActorRole } = ticketStatus;

  const {
    createPersistedTicket,
    triagePersistedTicket,
    draftPersistedReply,
    requestPersistedApproval,
    approvePersistedReply,
    sendPersistedCustomerReplyLocalOnly,
    closePersistedTicket,
    getWorkflowSession,
    cleanupWorkflowSession,
    assertNoProductionSendEvidence,
  } = workflowService;

  const { querySql, assertLocalExecutionGate } = ticketRepository;
  assertLocalExecutionGate();

  const runId = `wss-service-${Date.now().toString().slice(-8)}`;
  const scenarioArtifacts = [];

  try {
    const scenarios = [
      {
        name: "full-workflow",
        run: () => {
          const localRecipient = `${runId}-recipient@example.com`;
          const ticket = createPersistedTicket({
            submitter: {
              submitterId: crypto.randomUUID(),
              submitterName: "Local Submitter",
              submitterEmail: localRecipient,
            },
            ticket: {
              rawMessage: "Customer reported a site outage and needs confirmation.",
              intakeChannel: "local-simulation",
              source: "validation-script",
              title: "Workflow service validation",
            },
          });
          const sessionAtCreate = getWorkflowSession(ticket.ticketId);
          assert(sessionAtCreate !== undefined, "workflow session should be created");

          const triaged = triagePersistedTicket(ticket.ticketId, `${runId}-triage`, "triage customer ticket");
          assert(triaged.status === "triaged", "expected triaged status");

          const drafted = draftPersistedReply(
            ticket.ticketId,
            "Thanks for reaching out. We are validating the local issue now.",
            `${runId}-cs`,
            { qualityCheckFlag: true },
          );
          assert(drafted.status === "reply_drafted", "expected reply_drafted status");

          const awaiting = requestPersistedApproval(ticket.ticketId, `${runId}-cs`, "needs gary review");
          assert(awaiting.status === "awaiting_gary_approval", "expected awaiting approval status");

          const approved = approvePersistedReply(
            ticket.ticketId,
            ActorRole.GARY_APPROVER,
            `${runId}-gary-approver`,
            "approved for local roundtrip",
          );
          assert(approved.status === "approved_to_send", "expected approved_to_send status");

          const sent = sendPersistedCustomerReplyLocalOnly({
            ticketId: ticket.ticketId,
            actorReference: `${runId}-cs-sender`,
            recipientEmail: localRecipient,
            rationale: "local service send guard",
          });
          assert(sent.status === "sent_to_customer", "expected sent_to_customer status");

          const closed = closePersistedTicket(
            ticket.ticketId,
            ActorRole.CS_AGENT,
            "Resolution confirmed and closed for local validation.",
            `${runId}-cs-close`,
          );
          assert(closed.status === "closed", "expected closed status");

          const persistedSession = getWorkflowSession(ticket.ticketId);
          assert(persistedSession !== undefined, "session should remain for verification");

          requireAuditCoverage(querySql, ticket.ticketId, [
            "ticket_created",
            "ticket_triaged",
            "reply_drafted",
            "approval_requested",
            "approval_granted",
            "reply_sent",
            "ticket_closed",
          ]);
          verifyTenantRoundtrip(querySql, ticket.ticketId, persistedSession.tenant);
          assertNoProductionSendEvidence(ticket.ticketId);

          return { ticketId: ticket.ticketId, tenant: persistedSession.tenant, status: "closed" };
        },
      },
      {
        name: "send-before-approval-blocked",
        run: () => {
          const ticket = createPersistedTicket({
            submitter: {
              submitterId: crypto.randomUUID(),
              submitterName: "Guard Submitter",
              submitterEmail: `${runId}-guard@example.com`,
            },
            ticket: {
              rawMessage: "Should not send without approval.",
              intakeChannel: "local-simulation",
              source: "validation-script",
              title: "Send approval guard",
            },
          });
          const session = getWorkflowSession(ticket.ticketId);
          assert(session !== undefined, "session should exist");

          triagePersistedTicket(ticket.ticketId, `${runId}-guard-triage`, "triage");
          draftPersistedReply(ticket.ticketId, "Draft prepared but not approved yet.", `${runId}-guard-cs`);
          requestPersistedApproval(ticket.ticketId, `${runId}-guard-cs`, "request pending approval");

          ensureFailure("send before approval", () => {
            sendPersistedCustomerReplyLocalOnly({
              ticketId: ticket.ticketId,
              actorReference: `${runId}-guard-cs`,
              recipientEmail: `${runId}-guard@example.com`,
            });
          });

          const sendCount = queryCount(
            querySql,
            `select count(*)::int as count from public.ticket_communications where ticket_id='${ticket.ticketId}';`,
          );
          assert(sendCount === 0, "no communication should be written when approval is missing");

          return { ticketId: ticket.ticketId, tenant: session.tenant, status: "guarded" };
        },
      },
      {
        name: "missing-recipient-email-blocked",
        run: () => {
          const ticket = createPersistedTicket({
            ticket: {
              rawMessage: "Customer missing contact details.",
              intakeChannel: "local-simulation",
              source: "validation-script",
              title: "Missing email guard",
            },
          });
          const session = getWorkflowSession(ticket.ticketId);
          assert(session !== undefined, "session should exist");

          triagePersistedTicket(ticket.ticketId, `${runId}-email-triage`, "triage");
          draftPersistedReply(ticket.ticketId, "Draft prepared for missing email case.", `${runId}-email-cs`);
          requestPersistedApproval(ticket.ticketId, `${runId}-email-cs`, "request approval");
          const approved = approvePersistedReply(
            ticket.ticketId,
            ActorRole.GARY_APPROVER,
            `${runId}-email-gary`,
            "approval granted before send check",
          );
          assert(approved.status === "approved_to_send", "expected approved status");

          ensureFailure("send without recipient email", () => {
            sendPersistedCustomerReplyLocalOnly({
              ticketId: ticket.ticketId,
              actorReference: `${runId}-email-cs`,
            });
          });

          return { ticketId: ticket.ticketId, tenant: session.tenant, status: "guarded" };
        },
      },
      {
        name: "invalid-approver-role-blocked",
        run: () => {
          const ticket = createPersistedTicket({
            submitter: {
              submitterId: crypto.randomUUID(),
              submitterName: "Imposter Submitter",
              submitterEmail: `${runId}-invalid@example.com`,
            },
            ticket: {
              rawMessage: "Attempt approval with non-approver role.",
              intakeChannel: "local-simulation",
              source: "validation-script",
              title: "Approver role guard",
            },
          });
          const session = getWorkflowSession(ticket.ticketId);
          assert(session !== undefined, "session should exist");

          triagePersistedTicket(ticket.ticketId, `${runId}-invalid-triage`, "triage");
          draftPersistedReply(ticket.ticketId, "Draft prepared.", `${runId}-invalid-cs`);
          requestPersistedApproval(ticket.ticketId, `${runId}-invalid-cs`, "request approval");

          ensureFailure("non-approver cannot approve", () => {
            approvePersistedReply(ticket.ticketId, "cs_agent", `${runId}-invalid-role`, "invalid actor");
          });

          return { ticketId: ticket.ticketId, tenant: session.tenant, status: "guarded" };
        },
      },
    ];

    for (const scenario of scenarios) {
      let scenarioArtifact = null;
      try {
        scenarioArtifact = scenario.run();
        scenarioArtifacts.push(scenarioArtifact);
      } finally {
        if (scenarioArtifact && scenarioArtifact.ticketId) {
          safeDelete(() => cleanupWorkflowSession(scenarioArtifact.ticketId));
          safeDelete(() => cleanupTicket(querySql, scenarioArtifact));
          const rows = queryRows(
            querySql,
            `select
              (select count(*)::int as count from public.agencies where id='${scenarioArtifact.tenant.agencyId}') as agencies,
              (select count(*)::int as count from public.clients where id='${scenarioArtifact.tenant.clientId}') as clients,
              (select count(*)::int as count from public.sites where id='${scenarioArtifact.tenant.siteId}') as sites,
              (select count(*)::int as count from public.tickets where id='${scenarioArtifact.ticketId}') as tickets;`,
          );
          assert(Number(rows[0].agencies) === 0, "agency cleanup should remove tenant row");
          assert(Number(rows[0].clients) === 0, "client cleanup should remove tenant row");
          assert(Number(rows[0].sites) === 0, "site cleanup should remove tenant row");
          assert(Number(rows[0].tickets) === 0, "ticket cleanup should remove row");
        }
      }
    }

    console.log(
      JSON.stringify(
        {
          status: "pass",
          runId,
          scenarios: scenarioArtifacts,
          tmpDir,
        },
        null,
        2,
      ),
    );
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // no-op
    }
  }
}

function safeDelete(fn) {
  try {
    fn();
  } catch {
    // best-effort cleanup
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
