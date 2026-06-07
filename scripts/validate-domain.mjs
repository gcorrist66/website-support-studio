import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const projectRoot = process.cwd();
const domainFiles = [
  "ticketStatus.ts",
  "types.ts",
  "transitions.ts",
  "ticketLifecycle.ts",
];

const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "wss-domain-validate-"));

try {
  const tmpDir = path.join(tmpBase, "src", "domain");
  const srcDir = path.join(projectRoot, "src", "domain");
  fs.mkdirSync(tmpDir, { recursive: true });

  domainFiles.forEach((filename) => {
    const sourcePath = path.join(srcDir, filename);
    const source = fs.readFileSync(sourcePath, "utf8");
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        strict: true,
        noEmitOnError: false,
      },
      fileName: filename,
      reportDiagnostics: true,
    });

    if (transpiled.diagnostics && transpiled.diagnostics.length > 0) {
      throw new Error(`TypeScript transpile diagnostics for ${filename}`);
    }

    const outputPath = path.join(tmpDir, filename.replace(/\.ts$/, ".js"));
    fs.writeFileSync(outputPath, transpiled.outputText, "utf8");
  });

  const domainModule = await import(`file://${path.join(tmpDir, "ticketLifecycle.js")}`);

  const {
    createTicket,
    transitionTicket,
    blockTicket,
    unblockTicket,
    closeTicket,
    getAuditTrail,
    clearLifecycleState,
  } = domainModule;

  const expect = (value, message) => {
    if (!value) {
      throw new Error(`Validation failed: ${message}`);
    }
  };

  const expectThrows = (fn, message) => {
    try {
      fn();
      throw new Error(`Expected failure did not occur: ${message}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes(`Expected failure did not occur: ${message}`)) {
        throw error;
      }
    }
  };

  const getEvents = (ticketId) => getAuditTrail(ticketId).map((event) => event.eventType);

  clearLifecycleState();

  const happyTicket = createTicket({
    siteId: "site-alpha",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Cannot access account",
    submitter: {
      submitterId: "submitter-001",
      siteId: "site-alpha",
      identityConfidence: "known",
      submitterName: "Customer One",
      submitterEmail: "customer@example.com",
    },
    priority: "normal",
    identityConfidence: "known",
  });

  expect(happyTicket.status === "received", "happy path starts in received");
  expect(getEvents(happyTicket.ticketId).includes("ticket_created"), "ticket_created event emitted");

  const happyTriaged = transitionTicket(happyTicket.ticketId, "triaged", "cs_agent", "actor-1", "triage complete");
  expect(happyTriaged.status === "triaged", "ticket can triage from received");
  expect(getEvents(happyTicket.ticketId).includes("ticket_triaged"), "ticket_triaged event emitted");

  const happyDrafted = transitionTicket(happyTicket.ticketId, "reply_drafted", "cs_agent", "actor-1", "draft prepared");
  expect(happyDrafted.status === "reply_drafted", "ticket can draft");
  expect(getEvents(happyTicket.ticketId).includes("reply_drafted"), "reply_drafted event emitted");

  const happyAwaiting = transitionTicket(
    happyTicket.ticketId,
    "awaiting_gary_approval",
    "cs_agent",
    "actor-1",
    "ready for approval",
  );
  expect(happyAwaiting.status === "awaiting_gary_approval", "ticket can enter approval gate");
  expect(getEvents(happyTicket.ticketId).includes("approval_requested"), "approval_requested event emitted");

  expectThrows(
    () => {
      transitionTicket(happyTicket.ticketId, "sent_to_customer", "cs_agent", "actor-1");
    },
    "sent_to_customer requires approval state",
  );

  const happyApproved = transitionTicket(
    happyTicket.ticketId,
    "approved_to_send",
    "gary_approver",
    "actor-2",
    "approved to send",
  );
  expect(happyApproved.status === "approved_to_send", "ticket can enter approved_to_send");
  expect(getEvents(happyTicket.ticketId).includes("approval_granted"), "approval_granted event emitted");

  const happySent = transitionTicket(
    happyTicket.ticketId,
    "sent_to_customer",
    "cs_agent",
    "actor-1",
    "customer email known",
  );
  expect(happySent.status === "sent_to_customer", "ticket can send from approved_to_send");
  expect(getEvents(happyTicket.ticketId).includes("reply_sent"), "reply_sent event emitted");

  const happyClosed = closeTicket(happyTicket.ticketId, "cs_agent", "actor-1", "work completed");
  expect(happyClosed.status === "closed", "ticket can close after sent_to_customer");
  expect(getEvents(happyTicket.ticketId).includes("ticket_closed"), "ticket_closed event emitted");

  // governance checks
  expectThrows(
    () => {
      transitionTicket(happyTicket.ticketId, "triaged", "cs_agent");
    },
    "closed ticket cannot transition out",
  );

  const receivedBlocked = createTicket({
    siteId: "site-beta",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Missing details",
    identityConfidence: "known",
  });

  const blockedFromReceived = blockTicket({
    ticketId: receivedBlocked.ticketId,
    actorRole: "cs_agent",
    reason: "other",
    blockerOwner: "cs_agent",
    reasonDetail: "requires validation",
  });
  expect(blockedFromReceived.status === "blocked", "received ticket can enter blocked");

  expectThrows(
    () => {
      unblockTicket({
        ticketId: receivedBlocked.ticketId,
        actorRole: "cs_agent",
        targetStatus: "awaiting_gary_approval",
      });
    },
    "blocked ticket from received cannot unlock to awaiting approval",
  );

  const receivedUnblocked = unblockTicket({
    ticketId: receivedBlocked.ticketId,
    actorRole: "cs_agent",
    targetStatus: "triaged",
  });
  expect(receivedUnblocked.status === "triaged", "blocked ticket from received unlocks to triaged");

  const rewriteDemo = createTicket({
    siteId: "site-gamma",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Draft refinement needed",
    identityConfidence: "claimed",
    submitter: {
      submitterId: "submitter-002",
      siteId: "site-gamma",
      identityConfidence: "claimed",
      submitterEmail: "known@example.com",
    },
  });

  transitionTicket(rewriteDemo.ticketId, "triaged", "cs_agent");
  transitionTicket(rewriteDemo.ticketId, "reply_drafted", "cs_agent");
  transitionTicket(rewriteDemo.ticketId, "awaiting_gary_approval", "cs_agent");
  blockTicket({
    ticketId: rewriteDemo.ticketId,
    actorRole: "cs_agent",
    reason: "awaiting_customer",
    blockerOwner: "cs_agent",
    reasonDetail: "revision requested",
  });

  const rewritten = unblockTicket({
    ticketId: rewriteDemo.ticketId,
    actorRole: "cs_agent",
    targetStatus: "reply_drafted",
  });
  expect(rewritten.status === "reply_drafted", "approval-requested rewrite returns to reply_drafted");
  expect(
    getEvents(rewriteDemo.ticketId).includes("ticket_unblocked") || getEvents(rewriteDemo.ticketId).includes("approval_rejected"),
    "rewrite path records unblock/reject evidence",
  );

  const noEmailApproved = createTicket({
    siteId: "site-delta",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "No email supplied",
    identityConfidence: "known",
    submitter: {
      submitterId: "submitter-003",
      siteId: "site-delta",
      identityConfidence: "known",
      submitterName: "No Email",
    },
  });
  transitionTicket(noEmailApproved.ticketId, "triaged", "cs_agent");
  transitionTicket(noEmailApproved.ticketId, "reply_drafted", "cs_agent");
  transitionTicket(noEmailApproved.ticketId, "awaiting_gary_approval", "cs_agent");
  transitionTicket(noEmailApproved.ticketId, "approved_to_send", "gary_approver");

  expectThrows(
    () => {
      transitionTicket(noEmailApproved.ticketId, "sent_to_customer", "cs_agent", "actor-1");
    },
    "sent_to_customer requires customer email",
  );

  const noEmailPreApproval = createTicket({
    siteId: "site-epsilon",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Direct invalid to send",
    identityConfidence: "known",
    submitter: {
      submitterId: "submitter-004",
      siteId: "site-epsilon",
      identityConfidence: "known",
    },
  });
  transitionTicket(noEmailPreApproval.ticketId, "triaged", "cs_agent");
  transitionTicket(noEmailPreApproval.ticketId, "reply_drafted", "cs_agent");

  expectThrows(
    () => {
      transitionTicket(noEmailPreApproval.ticketId, "sent_to_customer", "cs_agent", "actor-1");
    },
    "invalid direct reply_drafted to sent_to_customer");

  const immediateCloseAttempt = createTicket({
    siteId: "site-zeta",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Direct close check",
    identityConfidence: "known",
  });

  expectThrows(
    () => {
      transitionTicket(immediateCloseAttempt.ticketId, "closed", "cs_agent");
    },
    "received cannot directly close",
  );

  expectThrows(
    () => {
      closeTicket(immediateCloseAttempt.ticketId, "cs_agent");
      transitionTicket(immediateCloseAttempt.ticketId, "triaged", "cs_agent");
    },
    "closed state cannot reopen",
  );

  process.stdout.write("PASS: phase1 domain lifecycle validation completed\n");
} catch (error) {
  throw new Error(`Validation failed: ${(error?.message || error)}`);
} finally {
  fs.rmSync(tmpBase, { recursive: true, force: true });
}
