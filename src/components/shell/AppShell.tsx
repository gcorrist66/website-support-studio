import { auditTrail, approvalQueue, ticketQueue } from "../../ui/mockData";

export function AppShell() {
  return (
    <div className="phase4a-shell">
      <header className="phase4a-header">
        <div>
          <p className="brand-kicker">Website Support Studio</p>
          <h1>Internal Operator Workspace</h1>
          <p>Phase 4A Local Operator Shell</p>
        </div>
        <span className="status-pill">Local shell only · No live ticket actions enabled</span>
      </header>

      <div className="phase4a-layout">
        <nav className="phase4a-nav" aria-label="Primary">
          <h2>Navigation</h2>
          <ul>
            <li>Dashboard</li>
            <li>Tickets</li>
            <li>Approvals</li>
            <li>Audit Trail</li>
            <li>System Status</li>
          </ul>
        </nav>

        <main className="phase4a-main">
          <section className="phase4a-card">
            <h2>Dashboard Placeholder</h2>
            <p>Read-only workspace for internal operator planning and local validation.</p>
            <ul>
              <li>Ready states: ticket intake and triage simulation</li>
              <li>Planned workflow: draft → approval → send → close</li>
              <li>All actions currently rendered as disabled placeholders</li>
            </ul>
          </section>

          <section className="phase4a-card">
            <h2>Ticket Queue Placeholder</h2>
            <div className="placeholder-table">
              {ticketQueue.map((ticket) => (
                <article key={ticket.id} className="placeholder-row">
                  <div>
                    <strong>{ticket.id}</strong> — {ticket.title}
                  </div>
                  <div className="placeholder-meta">
                    {ticket.status} · {ticket.priority} · {ticket.submittedBy}
                  </div>
                  <button type="button" disabled>
                    Open ticket (disabled - local shell only)
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="phase4a-card">
            <h2>Approval Queue Placeholder</h2>
            <div className="placeholder-table">
              {approvalQueue.map((item) => (
                <article key={item.id} className="placeholder-row">
                  <div>
                    <strong>{item.id}</strong> ({item.ticketId})
                  </div>
                  <div className="placeholder-meta">
                    Requested by {item.requestBy} · state: {item.state} · {item.submittedAt}
                  </div>
                  <button type="button" disabled>
                    Approve (disabled - no live approval yet)
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="phase4a-card">
            <h2>Audit Trail Placeholder</h2>
            <div className="placeholder-table">
              {auditTrail.map((event) => (
                <article key={event.id} className="placeholder-row">
                  <div>
                    <strong>{event.eventType}</strong> for {event.ticketId}
                  </div>
                  <div className="placeholder-meta">
                    {event.summary} · actor: {event.actor} · {event.occurredAt}
                  </div>
                  <button type="button" disabled>
                    View details (disabled)
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="phase4a-card">
            <h2>System Status / Validation Placeholder</h2>
            <ul>
              <li>Domain and workflow validation scripts: available</li>
              <li>Route files: not introduced in this phase</li>
              <li>Live writes: disabled</li>
              <li>Auth/email/provider: disabled</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
