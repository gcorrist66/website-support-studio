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
  TicketCommunicationRecord,
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
  communicationRecords: TicketCommunicationRecord[];
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
  actorRole: ActorRole.CS_AGENT | ActorRole.GARY_APPROVER | ActorRole.AGENCY_ADMIN;
}

interface CreateCustomerReplyDraftParams extends TicketTransitionParams {
  draftText: string;
  draftAssumptions?: string;
  evidenceReference?: string;
  qualityCheckFlag?: boolean;
}

interface SendApprovedCustomerReplyParams extends TicketTransitionParams {
  recipientEmail?: string;
}

interface RejectDraftReplyParams extends ApprovalDecisionParams {
  route?: "reply_drafted" | "blocked";
}

type LifecycleRepository = Map<string, LifecycleTicketRecord>;

const repository: LifecycleRepository = new Map();
type AuditMetadata = Record<string, unknown>;
const timestamp = () => new Date().toISOString();
let nextTicketSeq = 1;
let nextMessageSeq = 1;
let nextDraftSeq = 1;
let nextCommunicationSeq = 1;
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

function nextDraftId(): string {
  const id = nextId("draft", nextDraftSeq);
  nextDraftSeq += 1;
  return id;
}

function nextCommunicationId(): string {
  const id = nextId("comm", nextCommunicationSeq);
  nextCommunicationSeq += 1;
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

const REQUIRED_AUDIT_METADATA_FIELDS: Readonly<
  Partial<Record<AuditEventType, readonly string[]>>
> = {
  [AuditEventType.TICKET_CREATED]: [
    "ticket_source",
    "site_of_origin",
    "raw_customer_message",
    "submission_timestamp",
    "intake_channel",
  ],
  [AuditEventType.TICKET_TRIAGED]: [
    "triage_owner",
    "triage_timestamp",
    "triage_notes",
  ],
  [AuditEventType.REPLY_DRAFTED]: [
    "draft_reference",
    "drafted_reply_text",
    "drafting_agent",
    "draft_timestamp",
  ],
  [AuditEventType.APPROVAL_REQUESTED]: [
    "approval_request_timestamp",
    "draft_reference",
    "gary_assigned",
  ],
  [AuditEventType.APPROVAL_GRANTED]: [
    "approval_timestamp",
    "approver_id",
    "approval_decision",
    "approval_notes",
  ],
  [AuditEventType.APPROVAL_REJECTED]: [
    "rejection_timestamp",
    "approver_id",
    "approval_decision",
  ],
  [AuditEventType.REPLY_SENT]: [
    "communication_channel",
    "recipient_contact",
    "sent_payload_reference",
    "sent_confirmation",
  ],
  [AuditEventType.TICKET_BLOCKED]: [
    "blocked_reason",
    "blocked_reason_detail",
    "blocker_owner",
    "blocked_timestamp",
    "next_action",
  ],
  [AuditEventType.TICKET_UNBLOCKED]: [
    "previous_blocked_status",
    "blocked_reason",
    "unblock_timestamp",
    "unblock_owner",
  ],
  [AuditEventType.TICKET_CLOSED]: [
    "closure_note",
    "closure_timestamp",
    "closed_by",
    "final_status_summary",
  ],
};

const AUDIT_SUMMARY: Record<string, string> = {
  [AuditEventType.TICKET_CREATED]: "Ticket created",
  [AuditEventType.TICKET_TRIAGED]: "Ticket triaged",
  [AuditEventType.REPLY_DRAFTED]: "Reply drafted",
  [AuditEventType.DRAFT_SNAPSHOT_STORED]: "Draft snapshot stored",
  [AuditEventType.APPROVAL_REQUESTED]: "Approval requested",
  [AuditEventType.APPROVAL_GRANTED]: "Approval granted",
  [AuditEventType.APPROVAL_REJECTED]: "Approval rejected",
  [AuditEventType.REPLY_SENT]: "Reply sent to customer",
  [AuditEventType.TICKET_BLOCKED]: "Ticket blocked",
  [AuditEventType.TICKET_UNBLOCKED]: "Ticket unblocked",
  [AuditEventType.TICKET_CLOSED]: "Ticket closed",
};

function normalizeActorId(actorRole: ActorRole, actorReference?: string): string {
  if (actorReference && actorReference.trim().length > 0) {
    return actorReference.trim();
  }
  return `${actorRole}-actor`;
}

function latestTicketMessage(record: LifecycleTicketRecord): TicketMessage {
  return record.messages.at(-1) ?? record.messages[0];
}

function latestDraft(record: LifecycleTicketRecord): TicketDraftReply {
  return record.drafts.at(-1) as TicketDraftReply;
}

function requireNonEmptyString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`audit_metadata_validation_failed`);
  }
  return value.trim();
}

