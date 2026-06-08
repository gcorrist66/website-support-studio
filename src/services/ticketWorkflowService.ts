import { generateRuntimeUuid } from "../utils/runtimeUuid";

import { ActorRole, BlockedReason, IdentityConfidence, TicketPriority, TicketStatus } from "../domain/ticketStatus";
import type {
  Agency,
  Client,
  Site,
  Ticket,
  TicketCommunicationRecord,
  TicketDraftReply,
  TicketSubmitter,
} from "../domain/types";
import {
  approveDraftReply,
  blockTicket,
  closeTicket,
  createCustomerReplyDraft,
  createTicket,
  rejectDraftReply,
  getApprovals,
  getDrafts,
  getAuditTrail,
  getCommunicationTrail,
  markReplyReadyForApproval,
  unblockTicket,
  sendApprovedCustomerReply,
  transitionTicket,
} from "../domain/ticketLifecycle";
import {
  deleteWorkflowForTicket,
  persistWorkflowCreate,
  persistWorkflowMutation,
  querySql,
  type TicketCommunicationWrite,
  type TicketLifecycleCreateInput,
  type TicketLifecycleMutationInput,
  type TicketTenantIds,
} from "./ticketRepository";

interface ServiceSession {
  agency: Agency;
  client: Client;
  site: Site;
  tenant: TicketTenantIds;
  ticketId: string;
  ticketNumber: string;
  title: string;
  description: string;
  submitter?: TicketSubmitter;
  persistedAuditIds: Set<string>;
  persistedDraftIds: Set<string>;
  persistedApprovalIds: Set<string>;
  persistedCommunicationIds: Set<string>;
  persistedDrafts: TicketDraftReply[];
}

interface ServiceTenantInput {
  agencyId?: string;
  clientId?: string;
  siteId?: string;
  agencyName?: string;
  clientName?: string;
  siteName?: string;
}

interface CreatePersistedTicketInput {
  tenant?: ServiceTenantInput;
  submitter?: {
    submitterId?: string;
    submitterName?: string;
    submitterEmail?: string;
  };
  ticket: {
    rawMessage: string;
    intakeChannel: string;
    source: string;
    priority?: TicketPriority;
    identityConfidence?: IdentityConfidence;
    actorReference?: string;
    submitterEmailRequired?: boolean;
    title?: string;
  };
}

interface SendPersistedCustomerInput {
  ticketId: string;
  actorReference: string;
  recipientEmail?: string;
  rationale?: string;
}

const sessions = new Map<string, ServiceSession>();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim();
}

