import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";

import {
  ActorRole,
  type AuditEventType,
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
  TicketDraftReply,
  TicketCommunicationRecord,
  TicketMessage,
} from "../domain/types";
import {
  buildSupabaseWorkflowPayload,
  buildSupabaseInsertStatements,
} from "../persistence/supabaseAdapter";

const DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_NON_PRODUCTION_ENVS = ["dev", "development", "local"];
const DB_QUERY_TIMEOUT_MS = 120000;

export interface TicketTenantIds {
  agencyId: string;
  clientId: string;
  siteId: string;
}

interface TicketLifecycleTicketContext {
  ticketNumber: string;
  title?: string;
  description?: string;
  submitterName?: string | null;
  submitterEmail?: string | null;
  blockedFromStatus?: TicketStatus | null;
  blockedNotes?: string | null;
  closureNote?: string | null;
}

export interface TicketCommunicationWrite {
  communicationId: string;
  ticketId: string;
  draftReplyId?: string;
  approvalId: string;
  sentByRole: ActorRole.CS_AGENT | ActorRole.SYSTEM;
  sentAt: string;
  recipientEmail: string;
  messagePreview: string;
}

export interface TicketLifecycleCreateInput {
  agency: Agency;
  client: Client;
  site: Site;
  ticket: Ticket;
  tenantContext: TicketTenantIds & TicketLifecycleTicketContext;
  submitter?: {
    submitterId: string;
    submitterName?: string;
    submitterEmail?: string;
    siteId: string;
  };
  messages: TicketMessage[];
  drafts?: TicketDraftReply[];
  approvals?: TicketApproval[];
  communications?: TicketCommunicationRecord[];
  audits: TicketAuditEvent[];
}

export interface TicketLifecycleMutationInput {
  agency: Agency;
  client: Client;
  site: Site;
  ticket: Ticket;
  tenantContext: TicketTenantIds & TicketLifecycleTicketContext;
  messages?: TicketMessage[];
  drafts?: TicketDraftReply[];
  approvals?: TicketApproval[];
  communications?: TicketCommunicationWrite[];
  audits: TicketAuditEvent[];
  approvalDraftReplyId?: string;
}

interface DatabaseRow {
  [key: string]: unknown;
}

interface SupabaseTicketRow {
  id: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  identity_confidence: string;
  submitter_name: string | null;
  submitter_email: string | null;
  blocked_reason: string | null;
  blocked_from_status: TicketStatus | null;
  blocked_notes: string | null;
  closure_note: string | null;
  closed_at: string | null | SqlRaw;
  created_at: string;
  updated_at: string;
}

interface SqlRaw {
  __sqlRaw: string;
}

