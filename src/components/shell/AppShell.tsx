import { useEffect, useMemo, useState } from "react";
import { auditTrail, approvalQueue, getTicketDetail, ticketQueue, type MockTicketQueueItem } from "../../ui/mockData";
import { ReadOnlyTicketQueue } from "../tickets/ReadOnlyTicketQueue";
import { ReadOnlyTicketDetail } from "../tickets/ReadOnlyTicketDetail";

export function AppShell() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [blockedFilter, setBlockedFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState("TKT-LOCAL-1001");

  const clients = useMemo(() => {
    return Array.from(new Set(ticketQueue.map((ticket) => ticket.clientName)));
  }, [ticketQueue]);

  const sites = useMemo(() => {
    return Array.from(new Set(ticketQueue.map((ticket) => ticket.siteName)));
  }, [ticketQueue]);

  const filteredTickets: MockTicketQueueItem[] = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return ticketQueue.filter((ticket) => {
      const statusMatch = statusFilter === "all" || ticket.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || ticket.priority === priorityFilter;
      const clientMatch = clientFilter === "all" || ticket.clientName === clientFilter;
      const siteMatch = siteFilter === "all" || ticket.siteName === siteFilter;
      const blockedMatch =
        blockedFilter === "all" ||
        (blockedFilter === "blocked" && ticket.status === "blocked") ||
        (blockedFilter === "not-blocked" && ticket.status !== "blocked");
      const searchMatch = normalizedSearch.length === 0 || `${ticket.id} ${ticket.title} ${ticket.clientName} ${ticket.siteName}`.toLowerCase().includes(normalizedSearch);

      return statusMatch && priorityMatch && clientMatch && siteMatch && blockedMatch && searchMatch;
    });
  }, [searchText, statusFilter, priorityFilter, clientFilter, siteFilter, blockedFilter]);

  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  const selectedTicket = getTicketDetail(selectedTicketId);

  return (
    <div className="phase4a-shell">
      <header className="phase4a-header">
        <div>
          <p className="brand-kicker">Website Support Studio</p>
          <h1>Internal Operator Workspace</h1>
          <p>Phase 4D Read-only Ticket Search and Filters</p>
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
              <li>Queue views are built on mock data only.</li>
              <li>Planned workflow: draft → approval → send → close.</li>
              <li>All actions currently rendered as disabled placeholders.</li>
            </ul>
          </section>

          <section className="phase4a-card phase4d-search-panel">
            <h2>Search and Filters</h2>
            <p className="placeholder-meta">All results and filters are mock-data only and read-only.</p>
            <div className="phase4d-filter-grid">
              <label>
                Search
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search by ticket id, title, client, or site"
                />
              </label>

              <label>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="received">received</option>
                  <option value="triaged">triaged</option>
                  <option value="blocked">blocked</option>
                  <option value="awaiting_gary_approval">awaiting_gary_approval</option>
                  <option value="approved_to_send">approved_to_send</option>
                  <option value="sent_to_customer">sent_to_customer</option>
                </select>
              </label>

              <label>
                Priority
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </label>

              <label>
                Client
                <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                  <option value="all">All</option>
                  {clients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Site
                <select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}>
                  <option value="all">All</option>
                  {sites.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Blocked
                <select value={blockedFilter} onChange={(event) => setBlockedFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="blocked">Blocked only</option>
                  <option value="not-blocked">Not blocked</option>
                </select>
              </label>
            </div>
          </section>

          <ReadOnlyTicketQueue
            tickets={filteredTickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
          />
          <ReadOnlyTicketDetail ticket={selectedTicket} />

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
                    Approve (disabled in Phase 4D - no live approval yet)
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
                    View details (disabled in Phase 4D - no live details yet)
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="phase4a-card">
            <h2>System Status / Validation Placeholder</h2>
            <ul>
              <li>Read-only local queue complete (mock data only).</li>
              <li>Phase 4C adds ticket detail context and read-only timeline/approvals.</li>
              <li>Route files: not introduced in this phase.</li>
              <li>Live reads/writes: disabled.</li>
              <li>Auth/email/provider: disabled.</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
