import {
  ActorRole,
  AuditEventType,
  BlockedReason,
  IdentityConfidence,
  TicketPriority,
  TicketStatus,
} from "./ticketStatus";
import type {
  Ticket,
  TicketAuditEvent,
  TicketApproval,
  TicketDraftReply,
  TicketMessage,
  TicketSubmitter,
} from "./types";
import { canTransition, requiresCustomerEmailForSend, validateTransitionActor } from "./transitions";

interface LifecycleTicketRecord {
  submitter?: TicketSubmitter;
  ticket: Ticket;
  messages: TicketMessage[];
  drafts: TicketDraftReply[];
  approvals: TicketApproval[];
  audits: TicketAuditEvent[];
  previousBlockedStatus?: TicketStatus;
}

interface CreateTicketParams {
  siteId: string;
  submitter?: TicketSubmitter;
  priority?: TicketPriority;
  identityConfidence?: IdentityConfidence;
  intakeChannel: string;
  source: string;
  rawMessage: string;
  actorReference?: string;
}

interface TicketTransitionParams {
  ticketId: string;
  actorRole: ActorRole;
  rationale?: string;
  actorReference?: string;
}

interface BlockTicketParams extends TicketTransitionParams {
  reason: BlockedReason;
  blockerOwner: ActorRole;
  reasonDetail?: string;
  mitigationPlan?: string;
  blockingEvidence?: string;
  nextAction?: string;
}

interface UnblockTicketParams extends TicketTransitionParams {
  targetStatus: TicketStatus;
  previousBlockedStatus?: TicketStatus;
}

type LifecycleRepository = Map<string, LifecycleTicketRecord>;

const repository: LifecycleRepository = new Map();
const timestamp = () => new Date().toISOString();
let nextTicketSeq = 1;
let nextMessageSeq = 1;
let nextAuditSeq = 1;

