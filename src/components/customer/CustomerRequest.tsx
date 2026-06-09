/**
 * Customer workspace — account, billing, capacity, and request submission.
 *
 * This is the authenticated customer experience after onboarding. It keeps the surface simple:
 * account/profile visibility, plan visibility, Capacity Units, a normal support request form, and
 * a separate product-feedback form that routes into the same internal request queue.
 */
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { LogoLockup } from "../brand/LogoLockup";
import { useAuth } from "../../auth/AuthProvider";
import type { Identity } from "../../data/identity";
import {
  submitCustomerFeedback,
  submitCustomerRequest,
  type FeedbackCategory,
  type SiteOption,
  type SubmitRequestResult,
} from "../../data/customerRequests";
import {
  createEmptyCustomerWorkspaceSummary,
  loadCustomerWorkspaceSummary,
  loadMySites,
  type CustomerSite,
  type CustomerWorkspaceSummary,
} from "../../data/customerWorkspace";

const SUPPORT_PRIORITIES = ["low", "normal", "high", "critical"] as const;

const FEEDBACK_CATEGORY_OPTIONS: ReadonlyArray<{ value: FeedbackCategory; label: string; hint: string }> = [
  { value: "feedback", label: "Feedback", hint: "Something that is working well, confusing, or worth improving." },
  { value: "feature_request", label: "Feature request", hint: "A new capability or workflow you want us to add." },
  { value: "bug_report", label: "Bug report", hint: "A broken behavior, error, or unexpected result." },
  { value: "other", label: "Other", hint: "Anything that does not fit the categories above." },
];

function formatMoney(monthlyUsd: number | null): string {
  if (monthlyUsd === null) {
    return "custom pricing";
  }
  return `$${monthlyUsd.toLocaleString("en-US")} / month`;
}

