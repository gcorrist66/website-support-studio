import { ActorRole, IdentityConfidence, TicketPriority, TicketStatus } from "../domain/ticketStatus";

export type AuditEventType =
  | "ticket_created"
  | "ticket_triaged"
  | "reply_drafted"
  | "approval_requested"
  | "approval_granted"
  | "approval_rejected"
  | "reply_sent"
  | "ticket_blocked"
  | "ticket_unblocked"
  | "ticket_closed";

export interface TenantContext {
  agencyId: string;
  clientId: string;
  siteId: string;
}

export interface ActorContext {
  actorRole: ActorRole;
  actorReference: string;
  actorId?: string;
}

export interface BaseWorkflowRequest {
  tenantContext: TenantContext;
  actorContext: ActorContext;
  requestId?: string;
  requestedAt?: string;
}

export interface BaseWorkflowResponse {
  ticketId: string;
  status: TicketStatus;
  siteId: string;
  tenantContext: TenantContext;
  actorContext: ActorContext;
  summary: string;
  occurredAt: string;
}

export interface AuditEnvelope {
  eventType: AuditEventType;
  summary: string;
  metadata: Record<string, unknown>;
}

export interface CreateTicketRequest extends BaseWorkflowRequest {
  ticket: {
    rawMessage: string;
    intakeChannel: string;
    source: string;
    priority?: TicketPriority;
    identityConfidence?: IdentityConfidence;
    actorReference?: string;
    submitter?: {
      submitterName?: string;
      submitterEmail?: string;
    };
    title?: string;
  };
}

export interface CreateTicketResponse extends BaseWorkflowResponse {
  ticketNumber: string;
  createdAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface TriageTicketRequest extends BaseWorkflowRequest {
  ticketId: string;
  rationale?: string;
}

export interface TriageTicketResponse extends BaseWorkflowResponse {
  triagedAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface DraftReplyRequest extends BaseWorkflowRequest {
  ticketId: string;
  draftText: string;
  draftAssumptions?: string;
  evidenceReference?: string;
  qualityCheckFlag?: boolean;
}

export interface DraftReplyResponse extends BaseWorkflowResponse {
  draftId: string;
  draftVersion: number;
  draftedAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface RequestApprovalRequest extends BaseWorkflowRequest {
  ticketId: string;
  requestNotes?: string;
}

export interface RequestApprovalResponse extends BaseWorkflowResponse {
  approvalId: string;
  approvalRequestedAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface ApproveReplyRequest extends BaseWorkflowRequest {
  ticketId: string;
  approvalId: string;
  approvalNotes?: string;
}

export interface ApproveReplyResponse extends BaseWorkflowResponse {
  approvalId: string;
  approvedAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface RejectReplyRequest extends BaseWorkflowRequest {
  ticketId: string;
  approvalId: string;
  rejectionNotes: string;
}

export interface RejectReplyResponse extends BaseWorkflowResponse {
  approvalId: string;
  rejectedAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface SendApprovedReplyRequest extends BaseWorkflowRequest {
  ticketId: string;
  draftReplyId: string;
  recipientEmail: string;
  approvalContext: {
    approvalId: string;
    approvedByActorReference: string;
    approvedAt: string;
  };
  rationale?: string;
  communicationContext: {
    channel: "local_only";
  };
}

export interface SendApprovedReplyResponse extends BaseWorkflowResponse {
  communicationId: string;
  sentAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface CloseTicketRequest extends BaseWorkflowRequest {
  ticketId: string;
  closureNote: string;
}

export interface CloseTicketResponse extends BaseWorkflowResponse {
  closedAt: string;
  auditEvents?: AuditEnvelope[];
}

export interface BlockTicketRequest extends BaseWorkflowRequest {
  ticketId: string;
  blockedReason:
    | "awaiting_customer"
    | "awaiting_access"
    | "awaiting_vendor"
    | "duplicate_ticket"
    | "misrouted"
    | "internal_review"
    | "other";
  reasonDetail: string;
  blockerOwner: ActorRole;
  mitigationPlan?: string;
  nextAction?: string;
}

export interface BlockTicketResponse extends BaseWorkflowResponse {
  blockedAt: string;
  blockedReason: string;
  auditEvents?: AuditEnvelope[];
}

export interface UnblockTicketRequest extends BaseWorkflowRequest {
  ticketId: string;
  targetStatus:
    | "received"
    | "triaged"
    | "reply_drafted"
    | "awaiting_gary_approval"
    | "approved_to_send"
    | "sent_to_customer"
    | "closed"
    | "blocked";
  unblockNotes?: string;
}

export interface UnblockTicketResponse extends BaseWorkflowResponse {
  unblockedAt: string;
  previousBlockedStatus: TicketStatus;
  auditEvents?: AuditEnvelope[];
}
