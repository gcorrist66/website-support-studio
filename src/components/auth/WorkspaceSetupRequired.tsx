/**
 * Phase A — Safe placeholder for a signed-in user with no linked workspace.
 *
 * Phase A intentionally does NOT resolve operators/customers, create records,
 * link identities, or onboard. So any real signed-in user lands here instead of
 * the operator console — no data is exposed and nothing is created.
 */
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export function WorkspaceSetupRequired() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">workspace setup required</h1>
        <p className="auth-meta">
          you're signed in{user?.email ? ` as ${user.email}` : ""}, but this sign-in is not linked to a
          customer workspace yet.
        </p>
        <p className="auth-meta">
          if you just checked out, make sure you use the same email at login. if you meant to switch
          accounts, sign out and try the correct email again.
        </p>
        <p className="auth-meta">
          if this keeps happening after checkout, contact Corriston Consulting so we can check the
          customer record.
        </p>
        <button
          className="auth-btn auth-btn-ghost"
          type="button"
          onClick={() => {
            void signOut();
            navigate("/login", { replace: true });
          }}
        >
          sign out and try another account
        </button>
      </div>
    </div>
  );
}