function defaultTenantContext(input: ServiceTenantInput): {
  agency: Agency;
  client: Client;
  site: Site;
  tenant: TicketTenantIds;
} {
  const agencyId = input.agencyId ?? generateRuntimeUuid();
  const clientId = input.clientId ?? generateRuntimeUuid();
  const siteId = input.siteId ?? generateRuntimeUuid();
  const now = new Date().toISOString();

  const agency: Agency = {
    agencyId,
    agencyName: normalizeText(input.agencyName) || `agency-${agencyId.slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  const client: Client = {
    clientId,
    agencyId,
    clientName: normalizeText(input.clientName) || `client-${clientId.slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  const site: Site = {
    siteId,
    clientId,
    siteName: normalizeText(input.siteName) || `site-${siteId.slice(0, 8)}`,
    canonicalDomain: `https://local-${siteId.slice(0, 8)}.example.com`,
    createdAt: now,
    updatedAt: now,
  };

  return {
    agency,
    client,
    site,
    tenant: {
      agencyId,
      clientId,
      siteId,
    },
  };
}

function buildSubmitter(
  session: ServiceSession,
  input?: {
    submitterId?: string;
    submitterName?: string;
    submitterEmail?: string;
  },
): TicketSubmitter | undefined {
  const submitterEmail = normalizeText(input?.submitterEmail);

  return {
    submitterId: input?.submitterId ?? `submitter-${generateRuntimeUuid()}`,
    siteId: session.tenant.siteId,
    identityConfidence: IdentityConfidence.KNOWN,
    submitterName: normalizeText(input?.submitterName) || undefined,
    submitterEmail: submitterEmail || undefined,
  };
}

function getSession(ticketId: string): ServiceSession {
  const session = sessions.get(ticketId);
  if (!session) {
    throw new Error(`No workflow session found for ticket ${ticketId}`);
  }
  return session;
}

function assertTenantIntegrity(session: ServiceSession): void {
  assert(session.site.clientId === session.client.clientId, "tenant hierarchy mismatch");
  assert(session.client.agencyId === session.agency.agencyId, "tenant hierarchy mismatch");
  assert(session.tenant.agencyId === session.agency.agencyId, "tenant hierarchy mismatch");
  assert(session.tenant.clientId === session.client.clientId, "tenant hierarchy mismatch");
  assert(session.tenant.siteId === session.site.siteId, "tenant hierarchy mismatch");
}

function tenantContextFromSession(session: ServiceSession, closureNote?: string | null): TicketLifecycleMutationInput["tenantContext"] {
  return {
    ticketNumber: session.ticketNumber,
    title: session.title,
    description: session.description,
    submitterName: session.submitter?.submitterName ?? null,
    submitterEmail: session.submitter?.submitterEmail ?? null,
    blockedFromStatus: null,
    blockedNotes: null,
    closureNote: closureNote ?? null,
    agencyId: session.tenant.agencyId,
    clientId: session.tenant.clientId,
    siteId: session.tenant.siteId,
  };
}

function filterNewById<T>(items: T[], knownIds: Set<string>, idKey: keyof T): T[] {
  return items.filter((item) => {
    const id = item[idKey];
    return typeof id === "string" && id.length > 0 && !knownIds.has(id);
  });
}

function markIds(knownIds: Set<string>, ids: string[]): void {
  for (const id of ids) {
    knownIds.add(id);
  }
}

function buildDraftRecord(session: ServiceSession, ticketId: string, draftText: string, options?: {
  draftAssumptions?: string;
  evidenceReference?: string;
  qualityCheckFlag?: boolean;
  draftId?: string;
  draftVersion?: number;
}): TicketDraftReply {
  return {
    draftId: options?.draftId ?? generateRuntimeUuid(),
    ticketId,
    draftText,
    draftingAgentRole: ActorRole.CS_AGENT,
    draftedAt: new Date().toISOString(),
    draftVersion: options?.draftVersion ?? session.persistedDrafts.length + 1,
    draftAssumptions: options?.draftAssumptions,
    evidenceReference: options?.evidenceReference,
    qualityCheckFlag: options?.qualityCheckFlag,
  };
}

function mapCommunicationToPersisted(
  communication: TicketCommunicationRecord,
  approvalId: string,
): TicketCommunicationWrite {
  return {
    communicationId: communication.communicationId,
    ticketId: communication.ticketId,
    draftReplyId: communication.draftId,
    approvalId,
    sentByRole: communication.sentByRole === ActorRole.CS_AGENT ? ActorRole.CS_AGENT : ActorRole.SYSTEM,
    sentAt: communication.sentAt,
    recipientEmail: communication.recipientEmail,
    messagePreview: communication.messagePreview,
  };
}

function persistMutation(
  session: ServiceSession,
  ticket: Ticket,
  changes: {
    audits: TicketLifecycleMutationInput["audits"];
    drafts?: TicketLifecycleMutationInput["drafts"];
    approvals?: TicketLifecycleMutationInput["approvals"];
    communications?: TicketLifecycleMutationInput["communications"];
    closureNote?: string | null;
    draftReplyId?: string;
  },
): void {
  if (
    changes.audits.length === 0 &&
    (!changes.drafts || changes.drafts.length === 0) &&
    (!changes.approvals || changes.approvals.length === 0) &&
    (!changes.communications || changes.communications.length === 0)
  ) {
    return;
  }

  persistWorkflowMutation({
    agency: session.agency,
    client: session.client,
    site: session.site,
    ticket,
    tenantContext: tenantContextFromSession(session, changes.closureNote),
    audits: changes.audits,
    drafts: changes.drafts,
    approvals: changes.approvals,
    approvalDraftReplyId: changes.draftReplyId,
    communications: changes.communications,
    messages: [],
  });
}

function getLatestDraftReplyId(session: ServiceSession): string | undefined {
  return session.persistedDrafts.at(-1)?.draftId;
}

function collectDecidedApproval(ticketId: string) {
  const latest = getApprovals(ticketId).at(-1);
  return latest ? [latest] : [];
}

export function createPersistedTicket(input: CreatePersistedTicketInput): Ticket {
  const { agency, client, site, tenant } = defaultTenantContext(input.tenant ?? {});

  const session: ServiceSession = {
    agency,
    client,
    site,
    tenant,
    ticketId: "",
    ticketNumber: `TKT-${Date.now().toString(36).toUpperCase()}`,
    title: normalizeText(input.ticket.title) || "Customer support ticket",
    description: input.ticket.rawMessage,
    submitter: undefined,
    persistedAuditIds: new Set(),
    persistedDraftIds: new Set(),
    persistedApprovalIds: new Set(),
    persistedCommunicationIds: new Set(),
    persistedDrafts: [],
  };

  if (input.ticket.submitterEmailRequired) {
    assert(
      normalizeText(input.submitter?.submitterEmail).length > 0,
      "submitterEmail required for this scenario",
    );
  }

  const submitter = buildSubmitter(session, input.submitter);
  session.submitter = submitter;

  const ticket = createTicket({
    siteId: site.siteId,
    submitter,
    priority: input.ticket.priority ?? TicketPriority.NORMAL,
    identityConfidence: input.ticket.identityConfidence ?? IdentityConfidence.KNOWN,
    intakeChannel: input.ticket.intakeChannel,
    source: input.ticket.source,
    rawMessage: input.ticket.rawMessage,
    actorReference: input.ticket.actorReference,
  });

  session.ticketId = ticket.ticketId;
  session.ticketNumber = `TKT-${ticket.ticketId.slice(0, 8).toUpperCase()}`;
  assertTenantIntegrity(session);

  const auditTrail = getAuditTrail(ticket.ticketId);
  session.persistedAuditIds = new Set(auditTrail.map((event) => event.id));

  const payload: TicketLifecycleCreateInput = {
    agency,
    client,
    site,
    ticket,
    tenantContext: {
      ...session.tenant,
      ticketNumber: session.ticketNumber,
      title: session.title,
      description: session.description,
      submitterName: submitter?.submitterName,
      submitterEmail: submitter?.submitterEmail,
      blockedFromStatus: null,
      blockedNotes: null,
      closureNote: null,
    },
    submitter: submitter
      ? {
          submitterId: submitter.submitterId,
          submitterName: submitter.submitterName,
          submitterEmail: submitter.submitterEmail,
          siteId: submitter.siteId,
        }
      : undefined,
    messages: [],
    audits: auditTrail,
  };

  persistWorkflowCreate(payload);
  sessions.set(ticket.ticketId, session);
  return ticket;
}

export function triagePersistedTicket(
  ticketId: string,
  actorRole: ActorRole,
  actorReference: string,
  rationale?: string,
): Ticket {
  const session = getSession(ticketId);
  assertTenantIntegrity(session);

  const ticket = transitionTicket(
    ticketId,
    TicketStatus.TRIAGED,
    actorRole,
    actorReference,
    rationale,
  );

  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");
  persistMutation(session, ticket, { audits: newAudits });
  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));

  return ticket;
}

