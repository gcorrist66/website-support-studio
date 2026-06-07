import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = ["dev", "development", "local"];
const DB_QUERY_TIMEOUT_MS = 120000;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function quoteSqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function parseQueryRows(output) {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < 0) {
    throw new Error(`invalid_cli_output_${output.slice(0, 120)}`);
  }
  const parsed = JSON.parse(output.slice(start, end + 1));
  return parsed.rows ?? [];
}

function runQuery(sql) {
  const out = execFileSync(
    "supabase",
    ["db", "query", "--linked", "--output", "json", sql],
    { encoding: "utf8", timeout: DB_QUERY_TIMEOUT_MS },
  );
  return parseQueryRows(out);
}

function runCommandPlan(commands) {
  for (const sql of commands) {
    runQuery(sql);
  }
}

function safeRunCommand(commandLabel, commands) {
  try {
    runCommandPlan(commands);
  } catch (error) {
    throw new Error(`${commandLabel}: ${error.message}`);
  }
}

function runExpectedFailure(commandLabel, commandSql) {
  try {
    runQuery(commandSql);
  } catch {
    return;
  }
  throw new Error(`expected failure did not occur: ${commandLabel}`);
}

function toLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  if (typeof value === "object") {
    return `${quoteSqlLiteral(JSON.stringify(value))}::jsonb`;
  }
  return `${quoteSqlLiteral(value)}`;
}

function buildInsertSql(table, row) {
  const keys = Object.keys(row);
  const values = keys.map((key) => toLiteral(row[key]));
  return `insert into public.${table} (${keys.join(", ")}) values (${values.join(", ")});`;
}

function buildExpectedEventSet() {
  return new Set([
    "ticket_created",
    "ticket_triaged",
    "reply_drafted",
    "approval_requested",
    "approval_granted",
    "reply_sent",
    "ticket_closed",
  ]);
}

function assertLocalExecutionGate() {
  const providedRef = process.env.WSS_SUPABASE_PROJECT_REF;
  const allowMode = process.env.WSS_SUPABASE_ENVIRONMENT;
  const explicitOptIn = process.env.WSS_ALLOW_SUPABASE_VALIDATION;

  if (explicitOptIn !== "dev") {
    throw new Error(
      "Refusing to run persistence adapter validation without explicit local opt-in. Set WSS_ALLOW_SUPABASE_VALIDATION=dev.",
    );
  }
  if (!providedRef) {
    throw new Error("Set WSS_SUPABASE_PROJECT_REF=<project-ref> before running this validation.");
  }
  if (providedRef !== DEV_PROJECT_REF) {
    throw new Error(
      `Unexpected Supabase project ref ${providedRef}; expected non-production Phase-2 dev ref ${DEV_PROJECT_REF}.`,
    );
  }
  if (!allowMode || !ALLOWED_NON_PRODUCTION_ENVS.includes(allowMode.toLowerCase())) {
    throw new Error("Set WSS_SUPABASE_ENVIRONMENT=dev|development|local before running validation.");
  }
}

function assertLocalSupabaseConfig() {
  const configPath = path.join(process.cwd(), ".supabase", "config.toml");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      "Cannot run persistence adapter validation: no local Supabase project link found. Run: supabase link --project-ref vrtfbbrwrxyljchywmzy --yes",
    );
  }

  const configText = fs.readFileSync(configPath, "utf8");
  if (!configText.includes(DEV_PROJECT_REF)) {
    throw new Error(
      `Local Supabase link does not match expected Phase-2 dev ref ${DEV_PROJECT_REF}; aborting non-production safety check.`,
    );
  }
}

function collectTenantIds(prefix) {
  const suffix = Date.now().toString().slice(-8);
  const agencyId = crypto.randomUUID();
  const clientId = crypto.randomUUID();
  const siteId = crypto.randomUUID();
  const ticketId = crypto.randomUUID();

  return {
    runId: `${prefix}-${suffix}`,
    agencyId,
    clientId,
    siteId,
    ticketId,
    actorEmail: `${prefix}-${suffix}@example.com`,
    actorId: `${prefix}-${suffix}`,
  };
}

