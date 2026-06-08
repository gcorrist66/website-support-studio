/**
 * Phase 6J — Operator UI capability mapping.
 *
 * Thin `canSee*` wrappers over the existing auth guards (src/auth/authGuards.ts). They translate an
 * `OperatorSession` into UI-visibility booleans so the operator workspace can show/hide actions by
 * role. They do NOT replace the domain/state guards (which remain authoritative) and they add NO
 * login UI, route middleware, or runtime auth — they only read a session that was already resolved.
 */

import {
  canApproveReply,
  canCloseTicket,
  canCreateTicket,
  canDraftReply,
  canRejectReply,
  canRequestApproval,
  canSearchTickets,
  canSendReply,
  canTriageTicket,
  isAuthenticatedOperator,
} from "./authGuards";
import { OperatorRole, type OperatorSession } from "./authTypes";

type Session = OperatorSession | null | undefined;

export function canSeeCreateTicket(session: Session, nowIso?: string): boolean {
  return canCreateTicket(session, nowIso);
}

export function canSeeTriage(session: Session, nowIso?: string): boolean {
  return canTriageTicket(session, nowIso);
}

export function canSeeDraftReply(session: Session, nowIso?: string): boolean {
  return canDraftReply(session, nowIso);
}

export function canSeeRequestApproval(session: Session, nowIso?: string): boolean {
  return canRequestApproval(session, nowIso);
}

export function canSeeApproveReply(session: Session, nowIso?: string): boolean {
  return canApproveReply(session, nowIso);
}

export function canSeeRejectReply(session: Session, nowIso?: string): boolean {
  return canRejectReply(session, nowIso);
}

export function canSeeSendReply(session: Session, nowIso?: string): boolean {
  return canSendReply(session, nowIso);
}

export function canSeeCloseTicket(session: Session, nowIso?: string): boolean {
  return canCloseTicket(session, nowIso);
}

export function canSeeSearch(session: Session, nowIso?: string): boolean {
  return canSearchTickets(session, nowIso);
}

/** Operator administration surface — agency_admin only. */
export function canSeeOperatorAdmin(session: Session, nowIso?: string): boolean {
  return isAuthenticatedOperator(session, nowIso) && session.role === OperatorRole.AGENCY_ADMIN;
}

export interface OperatorCapabilityFlags {
  canSeeCreateTicket: boolean;
  canSeeTriage: boolean;
  canSeeDraftReply: boolean;
  canSeeRequestApproval: boolean;
  canSeeApproveReply: boolean;
  canSeeRejectReply: boolean;
  canSeeSendReply: boolean;
  canSeeCloseTicket: boolean;
  canSeeSearch: boolean;
  canSeeOperatorAdmin: boolean;
}

/** Compute all capability flags for a session in one pass (handy for UI). */
export function getOperatorCapabilityFlags(session: Session, nowIso?: string): OperatorCapabilityFlags {
  return {
    canSeeCreateTicket: canSeeCreateTicket(session, nowIso),
    canSeeTriage: canSeeTriage(session, nowIso),
    canSeeDraftReply: canSeeDraftReply(session, nowIso),
    canSeeRequestApproval: canSeeRequestApproval(session, nowIso),
    canSeeApproveReply: canSeeApproveReply(session, nowIso),
    canSeeRejectReply: canSeeRejectReply(session, nowIso),
    canSeeSendReply: canSeeSendReply(session, nowIso),
    canSeeCloseTicket: canSeeCloseTicket(session, nowIso),
    canSeeSearch: canSeeSearch(session, nowIso),
    canSeeOperatorAdmin: canSeeOperatorAdmin(session, nowIso),
  };
}
