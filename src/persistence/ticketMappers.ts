import {
  ActorRole,
  TicketStatus,
  TicketPriority,
  IdentityConfidence,
  BlockedReason,
  AuditEventType,
} from "../domain/ticketStatus";
import type {
  Agency,
  Client,
  Site,
  Ticket,
  TicketAuditEvent,
} from "../domain/types";
import {
  type AuditEventInsert,
  type AuditEventRow,
  type AgencyInsert,
  type AgencyRow,
  type ClientInsert,
  type ClientRow,
  type SiteInsert,
  type SiteRow,
  type TicketInsert,
  type TicketRow,
} from "./schemaTypes";

export interface TicketPersistenceContext {
  agencyId: string;
  clientId: string;
  siteId: string;
  ticketNumber: string;
  title?: string;
  description?: string;
  submitterName?: string | null;
  submitterEmail?: string | null;
  blockedFromStatus?: TicketStatus | null;
  blockedNotes?: string | null;
  closureNote?: string | null;
}

export interface TenantContext {
  agencyId: string;
  clientId: string;
}

export function mapDomainAgencyToPersistenceInsert(agency: Agency): AgencyInsert {
  return {
    id: agency.agencyId,
    name: agency.agencyName,
    slug: `agency-${agency.agencyId}`,
    created_at: agency.createdAt,
    updated_at: agency.updatedAt,
  };
}

