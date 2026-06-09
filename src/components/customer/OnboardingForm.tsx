/**
 * Stage B — customer onboarding form (the final "Become Customer" step).
 *
 * Resolves the owner's paid org (via claim, idempotent) and finalizes onboarding:
 * company, website, platform, contact, support email -> complete_paid_onboarding.
 * This is NOT the dashboard/portal — just the onboarding completion screen.
 */
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { LogoLockup } from "../brand/LogoLockup";
import { completePaidOnboarding } from "../../data/customerOnboarding";
import { resolveMyIdentity } from "../../data/identity";

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
  const [phase, setPhase] = useState<Phase>("loading");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setPhase("done");
      } else {
        setError("please fill the required fields (company, website, primary contact email).");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
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
            we couldn't find a paid plan for your account. if you just paid, use the same email you
            checked out with. otherwise, choose a plan to get started.
          </p>
          <a className="auth-btn auth-btn-ghost" href="https://websitesupportstudio.com/pricing">view plans</a>
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
            onboarding is complete. your workspace is being prepared and your team can start submitting
            requests soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <LogoLockup size={30} />
        <h1 className="auth-title">complete your setup</h1>
        <p className="auth-subtitle">tell us about your website so we can start operating it.</p>

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
