/**
 * Stage B — customer onboarding form (the final "Become Customer" step).
 *
 * Resolves the owner's paid org (via claim, idempotent) and finalizes onboarding:
 * company, website, platform, contact, support email -> complete_paid_onboarding.
 * This is NOT the dashboard/portal — just the onboarding completion screen.
 */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { LogoLockup } from "../brand/LogoLockup";
import { useAuth } from "../../auth/AuthProvider";
import { completePaidOnboarding } from "../../data/customerOnboarding";
import { resolveMyIdentity } from "../../data/identity";
import { trackEvent } from "../../analytics/ga4";

type Phase = "loading" | "form" | "done" | "no_org";

interface FormState {
  companyName: string;
  websiteUrl: string;
  websiteCount: string;
  cmsPlatform: string;
  primaryContactName: string;
  primaryContactEmail: string;
  supportEmail: string;
}

const EMPTY: FormState = {
  companyName: "",
  websiteUrl: "",
  websiteCount: "1",
  cmsPlatform: "",
  primaryContactName: "",
  primaryContactEmail: "",
  supportEmail: "",
};

export function OnboardingForm() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedOnboardingStarted = useRef(false);

  useEffect(() => {
    let active = true;
    resolveMyIdentity()
      .then((id) => {
        if (!active) {
          return;
        }
        // Operators must never enter customer onboarding — send them to the console.
        if (id.kind === "operator") {
          navigate("/", { replace: true });
        } else if (id.kind === "customer" && id.onboardingStatus === "complete") {
          setPhase("done");
        } else if (id.kind === "customer") {
          setOrgId(id.orgId);
          setPhase("form");
        } else {
          setPhase("no_org");
        }
      })
      .catch(() => {
        if (active) {
          setPhase("no_org");
        }
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (phase === "form" && !trackedOnboardingStarted.current) {
      trackedOnboardingStarted.current = true;
      trackEvent("onboarding_started");
    }
  }, [phase]);

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orgId) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await completePaidOnboarding({
        orgId,
        companyName: form.companyName,
        websiteUrl: form.websiteUrl,
        websiteCount: form.websiteCount ? parseInt(form.websiteCount, 10) : null,
        cmsPlatform: form.cmsPlatform,
        primaryContactName: form.primaryContactName,
        primaryContactEmail: form.primaryContactEmail,
        supportEmail: form.supportEmail,
      });
      if (res.onboarding_status === "complete") {
        trackEvent("onboarding_completed");
        setPhase("done");
      } else {
        setError("we could not finish setup yet. please check the required fields and try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "onboarding_failed";
      if (message === "not_org_owner") {
        setError("this account cannot complete onboarding. sign out and use the checkout email.");
      } else if (message === "org_not_found") {
        setError("we could not find the paid workspace for this account yet. sign out and try again.");
      } else if (message === "onboarding_failed") {
        setError("we could not save your setup. please check the form and try again.");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="auth-meta">loading onboarding…</p>
        </div>
      </div>
    );
  }

  if (phase === "no_org") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">no active plan found</h1>
          <p className="auth-meta">
            we couldn't link a paid plan to this sign-in yet. if you just checked out, use the same email
            you used at checkout and try again after signing out.
          </p>
          <p className="auth-meta">
            if you still do not see your plan, contact Corriston Consulting and we will check the customer
            record.
          </p>
          <div className="auth-actions">
            <button
              className="auth-btn auth-btn-ghost"
              type="button"
              onClick={() => {
                void signOut();
                navigate("/login", { replace: true });
              }}
            >
              sign out and try again
            </button>
            <a className="auth-btn auth-btn-ghost" href="https://websitesupportstudio.com/contact">
              contact Corriston Consulting
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">you're all set</h1>
          <p className="auth-meta">
            onboarding is complete. your website_support_studio workspace is ready. you can submit website
            requests and product feedback from there now.
          </p>
          <button className="auth-btn auth-btn-green" type="button" onClick={() => navigate("/", { replace: true })}>
            go to workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <LogoLockup size={30} />
        <h1 className="auth-title">finish onboarding</h1>
        <p className="auth-subtitle">use the same email you checked out with, then tell us about the website.</p>
        <p className="auth-meta">
          this step creates your workspace and first site record so the customer workspace can open next.
        </p>

        <label className="auth-field">
          <span className="auth-label">company *</span>
          <input className="auth-input" value={form.companyName} onChange={update("companyName")} required />
        </label>
        <label className="auth-field">
          <span className="auth-label">website url *</span>
          <input className="auth-input" type="url" placeholder="https://example.com" value={form.websiteUrl} onChange={update("websiteUrl")} required />
        </label>
        <label className="auth-field">
          <span className="auth-label">number of websites</span>
          <input className="auth-input" type="number" min="1" value={form.websiteCount} onChange={update("websiteCount")} />
        </label>
        <label className="auth-field">
          <span className="auth-label">platform / cms</span>
          <input className="auth-input" placeholder="WordPress, Shopify, Webflow…" value={form.cmsPlatform} onChange={update("cmsPlatform")} />
        </label>
        <label className="auth-field">
          <span className="auth-label">primary contact name</span>
          <input className="auth-input" value={form.primaryContactName} onChange={update("primaryContactName")} />
        </label>
        <label className="auth-field">
          <span className="auth-label">primary contact email *</span>
          <input className="auth-input" type="email" value={form.primaryContactEmail} onChange={update("primaryContactEmail")} required />
        </label>
        <label className="auth-field">
          <span className="auth-label">support email</span>
          <input className="auth-input" type="email" value={form.supportEmail} onChange={update("supportEmail")} />
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-btn auth-btn-green" type="submit" disabled={submitting}>
          {submitting ? "saving…" : "complete setup"}
        </button>
      </form>
    </div>
  );
}
