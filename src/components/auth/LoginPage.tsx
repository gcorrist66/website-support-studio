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
import { trackEvent } from "../../analytics/ga4";

export function LoginPage() {
  const { enabled, signInWithOAuth, error } = useAuth();
  const status = getAuthConfigStatus();
  const ready = enabled && status.configured;
  const publicHomeUrl = "https://www.websitesupportstudio.com/";

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
                trackEvent("click_google_login");
                void signInWithOAuth("google");
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              continue with google
            </button>
            <button
              className="auth-btn auth-btn-ghost"
              type="button"
              onClick={() => {
                trackEvent("click_microsoft_login");
                void signInWithOAuth("azure");
              }}
            >
              <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true" focusable="false">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#7FBA00" d="M12 1h10v10H12z" />
                <path fill="#00A4EF" d="M1 12h10v10H1z" />
                <path fill="#FFB900" d="M12 12h10v10H12z" />
              </svg>
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
        <p className="auth-meta auth-footnote">
          <a href={publicHomeUrl}>Back to Website Support Studio</a>
        </p>
      </div>
    </div>
  );
}
