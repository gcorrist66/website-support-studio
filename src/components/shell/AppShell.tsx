import { useEffect, useMemo, useState, type FormEvent } from "react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { LogoLockup } from "../brand/LogoLockup";
import { MonoLabel } from "../brand/MonoLabel";
import { submitCustomerFeedback, type FeedbackCategory } from "../../data/customerRequests";
import { loadOperatorPilotStatus, createEmptyOperatorPilotStatus, type OperatorPilotStatus } from "../../data/operatorPilotStatus";
import { auditTrail, ticketDetails, ticketQueue, type MockAuditEvent, type MockTicketDetail, type MockTicketQueueItem } from "../../ui/mockData";

type ConsoleSection = "overview" | "board" | "requests" | "account" | "website_access" | "activity" | "health";
type FeedbackTab = "bug_report" | "feature_request" | "general_feedback";

const SECTION_ORDER: ConsoleSection[] = [
  "overview",
  "board",
  "requests",
  "account",
  "website_access",
  "activity",
  "health",
];

const FEEDBACK_TABS: Array<{ key: FeedbackTab; label: string; category: FeedbackCategory; hint: string }> = [
  {
    key: "bug_report",
    label: "bug_report",
    category: "bug_report",
    hint: "Something is broken, confusing, or behaving unexpectedly.",
  },
  {
    key: "feature_request",
    label: "feature_request",
    category: "feature_request",
    hint: "A workflow or capability you want to add.",
  },
  {
    key: "general_feedback",
    label: "general_feedback",
    category: "feedback",
    hint: "General comments, praise, or process notes.",
  },
];

const ACCOUNT_SUMMARY = {
  profile: "gary",
  company: "north_coast_retail",
  website: "northcoast.example",
  currentPlan: "operations",
  billingStatus: "active",
  creditsIncluded: 40,
  creditsUsed: 22,
  creditsRemaining: 18,
  lowEffortExplanation: "small edits, content swaps, and quick fixes usually stay within the included allowance.",
  mediumEffortExplanation: "single-page changes, plugin updates, and structured content work use more capacity.",
  highEffortExplanation: "multi-step repairs, staging coordination, and broader site changes consume the most capacity.",
  replenishmentMessaging:
    "when credits run low, lower-effort requests stay visible while bigger work is queued until replenishment.",
};

const WEBSITE_ACCESS_GROUPS = [
  {
    key: "required",
    label: "required",
    tone: "blue",
    items: [
      "WordPress admin access for content edits, plugin work, and theme configuration.",
      "Hosting access when we need deployment controls, file access, or environment settings.",
      "DNS / domain access when routing, records, or certificate work is part of the request.",
    ],
  },
  {
    key: "recommended",
    label: "recommended",
    tone: "amber",
    items: [
      "Theme and plugin access so we can resolve layout or integration issues faster.",
      "CMS access for page edits, structured content updates, and reusable blocks.",
      "Staging access so we can verify changes before anything touches production.",
    ],
  },
  {
    key: "optional",
    label: "optional",
    tone: "mulberry",
    items: [
      "Backup guidance if you already have a preferred recovery or snapshot routine.",
      "Design system notes when brand assets or editorial rules are important.",
      "Analytics or reporting access only if a specific request needs it. Not required for normal support.",
    ],
  },
] as const;

const ACTIVE_REQUEST_STATUSES = new Set<MockTicketQueueItem["status"]>([
  "received",
  "triaged",
  "blocked",
  "awaiting_gary_approval",
  "reply_drafted",
  "approved_to_send",
]);

function getSectionFromPath(pathname: string): ConsoleSection {
  const cleaned = pathname.replace(/\/+$/, "");
  const segment = cleaned.split("/").filter(Boolean)[0];
  if (segment && SECTION_ORDER.includes(segment as ConsoleSection)) {
    return segment as ConsoleSection;
  }
  return "overview";
}

function isSectionPath(pathname: string): boolean {
  return SECTION_ORDER.some((section) => pathname === `/${section}` || pathname.startsWith(`/${section}/`));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "not available";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? "not available" : value.toLocaleString("en-US");
}

function formatPriority(priority: MockTicketQueueItem["priority"]): string {
  return priority;
}

