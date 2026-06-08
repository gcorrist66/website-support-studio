/**
 * Phase A — OAuth callback handler (feature-flagged).
 *
 * The real auth client is created with detectSessionInUrl + PKCE, so it exchanges
 * the `?code` in the callback URL for a session automatically on construction.
 * This page therefore waits on the AuthProvider session and routes onward:
 *   - session present  → "/" (HomeRoute decides console vs. setup placeholder)
 *   - no session        → clear error + link back to /login
 *   - flag off          → safe "not available" message
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";

export function AuthCallback() {
  const navigate = useNavigate();
  const { enabled, loading, session, error } = useAuth();

  useEffect(() => {
    if (!enabled || loading) {
      return;
    }
    if (session) {
      navigate("/", { replace: true });
    }
  }, [enabled, loading, session, navigate]);

  let message = "completing sign-in…";
  let isError = false;
  if (!enabled) {
    message = "authentication is not available in this environment.";
    isError = true;
  } else if (error) {
    message = error;
    isError = true;
  } else if (!loading && !session) {
    message = "sign-in did not complete. please try again.";
    isError = true;
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">sign-in</h1>
        <p className={isError ? "auth-error" : "auth-meta"} role="status">
          {message}
        </p>
        {isError ? (
          <a className="auth-btn auth-btn-ghost" href="/login">
            back to login
          </a>
        ) : null}
      </div>
    </div>
  );
}
