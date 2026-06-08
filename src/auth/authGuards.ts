/**
 * Phase 6B — Local operator capability guards.
 *
 * Pure, dependency-free TypeScript guards. They decide whether a given `OperatorSession`
 * may perform an operator action, and are used to drive UI affordances (and, later, route
 * checks). They are NOT a replacement for the domain/state guards in
 * `src/domain` + `src/contracts`, which remain the authoritative enforcement layer.
 *
 * No Supabase Auth runtime, no `createClient`, no service-role key, no route files.
 */

import { OperatorRole, type OperatorCapability, type OperatorSession, type TenantScopeRef } from "./authTypes";

const KNOWN_OPERATOR_ROLES: ReadonlySet<string> = new Set<string>([
  OperatorRole.AGENCY_ADMIN,
  OperatorRole.CS_AGENT,
  OperatorRole.GARY_APPROVER,
]);

/**
 * Role → capability matrix (separation of duties).
 * - agency_admin: full operator capability within scope.
 * - cs_agent: create/triage/draft/request/send/close + view/search; never approve/reject.
 * - gary_approver: approve/reject + close + view/search; not a drafter/sender.
 * This is intentionally no weaker than the domain rules (approve/reject remain
 * approver-only; send remains a cs/admin action; the domain still enforces state + approval).
 */
const ROLE_CAPABILITIES: Readonly<Record<OperatorRole, ReadonlySet<OperatorCapability>>> = {
  [OperatorRole.AGENCY_ADMIN]: new Set<OperatorCapability>([
    "create_ticket",
    "triage_ticket",
    "draft_reply",
    "request_approval",
    "approve_reply",
    "reject_reply",
    "send_reply",
    "close_ticket",
    "view_ticket",
    "search_tickets",
  ]),
  [OperatorRole.CS_AGENT]: new Set<OperatorCapability>([
    "create_ticket",
    "triage_ticket",
    "draft_reply",
    "request_approval",
    "send_reply",
    "close_ticket",
    "view_ticket",
    "search_tickets",
  ]),
  [OperatorRole.GARY_APPROVER]: new Set<OperatorCapability>([
    "approve_reply",
    "reject_reply",
    "close_ticket",
    "view_ticket",
    "search_tickets",
  ]),
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nowOrProvided(nowIso?: string): number {
  const value = nowIso ?? new Date().toISOString();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

/**
 * True only for a structurally valid, non-expired operator session whose role is a known
 * operator role. Any unknown role (e.g. a customer "site_user"), missing field, malformed
 * value, or expired session is treated as unauthenticated.
 */
export function isAuthenticatedOperator(
  session: OperatorSession | null | undefined,
  nowIso?: string,
): session is OperatorSession {
  if (!session || typeof session !== "object") {
    return false;
  }
  if (!isNonEmptyString(session.operatorId)) {
    return false;
  }
  if (!isNonEmptyString(session.email)) {
    return false;
  }
  if (!isNonEmptyString(session.displayName)) {
    return false;
  }
  if (!isNonEmptyString(session.agencyId)) {
    return false;
  }
  if (!isNonEmptyString(session.role) || !KNOWN_OPERATOR_ROLES.has(session.role)) {
    return false;
  }
  if (!isNonEmptyString(session.expiresAt)) {
    return false;
  }
  const expiresAt = Date.parse(session.expiresAt);
  const now = nowOrProvided(nowIso);
  if (Number.isNaN(expiresAt) || Number.isNaN(now)) {
    return false;
  }
  return expiresAt > now;
}

function hasCapability(
  session: OperatorSession | null | undefined,
  capability: OperatorCapability,
  nowIso?: string,
): boolean {
  if (!isAuthenticatedOperator(session, nowIso)) {
    return false;
  }
  return ROLE_CAPABILITIES[session.role].has(capability);
}

/**
 * Tenant scope check: the operator's agency must match, and if the session is client/site
 * scoped, the referenced client/site must be within that scope.
 */
export function operatorCanAccessTenant(
  session: OperatorSession | null | undefined,
  tenant: TenantScopeRef,
  nowIso?: string,
): boolean {
  if (!isAuthenticatedOperator(session, nowIso)) {
    return false;
  }
  if (!tenant || session.agencyId !== tenant.agencyId) {
    return false;
  }
  if (session.clientIds && session.clientIds.length > 0 && tenant.clientId) {
    if (!session.clientIds.includes(tenant.clientId)) {
      return false;
    }
  }
  if (session.siteIds && session.siteIds.length > 0 && tenant.siteId) {
    if (!session.siteIds.includes(tenant.siteId)) {
      return false;
    }
  }
  return true;
}

export function canCreateTicket(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "create_ticket", nowIso);
}

export function canTriageTicket(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "triage_ticket", nowIso);
}

export function canDraftReply(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "draft_reply", nowIso);
}

export function canRequestApproval(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "request_approval", nowIso);
}

export function canApproveReply(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "approve_reply", nowIso);
}

export function canRejectReply(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "reject_reply", nowIso);
}

export function canSendReply(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "send_reply", nowIso);
}

export function canCloseTicket(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "close_ticket", nowIso);
}

/**
 * View capability. When a tenant reference is supplied, also enforces tenant scope so an
 * operator cannot view tickets outside their agency/client/site scope.
 */
export function canViewTicket(
  session: OperatorSession | null | undefined,
  tenant?: TenantScopeRef,
  nowIso?: string,
): boolean {
  if (!hasCapability(session, "view_ticket", nowIso)) {
    return false;
  }
  if (tenant) {
    return operatorCanAccessTenant(session, tenant, nowIso);
  }
  return true;
}

export function canSearchTickets(session: OperatorSession | null | undefined, nowIso?: string): boolean {
  return hasCapability(session, "search_tickets", nowIso);
}
