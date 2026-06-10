import { useEffect, useMemo, useState } from "react";

import { MonoLabel } from "../brand/MonoLabel";
import {
  createEmptyOperatorPilotStatus,
  loadOperatorPilotStatus,
  type OperatorPilotStatus,
  type OperatorTimelineEvent,
} from "../../data/operatorPilotStatus";

function formatAccountValue(field: "buyerEmail" | "stripeCustomerId" | "stripeSubscriptionId" | "plan" | "wssStatus" | "ownerClaimed" | "onboardingStatus" | "orgMemberCount" | "siteCount", value: string | number | boolean | null): string {
  if (value === null) {
    switch (field) {
      case "buyerEmail":
        return "no_customer_selected";
      case "stripeCustomerId":
        return "no_stripe_record";
      case "stripeSubscriptionId":
        return "no_stripe_subscription";
      case "plan":
        return "awaiting_checkout";
      case "wssStatus":
        return "no_wss_subscription";
      case "ownerClaimed":
        return "missing_owner_record";
      case "onboardingStatus":
        return "awaiting_onboarding";
      case "orgMemberCount":
        return "no_members_yet";
      case "siteCount":
        return "no_site_created";
    }
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "no_timestamp_available";
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

function formatClaimStatus(status: OperatorPilotStatus): string {
  if (status.ownerClaimed === true && (status.orgMemberCount ?? 0) > 0) {
    return "claimed";
  }
  if (status.ownerClaimed === false && (status.orgMemberCount ?? 0) === 0) {
    return "awaiting_claim";
  }
  return "missing_owner_record";
}

function formatSiteStatus(siteCount: number | null): string {
  if (siteCount === null || siteCount === 0) {
    return "no_site_created";
  }
  if (siteCount === 1) {
    return "1_site_created";
  }
  return "multiple_sites";
}

function formatMismatchLabel(status: OperatorPilotStatus): { label: string; tone: "blue" | "amber" | "mulberry" } {
  if (!status.stripeSubscriptionId) {
    return { label: "missing_stripe_subscription", tone: "amber" };
  }
  if (!status.stripeCustomerId) {
    return { label: "missing_stripe_customer", tone: "amber" };
  }
  if (!status.wssStatus) {
    return { label: "missing_wss_subscription", tone: "mulberry" };
  }
  if (!status.stripeStatus) {
    return { label: "stripe_status_unavailable", tone: "amber" };
  }
  if (status.stripeStatus !== status.wssStatus) {
    return { label: `mismatch: ${status.stripeStatus} / ${status.wssStatus}`, tone: "mulberry" };
  }
  return { label: "stripe_and_wss_aligned", tone: "blue" };
}

type OperatorPilotStatusCardProps = {
  clientId: string;
  customerLabel: string;
  siteLabel?: string | null;
};

export function OperatorPilotStatusCard({ clientId, customerLabel, siteLabel }: OperatorPilotStatusCardProps) {
  const [status, setStatus] = useState<OperatorPilotStatus>(createEmptyOperatorPilotStatus());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loadOperatorPilotStatus(clientId)
      .then((next) => {
        if (!active) {
          return;
        }
        setStatus(next);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setStatus(createEmptyOperatorPilotStatus());
        setError("could not load pilot status.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  const mismatch = useMemo(() => formatMismatchLabel(status), [status]);
  const claimStatus = useMemo(() => formatClaimStatus(status), [status]);
  const siteStatus = useMemo(() => formatSiteStatus(status.siteCount), [status.siteCount]);
  const timelineEvents = status.timeline ?? [];
  const ownerMemberCount = status.orgMemberCount ?? 0;
  const bundle = useMemo(
    () =>
      [
        `buyer_email: ${formatAccountValue("buyerEmail", status.buyerEmail)}`,
        `stripe_customer_id: ${formatAccountValue("stripeCustomerId", status.stripeCustomerId)}`,
        `stripe_subscription_id: ${formatAccountValue("stripeSubscriptionId", status.stripeSubscriptionId)}`,
        `plan: ${formatAccountValue("plan", status.plan)}`,
        `wss_subscription_status: ${formatAccountValue("wssStatus", status.wssStatus)}`,
        `owner_claimed: ${formatAccountValue("ownerClaimed", status.ownerClaimed)}`,
        `onboarding_status: ${formatAccountValue("onboardingStatus", status.onboardingStatus)}`,
        `org_members: ${formatAccountValue("orgMemberCount", status.orgMemberCount)}`,
        `sites: ${formatAccountValue("siteCount", status.siteCount)}`,
      ].join("\n"),
    [status],
  );

  async function copyBundle() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bundle);
      } else {
        const temp = document.createElement("textarea");
        temp.value = bundle;
        temp.setAttribute("readonly", "true");
        temp.style.position = "fixed";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(temp);
        if (!copied) {
          throw new Error("copy_failed");
        }
      }
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1500);
  }

  return (
    <section className="phase4a-card pilot-status-card">
      <div className="pilot-status-header">
        <div>
          <p className="pilot-status-kicker">operator pilot status</p>
          <h2>
            <MonoLabel text="pilot status" />
          </h2>
          <p className="placeholder-meta">
            current_customer: {customerLabel}
            {siteLabel ? ` · site: ${siteLabel}` : ""}
          </p>
        </div>
        <span className={`pilot-status-badge pilot-status-badge-${mismatch.tone}`}>{mismatch.label}</span>
      </div>

      {loading ? <p className="placeholder-meta">loading pilot status…</p> : null}
      {error ? <p className="placeholder-meta" role="status">{error}</p> : null}

      <dl className="pilot-status-grid">
        <div>
          <dt>buyer_email</dt>
          <dd>{formatAccountValue("buyerEmail", status.buyerEmail)}</dd>
        </div>
        <div>
          <dt>stripe_customer_id</dt>
          <dd>{formatAccountValue("stripeCustomerId", status.stripeCustomerId)}</dd>
        </div>
        <div>
          <dt>stripe_subscription_id</dt>
          <dd>{formatAccountValue("stripeSubscriptionId", status.stripeSubscriptionId)}</dd>
        </div>
        <div>
          <dt>plan</dt>
          <dd>{formatAccountValue("plan", status.plan)}</dd>
        </div>
        <div>
          <dt>wss_subscription_status</dt>
          <dd>{formatAccountValue("wssStatus", status.wssStatus)}</dd>
        </div>
        <div>
          <dt>owner_claimed</dt>
          <dd>{formatAccountValue("ownerClaimed", status.ownerClaimed)}</dd>
        </div>
        <div>
          <dt>onboarding_status</dt>
          <dd>{formatAccountValue("onboardingStatus", status.onboardingStatus)}</dd>
        </div>
        <div>
          <dt>org_member_count</dt>
          <dd>{formatAccountValue("orgMemberCount", ownerMemberCount)}</dd>
        </div>
        <div>
          <dt>site_count</dt>
          <dd>{formatAccountValue("siteCount", status.siteCount)}</dd>
        </div>
      </dl>

      <div className="pilot-timeline-section">
        <div className="pilot-timeline-section-header">
          <div>
            <h3>
              <MonoLabel text="customer timeline" />
            </h3>
            <p className="placeholder-meta">
              operational view of the customer lifecycle. read-only and ordered by the key pilot events gary checks
              manually.
            </p>
          </div>
          <span className="pilot-timeline-count">{timelineEvents.length} events</span>
        </div>

        <ol className="pilot-timeline">
          {timelineEvents.map((event: OperatorTimelineEvent) => (
            <li className="pilot-timeline-item" key={event.key}>
              <div className="pilot-timeline-marker" aria-hidden="true" />
              <div className="pilot-timeline-body">
                <div className="pilot-timeline-topline">
                  <strong className="pilot-timeline-label">{event.label}</strong>
                  <span className="pilot-timeline-time">{formatDateTime(event.timestamp)}</span>
                </div>
                <p className="pilot-timeline-meta">
                  {event.source} · {event.field} · {event.reliability} reliability
                </p>
                {event.note ? <p className="pilot-timeline-note">{event.note}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="pilot-status-summary">
        <span className="pilot-status-summary-item">claim_status: {claimStatus}</span>
        <span className="pilot-status-summary-item">site_status: {siteStatus}</span>
      </div>

      <div className="pilot-status-actions">
        <textarea className="pilot-status-bundle" readOnly value={bundle} aria-label="Account summary" />
        <button className="auth-btn auth-btn-ghost" type="button" onClick={() => void copyBundle()}>
          copy_account_summary
        </button>
        {copyState === "copied" ? <p className="pilot-status-copy-state">bundle copied</p> : null}
        {copyState === "error" ? <p className="pilot-status-copy-state">copy failed</p> : null}
      </div>
    </section>
  );
}
