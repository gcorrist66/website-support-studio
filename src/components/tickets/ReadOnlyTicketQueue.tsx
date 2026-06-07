import { ticketQueue, type MockTicketQueueItem } from "../../ui/mockData";

function statusClass(status: MockTicketQueueItem["status"]) {
  switch (status) {
    case "triaged":
      return "phase4b-badge phase4b-badge--triaged";
    case "received":
      return "phase4b-badge phase4b-badge--received";
    case "blocked":
      return "phase4b-badge phase4b-badge--blocked";
    case "awaiting_gary_approval":
      return "phase4b-badge phase4b-badge--approval";
    case "approved_to_send":
      return "phase4b-badge phase4b-badge--approved";
    case "sent_to_customer":
      return "phase4b-badge phase4b-badge--sent";
    default:
      return "phase4b-badge";
  }
}

function priorityClass(priority: MockTicketQueueItem["priority"]) {
  switch (priority) {
    case "urgent":
      return "phase4b-badge phase4b-badge--urgent";
    case "high":
      return "phase4b-badge phase4b-badge--high";
    case "medium":
      return "phase4b-badge phase4b-badge--medium";
    case "low":
      return "phase4b-badge phase4b-badge--low";
    default:
      return "phase4b-badge";
  }
}

function confidenceClass(confidence: MockTicketQueueItem["identityConfidence"]) {
  return confidence === "known" ? "phase4b-badge phase4b-badge--known" : "phase4b-badge phase4b-badge--uncertain";
}

export function ReadOnlyTicketQueue() {
  return (
    <section className="phase4a-card">
      <h2>Read-only local queue</h2>
      <p>
        Mock data only · No live ticket actions enabled · All action buttons are disabled in Phase 4B.
      </p>

      <div className="placeholder-table" role="table" aria-label="Mock ticket queue">
        <article className="phase4b-header-row">
          <span>Ticket</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Tenant / Site / Client</span>
          <span>Submitter</span>
          <span>Identity</span>
          <span>Action</span>
        </article>

        {ticketQueue.map((ticket: MockTicketQueueItem) => (
          <article key={ticket.id} className="placeholder-row phase4b-row">
            <div>
              <strong>{ticket.id}</strong>
              <div className="placeholder-meta">{ticket.title}</div>
            </div>

            <span className={statusClass(ticket.status)}>{ticket.status}</span>
            <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>

            <div className="placeholder-meta">
              <div>
                {ticket.siteId} · {ticket.siteName}
              </div>
              <div>
                {ticket.clientName} / {ticket.clientId}
              </div>
            </div>

            <span>{ticket.submittedBy}</span>

            <span className={confidenceClass(ticket.identityConfidence)}>{ticket.identityConfidence}</span>

            <div>
              {ticket.blockedReason ? (
                <span className="phase4b-badge phase4b-badge--blocked">{ticket.blockedReason}</span>
              ) : (
                <span className="phase4b-placeholder-text">active</span>
              )}
              <button type="button" className="phase4a-action" disabled>
                Not active in Phase 4B
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
