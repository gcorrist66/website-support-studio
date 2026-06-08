/**
 * Phase 6I — Operator session resolution (internal, local-only).
 *
 * Turns a trusted operator row (already fetched upstream — e.g. read-only from the dev DB) into a
 * usable `OperatorSession`. This is the "Operator Identity → Operator Session" step. It is PURE and
 * dependency-free: NO Supabase client, NO Supabase Auth runtime, NO login UI, NO route middleware,
 * NO RLS. It does not authenticate anyone; it only resolves and validates an already-trusted row.
 *
 * Status policy:
 *   - active    → produces a usable session.
 *   - invited   → optionally surfaced (pendingInvite) but NOT treated as fully active (no session).
 *   - suspended → rejected.
 *   - archived  → rejected.
 * Agency context and role are required (enforced by validateOperatorRow / mapOperatorRowToSession).
 */

import { isAuthenticatedOperator } from "./authGuards";
import type { OperatorSession } from "./authTypes";
import { mapOperatorRowToSession, validateOperatorRow } from "../persistence/operatorMappers";
import { normalizeOperatorEmail, type OperatorRow, type OperatorStatus } from "../persistence/operatorTypes";

export interface ResolveOperatorOptions {
  /** ISO timestamp treated as "now" for expiry; defaults to the current time. */
  nowIso?: string;
  /** Session lifetime in ms from now; defaults to the mapper default (1 hour). */
  sessionTtlMs?: number;
  /** Explicit ISO expiry that overrides the computed value. */
  expiresAtIso?: string;
  /** When true, an invited operator is acknowledged (pendingInvite) but still produces no session. */
  allowInvited?: boolean;
}

export interface OperatorSessionResolution {
  /** True only when a usable (active) session was produced. */
  ok: boolean;
  session: OperatorSession | null;
  /** Machine-readable reason when not ok. */
  reason: string | null;
  /** The row's status, when determinable. */
  operatorStatus: OperatorStatus | null;
  /** True when the row is an invited operator (surfaced distinctly from hard rejections). */
  pendingInvite: boolean;
}

/**
 * Build a session from an operator row. Returns a usable session only for ACTIVE operators
 * (suspended / archived / invited / invalid rows return null). Thin wrapper over the mapper.
 */
export function createOperatorSession(row: OperatorRow, options: ResolveOperatorOptions = {}): OperatorSession | null {
  return mapOperatorRowToSession(row, {
    nowIso: options.nowIso,
    sessionTtlMs: options.sessionTtlMs,
    expiresAtIso: options.expiresAtIso,
  });
}

/**
 * Resolve a detailed session outcome from an operator row, applying the status policy and
 * surfacing the reason / pending-invite state for the UI.
 */
export function resolveOperatorSession(row: OperatorRow, options: ResolveOperatorOptions = {}): OperatorSessionResolution {
  const validation = validateOperatorRow(row);
  if (!validation.ok) {
    return {
      ok: false,
      session: null,
      reason: `invalid_operator_row: ${validation.errors.join(", ")}`,
      operatorStatus: null,
      pendingInvite: false,
    };
  }

  const status = row.status;

  if (status === "active") {
    const session = createOperatorSession(row, options);
    if (!session) {
      return { ok: false, session: null, reason: "session_mapping_failed", operatorStatus: status, pendingInvite: false };
    }
    return { ok: true, session, reason: null, operatorStatus: status, pendingInvite: false };
  }

  if (status === "invited") {
    // Optionally supported, but never fully active: no usable session is produced.
    return {
      ok: false,
      session: null,
      reason: options.allowInvited ? "operator_invited_pending" : "operator_not_active_invited",
      operatorStatus: status,
      pendingInvite: true,
    };
  }

  // suspended | archived
  return {
    ok: false,
    session: null,
    reason: `operator_not_active_${status}`,
    operatorStatus: status,
    pendingInvite: false,
  };
}

/** Find an operator row by email (case-insensitive, normalized). */
export function resolveOperatorByEmail(rows: readonly OperatorRow[], email: string): OperatorRow | undefined {
  if (typeof email !== "string" || email.trim().length === 0) {
    return undefined;
  }
  const target = normalizeOperatorEmail(email);
  return rows.find((row) => typeof row?.email === "string" && normalizeOperatorEmail(row.email) === target);
}

/** Find an operator row by linked Supabase Auth user id (only matches non-null ids). */
export function resolveOperatorByAuthUserId(rows: readonly OperatorRow[], authUserId: string): OperatorRow | undefined {
  if (typeof authUserId !== "string" || authUserId.trim().length === 0) {
    return undefined;
  }
  return rows.find((row) => row?.auth_user_id != null && row.auth_user_id === authUserId);
}

export interface OperatorSessionValidation {
  ok: boolean;
  errors: string[];
}

/** Validate a built session: authenticated (structurally valid, known role, non-expired) operator. */
export function validateOperatorSession(session: OperatorSession | null | undefined, nowIso?: string): OperatorSessionValidation {
  const errors: string[] = [];
  if (!session) {
    return { ok: false, errors: ["session is null"] };
  }
  if (!session.agencyId || session.agencyId.trim().length === 0) {
    errors.push("session is missing agency context");
  }
  if (!session.role) {
    errors.push("session is missing role");
  }
  if (!isAuthenticatedOperator(session, nowIso)) {
    errors.push("session is not an authenticated operator (invalid shape, unknown role, or expired)");
  }
  return { ok: errors.length === 0, errors };
}