export function mapPersistenceAgencyRowToDomain(row: AgencyRow): Agency {
  return {
    agencyId: row.id,
    agencyName: row.name,
    policyProfile: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDomainClientToPersistenceInsert(client: Client): ClientInsert {
  return {
    id: client.clientId,
    agency_id: client.agencyId,
    name: client.clientName,
    slug: `client-${client.clientId}`,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  };
}

export function mapDomainClientToPersistenceRow(client: Client): ClientRow {
  const insert = mapDomainClientToPersistenceInsert(client);
  return {
    id: insert.id ?? client.clientId,
    agency_id: insert.agency_id,
    name: insert.name,
    slug: insert.slug,
    created_at: insert.created_at ?? new Date().toISOString(),
    updated_at: insert.updated_at ?? new Date().toISOString(),
  };
}

export function mapPersistenceClientRowToDomain(row: ClientRow): Client {
  return {
    clientId: row.id,
    agencyId: row.agency_id,
    clientName: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDomainSiteToPersistenceInsert(site: Site, context: TenantContext): SiteInsert {
  return {
    id: site.siteId,
    agency_id: context.agencyId,
    client_id: context.clientId,
    name: site.siteName,
    url: site.canonicalDomain ?? null,
    slug: `site-${site.siteId}`,
    created_at: site.createdAt,
    updated_at: site.updatedAt,
  };
}

export function mapDomainSiteToPersistenceRow(site: Site, context: TenantContext): SiteRow {
  const insert = mapDomainSiteToPersistenceInsert(site, context);
  return {
    id: insert.id ?? site.siteId,
    agency_id: insert.agency_id,
    client_id: insert.client_id,
    name: insert.name,
    url: insert.url ?? null,
    slug: insert.slug,
    created_at: insert.created_at ?? new Date().toISOString(),
    updated_at: insert.updated_at ?? new Date().toISOString(),
  };
}

export function mapPersistenceSiteRowToDomain(row: SiteRow): Site {
  return {
    siteId: row.id,
    clientId: row.client_id,
    siteName: row.name,
    canonicalDomain: row.url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDomainTicketToPersistenceInsert(
  ticket: Ticket,
  context: TicketPersistenceContext,
): TicketInsert {
  if (!context.agencyId || !context.clientId || !context.siteId) {
    throw new Error("Missing persistence tenant context for ticket mapping");
  }

  if (!context.ticketNumber) {
    throw new Error("Missing ticket number in persistence context");
  }

  return {
    id: ticket.ticketId,
    agency_id: context.agencyId,
    client_id: context.clientId,
    site_id: context.siteId,
    ticket_number: context.ticketNumber,
    title: context.title ?? "Customer support ticket",
    description: context.description ?? "",
    status: ticket.status,
    priority: ticket.priority,
    identity_confidence: ticket.identityConfidence,
    submitter_name: context.submitterName ?? null,
    submitter_email: context.submitterEmail ?? null,
    blocked_reason: ticket.currentBlockedReason ?? null,
    blocked_from_status: context.blockedFromStatus ?? null,
    blocked_notes: context.blockedNotes ?? null,
    closure_note: context.closureNote ?? null,
    closed_at: null,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  };
}

export function mapPersistenceTicketRowToDomain(row: TicketRow): Ticket {
  return {
    ticketId: row.id,
    siteId: row.site_id,
    submitterId: undefined,
    status: row.status,
    priority: row.priority,
    identityConfidence: row.identity_confidence,
    currentActorRole: ActorRole.SYSTEM,
    currentBlockedReason: row.blocked_reason ?? undefined,
    blockedContext: row.blocked_from_status
      ? {
          reason: row.blocked_reason ?? BlockedReason.INTERNAL_REVIEW,
          blockerOwner: ActorRole.SYSTEM,
          reasonDetail: row.blocked_notes ?? undefined,
          mitigationPlan: undefined,
          blockingEvidence: undefined,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAuditEventToPersistenceInsert(
  event: TicketAuditEvent,
  context: TenantContext & { siteId: string },
): AuditEventInsert {
  return {
    id: event.id,
    agency_id: context.agencyId,
    client_id: context.clientId,
    site_id: context.siteId,
    ticket_id: event.ticketId,
    actor_id: event.actorId,
    actor_role: event.actorRole,
    event_type: event.eventType,
    summary: event.summary,
    metadata: event.metadata,
    occurred_at: event.occurredAt,
    created_at: event.occurredAt,
    updated_at: event.occurredAt,
  };
}

export function mapPersistenceAuditEventRowToDomain(row: AuditEventRow): TicketAuditEvent {
  return {
    id: row.id,
    eventId: row.id,
    ticketId: row.ticket_id,
    actorId: row.actor_id,
    eventType: row.event_type,
    actorRole: row.actor_role,
    summary: row.summary,
    metadata: row.metadata,
    actorReference: undefined,
    occurredAt: row.occurred_at,
    stateBefore: undefined,
    stateAfter: undefined,
    rationale: undefined,
  };
}

export interface DomainMappingValidation {
  ok: boolean;
  errors: string[];
}

const hasOwn = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

export function validatePersistenceTicketShape(ticket: Partial<TicketInsert>): DomainMappingValidation {
  const errors: string[] = [];
  const required: Array<keyof TicketInsert> = [
    "id",
    "agency_id",
    "client_id",
    "site_id",
    "ticket_number",
    "title",
    "status",
    "priority",
    "identity_confidence",
    "created_at",
    "updated_at",
  ];

  for (const key of required) {
    if (!hasOwn(ticket as Record<string, unknown>, key)) {
      errors.push(`missing ticket field ${key}`);
    }
  }

  if (ticket.status && !Object.values(TicketStatus).includes(ticket.status)) {
    errors.push(`invalid status value ${String(ticket.status)}`);
  }

  if (ticket.priority && !Object.values(TicketPriority).includes(ticket.priority)) {
    errors.push(`invalid priority value ${String(ticket.priority)}`);
  }

  if (ticket.identity_confidence && !Object.values(IdentityConfidence).includes(ticket.identity_confidence)) {
    errors.push(`invalid identity_confidence value ${String(ticket.identity_confidence)}`);
  }

  return { ok: errors.length === 0, errors };
}

export function validatePersistenceAuditEventShape(event: Partial<AuditEventInsert>): DomainMappingValidation {
  const errors: string[] = [];
  const required: Array<keyof AuditEventInsert> = [
    "id",
    "agency_id",
    "client_id",
    "site_id",
    "ticket_id",
    "actor_id",
    "actor_role",
    "event_type",
    "summary",
    "metadata",
    "occurred_at",
  ];

  for (const key of required) {
    if (!hasOwn(event as Record<string, unknown>, key)) {
      errors.push(`missing audit event field ${key}`);
    }
  }

  if (event.metadata !== undefined && event.metadata !== null && typeof event.metadata !== "object") {
    errors.push("metadata must be an object");
  }

  if (event.event_type && !Object.values(AuditEventType).includes(event.event_type as AuditEventType)) {
    errors.push(`invalid event_type value ${String(event.event_type)}`);
  }

  return { ok: errors.length === 0, errors };
}

export { AuditEventType };
