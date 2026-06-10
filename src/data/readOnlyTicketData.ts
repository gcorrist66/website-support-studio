import { createClient } from "@supabase/supabase-js";

import { getAuthClient } from "../auth/realAuthClient";

import {
  approvalQueue,
  auditTrail,
  getTicketDetail,
  ticketQueue,
  type MockApprovalItem,
  type MockAuditEvent,
  type MockTicketDetail,
  type MockTicketQueueItem,
  type MockRequestAttachment,
} from "../ui/mockData";

type ReadOnlyQueueStatus = MockTicketQueueItem["status"];
type ReadOnlyQueuePriority = MockTicketQueueItem["priority"];

type ReadOnlyDataMode = "mock" | "supabase-dev-readonly";

const EXPECTED_DEV_PROJECT_REF = "vrtfbbrwrxyljchywmzy";
const ALLOWED_ENVS = new Set(["dev", "development", "local"]);

interface BrowserEnv {
  VITE_SUPABASE_ANON_KEY?: string;
  WSS_SUPABASE_ANON_KEY?: string;
  WSS_SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLIC_URL?: string;
  WSS_ALLOW_SUPABASE_VALIDATION?: string;
  WSS_SUPABASE_ENVIRONMENT?: string;
  WSS_SUPABASE_PROJECT_REF?: string;
}

type EnvReader = Record<string, string | undefined>;

function getEnvValue(keys: string[], env: EnvReader): string | undefined {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
}

function isLikelyAnonKey(value: string): boolean {
  if (value.startsWith("sb_secret_")) {
    return false;
  }
  return value.startsWith("eyJ") || value.startsWith("sb_") || value.length >= 24;
}

function looksLikeDevProjectUrl(url: string, projectRef: string): boolean {
  try {
    const parsed = new globalThis.URL(url);
    const host = parsed.host;
    return host.includes("supabase.co") && (host.includes(projectRef) || host.includes(EXPECTED_DEV_PROJECT_REF));
  } catch {
    return false;
  }
}

function getBrowserEnv(): BrowserEnv {
  return typeof import.meta !== "undefined" ? (import.meta as { env?: BrowserEnv }).env ?? {} : {};
}

function getValidationEnv(): EnvReader {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: EnvReader };
  };

  if (runtime.process && runtime.process.env && typeof runtime.process.env === "object") {
    return runtime.process.env;
  }
  return getBrowserEnv() as EnvReader;
}

