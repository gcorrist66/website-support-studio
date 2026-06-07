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

const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "wss-domain-e2e-"));

const requiredAuditTypes = [
  "ticket_created",
  "ticket_triaged",
  "reply_drafted",
  "approval_requested",
  "approval_granted",
  "approval_rejected",
  "reply_sent",
  "ticket_blocked",
  "ticket_unblocked",
  "ticket_closed",
];

const requiredAuditMetadataKeys = {
  ticket_created: ["ticket_source", "site_of_origin", "raw_customer_message", "submission_timestamp", "intake_channel"],
  ticket_triaged: ["triage_owner", "triage_timestamp", "triage_notes"],
  reply_drafted: ["draft_reference", "drafted_reply_text", "drafting_agent", "draft_timestamp"],
  approval_requested: ["approval_request_timestamp", "draft_reference", "gary_assigned"],
  approval_granted: ["approval_timestamp", "approver_id", "approval_decision", "approval_notes"],
  approval_rejected: ["rejection_timestamp", "approver_id", "approval_decision"],
  reply_sent: ["communication_channel", "recipient_contact", "sent_payload_reference", "sent_confirmation"],
  ticket_blocked: ["blocked_reason", "blocked_reason_detail", "blocker_owner", "next_action", "blocked_timestamp"],
  ticket_unblocked: ["previous_blocked_status", "blocked_reason", "unblock_timestamp", "unblock_owner"],
  ticket_closed: ["closure_note", "closure_timestamp", "closed_by", "final_status_summary"],
};

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