export function draftPersistedReply(
  ticketId: string,
  draftText: string,
  actorReference: string,
  options?: {
    draftAssumptions?: string;
    evidenceReference?: string;
    qualityCheckFlag?: boolean;
    rationale?: string;
  },
): Ticket {
  const session = getSession(ticketId);
  assertTenantIntegrity(session);
  const normalizedDraftText = draftText.trim();
  if (!normalizedDraftText) {
    throw new Error("draftText is required");
  }

  const ticket = createCustomerReplyDraft({
    ticketId,
    actorRole: ActorRole.CS_AGENT,
    actorReference,
    draftText: normalizedDraftText,
    draftAssumptions: options?.draftAssumptions,
    evidenceReference: options?.evidenceReference,
    qualityCheckFlag: options?.qualityCheckFlag,
    rationale: options?.rationale,
  });

  const latestDomainDraft = getDrafts(ticketId).at(-1);
  if (!latestDomainDraft) {
    throw new Error("domain draft should exist after draft action");
  }

  const draft = buildDraftRecord(
    session,
    ticketId,
    normalizedDraftText,
    {
      draftAssumptions: options?.draftAssumptions,
      evidenceReference: options?.evidenceReference,
      qualityCheckFlag: options?.qualityCheckFlag,
      draftId: latestDomainDraft.draftId,
      draftVersion: latestDomainDraft.draftVersion,
    },
  );
  session.persistedDrafts.push(draft);

  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");

  persistMutation(session, ticket, {
    audits: newAudits,
    drafts: [draft],
  });

  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));
  markIds(session.persistedDraftIds, [draft.draftId]);

  return ticket;
}

