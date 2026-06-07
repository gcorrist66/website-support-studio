import {
  ActorRole,
  AuditEventType,
  BlockedReason,
  IdentityConfidence,
  TicketPriority,
  TicketStatus,
} from "../domain/ticketStatus";
import type {
  Agency,
  Client,
  Site,
  Ticket,
  TicketAuditEvent,
  TicketApproval,
  TicketCommunicationRecord,
  TicketDraftReply,
  TicketMessage,
  TicketSubmitter,
} from "../domain/types";
import type {
  AgencyInsert,
  ClientInsert,
  SiteInsert,
  TicketInsert,
  AuditEventInsert,
} from "./schemaTypes";
import {
  mapDomainAgencyToPersistenceInsert,
  mapDomainClientToPersistenceInsert,
  mapDomainSiteToPersistenceInsert,
  mapDomainTicketToPersistenceInsert,
  mapAuditEventToPersistenceInsert,
} from "./ticketMappers";

export interface TicketMessageInsert {
  id?: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_id: string;
  author_id: string;
  author_role: ActorRole;
  message_body: string;
  message_direction: "inbound" | "outbound";
  created_at?: string;
}

export interface TicketDraftReplyInsert {
  id?: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_id: string;
  drafted_by: string;
  draft_body: string;
  status: "drafting" | "ready_for_approval" | "superseded" | "sent";
  created_at?: string;
  updated_at?: string;
}

export interface TicketApprovalInsert {
  id?: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_id: string;
  draft_reply_id?: string;
  requested_by: string;
  approver_id?: string;
  approver_role: ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN | ActorRole.CS_AGENT;
  status: "pending" | "approved" | "rejected";
  decision_note?: string;
  requested_at?: string;
  decided_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TicketCommunicationInsert {
  id?: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_id: string;
  draft_reply_id?: string;
  approval_id?: string;
  recipient_email: string;
  subject?: string;
  body: string;
  delivery_status: "pending" | "sent" | "failed" | "blocked";
  external_provider?: string | null;
  external_message_id?: string | null;
  sent_at?: string;
  created_at?: string;
}

export interface SupabaseWorkflowPersistencePayload {
  agency: AgencyInsert;
  client: ClientInsert;
  site: SiteInsert;
  ticket: TicketInsert;
  messageInserts: TicketMessageInsert[];
  draftInserts: TicketDraftReplyInsert[];
  approvalInserts: TicketApprovalInsert[];
  communicationInserts: TicketCommunicationInsert[];
  auditInserts: AuditEventInsert[];
}

export interface SupabaseWorkflowMappingInput {
  agency: Agency;
  client: Client;
  site: Site;
  ticket: Ticket;
  tenantContext: {
    agencyId: string;
    clientId: string;
    siteId: string;
    ticketNumber: string;
    title?: string;
    description?: string;
    submitterName?: string;
    submitterEmail?: string;
    blockedFromStatus?: TicketStatus | null;
    blockedNotes?: string | null;
    closureNote?: string | null;
  };
  submitter?: TicketSubmitter;
  messages?: TicketMessage[];
  drafts?: TicketDraftReply[];
  approvals?: TicketApproval[];
  communications?: TicketCommunicationRecord[];
  audits?: TicketAuditEvent[];
}

export interface SupabaseSqlStatement {
  table: string;
  sql: string;
}

export interface SupabaseInsertPlan {
  payload: SupabaseWorkflowPersistencePayload;
  statements: SupabaseSqlStatement[];
}

function escapeLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  if (typeof value === "object") {
    if (value instanceof Date) {
      return quoteLiteral(value.toISOString());
    }
    return quoteLiteral(JSON.stringify(value));
  }
  return quoteLiteral(String(value));
}

function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildInsertSql(table: string, row: unknown): string {
  const insertRow = row as Record<string, unknown>;
  const keys = Object.keys(insertRow);
  const sqlKeys = keys.join(", ");
  const sqlValues = keys.map((key) => escapeLiteral(insertRow[key])).join(", ");
  return `insert into public.${table} (${sqlKeys}) values (${sqlValues})`;
}

function mapTenantMessageToInsert(
  message: TicketMessage,
  tenant: SupabaseWorkflowMappingInput["tenantContext"],
): TicketMessageInsert {
  return {
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: message.ticketId,
    author_id: message.submittedBySubmitterId ?? "unknown-submitter",
    author_role: ActorRole.SYSTEM,
    message_body: message.rawMessage,
    message_direction: "inbound",
    created_at: message.receivedAt,
  };
}

function mapDraftToInsert(
  draft: TicketDraftReply,
  tenant: SupabaseWorkflowMappingInput["tenantContext"],
): TicketDraftReplyInsert {
  return {
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: draft.ticketId,
    drafted_by: draft.draftingAgentRole,
    draft_body: draft.draftText,
    status: "ready_for_approval",
    created_at: draft.draftedAt,
    updated_at: draft.draftedAt,
  };
}

function mapApprovalToInsert(
  approval: TicketApproval,
  tenant: SupabaseWorkflowMappingInput["tenantContext"],
  draftReplyId?: string,
): TicketApprovalInsert {
  return {
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: approval.ticketId,
    draft_reply_id: draftReplyId,
    requested_by: approval.approverRole,
    approver_id: approval.approverRole,
    approver_role: approval.approverRole,
    status: approval.decision,
    decision_note: approval.decisionNotes,
    requested_at: approval.decisionAt,
    decided_at: approval.decisionAt,
    created_at: approval.decisionAt,
    updated_at: approval.decisionAt,
  };
}

