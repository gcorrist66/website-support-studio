import { getTicketDetail, type MockTicketDetail } from "../../ui/mockData";

function statusClass(status: MockTicketDetail["status"]) {
  switch (status) {
    case "triaged":
      return "phase4b-badge phase4b-badge--triaged";
    case "received":
      return "phase4b-badge phase4b-badge--received";
    case "blocked":
      return "phase4b-badge phase4b-badge--blocked";
    case "awaiting_gary_approval":
      return "phase4b-badge phase4b-badge--approval";
    case "reply_drafted":
      return "phase4b-badge phase4b-badge--approval";
    case "approved_to_send":
      return "phase4b-badge phase4b-badge--approved";
    case "sent_to_customer":
      return "phase4b-badge phase4b-badge--sent";
    case "closed":
      return "phase4b-badge phase4b-badge--blocked";
    default:
      return "phase4b-badge";
  }
}

function priorityClass(priority: MockTicketDetail["priority"]) {
  switch (priority) {
    case "urgent":
      return "phase4b-badge phase4b-badge--urgent";
    case "high":
      return "phase4b-badge phase4b-badge--high";
    case "medium":
      return "phase4b-badge phase4b-badge--medium";
    case "normal":
      return "phase4b-badge phase4b-badge--medium";
    case "low":
      return "phase4b-badge phase4b-badge--low";
    case "critical":
      return "phase4b-badge phase4b-badge--urgent";
    default:
      return "phase4b-badge";
  }
}

function confidenceClass(confidence: MockTicketDetail["identityConfidence"]) {
  return confidence === "known" ? "phase4b-badge phase4b-badge--known" : "phase4b-badge phase4b-badge--uncertain";
}

function approvalLabel(status: MockTicketDetail["approvalStatus"]) {
  switch (status) {
    case "awaiting_approval":
      return "Awaiting approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "No approval required";
  }
}

type ReadOnlyTicketDetailProps = {
  ticket: ReturnType<typeof getTicketDetail>;
  canTriage?: boolean;
  isTriageInProgress?: boolean;
  triageMessage?: string;
  triageError?: string;
  onTriage?: () => Promise<void>;
  draftText?: string;
  canDraft?: boolean;
  isDraftInProgress?: boolean;
  draftMessage?: string;
  draftError?: string;
  // eslint-disable-next-line no-unused-vars
  onDraftTextChange?: (_draftBody: string) => void;
  onDraft?: () => Promise<void>;
  canRequestApproval?: boolean;
  isApprovalRequestInProgress?: boolean;
  approvalRequestMessage?: string;
  approvalRequestError?: string;
  onRequestApproval?: () => Promise<void>;
  canDecideApproval?: boolean;
  isApprovalDecisionInProgress?: boolean;
  approvalDecisionMessage?: string;
  approvalDecisionError?: string;
  onApproveReply?: () => Promise<void>;
  onRejectReply?: () => Promise<void>;
};

