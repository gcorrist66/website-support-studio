/**
 * Operator access — post-login router.
 *
 * Runs at "/" for a real authenticated session and routes by resolved identity:
 *   operator  -> operator console (AppShell)
 *   customer  -> onboarding (if required) or "all set"
 *   none      -> workspace-setup-required
 *
 * Guarantees: operators never enter customer onboarding; customers never see operator tooling.
 */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { resolveMyIdentity, type Identity } from "../../data/identity";
import { AppShell } from "../shell/AppShell";
import { CustomerRequest } from "../customer/CustomerRequest";
import { WorkspaceSetupRequired } from "./WorkspaceSetupRequired";

function Screen({ title, body }: { title?: string; body: string }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        {title ? <h1 className="auth-title">{title}</h1> : null}
        <p className="auth-meta">{body}</p>
      </div>
    </div>
  );
}

export function IdentityGate() {
  const { loading, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    if (loading || !session) {
      return;
    }
    let active = true;
    resolveMyIdentity()
      .then((id) => {
        if (!active) {
          return;
        }
        setIdentity(id);
        if (id.kind === "operator" && (location.pathname === "/" || location.pathname === "/overview")) {
          navigate("/admin", { replace: true });
        }
        if (id.kind === "customer" && id.onboardingStatus === "onboarding_required") {
          navigate("/onboarding", { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          setIdentity({ kind: "none" });
        }
      });
    return () => {
      active = false;
    };
  }, [loading, session, navigate, location.pathname]);

  if (loading || !identity) {
    return <Screen body="loading your account…" />;
  }

  // Operator → operator console. Customers never reach this branch.
  if (identity.kind === "operator") {
    return <AppShell />;
  }

  if (identity.kind === "customer") {
    if (identity.onboardingStatus === "complete") {
      // Onboarded customer → customer workspace with account, billing, and support actions.
      return <CustomerRequest identity={identity} />;
    }
    // onboarding_required → redirecting to /onboarding (operators never land here).
    return <Screen body="taking you to onboarding…" />;
  }

  // Unknown identity (neither operator nor paid customer) → safe setup placeholder.
  return <WorkspaceSetupRequired />;
}
