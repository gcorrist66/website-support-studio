/**
 * Customer workspace — profile, requests, capacity, and feedback.
 *
 * This view keeps the support surface small: the account summary stays visible,
 * request creation happens through a dedicated `_new_request` composer, and recent
 * requests stay easy to inspect with their uploaded files.
 */
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { LogoLockup } from "../brand/LogoLockup";
import { useAuth } from "../../auth/AuthProvider";
import type { Identity } from "../../data/identity";
import { RequestComposer } from "./RequestComposer";
import {
  submitCustomerFeedback,
  type FeedbackCategory,
  type SiteOption,
  type SubmitRequestResult,
  type CustomerRequestRecord,
  loadMyRequests,
} from "../../data/customerRequests";
import {
  createEmptyCustomerWorkspaceSummary,
  loadCustomerWorkspaceSummary,
  loadMySites,
  type CustomerSite,
  type CustomerWorkspaceSummary,
} from "../../data/customerWorkspace";
import { loadMyProjects, type CustomerProject } from "../../data/customerProjects";
import { MyWebsiteProjectPanel } from "./MyWebsiteProjectPanel";

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

function formatDateTime(iso: string | null): string {
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
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCapacity(value: number | null): string {
  return value === null ? "not tracked yet" : `${value}`;
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

function getCapacityEffortExamples(): Array<{ title: string; examples: string }> {
  return [
    {
      title: "Low effort",
      examples: "content update, image swap, typo fix",
    },
    {
      title: "Medium effort",
      examples: "plugin update, landing page change, form adjustment",
    },
    {
      title: "High effort",
      examples: "bug fix, multi-step site change, layout repair",
    },
  ];
}

function getCapacityExplainer(): string {
  return "Capacity Units are the monthly support allowance included with your plan. Small requests use fewer units; bigger requests use more.";
}

function getWhatYouBought(summary: CustomerWorkspaceSummary): string {
  if (summary.planName === "Plan not found") {
    return "Your plan details will appear here after checkout is linked to this account.";
  }
  const price = formatMoney(summary.monthlyUsd);
  const capacity = formatCapacity(summary.capacityIncluded);
  return `You bought ${summary.planName} at ${price}. It includes ${capacity} Capacity Units each month for website support.`;
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

function formatFeedbackError(message: string): string {
  if (message === "submit_failed") {
    return "We couldn't send this feedback. Please check the website selection and try again.";
  }
  return message;
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
          Thanks. This was routed into the internal product-feedback queue for Corriston Consulting /
          website_support_studio.
        </p>
        <p className="customer-copy">
          <strong>Request ID:</strong> {result.ticket_number}
        </p>
        <p className="customer-copy">
          <strong>Status:</strong> {result.status}
        </p>
        <p className="customer-smallprint">
          Use this form for feedback, feature requests, bug reports, and product ideas about
          website_support_studio. Use the _new_request launcher for work on your website.
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
        Use this for feedback, feature requests, bug reports, or anything else about website_support_studio.
        Use the _new_request launcher for website work.
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

function AttachmentPreview({ attachment }: { attachment: CustomerRequestRecord["attachments"][number] }) {
  const isImage = attachment.mimeType.startsWith("image/");
  return (
    <article className="customer-request-attachment-card">
      {isImage ? (
        <img src={attachment.publicUrl} alt={attachment.fileName} className="customer-request-thumbnail" />
      ) : (
        <div className="customer-request-file-mark">{attachment.mimeType.split("/").at(-1) ?? "file"}</div>
      )}
      <div className="customer-request-attachment-body">
        <strong>{attachment.fileName}</strong>
        <span>{formatDateTime(attachment.createdAt)}</span>
        <div className="customer-request-attachment-actions">
          <a href={attachment.publicUrl} target="_blank" rel="noreferrer">open</a>
          <a href={attachment.publicUrl} download={attachment.fileName}>download</a>
        </div>
      </div>
    </article>
  );
}

function RecentRequestsPanel({
  requests,
  selectedRequestId,
  onSelectRequest,
}: {
  requests: CustomerRequestRecord[];
  selectedRequestId: string;
  onSelectRequest: (requestId: string) => void;
}) {
  const selectedRequest = useMemo(
    () => requests.find((request) => request.ticketId === selectedRequestId) ?? requests[0] ?? null,
    [requests, selectedRequestId],
  );

  return (
    <section className="customer-card customer-card-wide">
      <h2>recent_requests</h2>
      <p className="customer-copy">
        Requests appear here as soon as they are submitted. Attachments stay visible with the request.
      </p>

      <div className="customer-request-split">
        <div className="customer-request-list">
          {requests.length === 0 ? (
            <p className="customer-loading">No requests yet. Start with _new_request.</p>
          ) : (
            requests.map((request) => (
              <button
                key={request.ticketId}
                type="button"
                className={request.ticketId === selectedRequest?.ticketId ? "customer-request-row is-active" : "customer-request-row"}
                onClick={() => onSelectRequest(request.ticketId)}
              >
                <strong>{request.title}</strong>
                <span>
                  {request.siteName} · {request.priority}
                </span>
                <span>
                  {request.status.replaceAll("_", " ")} · {request.attachments.length} attachment{request.attachments.length === 1 ? "" : "s"}
                </span>
              </button>
            ))
          )}
        </div>

        <article className="customer-request-detail">
          {selectedRequest ? (
            <>
              <h3>{selectedRequest.title}</h3>
              <p className="customer-copy">
                <strong>{selectedRequest.ticketNumber}</strong> · {selectedRequest.siteName}
              </p>
              <dl className="customer-definition-list">
                <div>
                  <dt>Status</dt>
                  <dd>{selectedRequest.status.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>Priority</dt>
                  <dd>{selectedRequest.priority}</dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDateTime(selectedRequest.createdAt)}</dd>
                </div>
              </dl>

              <h4>Attachments</h4>
              {selectedRequest.attachments.length === 0 ? (
                <p className="customer-smallprint">No attachments on this request.</p>
              ) : (
                <div className="customer-request-attachments">
                  {selectedRequest.attachments.map((attachment) => (
                    <AttachmentPreview key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="customer-loading">Submit a request to see it here.</p>
          )}
        </article>
      </div>
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
  const [requests, setRequests] = useState<CustomerRequestRecord[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const currentSite = useMemo(() => sites[0] ?? null, [sites]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadingRequests(true);
    setLoadingProjects(true);

    async function load() {
      const [workspaceSummary, siteRows, requestRows, projectRows] = await Promise.all([
        loadCustomerWorkspaceSummary(identity.orgId),
        loadMySites(),
        loadMyRequests(identity.orgId),
        loadMyProjects(),
      ]);
      if (!active) {
        return;
      }
      setSummary(workspaceSummary);
      setSites(siteRows);
      setRequests(requestRows);
      setProjects(projectRows);
      setSelectedRequestId(requestRows[0]?.ticketId ?? "");
      setLoading(false);
      setLoadingRequests(false);
      setLoadingProjects(false);
    }

    load().catch(() => {
      if (active) {
        setSummary(createEmptyCustomerWorkspaceSummary());
        setSites([]);
        setRequests([]);
        setProjects([]);
        setSelectedRequestId("");
        setLoading(false);
        setLoadingRequests(false);
        setLoadingProjects(false);
      }
    });

    return () => {
      active = false;
    };
  }, [identity.orgId]);

  function handleRequestCreated(request: CustomerRequestRecord) {
    setRequests((current) => [request, ...current.filter((item) => item.ticketId !== request.ticketId)]);
    setSelectedRequestId(request.ticketId);
  }

  return (
    <div className="customer-shell">
      <section className="customer-hero">
        <div>
          <LogoLockup size={30} />
          <p className="customer-kicker">website_support_studio customer profile</p>
          <h1>your profile at a glance</h1>
          <p className="customer-copy">
            This page answers the first questions after checkout: who you are, what you bought, what
            happens next, how support works, and where to send feedback.
          </p>
          {summary.planName !== "Plan not found" ? (
            <p className="customer-smallprint">
              {getWhatYouBought(summary)}
            </p>
          ) : null}
        </div>
        <div className="customer-hero-actions">
          <RequestComposer sites={sites} onCreated={handleRequestCreated} />
          <button className="auth-btn auth-btn-ghost customer-logout" type="button" onClick={() => { void signOut(); }}>
            log out
          </button>
        </div>
      </section>

      <div className="customer-grid">
        <section className="customer-card">
          <h2>your_profile</h2>
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
              <dt>Company</dt>
              <dd>{summary.orgName}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{safeSiteLabel(currentSite)}</dd>
            </div>
            <div>
              <dt>Current plan</dt>
              <dd>{summary.planName}</dd>
            </div>
            <div>
              <dt>Subscription status</dt>
              <dd>{summary.subscriptionStatus ? summary.subscriptionStatus.replaceAll("_", " ") : "not available"}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            If you need to switch profiles, log out and sign in with the same email you used at checkout.
          </p>
        </section>

        <section className="customer-card">
          <h2>How Capacity Units work</h2>
          <p className="customer-copy">{getCapacityExplainer()}</p>
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
          <ul className="customer-bullet-list">
            {getCapacityEffortExamples().map((item) => (
              <li key={item.title}>
                <strong>{item.title}:</strong> {item.examples}
              </li>
            ))}
          </ul>
          <p className="customer-smallprint">
            When you run out, requests wait until the next monthly refresh or until additional Capacity
            Units are added. Need more? Contact Corriston Consulting to add more support capacity.
          </p>
          <a className="auth-btn auth-btn-ghost" href="https://websitesupportstudio.com/contact">
            contact Corriston Consulting
          </a>
        </section>

        <section className="customer-card">
          <h2>What you bought</h2>
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
            Need to change your plan or add more Capacity Units? Contact Corriston Consulting. If the plan
            looks wrong, sign out and use the checkout email again.
          </p>
          <a className="auth-btn auth-btn-ghost" href="https://websitesupportstudio.com/contact">
            contact Corriston Consulting
          </a>
        </section>
      </div>

      <MyWebsiteProjectPanel projects={projects} loading={loadingProjects} />

      <div className="customer-grid">
        <RecentRequestsPanel
          requests={requests}
          selectedRequestId={selectedRequestId}
          onSelectRequest={setSelectedRequestId}
        />
        <ProductFeedbackPanel sites={sites} />
      </div>

      {loading ? <p className="customer-loading">Loading your profile…</p> : null}
      {loadingRequests ? <p className="customer-loading">Loading recent requests…</p> : null}
      {!loading && sites.length === 0 ? (
        <p className="customer-loading">
          No websites are linked yet. If you just signed up, finish onboarding or sign out and use the
          checkout email again.
        </p>
      ) : null}
    </div>
  );
}
