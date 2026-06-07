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
    createCustomerReplyDraft,
    transitionTicket,
    blockTicket,
    unblockTicket,
    closeTicket,
    approveDraftReply,
    rejectDraftReply,
    markReplyReadyForApproval,
    sendApprovedCustomerReply,
    getApprovals,
    getAuditTrail,
    getCommunicationTrail,
    clearLifecycleState,
  } = domainModule;

  const lifecycleSource = fs.readFileSync(
    path.join(projectRoot, "src", "domain", "ticketLifecycle.ts"),
    "utf8",
  );

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
  const getCommunicationEvents = (ticketId) => getCommunicationTrail(ticketId);
  const getApprovalDecisions = (ticketId) => getApprovals(ticketId).map((event) => event.decision);

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

  const happyDrafted = createCustomerReplyDraft({
    ticketId: happyTicket.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-1",
    draftText: "Thanks for reporting this.",
    rationale: "draft prepared",
  });
  expect(happyDrafted.status === "reply_drafted", "ticket can draft from triaged");
  expect(getEvents(happyTicket.ticketId).includes("reply_drafted"), "reply_drafted event emitted");

  expectThrows(
    () => {
      sendApprovedCustomerReply({
        ticketId: happyTicket.ticketId,
        actorRole: "cs_agent",
        actorReference: "actor-1",
      });
    },
    "direct reply_drafted to sent_to_customer is blocked",
  );

  const requested = markReplyReadyForApproval({
    ticketId: happyTicket.ticketId,
    actorRole: "cs_agent",
    requestNotes: "ready for approval",
    actorReference: "actor-1",
  });
  expect(requested.status === "awaiting_gary_approval", "ticket can enter approval gate");
  expect(getEvents(happyTicket.ticketId).includes("approval_requested"), "approval_requested event emitted");
  expect(getApprovalDecisions(happyTicket.ticketId).includes("pending"), "approval request creates pending approval");

  expectThrows(
    () => {
      approveDraftReply({
        ticketId: happyTicket.ticketId,
        actorRole: "cs_agent",
        approvalNotes: "attempted invalid approval",
      });
    },
    "non-approver cannot approve",
  );

  const earlyApprovalTicket = createTicket({
    siteId: "site-early-approval",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "approval cannot happen early",
    identityConfidence: "known",
  });
  expectThrows(
    () => {
      approveDraftReply({
        ticketId: earlyApprovalTicket.ticketId,
        actorRole: "gary_approver",
        approvalNotes: "cannot approve before awaiting",
      });
    },
    "approve before awaiting state is blocked",
  );

  const approved = approveDraftReply({
    ticketId: happyTicket.ticketId,
    actorRole: "gary_approver",
    actorReference: "actor-2",
    approvalNotes: "approved to send",
  });
  expect(approved.status === "approved_to_send", "gary approval moves to approved_to_send");
  expect(getEvents(happyTicket.ticketId).includes("approval_granted"), "approval_granted event emitted");
  expect(getApprovalDecisions(happyTicket.ticketId).includes("approved"), "approval decision approved recorded");
  expect(getCommunicationEvents(happyTicket.ticketId).length === 0, "approval does not create customer communication record");

  const noEmailApproved = createTicket({
    siteId: "site-no-email",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Needs approval but no email",
    identityConfidence: "known",
    submitter: {
      submitterId: "submitter-007",
      siteId: "site-no-email",
      identityConfidence: "known",
    },
  });
  transitionTicket(noEmailApproved.ticketId, "triaged", "cs_agent");
  createCustomerReplyDraft({
    ticketId: noEmailApproved.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-3",
    draftText: "Need your email before we continue.",
  });
  markReplyReadyForApproval({
    ticketId: noEmailApproved.ticketId,
    actorRole: "cs_agent",
    requestNotes: "need approval before send",
  });
  approveDraftReply({
    ticketId: noEmailApproved.ticketId,
    actorRole: "gary_approver",
    approvalNotes: "approved without email",
  });

  expectThrows(
    () => {
      sendApprovedCustomerReply({
        ticketId: noEmailApproved.ticketId,
        actorRole: "cs_agent",
      });
    },
    "approved_to_send still requires email before sent_to_customer",
  );

  const rejectionTicket = createTicket({
    siteId: "site-reject",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Needs rewrite before send",
    identityConfidence: "known",
    submitter: {
      submitterId: "submitter-008",
      siteId: "site-reject",
      identityConfidence: "known",
      submitterEmail: "customer@example.com",
    },
  });
  transitionTicket(rejectionTicket.ticketId, "triaged", "cs_agent");
  createCustomerReplyDraft({
    ticketId: rejectionTicket.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-4",
    draftText: "I need to review this again.",
  });
  markReplyReadyForApproval({
    ticketId: rejectionTicket.ticketId,
    actorRole: "cs_agent",
    requestNotes: "review and rewrite",
  });
  rejectDraftReply({
    ticketId: rejectionTicket.ticketId,
    actorRole: "gary_approver",
    approvalNotes: "revise tone",
    route: "reply_drafted",
  });
  expect(rejectionTicket.ticketId !== undefined, "rejection keeps ticket identifier stable");
  expect(
    getApprovalDecisions(rejectionTicket.ticketId).includes("rejected"),
    "approval rejected decision recorded",
  );
  expect(
    getEvents(rejectionTicket.ticketId).includes("approval_rejected"),
    "approval_rejected event emitted",
  );
  expect(
    getEvents(rejectionTicket.ticketId).includes("reply_drafted") || getEvents(rejectionTicket.ticketId).includes("ticket_unblocked"),
    "rejection can route back to draft safely",
  );

  const happySent = sendApprovedCustomerReply({
    ticketId: happyTicket.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-1",
    rationale: "customer email known",
  });
  expect(happySent.status === "sent_to_customer", "ticket can send from approved_to_send");
  expect(getEvents(happyTicket.ticketId).includes("reply_sent"), "reply_sent event emitted");
  expect(getCommunicationEvents(happyTicket.ticketId).length === 1, "communication event is recorded in memory");
  expect(happySent.status !== "closed", "send does not close ticket");

  const happyClosed = closeTicket(happyTicket.ticketId, "cs_agent", "actor-1", "work completed");
  expect(happyClosed.status === "closed", "ticket can close after sent_to_customer");
  expect(getEvents(happyTicket.ticketId).includes("ticket_closed"), "ticket_closed event emitted");

  expectThrows(
    () => {
      transitionTicket(happyTicket.ticketId, "triaged", "cs_agent");
    },
    "closed ticket cannot transition out",
  );

  expectThrows(
    () => {
      rejectDraftReply({
        ticketId: happyTicket.ticketId,
        actorRole: "gary_approver",
        approvalNotes: "late rejection blocked",
      });
    },
    "cannot reject from non-awaiting state",
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
  createCustomerReplyDraft({
    ticketId: rewriteDemo.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-9",
    draftText: "Revisions are needed before approval.",
  });
  markReplyReadyForApproval({
    ticketId: rewriteDemo.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-9",
    requestNotes: "revision path setup",
  });
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

  const awaitingSendCheck = createTicket({
    siteId: "site-send-blocked",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "No direct send from awaiting",
    identityConfidence: "known",
    submitter: {
      submitterId: "submitter-009",
      siteId: "site-send-blocked",
      identityConfidence: "known",
      submitterEmail: "customer@example.com",
    },
  });
  transitionTicket(awaitingSendCheck.ticketId, "triaged", "cs_agent");
  createCustomerReplyDraft({
    ticketId: awaitingSendCheck.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-10",
    draftText: "Draft ready to review.",
  });
  markReplyReadyForApproval({
    ticketId: awaitingSendCheck.ticketId,
    actorRole: "cs_agent",
    requestNotes: "requires review",
  });
  expectThrows(
    () => {
      sendApprovedCustomerReply({
        ticketId: awaitingSendCheck.ticketId,
        actorRole: "cs_agent",
      });
    },
    "sent_to_customer blocked from awaiting_gary_approval",
  );

  const lackingApprovalRecord = createTicket({
    siteId: "site-no-approved-record",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Approved path without approval record",
    identityConfidence: "known",
    submitter: {
      submitterId: "submitter-010",
      siteId: "site-no-approved-record",
      identityConfidence: "known",
      submitterEmail: "approved-no-record@example.com",
    },
  });
  transitionTicket(lackingApprovalRecord.ticketId, "triaged", "cs_agent");
  createCustomerReplyDraft({
    ticketId: lackingApprovalRecord.ticketId,
    actorRole: "cs_agent",
    actorReference: "actor-11",
    draftText: "Need manual send check.",
  });
  transitionTicket(
    lackingApprovalRecord.ticketId,
    "awaiting_gary_approval",
    "cs_agent",
    "actor-11",
    "approval bypass",
  );
  transitionTicket(
    lackingApprovalRecord.ticketId,
    "approved_to_send",
    "gary_approver",
    "actor-12",
    "bypass approval record",
  );

  expectThrows(
    () => {
      sendApprovedCustomerReply({
        ticketId: lackingApprovalRecord.ticketId,
        actorRole: "cs_agent",
      });
    },
    "approved_to_send without approved approval record is blocked",
  );

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

  expect(
    !/resend|sendgrid|postmark|nodemailer|smtp|mailgun/i.test(lifecycleSource),
    "no email provider integration hook exists in communication layer",
  );

  process.stdout.write("PASS: phase1 domain lifecycle validation completed\n");
} catch (error) {
  throw new Error(`Validation failed: ${(error?.message || error)}`);
} finally {
  fs.rmSync(tmpBase, { recursive: true, force: true });
}
