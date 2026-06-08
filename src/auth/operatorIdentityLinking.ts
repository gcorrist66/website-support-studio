/**
 * Phase 6L — Operator ↔ Supabase Auth linkage foundation (LOCAL, not login).
 *
 * Pure TypeScript helpers that model the linkage between a Supabase Auth user id and an internal
 * operator row:
 *
 *     Supabase Auth User → auth_user_id → operators row → OperatorSession
 *
 * This is NOT authentication and NOT a login flow. There is no Supabase Auth runtime, no client,
 * no credentials, no redirects. These helpers only validate/transform already-trusted operator
 * rows and resolve sessions via the existing resolver. Persisting a link (writing auth_user_id)
 * is done by guarded dev tooling, not here.
 *
 * Invariants enforced:
 *   - auth_user_id must be a valid UUID.
 *   - only ACTIVE operators may be linked (suspended/archived/invited rejected).
 *   - one auth_user_id ↔ one operator (and one operator ↔ at most one auth_user_id).
 *   - linking never changes agency_id or role (no permission elevation).
 *   - unlinking clears auth_user_id but preserves the operator row.
 */

import type { OperatorSession } from "./authTypes";
import { createOperatorSession, validateOperatorSession, type ResolveOperatorOptions } from "./operatorSessionResolver";
import { validateOperatorRow } from "../persistence/operatorMappers";
import type { OperatorRow } from "../persistence/operatorTypes";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalize an auth user id the way Postgres treats a uuid: trimmed + lowercase. */
export function normalizeAuthUserId(value: string): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** True only for a syntactically valid UUID (any RFC-4122-shaped 8-4-4-4-12 hex value). */
export function isValidAuthUserId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

/** True when the operator row already carries a non-empty auth_user_id link. */
export function isOperatorLinked(row: Pick<OperatorRow, "auth_user_id"> | null | undefined): boolean {
  return Boolean(row && typeof row.auth_user_id === "string" && row.auth_user_id.trim().length > 0);
}

/**
 * Throw unless the operator row is a structurally valid, ACTIVE operator eligible for linking.
 * suspended / archived / invited / invalid rows are rejected with a stable reason.
 */
export function assertOperatorCanBeLinked(row: OperatorRow): void {
  const validation = validateOperatorRow(row);
  if (!validation.ok) {
    throw new Error(`operator_link_invalid_row: ${validation.errors.join(", ")}`);
  }
  if (row.status !== "active") {
    throw new Error(`operator_not_active_for_link_${row.status}`);
  }
}

interface LinkOptions {
  /** When provided, ensures no OTHER operator already owns this auth_user_id (global uniqueness). */
  existingRows?: readonly OperatorRow[];
}

/**
 * Return a new operator row with `auth_user_id` set to the (normalized) id. Pure — never mutates
 * the input. agency_id and role are preserved (the spread carries them through unchanged).
 *
 * Rejects: non-active operators, invalid UUIDs, re-linking an already-linked operator to a different
 * id, and (when `existingRows` is provided) an id already linked to another operator.
 */
export function linkOperatorToAuthUser(row: OperatorRow, authUserId: string, options: LinkOptions = {}): OperatorRow {
  assertOperatorCanBeLinked(row);
  if (!isValidAuthUserId(authUserId)) {
    throw new Error("operator_link_invalid_auth_user_id");
  }
  const normalized = normalizeAuthUserId(authUserId);

  if (isOperatorLinked(row)) {
    const current = normalizeAuthUserId(row.auth_user_id as string);
    if (current === normalized) {
      return { ...row, auth_user_id: normalized }; // idempotent
    }
    throw new Error("operator_already_linked_to_other_auth_user");
  }

  if (options.existingRows) {
    const conflict = options.existingRows.find(
      (other) => other.id !== row.id && isOperatorLinked(other) && normalizeAuthUserId(other.auth_user_id as string) === normalized,
    );
    if (conflict) {
      throw new Error("auth_user_id_already_linked_to_another_operator");
    }
  }

  return { ...row, auth_user_id: normalized };
}

/**
 * Return a new operator row with `auth_user_id` cleared. The operator row itself is preserved
 * (only the link is removed); agency_id, role, status, etc. are unchanged.
 */
export function unlinkOperatorFromAuthUser(row: OperatorRow): OperatorRow {
  return { ...row, auth_user_id: null };
}

/**
 * Resolve the single operator row linked to an auth user id. Returns undefined when none match.
 * Throws if more than one operator carries the same auth_user_id (a uniqueness violation that the
 * DB partial-unique index prevents, but which we guard against defensively here too).
 */
export function resolveOperatorFromAuthUser(rows: readonly OperatorRow[], authUserId: string): OperatorRow | undefined {
  if (!isValidAuthUserId(authUserId)) {
    return undefined;
  }
  const normalized = normalizeAuthUserId(authUserId);
  const matches = rows.filter((row) => isOperatorLinked(row) && normalizeAuthUserId(row.auth_user_id as string) === normalized);
  if (matches.length > 1) {
    throw new Error("duplicate_auth_user_id_link");
  }
  return matches[0];
}

/**
 * Resolve an OperatorSession from an auth user id, using the existing session resolver logic
 * (active-only). Returns null when no linked operator exists or the operator is not active.
 */
export function resolveSessionFromAuthUser(
  rows: readonly OperatorRow[],
  authUserId: string,
  options: ResolveOperatorOptions = {},
): OperatorSession | null {
  const row = resolveOperatorFromAuthUser(rows, authUserId);
  if (!row) {
    return null;
  }
  const session = createOperatorSession(row, options);
  if (!session) {
    return null;
  }
  // Defensive: only return a session that the existing validator accepts.
  return validateOperatorSession(session, options.nowIso).ok ? session : null;
}
