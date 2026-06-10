import { useMemo } from "react";

import { MonoLabel } from "../brand/MonoLabel";
import { parseFeedbackCategory, parseRequestKind } from "../../domain/requestKind";
import type { MockTicketQueueItem } from "../../ui/mockData";

type FeedbackItem = MockTicketQueueItem & {
  category: NonNullable<ReturnType<typeof parseFeedbackCategory>>;
};

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function kindLabel(kind: FeedbackItem["category"]): string {
  return kind.replaceAll("_", " ");
}

function statusLabel(status: MockTicketQueueItem["status"]): string {
  return status.replaceAll("_", " ");
}

type OperatorFeedbackSurfaceProps = {
  tickets: MockTicketQueueItem[];
};

export function OperatorFeedbackSurface({ tickets }: OperatorFeedbackSurfaceProps) {
  const feedbackItems = useMemo<FeedbackItem[]>(() => {
    return tickets
      .filter((ticket) => parseRequestKind(ticket.title) === "product_feedback")
      .map((ticket) => ({
        ...ticket,
        category: parseFeedbackCategory(ticket.title) ?? "other",
      }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tickets]);

  const counts = useMemo(() => {
    const summary = {
      total: feedbackItems.length,
      feedback: 0,
      bug_report: 0,
      feature_request: 0,
      other: 0,
    };
    for (const item of feedbackItems) {
      summary[item.category] += 1;
    }
    return summary;
  }, [feedbackItems]);

  const latestItems = feedbackItems.slice(0, 4);

  return (
    <section id="feedback" className="phase4a-card operator-feedback-section">
      <div className="operator-section-header">
        <div>
          <p className="pilot-status-kicker">feedback</p>
          <h2>
            <MonoLabel text="feedback bug feature request" />
          </h2>
          <p className="placeholder-meta">
            support requests are work on customer websites. feedback / bug / feature_request improves
            website_support_studio itself.
          </p>
        </div>
        <span className="pilot-status-badge pilot-status-badge-mulberry">{counts.total} item(s)</span>
      </div>

      <div className="operator-feedback-summary">
        <article className="operator-feedback-metric">
          <p className="operator-feedback-label">total</p>
          <p className="operator-feedback-value">{counts.total}</p>
          <p className="operator-feedback-note">product feedback items in the current data set</p>
        </article>
        <article className="operator-feedback-metric">
          <p className="operator-feedback-label">feedback</p>
          <p className="operator-feedback-value">{counts.feedback}</p>
          <p className="operator-feedback-note">general product notes</p>
        </article>
        <article className="operator-feedback-metric">
          <p className="operator-feedback-label">bug_report</p>
          <p className="operator-feedback-value">{counts.bug_report}</p>
          <p className="operator-feedback-note">something broken or unexpected</p>
        </article>
        <article className="operator-feedback-metric">
          <p className="operator-feedback-label">feature_request</p>
          <p className="operator-feedback-value">{counts.feature_request}</p>
          <p className="operator-feedback-note">new capability requests</p>
        </article>
      </div>

      {latestItems.length === 0 ? (
        <div className="operator-feedback-empty" role="status">
          <p>no product feedback items are visible yet.</p>
          <p className="placeholder-meta">
            when customers send feedback, bug reports, or feature requests, they appear here separately from
            support requests.
          </p>
        </div>
      ) : (
        <div className="operator-feedback-list" aria-label="latest product feedback">
          {latestItems.map((item) => (
            <article key={item.id} className="operator-feedback-card">
              <div className="operator-feedback-card-topline">
                <strong>{item.title}</strong>
                <span className="operator-feedback-pill">{kindLabel(item.category)}</span>
              </div>
              <div className="operator-feedback-card-meta">
                <span>
                  {item.clientName}
                  {item.siteName ? ` · ${item.siteName}` : ""}
                </span>
                <span>{statusLabel(item.status)}</span>
              </div>
              <div className="operator-feedback-card-meta">
                <span>{item.priority}</span>
                <span>{formatDateTime(item.updatedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
