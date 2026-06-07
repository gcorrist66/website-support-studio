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
import {
  canTransition,
  isApprovalActor,
  requiresCustomerEmailForSend,
  validateTransitionActor,
} from "./transitions";

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

interface ApprovalDecisionParams extends TicketTransitionParams {
  approvalNotes?: string;
  approverReference?: string;
}

interface RequestApprovalParams extends TicketTransitionParams {
  requestNotes?: string;
  draftSnapshot?: string;
  actorReference?: string;
  actorRole: ActorRole.CS_AGENT | ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN;
}

interface RejectDraftReplyParams extends ApprovalDecisionParams {
  route?: "reply_drafted" | "blocked";
}

type LifecycleRepository = Map<string, LifecycleTicketRecord>;

const repository: LifecycleRepository = new Map();
const timestamp = () => new Date().toISOString();
let nextTicketSeq = 1;
let nextMessageSeq = 1;
let nextAuditSeq = 1;
let nextApprovalSeq = 1;

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

function nextApprovalId(): string {
  return nextId("approval", nextApprovalSeq++);
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

function assertApproverRole(actorRole: ActorRole): void {
  if (!isApprovalActor(actorRole)) {
    throw new Error(`approver_role_required_${actorRole}`);
  }
}

function getRecord(ticketId: string): LifecycleTicketRecord {
  return assertTicketExists(ticketId);
}

function assertHasPendingApproval(record: LifecycleTicketRecord): TicketApproval {
  const latestApproval = record.approvals.at(-1);
  if (!latestApproval || latestApproval.decision !== "pending") {
    throw new Error(`approval_not_requested_${record.ticket.ticketId}`);
  }
  return latestApproval;
}

function createApprovalRecord(record: LifecycleTicketRecord, entry: {
  approverRole: ActorRole.CS_AGENT | ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN;
  decision: TicketApproval["decision"];
  decisionNotes?: string;
  approverReference?: string;
  approvedReplySnapshot?: string;
}): void {
  record.approvals.push({
    approvalId: nextApprovalId(),
    ticketId: record.ticket.ticketId,
    approverRole: entry.approverRole,
    decision: entry.decision,
    decisionNotes: entry.decisionNotes,
    decisionAt: timestamp(),
    approverReference: entry.approverReference,
    approvedReplySnapshot: entry.approvedReplySnapshot,
  });
}

function updateLatestApprovalRecord(
  record: LifecycleTicketRecord,
  updates: {
    approverRole: ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN;
    decision: "approved" | "rejected";
    decisionNotes?: string;
    approvedReplySnapshot?: string;
    approverReference?: string;
    decisionAt: string;
  },
): void {
  const latest = assertHasPendingApproval(record);
  latest.approverRole = updates.approverRole;
  latest.decision = updates.decision;
  latest.decisionNotes = updates.decisionNotes;
  latest.approverReference = updates.approverReference;
  latest.approvedReplySnapshot = updates.approvedReplySnapshot;
  latest.decisionAt = updates.decisionAt;
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

export function requestApproval({
  ticketId,
  actorRole,
  requestNotes,
  draftSnapshot,
  actorReference,
}: RequestApprovalParams): Ticket {
  const record = getRecord(ticketId);
  const ticket = transitionTicketStatus(
    record,
    TicketStatus.AWAITING_GARY_APPROVAL,
    actorRole,
    actorReference,
    requestNotes,
  );

  createApprovalRecord(record, {
    approverRole: actorRole,
    decision: "pending",
    decisionNotes: requestNotes,
    approverReference: actorReference,
    approvedReplySnapshot: draftSnapshot,
  });
  return ticket;
}

export function approveDraftReply({
  ticketId,
  actorRole,
  approvalNotes,
  actorReference,
  approverReference,
}: ApprovalDecisionParams): Ticket {
  const record = getRecord(ticketId);
  assertApproverRole(actorRole);
  const latestPending = assertHasPendingApproval(record);
  if (record.ticket.status !== TicketStatus.AWAITING_GARY_APPROVAL) {
    throw new Error(`invalid_approval_state_${record.ticket.status}`);
  }

  const approvedReplySnapshot = latestPending.approvedReplySnapshot;
  transitionTicketStatus(record, TicketStatus.APPROVED_TO_SEND, actorRole, actorReference, approvalNotes);

  updateLatestApprovalRecord(record, {
    approverRole: actorRole as ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN,
    decision: "approved",
    decisionNotes: approvalNotes,
    approverReference,
    approvedReplySnapshot,
    decisionAt: timestamp(),
  });

  return record.ticket;
}

export function rejectDraftReply({
  ticketId,
  actorRole,
  approvalNotes,
  actorReference,
  approverReference,
  route = "reply_drafted",
}: RejectDraftReplyParams): Ticket {
  const record = getRecord(ticketId);
  const isApprover = isApprovalActor(actorRole);
  if (!isApprover) {
    throw new Error(`approver_role_required_${actorRole}`);
  }
  assertHasPendingApproval(record);
  if (record.ticket.status !== TicketStatus.AWAITING_GARY_APPROVAL) {
    throw new Error(`invalid_rejection_state_${record.ticket.status}`);
  }

  record.ticket.currentBlockedReason = BlockedReason.INTERNAL_REVIEW;
  const blocked = transitionTicketStatus(
    record,
    TicketStatus.BLOCKED,
    actorRole,
    actorReference,
    approvalNotes,
  );

  updateLatestApprovalRecord(record, {
    approverRole: actorRole as ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN,
    decision: "rejected",
    decisionNotes: approvalNotes,
    approverReference,
    decisionAt: timestamp(),
    approvedReplySnapshot: undefined,
  });

  if (route === "reply_drafted") {
    return unblockTicket({
      ticketId,
      actorRole: ActorRole.SYSTEM,
      targetStatus: TicketStatus.REPLY_DRAFTED,
      rationale: approvalNotes,
      actorReference,
    });
  }

  emitEvent(
    record,
    AuditEventType.APPROVAL_REJECTED,
    actorRole,
    actorReference,
    TicketStatus.AWAITING_GARY_APPROVAL,
    TicketStatus.BLOCKED,
    approvalNotes,
  );

  return blocked;
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

export function getApprovals(ticketId: string): TicketApproval[] {
  const record = repository.get(ticketId);
  return record ? [...record.approvals] : [];
}

export function listTickets(): Ticket[] {
  return [...repository.values()].map((record) => record.ticket);
}

export function clearLifecycleState(): void {
  repository.clear();
  nextTicketSeq = 1;
  nextMessageSeq = 1;
  nextAuditSeq = 1;
  nextApprovalSeq = 1;
}