function assertBrowserMode(): boolean {
  const env = getValidationEnv();

  const guard = getEnvValue(["WSS_ALLOW_SUPABASE_VALIDATION"], env);
  if (guard !== "dev") {
    return false;
  }

  const environment = getEnvValue(["WSS_SUPABASE_ENVIRONMENT"], env);
  if (!environment || !ALLOWED_ENVS.has(environment.toLowerCase())) {
    return false;
  }

  const projectRef = getEnvValue(["WSS_SUPABASE_PROJECT_REF"], env);
  if (projectRef !== EXPECTED_DEV_PROJECT_REF) {
    return false;
  }

  const supabaseUrl = getEnvValue(["WSS_SUPABASE_URL", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLIC_URL"], env);
  if (!supabaseUrl || !looksLikeDevProjectUrl(supabaseUrl, projectRef)) {
    return false;
  }

  const anonKey = getEnvValue(["WSS_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"], env);
  if (!anonKey || !isLikelyAnonKey(anonKey)) {
    return false;
  }

  return true;
}

function safeNormalizeStatus(status: string): ReadOnlyQueueStatus {
  switch (status) {
    case "received":
    case "triaged":
    case "blocked":
    case "awaiting_gary_approval":
    case "approved_to_send":
    case "sent_to_customer":
    case "reply_drafted":
    case "closed":
      return status;
    default:
      return "received";
  }
}

function safeNormalizePriority(priority: string): ReadOnlyQueuePriority {
  switch (priority) {
    case "low":
    case "medium":
    case "high":
    case "urgent":
    case "normal":
    case "critical":
      return priority;
    default:
      return "low";
  }
}

function createMockFallbackQueue(): MockTicketQueueItem[] {
  return ticketQueue;
}

function createMockFallbackDetail(ticketId: string): MockTicketDetail {
  return getTicketDetail(ticketId);
}

function createMockFallbackAuditTrail(ticketId: string): MockAuditEvent[] {
  return auditTrail.filter((event) => event.ticketId === ticketId);
}

interface RelationRow {
  id?: string;
  name?: string;
}

type JoinedRelation = RelationRow | RelationRow[] | null | undefined;

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function normalizeRelation(row: JoinedRelation): RelationRow | undefined {
  if (Array.isArray(row)) {
    return row[0];
  }
  return row ?? undefined;
}

function selectTenantName(row: JoinedRelation, fallback: string): string {
  return normalizeRelation(row)?.name?.trim() || fallback;
}

function selectTenantId(row: JoinedRelation, fallback: string): string {
  return normalizeRelation(row)?.id?.trim() || fallback;
}

interface SupabaseTicketQueueRow {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  identity_confidence: "known" | "claimed" | "unknown";
  submitter_name: string | null;
  blocked_reason: string | null;
  created_at?: string;
  updated_at?: string;
  agencies?: JoinedRelation;
  clients?: JoinedRelation;
  sites?: JoinedRelation;
  site_id?: string;
  client_id?: string;
}

interface SupabaseAuditRow {
  id: string;
  ticket_id: string;
  actor_id: string;
  event_type: string;
  summary: string;
  occurred_at: string;
}

interface SupabaseApprovalRow {
  id: string;
  ticket_id: string;
  requested_by?: string;
  approver_id?: string;
  status?: string;
  requested_at?: string;
}

function approvalStateFromEvents(events: SupabaseAuditRow[]): MockTicketDetail["approvalStatus"] {
  if (events.some((event) => event.event_type === "approval_rejected")) {
    return "rejected";
  }
  if (events.some((event) => event.event_type === "approval_granted")) {
    return "approved";
  }
  if (events.some((event) => event.event_type === "approval_requested")) {
    return "awaiting_approval";
  }
  return "not_required";
}

function createSupabaseClient() {
  // Prefer the real authenticated client: when an operator is logged in (real auth enabled),
  // their session scopes every read by RLS to their agency. This is what powers the operator
  // console (queue / tickets / approvals / audit) on real data.
  const authed = getAuthClient();
  if (authed) {
    return authed;
  }

  // Dev fallback: anonymous read-only client guarded by the dev env flags.
  const env = getValidationEnv();
  const url = getEnvValue(["WSS_SUPABASE_URL", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLIC_URL"], env);
  const anonKey = getEnvValue(["WSS_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"], env);

  if (!url || !anonKey) {
    throw new Error("missing read-only supabase env vars");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getReadOnlyDataMode(): ReadOnlyDataMode {
  // A real authenticated (operator) session reads live, RLS-scoped data; otherwise fall back to
  // the dev anon path when the dev guard is set, else mock.
  if (getAuthClient()) {
    return "supabase-dev-readonly";
  }
  return assertBrowserMode() ? "supabase-dev-readonly" : "mock";
}

export function getReadOnlyModeLabel(): string {
  return getReadOnlyDataMode() === "supabase-dev-readonly"
    ? "operations_console"
    : "operations_console_preview";
}

export async function getReadOnlyTicketQueue(): Promise<MockTicketQueueItem[]> {
  if (getReadOnlyDataMode() !== "supabase-dev-readonly") {
    return createMockFallbackQueue();
  }

  const client = createSupabaseClient();
  const query = await client
    .from("tickets")
    .select("id,ticket_number,title,status,priority,identity_confidence,submitter_name,blocked_reason,created_at,updated_at,agencies(id,name),clients(id,name),sites(id,name),site_id,client_id")
    .order("created_at", { ascending: false });

  if (query.error || !query.data) {
    return createMockFallbackQueue();
  }

  return query.data
    .map((raw): MockTicketQueueItem | undefined => {
      const row = toRecord(raw) as SupabaseTicketQueueRow | undefined;
      if (!row) {
        return undefined;
      }

      return {
        id: row.ticket_number ?? `ticket-${row.id}`,
        workflowId: row.id,
        title: row.title,
        status: safeNormalizeStatus(String(row.status)),
        priority: safeNormalizePriority(String(row.priority)),
        submittedBy: row.submitter_name ?? "unknown",
        updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
        siteId: selectTenantId(row.sites, row.site_id ?? "UNKNOWN"),
        siteName: selectTenantName(row.sites, "Unknown site"),
        clientId: selectTenantId(row.clients, row.client_id ?? "UNKNOWN"),
        clientName: selectTenantName(row.clients, "Unknown client"),
        blockedReason: row.blocked_reason ?? undefined,
        identityConfidence: row.identity_confidence,
      };
    })
    .filter((item): item is MockTicketQueueItem => Boolean(item));
}

export async function getReadOnlyTicketAuditTimeline(ticketId: string): Promise<MockAuditEvent[]> {
  if (getReadOnlyDataMode() !== "supabase-dev-readonly") {
    return createMockFallbackAuditTrail(ticketId);
  }

  const client = createSupabaseClient();
  const query = await client
    .from("ticket_audit_events")
    .select("id,ticket_id,actor_id,event_type,summary,occurred_at")
    .eq("ticket_id", ticketId)
    .order("occurred_at", { ascending: true });

  if (query.error || !query.data) {
    return createMockFallbackAuditTrail(ticketId);
  }

  return query.data.map((event): MockAuditEvent | undefined => {
    const record = toRecord(event) as unknown as SupabaseAuditRow | undefined;
    if (!record) {
      return undefined;
    }

    return {
      id: record.id,
      ticketId: record.ticket_id,
      eventType: record.event_type,
      summary: record.summary,
      actor: record.actor_id,
      occurredAt: record.occurred_at,
    };
  }).filter((item): item is MockAuditEvent => Boolean(item));
}

interface SupabaseTicketDetailRow {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  identity_confidence: "known" | "claimed" | "unknown";
  submitter_name: string | null;
  blocked_reason: string | null;
  created_at?: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  agencies?: JoinedRelation;
  clients?: JoinedRelation;
  sites?: JoinedRelation;
}

interface SupabaseAttachmentRow {
  id: string;
  ticket_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
}

export async function getReadOnlyTicketDetail(ticketId: string): Promise<MockTicketDetail> {
  if (getReadOnlyDataMode() !== "supabase-dev-readonly") {
    return createMockFallbackDetail(ticketId);
  }

  const client = createSupabaseClient();
  const ticketQuery = await client
    .from("tickets")
    .select(
      "id,ticket_number,title,description,status,priority,identity_confidence,submitter_name,blocked_reason,created_at,agency_id,client_id,site_id,agencies(id,name),clients(id,name),sites(id,name)",
    )
    .eq("ticket_number", ticketId)
    .single();

  if (ticketQuery.error || !ticketQuery.data) {
    return createMockFallbackDetail(ticketId);
  }

  const ticketData = toRecord(ticketQuery.data) as SupabaseTicketDetailRow | undefined;
  if (!ticketData) {
    return createMockFallbackDetail(ticketId);
  }

  const auditTimeline = await getReadOnlyTicketAuditTimeline(ticketData.id);
  const attachmentQuery = await client
    .from("ticket_attachments")
    .select("id,ticket_id,storage_path,file_name,mime_type,file_size_bytes,created_at")
    .eq("ticket_id", ticketData.id)
    .order("created_at", { ascending: true });
  const approvalEventQuery = await client
    .from("ticket_audit_events")
    .select("id,ticket_id,actor_id,event_type,summary,occurred_at")
    .eq("ticket_id", ticketData.id);

  const events = approvalEventQuery.error || !approvalEventQuery.data
    ? []
    : approvalEventQuery.data
        .map((row) => toRecord(row) as unknown as SupabaseAuditRow | undefined)
        .filter((row): row is SupabaseAuditRow => Boolean(row));

  const attachments: MockRequestAttachment[] = attachmentQuery.error || !attachmentQuery.data
    ? []
    : attachmentQuery.data
        .map((row) => {
          const attachment = toRecord(row) as SupabaseAttachmentRow | undefined;
          if (!attachment) {
            return undefined;
          }
          return {
            id: attachment.id,
            fileName: attachment.file_name,
            mimeType: attachment.mime_type,
            fileSizeBytes: Number(attachment.file_size_bytes ?? 0),
            publicUrl: client.storage.from("request_attachments").getPublicUrl(attachment.storage_path).data.publicUrl,
            createdAt: attachment.created_at,
          };
        })
        .filter((item): item is MockRequestAttachment => Boolean(item));

  return {
    id: ticketData.ticket_number,
    workflowId: ticketData.id,
    summary: ticketData.title,
    customerRequest: ticketData.description ?? "No request text available in read-only mode.",
    status: safeNormalizeStatus(ticketData.status),
    priority: safeNormalizePriority(ticketData.priority),
    identityConfidence: ticketData.identity_confidence,
    tenantContext: {
      agencyId: ticketData.agency_id,
      agencyName: selectTenantName(ticketData.agencies, ticketData.agency_id),
      clientId: ticketData.client_id,
      clientName: selectTenantName(ticketData.clients, ticketData.client_id),
      siteId: ticketData.site_id,
      siteName: selectTenantName(ticketData.sites, ticketData.site_id),
    },
    submittedBy: ticketData.submitter_name ?? "Unknown",
    submittedAt: ticketData.created_at ?? new Date().toISOString(),
    approvalStatus: approvalStateFromEvents(events),
    blockedReason: ticketData.blocked_reason ?? undefined,
    auditTimeline,
    attachments,
  };
}

export interface ReadOnlySendContext {
  approvalId: string;
  approvedByActorReference: string;
  approvedAt: string;
  draftReplyId: string;
  recipientEmail: string;
}

interface SupabaseApprovedApprovalRow {
  id?: string;
  approver_id?: string;
  requested_by?: string;
  status?: string;
  decided_at?: string;
}

interface SupabaseDraftIdRow {
  id?: string;
  created_at?: string;
}

interface SupabaseRecipientRow {
  submitter_email?: string | null;
}

// Read-only helper that resolves the context the send handler validates against
// (approved approval id/reference/time, latest draft id, recipient email). This performs
// reads only; it never mutates and falls back to null outside guarded dev mode.
export async function getReadOnlySendContext(workflowId: string): Promise<ReadOnlySendContext | null> {
  if (getReadOnlyDataMode() !== "supabase-dev-readonly") {
    return null;
  }

  const client = createSupabaseClient();

  const approvalQuery = await client
    .from("ticket_approvals")
    .select("id,approver_id,requested_by,status,decided_at")
    .eq("ticket_id", workflowId)
    .eq("status", "approved")
    .order("decided_at", { ascending: false })
    .limit(1);

  if (approvalQuery.error || !approvalQuery.data || approvalQuery.data.length === 0) {
    return null;
  }
  const approval = toRecord(approvalQuery.data[0]) as SupabaseApprovedApprovalRow | undefined;
  const approvalId = approval?.id?.trim();
  const approvedByActorReference = (approval?.approver_id ?? approval?.requested_by ?? "").trim();
  const approvedAt = approval?.decided_at?.trim();
  if (!approvalId || !approvedByActorReference || !approvedAt) {
    return null;
  }

  const draftQuery = await client
    .from("ticket_draft_replies")
    .select("id,created_at")
    .eq("ticket_id", workflowId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (draftQuery.error || !draftQuery.data || draftQuery.data.length === 0) {
    return null;
  }
  const draftReplyId = (toRecord(draftQuery.data[0]) as SupabaseDraftIdRow | undefined)?.id?.trim();
  if (!draftReplyId) {
    return null;
  }

  const recipientQuery = await client
    .from("tickets")
    .select("submitter_email")
    .eq("id", workflowId)
    .single();

  if (recipientQuery.error || !recipientQuery.data) {
    return null;
  }
  const recipientEmail = (toRecord(recipientQuery.data) as SupabaseRecipientRow | undefined)?.submitter_email?.trim();
  if (!recipientEmail) {
    return null;
  }

  return { approvalId, approvedByActorReference, approvedAt, draftReplyId, recipientEmail };
}

export async function getReadOnlyApprovalQueue(): Promise<MockApprovalItem[]> {
  if (getReadOnlyDataMode() !== "supabase-dev-readonly") {
    return approvalQueue;
  }

  const client = createSupabaseClient();
  const query = await client
    .from("ticket_approvals")
    .select("id,ticket_id,requested_by,approver_id,status,requested_at")
    .in("status", ["pending", "rejected"])
    .order("requested_at", { ascending: false });

  if (query.error || !query.data) {
    return approvalQueue;
  }

  const rows = query.data as (SupabaseApprovalRow | undefined)[];
  return rows
    .map((approval): MockApprovalItem | undefined => {
      if (!approval || !approval.ticket_id || !approval.id) {
        return undefined;
      }

      const status = approval.status;
      const derivedState = status === "rejected" ? "needs_rework" : "awaiting_gary_approval";
      return {
        id: approval.id,
        ticketId: approval.ticket_id,
        requestBy: approval.requested_by ?? approval.approver_id ?? "unknown",
        state: derivedState,
        submittedAt: approval.requested_at ?? new Date().toISOString(),
      };
    })
    .filter((item): item is MockApprovalItem => Boolean(item));
}
