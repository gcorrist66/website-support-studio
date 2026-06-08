/**
 * Phase 6W — Local auth pipeline (read-only; NOT login).
 *
 * Composes the full local auth plumbing path:
 *
 *   Session  →  Principal  →  Auth Adapter  →  Operator Session  →  Capability Flags
 *
 * Pure functions only: no login, no redirects, no route middleware, no writes, no auth user creation,
 * no network. Resolution reuses the existing adapter (`resolveOperatorSessionFromAuthPrincipal`,
 * active-only) and capability flags (`getOperatorCapabilityFlags`). Token verification is assumed to
 * have happened upstream — the pipeline only maps an already-verified session/user to an operator.
 */

import { getOperatorCapabilityFlags, type OperatorCapabilityFlags } from "./operatorCapabilities";
import {
  createUnauthenticatedSessionResult,
  resolveOperatorSessionFromAuthPrincipal,
  type AuthAdapterResult,
  type ResolveFromPrincipalOptions,
} from "./supabaseAuthSessionAdapter";
import {
  extractPrincipalFromUser,
  getSessionPrincipal,
  type SupabaseSessionLike,
  type SupabaseUserLike,
} from "./supabaseAuthClientWrapper";
import type { OperatorRow } from "../persistence/operatorTypes";

/** Resolve an operator session from a verified Supabase session shape. */
export function resolveOperatorSessionFromSession(
  session: SupabaseSessionLike | null | undefined,
  operatorRows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): AuthAdapterResult {
  const principal = getSessionPrincipal(session);
  if (!principal) {
    return createUnauthenticatedSessionResult("no_session_principal");
  }
  return resolveOperatorSessionFromAuthPrincipal(principal, operatorRows, options);
}

/** Resolve an operator session from a verified Supabase user shape. */
export function resolveOperatorSessionFromUser(
  user: SupabaseUserLike | null | undefined,
  operatorRows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): AuthAdapterResult {
  const principal = extractPrincipalFromUser(user ?? null);
  if (!principal) {
    return createUnauthenticatedSessionResult("no_user_principal");
  }
  return resolveOperatorSessionFromAuthPrincipal(principal, operatorRows, options);
}

/** Resolve the UI capability flags for a verified session (all-false when unauthenticated). */
export function resolveCapabilityFlagsFromSession(
  session: SupabaseSessionLike | null | undefined,
  operatorRows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): OperatorCapabilityFlags {
  const result = resolveOperatorSessionFromSession(session, operatorRows, options);
  return getOperatorCapabilityFlags(result.session, options.nowIso);
}
