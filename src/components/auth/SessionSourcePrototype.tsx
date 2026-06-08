import { useEffect, useMemo, useState } from "react";

import {
  createAuthenticatedNoOperatorState,
  createAuthenticatedOperatorState,
  createArchivedOperatorState,
  createExpiredSessionState,
  createInvitedOperatorState,
  createLoadingState,
  createSuspendedOperatorState,
  createUnauthenticatedState,
  type LoginShellState,
} from "../../auth/loginShellState";
import {
  createDisabledSessionReadState,
  createExistingSessionShapeReadState,
  type DevSessionReadState,
} from "../../auth/devSupabaseSessionRead";
import {
  DEV_ADAPTER_PRINCIPAL_PRESETS,
  DEV_PREVIEW_OPERATOR_ROWS,
  type DevAdapterPrincipalPreset,
} from "../../auth/devOperatorSession";
import type { OperatorRow } from "../../persistence/operatorTypes";

type IdentityMode = "preset" | "manual";
type IdentityStatus = "active" | "no_operator" | "suspended" | "archived" | "invited" | "expired";

type IdentityPreset = {
  id: string;
  label: string;
  status: IdentityStatus;
  principalId: string;
};

const FUTURE_EXPIRES_AT = "2999-01-01T00:00:00.000Z";
const EXPIRED_EXPIRES_AT = "2000-01-01T00:00:00.000Z";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PRESET_OPTIONS: readonly IdentityPreset[] = [
  {
    id: "agency_admin_active",
    label: "Agency Admin (active)",
    principalId: DEV_ADAPTER_PRINCIPAL_PRESETS[0].principalId,
    status: "active",
  },
  {
    id: "cs_agent_active",
    label: "CS Agent (active)",
    principalId: DEV_ADAPTER_PRINCIPAL_PRESETS[1].principalId,
    status: "active",
  },
  {
    id: "gary_approver_active",
    label: "Gary Approver (active)",
    principalId: DEV_ADAPTER_PRINCIPAL_PRESETS[2].principalId,
    status: "active",
  },
  {
    id: "invited_operator",
    label: "Known principal (invited)",
    principalId: DEV_ADAPTER_PRINCIPAL_PRESETS[1].principalId,
    status: "invited",
  },
];

const STATUS_OPTIONS: ReadonlyArray<{ id: IdentityStatus; label: string }> = [
  { id: "active", label: "Active / linked" },
  { id: "no_operator", label: "Authenticated — no linked operator" },
  { id: "suspended", label: "Suspended operator" },
  { id: "archived", label: "Archived operator" },
  { id: "invited", label: "Invited operator" },
  { id: "expired", label: "Expired auth session" },
];

interface PrototypePrincipalInput {
  principalId: string;
  label: string;
  status: IdentityStatus;
}

function parseDevPreset(emailOrId: string): DevAdapterPrincipalPreset | undefined {
  const trimmed = typeof emailOrId === "string" ? emailOrId.trim().toLowerCase() : "";
  if (!trimmed) return undefined;
  return DEV_ADAPTER_PRINCIPAL_PRESETS.find((preset) => preset.principalId === trimmed || preset.email.toLowerCase() === trimmed);
}

function toExpiredUnixMillis(expired: boolean): number | undefined {
  const timestamp = Date.parse(expired ? EXPIRED_EXPIRES_AT : FUTURE_EXPIRES_AT);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }
  return Math.floor(timestamp / 1000);
}

function buildRowsForStatus(rows: readonly OperatorRow[], principalId: string, status: IdentityStatus): OperatorRow[] {
  if (status === "active" || status === "expired") {
    return [...rows];
  }
  if (status === "no_operator") {
    return rows.filter((row) => row.auth_user_id !== principalId);
  }
  return rows.map((row) => (row.auth_user_id === principalId ? { ...row, status } : row));
}

function statusFromReadState(readState: DevSessionReadState, status: IdentityStatus): LoginShellState {
  if (!readState.principal) {
    return createUnauthenticatedState();
  }

  if (status === "expired") {
    return createExpiredSessionState();
  }

  if (status === "invited") {
    return createInvitedOperatorState();
  }

  if (status === "suspended") {
    return createSuspendedOperatorState();
  }

  if (status === "archived") {
    return createArchivedOperatorState();
  }

  if (readState.adapterResult?.authenticated && readState.adapterResult.session) {
    return createAuthenticatedOperatorState(readState.adapterResult.session);
  }

  return createAuthenticatedNoOperatorState();
}