function createAuditEvent(
  ticketId: string,
  eventType: AuditEventType,
  actorRole: ActorRole,
  actorId: string,
  stateBefore: TicketStatus | undefined,
  stateAfter: TicketStatus,
  summary: string,
  rationale?: string,
  metadata: AuditMetadata = {},
): TicketAuditEvent {
  const occurredAt = timestamp();
  const eventId = nextAuditId();
  return {
    id: eventId,
    eventId,
    ticketId,
    eventType,
    actorRole,
    actorId,
    summary,
    metadata,
    occurredAt,
    stateBefore,
    stateAfter,
    rationale,
  };
}

function assertAuditMetadata(eventType: AuditEventType, metadata: AuditMetadata): void {
  const requiredKeys = REQUIRED_AUDIT_METADATA_FIELDS[eventType] ?? [];
  for (const key of requiredKeys) {
    if (!(key in metadata)) {
      throw new Error(`audit_metadata_missing_${eventType}_${key}`);
    }
    const value = metadata[key];
    if (value === undefined || value === null) {
      throw new Error(`audit_metadata_missing_${eventType}_${key}`);
    }
  }
}

function createAuditMetadata(
  record: LifecycleTicketRecord,
  eventType: AuditEventType,
  actorRole: ActorRole,
  actorReference: string | undefined,
  from: TicketStatus,
  to: TicketStatus,
  rationale?: string,
): AuditMetadata {
  const message = latestTicketMessage(record);
  const draft = record.drafts.at(-1);
  const actorId = normalizeActorId(actorRole, actorReference);
  const actorContext = actorReference ?? actorRole;
  const baseContext: AuditMetadata = {
    ticket_id: record.ticket.ticketId,
    current_status: to,
    identity_confidence: record.ticket.identityConfidence,
    site_of_origin: record.ticket.siteId,
    actor_context: actorContext,
    timestamp: timestamp(),
  };

  if (eventType === AuditEventType.TICKET_CREATED) {
    return {
      ...baseContext,
      ticket_source: message.source,
      intake_channel: message.intakeChannel,
      submitter_identifier: record.submitter?.submitterId,
      raw_customer_message: message.rawMessage,
      submission_timestamp: message.receivedAt,
      priority: record.ticket.priority,
    };
  }

  if (eventType === AuditEventType.TICKET_TRIAGED) {
    return {
      ...baseContext,
      triage_timestamp: timestamp(),
      triage_owner: actorContext,
      triage_notes: rationale ?? "triage complete",
      classification: "classified_in_scope",
      urgency_reason: "default_priority_track",
      routing_target: record.ticket.siteId,
    };
  }

  if (eventType === AuditEventType.REPLY_DRAFTED) {
    if (!draft) {
      throw new Error(`audit_metadata_missing_draft_${record.ticket.ticketId}`);
    }
    return {
      ...baseContext,
      draft_reference: draft.draftId,
      draft_timestamp: draft.draftedAt,
      drafted_reply_text: draft.draftText,
      drafting_agent: actorId,
      draft_assumptions: draft.draftAssumptions,
      evidence_reference: draft.evidenceReference,
      quality_check_flag: draft.qualityCheckFlag,
    };
  }

  if (eventType === AuditEventType.APPROVAL_REQUESTED) {
    return {
      ...baseContext,
      approval_request_timestamp: timestamp(),
      draft_reference: draft?.draftId,
      draft_snapshot: draft?.draftText,
      gary_assigned: actorContext,
      approval_request_notes: rationale,
      risk_flags: "none",
    };
  }

  if (eventType === AuditEventType.APPROVAL_GRANTED) {
    return {
      ...baseContext,
      approval_timestamp: timestamp(),
      approver_id: actorId,
      approval_decision: "approved",
      approval_notes: rationale,
      approved_reply_snapshot: latestDraft(record)?.draftText,
      approval_context: actorContext,
    };
  }

  if (eventType === AuditEventType.APPROVAL_REJECTED) {
    return {
      ...baseContext,
      rejection_timestamp: timestamp(),
      approver_id: actorId,
      approval_decision: "rejected",
      rejection_reason: rationale,
      draft_reference: latestDraft(record)?.draftId,
    };
  }

  if (eventType === AuditEventType.REPLY_SENT) {
    return {
      ...baseContext,
      communication_channel: "in_memory_record",
      recipient_contact: record.submitter?.submitterEmail,
      sent_payload_reference: latestDraft(record)?.draftText,
      sent_confirmation: true,
      sent_by: actorContext,
    };
  }

  if (eventType === AuditEventType.TICKET_BLOCKED) {
    const reasonContext = record.ticket.blockedContext;
    return {
      ...baseContext,
      blocked_reason: record.ticket.currentBlockedReason ?? BlockedReason.OTHER,
      blocked_reason_detail: reasonContext?.reasonDetail ?? rationale,
      blocker_owner: reasonContext?.blockerOwner ?? actorRole,
      mitigation_plan: reasonContext?.mitigationPlan ?? "resolve_blocked_context",
      next_action: reasonContext?.nextAction ?? "resume_after_block_resolved",
      blocked_timestamp: timestamp(),
      blocking_evidence: reasonContext?.blockingEvidence,
      blocked_from: from,
    };
  }

  if (eventType === AuditEventType.TICKET_UNBLOCKED) {
    return {
      ...baseContext,
      previous_blocked_status: from === TicketStatus.BLOCKED ? record.previousBlockedStatus ?? record.ticket.status : from,
      unblocked_to: to,
      blocked_reason: record.ticket.currentBlockedReason ?? BlockedReason.OTHER,
      unblock_owner: actorContext,
      unblock_timestamp: timestamp(),
    };
  }

  if (eventType === AuditEventType.TICKET_CLOSED) {
    return {
      ...baseContext,
      closure_note: requireNonEmptyString(rationale ?? ""),
      closure_timestamp: timestamp(),
      closed_by: actorContext,
      final_status_summary: "work complete",
    };
  }

  if (eventType === AuditEventType.DRAFT_SNAPSHOT_STORED) {
    return {
      ...baseContext,
      draft_reference: draft?.draftId,
      draft_revision: draft?.draftVersion ?? record.drafts.length,
    };
  }

  return {
    ...baseContext,
    reason: "local-only-audit-event",
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
  metadataOverride?: AuditMetadata,
): void {
  const actorId = normalizeActorId(actorRole, actorReference);
  const metadata = metadataOverride
    ?? createAuditMetadata(
      record,
      eventType,
      actorRole,
      actorReference,
      stateBefore ?? record.ticket.status,
      stateAfter,
      rationale,
    );
  assertAuditMetadata(eventType, metadata);
  record.audits.push(
    createAuditEvent(
      record.ticket.ticketId,
      eventType,
      actorRole,
      actorId,
      stateBefore,
      stateAfter,
      AUDIT_SUMMARY[eventType] || `Ticket audit event ${eventType}`,
      rationale,
      metadata,
    ),
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

function assertHasApprovedApproval(record: LifecycleTicketRecord): TicketApproval {
  const latestApproval = record.approvals.at(-1);
  if (!latestApproval || latestApproval.decision !== "approved") {
    throw new Error(`approval_required_${record.ticket.ticketId}`);
  }
  return latestApproval;
}

function assertDraftExists(record: LifecycleTicketRecord): TicketDraftReply {
  const draft = record.drafts.at(-1);
  if (!draft) {
    throw new Error(`draft_missing_${record.ticket.ticketId}`);
  }
  return draft;
}

function assertRecipientEmail(record: LifecycleTicketRecord): string {
  const recipientEmail = record.submitter?.submitterEmail ?? "";
  if (!recipientEmail || recipientEmail.trim().length === 0) {
    throw new Error(`missing_customer_contact_for_send_${record.ticket.ticketId}`);
  }
  return recipientEmail;
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
  metadataOverride?: AuditMetadata,
): Ticket {
  const from = record.ticket.status;
  const fromStatus = from as TicketStatus;
  const nextStatus = to as TicketStatus;
  ensureTransitionAllowed(record, to, actorRole);

  emitEvent(
    record,
    determineAuditEvent(record.ticket.status, to, unblockTarget),
    actorRole,
    actorReference,
    from,
    to,
    rationale,
    metadataOverride,
  );

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
    communicationRecords: [],
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
  const latestDraft = assertDraftExists(record);
  createApprovalRecord(record, {
    approverRole: actorRole,
    decision: "pending",
    decisionNotes: requestNotes,
    approverReference: actorReference,
    approvedReplySnapshot: draftSnapshot ?? latestDraft.draftText,
  });
  const ticket = transitionTicketStatus(
    record,
    TicketStatus.AWAITING_GARY_APPROVAL,
    actorRole,
    actorReference,
    requestNotes,
  );
  return ticket;
}

export function createCustomerReplyDraft({
  ticketId,
  actorRole,
  actorReference,
  draftText,
  draftAssumptions,
  evidenceReference,
  qualityCheckFlag,
  rationale,
}: CreateCustomerReplyDraftParams): Ticket {
  const record = getRecord(ticketId);

  if (actorRole !== ActorRole.CS_AGENT) {
    throw new Error(`actor_not_authorized_${actorRole}_for_reply_drafted`);
  }

  if (record.ticket.status !== TicketStatus.TRIAGED && record.ticket.status !== TicketStatus.REPLY_DRAFTED) {
    throw new Error(`invalid_draft_state_${record.ticket.status}`);
  }

  const draft: TicketDraftReply = {
    draftId: nextDraftId(),
    ticketId,
    draftText,
    draftingAgentRole: ActorRole.CS_AGENT,
    draftedAt: timestamp(),
    draftVersion: record.drafts.length + 1,
    draftAssumptions,
    evidenceReference,
    qualityCheckFlag,
  };
  record.drafts.push(draft);

  if (record.ticket.status === TicketStatus.TRIAGED) {
    transitionTicketStatus(
      record,
      TicketStatus.REPLY_DRAFTED,
      actorRole,
      actorReference,
      rationale,
    );
  }

  if (record.drafts.length > 1) {
    emitEvent(
      record,
      AuditEventType.DRAFT_SNAPSHOT_STORED,
      actorRole,
      actorReference,
      TicketStatus.REPLY_DRAFTED,
      TicketStatus.REPLY_DRAFTED,
      rationale,
    );
  }

  return record.ticket;
}

export function markReplyReadyForApproval({
  ticketId,
  actorRole,
  actorReference,
  requestNotes,
}: TicketTransitionParams & {
  actorRole: ActorRole.CS_AGENT;
  requestNotes?: string;
}): Ticket {
  const record = getRecord(ticketId);
  if (record.ticket.status !== TicketStatus.REPLY_DRAFTED) {
    throw new Error(`invalid_reply_draft_state_${record.ticket.status}`);
  }

  const latestDraft = assertDraftExists(record);

  return requestApproval({
    ticketId,
    actorRole,
    actorReference,
    requestNotes,
    draftSnapshot: latestDraft.draftText,
  });
}

export function sendApprovedCustomerReply({
  ticketId,
  actorRole,
  actorReference,
  rationale,
  recipientEmail,
}: SendApprovedCustomerReplyParams): Ticket {
  const record = getRecord(ticketId);

  if (record.ticket.status !== TicketStatus.APPROVED_TO_SEND) {
    throw new Error(`invalid_send_state_${record.ticket.status}`);
  }

  if (actorRole !== ActorRole.CS_AGENT && actorRole !== ActorRole.SYSTEM) {
    throw new Error(`sender_role_required_${actorRole}`);
  }

  assertHasApprovedApproval(record);
  assertDraftExists(record);
  const targetRecipient = (recipientEmail ?? assertRecipientEmail(record)).trim();
  const draft = record.drafts.at(-1);
  const replySentMetadata = {
    communication_channel: "in_memory_record",
    recipient_contact: targetRecipient,
    sent_payload_reference: draft?.draftId,
    sent_confirmation: true,
    sent_by: actorReference ?? actorRole,
  };

  transitionTicketStatus(
    record,
    TicketStatus.SENT_TO_CUSTOMER,
    actorRole,
    actorReference,
    rationale,
    false,
    replySentMetadata,
  );

  record.communicationRecords.push({
    communicationId: nextCommunicationId(),
    ticketId,
    draftId: draft?.draftId,
    sentByRole: actorRole === ActorRole.SYSTEM ? ActorRole.SYSTEM : ActorRole.CS_AGENT,
    sentAt: timestamp(),
    recipientEmail: targetRecipient,
    messagePreview: draft ? draft.draftText.slice(0, 200) : "no draft text",
    communicationChannel: "in_memory_record",
    rationale,
  });

  return record.ticket;
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
  if (!rationale || rationale.trim().length === 0) {
    throw new Error(`closure_note_required_${ticketId}`);
  }
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

export function getCommunicationTrail(ticketId: string): TicketCommunicationRecord[] {
  const record = repository.get(ticketId);
  return record ? [...record.communicationRecords] : [];
}

export function listTickets(): Ticket[] {
  return [...repository.values()].map((record) => record.ticket);
}

export function clearLifecycleState(): void {
  repository.clear();
  nextTicketSeq = 1;
  nextMessageSeq = 1;
  nextDraftSeq = 1;
  nextCommunicationSeq = 1;
  nextAuditSeq = 1;
  nextApprovalSeq = 1;
}
