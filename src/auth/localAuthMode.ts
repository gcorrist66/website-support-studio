/**
 * Phase 6R — Local auth mode abstraction (LOCAL/DEV only; NOT login).
 *
 * Lets the operator workspace consume an `OperatorSession` from one of two LOCAL sources:
 *
 *   A. `dev_role_switcher` — the existing synthetic dev role session (devOperatorSession.ts).
 *   B. `adapter_principal` — a session resolved by the real adapter
 *      (`resolveOperatorSessionFromAuthPrincipal`) from an EXPLICITLY supplied synthetic auth
 *      principal against already-existing operator linkage rows.
 *
 * This module is PURE: it performs no login, no redirect, no magic link, no password handling, no DB
 * writes, and never creates or links operators. Adapter mode only CONSUMES existing linkage state
 * (the operator rows passed in); a missing/invalid/unlinked principal yields no active session.
 */

import type { OperatorSession } from "./authTypes";
import { buildDevOperatorSession, type DevOperatorRoleChoice } from "./devOperatorSession";
import { getOperatorCapabilityFlags, type OperatorCapabilityFlags } from "./operatorCapabilities";
import {
  resolveOperatorSessionFromAuthPrincipal,
  type AuthAdapterResult,
  type ResolveFromPrincipalOptions,
  type SupabaseAuthPrincipal,
} from "./supabaseAuthSessionAdapter";
import type { OperatorRow } from "../persistence/operatorTypes";

export type AuthMode = "dev_role_switcher" | "adapter_principal";

export interface LocalAuthModeState {
  mode: AuthMode;
  selectedDevRole: DevOperatorRoleChoice;
  syntheticPrincipal?: SupabaseAuthPrincipal | null;
  adapterResult?: AuthAdapterResult;
  activeSession: OperatorSession | null;
  capabilityFlags: OperatorCapabilityFlags;
}

/** Build local auth state from the dev role switcher (uses the existing dev session factory). */
export function createDevRoleSwitcherAuthState(selectedDevRole: DevOperatorRoleChoice): LocalAuthModeState {
  const activeSession = buildDevOperatorSession(selectedDevRole);
  return {
    mode: "dev_role_switcher",
    selectedDevRole,
    activeSession,
    capabilityFlags: getOperatorCapabilityFlags(activeSession),
  };
}

/**
 * Build local auth state from a supplied synthetic auth principal, resolved through the real adapter
 * against existing operator linkage rows. Requires an explicitly supplied principal — a null/missing
 * principal yields an unauthenticated result with no active session. Never writes or links anything.
 */
export function createAdapterPrincipalAuthState(
  principal: SupabaseAuthPrincipal | null | undefined,
  operatorRows: readonly OperatorRow[],
  options: ResolveFromPrincipalOptions = {},
): LocalAuthModeState {
  const adapterResult = resolveOperatorSessionFromAuthPrincipal(principal ?? null, operatorRows, options);
  const activeSession = adapterResult.authenticated ? adapterResult.session : null;
  return {
    mode: "adapter_principal",
    selectedDevRole: "none",
    syntheticPrincipal: principal ?? null,
    adapterResult,
    activeSession,
    capabilityFlags: getOperatorCapabilityFlags(activeSession),
  };
}

/** The active operator session for whichever mode is selected (null when none). */
export function getActiveOperatorSession(state: LocalAuthModeState): OperatorSession | null {
  return state.activeSession;
}

/** The capability flags for the active session (all-false when there is no session). */
export function getActiveCapabilityFlags(state: LocalAuthModeState): OperatorCapabilityFlags {
  return state.capabilityFlags;
}

/**
 * Whether adapter-principal mode can resolve anything in the current context — i.e. at least one
 * operator row carries an existing auth_user_id link to consume. (Does not create linkage.)
 */
export function isAdapterModeAvailable(operatorRows: readonly OperatorRow[] | null | undefined): boolean {
  return Array.isArray(operatorRows) && operatorRows.some((row) => row && typeof row.auth_user_id === "string" && row.auth_user_id.trim().length > 0);
}

/** Human-readable label for a mode (for UI display). */
export function describeAuthMode(mode: AuthMode): string {
  return mode === "adapter_principal" ? "Adapter Principal Preview" : "Dev Role Switcher";
}
