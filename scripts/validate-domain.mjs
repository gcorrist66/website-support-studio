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

  const domainModule = await import(
    `file://${path.join(tmpDir, "ticketLifecycle.js")}`
  );

  const {
    createTicket,
    transitionTicket,
    blockTicket,
    unblockTicket,
    closeTicket,
    getAuditTrail,
    clearLifecycleState,
    getTicket,
  } = domainModule;

  const expect = (value, message) => {
    if (!value) {
      throw new Error(`Validation failed: ${message}`);
    }
  };

  const getEvents = (ticketId) => getAuditTrail(ticketId).map((event) => event.eventType);

  clearLifecycleState();
  const ticket = createTicket({
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

  expect(ticket.status === "received", "ticket starts received");
  expect(getEvents(ticket.ticketId).includes("ticket_created"), "ticket_created event emitted");

  const triaged = transitionTicket(ticket.ticketId, "triaged", "cs_agent", "actor-1", "triage complete");
  expect(triaged.status === "triaged", "ticket triaged");
  expect(getEvents(ticket.ticketId).includes("ticket_triaged"), "ticket_triaged event emitted");

  const drafted = transitionTicket(ticket.ticketId, "reply_drafted", "cs_agent", "actor-1", "draft prepared");
  expect(drafted.status === "reply_drafted", "draft state reached");
  expect(getEvents(ticket.ticketId).includes("reply_drafted"), "reply_drafted event emitted");

  const awaiting = transitionTicket(ticket.ticketId, "awaiting_gary_approval", "cs_agent", "actor-1", "ready for approval");
  expect(awaiting.status === "awaiting_gary_approval", "approval requested");
  expect(getEvents(ticket.ticketId).includes("approval_requested"), "approval_requested event emitted");

  const approved = transitionTicket(
    ticket.ticketId,
    "approved_to_send",
    "gary_approver",
    "actor-2",
    "approved to send",
  );
  expect(approved.status === "approved_to_send", "approved_to_send state reached");
  expect(getEvents(ticket.ticketId).includes("approval_granted"), "approval_granted event emitted");

  // Add known submitter email to satisfy pre-send check in a local flow.
  const sendable = transitionTicket(
    ticket.ticketId,
    "sent_to_customer",
    "cs_agent",
    "actor-1",
    "customer email known",
  );
  expect(sendable.status === "sent_to_customer", "sent_to_customer state reached");
  expect(getEvents(ticket.ticketId).includes("reply_sent"), "reply_sent event emitted");

  const blockedDemo = createTicket({
    siteId: "site-alpha",
    intakeChannel: "portal",
    source: "unit-portal",
    rawMessage: "Email missing",
    priority: "high",
    identityConfidence: "claimed",
  });
  const blocked = blockTicket({
    ticketId: blockedDemo.ticketId,
    actorRole: "cs_agent",
    reason: "awaiting_customer",
    blockerOwner: "cs_agent",
    reasonDetail: "Need identity verification",
    rationale: "capture missing contact email",
  });
  expect(blocked.status === "blocked", "ticket blocked");
  expect(getEvents(blockedDemo.ticketId).includes("ticket_blocked"), "ticket_blocked event emitted");

  const unblocked = unblockTicket({
    ticketId: blockedDemo.ticketId,
    actorRole: "cs_agent",
    targetStatus: "triaged",
    rationale: "customer contact captured",
  });
  expect(unblocked.status === "triaged", "ticket unblocked to triaged");
  expect(getEvents(blockedDemo.ticketId).includes("ticket_unblocked"), "ticket_unblocked event emitted");
  expect(
    getEvents(blockedDemo.ticketId).includes("approval_rejected") ||
      getEvents(blockedDemo.ticketId).includes("ticket_unblocked"),
    "blocked flow emits required transition support events",
  );

  const closed = closeTicket(ticket.ticketId, "cs_agent", "actor-1", "work completed");
  expect(closed.status === "closed", "ticket closed");
  expect(getEvents(ticket.ticketId).includes("ticket_closed"), "ticket_closed event emitted");
  expect(getTicket(ticket.ticketId)?.status === "closed", "getTicket returns final state");
  process.stdout.write("PASS: phase1 domain lifecycle validation completed\n");
} catch (error) {
  throw new Error(`Validation failed: ${(error?.message || error)}`);
} finally {
  fs.rmSync(tmpBase, { recursive: true, force: true });
}