const assertAuditFields = (event, sourceTicketId) => {
  const requiredFields = [
    "id",
    "ticketId",
    "actorId",
    "actorRole",
    "eventType",
    "occurredAt",
    "summary",
    "metadata",
  ];
  requiredFields.forEach((field) => expect(event?.[field] !== undefined, `required audit field missing ${field} on ${sourceTicketId}`));
  expect(typeof event?.metadata === "object" && event.metadata !== null, `metadata is object for ${sourceTicketId}`);
  const keys = requiredAuditMetadataKeys[event.eventType] ?? [];
  keys.forEach((key) => expect(event.metadata?.[key] !== undefined, `required metadata field missing ${event.eventType}.${key} for ${sourceTicketId}`));
};

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
  const statusModule = await import(`file://${path.join(tmpDir, "ticketStatus.js")}`);

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

  const { TicketStatus } = statusModule;
  const { ActorRole } = statusModule;

  const lifecycleSource = fs.readFileSync(path.join(projectRoot, "src", "domain", "ticketLifecycle.ts"), "utf8");

  const getEvents = (ticketId) => getAuditTrail(ticketId).map((event) => event.eventType);

  const noProviderHooks = () => {
    expect(
      !/resend|sendgrid|postmark|nodemailer|smtp|mailgun/i.test(lifecycleSource),
      "no email provider integration hook exists in lifecycle",
    );
  };

  const standardFlow = () => {
    const ticket = createTicket({
      siteId: "site-prod-critical",
      intakeChannel: "portal",
      source: "standard-flow",
      rawMessage: "Cannot access dashboard",
      priority: "critical",
      identityConfidence: "known",
      submitter: {
        submitterId: "submitter-standard",
        siteId: "site-prod-critical",
        identityConfidence: "known",
        submitterEmail: "customer@example.com",
        submitterName: "Customer Standard",
      },
      actorReference: "system",
    });

    expect(ticket.status === TicketStatus.RECEIVED, "standard path starts in received");
    expect(getEvents(ticket.ticketId).includes("ticket_created"), "ticket_created emitted");

    transitionTicket(ticket.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "triaged from intake");
    expect(getEvents(ticket.ticketId).includes("ticket_triaged"), "ticket_triaged emitted");

    createCustomerReplyDraft({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      draftText: "Thank you for reporting this production issue. We are investigating.",
      draftAssumptions: "production access impact",
      qualityCheckFlag: true,
    });
    expect(getEvents(ticket.ticketId).includes("reply_drafted"), "reply_drafted emitted");
    expect(ticket.status === TicketStatus.REPLY_DRAFTED, "ticket in reply_drafted");

    expect(
      getCommunicationTrail(ticket.ticketId).length === 0,
      "no communication before approval",
    );

    markReplyReadyForApproval({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      requestNotes: "ready for gary",
    });
    expect(getEvents(ticket.ticketId).includes("approval_requested"), "approval_requested emitted");

    const approvals = getApprovals(ticket.ticketId);
    expect(approvals.at(-1)?.decision === "pending", "approval request created");

    approveDraftReply({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.GARY_APPROVER,
      actorReference: "gary-approver",
      approvalNotes: "approved for customer response",
    });

    expect(getEvents(ticket.ticketId).includes("approval_granted"), "approval_granted emitted");
    expect(ticket.status === TicketStatus.APPROVED_TO_SEND, "ticket approved_to_send");

    expect(
      getCommunicationTrail(ticket.ticketId).length === 0,
      "still no communication before explicit send",
    );

    const sent = sendApprovedCustomerReply({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      rationale: "send approved response",
    });
    expect(sent.status === TicketStatus.SENT_TO_CUSTOMER, "ticket sent to customer");
    expect(getCommunicationTrail(ticket.ticketId).length === 1, "one in-memory communication record exists after send");
    expect(getEvents(ticket.ticketId).includes("reply_sent"), "reply_sent emitted");

    const closed = closeTicket(ticket.ticketId, ActorRole.CS_AGENT, "cs-agent-standard", "customer informed and issue resolved");
    expect(closed.status === TicketStatus.CLOSED, "ticket closed");
    expect(getEvents(ticket.ticketId).includes("ticket_closed"), "ticket_closed emitted");

    const events = getAuditTrail(ticket.ticketId);
    events.forEach((event) => assertAuditFields(event, ticket.ticketId));

    expect(
      events.some((event) => event.eventType === "ticket_closed"),
      "closed event has required lifecycle entry",
    );

    expect(getEvents(ticket.ticketId).includes("ticket_created"), "required audit event exists: ticket_created");
    expect(getEvents(ticket.ticketId).includes("ticket_triaged"), "required audit event exists: ticket_triaged");
    expect(getEvents(ticket.ticketId).includes("reply_drafted"), "required audit event exists: reply_drafted");
    expect(getEvents(ticket.ticketId).includes("approval_requested"), "required audit event exists: approval_requested");
    expect(getEvents(ticket.ticketId).includes("approval_granted"), "required audit event exists: approval_granted");
    expect(getEvents(ticket.ticketId).includes("reply_sent"), "required audit event exists: reply_sent");
    expect(getEvents(ticket.ticketId).includes("ticket_closed"), "required audit event exists: ticket_closed");

    return ticket;
  };

  const duplicateBlockedPath = () => {
    const first = createTicket({
      siteId: "site-dup",
      intakeChannel: "portal",
      source: "duplicate-check",
      rawMessage: "Account password reset not working",
      identityConfidence: "known",
      submitter: {
        submitterId: "submitter-dup",
        siteId: "site-dup",
        identityConfidence: "known",
        submitterEmail: "dup@example.com",
      },
    });

    transitionTicket(first.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "first ticket triage");
    const duplicate = createTicket({
      siteId: "site-dup",
      intakeChannel: "portal",
      source: "duplicate-check",
      rawMessage: "Account password reset not working",
      identityConfidence: "known",
      submitter: {
        submitterId: "submitter-dup-2",
        siteId: "site-dup",
        identityConfidence: "known",
        submitterEmail: "dup2@example.com",
      },
    });

    const blocked = blockTicket({
      ticketId: duplicate.ticketId,
      actorRole: ActorRole.CS_AGENT,
      reason: "duplicate_ticket",
      blockerOwner: ActorRole.CS_AGENT,
      reasonDetail: "Duplicate of existing active ticket",
      nextAction: "dedupe and close duplicate",
    });
    expect(blocked.status === TicketStatus.BLOCKED, "duplicate ticket enters blocked");
    expect(getEvents(duplicate.ticketId).includes("ticket_blocked"), "duplicate path emits ticket_blocked");
    expect(blocked.currentBlockedReason === "duplicate_ticket", "blocked reason is duplicate_ticket");

    const unblocked = unblockTicket({
      ticketId: duplicate.ticketId,
      actorRole: ActorRole.CS_AGENT,
      targetStatus: TicketStatus.TRIAGED,
      rationale: "duplicate resolved",
    });
    expect(unblocked.status === TicketStatus.TRIAGED, "duplicate ticket can unblock to triaged");
    expect(getEvents(duplicate.ticketId).includes("ticket_unblocked"), "duplicate unblock emits ticket_unblocked");
    expect(unblocked.ticketId === duplicate.ticketId, "ticket identity preserved on rewrite");

    expect(first.ticketId !== duplicate.ticketId, "duplicate handling uses distinct ticket IDs");

    return duplicate;
  };

  const missingEmailBlockedPath = () => {
    const ticket = createTicket({
      siteId: "site-no-email",
      intakeChannel: "portal",
      source: "missing-email",
      rawMessage: "Cannot login intermittently",
      identityConfidence: "known",
      submitter: {
        submitterId: "submitter-missing-email",
        siteId: "site-no-email",
        identityConfidence: "known",
      },
    });

    transitionTicket(ticket.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "triage with missing email");
    createCustomerReplyDraft({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      draftText: "Please reply with your email and we will continue.",
    });
    markReplyReadyForApproval({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      requestNotes: "missing customer email",
    });
    approveDraftReply({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.GARY_APPROVER,
      actorReference: "gary-approver",
      approvalNotes: "approved draft while email missing",
    });

    expect(
      getEvents(ticket.ticketId).includes("approval_granted"),
      "approval still allowed before email capture",
    );

    expectThrows(
      () => {
        sendApprovedCustomerReply({
          ticketId: ticket.ticketId,
          actorRole: ActorRole.CS_AGENT,
          actorReference: "cs-agent-standard",
        });
      },
      "send blocked without recipient email",
    );

    const blockedCandidate = createTicket({
      siteId: "site-no-email-blocked",
      intakeChannel: "portal",
      source: "missing-email-blocked",
      rawMessage: "Customer still has no email on file",
      identityConfidence: "known",
      submitter: {
        submitterId: "submitter-missing-email-blocked",
        siteId: "site-no-email-blocked",
        identityConfidence: "known",
      },
    });

    transitionTicket(blockedCandidate.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "triage missing email duplicate");
    createCustomerReplyDraft({
      ticketId: blockedCandidate.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      draftText: "Please provide email to continue.",
    });

    const blocked = blockTicket({
      ticketId: blockedCandidate.ticketId,
      actorRole: ActorRole.CS_AGENT,
      reason: "awaiting_customer",
      blockerOwner: ActorRole.CS_AGENT,
      reasonDetail: "customer email missing",
      mitigationPlan: "request customer email",
      nextAction: "triage after recipient email provided",
    });
    expect(blocked.status === TicketStatus.BLOCKED, "missing email leads to blocked state");
    expect(blocked.currentBlockedReason === "awaiting_customer", "missing email block reason is awaiting_customer");

    return ticket;
  };

  const urgentProductionIssuePriorityPath = () => {
    const urgent = createTicket({
      siteId: "site-urgent",
      intakeChannel: "portal",
      source: "critical-alert",
      rawMessage: "Live checkout API errors for all users",
      identityConfidence: "known",
      priority: "critical",
      submitter: {
        submitterId: "submitter-urgent",
        siteId: "site-urgent",
        identityConfidence: "known",
        submitterEmail: "urgent@example.com",
      },
    });

    expect(urgent.priority === "critical", "critical ticket retains critical priority");
    const triaged = transitionTicket(urgent.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "urgent production issue");
    expect(triaged.status === TicketStatus.TRIAGED, "urgent production issue can triage");

    const draft = createCustomerReplyDraft({
      ticketId: urgent.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      draftText: "We are addressing the production incident now.",
      draftAssumptions: "incident response path",
    });
    expect(draft.priority !== undefined, "urgent draft path remains in-memory only");
    expect(draft.status === TicketStatus.REPLY_DRAFTED, "urgent follows standard draft state");

    return urgent;
  };

  const rejectedRewritePath = () => {
    const ticket = createTicket({
      siteId: "site-rewrite",
      intakeChannel: "portal",
      source: "rewrite-check",
      rawMessage: "Need clearer support language",
      identityConfidence: "claimed",
      submitter: {
        submitterId: "submitter-rewrite",
        siteId: "site-rewrite",
        identityConfidence: "claimed",
        submitterEmail: "rewrite@example.com",
      },
    });

    transitionTicket(ticket.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "triaged for rewrite");
    createCustomerReplyDraft({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      draftText: "Initial draft requiring updates.",
    });
    markReplyReadyForApproval({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      requestNotes: "requires rewrite",
    });

    const rejected = rejectDraftReply({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.GARY_APPROVER,
      actorReference: "gary-approver",
      approverReference: "gary-approver",
      approvalNotes: "tone needs to be adjusted",
      route: "blocked",
    });
    expect(rejected.status === TicketStatus.BLOCKED, "approval rejection routes to blocked state");
    expect(getEvents(ticket.ticketId).includes("approval_rejected"), "approval_rejected emitted");
    const unblocked = unblockTicket({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      targetStatus: TicketStatus.REPLY_DRAFTED,
      rationale: "rewrite approved by agent",
    });
    expect(unblocked.status === TicketStatus.REPLY_DRAFTED, "blocked rejection can continue to rewrite");

    const approvals = getApprovals(ticket.ticketId);
    expect(approvals.at(-1)?.decision === "rejected", "rejection decision recorded");

    return ticket;
  };

  const invalidApprovalBypass = () => {
    const ticket = createTicket({
      siteId: "site-invalid-approval",
      intakeChannel: "portal",
      source: "invalid-approval",
      rawMessage: "Cannot approve before draft",
      identityConfidence: "known",
      submitter: {
        submitterId: "submitter-invalid",
        siteId: "site-invalid-approval",
        identityConfidence: "known",
        submitterEmail: "invalid@example.com",
      },
    });

    transitionTicket(ticket.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "triaged for invalid approval test");

    expectThrows(
      () => {
        approveDraftReply({
          ticketId: ticket.ticketId,
          actorRole: ActorRole.GARY_APPROVER,
          actorReference: "gary-approver",
          approvalNotes: "should fail",
        });
      },
      "approval cannot bypass required draft state",
    );

    return ticket;
  };

  const invalidSendBypass = () => {
    const ticket = createTicket({
      siteId: "site-invalid-send",
      intakeChannel: "portal",
      source: "invalid-send",
      rawMessage: "Direct send should fail before approval",
      identityConfidence: "known",
      submitter: {
        submitterId: "submitter-send",
        siteId: "site-invalid-send",
        identityConfidence: "known",
        submitterEmail: "send@example.com",
      },
    });

    transitionTicket(ticket.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "triaged for invalid send test");
    createCustomerReplyDraft({
      ticketId: ticket.ticketId,
      actorRole: ActorRole.CS_AGENT,
      actorReference: "cs-agent-standard",
      draftText: "Draft not yet approved",
    });

    expectThrows(
      () => {
        sendApprovedCustomerReply({
          ticketId: ticket.ticketId,
          actorRole: ActorRole.CS_AGENT,
          actorReference: "cs-agent-standard",
          rationale: "attempt bypass",
        });
      },
      "send is blocked without approval",
    );

    return ticket;
  };

  const assertClosedTerminal = (ticketId) => {
    expectThrows(
      () => {
        transitionTicket(ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "reopen attempt");
      },
      "closed state cannot reopen",
    );
  };

  const runScenario = (fn) => {
    const ticket = fn();
    const events = getAuditTrail(ticket.ticketId);
    events.forEach((event) => {
      assertAuditFields(event, ticket.ticketId);
    });
    return { ticketId: ticket.ticketId, events, ticket };
  };

  clearLifecycleState();

  const standardResult = runScenario(standardFlow);

  const dupResult = runScenario(duplicateBlockedPath);
  expect(dupResult.events.some((event) => event.eventType === "ticket_blocked"), "duplicate path includes blocked");
  expect(dupResult.events.some((event) => event.eventType === "ticket_unblocked"), "duplicate path includes unblocked");

  runScenario(missingEmailBlockedPath);
  runScenario(urgentProductionIssuePriorityPath);

  const rejectedResult = runScenario(rejectedRewritePath);
  expect(
    rejectedResult.events.some((event) => event.eventType === "approval_rejected"),
    "approval_rejected exists in rejected rewrite scenario",
  );

  const invalidApprovalResult = runScenario(invalidApprovalBypass);
  expect(invalidApprovalResult.ticket.ticketId !== "", "invalid approval ticket observed");

  const invalidSendResult = runScenario(invalidSendBypass);
  expect(invalidSendResult.ticket.ticketId !== "", "invalid send ticket observed");

  const allObservedEvents = new Set([
    ...standardResult.events.map((event) => event.eventType),
    ...dupResult.events.map((event) => event.eventType),
    ...invalidApprovalResult.events.map((event) => event.eventType),
    ...invalidSendResult.events.map((event) => event.eventType),
    ...rejectedResult.events.map((event) => event.eventType),
  ]);

  requiredAuditTypes.forEach((type) => {
    expect(allObservedEvents.has(type), `required event present across scenarios: ${type}`);
  });

  const closedTicketCheck = createTicket({
    siteId: "site-terminal",
    intakeChannel: "portal",
    source: "terminal-check",
    rawMessage: "Terminal state check",
    identityConfidence: "known",
    submitter: {
      submitterId: "submitter-terminal",
      siteId: "site-terminal",
      identityConfidence: "known",
      submitterEmail: "terminal@example.com",
    },
  });
  transitionTicket(closedTicketCheck.ticketId, TicketStatus.TRIAGED, ActorRole.CS_AGENT, "cs-agent-standard", "triage terminal case");
  createCustomerReplyDraft({
    ticketId: closedTicketCheck.ticketId,
    actorRole: ActorRole.CS_AGENT,
    actorReference: "cs-agent-standard",
    draftText: "Resolved quickly.",
  });
  markReplyReadyForApproval({
    ticketId: closedTicketCheck.ticketId,
    actorRole: ActorRole.CS_AGENT,
    actorReference: "cs-agent-standard",
    requestNotes: "ready",
  });
  approveDraftReply({
    ticketId: closedTicketCheck.ticketId,
    actorRole: ActorRole.GARY_APPROVER,
    actorReference: "gary-approver",
    approvalNotes: "approved",
  });
  const sentTerminalStatus = sendApprovedCustomerReply({
    ticketId: closedTicketCheck.ticketId,
    actorRole: ActorRole.CS_AGENT,
    actorReference: "cs-agent-standard",
  }).status;
  const closedTerminal = closeTicket(
    closedTicketCheck.ticketId,
    ActorRole.CS_AGENT,
    "cs-agent-standard",
    "completed and verified",
  );
  expect(sentTerminalStatus === TicketStatus.SENT_TO_CUSTOMER, "closed terminal setup can reach sent_to_customer");
  expect(closedTerminal.status === TicketStatus.CLOSED, "closed terminal ticket reached");
  assertClosedTerminal(closedTerminal.ticketId);

  noProviderHooks();

  const communicationEvents = getCommunicationTrail(standardResult.ticketId);
  expect(communicationEvents.length > 0, "communication recorded in-memory in standard flow");
  expect(
    communicationEvents.every((record) => record.communicationChannel === "in_memory_record"),
    "communication records remain local-only",
  );

  process.stdout.write("PASS: phase1 e2e validation completed\n");
} catch (error) {
  throw new Error(`Validation failed: ${error?.message || error}`);
} finally {
  fs.rmSync(tmpBase, { recursive: true, force: true });
}