function buildInsertStatements(context) {
  const tenant = context;
  const createdAt = new Date().toISOString();

  const agency = {
    id: tenant.agencyId,
    name: `Adapter Agency ${tenant.runId}`,
    slug: `adapter-agency-${tenant.runId}`,
  };

  const client = {
    id: tenant.clientId,
    agency_id: tenant.agencyId,
    name: `Adapter Client ${tenant.runId}`,
    slug: `adapter-client-${tenant.runId}`,
  };

  const site = {
    id: tenant.siteId,
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    name: `Adapter Site ${tenant.runId}`,
    url: `https://adapter-${tenant.runId}.example.com`,
    slug: `adapter-site-${tenant.runId}`,
  };

  const ticket = {
    id: tenant.ticketId,
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_number: `A-${tenant.runId}`,
    title: "Local adapter validation ticket",
    description: "Phase 1 workflow adapter verification",
    status: "received",
    priority: "normal",
    identity_confidence: "known",
    submitter_name: "Adapter Submitter",
    submitter_email: tenant.actorEmail,
    blocked_reason: null,
    blocked_from_status: null,
    blocked_notes: null,
    closure_note: null,
    closed_at: null,
  };

  const messageInsert = {
    id: crypto.randomUUID(),
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: tenant.ticketId,
    author_id: tenant.actorId,
    author_role: "cs_agent",
    message_body: "Customer requested an update on account provisioning.",
    message_direction: "inbound",
    created_at: createdAt,
  };

  const draftInsert = {
    id: crypto.randomUUID(),
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: tenant.ticketId,
    drafted_by: tenant.actorId,
    draft_body: "Thanks for reaching out. We will review this soon.",
    status: "ready_for_approval",
    created_at: createdAt,
    updated_at: createdAt,
  };

  const approvalRequestId = crypto.randomUUID();
  const approvalInsert = {
    id: approvalRequestId,
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: tenant.ticketId,
    draft_reply_id: draftInsert.id,
    requested_by: tenant.actorId,
    approver_id: tenant.actorId,
    approver_role: "gary_approver",
    status: "approved",
    decision_note: "Approved after review",
    requested_at: createdAt,
    decided_at: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  };

  const communicationInsert = {
    id: crypto.randomUUID(),
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: tenant.ticketId,
    draft_reply_id: draftInsert.id,
    approval_id: approvalInsert.id,
    recipient_email: tenant.actorEmail,
    subject: "Re: Account provisioning",
    body: draftInsert.draft_body,
    delivery_status: "pending",
    external_provider: null,
    external_message_id: null,
    sent_at: createdAt,
    created_at: createdAt,
  };

  const eventIds = {
    ticketCreated: crypto.randomUUID(),
    triaged: crypto.randomUUID(),
    drafted: crypto.randomUUID(),
    approvalRequested: crypto.randomUUID(),
    approvalGranted: crypto.randomUUID(),
    replySent: crypto.randomUUID(),
    closed: crypto.randomUUID(),
  };

  const auditEvents = [
    {
      id: eventIds.ticketCreated,
      agency_id: tenant.agencyId,
      client_id: tenant.clientId,
      site_id: tenant.siteId,
      ticket_id: tenant.ticketId,
      actor_id: tenant.actorId,
      actor_role: "system",
      event_type: "ticket_created",
      summary: "Ticket created",
      metadata: { event: "ticket_created", run: tenant.runId, actor: tenant.actorId },
      occurred_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: eventIds.triaged,
      agency_id: tenant.agencyId,
      client_id: tenant.clientId,
      site_id: tenant.siteId,
      ticket_id: tenant.ticketId,
      actor_id: tenant.actorId,
      actor_role: "cs_agent",
      event_type: "ticket_triaged",
      summary: "Ticket triaged",
      metadata: { event: "ticket_triaged", run: tenant.runId },
      occurred_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: eventIds.drafted,
      agency_id: tenant.agencyId,
      client_id: tenant.clientId,
      site_id: tenant.siteId,
      ticket_id: tenant.ticketId,
      actor_id: tenant.actorId,
      actor_role: "cs_agent",
      event_type: "reply_drafted",
      summary: "Draft reply created",
      metadata: { event: "reply_drafted", run: tenant.runId },
      occurred_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: eventIds.approvalRequested,
      agency_id: tenant.agencyId,
      client_id: tenant.clientId,
      site_id: tenant.siteId,
      ticket_id: tenant.ticketId,
      actor_id: tenant.actorId,
      actor_role: "cs_agent",
      event_type: "approval_requested",
      summary: "Approval requested",
      metadata: { event: "approval_requested", run: tenant.runId },
      occurred_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: eventIds.approvalGranted,
      agency_id: tenant.agencyId,
      client_id: tenant.clientId,
      site_id: tenant.siteId,
      ticket_id: tenant.ticketId,
      actor_id: tenant.actorId,
      actor_role: "gary_approver",
      event_type: "approval_granted",
      summary: "Approval granted",
      metadata: { event: "approval_granted", run: tenant.runId },
      occurred_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: eventIds.replySent,
      agency_id: tenant.agencyId,
      client_id: tenant.clientId,
      site_id: tenant.siteId,
      ticket_id: tenant.ticketId,
      actor_id: tenant.actorId,
      actor_role: "cs_agent",
      event_type: "reply_sent",
      summary: "Reply sent",
      metadata: { event: "reply_sent", run: tenant.runId },
      occurred_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: eventIds.closed,
      agency_id: tenant.agencyId,
      client_id: tenant.clientId,
      site_id: tenant.siteId,
      ticket_id: tenant.ticketId,
      actor_id: tenant.actorId,
      actor_role: "system",
      event_type: "ticket_closed",
      summary: "Ticket closed",
      metadata: { event: "ticket_closed", run: tenant.runId, closure_note: "validated" },
      occurred_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  return {
    tenant,
    inserts: {
      agency,
      client,
      site,
      ticket,
      messageInsert,
      draftInsert,
      approvalInsert,
      communicationInsert,
      auditEvents,
    },
  };
}

function verifyTenantRoundtrip(tenant) {
  const ticketRows = runQuery(
    `select id, agency_id, client_id, site_id, ticket_number, submitter_email, status from public.tickets where id = '${tenant.ticketId}';`,
  );
  assert(ticketRows.length === 1, "ticket should be persisted exactly once");

  const ticketRow = ticketRows[0];
  assert(ticketRow.agency_id === tenant.agencyId, "ticket agency_id mismatch");
  assert(ticketRow.client_id === tenant.clientId, "ticket client_id mismatch");
  assert(ticketRow.site_id === tenant.siteId, "ticket site_id mismatch");
  assert(ticketRow.submitter_email.endsWith("@example.com"), "test actor email should remain fake/local");

  const childRows = runQuery(
    `select id, agency_id, client_id from public.sites where id = '${tenant.siteId}';`,
  );
  assert(childRows.length === 1, "site should be persisted");
  assert(childRows[0].agency_id === tenant.agencyId, "site agency_id mismatch");
  assert(childRows[0].client_id === tenant.clientId, "site client_id mismatch");

  const messageRows = runQuery(
    `select count(*)::int as count from public.ticket_messages where ticket_id = '${tenant.ticketId}';`,
  );
  assert(Number(messageRows[0].count) === 1, "expected one inbound message");

  const draftRows = runQuery(
    `select count(*)::int as count from public.ticket_draft_replies where ticket_id = '${tenant.ticketId}';`,
  );
  assert(Number(draftRows[0].count) === 1, "expected one draft reply");

  const approvalRows = runQuery(
    `select count(*)::int as count from public.ticket_approvals where ticket_id = '${tenant.ticketId}';`,
  );
  assert(Number(approvalRows[0].count) === 1, "expected one approval");

  const auditRows = runQuery(
    `select count(*)::int as count, array_agg(event_type order by occurred_at) as event_types from public.ticket_audit_events where ticket_id = '${tenant.ticketId}';`,
  );
  assert(Number(auditRows[0].count) >= 6, "expected multiple audit events for workflow");
  assert(auditRows[0].event_types !== null, "audit event_types should be present");

  const auditTypes = runQuery(
    `select event_type from public.ticket_audit_events where ticket_id = '${tenant.ticketId}' order by occurred_at;`,
  ).map((row) => row.event_type);
  for (const eventType of buildExpectedEventSet()) {
    assert(auditTypes.includes(eventType), `missing audit event ${eventType}`);
  }

  const commRows = runQuery(
    `select ticket_id, approval_id, delivery_status, external_provider, external_message_id from public.ticket_communications where ticket_id = '${tenant.ticketId}';`,
  );
  assert(commRows.length === 1, "expected one communication row");
  assert(commRows[0].approval_id !== null, "communication missing approval_id");
  assert(commRows[0].delivery_status !== "sent", "communication should not be marked sent in local-only phase");
  assert(commRows[0].external_provider === null, "communication should not persist external provider");
  assert(commRows[0].external_message_id === null, "communication should not persist external message id");
}

function readBackRoundTrip(tenant) {
  const reads = {
    ticket: runQuery(`select * from public.tickets where id = '${tenant.ticketId}';`),
    audits: runQuery(`select * from public.ticket_audit_events where ticket_id = '${tenant.ticketId}';`),
    comms: runQuery(`select * from public.ticket_communications where ticket_id = '${tenant.ticketId}';`),
    approvals: runQuery(`select * from public.ticket_approvals where ticket_id = '${tenant.ticketId}';`),
  };
  assert(reads.ticket.length === 1, "ticket readback failed");
  assert(reads.audits.length >= 7, "audit trail readback incomplete");
  assert(reads.approvals.length === 1, "approval readback failed");
  assert(reads.comms.length === 1, "communication readback failed");
}

function verifyAuditCompleteness(tenant) {
  const auditCheckRows = runQuery(
    `select actor_id, actor_role, summary, metadata from public.ticket_audit_events where ticket_id='${tenant.ticketId}' order by occurred_at;`,
  );
  assert(auditCheckRows.length >= 1, "audit trail should return records");
  assert(auditCheckRows.every((row) => row.actor_id), "audit actor_id must be present");
  assert(auditCheckRows.every((row) => row.actor_role), "audit actor_role must be present");
  assert(auditCheckRows.every((row) => row.summary), "audit summary must be present");
  assert(auditCheckRows.every((row) => row.metadata), "audit metadata must be present");
}

function runFailurePathChecks(tenant, inserts) {
  const invalidTicketInsert = buildInsertSql("tickets", {
    ...inserts.ticket,
    id: crypto.randomUUID(),
    site_id: null,
  });
  runExpectedFailure(
    "ticket inserts require tenant hierarchy ids",
    invalidTicketInsert.replace(/null/g, "null"),
  );

  const approvalMissingTicket = buildInsertSql("ticket_approvals", {
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: "missing-ticket-id",
    draft_reply_id: inserts.draftInsert.id,
    requested_by: tenant.actorId,
    approver_id: tenant.actorId,
    approver_role: "gary_approver",
    status: "approved",
    decision_note: "No ticket",
    requested_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  runExpectedFailure("approval requires valid ticket FK", approvalMissingTicket);

  const communicationWithoutApproval = buildInsertSql("ticket_communications", {
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: tenant.ticketId,
    draft_reply_id: inserts.draftInsert.id,
    recipient_email: `invalid-${tenant.actorEmail}`,
    subject: "Unauthorized send",
    body: "Should fail without approval",
    delivery_status: "sent",
    external_provider: null,
    external_message_id: null,
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
  runExpectedFailure("communication requires approval_id", communicationWithoutApproval);

  const auditMissingTicket = buildInsertSql("ticket_audit_events", {
    id: crypto.randomUUID(),
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    actor_id: tenant.actorId,
    actor_role: "system",
    event_type: "ticket_created",
    summary: "missing ticket audit",
    metadata: { event: "ticket_created", run: tenant.runId },
    occurred_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  runExpectedFailure("audit requires ticket_id", auditMissingTicket);
}

function safeDelete(sql) {
  try {
    runQuery(sql);
  } catch (error) {
    console.warn(`cleanup warning: ${error.message}`);
  }
}

function cleanupTenantData(tenant) {
  safeDelete(`delete from public.ticket_communications where ticket_id = '${tenant.ticketId}';`);
  safeDelete(`delete from public.ticket_approvals where ticket_id = '${tenant.ticketId}';`);
  safeDelete(`delete from public.ticket_draft_replies where ticket_id = '${tenant.ticketId}';`);
  safeDelete(`delete from public.ticket_messages where ticket_id = '${tenant.ticketId}';`);
  safeDelete(`delete from public.ticket_audit_events where ticket_id = '${tenant.ticketId}';`);
  safeDelete(`delete from public.tickets where id = '${tenant.ticketId}';`);
  safeDelete(`delete from public.sites where id='${tenant.siteId}';`);
  safeDelete(`delete from public.clients where id='${tenant.clientId}';`);
  safeDelete(`delete from public.agencies where id='${tenant.agencyId}';`);
}

function assertNoResidualData(tenant) {
  const afterRows = runQuery(`select
    (select count(*) from public.agencies where id='${tenant.agencyId}') as agencies,
    (select count(*) from public.clients where id='${tenant.clientId}') as clients,
    (select count(*) from public.sites where id='${tenant.siteId}') as sites,
    (select count(*) from public.tickets where id='${tenant.ticketId}') as tickets,
    (select count(*) from public.ticket_messages where ticket_id='${tenant.ticketId}') as messages,
    (select count(*) from public.ticket_audit_events where ticket_id='${tenant.ticketId}') as audit_events;`);
  assert(Number(afterRows[0].agencies) === 0, "agency cleanup failed");
  assert(Number(afterRows[0].clients) === 0, "client cleanup failed");
  assert(Number(afterRows[0].sites) === 0, "site cleanup failed");
  assert(Number(afterRows[0].tickets) === 0, "ticket cleanup failed");
  assert(Number(afterRows[0].messages) === 0, "ticket message cleanup failed");
  assert(Number(afterRows[0].audit_events) === 0, "audit cleanup failed");
}

function run() {
  assertLocalExecutionGate();
  assertLocalSupabaseConfig();
  const context = collectTenantIds("wss-adapter");
  const { tenant, inserts } = buildInsertStatements(context);

  try {
    safeRunCommand("apply workflow rows", [
      buildInsertSql("agencies", inserts.agency),
      buildInsertSql("clients", inserts.client),
      buildInsertSql("sites", inserts.site),
      buildInsertSql("tickets", inserts.ticket),
      buildInsertSql("ticket_messages", inserts.messageInsert),
      buildInsertSql("ticket_draft_replies", inserts.draftInsert),
      buildInsertSql("ticket_approvals", inserts.approvalInsert),
      buildInsertSql("ticket_communications", inserts.communicationInsert),
      ...inserts.auditEvents.map((event) => buildInsertSql("ticket_audit_events", event)),
    ]);

    verifyTenantRoundtrip(tenant);
    readBackRoundTrip(tenant);
    verifyAuditCompleteness(tenant);
    runFailurePathChecks(tenant, inserts);

    console.log(
      JSON.stringify({
        status: "pass",
        runId: tenant.runId,
        ticketId: tenant.ticketId,
        agencyId: tenant.agencyId,
        clientId: tenant.clientId,
        siteId: tenant.siteId,
      }, null, 2),
    );
  } finally {
    cleanupTenantData(tenant);
    assertNoResidualData(tenant);
  }
}

run();
