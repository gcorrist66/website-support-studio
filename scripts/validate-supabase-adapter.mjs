import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const DB_QUERY_TIMEOUT_MS = 120000;

function parseQueryRows(output) {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < 0) {
    throw new Error(`invalid_cli_output_${output.slice(0, 120)}`);
  }
  const jsonText = output.slice(start, end + 1);
  const parsed = JSON.parse(jsonText);
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeSafeLiteral(input) {
  return String(input).replace(/'/g, "''");
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
    return `'${makeSafeLiteral(JSON.stringify(value))}'::jsonb`;
  }
  return `'${makeSafeLiteral(value)}'`;
}

function runCommandPlan(commands) {
  for (const sql of commands) {
    runQuery(sql);
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
    delivery_status: "sent",
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
      metadata: { event: "ticket_closed", run: tenant.runId },
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

function buildInsertSql(table, row) {
  const keys = Object.keys(row);
  const values = keys.map((key) => toLiteral(row[key]));
  return `insert into public.${table} (${keys.join(", ")}) values (${values.join(", ")});`;
}

function applyWorkflowRows(rows) {
  runCommandPlan([
    buildInsertSql("agencies", rows.agency),
    buildInsertSql("clients", rows.client),
    buildInsertSql("sites", rows.site),
    buildInsertSql("tickets", rows.ticket),
    buildInsertSql("ticket_messages", rows.messageInsert),
    buildInsertSql("ticket_draft_replies", rows.draftInsert),
    buildInsertSql("ticket_approvals", rows.approvalInsert),
    buildInsertSql("ticket_communications", rows.communicationInsert),
    ...rows.auditEvents.map((event) => buildInsertSql("ticket_audit_events", event)),
  ]);
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
  assert(ticketRow.submitter_email === tenant.actorEmail, "ticket submitter email mismatch");

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

  const auditRows = runQuery(
    `select count(*)::int as count, array_agg(event_type order by occurred_at) as event_types from public.ticket_audit_events where ticket_id = '${tenant.ticketId}';`,
  );
  assert(Number(auditRows[0].count) >= 6, "expected multiple audit events for workflow");

  const auditTypes = runQuery(
    `select event_type from public.ticket_audit_events where ticket_id = '${tenant.ticketId}' order by occurred_at;`,
  ).map((row) => row.event_type);
  const requiredEventSet = new Set(["ticket_created", "ticket_triaged", "reply_drafted", "approval_requested", "approval_granted", "reply_sent", "ticket_closed"]);
  for (const eventType of requiredEventSet) {
    assert(auditTypes.includes(eventType), `missing audit event ${eventType}`);
  }

  const commRows = runQuery(
    `select ticket_id, approval_id, delivery_status from public.ticket_communications where ticket_id = '${tenant.ticketId}';`,
  );
  assert(commRows.length === 1, "expected one communication row");
  assert(commRows[0].approval_id !== null, "communication missing approval_id");
  assert(commRows[0].delivery_status === "sent", "communication not marked sent");
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

function cleanupTenantData(tenant) {
  runCommandPlan([
    `delete from public.ticket_communications where ticket_id = '${tenant.ticketId}';`,
    `delete from public.ticket_approvals where ticket_id = '${tenant.ticketId}';`,
    `delete from public.ticket_draft_replies where ticket_id = '${tenant.ticketId}';`,
    `delete from public.ticket_messages where ticket_id = '${tenant.ticketId}';`,
    `delete from public.ticket_audit_events where ticket_id = '${tenant.ticketId}';`,
    `delete from public.tickets where id = '${tenant.ticketId}';`,
    `delete from public.sites where id = '${tenant.siteId}';`,
    `delete from public.clients where id = '${tenant.clientId}';`,
    `delete from public.agencies where id = '${tenant.agencyId}';`,
  ]);
}

function assertNoResidualData(tenant) {
  const afterRows = runQuery(`select
    (select count(*) from public.agencies where id='${tenant.agencyId}') as agencies,
    (select count(*) from public.clients where id='${tenant.clientId}') as clients,
    (select count(*) from public.sites where id='${tenant.siteId}') as sites,
    (select count(*) from public.tickets where id='${tenant.ticketId}') as tickets;`);
  assert(Number(afterRows[0].agencies) === 0, "agency cleanup failed");
  assert(Number(afterRows[0].clients) === 0, "client cleanup failed");
  assert(Number(afterRows[0].sites) === 0, "site cleanup failed");
  assert(Number(afterRows[0].tickets) === 0, "ticket cleanup failed");
}

function run() {
  const context = collectTenantIds("wss-adapter");
  const { tenant, inserts } = buildInsertStatements(context);

  applyWorkflowRows(inserts);
  verifyTenantRoundtrip(tenant);
  readBackRoundTrip(tenant);

  const auditCheckRows = runQuery(
    `select actor_id, actor_role, summary, metadata from public.ticket_audit_events where ticket_id='${tenant.ticketId}' order by occurred_at;`,
  );
  assert(auditCheckRows.length >= 1, "audit trail should return records");
  assert(auditCheckRows.every((row) => row.actor_id), "audit actor_id must be present");
  assert(auditCheckRows.every((row) => row.actor_role), "audit actor_role must be present");
  assert(auditCheckRows.every((row) => row.summary), "audit summary must be present");
  assert(auditCheckRows.every((row) => row.metadata), "audit metadata must be present");

  cleanupTenantData(tenant);
  assertNoResidualData(tenant);

  console.log(
    JSON.stringify({
      status: "pass",
      runId: tenant.runId,
      ticketId: tenant.ticketId,
      agencyId: tenant.agencyId,
      clientId: tenant.clientId,
      siteId: tenant.siteId,
      auditEvents: auditCheckRows.length,
    }, null, 2),
  );
}

run();