function boardLaneForTicket(ticket: MockTicketQueueItem): "new" | "triage" | "waiting_on_us" | "waiting_on_customer" | "review" | "complete" {
  switch (ticket.status) {
    case "received":
      return "new";
    case "triaged":
      return "triage";
    case "blocked":
      return ticket.blockedReason?.toLowerCase().includes("customer") ? "waiting_on_customer" : "waiting_on_us";
    case "reply_drafted":
    case "awaiting_gary_approval":
    case "approved_to_send":
      return "review";
    case "sent_to_customer":
    case "closed":
      return "complete";
    default:
      return "new";
  }
}

function getTicketDetail(ticketId: string): MockTicketDetail {
  return ticketDetails.find((ticket) => ticket.id === ticketId) ?? ticketDetails[0];
}

function getRecentEvents(): MockAuditEvent[] {
  return [...auditTrail].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function OverviewCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="wss-stat-card">
      <p className="wss-card-kicker">
        <MonoLabel text={title} />
      </p>
      <strong className="wss-stat-value">{value}</strong>
      <p className="wss-card-note">{note}</p>
    </article>
  );
}

function SectionHeading({
  title,
  eyebrow,
  description,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
}) {
  return (
    <div className="wss-section-heading">
      {eyebrow ? (
        <p className="wss-card-kicker">
          <MonoLabel text={eyebrow} />
        </p>
      ) : null}
      <h2>
        <MonoLabel text={title} />
      </h2>
      {description ? <p className="wss-section-description">{description}</p> : null}
    </div>
  );
}

