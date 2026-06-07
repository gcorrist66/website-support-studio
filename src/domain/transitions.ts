import { TicketStatus, BlockedReason, ActorRole } from "./ticketStatus";
import type { Ticket, TicketSubmitter } from "./types";

export const PHASE1_TRANSITION_MAP = {
  [TicketStatus.RECEIVED]: [TicketStatus.TRIAGED, TicketStatus.BLOCKED],
  [TicketStatus.TRIAGED]: [TicketStatus.REPLY_DRAFTED, TicketStatus.BLOCKED],
  [TicketStatus.REPLY_DRAFTED]: [TicketStatus.AWAITING_GARY_APPROVAL, TicketStatus.BLOCKED],
  [TicketStatus.AWAITING_GARY_APPROVAL]: [TicketStatus.APPROVED_TO_SEND, TicketStatus.BLOCKED],
  [TicketStatus.APPROVED_TO_SEND]: [TicketStatus.SENT_TO_CUSTOMER],
  [TicketStatus.SENT_TO_CUSTOMER]: [TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.BLOCKED]: [
    TicketStatus.TRIAGED,
    TicketStatus.REPLY_DRAFTED,
    TicketStatus.AWAITING_GARY_APPROVAL,
    TicketStatus.BLOCKED,
  ],
} as const;

const BLOCKED_EXIT_MAP = {
  [TicketStatus.RECEIVED]: [TicketStatus.TRIAGED],
  [TicketStatus.TRIAGED]: [TicketStatus.REPLY_DRAFTED],
  [TicketStatus.REPLY_DRAFTED]: [TicketStatus.AWAITING_GARY_APPROVAL],
  [TicketStatus.AWAITING_GARY_APPROVAL]: [TicketStatus.REPLY_DRAFTED],
} as const;

export interface BlockedTransitionContext {
  fromBlockedStatus?: TicketStatus;
  allowRewriteFromAwaitingApproval?: boolean;
}

export interface TicketLikeForSend {
  status: TicketStatus;
  submitter?: TicketSubmitter | null;
  submitterEmail?: string;
}

export interface TicketLikeForSendCandidate {
  status: Ticket["status"];
  submitter?: TicketSubmitter | null;
  submitterEmail?: string;
}

export function getAllowedNextStatuses(
  status: TicketStatus,
  context: BlockedTransitionContext = {},
): readonly TicketStatus[] {
  if (status === TicketStatus.BLOCKED) {
    const from = context.fromBlockedStatus;
    if (from && from in BLOCKED_EXIT_MAP) {
      const allowedFromBlocked = BLOCKED_EXIT_MAP[from as keyof typeof BLOCKED_EXIT_MAP];
      return [...allowedFromBlocked, TicketStatus.BLOCKED];
    }

    return [
      TicketStatus.TRIAGED,
      TicketStatus.REPLY_DRAFTED,
      TicketStatus.AWAITING_GARY_APPROVAL,
      TicketStatus.BLOCKED,
    ];
  }

  return PHASE1_TRANSITION_MAP[status];
}

export function isTerminalStatus(status: TicketStatus): boolean {
  return status === TicketStatus.CLOSED;
}

export function canTransition(
  from: TicketStatus,
  to: TicketStatus,
  context: BlockedTransitionContext = {},
): boolean {
  if (!Object.prototype.hasOwnProperty.call(PHASE1_TRANSITION_MAP, from)) {
    return false;
  }

  const allowedStatuses = new Set(getAllowedNextStatuses(from, context));
  return allowedStatuses.has(to);
}

export function requiresApprovalBeforeSend(statusOrTransition:
  | TicketStatus
  | { from: TicketStatus; to: TicketStatus },
): boolean {
  if (typeof statusOrTransition === "string") {
    return statusOrTransition === TicketStatus.SENT_TO_CUSTOMER;
  }

  return statusOrTransition.to === TicketStatus.SENT_TO_CUSTOMER;
}

