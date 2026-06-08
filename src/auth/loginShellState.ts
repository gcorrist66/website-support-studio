/**
 * Phase 7B — Login shell state model (pure; NOT real authentication).
 *
 * Models the auth/session states a future login surface will move through, so the UX and state
 * transitions can be prototyped BEFORE any real Supabase Auth exists. This is pure state modeling:
 * NO auth calls, NO Supabase calls, NO network, NO DB writes. It reuses the existing
 * `OperatorSession` + capability flags so the "authenticated operator" state is realistic.
 */

import type { OperatorSession } from "./authTypes";
import { getOperatorCapabilityFlags, type OperatorCapabilityFlags } from "./operatorCapabilities";

export type LoginShellStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated_no_operator"
  | "authenticated_operator"
  | "suspended_operator"
  | "archived_operator"
  | "invited_operator"
  | "expired_session";

export interface LoginShellState {
  status: LoginShellStatus;
  /** A resolved operator session (only for `authenticated_operator`; null otherwise). */
  operatorSession: OperatorSession | null;
  /** Capability flags for the active session (all-false for every non-operator state). */
  capabilityFlags: OperatorCapabilityFlags;
  /** Short label for display. */
  label: string;
  /** Safe, generic message (no identity leakage). */
  message: string;
  /** True only when the operator workspace should be shown. */
  canAccessWorkspace: boolean;
}

const NO_FLAGS = getOperatorCapabilityFlags(null);

function nonOperatorState(status: LoginShellStatus, label: string, message: string): LoginShellState {
  return {
    status,
    operatorSession: null,
    capabilityFlags: NO_FLAGS,
    label,
    message,
    canAccessWorkspace: false,
  };
}

export function createLoadingState(): LoginShellState {
  return nonOperatorState("loading", "Loading", "Checking session status…");
}

export function createUnauthenticatedState(): LoginShellState {
  return nonOperatorState(
    "unauthenticated",
    "Unauthenticated",
    "Not signed in. No active session. (This prototype has no real sign-in surface.)",
  );
}

export function createAuthenticatedNoOperatorState(): LoginShellState {
  return nonOperatorState(
    "authenticated_no_operator",
    "Authenticated — no operator",
    "Signed in, but this identity is not a provisioned operator. Access is not available.",
  );
}

export function createAuthenticatedOperatorState(session: OperatorSession): LoginShellState {
  return {
    status: "authenticated_operator",
    operatorSession: session,
    capabilityFlags: getOperatorCapabilityFlags(session),
    label: "Authenticated operator",
    message: "Signed in as an active operator. Workspace available.",
    canAccessWorkspace: true,
  };
}

export function createSuspendedOperatorState(): LoginShellState {
  return nonOperatorState(
    "suspended_operator",
    "Suspended",
    "Operator account is suspended. Access is unavailable.",
  );
}

export function createArchivedOperatorState(): LoginShellState {
  return nonOperatorState(
    "archived_operator",
    "Archived",
    "Operator account is archived. Access is unavailable.",
  );
}

export function createInvitedOperatorState(): LoginShellState {
  return nonOperatorState(
    "invited_operator",
    "Invited",
    "Operator invite is pending. Access is not yet active.",
  );
}

export function createExpiredSessionState(): LoginShellState {
  return nonOperatorState(
    "expired_session",
    "Expired session",
    "Session has expired. A new session would be required to continue.",
  );
}

/**
 * Build the modeled state for a status. `sampleSession` is used only for `authenticated_operator`
 * (to make the workspace preview realistic); if absent, that status falls back to unauthenticated.
 * Pure mapping — keeps the auth-state vocabulary out of the UI shell module.
 */
export function buildLoginShellState(
  status: LoginShellStatus,
  sampleSession: OperatorSession | null = null,
): LoginShellState {
  switch (status) {
    case "loading":
      return createLoadingState();
    case "authenticated_no_operator":
      return createAuthenticatedNoOperatorState();
    case "authenticated_operator":
      return sampleSession ? createAuthenticatedOperatorState(sampleSession) : createUnauthenticatedState();
    case "suspended_operator":
      return createSuspendedOperatorState();
    case "archived_operator":
      return createArchivedOperatorState();
    case "invited_operator":
      return createInvitedOperatorState();
    case "expired_session":
      return createExpiredSessionState();
    case "unauthenticated":
    default:
      return createUnauthenticatedState();
  }
}

/** All shell statuses, in display order, with a label — for the dev state simulator selector. */
export const LOGIN_SHELL_STATUS_OPTIONS: ReadonlyArray<{ value: LoginShellStatus; label: string }> = [
  { value: "loading", label: "Loading" },
  { value: "unauthenticated", label: "Unauthenticated" },
  { value: "authenticated_no_operator", label: "Authenticated — no operator" },
  { value: "authenticated_operator", label: "Authenticated operator" },
  { value: "suspended_operator", label: "Suspended" },
  { value: "archived_operator", label: "Archived" },
  { value: "invited_operator", label: "Invited" },
  { value: "expired_session", label: "Expired session" },
];
