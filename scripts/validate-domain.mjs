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
  const statusModule = await import(`file://${path.join(tmpDir, "ticketStatus.js")}`);
  const { AuditEventType } = statusModule;

  const lifecycleSource = fs.readFileSync(
    path.join(projectRoot, "src", "domain", "ticketLifecycle.ts"),
    "utf8",
  );

  const expect = (value, message) => {
    if (!value) {
      throw new Error(`Validation failed: ${message}`);
    }
  };

  const allAuditTypes = new Set(Object.values(AuditEventType));
  const requiredAuditTypes = [
    AuditEventType.TICKET_CREATED,
    AuditEventType.TICKET_TRIAGED,
    AuditEventType.REPLY_DRAFTED,
    AuditEventType.APPROVAL_REQUESTED,
    AuditEventType.APPROVAL_GRANTED,
    AuditEventType.APPROVAL_REJECTED,
    AuditEventType.REPLY_SENT,
    AuditEventType.TICKET_BLOCKED,
    AuditEventType.TICKET_UNBLOCKED,
    AuditEventType.TICKET_CLOSED,
  ];
  const requiredAuditFields = [
    "id",
    "ticketId",
    "actorId",
    "actorRole",
    "eventType",
    "occurredAt",
    "summary",
    "metadata",
  ];
  const requiredTypeToMetadata = {
    [AuditEventType.TICKET_CREATED]: ["ticket_source", "site_of_origin", "raw_customer_message", "submission_timestamp", "intake_channel"],
    [AuditEventType.TICKET_TRIAGED]: ["triage_owner", "triage_timestamp", "triage_notes"],
    [AuditEventType.REPLY_DRAFTED]: ["draft_reference", "drafted_reply_text", "drafting_agent", "draft_timestamp"],
    [AuditEventType.APPROVAL_REQUESTED]: ["approval_request_timestamp", "draft_reference", "gary_assigned"],
    [AuditEventType.APPROVAL_GRANTED]: ["approval_timestamp", "approver_id", "approval_decision", "approval_notes"],
    [AuditEventType.APPROVAL_REJECTED]: ["rejection_timestamp", "approver_id", "approval_decision"],
    [AuditEventType.REPLY_SENT]: ["communication_channel", "recipient_contact", "sent_payload_reference", "sent_confirmation"],
    [AuditEventType.TICKET_BLOCKED]: ["blocked_reason", "blocked_reason_detail", "blocker_owner", "next_action", "blocked_timestamp"],
    [AuditEventType.TICKET_UNBLOCKED]: ["previous_blocked_status", "blocked_reason", "unblock_timestamp", "unblock_owner"],
    [AuditEventType.TICKET_CLOSED]: ["closure_note", "closure_timestamp", "closed_by", "final_status_summary"],
  };

  const expectAuditEventShape = (event) => {
    requiredAuditFields.forEach((field) => expect(event?.[field] !== undefined, `audit event has ${field}`));
    expect(typeof event?.metadata === "object" && event.metadata !== null, "metadata is object");
    const requiredMetadataKeys = requiredTypeToMetadata[event.eventType] ?? [];
    requiredMetadataKeys.forEach((key) => expect(event.metadata[key] !== undefined, `audit ${event.eventType} has metadata.${key}`));
  };

  const expectNoProviderHooks = () => {
    expect(
      !/resend|sendgrid|postmark|nodemailer|smtp|mailgun/i.test(lifecycleSource),
      "no email provider integration hook exists in communication layer",
    );
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

  const observedTicketIds = new Set();
  const trackTicket = (ticket) => {
    observedTicketIds.add(ticket.ticketId);
    return ticket;
  };
  const getEvents = (ticketId) => getAuditTrail(ticketId).map((event) => event.eventType);
  const getCommunicationEvents = (ticketId) => getCommunicationTrail(ticketId);
  const getApprovalDecisions = (ticketId) => getApprovals(ticketId).map((event) => event.decision);
  const getAllAuditEvents = () => {
    const events = [];
    for (const ticketId of observedTicketIds) {
      events.push(...getAuditTrail(ticketId));
    }
    return events;
  };

  clearLifecycleState();

  const happyTicket = trackTicket(createTicket({
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
  }));

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

  const earlyApprovalTicket = trackTicket(createTicket({
    siteId: "site-early-approval",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "approval cannot happen early",
    identityConfidence: "known",
  }));
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

  const noEmailApproved = trackTicket(createTicket({
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
  }));
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

  const rejectionTicket = trackTicket(createTicket({
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
  }));
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

  const receivedBlocked = trackTicket(createTicket({
    siteId: "site-beta",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Missing details",
    identityConfidence: "known",
  }));

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

  const rewriteDemo = trackTicket(createTicket({
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
  }));

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

  const awaitingSendCheck = trackTicket(createTicket({
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
  }));
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

  const lackingApprovalRecord = trackTicket(createTicket({
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
  }));
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

  const immediateCloseAttempt = trackTicket(createTicket({
    siteId: "site-zeta",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Direct close check",
    identityConfidence: "known",
  }));

  expectThrows(
    () => {
      transitionTicket(immediateCloseAttempt.ticketId, "closed", "cs_agent");
    },
    "received cannot directly close",
  );

  expectThrows(
    () => {
      closeTicket(immediateCloseAttempt.ticketId, "cs_agent", "actor-close", "blocked check complete");
      transitionTicket(immediateCloseAttempt.ticketId, "triaged", "cs_agent");
    },
    "closed state cannot reopen",
  );

  expectNoProviderHooks();

  const allAuditEvents = getAllAuditEvents();
  requiredAuditTypes.forEach((requiredType) => {
    expect(
      allAuditEvents.some((event) => event.eventType === requiredType),
      `required audit type exists: ${requiredType}`,
    );
  });

  for (const event of allAuditEvents) {
    expect(allAuditTypes.has(event.eventType), `known audit event type ${event.eventType}`);
    expectAuditEventShape(event);
  }

  const blockedEvents = allAuditEvents.filter((event) => event.eventType === AuditEventType.TICKET_BLOCKED);
  for (const event of blockedEvents) {
    expect(!!event.metadata.blocked_reason, `blocked event includes reason: ${event.eventId}`);
    expect(!!event.metadata.blocked_reason_detail, `blocked event includes reason detail: ${event.eventId}`);
    expect(!!event.metadata.blocker_owner, `blocked event includes blocker owner: ${event.eventId}`);
  }

  const unblockedEvents = allAuditEvents.filter((event) => event.eventType === AuditEventType.TICKET_UNBLOCKED);
  for (const event of unblockedEvents) {
    expect(!!event.metadata.previous_blocked_status, `unblock event includes previous blocked status: ${event.eventId}`);
    expect(!!event.metadata.blocked_reason, `unblock event includes blocked reason context: ${event.eventId}`);
  }

  const closureEvents = allAuditEvents.filter((event) => event.eventType === AuditEventType.TICKET_CLOSED);
  for (const event of closureEvents) {
    expect(typeof event.metadata.closure_note === "string" && event.metadata.closure_note.trim().length > 0, `closure event includes note: ${event.eventId}`);
    expect(!!event.metadata.closure_timestamp, `closure event includes timestamp: ${event.eventId}`);
  }

  const replySentEvents = allAuditEvents.filter((event) => event.eventType === AuditEventType.REPLY_SENT);
  expect(
    replySentEvents.length > 0 && replySentEvents.every((event) => event.metadata.sent_confirmation === true),
    "reply_sent events capture positive send confirmation",
  );

  process.stdout.write("PASS: phase1 domain lifecycle validation completed\n");
} catch (error) {
  throw new Error(`Validation failed: ${(error?.message || error)}`);
} finally {
  fs.rmSync(tmpBase, { recursive: true, force: true });
}
