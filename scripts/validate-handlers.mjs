import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = new Set(["dev", "development", "local"]);

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

function assertHandlerError(result, name) {
  assert(result.status === "error", `${name} expected error`);
}

function assertHandlerSuccess(result, name) {
  assert(result.status === "success", `${name} expected success`);
}

function hasApiRouteFiles(dirPath = path.join(process.cwd(), "src")) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".next", "dist"].includes(entry.name)) {
        continue;
      }
      if (hasApiRouteFiles(fullPath)) {
        return true;
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const normalized = fullPath.replaceAll("\\", "/");
    if (/\/(app|pages|routes)\/api\//.test(normalized) || /\/src\/(app|pages|routes)\//.test(normalized)) {
      return true;
    }
  }

  return false;
}

function nowIso() {
  return new Date().toISOString();
}

function isLocalDbValidationEnabled() {
  const allow = process.env.WSS_ALLOW_SUPABASE_VALIDATION;
  const environment = process.env.WSS_SUPABASE_ENVIRONMENT;
  const projectRef = process.env.WSS_SUPABASE_PROJECT_REF;

  if (allow !== "dev") {
    return false;
  }

  if (!projectRef || projectRef !== DEV_PROJECT_REF) {
    return false;
  }

  return Boolean(environment) && ALLOWED_NON_PRODUCTION_ENVS.has(environment.toLowerCase());
}

function assertValidCompileFile(fileText, sourcePath) {
  if (!fileText || fileText.length === 0) {
    throw new Error(`Empty file during compile: ${sourcePath}`);
  }
}

function transpileProjectModules() {
  const filesToCompile = [
    "src/contracts/ticketWorkflowContracts.ts",
    "src/contracts/contractGuards.ts",
    "src/domain/ticketStatus.ts",
    "src/domain/transitions.ts",
    "src/domain/ticketLifecycle.ts",
    "src/domain/types.ts",
    "src/persistence/schemaTypes.ts",
    "src/persistence/ticketMappers.ts",
    "src/persistence/persistenceGuards.ts",
    "src/persistence/supabaseAdapter.ts",
    "src/services/ticketRepository.ts",
    "src/services/ticketWorkflowService.ts",
    "src/handlers/ticketWorkflowHandlers.ts",
  ];

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-handlers-validate-"));
  const targetRoot = path.join(tmpDir, "src");

  for (const file of filesToCompile) {
    const sourcePath = path.join(projectRoot, file);
    const sourceText = fs.readFileSync(sourcePath, "utf8");
    assertValidCompileFile(sourceText, sourcePath);

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

  return { tmpDir, targetRoot };
}

async function loadModules(tmpRoot) {
  const base = path.join(tmpRoot, "src");
  const ticketStatus = await import(pathToFileURL(path.join(base, "domain", "ticketStatus.js")).href);
  const ticketWorkflowHandlers = await import(
    pathToFileURL(path.join(base, "handlers", "ticketWorkflowHandlers.js")).href,
  );
  const ticketLifecycle = await import(pathToFileURL(path.join(base, "domain", "ticketLifecycle.js")).href);
  const ticketWorkflowService = await import(
    pathToFileURL(path.join(base, "services", "ticketWorkflowService.js")).href,
  );

  return {
    ...ticketStatus,
    ...ticketWorkflowHandlers,
    ...ticketLifecycle,
    ...ticketWorkflowService,
  };
}

async function loadRuntimeModules() {
  const { tmpDir, targetRoot } = transpileProjectModules();
  try {
    const modules = await loadModules(targetRoot);
    return { modules, tmpDir };
  } catch (error) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw error;
  }
}

function cleanupArtifacts(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best effort cleanup only
  }
}