export function requestPersistedApproval(
  ticketId: string,
  actorReference?: string,
  requestNotes?: string,
): Ticket {
  const session = getSession(ticketId);
  assertTenantIntegrity(session);

  const ticket = markReplyReadyForApproval({
    ticketId,
    actorRole: ActorRole.CS_AGENT,
    actorReference,
    requestNotes,
  });

  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");
  const newApprovals = filterNewById(getApprovals(ticketId), session.persistedApprovalIds, "approvalId");

  persistMutation(session, ticket, {
    draftReplyId: getLatestDraftReplyId(session),
    audits: newAudits,
    approvals: newApprovals,
  });

  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));
  markIds(session.persistedApprovalIds, newApprovals.map((approval) => approval.approvalId));

  return ticket;
}

export function approvePersistedReply(
  ticketId: string,
  actorRole: ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN,
  actorReference: string,
  approvalNotes?: string,
): Ticket {
  const session = getSession(ticketId);
  assertTenantIntegrity(session);

  const ticket = approveDraftReply({
    ticketId,
    actorRole,
    approvalNotes,
    actorReference,
    approverReference: actorReference,
  });

  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");
  // The pending approval row was already persisted during request-approval, so it is
  // filtered out by filterNewById. An approval decision mutates that same row, so upsert
  // the latest approval explicitly to land the approved/rejected decision in storage.
  const decidedApprovals = collectDecidedApproval(ticketId);

  persistMutation(session, ticket, {
    draftReplyId: getLatestDraftReplyId(session),
    audits: newAudits,
    approvals: decidedApprovals,
  });

  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));
  markIds(session.persistedApprovalIds, decidedApprovals.map((approval) => approval.approvalId));

  return ticket;
}

export function rejectPersistedReply(
  ticketId: string,
  actorRole: ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN,
  actorReference: string,
  rejectionNotes?: string,
): Ticket {
  const session = getSession(ticketId);
  assertTenantIntegrity(session);

  const ticket = rejectDraftReply({
    ticketId,
    actorRole,
    actorReference,
    approvalNotes: rejectionNotes,
    approverReference: actorReference,
  });

  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");
  // See approvePersistedReply: upsert the decided approval row so the rejected decision persists.
  const decidedApprovals = collectDecidedApproval(ticketId);

  persistMutation(session, ticket, {
    draftReplyId: getLatestDraftReplyId(session),
    audits: newAudits,
    approvals: decidedApprovals,
  });

  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));
  markIds(session.persistedApprovalIds, decidedApprovals.map((approval) => approval.approvalId));

  return ticket;
}