export function ReadOnlyTicketDetail({
  ticket,
  canTriage = false,
  isTriageInProgress = false,
  triageMessage,
  triageError,
  onTriage,
  draftText = "",
  canDraft = false,
  isDraftInProgress = false,
  draftMessage,
  draftError,
  onDraftTextChange,
  onDraft,
  canRequestApproval = false,
  isApprovalRequestInProgress = false,
  approvalRequestMessage,
  approvalRequestError,
  onRequestApproval,
  canDecideApproval = false,
  isApprovalDecisionInProgress = false,
  approvalDecisionMessage,
  approvalDecisionError,
  onApproveReply,
  onRejectReply,
}: ReadOnlyTicketDetailProps) {
  const hasTriageAction = typeof onTriage === "function";
  const triageDisabled = !hasTriageAction || !canTriage || isTriageInProgress;
  const triageLabel = isTriageInProgress
    ? "Triaging..."
    : hasTriageAction
      ? canTriage
        ? "Triage Ticket"
        : "Triage Ticket (not available)"
      : "Triage Ticket (disabled)";

  const handleTriage = async () => {
    if (triageDisabled) {
      return;
    }
    await onTriage();
  };

  const hasApprovalRequestAction = typeof onRequestApproval === "function";
  const approvalRequestDisabled =
    !hasApprovalRequestAction || !canRequestApproval || isApprovalRequestInProgress;
  const approvalRequestLabel = isApprovalRequestInProgress
    ? "Requesting approval..."
    : "Request Gary Approval";

  const handleRequestApproval = async () => {
    if (approvalRequestDisabled) {
      return;
    }
    await onRequestApproval();
  };

  const hasApproveAction = typeof onApproveReply === "function";
  const hasRejectAction = typeof onRejectReply === "function";
  const approveDisabled = !hasApproveAction || !canDecideApproval || isApprovalDecisionInProgress;
  const rejectDisabled = !hasRejectAction || !canDecideApproval || isApprovalDecisionInProgress;

  const handleApproveReply = async () => {
    if (approveDisabled) {
      return;
    }
    await onApproveReply();
  };

  const handleRejectReply = async () => {
    if (rejectDisabled) {
      return;
    }
    await onRejectReply();
  };

  return (
    <section className="phase4a-card">
      <h2>Read-only ticket detail</h2>
      <p className="placeholder-meta">
        Mock data fallback available · No customer communication, approval, or close actions are enabled.
      </p>

      <article className="phase4c-detail-card">
        <header>
          <h3>{ticket.id}</h3>
          <p>{ticket.summary}</p>
        </header>

        <div className="phase4c-grid">
          <p>
            <strong>Status:</strong> <span className={statusClass(ticket.status)}>{ticket.status}</span>
          </p>
          <p>
            <strong>Priority:</strong> <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
          </p>
          <p>
            <strong>Identity confidence:</strong>{" "}
            <span className={confidenceClass(ticket.identityConfidence)}>{ticket.identityConfidence}</span>
          </p>
          <p>
            <strong>Approval:</strong>{" "}
            <span className="phase4c-approval-text">{approvalLabel(ticket.approvalStatus)}</span>
          </p>
        </div>

        <div className="phase4c-section">
          <h4>Customer request summary</h4>
          <p className="phase4c-summary">{ticket.customerRequest}</p>
        </div>

        <div className="phase4c-section">
          <h4>Tenant / client / site context</h4>
          <ul className="phase4c-meta-list">
            <li>
              <strong>Agency:</strong> {ticket.tenantContext.agencyName} ({ticket.tenantContext.agencyId})
            </li>
            <li>
              <strong>Client:</strong> {ticket.tenantContext.clientName} ({ticket.tenantContext.clientId})
            </li>
            <li>
              <strong>Site:</strong> {ticket.tenantContext.siteName} ({ticket.tenantContext.siteId})
            </li>
          </ul>
        </div>
      </article>

      <article className="phase4c-section">
        <h4>Audit timeline</h4>
        <div className="placeholder-table">
          {ticket.auditTimeline.map((event) => (
            <div key={event.id} className="placeholder-row">
              <div>
                <strong>{event.eventType}</strong> · {event.occurredAt}
              </div>
              <div className="placeholder-meta">{event.summary}</div>
              <div className="placeholder-meta">actor: {event.actor}</div>
            </div>
          ))}
        </div>
      </article>

      <article className="phase4c-section">
        <h4>Local action placeholders</h4>
        <div className="phase4c-actions">
          <button type="button" className="phase4a-action" disabled={triageDisabled} onClick={handleTriage}>
            {triageLabel}
          </button>
        </div>
        <label htmlFor={`draft-${ticket.id}`} className="phase4c-label">
          Draft reply body
        </label>
        <textarea
          id={`draft-${ticket.id}`}
          className="phase4a-textarea"
          rows={4}
          value={draftText}
          onChange={(event) => {
            onDraftTextChange?.(event.target.value);
          }}
          disabled={isDraftInProgress || !canDraft}
          placeholder={canDraft ? "Draft reply text (phase 5D)" : "Draft is only available for triaged tickets in guarded mode"}
        />
        <button
          type="button"
          className="phase4a-action"
          disabled={!canDraft || isDraftInProgress || !onDraft || !draftText.trim()}
          onClick={() => {
            if (canDraft && onDraft && draftText.trim()) {
              onDraft();
            }
          }}
        >
          {isDraftInProgress ? "Drafting reply..." : canDraft ? "Draft Reply" : "Draft Reply (disabled)"}
        </button>
        <div className="phase4c-actions">
          <button
            type="button"
            className="phase4a-action"
            disabled={approvalRequestDisabled}
            onClick={handleRequestApproval}
          >
            {approvalRequestLabel}
          </button>
        </div>
        {!canRequestApproval && (
          <p className="placeholder-meta">Request Gary Approval: Not active for this ticket state</p>
        )}
        <div className="phase4c-actions">
          <button
            type="button"
            className="phase4a-action"
            disabled={approveDisabled}
            onClick={handleApproveReply}
          >
            {isApprovalDecisionInProgress ? "Processing decision..." : "Approve Reply"}
          </button>
          <button
            type="button"
            className="phase4a-action"
            disabled={rejectDisabled}
            onClick={handleRejectReply}
          >
            {isApprovalDecisionInProgress ? "Processing decision..." : "Reject Reply"}
          </button>
        </div>
        {!canDecideApproval && (
          <p className="placeholder-meta">Approve Reply / Reject Reply: Not active for this ticket state</p>
        )}
        <p className="placeholder-meta">Send/close controls are still not enabled in this phase.</p>
        {approvalDecisionMessage && <p className="phase5b-success">{approvalDecisionMessage}</p>}
        {approvalDecisionError && <p className="phase5b-error">{approvalDecisionError}</p>}
        {approvalRequestMessage && <p className="phase5b-success">{approvalRequestMessage}</p>}
        {approvalRequestError && <p className="phase5b-error">{approvalRequestError}</p>}
        {draftMessage && <p className="phase5b-success">{draftMessage}</p>}
        {draftError && <p className="phase5b-error">{draftError}</p>}
        {triageMessage && <p className="phase5b-success">{triageMessage}</p>}
        {triageError && <p className="phase5b-error">{triageError}</p>}
      </article>
    </section>
  );
}