function FeedbackModal({
  open,
  onClose,
  defaultSiteId,
}: {
  open: boolean;
  onClose: () => void;
  defaultSiteId: string;
}) {
  const [tab, setTab] = useState<FeedbackTab>("general_feedback");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ ticketNumber: string; ticketId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTab("general_feedback");
      setBody("");
      setSubmitting(false);
      setSubmitted(null);
      setError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      setError("please add a short note before sending.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const selected = FEEDBACK_TABS.find((item) => item.key === tab) ?? FEEDBACK_TABS[2];
      const result = await submitCustomerFeedback({
        siteId: defaultSiteId,
        category: selected.category,
        subject: selected.label,
        details: body.trim(),
      });
      setSubmitted({
        ticketId: result.ticket_id,
        ticketNumber: result.ticket_number,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "feedback_submit_failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wss-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="wss-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wss-modal-header">
          <div>
            <p className="wss-card-kicker">
              <MonoLabel text="feedback" />
            </p>
            <h2 id="feedback-modal-title">
              <MonoLabel text="send feedback" />
            </h2>
          </div>
          <button type="button" className="wss-icon-button" onClick={onClose} aria-label="close feedback modal">
            ×
          </button>
        </div>

        {submitted ? (
          <div className="wss-modal-success">
            <p className="wss-section-description">
              feedback is in the queue for website_support_studio review.
            </p>
            <p className="wss-copy">
              <strong>request id:</strong> {submitted.ticketNumber} ({submitted.ticketId})
            </p>
            <div className="wss-modal-actions">
              <button
                type="button"
                className="wss-primary-button"
                onClick={() => {
                  setSubmitted(null);
                  setBody("");
                }}
              >
                send another
              </button>
              <button type="button" className="wss-secondary-button" onClick={onClose}>
                close
              </button>
            </div>
          </div>
        ) : (
          <form className="wss-feedback-form" onSubmit={handleSubmit}>
            <div className="wss-tab-row" role="tablist" aria-label="feedback categories">
              {FEEDBACK_TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  className={tab === item.key ? "wss-tab is-active" : "wss-tab"}
                  onClick={() => setTab(item.key)}
                >
                  <MonoLabel text={item.label} />
                </button>
              ))}
            </div>

            <p className="wss-section-description">
              {FEEDBACK_TABS.find((item) => item.key === tab)?.hint}
            </p>

            <label className="wss-field">
              <span className="wss-field-label">
                <MonoLabel text="message" />
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                placeholder="share the issue, idea, or note"
              />
            </label>

            {error ? (
              <p className="wss-inline-error" role="status">
                {error}
              </p>
            ) : null}

            <button type="submit" className="wss-primary-button" disabled={submitting}>
              {submitting ? "sending…" : "submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const section = getSectionFromPath(location.pathname);
  const feedbackParam = new URLSearchParams(location.search).get("feedback");
  const [selectedRequestId, setSelectedRequestId] = useState(ticketQueue[0]?.id ?? "");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pilotStatus, setPilotStatus] = useState<OperatorPilotStatus>(createEmptyOperatorPilotStatus());

  useEffect(() => {
    if (!isSectionPath(location.pathname)) {
      navigate("/overview", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    let active = true;
    const currentClientId = ticketQueue[0]?.clientId ?? "";
    loadOperatorPilotStatus(currentClientId)
      .then((result) => {
        if (active) {
          setPilotStatus(result);
        }
      })
      .catch(() => {
        if (active) {
          setPilotStatus(createEmptyOperatorPilotStatus());
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (feedbackParam === "open" || feedbackParam === "1") {
      setFeedbackOpen(true);
    }
  }, [feedbackParam]);

  const activeRequests = useMemo(
    () => ticketQueue.filter((ticket) => ACTIVE_REQUEST_STATUSES.has(ticket.status)),
    [],
  );

  const boardGroups = useMemo(() => {
    const lanes: Record<ReturnType<typeof boardLaneForTicket>, MockTicketQueueItem[]> = {
      new: [],
      triage: [],
      waiting_on_us: [],
      waiting_on_customer: [],
      review: [],
      complete: [],
    };

    for (const ticket of ticketQueue) {
      lanes[boardLaneForTicket(ticket)].push(ticket);
    }

    return lanes;
  }, []);

  const selectedRequest = useMemo(
    () => getTicketDetail(selectedRequestId) ?? ticketDetails[0],
    [selectedRequestId],
  );

  const recentEvents = useMemo(() => getRecentEvents(), []);

  const overviewAtRisk = useMemo(
    () =>
      ticketQueue.find(
        (ticket) => ticket.status === "blocked" || ticket.priority === "urgent" || ticket.priority === "critical",
      ) ?? ticketQueue[0],
    [],
  );

  const siteIdForFeedback = selectedRequest?.tenantContext.siteId ?? ticketQueue[0]?.siteId ?? "SITE-01";

  if (location.pathname === "/" || !isSectionPath(location.pathname)) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <div className="wss-shell">
      <header className="wss-header">
        <div className="wss-brand">
          <LogoLockup size={34} text="website support studio" />
          <div className="wss-brand-copy">
            <p className="wss-card-kicker">
              <MonoLabel text="operations console" />
            </p>
            <p className="wss-brand-subtitle">
              website operations, access, requests, activity, and health
            </p>
          </div>
        </div>

        <div className="wss-header-actions">
          <span className="wss-status-chip">
            <MonoLabel text="website_support_studio" />
          </span>
          <button
            type="button"
            className="wss-secondary-button"
            onClick={() => {
              void signOut();
              navigate("/login", { replace: true });
            }}
          >
            logout
          </button>
        </div>
      </header>

      <div className="wss-layout">
        <aside className="wss-sidebar">
          <nav className="wss-nav" aria-label="console sections">
            {SECTION_ORDER.map((item) => (
              <NavLink
                key={item}
                to={`/${item}`}
                className={({ isActive }) => (isActive ? "wss-nav-link is-active" : "wss-nav-link")}
              >
                <MonoLabel text={item} />
              </NavLink>
            ))}
          </nav>

          <div className="wss-sidebar-note">
            <p className="wss-card-kicker">
              <MonoLabel text="quick_state" />
            </p>
            <p className="wss-sidebar-text">
              <strong>{activeRequests.length}</strong> active requests are moving through the console right now.
            </p>
          </div>
        </aside>

        <main className="wss-main">
          {section === "overview" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="overview"
                title="account summary"
                description="A compact view of the account, activity, and what needs attention."
              />

              <div className="wss-grid four-up">
                <OverviewCard
                  title="account_summary"
                  value={ACCOUNT_SUMMARY.profile}
                  note={`${ACCOUNT_SUMMARY.company} · ${ACCOUNT_SUMMARY.website}`}
                />
                <OverviewCard
                  title="business_status"
                  value={ACCOUNT_SUMMARY.billingStatus}
                  note={`current plan: ${ACCOUNT_SUMMARY.currentPlan}`}
                />
                <OverviewCard
                  title="active_requests"
                  value={String(activeRequests.length)}
                  note="requests that still need attention from the team."
                />
                <OverviewCard
                  title="credits_summary"
                  value={`${ACCOUNT_SUMMARY.creditsRemaining} left`}
                  note={`${ACCOUNT_SUMMARY.creditsIncluded} included · ${ACCOUNT_SUMMARY.creditsUsed} used`}
                />
              </div>

              <div className="wss-grid two-up">
                <article className="wss-card">
                  <SectionHeading
                    title="whats_new"
                    description="Recent updates from the console and workflow trail."
                  />
                  <ul className="wss-list">
                    {recentEvents.slice(0, 3).map((event) => (
                      <li key={event.id}>
                        <strong>{event.eventType}</strong> on {event.ticketId}
                        <span>{event.summary}</span>
                        <small>{formatDateTime(event.occurredAt)}</small>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="wss-card">
                  <SectionHeading
                    title="whats_at_risk"
                    description="The main item that could slow delivery if it is not cleared."
                  />
                  {overviewAtRisk ? (
                    <div className="wss-risk-card">
                      <strong>{overviewAtRisk.title}</strong>
                      <p>
                        {overviewAtRisk.clientName} / {overviewAtRisk.siteName}
                      </p>
                      <p>
                        priority: {overviewAtRisk.priority} · status: {overviewAtRisk.status}
                      </p>
                      <p>{overviewAtRisk.blockedReason ?? "This request is active and needs attention."}</p>
                    </div>
                  ) : null}
                </article>
              </div>
            </section>
          ) : null}

          {section === "board" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="board"
                title="kanban board"
                description="Read-only status lanes for the current request flow."
              />

              <div className="wss-board-shell">
                {[
                  { key: "new", label: "new" },
                  { key: "triage", label: "triage" },
                  { key: "waiting_on_us", label: "waiting_on_us" },
                  { key: "waiting_on_customer", label: "waiting_on_customer" },
                  { key: "review", label: "review" },
                  { key: "complete", label: "complete" },
                ].map((lane) => (
                  <article key={lane.key} className="wss-board-column">
                    <div className="wss-board-column-head">
                      <h3>
                        <MonoLabel text={lane.label} />
                      </h3>
                      <span>{boardGroups[lane.key as keyof typeof boardGroups].length}</span>
                    </div>

                    <div className="wss-board-column-body">
                      {boardGroups[lane.key as keyof typeof boardGroups].length === 0 ? (
                        <p className="wss-empty-state">nothing here yet</p>
                      ) : (
                        boardGroups[lane.key as keyof typeof boardGroups].map((ticket) => (
                          <button
                            key={ticket.id}
                            type="button"
                            className="wss-board-card"
                            onClick={() => {
                              setSelectedRequestId(ticket.id);
                              navigate("/requests");
                            }}
                          >
                            <strong>{ticket.title}</strong>
                            <span>
                              {ticket.clientName} / {ticket.siteName}
                            </span>
                            <span>
                              priority: {formatPriority(ticket.priority)} · status: <MonoLabel text={ticket.status} />
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {section === "requests" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="requests"
                title="request list and detail"
                description="Pick a request on the left and read the operational detail on the right."
              />

              <div className="wss-split">
                <div className="wss-card">
                  <div className="wss-list-picker">
                    {ticketQueue.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        className={selectedRequestId === ticket.id ? "wss-request-item is-active" : "wss-request-item"}
                        onClick={() => setSelectedRequestId(ticket.id)}
                      >
                        <strong>{ticket.title}</strong>
                        <span>
                          {ticket.clientName} / {ticket.siteName}
                        </span>
                        <span>
                          <MonoLabel text={ticket.status} /> · {ticket.priority}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <article className="wss-card">
                  <SectionHeading
                    title={selectedRequest.summary}
                    description={`${selectedRequest.tenantContext.clientName} / ${selectedRequest.tenantContext.siteName}`}
                  />

                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="status" />
                      </dt>
                      <dd>
                        <MonoLabel text={selectedRequest.status} />
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="priority" />
                      </dt>
                      <dd>{selectedRequest.priority}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="updated_at" />
                      </dt>
                      <dd>{formatDateTime(selectedRequest.submittedAt)}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="submitted_by" />
                      </dt>
                      <dd>{selectedRequest.submittedBy}</dd>
                    </div>
                  </dl>
                </article>
              </div>
            </section>
          ) : null}

          {section === "account" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="account"
                title="account details"
                description="The customer account surface lives here, including credits and billing status."
              />

              <div className="wss-grid two-up">
                <article className="wss-card">
                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="profile" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.profile}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="company" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.company}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="website" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.website}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="current_plan" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.currentPlan}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="billing_status" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.billingStatus}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="logout" />
                      </dt>
                      <dd>
                        <button
                          type="button"
                          className="wss-secondary-button"
                          onClick={() => {
                            void signOut();
                            navigate("/login", { replace: true });
                          }}
                        >
                          logout
                        </button>
                      </dd>
                    </div>
                  </dl>
                </article>

                <article className="wss-card">
                  <SectionHeading title="credits_summary" description="How the included work is measured." />
                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="credits_included" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.creditsIncluded}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="credits_used" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.creditsUsed}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="credits_remaining" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.creditsRemaining}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="low_effort" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.lowEffortExplanation}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="medium_effort" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.mediumEffortExplanation}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="high_effort" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.highEffortExplanation}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="replenishment" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.replenishmentMessaging}</dd>
                    </div>
                  </dl>
                </article>
              </div>
            </section>
          ) : null}

          {section === "website_access" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="website_access"
                title="website access"
                description="The access model should be clear so customers understand what is required, optional, and recommended."
              />

              <div className="wss-grid three-up">
                {WEBSITE_ACCESS_GROUPS.map((group) => (
                  <article key={group.key} className="wss-card">
                    <p className={`wss-badge tone-${group.tone}`}>
                      <MonoLabel text={group.label} />
                    </p>
                    <ul className="wss-list">
                      {group.items.map((item) => (
                        <li key={item}>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>

              <article className="wss-card">
                <SectionHeading
                  title="backup_guidance"
                  description="Backups are not a billing or reporting feature. They are simply part of safe website access."
                />
                <p className="wss-copy">
                  We can work more confidently when the site owner can point us to the latest backup, the restore
                  method, and the place where staging or production changes are tracked.
                </p>
              </article>
            </section>
          ) : null}

          {section === "activity" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="activity"
                title="recent activity"
                description="A concise trail of what happened most recently."
              />

              <article className="wss-card">
                <ul className="wss-list">
                  {recentEvents.slice(0, 8).map((event) => (
                    <li key={event.id}>
                      <strong>
                        <MonoLabel text={event.eventType} />
                      </strong>
                      <span>
                        {event.ticketId} · {event.summary}
                      </span>
                      <small>{formatDateTime(event.occurredAt)}</small>
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          ) : null}

          {section === "health" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="health"
                title="diagnostics"
                description="Pilot status and light operational diagnostics live here without taking over the rest of the console."
              />

              <div className="wss-grid two-up">
                <article className="wss-card">
                  <SectionHeading title="pilot_status" />
                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="buyer_email" />
                      </dt>
                      <dd>{pilotStatus.buyerEmail ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="stripe_status" />
                      </dt>
                      <dd>{pilotStatus.stripeStatus ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="wss_status" />
                      </dt>
                      <dd>{pilotStatus.wssStatus ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="owner_claimed" />
                      </dt>
                      <dd>{pilotStatus.ownerClaimed === null ? "not available" : pilotStatus.ownerClaimed ? "true" : "false"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="site_count" />
                      </dt>
                      <dd>{formatCount(pilotStatus.siteCount)}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="org_member_count" />
                      </dt>
                      <dd>{formatCount(pilotStatus.orgMemberCount)}</dd>
                    </div>
                  </dl>
                </article>

                <article className="wss-card">
                  <SectionHeading title="diagnostic_timeline" />
                  <ul className="wss-list">
                    {(pilotStatus.timeline.length > 0 ? pilotStatus.timeline : []).slice(0, 4).map((item) => (
                      <li key={item.key}>
                        <strong>{item.label}</strong>
                        <span>
                          {item.source} · {item.field} · {item.reliability}
                        </span>
                        <small>{formatDateTime(item.timestamp)}</small>
                        {item.note ? <span>{item.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <button type="button" className="wss-feedback-launcher" onClick={() => setFeedbackOpen(true)}>
        feedback
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} defaultSiteId={siteIdForFeedback} />
    </div>
  );
}
