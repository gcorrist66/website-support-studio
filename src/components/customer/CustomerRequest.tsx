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
import { loadMySites, type CustomerSite } from "../../data/customerWorkspace";
import { loadCustomerAccount, type CustomerAccount } from "../../data/customerAccount";

const SUPPORT_PRIORITIES = ["low", "normal", "high", "critical"] as const;

const FEEDBACK_CATEGORY_OPTIONS: ReadonlyArray<{
  value: FeedbackCategory;
  label: string;
  hint: string;
}> = [
  {
    value: "feedback",
    label: "Feedback",
    hint: "Something that is working well, confusing, or worth improving.",
  },
  {
    value: "feature_request",
    label: "Feature request",
    hint: "A new capability or workflow you want us to add.",
  },
  {
    value: "bug_report",
    label: "Bug report",
    hint: "A broken behavior, error, or unexpected result.",
  },
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

function formatCount(value: number | null): string {
  if (value === null) {
    return "not available";
  }
  return `${value}`;
}

function safeSiteLabel(site: CustomerSite | SiteOption | null | undefined): string {
  if (!site) {
    return "not linked yet";
  }
  if ("url" in site && typeof site.url === "string" && site.url.trim().length > 0) {
    return `${site.name} (${site.url})`;
  }
  return site.name;
}

function getPlanNote(
  account: Pick<CustomerAccount, "subscriptionStatus" | "currentPeriodEnd">
): string {
  if (!account.subscriptionStatus) {
    return "Plan details are still loading.";
  }
  if (account.subscriptionStatus === "trialing") {
    return account.currentPeriodEnd
      ? `Trial ends on ${formatDate(account.currentPeriodEnd)}.`
      : "Trialing right now.";
  }
  if (account.subscriptionStatus === "active") {
    return account.currentPeriodEnd
      ? `Renews on ${formatDate(account.currentPeriodEnd)}.`
      : "Active subscription.";
  }
  if (account.subscriptionStatus === "past_due") {
    return "Payment is past due. Please contact Corriston Consulting.";
  }
  if (account.subscriptionStatus === "canceled") {
    return "Subscription is canceled.";
  }
  return `Status: ${account.subscriptionStatus.replaceAll("_", " ")}.`;
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
      setError("Choose the website this request is about.");
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
        <h2>Request sent</h2>
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
          Keep the request ID if you need to reference this item later. Product feedback should go
          in the separate feedback form below.
        </p>
        <button className="auth-btn auth-btn-green" type="button" onClick={reset}>
          send another request
        </button>
      </section>
    );
  }

  return (
    <section className="customer-card customer-card-wide">
      <h2>Request website help</h2>
      <p className="customer-copy">
        Use this for work on your website. This goes into the internal support queue. Product
        feedback uses the separate form below and is for improving website_support_studio itself.
      </p>
      <p className="customer-smallprint">
        Examples: content updates, image swaps, plugin updates, landing page changes, and bug fixes.
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
            <span className="auth-meta">
              No website is linked yet. Finish onboarding first or contact Corriston Consulting.
            </span>
          ) : (
            <select
              className="auth-input"
              value={siteId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}
            >
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
          <select
            className="auth-input"
            value={priority}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value)}
          >
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

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="auth-btn auth-btn-green"
          type="submit"
          disabled={submitting || sites.length === 0}
        >
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
      setError("Choose the website this feedback is about.");
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
          Thanks. This was routed into the internal product-feedback queue for Corriston Consulting
          / website_support_studio.
        </p>
        <p className="customer-copy">
          <strong>Request ID:</strong> {result.ticket_number}
        </p>
        <p className="customer-copy">
          <strong>Status:</strong> {result.status}
        </p>
        <p className="customer-smallprint">
          Use this form for feedback, feature requests, bug reports, and product ideas about
          website_support_studio. Use the support request form above for work on your website.
        </p>
        <button className="auth-btn auth-btn-green" type="button" onClick={reset}>
          send more feedback
        </button>
      </section>
    );
  }

  return (
    <section className="customer-card customer-card-wide">
      <h2>Share product feedback</h2>
      <p className="customer-copy">
        Use this for feedback, feature requests, bug reports, or anything else about
        website_support_studio. For website fixes and support, use the request form above.
      </p>

      <form className="customer-form" onSubmit={onSubmit}>
        <label className="auth-field">
          <span className="auth-label">type *</span>
          <select
            className="auth-input"
            value={category}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value as FeedbackCategory)
            }
          >
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
            <span className="auth-meta">
              No website is linked yet. Finish onboarding first or contact Corriston Consulting.
            </span>
          ) : (
            <select
              className="auth-input"
              value={siteId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}
            >
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

        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          className="auth-btn auth-btn-green"
          type="submit"
          disabled={submitting || sites.length === 0}
        >
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
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [loading, setLoading] = useState(true);
  const currentSite = useMemo(() => sites[0] ?? null, [sites]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      const [accountRow, siteRows] = await Promise.all([
        loadCustomerAccount(identity.orgId),
        loadMySites(),
      ]);
      if (!active) {
        return;
      }
      setAccount(accountRow);
      setSites(siteRows);
      setLoading(false);
    }

    load().catch(() => {
      if (active) {
        setAccount(null);
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
          <p className="customer-kicker">website_support_studio customer workspace</p>
          <h1>your account at a glance</h1>
          <p className="customer-copy">
            This page answers the first post-checkout questions: who you are, what you bought, how
            much support you have, how Capacity Units work, and where to send requests or feedback.
          </p>
          <ul className="customer-section-strip" aria-label="workspace sections">
            <li>PROFILE</li>
            <li>PLAN</li>
            <li>CAPACITY</li>
            <li>REPLENISHMENT</li>
            <li>SUPPORT</li>
            <li>FEEDBACK</li>
            <li>LOGOUT</li>
          </ul>
          {account?.planName && account.planName !== "Plan not found" ? (
            <p className="customer-smallprint">
              You bought {account.planName} at {formatMoney(account.monthlyUsd)} with{" "}
              {formatCapacity(account.capacity.includedThisMonth)} Capacity Units each month.
            </p>
          ) : null}
        </div>
        <button
          className="auth-btn auth-btn-ghost customer-logout"
          type="button"
          onClick={() => {
            void signOut();
          }}
        >
          log out
        </button>
      </section>

      <div className="customer-grid">
        <section className="customer-card">
          <h2>Your account</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Logged in email</dt>
              <dd>{account?.customerEmail ?? user?.email ?? "not available"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>customer</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{account?.company ?? "your organization"}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{account?.website ?? safeSiteLabel(currentSite)}</dd>
            </div>
            <div>
              <dt>Current plan</dt>
              <dd>{account?.planName ?? "Plan not found"}</dd>
            </div>
            <div>
              <dt>Subscription status</dt>
              <dd>
                {account?.subscriptionStatus
                  ? account.subscriptionStatus.replaceAll("_", " ")
                  : "not available"}
              </dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            If you need to switch accounts, log out and sign in with the same email you used at
            checkout.
          </p>
        </section>

        <section className="customer-card">
          <h2>How Capacity Units work</h2>
          <p className="customer-copy">
            Capacity Units are the monthly support allowance included with your plan.
          </p>
          <p className="customer-smallprint">
            {account?.capacity.trackingNote ?? "Usage is being tracked manually during the pilot."}
          </p>
          <dl className="customer-definition-list">
            <div>
              <dt>Included this month</dt>
              <dd>{formatCapacity(account?.capacity.includedThisMonth ?? null)}</dd>
            </div>
            <div>
              <dt>Used this month</dt>
              <dd>{formatCapacity(account?.capacity.usedThisMonth ?? null)}</dd>
            </div>
            <div>
              <dt>Remaining this month</dt>
              <dd>{formatCapacity(account?.capacity.remainingThisMonth ?? null)}</dd>
            </div>
          </dl>
          <ul className="customer-bullet-list">
            {(account?.effortLevels ?? []).map((item) => (
              <li key={item.key}>
                <strong>{item.name}:</strong> {item.summary} Examples: {item.examples.join(", ")}
              </li>
            ))}
          </ul>
          <p className="customer-smallprint">
            Usage is estimated/manual during the pilot. Low effort means fewer units, medium effort
            means more, and high effort means the most.
          </p>
          <p className="customer-smallprint">
            Low effort examples include content updates and image swaps. Medium effort examples
            include plugin updates and landing page changes. High effort examples include bug fixes
            and more complex site work.
          </p>
        </section>

        <section className="customer-card">
          <h2>What you bought</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Current plan</dt>
              <dd>{account?.planName ?? "Plan not found"}</dd>
            </div>
            <div>
              <dt>Monthly price</dt>
              <dd>{formatMoney(account?.monthlyUsd ?? null)}</dd>
            </div>
            <div>
              <dt>Subscription status</dt>
              <dd>
                {account?.subscriptionStatus
                  ? account.subscriptionStatus.replaceAll("_", " ")
                  : "not available"}
              </dd>
            </div>
            <div>
              <dt>Renewal / trial</dt>
              <dd>
                {getPlanNote(account ?? { subscriptionStatus: null, currentPeriodEnd: null })}
              </dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            What you bought:{" "}
            {account?.billingMessage ?? "Pricing is confirmed during checkout or support."}
          </p>
          <p className="customer-smallprint">
            Need to change your plan or add more Capacity Units? Contact Corriston Consulting. If
            the plan looks wrong, sign out and use the checkout email again.
          </p>
          <p className="customer-smallprint">
            Pricing is confirmed during checkout and support if a custom plan or top-up is needed.
          </p>
          <a className="auth-btn auth-btn-ghost" href="https://websitesupportstudio.com/contact">
            contact Corriston Consulting
          </a>
        </section>

        <section className="customer-card">
          <h2>Replenishment</h2>
          <p className="customer-copy">
            {account?.replenishment.refresh ??
              "your capacity units refresh at the start of each billing period."}
          </p>
          <p className="customer-smallprint">
            need more capacity units in a busy month? additional capacity units are available by
            contacting Corriston Consulting.
          </p>
          <p className="customer-smallprint">
            {account?.replenishment.note ??
              "Top-ups can be arranged at any time through Corriston Consulting."}
          </p>
          <p className="customer-smallprint">
            {account?.replenishment.topups?.length
              ? `Available top-ups: ${account.replenishment.topups
                  .map(
                    (topup) =>
                      `${topup.name}${topup.priceUsd === null ? "" : ` (${formatMoney(topup.priceUsd)})`}`
                  )
                  .join(", ")}.`
              : "Top-ups are confirmed during checkout or support."}
          </p>
        </section>

        <section className="customer-card">
          <h2>Activity summary</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Support requests</dt>
              <dd>{formatCount(account?.supportRequestCount ?? null)}</dd>
            </div>
            <div>
              <dt>Product feedback</dt>
              <dd>{formatCount(account?.productFeedbackCount ?? null)}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            Support requests are work on your website. Product feedback is about improving
            website_support_studio itself.
          </p>
        </section>

        <section className="customer-card">
          <h2>Support and feedback</h2>
          <p className="customer-copy">
            Support request means work on your website. Product feedback means improving
            website_support_studio itself.
          </p>
          <ul className="customer-bullet-list">
            <li>
              <strong>Support request:</strong> content updates, image swaps, plugin updates,
              landing page changes, and bug fixes.
            </li>
            <li>
              <strong>Product feedback:</strong> ideas, confusion, feature requests, or bug reports
              about website_support_studio.
            </li>
            <li>
              <strong>After you submit:</strong> you get a request ID and the item enters the
              internal queue for review.
            </li>
          </ul>
          <p className="customer-smallprint">
            Onboarding status is still tracked in the account summary above so you can tell whether
            setup is complete.
          </p>
        </section>
      </div>

      <div className="customer-grid">
        <SupportRequestPanel sites={sites} />
        <ProductFeedbackPanel sites={sites} />
      </div>

      {loading ? <p className="customer-loading">Loading your account…</p> : null}
      {!loading && sites.length === 0 ? (
        <p className="customer-loading">
          No websites are linked yet. If you just signed up, finish onboarding or sign out and use
          the checkout email again.
        </p>
      ) : null}
    </div>
  );
}