function sqlRaw(value: string): SqlRaw {
  return { __sqlRaw: value };
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if ((value as SqlRaw).__sqlRaw !== undefined) {
    return String((value as SqlRaw).__sqlRaw);
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (value instanceof Date) {
    return quoteLiteral(value.toISOString());
  }
  if (typeof value === "object") {
    return `${quoteLiteral(JSON.stringify(value))}::jsonb`;
  }
  return quoteLiteral(String(value));
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function parseQueryRows(output: string): Record<string, unknown>[] {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < 0) {
    throw new Error("supabase db query output format unsupported");
  }
  const parsed = JSON.parse(output.slice(start, end + 1));
  return Array.isArray((parsed as { rows?: unknown }).rows)
    ? ((parsed as { rows: Record<string, unknown>[] }).rows)
    : [];
}

export function querySql<T = Record<string, unknown>>(sql: string): T[] {
  const out = execFileSync(
    "supabase",
    ["db", "query", "--linked", "--output", "json", sql],
    { encoding: "utf8", timeout: DB_QUERY_TIMEOUT_MS },
  );
  return parseQueryRows(out) as T[];
}

function runSqlBatch(sqlStatements: string[]): void {
  for (const sql of sqlStatements) {
    querySql(sql);
  }
}

export function assertLocalExecutionGate(): void {
  const providedRef = process.env.WSS_SUPABASE_PROJECT_REF;
  const allowMode = process.env.WSS_SUPABASE_ENVIRONMENT;
  const explicitOptIn = process.env.WSS_ALLOW_SUPABASE_VALIDATION;

  if (explicitOptIn !== "dev") {
    throw new Error("Refusing repository execution without explicit local opt-in. Set WSS_ALLOW_SUPABASE_VALIDATION=dev.");
  }

  if (!providedRef) {
    throw new Error("Missing WSS_SUPABASE_PROJECT_REF. Expected vrtfbbrwrxyljchywmzy for local validation.");
  }

  if (providedRef !== DEV_PROJECT_REF) {
    throw new Error(
      `Unexpected Supabase project ref ${providedRef}; expected non-production Phase-2 dev ref ${DEV_PROJECT_REF}.`,
    );
  }

  if (!allowMode || !ALLOWED_NON_PRODUCTION_ENVS.includes(allowMode.toLowerCase())) {
    throw new Error("Set WSS_SUPABASE_ENVIRONMENT=dev|development|local before repository execution.");
  }

  const configPath = path.join(process.cwd(), ".supabase", "config.toml");
  if (!fs.existsSync(configPath)) {
    throw new Error("Missing local Supabase project link. Run supabase link before validation.");
  }

  const configText = fs.readFileSync(configPath, "utf8");
  if (!configText.includes(DEV_PROJECT_REF)) {
    throw new Error("Local Supabase link is not the expected WSS Phase-2 dev project.");
  }
}

function buildUpsertSQL(table: string, row: DatabaseRow, conflictColumn: string, updateColumns?: string[]): string {
  const columns = Object.keys(row);
  const values = columns.map((key) => escapeSqlValue(row[key])).join(", ");
  const safeColumns = updateColumns ?? columns.filter((key) => key !== "id");
  const updates = safeColumns.map((column) => `${column} = EXCLUDED.${column}`).join(", ");
  return `insert into public.${table} (${columns.join(", ")}) values (${values}) on conflict (${conflictColumn}) do update set ${updates};`;
}

function buildInsertSQL(table: string, row: DatabaseRow): string {
  const columns = Object.keys(row);
  const values = columns.map((key) => escapeSqlValue(row[key])).join(", ");
  return `insert into public.${table} (${columns.join(", ")}) values (${values});`;
}

function buildUpsertTicketSql(
  ticket: Ticket,
  tenantContext: TicketTenantIds & TicketLifecycleTicketContext,
): string {
  const row: SupabaseTicketRow = {
    id: ticket.ticketId,
    agency_id: tenantContext.agencyId,
    client_id: tenantContext.clientId,
    site_id: tenantContext.siteId,
    ticket_number: tenantContext.ticketNumber,
    title: tenantContext.title ?? "Customer support ticket",
    description: tenantContext.description ?? "",
    status: ticket.status,
    priority: ticket.priority,
    identity_confidence: ticket.identityConfidence,
    submitter_name: tenantContext.submitterName ?? null,
    submitter_email: tenantContext.submitterEmail ?? null,
    blocked_reason: ticket.currentBlockedReason ?? null,
    blocked_from_status: tenantContext.blockedFromStatus ?? null,
    blocked_notes: tenantContext.blockedNotes ?? null,
    closure_note: tenantContext.closureNote ?? null,
    closed_at: ticket.status === "closed" ? sqlRaw("timezone('utc', now())") : null,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  };

  return buildUpsertSQL(
    "tickets",
    row as unknown as DatabaseRow,
    "id",
    [
      "agency_id",
      "client_id",
      "site_id",
      "ticket_number",
      "title",
      "description",
      "status",
      "priority",
      "identity_confidence",
      "submitter_name",
      "submitter_email",
      "blocked_reason",
      "blocked_from_status",
      "blocked_notes",
      "closure_note",
      "closed_at",
      "updated_at",
    ],
  );
}

function buildMessageRow(message: TicketMessage, tenant: TicketTenantIds): DatabaseRow {
  return {
    id: message.messageId,
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: message.ticketId,
    author_id: message.submittedBySubmitterId ?? "system",
    author_role: ActorRole.SYSTEM,
    message_body: message.rawMessage,
    message_direction: "inbound",
    created_at: message.receivedAt,
  };
}

function buildDraftRow(draft: TicketDraftReply, tenant: TicketTenantIds): DatabaseRow {
  return {
    id: draft.draftId,
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

function buildApprovalRow(approval: TicketApproval, tenant: TicketTenantIds, draftReplyId?: string): DatabaseRow {
  assert(approval.approvalId.length > 0, "approval_id required");

  return {
    id: approval.approvalId,
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: approval.ticketId,
    draft_reply_id: draftReplyId,
    requested_by: approval.approverReference ?? approval.approverRole,
    approver_id: approval.approverReference ?? approval.approverRole,
    approver_role: approval.approverRole,
    status: approval.decision,
    decision_note: approval.decisionNotes ?? null,
    requested_at: approval.decisionAt,
    decided_at: approval.decisionAt,
    created_at: approval.decisionAt,
    updated_at: approval.decisionAt,
  };
}

function buildCommunicationRow(
  communication: TicketCommunicationWrite,
  tenant: TicketTenantIds,
): DatabaseRow {
  assert(Boolean(communication.approvalId), "communication requires approval_id");

  return {
    id: communication.communicationId,
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: communication.ticketId,
    draft_reply_id: communication.draftReplyId,
    approval_id: communication.approvalId,
    recipient_email: communication.recipientEmail,
    subject: "Customer reply",
    body: communication.messagePreview,
    delivery_status: "pending",
    external_provider: null,
    external_message_id: null,
    sent_at: communication.sentAt,
    created_at: communication.sentAt,
  };
}

function buildAuditRow(event: TicketAuditEvent, tenant: TicketTenantIds): DatabaseRow {
  const eventType = event.eventType as AuditEventType;
  return {
    id: event.id,
    agency_id: tenant.agencyId,
    client_id: tenant.clientId,
    site_id: tenant.siteId,
    ticket_id: event.ticketId,
    actor_id: event.actorId,
    actor_role: event.actorRole,
    event_type: eventType,
    summary: event.summary,
    metadata: event.metadata,
    occurred_at: event.occurredAt,
    created_at: event.occurredAt,
    updated_at: event.occurredAt,
  };
}

export function persistWorkflowCreate(input: TicketLifecycleCreateInput): void {
  assertLocalExecutionGate();

  const payload = buildSupabaseWorkflowPayload({
    agency: input.agency,
    client: input.client,
    site: input.site,
    ticket: input.ticket,
    tenantContext: {
      agencyId: input.tenantContext.agencyId,
      clientId: input.tenantContext.clientId,
      siteId: input.tenantContext.siteId,
      ticketNumber: input.tenantContext.ticketNumber,
      title: input.tenantContext.title,
      description: input.tenantContext.description,
      submitterName: input.tenantContext.submitterName ?? undefined,
      submitterEmail: input.tenantContext.submitterEmail ?? undefined,
      blockedFromStatus: input.tenantContext.blockedFromStatus,
      blockedNotes: input.tenantContext.blockedNotes,
      closureNote: input.tenantContext.closureNote,
    },
    submitter: input.submitter
      ? {
          submitterId: input.submitter.submitterId,
          siteId: input.submitter.siteId,
          identityConfidence: input.ticket.identityConfidence,
          submitterName: input.submitter.submitterName,
          submitterEmail: input.submitter.submitterEmail,
        }
      : undefined,
    messages: input.messages,
    drafts: input.drafts,
    approvals: input.approvals,
    communications: input.communications,
    audits: input.audits,
  });

  const statements = buildSupabaseInsertStatements(payload);
  runSqlBatch(statements.map((statement) => statement.sql));
}

export function persistWorkflowMutation(input: TicketLifecycleMutationInput): void {
  assertLocalExecutionGate();

  runSqlBatch([
    buildUpsertTicketSql(input.ticket, input.tenantContext),
  ]);

  for (const message of input.messages ?? []) {
    runSqlBatch([buildInsertSQL("ticket_messages", buildMessageRow(message, input.tenantContext))]);
  }

  for (const draft of input.drafts ?? []) {
    runSqlBatch([buildInsertSQL("ticket_draft_replies", buildDraftRow(draft, input.tenantContext))]);
  }

  for (const approval of input.approvals ?? []) {
    const draftReplyId = input.approvalDraftReplyId;
    runSqlBatch([
      buildUpsertSQL(
        "ticket_approvals",
        buildApprovalRow(approval, input.tenantContext, draftReplyId),
        "id",
        [
          "agency_id",
          "client_id",
          "site_id",
          "ticket_id",
          "draft_reply_id",
          "requested_by",
          "approver_id",
          "approver_role",
          "status",
          "decision_note",
          "requested_at",
          "decided_at",
          "updated_at",
        ],
      ),
    ]);
  }

  for (const communication of input.communications ?? []) {
    runSqlBatch([buildInsertSQL("ticket_communications", buildCommunicationRow(communication, input.tenantContext))]);
  }

  for (const audit of input.audits) {
    runSqlBatch([buildInsertSQL("ticket_audit_events", buildAuditRow(audit, input.tenantContext))]);
  }
}

export function deleteWorkflowForTicket(tenant: TicketTenantIds, ticketId: string): void {
  assertLocalExecutionGate();

  const safeDelete = (statement: string): void => {
    try {
      querySql(statement);
    } catch (error) {
      if (error instanceof Error) {
        globalThis.console.warn(`cleanup warning: ${error.message}`);
      }
    }
  };

  safeDelete(`delete from public.ticket_communications where ticket_id = '${ticketId}';`);
  safeDelete(`delete from public.ticket_approvals where ticket_id = '${ticketId}';`);
  safeDelete(`delete from public.ticket_draft_replies where ticket_id = '${ticketId}';`);
  safeDelete(`delete from public.ticket_messages where ticket_id = '${ticketId}';`);
  safeDelete(`delete from public.ticket_audit_events where ticket_id = '${ticketId}';`);
  safeDelete(`delete from public.tickets where id = '${ticketId}';`);
  safeDelete(`delete from public.sites where id = '${tenant.siteId}';`);
  safeDelete(`delete from public.clients where id = '${tenant.clientId}';`);
  safeDelete(`delete from public.agencies where id = '${tenant.agencyId}';`);
}