export function requiresCustomerEmailForSend(
  ticket: TicketLikeForSend | TicketLikeForSendCandidate,
): boolean {
  const contactEmail = ticket.submitter?.submitterEmail ?? ticket.submitterEmail ?? "";
  const isBlockedFromContactRequirement =
    ticket.status === TicketStatus.SENT_TO_CUSTOMER ||
    ticket.status === TicketStatus.APPROVED_TO_SEND;

  if (!isBlockedFromContactRequirement) {
    return false;
  }

  return contactEmail.trim().length === 0;
}

export function requiresCustomerEmailForTransition(
  from: TicketStatus,
  to: TicketStatus,
  blockedReason?: BlockedReason,
): boolean {
  if (to !== TicketStatus.SENT_TO_CUSTOMER) {
    return false;
  }

  return from !== TicketStatus.APPROVED_TO_SEND || blockedReason === BlockedReason.AWAITING_CUSTOMER;
}

export function validateTransitionActor(
  from: TicketStatus,
  to: TicketStatus,
  actorRole: ActorRole,
): boolean {
  if (!canTransition(from, to)) {
    return false;
  }

  if (
    from === TicketStatus.RECEIVED &&
    to === TicketStatus.BLOCKED
  ) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.SYSTEM;
  }

  if (from === TicketStatus.TRIAGED && to === TicketStatus.BLOCKED) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.AGENCY_ADMIN;
  }

  if (from === TicketStatus.REPLY_DRAFTED && to === TicketStatus.BLOCKED) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.AGENCY_ADMIN;
  }

  if (from === TicketStatus.AWAITING_GARY_APPROVAL && to === TicketStatus.BLOCKED) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.GARY_APPROVER;
  }

  if (from === TicketStatus.AWAITING_GARY_APPROVAL && to === TicketStatus.APPROVED_TO_SEND) {
    return actorRole === ActorRole.GARY_APPROVER || actorRole === ActorRole.AGENCY_ADMIN;
  }

  if (from === TicketStatus.TRIAGED && to === TicketStatus.REPLY_DRAFTED) {
    return actorRole === ActorRole.CS_AGENT;
  }

  if (from === TicketStatus.REPLY_DRAFTED && to === TicketStatus.AWAITING_GARY_APPROVAL) {
    return actorRole === ActorRole.CS_AGENT;
  }

  if (from === TicketStatus.APPROVED_TO_SEND && to === TicketStatus.SENT_TO_CUSTOMER) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.SYSTEM;
  }

  if (from === TicketStatus.SENT_TO_CUSTOMER && to === TicketStatus.CLOSED) {
    return (
      actorRole === ActorRole.CS_AGENT ||
      actorRole === ActorRole.AGENCY_ADMIN ||
      actorRole === ActorRole.GARY_APPROVER
    );
  }

  if (from === TicketStatus.BLOCKED && to === TicketStatus.TRIAGED) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.SYSTEM;
  }

  if (from === TicketStatus.BLOCKED && to === TicketStatus.REPLY_DRAFTED) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.SYSTEM;
  }

  if (from === TicketStatus.BLOCKED && to === TicketStatus.AWAITING_GARY_APPROVAL) {
    return actorRole === ActorRole.CS_AGENT || actorRole === ActorRole.SYSTEM;
  }

  return actorRole === ActorRole.SYSTEM || actorRole === ActorRole.CS_AGENT;
}

export function validateBlockedExitContext(
  from: TicketStatus,
  blockedReason: BlockedReason,
): boolean {
  const isInvalidReason = !Object.values(BlockedReason).includes(blockedReason);

  if (isInvalidReason) {
    return false;
  }

  if (
    from === TicketStatus.RECEIVED ||
    from === TicketStatus.TRIAGED ||
    from === TicketStatus.REPLY_DRAFTED ||
    from === TicketStatus.AWAITING_GARY_APPROVAL
  ) {
    return true;
  }

  return false;
}