export function SessionSourcePrototype() {
  const [identityMode, setIdentityMode] = useState<IdentityMode>("preset");
  const [presetId, setPresetId] = useState("agency_admin_active");
  const [manualIdentityInput, setManualIdentityInput] = useState("00000000-0000-4000-8000-00000000d010");
  const [manualStatus, setManualStatus] = useState<IdentityStatus>("active");
  const [signedInInput, setSignedInInput] = useState<PrototypePrincipalInput | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [isSignedOut, setIsSignedOut] = useState(true);
  const [protectedRoute, setProtectedRoute] = useState<"workspace" | "admin">("workspace");

  const selectedPreset = useMemo<PrototypePrincipalInput | null>(() => {
    if (identityMode === "manual") {
      const trimmed = manualIdentityInput.trim();
      if (!trimmed) {
        return null;
      }
      if (!UUID_RE.test(trimmed)) {
        return null;
      }
      return {
        principalId: trimmed,
        label: "Manual UUID",
        status: manualStatus,
      };
    }

    const selected = PRESET_OPTIONS.find((option) => option.id === presetId);
    if (!selected) {
      return {
        principalId: PRESET_OPTIONS[0].principalId,
        label: PRESET_OPTIONS[0].label,
        status: PRESET_OPTIONS[0].status,
      };
    }
    return selected;
  }, [identityMode, manualIdentityInput, manualStatus, presetId]);

  const resolvedPreset = useMemo(() => {
    const preset = parseDevPreset(selectedPreset?.principalId ?? "");
    return {
      principalId: selectedPreset?.principalId ?? "",
      label: selectedPreset?.label ?? "Manual identity",
      status: selectedPreset?.status ?? "no_operator",
      email: preset?.email,
      role: preset?.role,
      source: selectedPreset ? (identityMode === "preset" ? "preset" : "manual") : "none",
    };
  }, [selectedPreset, identityMode]);

  const isMounted = useMemo(() => !isSignedOut && signedInInput !== null, [isSignedOut, signedInInput]);
  const activeReadState = useMemo(() => {
    if (!isMounted || !signedInInput) {
      return createDisabledSessionReadState();
    }

    const nowIso = new Date().toISOString();
    const rows = buildRowsForStatus(
      DEV_PREVIEW_OPERATOR_ROWS,
      signedInInput.principalId,
      signedInInput.status,
    );
    const session = createExistingSessionShapeReadState(
      {
        user: {
          id: signedInInput.principalId,
          email: resolvedPreset.email,
          aud: "authenticated",
          role: String(resolvedPreset.role ?? ""),
        },
        expires_at: toExpiredUnixMillis(signedInInput.status === "expired"),
      },
      rows,
      { nowIso },
    );
    return session;
  }, [isMounted, resolvedPreset.email, resolvedPreset.role, signedInInput]);

  const sessionShellState = useMemo(() => {
    if (isSignedOut) {
      return createUnauthenticatedState();
    }
    if (isSigningIn) {
      return createLoadingState();
    }
    if (!signedInInput) {
      return createUnauthenticatedState();
    }
    return statusFromReadState(activeReadState, signedInInput.status);
  }, [activeReadState, isSignedOut, isSigningIn, signedInInput]);

  const canAccessAdminRoute =
    sessionShellState.canAccessWorkspace && sessionShellState.capabilityFlags.canSeeOperatorAdmin && sessionShellState.operatorSession !== null;

  const routeAllowed =
    isSignedOut ? false : protectedRoute === "workspace" ? sessionShellState.canAccessWorkspace : canAccessAdminRoute;

  useEffect(() => {
    if (isSigningIn && !isSignedOut && signedInInput) {
      const timer = window.setTimeout(() => {
        setSignInError("");
        setIsSigningIn(false);
        setIsSignedOut(false);
      }, 250);
      return () => window.clearTimeout(timer);
    }
  }, [isSigningIn, isSignedOut, signedInInput]);

  const onSignIn = () => {
    setSignInError("");
    if (!selectedPreset) {
      const modeAdvice =
        identityMode === "manual"
          ? "Use a UUID-style principal id to preview the session-read path without credentials."
          : "Select a preset identity.";
      setSignInError(modeAdvice);
      return;
    }
    setSignedInInput(selectedPreset);
    setSignInError("");
    setIsSignedIn(true);
    setIsSigningIn(true);
  };

  const setIsSignedIn = (value: boolean) => {
    setIsSignedOut(!value);
    if (value) {
      return;
    }
    setSignedInInput(null);
    setIsSigningIn(false);
    setProtectedRoute("workspace");
  };

  return (
    <section className="phase4a-card phase7-session-prototype">
      <h2>Local Session Source Prototype</h2>
      <p className="placeholder-meta">
        This card simulates a local sign-in source and feeds a session-like object into the existing read path:
        {' '}<code>session → principal → auth pipeline → operator session → capability flags.</code>
      </p>

      <fieldset className="phase6-auth-mode">
        <legend>Input source</legend>
        <label>
          <input
            type="radio"
            name="wss-prototype-source"
            value="preset"
            checked={identityMode === "preset"}
            onChange={() => setIdentityMode("preset")}
          />
          Preset identities (safe, deterministic)
        </label>
        <label>
          <input
            type="radio"
            name="wss-prototype-source"
            value="manual"
            checked={identityMode === "manual"}
            onChange={() => setIdentityMode("manual")}
          />
          Manual principal id
        </label>
      </fieldset>

      <div className="phase7-session-prototype-grid">
        {identityMode === "preset" ? (
          <label className="phase6-operator-switcher">
            Preset identity
            <select value={presetId} onChange={(event) => setPresetId(event.target.value)}>
              {PRESET_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="phase6-operator-switcher">
              Synthetic principal id
              <input
                type="text"
                value={manualIdentityInput}
                onChange={(event) => setManualIdentityInput(event.target.value)}
                placeholder="00000000-0000-4000-8000-00000000d010"
              />
            </label>
            <label className="phase6-operator-switcher">
              Identity status simulation
              <select
                value={manualStatus}
                onChange={(event) => setManualStatus(event.target.value as IdentityStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <div className="phase7-session-prototype-actions">
          <button type="button" disabled={isSigningIn} onClick={() => onSignIn()}>
            {isSignedOut ? "Preview sign-in" : "Update preview"}
          </button>
          <button type="button" onClick={() => setIsSignedIn(false)} disabled={isSignedOut}>
            Sign out preview
          </button>
        </div>
      </div>

      {signInError ? <p className="phase5b-error">{signInError}</p> : null}

      <div className="phase7-session-read-panel phase7-session-prototype-state" role="status" aria-live="polite">
        <p>
          <strong>Derived state:</strong>{" "}
          <span className="phase4b-badge">{sessionShellState.label}</span>
        </p>
        <p className="placeholder-meta">{sessionShellState.message}</p>
        <p className="placeholder-meta">Principal id: {activeReadState.principal?.id || "none"}</p>
        <p className="placeholder-meta">
          Operator session: {sessionShellState.operatorSession ? `${sessionShellState.operatorSession.displayName} · ${sessionShellState.operatorSession.role}` : "not resolved"}
        </p>
      </div>

      <div className="phase7-session-prototype-grid">
        <div>
          <p>
            <strong>Capabilities</strong>
          </p>
          <ul className="phase6-capability-list">
            <li>Can create ticket: {sessionShellState.capabilityFlags.canSeeCreateTicket ? "yes" : "no"}</li>
            <li>Can triage: {sessionShellState.capabilityFlags.canSeeTriage ? "yes" : "no"}</li>
            <li>Can draft: {sessionShellState.capabilityFlags.canSeeDraftReply ? "yes" : "no"}</li>
            <li>Can request approval: {sessionShellState.capabilityFlags.canSeeRequestApproval ? "yes" : "no"}</li>
            <li>Can approve/reject: {sessionShellState.capabilityFlags.canSeeApproveReply ? "yes" : "no"}</li>
            <li>Can send reply: {sessionShellState.capabilityFlags.canSeeSendReply ? "yes" : "no"}</li>
            <li>Can close ticket: {sessionShellState.capabilityFlags.canSeeCloseTicket ? "yes" : "no"}</li>
            <li>Can access operator admin: {sessionShellState.capabilityFlags.canSeeOperatorAdmin ? "yes" : "no"}</li>
          </ul>
        </div>

        <div>
          <label className="phase6-operator-switcher">
            Protected route simulation
            <select value={protectedRoute} onChange={(event) => setProtectedRoute(event.target.value as "workspace" | "admin")}
            >
              <option value="workspace">Workspace</option>
              <option value="admin">Operator Admin</option>
            </select>
          </label>

          <div className="phase7-session-prototype-route-card" role="status" aria-live="polite">
            {routeAllowed ? (
              <>
                <p className="phase4c-summary">
                  Route is accessible in this prototype session.
                </p>
                <p className="placeholder-meta">
                  {protectedRoute === "workspace"
                    ? "Protected workspace route is visible and editable."
                    : "Operator-admin route requires operator-admin capability."
                  }
                </p>
              </>
            ) : (
              <p className="placeholder-meta phase7-empty-state">
                Access denied for this route with the current prototype session state.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="placeholder-meta">
        Local prototype status: {sessionShellState.canAccessWorkspace ? "Workspace-capable" : "Workspace hidden"} · Route capable: {routeAllowed ? "yes" : "no"}
      </p>
    </section>
  );
}