function createValidationSteps(runtime) {
  const {
    ActorRole,
    TicketStatus,
    handleApproveReply,
    handleBlockTicket,
    handleCloseTicket,
    handleCreateTicket,
    handleDraftReply,
    handleRejectReply,
    handleRequestApproval,
    handleSendApprovedReply,
    handleTriageTicket,
    handleUnblockTicket,
    clearLifecycleState,
    getApprovals,
    cleanupWorkflowSession,
  } = runtime;

  function clearHandlersState() {
    clearLifecycleState();
  }

  function scenarioContextGuards() {
    const tenantContext = {
      agencyId: "agency-handlers",
      clientId: "client-handlers",
      siteId: "site-handlers",
    };

    const actorContext = {
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-handler",
    };

    const missingTenant = {
      actorContext,
      ticket: {
        rawMessage: "Missing tenant",
        intakeChannel: "portal",
        source: "validation",
      },
    };

    const missingActor = {
      tenantContext,
      ticket: {
        rawMessage: "Missing actor",
        intakeChannel: "portal",
        source: "validation",
      },
    };

    assertHandlerError(handleCreateTicket(missingTenant), "missing tenant context");
    assertHandlerError(handleCreateTicket(missingActor), "missing actor context");
  }

  function scenarioLocalHandlerWorkflow() {
    const tenantContext = {
      agencyId: `agency-${Date.now().toString(36)}`,
      clientId: `client-${Date.now().toString(36)}`,
      siteId: `site-${Date.now().toString(36)}`,
    };

    const csActor = {
      actorRole: ActorRole.CS_AGENT,
      actorReference: `cs-${Date.now().toString(36)}`,
    };

    const garyActor = {
      actorRole: ActorRole.GARY_APPROVER,
      actorReference: `gary-${Date.now().toString(36)}`,
    };

    const created = handleCreateTicket({
      tenantContext,
      actorContext: csActor,
      ticket: {
        rawMessage: "Customer saw payment delay and requests status",
        intakeChannel: "portal",
        source: "validation",
        title: "Handler workflow baseline",
        priority: "high",
        identityConfidence: "known",
        submitter: {
          submitterEmail: "customer+handler-validation@example.com",
          submitterName: "Handler Validation Customer",
        },
      },
    });
    assertHandlerSuccess(created, "create handler in workflow");
    const ticketId = created.response.ticketId;

    const blockedTicket = handleCreateTicket({
      tenantContext,
      actorContext: csActor,
      ticket: {
        rawMessage: "Need blocked/unblock path validation",
        intakeChannel: "portal",
        source: "validation",
        title: "Handler block/unblock validation",
        priority: "normal",
        identityConfidence: "known",
        submitter: {
          submitterEmail: "blocked+handler-validation@example.com",
          submitterName: "Blocked Validation Customer",
        },
      },
    });
    assertHandlerSuccess(blockedTicket, "create ticket for block/unblock path");
    const blockedTicketId = blockedTicket.response.ticketId;

    const triage = handleTriageTicket({
      tenantContext,
      actorContext: csActor,
      ticketId,
      rationale: "triage from customer input",
    });
    assertHandlerSuccess(triage, "triage handler");

    const draft = handleDraftReply({
      tenantContext,
      actorContext: csActor,
      ticketId,
      draftText: "Thanks for the update; we are checking this now.",
      qualityCheckFlag: true,
    });
    assertHandlerSuccess(draft, "draft handler");

    const requestApproval = handleRequestApproval({
      tenantContext,
      actorContext: csActor,
      ticketId,
      requestNotes: "needs Gary review",
    });
    assertHandlerSuccess(requestApproval, "request approval handler");

    const approval = getApprovals(ticketId).at(-1);
    assert(Boolean(approval), "approval persisted in domain state");
    assert(approval.decision === "pending", "approval should be pending before decision");

    assertHandlerError(
      handleRejectReply({
        tenantContext,
        actorContext: csActor,
        ticketId,
        approvalId: approval?.approvalId ?? "missing-approval",
        rejectionNotes: "should fail for non-approver",
      }),
      "non-approver cannot reject",
    );

    const approve = handleApproveReply({
      tenantContext,
      actorContext: garyActor,
      ticketId,
      approvalId: approval.approvalId,
      approvalNotes: "Approved for direct customer response",
    });
    assertHandlerSuccess(approve, "approve handler");

    const approved = getApprovals(ticketId).at(-1);
    assert(approved.decision === "approved", "approval should be approved");

    const send = handleSendApprovedReply({
      tenantContext,
      actorContext: csActor,
      ticketId,
      draftReplyId: draft.response.draftId,
      recipientEmail: "customer+handler-validation@example.com",
      approvalContext: {
        approvalId: approved.approvalId,
        approvedByActorReference: approved.approverReference ?? garyActor.actorReference,
        approvedAt: approved.decisionAt,
      },
      communicationContext: {
        channel: "local_only",
      },
      rationale: "handler workflow validation",
    });
    assertHandlerSuccess(send, "send handler");
    if (send.status === "success") {
      assert(send.response.status !== TicketStatus.CLOSED, "send should not auto-close");
    }

    const close = handleCloseTicket({
      tenantContext,
      actorContext: csActor,
      ticketId,
      closureNote: "Resolved and informed customer.",
    });
    assertHandlerSuccess(close, "close handler");
    if (close.status === "success") {
      assert(close.response.status === TicketStatus.CLOSED, "close should move ticket to closed state");
    }

    const closeMissingNote = handleCloseTicket({
      tenantContext,
      actorContext: csActor,
      ticketId,
      closureNote: "   ",
    });
    assert(closeMissingNote.status === "error", "close missing note fails");

    const block = handleBlockTicket({
      tenantContext,
      actorContext: csActor,
      ticketId: blockedTicketId,
      blockedReason: "awaiting_vendor",
      blockerOwner: ActorRole.CS_AGENT,
      reasonDetail: "external dependency wait",
      mitigationPlan: "wait for vendor status",
      nextAction: "resume after vendor reply",
    });
    assertHandlerSuccess(block, "block handler");

    const unblock = handleUnblockTicket({
      tenantContext,
      actorContext: csActor,
      ticketId: blockedTicketId,
      targetStatus: "reply_drafted",
      unblockNotes: "vendor responded",
    });
    assertHandlerSuccess(unblock, "unblock handler");

    const sendWithoutApprovalContext = handleSendApprovedReply({
      tenantContext,
      actorContext: csActor,
      ticketId,
      draftReplyId: draft.response.draftId,
      recipientEmail: "customer+handler-validation@example.com",
      approvalContext: {
        approvalId: "wrong-approval-id",
        approvedByActorReference: garyActor.actorReference,
        approvedAt: nowIso(),
      },
      communicationContext: {
        channel: "local_only",
      },
    });
    assertHandlerError(sendWithoutApprovalContext, "wrong approval context fails");

    const sendWithoutEmail = handleSendApprovedReply({
      tenantContext,
      actorContext: csActor,
      ticketId,
      draftReplyId: draft.response.draftId,
      recipientEmail: "",
      approvalContext: {
        approvalId: approved.approvalId,
        approvedByActorReference: garyActor.actorReference,
        approvedAt: approved.decisionAt,
      },
      communicationContext: {
        channel: "local_only",
      },
    });
    assertHandlerError(sendWithoutEmail, "send without recipient email fails");

    return {
      ticketId: [ticketId, blockedTicketId],
      tenantContext,
    };
  }

  function runValidation() {
    clearHandlersState();

    try {
      scenarioContextGuards();
      mark("handlers reject missing tenant/actor context", true, "validated");
    } catch (error) {
      mark("handlers reject missing tenant/actor context", false, error.message);
    }

    try {
      const hasRouteFiles = hasApiRouteFiles();
      mark("no API route files under src", !hasRouteFiles, `has api route-like paths: ${hasRouteFiles}`);
    } catch (error) {
      mark("no API route files under src", false, error.message);
    }

    if (isLocalDbValidationEnabled()) {
      try {
        const { ticketId, tenantContext } = scenarioLocalHandlerWorkflow();
        for (const id of ticketId) {
          cleanupWorkflowSession(id);
        }
        void tenantContext;
        mark("full handler workflow local execution", true, "validated through local Supabase-backed handler roundtrip");
      } catch (error) {
        failures.push(`full handler workflow local execution: ${error.message}`);
      }
    } else {
      mark("full handler workflow local execution", true, "skipped: requires explicit local Supabase validation guard");
    }

    if (failures.length === 0) {
      return {
        status: "pass",
        checks,
        summary: {
          total: checks.length,
          passed: checks.filter((item) => item.passed).length,
          failed: failures.length,
        },
        env: {
          allow: process.env.WSS_ALLOW_SUPABASE_VALIDATION,
          environment: process.env.WSS_SUPABASE_ENVIRONMENT,
          projectRef: process.env.WSS_SUPABASE_PROJECT_REF,
        },
      };
    }

    return {
      status: "fail",
      errors: failures,
    };
  }

  return {
    run: runValidation,
  };
}

const { modules, tmpDir } = await loadRuntimeModules();
try {
  const result = createValidationSteps(modules).run();
  if (result.status === "fail") {
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
} finally {
  cleanupArtifacts(tmpDir);
}
