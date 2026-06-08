/**
 * Phase 7G — Dev-only Supabase session READ (read-only; NOT a sign-in surface).
 *
 * Proves the real session-read path before any sign-in UI exists:
 *
 *   verified dev session (plain shape)  →  SupabaseAuthPrincipal  →  auth pipeline  →  OperatorSession  →  capability flags
 *
 * This module is PURE and read-only. It consumes plain session-like objects only (whatever a verified
 * dev session looks like) and reuses the existing `getSessionPrincipal` + auth pipeline. It makes no
 * network calls, runs no auth flows, redirects nothing, creates no users, writes nothing, requires no
 * service-role key, and imports no Supabase client runtime. Token verification is assumed upstream.
 */

import { getOperatorCapabilityFlags, type OperatorCapabilityFlags } from "./operatorCapabilities";
import { resolveOperatorSessionFromSession } from "./authPipeline";
import {
  createSyntheticSession,
  getSessionPrincipal,
  type SupabaseSessionLike,
} from "./supabaseAuthClientWrapper";
import type {
  AuthAdapterResult,
  ResolveFromPrincipalOptions,
  SupabaseAuthPrincipal,
} from "./supabaseAuthSessionAdapter";
import type { OperatorRow } from "../persistence/operatorTypes";

export type DevSupabaseSessionReadMode = "disabled" | "synthetic_session" | "existing_session_shape";

export interface DevSessionReadState {
  mode: DevSupabaseSessionReadMode;
  /** The plain session-like object fed to the read path (null when disabled / none). */
  session: SupabaseSessionLike | null;
  /** The principal extracted from the session (null when none/invalid). */
  principal: SupabaseAuthPrincipal | null;
  /** The pipeline outcome (operator session resolution); null when disabled. */
  adapterResult: AuthAdapterResult | null;
  /** Capability flags for the resolved operator session (all-false when none). */
  capabilityFlags: OperatorCapabilityFlags;
}

const NO_FLAGS = getOperatorCapabilityFlags(null);

/**
 * Run the read path for a plain session-like object: extract the principal, resolve the operator
 * session via the pipeline, and compute capability flags. Pure / read-only.
 */
export function resolveDevSessionReadPipeline(
  session: SupabaseSessionLike | null | undefined,
  operatorRows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): { principal: SupabaseAuthPrincipal | null; adapterResult: AuthAdapterResult; capabilityFlags: OperatorCapabilityFlags } {
  const principal = getSessionPrincipal(session ?? null);
  const adapterResult = resolveOperatorSessionFromSession(session ?? null, operatorRows, options);
  const capabilityFlags = getOperatorCapabilityFlags(adapterResult.session, options.nowIso);
  return { principal, adapterResult, capabilityFlags };
}

/** Disabled: nothing is read; no session, no principal, no operator. */
export function createDisabledSessionReadState(): DevSessionReadState {
  return {
    mode: "disabled",
    session: null,
    principal: null,
    adapterResult: null,
    capabilityFlags: NO_FLAGS,
  };
}

/**
 * Synthetic session: build a synthetic dev session via the existing factory, then run the read path.
 * The synthetic session is a local fixture (not a real verified session).
 */
export function createSyntheticSessionReadState(
  input: { id: string; email?: string; expiresAtIso?: string },
  operatorRows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): DevSessionReadState {
  const session = createSyntheticSession(input);
  const { principal, adapterResult, capabilityFlags } = resolveDevSessionReadPipeline(session, operatorRows, options);
  return { mode: "synthetic_session", session, principal, adapterResult, capabilityFlags };
}

/**
 * Existing session shape: consume a plain session-like object as-is and run the read path. No auth
 * call is made; the caller is expected to supply an already-verified session shape (in dev, a fixture).
 */
export function createExistingSessionShapeReadState(
  session: SupabaseSessionLike | null | undefined,
  operatorRows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): DevSessionReadState {
  if (!session) {
    return {
      mode: "existing_session_shape",
      session: null,
      principal: null,
      adapterResult: null,
      capabilityFlags: NO_FLAGS,
    };
  }
  const { principal, adapterResult, capabilityFlags } = resolveDevSessionReadPipeline(session, operatorRows, options);
  return { mode: "existing_session_shape", session, principal, adapterResult, capabilityFlags };
}

/** Human-readable label for a mode (for UI display). */
export function describeDevSessionReadState(mode: DevSupabaseSessionReadMode): string {
  switch (mode) {
    case "synthetic_session":
      return "Synthetic Session";
    case "existing_session_shape":
      return "Existing Session Shape";
    case "disabled":
    default:
      return "Disabled";
  }
}

export const DEV_SESSION_READ_MODE_OPTIONS: ReadonlyArray<{ value: DevSupabaseSessionReadMode; label: string }> = [
  { value: "disabled", label: "Disabled" },
  { value: "synthetic_session", label: "Synthetic Session" },
  { value: "existing_session_shape", label: "Existing Session Shape" },
];
