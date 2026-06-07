import {
  ActorRole,
  AuditEventType,
  BlockedReason,
  IdentityConfidence,
  TicketPriority,
  TicketStatus,
} from "../domain/ticketStatus";

export interface AgencyRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface AgencyInsert {
  id?: string;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientRow {
  id: string;
  agency_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  id?: string;
  agency_id: string;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface SiteRow {
  id: string;
  agency_id: string;
  client_id: string;
  name: string;
  url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface SiteInsert {
  id?: string;
  agency_id: string;
  client_id: string;
  name: string;
  url?: string | null;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface TicketRow {
  id: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  identity_confidence: IdentityConfidence;
  submitter_name: string | null;
  submitter_email: string | null;
  blocked_reason: BlockedReason | null;
  blocked_from_status: TicketStatus | null;
  blocked_notes: string | null;
  closure_note: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketInsert {
  id?: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_number: string;
  title: string;
  description?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
  identity_confidence?: IdentityConfidence;
  submitter_name?: string | null;
  submitter_email?: string | null;
  blocked_reason?: BlockedReason | null;
  blocked_from_status?: TicketStatus | null;
  blocked_notes?: string | null;
  closure_note?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuditEventRow {
  id: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_id: string;
  actor_id: string;
  actor_role: ActorRole;
  event_type: AuditEventType;
  summary: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEventInsert {
  id?: string;
  agency_id: string;
  client_id: string;
  site_id: string;
  ticket_id: string;
  actor_id: string;
  actor_role: ActorRole;
  event_type: AuditEventType;
  summary: string;
  metadata: Record<string, unknown>;
  occurred_at?: string;
  created_at?: string;
  updated_at?: string;
}
