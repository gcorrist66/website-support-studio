/**
 * Phase 6D — Operator persistence mappers + validation.
 *
 * Pure shape-mapping and validation between the persisted `operators` row/insert shapes and
 * the local auth `OperatorSession`. No Supabase client, no Supabase Auth runtime, no login
 * session runtime, no service-role usage. These helpers do NOT authenticate anyone; they only
 * translate already-trusted data and validate field shapes.
 */

import { OperatorRole, type OperatorSession } from "../auth/authTypes";
import {
  isOperatorRole,
  isOperatorStatus,
  normalizeOperatorEmail,
  type OperatorInsert,
  type OperatorRow,
  type OperatorValidationResult,
} from "./operatorTypes";

/** Default mapped-session lifetime (1 hour) when an explicit expiry is not supplied. */
const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000;

interface MapRowToSessionOptions {
  /** ISO timestamp treated as "now" for computing expiry; defaults to the current time. */
  nowIso?: string;
  /** Session lifetime in ms from now; defaults to one hour. */
  sessionTtlMs?: number;
  /** Explicit ISO expiry that overrides the computed value. */
  expiresAtIso?: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArrayOrNullish(value: unknown): boolean {
  return value === null || value === undefined || (Array.isArray(value) && value.every((v) => typeof v === "string"));
}

/** Validate a database-shaped operator row. Returns ok=false with errors on any problem. */
export function validateOperatorRow(row: unknown): OperatorValidationResult {
  const errors: string[] = [];
  if (!row || typeof row !== "object") {
    return { ok: false, errors: ["operator row is not an object"] };
  }
  const candidate = row as Partial<OperatorRow>;

  if (!isNonEmptyString(candidate.id)) {
    errors.push("id is required");
  }
  if (!isNonEmptyString(candidate.agency_id)) {
    errors.push("agency_id is required (operator must belong to an agency)");
  }
  if (!isNonEmptyString(candidate.email)) {
    errors.push("email is required");
  } else if (candidate.email !== normalizeOperatorEmail(candidate.email)) {
    errors.push("email must be normalized (trimmed + lowercase)");
  }
  if (!isNonEmptyString(candidate.display_name)) {
    errors.push("display_name is required");
  }
  if (!isOperatorRole(candidate.role)) {
    errors.push(`role must be one of agency_admin|cs_agent|gary_approver (got ${String(candidate.role)})`);
  }
  if (!isOperatorStatus(candidate.status)) {
    errors.push(`status must be one of active|invited|suspended|archived (got ${String(candidate.status)})`);
  }
  if (candidate.auth_user_id !== null && candidate.auth_user_id !== undefined && !isNonEmptyString(candidate.auth_user_id)) {
    errors.push("auth_user_id must be a non-empty string or null");
  }
  if (!isStringArrayOrNullish(candidate.client_ids)) {
    errors.push("client_ids must be a string[] or null");
  }
  if (!isStringArrayOrNullish(candidate.site_ids)) {
    errors.push("site_ids must be a string[] or null");
  }

  return { ok: errors.length === 0, errors };
}

/** Validate an operator insert payload (db-defaulted fields optional). */
export function validateOperatorInsert(insert: unknown): OperatorValidationResult {
  const errors: string[] = [];
  if (!insert || typeof insert !== "object") {
    return { ok: false, errors: ["operator insert is not an object"] };
  }
  const candidate = insert as Partial<OperatorInsert>;

  if (!isNonEmptyString(candidate.agency_id)) {
    errors.push("agency_id is required");
  }
  if (!isNonEmptyString(candidate.email)) {
    errors.push("email is required");
  } else if (candidate.email !== normalizeOperatorEmail(candidate.email)) {
    errors.push("email must be normalized (trimmed + lowercase)");
  }
  if (!isNonEmptyString(candidate.display_name)) {
    errors.push("display_name is required");
  }
  if (!isOperatorRole(candidate.role)) {
    errors.push("role must be a valid operator role");
  }
  if (candidate.status !== undefined && !isOperatorStatus(candidate.status)) {
    errors.push("status, when provided, must be a valid operator status");
  }
  if (candidate.auth_user_id !== undefined && candidate.auth_user_id !== null && !isNonEmptyString(candidate.auth_user_id)) {
    errors.push("auth_user_id must be a non-empty string or null when provided");
  }
  if (!isStringArrayOrNullish(candidate.client_ids)) {
    errors.push("client_ids must be a string[] or null when provided");
  }
  if (!isStringArrayOrNullish(candidate.site_ids)) {
    errors.push("site_ids must be a string[] or null when provided");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Map a persisted operator row to a local `OperatorSession`.
 *
 * Returns `null` when the row is invalid OR the operator is not `active` (invited / suspended /
 * archived operators never produce a usable session). This is a pure shape mapping — it does NOT
 * verify any credential; callers must only pass rows that were already trusted/authenticated upstream.
 */
export function mapOperatorRowToSession(
  row: OperatorRow,
  options: MapRowToSessionOptions = {},
): OperatorSession | null {
  const validation = validateOperatorRow(row);
  if (!validation.ok) {
    return null;
  }
  if (row.status !== "active") {
    return null;
  }

  let expiresAt: string;
  if (options.expiresAtIso) {
    expiresAt = options.expiresAtIso;
  } else {
    const nowMs = Date.parse(options.nowIso ?? new Date().toISOString());
    if (Number.isNaN(nowMs)) {
      return null;
    }
    const ttl = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    expiresAt = new Date(nowMs + ttl).toISOString();
  }

  const session: OperatorSession = {
    operatorId: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    agencyId: row.agency_id,
    expiresAt,
  };
  if (row.client_ids && row.client_ids.length > 0) {
    session.clientIds = [...row.client_ids];
  }
  if (row.site_ids && row.site_ids.length > 0) {
    session.siteIds = [...row.site_ids];
  }
  return session;
}

/**
 * Map a local `OperatorSession` back to an operator insert payload (e.g. for dev seeding shape).
 * Defaults status to `active`. Does not set `auth_user_id` (auth linkage is future work).
 */
export function mapOperatorSessionToOperatorInsert(session: OperatorSession): OperatorInsert {
  const insert: OperatorInsert = {
    agency_id: session.agencyId,
    email: normalizeOperatorEmail(session.email),
    display_name: session.displayName,
    role: session.role as OperatorRole,
    status: "active",
  };
  if (session.clientIds && session.clientIds.length > 0) {
    insert.client_ids = [...session.clientIds];
  }
  if (session.siteIds && session.siteIds.length > 0) {
    insert.site_ids = [...session.siteIds];
  }
  return insert;
}
