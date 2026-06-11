/**
 * Phase A — Real login screen (feature-flagged).
 *
 * When real auth is enabled + configured: shows OAuth buttons (Google, GitHub).
 * When disabled or unconfigured: shows a clear disabled state and makes NO
 * Supabase calls. Brand system + lowercase labels; green CTA (blue stays brand).
 */
import { LogoLockup } from "../brand/LogoLockup";
import { useAuth } from "../../auth/AuthProvider";
import { getAuthConfigStatus } from "../../auth/realAuthClient";

export function LoginPage() {
  const { enabled, signInWithOAuth, error } = useAuth();
  const status = getAuthConfigStatus();
  const ready = enabled && status.configured;

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <LogoLockup size={34} />
        <h1 className="auth-title">login</h1>
        <p className="auth-subtitle">sign in to access your website project account.</p>
        <p className="auth-meta">
          use the same email you used at checkout so we can match the right customer workspace. customer
          onboarding should not use an operator/admin email.
        </p>

        {ready ? (
          <div className="auth-actions">
            <button
              className="auth-btn auth-btn-green"
              type="button"
              onClick={() => {
                void signInWithOAuth("google");
              }}
            >
              continue with google
            </button>
            <button
              className="auth-btn auth-btn-ghost"
              type="button"
              onClick={() => {
                void signInWithOAuth("azure");
              }}
            >
              continue with microsoft
            </button>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="auth-disabled" role="status">
            <p className="auth-disabled-title">authentication is not available in this environment.</p>
            {!enabled ? (
              <p className="auth-meta">
                real auth is disabled. set <code>VITE_WSS_REAL_AUTH_ENABLED=true</code> to enable it.
              </p>
            ) : null}
            {enabled && !status.configured ? (
              <p className="auth-meta">missing configuration: {status.missing.join(", ")}</p>
            ) : null}
          </div>
        )}

        <p className="auth-meta auth-footnote">
          new to website_support_studio?{" "}
          <a href="https://websitesupportstudio.com/pricing">join now</a>
        </p>
      </div>
    </div>
  );
}
