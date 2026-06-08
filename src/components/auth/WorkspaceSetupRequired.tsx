/**
 * Phase A — Safe placeholder for a signed-in user with no linked workspace.
 *
 * Phase A intentionally does NOT resolve operators/customers, create records,
 * link identities, or onboard. So any real signed-in user lands here instead of
 * the operator console — no data is exposed and nothing is created.
 */
import { useAuth } from "../../auth/AuthProvider";

export function WorkspaceSetupRequired() {
  const { user, signOut } = useAuth();

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">workspace setup required</h1>
        <p className="auth-meta">
          you're signed in{user?.email ? ` as ${user.email}` : ""}, but no workspace is linked to this
          account yet.
        </p>
        <p className="auth-meta">
          customer onboarding is not enabled in this environment, and no account records have been created.
        </p>
        <button
          className="auth-btn auth-btn-ghost"
          type="button"
          onClick={() => {
            void signOut();
          }}
        >
          sign out
        </button>
      </div>
    </div>
  );
}
