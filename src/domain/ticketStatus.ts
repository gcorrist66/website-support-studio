/* eslint-disable no-unused-vars */

export enum TicketStatus {
  RECEIVED = "received",
  TRIAGED = "triaged",
  REPLY_DRAFTED = "reply_drafted",
  AWAITING_GARY_APPROVAL = "awaiting_gary_approval",
  APPROVED_TO_SEND = "approved_to_send",
  SENT_TO_CUSTOMER = "sent_to_customer",
  CLOSED = "closed",
  BLOCKED = "blocked",
}

export enum TicketPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum IdentityConfidence {
  KNOWN = "known",
  CLAIMED = "claimed",
  UNKNOWN = "unknown",
}

export enum BlockedReason {
  AWAITING_CUSTOMER = "awaiting_customer",
  AWAITING_ACCESS = "awaiting_access",
  AWAITING_VENDOR = "awaiting_vendor",
  DUPLICATE_TICKET = "duplicate_ticket",
  MISROUTED = "misrouted",
  INTERNAL_REVIEW = "internal_review",
  OTHER = "other",
}

export enum ActorRole {
  AGENCY_ADMIN = "agency_admin",
  CLIENT_ADMIN = "client_admin",
  SITE_USER = "site_user",
  CS_AGENT = "cs_agent",
  GARY_APPROVER = "gary_approver",
  SYSTEM = "system",
}

export enum AuditEventType {
  REQUEST_RECEIVED = "request_received",
  TICKET_CREATED = "ticket_created",
  INITIAL_CLASSIFICATION_ATTEMPT = "initial_classification_attempt",
  TRIAGE_COMPLETED = "triage_completed",
  CLASSIFICATION_RECORDED = "classification_recorded",
  ROUTING_DECISION_RECORDED = "routing_decision_recorded",
  REPLY_DRAFTED = "reply_drafted",
  DRAFT_SNAPSHOT_STORED = "draft_snapshot_stored",
  APPROVAL_REQUESTED = "approval_requested",
  APPROVAL_GATE_ENTERED = "approval_gate_entered",
  APPROVAL_WAITING_TIMEPOINT = "approval_waiting_timepoint",
  APPROVAL_GRANTED = "approval_granted",
  APPROVAL_REJECTED = "approval_rejected",
  APPROVED_REPLY_FROZEN = "approved_reply_frozen",
  APPROVAL_CONTEXT_RECORDED = "approval_context_recorded",
  RESPONSE_SENT = "response_sent",
  CUSTOMER_COMMUNICATION_CONFIRMATION = "customer_communication_confirmation",
  SENT_MESSAGE_HASH_REFERENCE = "sent_message_hash_or_reference",
  TICKET_BLOCKED = "ticket_blocked",
  TICKET_UNBLOCKED = "ticket_unblocked",
  TICKET_CLOSED = "ticket_closed",
  CLOSURE_NOTE_RECORDED = "closure_note_recorded",
  FINAL_STATE_HASH_SNAPSHOT = "final_state_hash_snapshot",
  BLOCKED_ENTERED = "blocked_entered",
  BLOCKER_RECORDED = "blocker_recorded",
  ACTION_REQUESTED = "action_requested",
}

export const BLOCKED_REASON_SET = new Set<string>(Object.values(BlockedReason));