function formatDate(iso: string | null): string {
  if (!iso) {
    return "not available";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "not available";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCapacity(value: number | null): string {
  return value === null ? "not tracked yet" : `${value}`;
}

function safeSiteLabel(site: CustomerSite | SiteOption | null | undefined): string {
  if (!site) {
    return "not set";
  }
  return site.name;
}

function getPlanNote(summary: CustomerWorkspaceSummary): string {
  if (!summary.subscriptionStatus) {
    return "Plan details are still loading.";
  }
  if (summary.subscriptionStatus === "trialing") {
    return summary.currentPeriodEnd ? `Trial ends on ${formatDate(summary.currentPeriodEnd)}.` : "Trialing right now.";
  }
  if (summary.subscriptionStatus === "active") {
    return summary.currentPeriodEnd ? `Renews on ${formatDate(summary.currentPeriodEnd)}.` : "Active subscription.";
  }
  if (summary.subscriptionStatus === "past_due") {
    return "Payment is past due. Please contact Corriston Consulting.";
  }
  if (summary.subscriptionStatus === "canceled") {
    return "Subscription is canceled.";
  }
  return `Status: ${summary.subscriptionStatus.replaceAll("_", " ")}.`;
}

function formatRequestError(message: string): string {
  if (message === "submit_failed") {
    return "We couldn't submit this request. Please check the website selection and try again.";
  }
  return message;
}

function formatFeedbackError(message: string): string {
  if (message === "submit_failed") {
    return "We couldn't send this feedback. Please check the website selection and try again.";
  }
  return message;
}

function SupportRequestPanel({ sites }: { sites: CustomerSite[] }) {
  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitRequestResult | null>(null);

  useEffect(() => {
    if (sites.length > 0 && !siteId) {
      setSiteId(sites[0].id);
    }
  }, [sites, siteId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!siteId) {
      setError("Please select a website.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitCustomerRequest({
        siteId,
        title,
        description,
        priority,
      });
      setResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "submit_failed";
      setError(formatRequestError(message));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setTitle("");
    setDescription("");
    setPriority("normal");
    setError(null);
  }

  if (result) {
    return (
      <section className="customer-card customer-card-wide">
        <h2>Website support request sent</h2>
        <p className="customer-copy">
          Your request is now in the internal support queue and a human will review it.
        </p>
        <p className="customer-copy">
          <strong>Request ID:</strong> {result.ticket_number}
        </p>
        <p className="customer-copy">
          <strong>Status:</strong> {result.status}
        </p>
        <p className="customer-smallprint">
          Keep the request ID if you need to reference this item later. Product feedback should go in the
          separate feedback form below.
        </p>
        <button className="auth-btn auth-btn-green" type="button" onClick={reset}>
          send another request
        </button>
      </section>
    );
  }

  return (
    <section className="customer-card customer-card-wide">
      <h2>Send website support request</h2>
      <p className="customer-copy">
        Use this for website changes, fixes, and support requests. This goes into the internal WSS queue.
        Product feedback uses the separate form below.
      </p>

      <form className="customer-form" onSubmit={onSubmit}>
        <label className="auth-field">
          <span className="auth-label">request summary *</span>
          <input
            className="auth-input"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">website *</span>
          {sites.length === 0 ? (
            <span className="auth-meta">No website is linked yet. Finish onboarding first or contact Corriston Consulting.</span>
          ) : (
            <select className="auth-input" value={siteId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="auth-field">
          <span className="auth-label">priority</span>
          <select className="auth-input" value={priority} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value)}>
            {SUPPORT_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field">
          <span className="auth-label">details</span>
          <textarea
            className="auth-input"
            rows={5}
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="What would you like changed or fixed?"
          />
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-btn auth-btn-green" type="submit" disabled={submitting || sites.length === 0}>
          {submitting ? "submitting…" : "submit request"}
        </button>
      </form>
    </section>
  );
}

function ProductFeedbackPanel({ sites }: { sites: CustomerSite[] }) {
  const [siteId, setSiteId] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("feedback");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitRequestResult | null>(null);

  useEffect(() => {
    if (sites.length > 0 && !siteId) {
      setSiteId(sites[0].id);
    }
  }, [sites, siteId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!siteId) {
      setError("Please select a website.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitCustomerFeedback({
        siteId,
        category,
        subject,
        details,
      });
      setResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "submit_failed";
      setError(formatFeedbackError(message));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setCategory("feedback");
    setSubject("");
    setDetails("");
    setError(null);
  }

  if (result) {
    return (
      <section className="customer-card customer-card-wide">
        <h2>Product feedback sent</h2>
        <p className="customer-copy">
          Thanks. This was routed into the internal product-feedback queue for Corriston Consulting / WSS.
        </p>
        <p className="customer-copy">
          <strong>Request ID:</strong> {result.ticket_number}
        </p>
        <p className="customer-copy">
          <strong>Status:</strong> {result.status}
        </p>
        <p className="customer-smallprint">
          Use this form for feedback, feature requests, bug reports, and product ideas. Use the support
          request form above for website fixes and support.
        </p>
        <button className="auth-btn auth-btn-green" type="button" onClick={reset}>
          send more feedback
        </button>
      </section>
    );
  }

  return (
    <section className="customer-card customer-card-wide">
      <h2>Send product feedback</h2>
      <p className="customer-copy">
        Use this for feedback, feature requests, bug reports, or anything else about Website Support Studio.
        For website fixes and support, use the request form above.
      </p>

      <form className="customer-form" onSubmit={onSubmit}>
        <label className="auth-field">
          <span className="auth-label">type *</span>
          <select className="auth-input" value={category} onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as FeedbackCategory)}>
            {FEEDBACK_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="auth-field">
          <span className="auth-label">website *</span>
          {sites.length === 0 ? (
            <span className="auth-meta">no website on file yet.</span>
          ) : (
            <select className="auth-input" value={siteId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="auth-field">
          <span className="auth-label">subject *</span>
          <input
            className="auth-input"
            value={subject}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
            required
            placeholder="Short summary"
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">details</span>
          <textarea
            className="auth-input"
            rows={5}
            value={details}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDetails(e.target.value)}
            placeholder="Tell us what's helpful, confusing, broken, or missing."
          />
        </label>

        <div className="customer-feedback-hint" aria-live="polite">
          {FEEDBACK_CATEGORY_OPTIONS.find((option) => option.value === category)?.hint}
        </div>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-btn auth-btn-green" type="submit" disabled={submitting || sites.length === 0}>
          {submitting ? "sending…" : "send product feedback"}
        </button>
      </form>
    </section>
  );
}

type CustomerRequestProps = {
  identity: Extract<Identity, { kind: "customer" }>;
};

export function CustomerRequest({ identity }: CustomerRequestProps) {
  const { user, signOut } = useAuth();
  const [summary, setSummary] = useState<CustomerWorkspaceSummary>(createEmptyCustomerWorkspaceSummary());
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [loading, setLoading] = useState(true);
  const currentSite = useMemo(() => sites[0] ?? null, [sites]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      const [workspaceSummary, siteRows] = await Promise.all([
        loadCustomerWorkspaceSummary(identity.orgId),
        loadMySites(),
      ]);
      if (!active) {
        return;
      }
      setSummary(workspaceSummary);
      setSites(siteRows);
      setLoading(false);
    }

    load().catch(() => {
      if (active) {
        setSummary(createEmptyCustomerWorkspaceSummary());
        setSites([]);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [identity.orgId]);

  return (
    <div className="customer-shell">
      <section className="customer-hero">
        <div>
          <LogoLockup size={30} />
          <p className="customer-kicker">customer workspace</p>
          <h1>your account at a glance</h1>
          <p className="customer-copy">
            Everything important is in one place: who you are logged in as, what plan you are on, how
            much support capacity you have, and how to reach us.
          </p>
        </div>
        <button className="auth-btn auth-btn-ghost customer-logout" type="button" onClick={() => { void signOut(); }}>
          log out
        </button>
      </section>

      <div className="customer-grid">
        <section className="customer-card">
          <h2>Account profile</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Logged in email</dt>
              <dd>{user?.email ?? "not available"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>customer</dd>
            </div>
            <div>
              <dt>Organization</dt>
              <dd>{summary.orgName}</dd>
            </div>
            <div>
              <dt>Current site</dt>
              <dd>{safeSiteLabel(currentSite)}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            If you need to switch accounts, log out and sign in with the same email you used at checkout.
          </p>
        </section>

        <section className="customer-card">
          <h2>Billing and plan</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Current plan</dt>
              <dd>{summary.planName}</dd>
            </div>
            <div>
              <dt>Monthly price</dt>
              <dd>{formatMoney(summary.monthlyUsd)}</dd>
            </div>
            <div>
              <dt>Subscription status</dt>
              <dd>{summary.subscriptionStatus ? summary.subscriptionStatus.replaceAll("_", " ") : "not available"}</dd>
            </div>
            <div>
              <dt>Renewal / trial</dt>
              <dd>{getPlanNote(summary)}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            Need to change your plan? Contact Corriston Consulting. If the plan looks wrong, sign out and
            use the checkout email again.
          </p>
          <a className="auth-btn auth-btn-ghost" href="https://websitesupportstudio.com/contact">
            contact Corriston Consulting
          </a>
        </section>

        <section className="customer-card">
          <h2>Capacity Units</h2>
          <p className="customer-copy">
            Capacity Units are the monthly support allowance included with your plan.
          </p>
          <dl className="customer-definition-list">
            <div>
              <dt>Included this month</dt>
              <dd>{formatCapacity(summary.capacityIncluded)}</dd>
            </div>
            <div>
              <dt>Used this month</dt>
              <dd>{formatCapacity(summary.capacityUsed)}</dd>
            </div>
            <div>
              <dt>Remaining this month</dt>
              <dd>{formatCapacity(summary.capacityRemaining)}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            Usage tracking is not connected yet, so the used and remaining values are shown as a safe
            placeholder.
          </p>
        </section>

        <section className="customer-card">
          <h2>Support status</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Onboarding</dt>
              <dd>
                {summary.onboardingStatus === null
                  ? "not available"
                  : summary.onboardingStatus === "complete"
                    ? "complete"
                    : "in progress"}
              </dd>
            </div>
            <div>
              <dt>Website count</dt>
              <dd>{summary.websiteCount === null ? "not available" : summary.websiteCount}</dd>
            </div>
            <div>
              <dt>Primary contact</dt>
              <dd>{summary.primaryContactEmail ?? "not available"}</dd>
            </div>
            <div>
              <dt>Support email</dt>
              <dd>{summary.supportEmail ?? "not available"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="customer-grid">
        <SupportRequestPanel sites={sites} />
        <ProductFeedbackPanel sites={sites} />
      </div>

      {loading ? <p className="customer-loading">Loading your account…</p> : null}
      {!loading && sites.length === 0 ? (
        <p className="customer-loading">
          No websites are linked yet. If you just signed up, finish onboarding or sign out and use the
          checkout email again.
        </p>
      ) : null}
    </div>
  );
}