function nextId(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(5, "0")}`;
}

function nextTicketId(): string {
  const id = nextId("ticket", nextTicketSeq);
  nextTicketSeq += 1;
  return id;
}

function nextMessageId(): string {
  const id = nextId("msg", nextMessageSeq);
  nextMessageSeq += 1;
  return id;
}

function nextAuditId(): string {
  const id = nextId("audit", nextAuditSeq);
  nextAuditSeq += 1;
  return id;
}

function getRequiredNow(): { now: string } {
  return { now: timestamp() };
}

function createAuditEvent(
  ticketId: string,
  eventType: AuditEventType,
  actorRole: ActorRole,
  actorReference: string | undefined,
  stateBefore: TicketStatus | undefined,
  stateAfter: TicketStatus,
  rationale?: string,
): TicketAuditEvent {
  return {
    eventId: nextAuditId(),
    ticketId,
    eventType,
    actorRole,
    actorReference,
    occurredAt: timestamp(),
    stateBefore,
    stateAfter,
    rationale,
  };
}

function emitEvent(
  record: LifecycleTicketRecord,
  eventType: AuditEventType,
  actorRole: ActorRole,
  actorReference: string | undefined,
  stateBefore: TicketStatus | undefined,
  stateAfter: TicketStatus,
  rationale?: string,
): void {
  record.audits.push(
    createAuditEvent(record.ticket.ticketId, eventType, actorRole, actorReference, stateBefore, stateAfter, rationale),
  );
}

function assertTicketExists(ticketId: string): LifecycleTicketRecord {
  const record = repository.get(ticketId);
  if (!record) {
    throw new Error(`ticket_not_found: ${ticketId}`);
  }
  return record;
}

function ensureTransitionAllowed(
  record: LifecycleTicketRecord,
  to: TicketStatus,
  actorRole: ActorRole,
): void {
  const from = record.ticket.status;
  if (record.ticket.status === TicketStatus.CLOSED) {
    throw new Error(`terminal_ticket_${record.ticket.ticketId}`);
  }

  if (!canTransition(from, to, { fromBlockedStatus: record.previousBlockedStatus })) {
    throw new Error(`invalid_transition_${from}_to_${to}`);
  }

  if (!validateTransitionActor(from, to, actorRole)) {
    throw new Error(`actor_not_authorized_${actorRole}_for_${from}_to_${to}`);
  }

  if (
    to === TicketStatus.SENT_TO_CUSTOMER &&
    requiresCustomerEmailForSend({
      status: record.ticket.status,
      submitter: record.submitter,
      submitterEmail: record.submitter?.submitterEmail,
    })
  ) {
    throw new Error(`missing_customer_contact_for_send_${record.ticket.ticketId}`);
  }
}

function transitionTicketStatus(
  record: LifecycleTicketRecord,
  to: TicketStatus,
  actorRole: ActorRole,
  actorReference?: string,
  rationale?: string,
  unblockTarget = false,
): Ticket {
  const from = record.ticket.status;
  const fromStatus = from as TicketStatus;
  const nextStatus = to as TicketStatus;
  ensureTransitionAllowed(record, to, actorRole);

  emitEvent(record, determineAuditEvent(record.ticket.status, to, unblockTarget), actorRole, actorReference, from, to, rationale);

  if (to === TicketStatus.BLOCKED) {
    record.previousBlockedStatus = from;
    record.ticket.currentBlockedReason = record.ticket.currentBlockedReason ?? BlockedReason.OTHER;
    record.ticket.blockedContext = {
      reason: record.ticket.currentBlockedReason,
      reasonDetail: rationale,
      blockerOwner: actorRole,
      mitigationPlan: undefined,
      blockingEvidence: undefined,
      nextAction: "resume_after_block_resolved",
    };
  } else if (fromStatus === TicketStatus.BLOCKED && nextStatus !== TicketStatus.BLOCKED) {
    emitEvent(
      record,
      AuditEventType.TICKET_UNBLOCKED,
      actorRole,
      actorReference,
      from,
      to,
      rationale,
    );
    record.ticket.currentBlockedReason = undefined;
    record.ticket.blockedContext = undefined;
    record.previousBlockedStatus = undefined;
  }

  record.ticket.status = to;
  record.ticket.currentActorRole = actorRole;
  record.ticket.updatedAt = getRequiredNow().now;
  return record.ticket;
}

function determineAuditEvent(
  from: TicketStatus,
  to: TicketStatus,
  unblockTarget = false,
): AuditEventType {
  if (to === TicketStatus.TRIAGED) {
    return AuditEventType.TICKET_TRIAGED;
  }
  if (to === TicketStatus.REPLY_DRAFTED && from === TicketStatus.BLOCKED && unblockTarget) {
    return AuditEventType.APPROVAL_REJECTED;
  }
  if (to === TicketStatus.REPLY_DRAFTED) {
    return AuditEventType.REPLY_DRAFTED;
  }
  if (to === TicketStatus.AWAITING_GARY_APPROVAL) {
    return AuditEventType.APPROVAL_REQUESTED;
  }
  if (to === TicketStatus.APPROVED_TO_SEND) {
    return AuditEventType.APPROVAL_GRANTED;
  }
  if (to === TicketStatus.SENT_TO_CUSTOMER) {
    return AuditEventType.REPLY_SENT;
  }
  if (to === TicketStatus.BLOCKED) {
    return AuditEventType.TICKET_BLOCKED;
  }
  if (to === TicketStatus.CLOSED) {
    return AuditEventType.TICKET_CLOSED;
  }
  return AuditEventType.RESPONSE_SENT;
}

export function createTicket(params: CreateTicketParams): Ticket {
  const id = nextTicketId();
  const now = timestamp();
  const submitterId = params.submitter?.submitterId;
  const identityConfidence = params.identityConfidence ?? IdentityConfidence.UNKNOWN;

  const message: TicketMessage = {
    messageId: nextMessageId(),
    ticketId: id,
    submittedBySubmitterId: submitterId,
    rawMessage: params.rawMessage,
    receivedAt: now,
    intakeChannel: params.intakeChannel,
    source: params.source,
  };

  const ticket: Ticket = {
    ticketId: id,
    siteId: params.siteId,
    status: TicketStatus.RECEIVED,
    priority: params.priority ?? TicketPriority.NORMAL,
    identityConfidence,
    currentActorRole: ActorRole.SYSTEM,
    submitterId,
    createdAt: now,
    updatedAt: now,
  };

  const record: LifecycleTicketRecord = {
    submitter: params.submitter,
    ticket,
    messages: [message],
    drafts: [],
    approvals: [],
    audits: [],
  };

  emitEvent(
    record,
    AuditEventType.TICKET_CREATED,
    ActorRole.SYSTEM,
    params.actorReference,
    undefined,
    TicketStatus.RECEIVED,
  );

  repository.set(id, record);
  return ticket;
}

export function transitionTicket(
  ticketId: string,
  to: TicketStatus,
  actorRole: ActorRole,
  actorReference?: string,
  rationale?: string,
): Ticket {
  const record = assertTicketExists(ticketId);
  return transitionTicketStatus(record, to, actorRole, actorReference, rationale);
}

export function blockTicket({
  ticketId,
  actorRole,
  reason,
  blockerOwner,
  reasonDetail,
  mitigationPlan,
  blockingEvidence,
  nextAction,
  rationale,
  actorReference,
}: BlockTicketParams): Ticket {
  const record = assertTicketExists(ticketId);
  record.ticket.currentBlockedReason = reason;
  record.ticket.blockedContext = {
    reason,
    reasonDetail,
    blockerOwner,
    mitigationPlan,
    blockingEvidence,
    nextAction,
  };
  const next = transitionTicketStatus(
    record,
    TicketStatus.BLOCKED,
    actorRole,
    actorReference,
    rationale,
  );
  return next;
}

export function unblockTicket({
  ticketId,
  actorRole,
  targetStatus,
  previousBlockedStatus,
  rationale,
  actorReference,
}: UnblockTicketParams): Ticket {
  const record = assertTicketExists(ticketId);
  if (record.ticket.status !== TicketStatus.BLOCKED) {
    throw new Error(`ticket_not_blocked_${ticketId}`);
  }

  record.previousBlockedStatus = previousBlockedStatus ?? record.previousBlockedStatus;
  const next = transitionTicketStatus(
    record,
    targetStatus,
    actorRole,
    actorReference,
    rationale,
    true,
  );
  return next;
}

export function closeTicket(
  ticketId: string,
  actorRole: ActorRole,
  actorReference?: string,
  rationale?: string,
): Ticket {
  const record = assertTicketExists(ticketId);
  return transitionTicketStatus(
    record,
    TicketStatus.CLOSED,
    actorRole,
    actorReference,
    rationale,
  );
}

export function getTicket(ticketId: string): Ticket | undefined {
  const record = repository.get(ticketId);
  return record?.ticket;
}

export function getAuditTrail(ticketId: string): TicketAuditEvent[] {
  const record = repository.get(ticketId);
  return record ? [...record.audits] : [];
}

export function listTickets(): Ticket[] {
  return [...repository.values()].map((record) => record.ticket);
}

export function clearLifecycleState(): void {
  repository.clear();
  nextTicketSeq = 1;
  nextMessageSeq = 1;
  nextAuditSeq = 1;
}