function mapCommunicationToInsert(
  communication: TicketCommunicationRecord,
  tenant: SupabaseWorkflowMappingInput["tenantContext"],
  draftReplyId?: string,
  approvalId?: string,
): TicketCommunicationInsert {
  return {
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: communication.ticketId,
    draft_reply_id: draftReplyId,
    approval_id: approvalId,
    recipient_email: communication.recipientEmail,
    subject: "Customer reply",
    body: communication.messagePreview,
    delivery_status: "sent",
    external_provider: null,
    external_message_id: null,
    sent_at: communication.sentAt,
    created_at: communication.sentAt,
  };
}

export function buildSupabaseWorkflowPayload(
  input: SupabaseWorkflowMappingInput,
): SupabaseWorkflowPersistencePayload {
  const { agency, client, site, ticket, tenantContext } = input;
  const messageInserts = (input.messages ?? []).map((message) => mapTenantMessageToInsert(message, tenantContext));
  const draftInserts = (input.drafts ?? []).map((draft) => mapDraftToInsert(draft, tenantContext));
  const approvals = (input.approvals ?? []).map((approval) => mapApprovalToInsert(approval, tenantContext, draftInserts[0]?.id ?? input.drafts?.[0]?.draftId));
  const firstApprovalId = approvals[0]?.id;
  const communications = (input.communications ?? []).map((communication) =>
    mapCommunicationToInsert(
      communication,
      tenantContext,
      draftInserts[0]?.id ?? input.drafts?.[0]?.draftId,
      firstApprovalId,
    ),
  );
  const auditInserts = (input.audits ?? []).map((audit) =>
    mapAuditEventToPersistenceInsert(audit, {
      agencyId: tenantContext.agencyId,
      clientId: tenantContext.clientId,
      siteId: tenantContext.siteId,
    }),
  );

  const mappedTicket = mapDomainTicketToPersistenceInsert(ticket, {
    ...tenantContext,
    siteId: tenantContext.siteId,
    blockedFromStatus: tenantContext.blockedFromStatus ?? null,
    blockedNotes: tenantContext.blockedNotes ?? null,
    closureNote: tenantContext.closureNote ?? null,
  });

  const safeTicket = {
    ...mappedTicket,
    status: ticket.status ?? TicketStatus.RECEIVED,
    priority: ticket.priority ?? TicketPriority.NORMAL,
    identity_confidence: ticket.identityConfidence ?? IdentityConfidence.UNKNOWN,
    blocked_reason: ticket.currentBlockedReason ?? BlockedReason.OTHER,
  };

  return {
    agency: mapDomainAgencyToPersistenceInsert(agency),
    client: mapDomainClientToPersistenceInsert(client),
    site: mapDomainSiteToPersistenceInsert(site, {
      agencyId: tenantContext.agencyId,
      clientId: tenantContext.clientId,
    }),
    ticket: {
      ...safeTicket,
      title: tenantContext.title ?? "Customer support ticket",
      description: tenantContext.description ?? null,
      submitter_name: tenantContext.submitterName ?? null,
      submitter_email: tenantContext.submitterEmail ?? null,
    },
    messageInserts,
    draftInserts,
    approvalInserts: approvals,
    communicationInserts: communications,
    auditInserts,
  };
}

export function buildSupabaseInsertStatements(
  payload: SupabaseWorkflowPersistencePayload,
): SupabaseSqlStatement[] {
  const statements: SupabaseSqlStatement[] = [];
  statements.push({ table: "agencies", sql: `${buildInsertSql("agencies", payload.agency)};` });
  statements.push({ table: "clients", sql: `${buildInsertSql("clients", payload.client)};` });
  statements.push({ table: "sites", sql: `${buildInsertSql("sites", payload.site)};` });
  statements.push({ table: "tickets", sql: `${buildInsertSql("tickets", payload.ticket)};` });

  for (const message of payload.messageInserts) {
    statements.push({
      table: "ticket_messages",
      sql: `${buildInsertSql("ticket_messages", message)};`,
    });
  }
  for (const draft of payload.draftInserts) {
    statements.push({
      table: "ticket_draft_replies",
      sql: `${buildInsertSql("ticket_draft_replies", draft)};`,
    });
  }
  for (const approval of payload.approvalInserts) {
    statements.push({
      table: "ticket_approvals",
      sql: `${buildInsertSql("ticket_approvals", approval)};`,
    });
  }
  for (const communication of payload.communicationInserts) {
    statements.push({
      table: "ticket_communications",
      sql: `${buildInsertSql("ticket_communications", communication)};`,
    });
  }
  for (const audit of payload.auditInserts) {
    statements.push({
      table: "ticket_audit_events",
      sql: `${buildInsertSql("ticket_audit_events", audit)};`,
    });
  }

  return statements;
}

export function buildSupabaseUpsertStatements(
  payload: SupabaseWorkflowPersistencePayload,
): SupabaseSqlStatement[] {
  return payload.auditInserts.length > 0 && payload.ticket.id
    ? buildSupabaseInsertStatements(payload)
    : buildSupabaseInsertStatements(payload);
}

export {
  ActorRole,
  AuditEventType,
  BlockedReason,
  IdentityConfidence,
  TicketPriority,
  TicketStatus,
};