export function blockPersistedTicket(
  ticketId: string,
  actorRole: ActorRole,
  reason: string,
  blockerOwner: ActorRole,
  reasonDetail: string,
  actorReference: string,
  mitigationPlan?: string,
  nextAction?: string,
): Ticket {
  const session = getSession(ticketId);
  assertTenantIntegrity(session);

  const ticket = blockTicket({
    ticketId,
    actorRole,
    actorReference,
    reason: reason as BlockedReason,
    blockerOwner,
    reasonDetail,
    mitigationPlan,
    nextAction,
  });

  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");
  persistMutation(session, ticket, {
    audits: newAudits,
    draftReplyId: getLatestDraftReplyId(session),
  });
  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));

  return ticket;
}

export function unblockPersistedTicket(
  ticketId: string,
  actorRole: ActorRole,
  targetStatus: TicketStatus,
  actorReference?: string,
  previousBlockedStatus?: TicketStatus,
  rationale?: string,
): Ticket {
  const session = getSession(ticketId);
  assertTenantIntegrity(session);

  const ticket = unblockTicket({
    ticketId,
    actorRole,
    actorReference,
    targetStatus,
    rationale,
    previousBlockedStatus,
  });

  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");

  persistMutation(session, ticket, {
    audits: newAudits,
    draftReplyId: getLatestDraftReplyId(session),
  });
  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));

  return ticket;
}

export function sendPersistedCustomerReplyLocalOnly(input: SendPersistedCustomerInput): Ticket {
  const session = getSession(input.ticketId);
  assertTenantIntegrity(session);

  const ticket = sendApprovedCustomerReply({
    ticketId: input.ticketId,
    actorRole: ActorRole.CS_AGENT,
    actorReference: input.actorReference,
    recipientEmail: input.recipientEmail,
    rationale: input.rationale,
  });

  const newAudits = filterNewById(getAuditTrail(input.ticketId), session.persistedAuditIds, "id");

  const latestApproval = getApprovals(input.ticketId).at(-1);
  if (!latestApproval) {
    throw new Error("approved approval required before send");
  }
  assert(latestApproval.decision === "approved", "approved approval required before send");
  assert(latestApproval.approvalId.length > 0, "latest approval id required before send");

  const newComms = filterNewById(
    getCommunicationTrail(input.ticketId),
    session.persistedCommunicationIds,
    "communicationId",
  ).map((communication) => mapCommunicationToPersisted(communication, latestApproval.approvalId));

  persistMutation(session, ticket, {
    draftReplyId: getLatestDraftReplyId(session),
    audits: newAudits,
    communications: newComms,
  });

  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));
  markIds(session.persistedCommunicationIds, newComms.map((record) => record.communicationId));

  return ticket;
}

export function closePersistedTicket(
  ticketId: string,
  actorRole: ActorRole.CS_AGENT | ActorRole.AGENCY_ADMIN | ActorRole.GARY_APPROVER,
  closureNote: string,
  actorReference?: string,
): Ticket {
  assert(closureNote.trim().length > 0, "closure note is required");

  const session = getSession(ticketId);
  assertTenantIntegrity(session);

  const ticket = closeTicket(ticketId, actorRole, actorReference, closureNote);
  const newAudits = filterNewById(getAuditTrail(ticketId), session.persistedAuditIds, "id");

  persistMutation(session, ticket, {
    audits: newAudits,
    closureNote,
  });

  markIds(session.persistedAuditIds, newAudits.map((event) => event.id));

  return ticket;
}

export function getWorkflowSession(ticketId: string): ServiceSession | undefined {
  return sessions.get(ticketId);
}

export function cleanupWorkflowSession(ticketId: string): void {
  const session = sessions.get(ticketId);
  if (!session) {
    return;
  }

  deleteWorkflowForTicket(session.tenant, ticketId);
  sessions.delete(ticketId);
}

export function assertNoProductionSendEvidence(ticketId: string): boolean {
  const [countRow] = querySql<{ count: string }>(
    `select count(*)::int as count from public.ticket_communications where ticket_id = '${ticketId}' and delivery_status = 'sent';`,
  );
  return Number(countRow?.count ?? 0) === 0;
}
