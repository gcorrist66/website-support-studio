import {
  LOGIN_SHELL_STATUS_OPTIONS,
  type LoginShellState,
  type LoginShellStatus,
} from "../../auth/loginShellState";

/**
 * Phase 7C — Local auth state SIMULATOR (NOT real authentication).
 *
 * Renders the auth/session states a future sign-in surface will move through, so UX + transitions can
 * be reviewed before any real auth exists. It is a pure presentational simulator: it collects no
 * credentials and sends no email; it has no real sign-in surface and makes no Supabase calls.
 */

type LoginShellProps = {
  state: LoginShellState;
  status: LoginShellStatus;
  // eslint-disable-next-line no-unused-vars
  onSelectStatus: (_status: LoginShellStatus) => void;
};

const CAPABILITY_ROWS: ReadonlyArray<{ key: keyof LoginShellState["capabilityFlags"]; label: string }> = [
  { key: "canSeeCreateTicket", label: "Create ticket" },
  { key: "canSeeTriage", label: "Triage" },
  { key: "canSeeDraftReply", label: "Draft reply" },
  { key: "canSeeRequestApproval", label: "Request approval" },
  { key: "canSeeApproveReply", label: "Approve / Reject" },
  { key: "canSeeSendReply", label: "Send reply" },
  { key: "canSeeCloseTicket", label: "Close ticket" },
  { key: "canSeeOperatorAdmin", label: "Operator admin" },
];

export function LoginShell({ state, status, onSelectStatus }: LoginShellProps) {
  const { operatorSession, capabilityFlags } = state;

  return (
    <section className="phase4a-card phase7-login-shell">
      <h2>Login state</h2>
      <p className="placeholder-meta">
        State display only — not real authentication. It collects no credentials and sends no email; it
        only switches between modeled states to show what the workspace will gate on.
      </p>

      <label className="phase6-operator-switcher">
        Session state
        <select value={status} onChange={(event) => onSelectStatus(event.target.value as LoginShellStatus)}>
          {LOGIN_SHELL_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="phase7-login-shell-panel" role="status" aria-live="polite">
        <p>
          <strong>State:</strong> <span className="phase4b-badge">{state.label}</span>
        </p>
        <p className="placeholder-meta">{state.message}</p>
        <p className="placeholder-meta">
          Workspace access: {state.canAccessWorkspace ? "granted (operator workspace shown)" : "withheld"}
        </p>
      </div>

      {state.status === "authenticated_operator" && operatorSession ? (
        <div className="phase7-login-shell-operator">
          <h4>Resolved operator</h4>
          <ul className="phase4c-meta-list">
            <li>
              <strong>Name:</strong> {operatorSession.displayName}
            </li>
            <li>
              <strong>Role:</strong> {operatorSession.role}
            </li>
            <li>
              <strong>Agency:</strong> {operatorSession.agencyId}
            </li>
          </ul>
          <h4>Capability flags</h4>
          <ul className="phase6-capability-list">
            {CAPABILITY_ROWS.map((row) => (
              <li key={row.key}>
                {row.label}: {capabilityFlags[row.key] ? "visible" : "hidden"}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="placeholder-meta phase7-empty-state">
          No operator workspace is shown for this state. Select &quot;Authenticated operator&quot; to show the workspace.
        </p>
      )}
    </section>
  );
}
