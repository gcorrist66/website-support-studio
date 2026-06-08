/* eslint-disable no-unused-vars */

/**
 * Phase 6B — Local operator auth contracts.
 *
 * These are local TypeScript types only. They define the shape of an authenticated
 * operator session and the capability vocabulary used by the local capability guards
 * in `authGuards.ts`. No Supabase Auth runtime, login UI, or route middleware is wired
 * here — see PHASE6_AUTH_BOUNDARY_PLAN.md for the staged implementation sequence.
 */

/** Internal operator (staff) roles. Customers are NOT operators and have no operator role. */
export enum OperatorRole {
  AGENCY_ADMIN = "agency_admin",
  CS_AGENT = "cs_agent",
  GARY_APPROVER = "gary_approver",
}

/**
 * A resolved, authenticated operator session.
 *
 * In a later phase this is built from a verified Supabase Auth session plus the trusted
 * server-side `operators` row — never from client-supplied fields. `role`, `agencyId`,
 * and the optional tenant scopes are authoritative tenant/authorization context.
 */
export interface OperatorSession {
  operatorId: string;
  email: string;
  displayName: string;
  role: OperatorRole;
  agencyId: string;
  /** Optional client scope. Empty/undefined means all clients within the agency. */
  clientIds?: string[];
  /** Optional site scope. Empty/undefined means all sites within scope. */
  siteIds?: string[];
  /** ISO-8601 timestamp; a session at or past this instant is treated as unauthenticated. */
  expiresAt: string;
}

/** A tenant reference used for scope checks (view/search within an operator's scope). */
export interface TenantScopeRef {
  agencyId: string;
  clientId?: string;
  siteId?: string;
}

/** The set of operator capabilities gated by the local guards. */
export type OperatorCapability =
  | "create_ticket"
  | "triage_ticket"
  | "draft_reply"
  | "request_approval"
  | "approve_reply"
  | "reject_reply"
  | "send_reply"
  | "close_ticket"
  | "view_ticket"
  | "search_tickets";
