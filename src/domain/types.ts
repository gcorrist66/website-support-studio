import {
  ActorRole,
  AuditEventType,
  BlockedReason,
  IdentityConfidence,
  TicketPriority,
  TicketStatus,
} from "./ticketStatus";

export interface TimestampedEntity {
  createdAt: string;
  updatedAt: string;
}

export interface Agency extends TimestampedEntity {
  agencyId: string;
  agencyName: string;
  policyProfile?: string;
}

export interface Client extends TimestampedEntity {
  clientId: string;
  agencyId: Agency["agencyId"];
  clientName: string;
}

export interface Site extends TimestampedEntity {
  siteId: string;
  clientId: Client["clientId"];
  siteName: string;
  canonicalDomain?: string;
}

export interface TicketSubmitter {
  submitterId: string;
  siteId: Site["siteId"];
  submitterName?: string;
  submitterEmail?: string;
  submitterReference?: string;
  identityConfidence: IdentityConfidence;
}

export type TicketDecision = "pending" | "approved" | "rejected";

export interface TicketMessage {
  messageId: string;
  ticketId: string;
  submittedBySubmitterId?: TicketSubmitter["submitterId"];
  rawMessage: string;
  receivedAt: string;
  intakeChannel: string;
  source: string;
}

export interface TicketDraftReply {
  draftId: string;
  ticketId: string;
  draftText: string;
  draftingAgentRole: ActorRole.CS_AGENT;
  draftedAt: string;
  draftVersion: number;
  draftAssumptions?: string;
  evidenceReference?: string;
  qualityCheckFlag?: boolean;
}

export interface TicketCommunicationRecord {
  communicationId: string;
  ticketId: string;
  draftId?: TicketDraftReply["draftId"];
  sentByRole: ActorRole.CS_AGENT | ActorRole.SYSTEM;
  sentAt: string;
  recipientEmail: string;
  messagePreview: string;
  communicationChannel: "in_memory_record";
  rationale?: string;
}

export interface TicketApproval {
  approvalId: string;
  ticketId: string;
  approverRole:
    | ActorRole.GARY_APPROVER
    | ActorRole.AGENCY_ADMIN
    | ActorRole.CS_AGENT;
  decision: TicketDecision;
  decisionNotes?: string;
  decisionAt: string;
  approverReference?: string;
  approvedReplySnapshot?: string;
}

export interface TicketAuditEvent {
  id: string;
  eventId: string;
  ticketId: string;
  actorId: string;
  eventType: AuditEventType;
  actorRole: ActorRole;
  summary: string;
  metadata: Record<string, unknown>;
  actorReference?: string;
  occurredAt: string;
  stateBefore?: TicketStatus;
  stateAfter?: TicketStatus;
  rationale?: string;
}

export interface TicketBlockedContext {
  reason: BlockedReason;
  reasonDetail?: string;
  blockerOwner: ActorRole;
  mitigationPlan?: string;
  blockingEvidence?: string;
  nextAction?: string;
}

export interface Ticket extends TimestampedEntity {
  ticketId: string;
  siteId: Site["siteId"];
  submitterId?: TicketSubmitter["submitterId"];
  status: TicketStatus;
  priority: TicketPriority;
  identityConfidence: IdentityConfidence;
  currentActorRole: ActorRole;
  currentBlockedReason?: BlockedReason;
  blockedContext?: TicketBlockedContext;
}
