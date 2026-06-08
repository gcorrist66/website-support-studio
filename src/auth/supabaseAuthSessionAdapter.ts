/**
 * Phase 6O — Local Supabase Auth session adapter (bridge only; NOT login).
 *
 * Bridges a VERIFIED Supabase Auth principal (i.e. the `user` of an already-verified session —
 * `auth.uid()`) to an internal `OperatorSession`:
 *
 *     verified auth.uid()  →  operators.auth_user_id  →  OperatorSession  →  existing auth guards
 *
 * This module is PURE TypeScript. It performs NO authentication, NO login, NO redirect, NO magic
 * link, NO password handling. It imports NO Supabase Auth client/runtime — `SupabaseAuthPrincipal`
 * is a local TYPE SHAPE documenting the relevant fields of a verified session's user, not a runtime
 * dependency. There is no service-role key and no secret handling here.
 *
 * The linkage source of truth is `auth_user_id` (the principal id), never the email. Email is never
 * used as a lookup key, so an email-only identity can never resolve an operator.
 */

import type { OperatorSession } from "./authTypes";
import { isValidAuthUserId, normalizeAuthUserId, resolveSessionFromAuthUser } from "./operatorIdentityLinking";
import type { OperatorRow } from "../persistence/operatorTypes";

/** The relevant fields of a verified Supabase Auth user (type shape only — no runtime client). */
export interface SupabaseAuthPrincipal {
  /** auth.users.id (UUID). The linkage source of truth. */
  id: string;
  email?: string;
  aud?: string;
  role?: string;
  /** ISO-8601 expiry of the verified auth session, if known. */
  expiresAt?: string;
}

export interface SupabaseAuthSessionAdapterOptions {
  expectedProjectRef: string;
  environment: string;
  allowDevValidation: boolean;
}

export interface ResolveFromPrincipalOptions {
  /** ISO timestamp treated as "now" for expiry checks; defaults to the current time. */
  nowIso?: string;
  /** When provided, the adapter environment guard is enforced before resolving. */
  adapter?: SupabaseAuthSessionAdapterOptions;
}

export interface AuthAdapterResult {
  authenticated: boolean;
  session: OperatorSession | null;
  reason: string | null;
  principalId: string | null;
}

const ALLOWED_NON_PRODUCTION_ENVS = new Set(["dev", "development", "local"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Normalize a raw principal: lowercase/trim the id, trim email/aud/role/expiry. */
export function normalizeSupabaseAuthPrincipal(raw: SupabaseAuthPrincipal): SupabaseAuthPrincipal {
  const normalized: SupabaseAuthPrincipal = {
    id: typeof raw?.id === "string" ? normalizeAuthUserId(raw.id) : "",
  };
  if (isNonEmptyString(raw?.email)) {
    normalized.email = raw.email.trim().toLowerCase();
  }
  if (isNonEmptyString(raw?.aud)) {
    normalized.aud = raw.aud.trim();
  }
  if (isNonEmptyString(raw?.role)) {
    normalized.role = raw.role.trim();
  }
  if (isNonEmptyString(raw?.expiresAt)) {
    normalized.expiresAt = raw.expiresAt.trim();
  }
  return normalized;
}

/**
 * Throw unless the principal is usable: it MUST carry a valid UUID id. Email is never sufficient —
 * an identity asserted by email alone (no valid id) is rejected here.
 */
export function assertSupabaseAuthPrincipal(principal: SupabaseAuthPrincipal | null | undefined): void {
  if (!principal || typeof principal !== "object") {
    throw new Error("auth_principal_missing");
  }
  if (!isValidAuthUserId(principal.id)) {
    throw new Error("auth_principal_invalid_id");
  }
}

/**
 * Local environment guard for the adapter's dev path. Pure config sanity check — it touches no client.
 * When `allowDevValidation` is set, the environment must be a non-production env and a project ref
 * must be supplied. This documents and enforces that the dev adapter path is never pointed at prod.
 */
export function assertAuthAdapterGuard(options: SupabaseAuthSessionAdapterOptions): void {
  if (!options || typeof options !== "object") {
    throw new Error("auth_adapter_options_missing");
  }
  if (!isNonEmptyString(options.expectedProjectRef)) {
    throw new Error("auth_adapter_missing_project_ref");
  }
  if (!isNonEmptyString(options.environment)) {
    throw new Error("auth_adapter_missing_environment");
  }
  if (options.allowDevValidation && !ALLOWED_NON_PRODUCTION_ENVS.has(options.environment.toLowerCase())) {
    throw new Error(`auth_adapter_dev_requires_non_production_env_${options.environment}`);
  }
}

/**
 * Reduce a principal to the operator lookup key. The ONLY key is the normalized auth_user_id (the
 * principal id); email is deliberately never returned as a lookup key.
 */
export function mapAuthPrincipalToOperatorLookup(principal: SupabaseAuthPrincipal): { authUserId: string } {
  assertSupabaseAuthPrincipal(principal);
  return { authUserId: normalizeAuthUserId(principal.id) };
}

export function createUnauthenticatedSessionResult(reason: string, principalId: string | null = null): AuthAdapterResult {
  return { authenticated: false, session: null, reason, principalId };
}

export function createAuthenticatedOperatorSessionResult(session: OperatorSession, principal: SupabaseAuthPrincipal): AuthAdapterResult {
  return { authenticated: true, session, reason: null, principalId: normalizeAuthUserId(principal.id) };
}

/**
 * Resolve an `OperatorSession` for a verified auth principal against a set of (already-trusted)
 * operator rows. Returns a structured result; never throws for the normal rejection paths.
 *
 * Rejections (unauthenticated result): missing/invalid principal, expired auth session, no linked
 * operator, or a linked operator that is not active (suspended/archived/invited). Resolution is
 * delegated to the existing `resolveSessionFromAuthUser` (active-only) — no new session logic.
 */
export function resolveOperatorSessionFromAuthPrincipal(
  principal: SupabaseAuthPrincipal | null | undefined,
  rows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): AuthAdapterResult {
  if (options.adapter) {
    assertAuthAdapterGuard(options.adapter);
  }

  if (!principal || typeof principal !== "object") {
    return createUnauthenticatedSessionResult("auth_principal_missing");
  }

  const normalized = normalizeSupabaseAuthPrincipal(principal);
  try {
    assertSupabaseAuthPrincipal(normalized);
  } catch (error) {
    return createUnauthenticatedSessionResult(error instanceof Error ? error.message : "auth_principal_invalid");
  }

  const nowIso = options.nowIso ?? new Date().toISOString();
  if (normalized.expiresAt) {
    const expiresMs = Date.parse(normalized.expiresAt);
    if (Number.isNaN(expiresMs) || expiresMs <= Date.parse(nowIso)) {
      return createUnauthenticatedSessionResult("auth_principal_expired", normalized.id);
    }
  }

  const { authUserId } = mapAuthPrincipalToOperatorLookup(normalized);
  const session = resolveSessionFromAuthUser(rows, authUserId, {
    nowIso,
    // Inherit the auth session's expiry when known so the operator session cannot outlive it.
    expiresAtIso: normalized.expiresAt,
  });

  if (!session) {
    return createUnauthenticatedSessionResult("no_active_operator_for_principal", normalized.id);
  }

  return createAuthenticatedOperatorSessionResult(session, normalized);
}
