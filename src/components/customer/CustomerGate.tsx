/**
 * Stage B — post-login customer gate.
 *
 * Runs at "/" for a real authenticated session: claims the paid org (idempotent) and routes:
 *   onboarding_required -> /onboarding
 *   complete            -> "you're all set" (no dashboard built yet, per scope)
 *   no paid org         -> workspace-setup-required placeholder
 *
 * No dashboard / portal / capacity UI.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { claimMyPaidOrg } from "../../data/customerOnboarding";
import { WorkspaceSetupRequired } from "../auth/WorkspaceSetupRequired";

type GateState = "resolving" | "complete" | "no_org";

export function CustomerGate() {
  const { loading, session } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<GateState>("resolving");

  useEffect(() => {
    if (loading || !session) {
      return;
    }
    let active = true;
    claimMyPaidOrg()
      .then((r) => {
        if (!active) {
          return;
        }
        if (r.has_org && r.onboarding_status === "onboarding_required") {
          navigate("/onboarding", { replace: true });
        } else if (r.has_org && r.onboarding_status === "complete") {
          setState("complete");
        } else {
          setState("no_org");
        }
      })
      .catch(() => {
        if (active) {
          setState("no_org");
        }
      });
    return () => {
      active = false;
    };
  }, [loading, session, navigate]);

  if (loading || state === "resolving") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="auth-meta">loading your account…</p>
        </div>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">you're all set</h1>
          <p className="auth-meta">
            your website support studio account is active and onboarding is complete. your workspace is being
            prepared.
          </p>
        </div>
      </div>
    );
  }

  return <WorkspaceSetupRequired />;
}
