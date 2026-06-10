import { useEffect, useMemo, useState } from "react";

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
        return "No customer selected";
      case "stripeCustomerId":
        return "No Stripe record";
      case "stripeSubscriptionId":
        return "No Stripe subscription";
      case "plan":
        return "Awaiting checkout";
      case "wssStatus":
        return "No WSS subscription";
      case "ownerClaimed":
        return "Missing owner record";
      case "onboardingStatus":
        return "Awaiting onboarding";
      case "orgMemberCount":
        return "No members yet";
      case "siteCount":
        return "No site created";
    }
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "No timestamp available";
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
    return "Claimed";
  }
  if (status.ownerClaimed === false && (status.orgMemberCount ?? 0) === 0) {
    return "Awaiting Claim";
  }
  return "Missing Owner Record";
}

function formatSiteStatus(siteCount: number | null): string {
  if (siteCount === null || siteCount === 0) {
    return "No Site Created";
  }
  if (siteCount === 1) {
    return "1 Site Created";
  }
  return "Multiple Sites";
}

function formatMismatchLabel(status: OperatorPilotStatus): { label: string; tone: "blue" | "amber" | "mulberry" } {
  if (!status.stripeSubscriptionId) {
    return { label: "Missing Stripe Subscription", tone: "amber" };
  }
  if (!status.stripeCustomerId) {
    return { label: "Missing Stripe Customer", tone: "amber" };
  }
  if (!status.wssStatus) {
    return { label: "Missing WSS Subscription", tone: "mulberry" };
  }
  if (!status.stripeStatus) {
    return { label: "Stripe Status Unavailable", tone: "amber" };
  }
  if (status.stripeStatus !== status.wssStatus) {
    return { label: `Mismatch: ${status.stripeStatus} / ${status.wssStatus}`, tone: "mulberry" };
  }
  return { label: "Stripe and WSS aligned", tone: "blue" };
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
        setError("Could not load pilot status.");
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
        `Buyer Email: ${formatAccountValue("buyerEmail", status.buyerEmail)}`,
        `Stripe Customer ID: ${formatAccountValue("stripeCustomerId", status.stripeCustomerId)}`,
        `Stripe Subscription ID: ${formatAccountValue("stripeSubscriptionId", status.stripeSubscriptionId)}`,
        `Plan: ${formatAccountValue("plan", status.plan)}`,
        `WSS Subscription Status: ${formatAccountValue("wssStatus", status.wssStatus)}`,
        `owner_claimed: ${formatAccountValue("ownerClaimed", status.ownerClaimed)}`,
        `Onboarding Status: ${formatAccountValue("onboardingStatus", status.onboardingStatus)}`,
        `Org Members: ${formatAccountValue("orgMemberCount", status.orgMemberCount)}`,
        `Sites: ${formatAccountValue("siteCount", status.siteCount)}`,
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
          <h2>Production Pilot status</h2>
          <p className="placeholder-meta">
            Current customer: {customerLabel}
            {siteLabel ? ` · site: ${siteLabel}` : ""}
          </p>
        </div>
        <span className={`pilot-status-badge pilot-status-badge-${mismatch.tone}`}>{mismatch.label}</span>
      </div>

      {loading ? <p className="placeholder-meta">Loading pilot status…</p> : null}
      {error ? <p className="placeholder-meta" role="status">{error}</p> : null}

      <dl className="pilot-status-grid">
        <div>
          <dt>Buyer Email</dt>
          <dd>{formatAccountValue("buyerEmail", status.buyerEmail)}</dd>
        </div>
        <div>
          <dt>Stripe Customer ID</dt>
          <dd>{formatAccountValue("stripeCustomerId", status.stripeCustomerId)}</dd>
        </div>
        <div>
          <dt>Stripe Subscription ID</dt>
          <dd>{formatAccountValue("stripeSubscriptionId", status.stripeSubscriptionId)}</dd>
        </div>
        <div>
          <dt>Plan</dt>
          <dd>{formatAccountValue("plan", status.plan)}</dd>
        </div>
        <div>
          <dt>WSS Subscription Status</dt>
          <dd>{formatAccountValue("wssStatus", status.wssStatus)}</dd>
        </div>
        <div>
          <dt>owner_claimed</dt>
          <dd>{formatAccountValue("ownerClaimed", status.ownerClaimed)}</dd>
        </div>
        <div>
          <dt>Onboarding Status</dt>
          <dd>{formatAccountValue("onboardingStatus", status.onboardingStatus)}</dd>
        </div>
        <div>
          <dt>Org Member Count</dt>
          <dd>{formatAccountValue("orgMemberCount", ownerMemberCount)}</dd>
        </div>
        <div>
          <dt>Site Count</dt>
          <dd>{formatAccountValue("siteCount", status.siteCount)}</dd>
        </div>
      </dl>

      <div className="pilot-timeline-section">
        <div className="pilot-timeline-section-header">
          <div>
            <h3>Customer timeline</h3>
            <p className="placeholder-meta">
              Operational view of the customer lifecycle. Read-only and ordered by the key pilot events Gary checks
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
        <span className="pilot-status-summary-item">Claim status: {claimStatus}</span>
        <span className="pilot-status-summary-item">Site status: {siteStatus}</span>
      </div>

      <div className="pilot-status-actions">
        <textarea className="pilot-status-bundle" readOnly value={bundle} aria-label="Account summary" />
        <button className="auth-btn auth-btn-ghost" type="button" onClick={() => void copyBundle()}>
          Copy Account Summary
        </button>
        {copyState === "copied" ? <p className="pilot-status-copy-state">bundle copied</p> : null}
        {copyState === "error" ? <p className="pilot-status-copy-state">copy failed</p> : null}
      </div>
    </section>
  );
}
