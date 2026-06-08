import { useEffect, useMemo, useState } from "react";

import { ReadOnlyTicketDetail } from "../tickets/ReadOnlyTicketDetail";
import { ReadOnlyTicketQueue } from "../tickets/ReadOnlyTicketQueue";
import { CreateTicketForm } from "../tickets/CreateTicketForm";
import { ActorRole } from "../../domain/ticketStatus";
import { handleTriageTicket } from "../../handlers/ticketWorkflowHandlers";
import {
  getReadOnlyApprovalQueue,
  getReadOnlyModeLabel,
  getReadOnlyTicketAuditTimeline,
  getReadOnlyTicketDetail,
  getReadOnlyTicketQueue,
  getReadOnlyDataMode,
} from "../../data/readOnlyTicketData";
import { auditTrail, getTicketDetail, ticketQueue, type MockApprovalItem, type MockAuditEvent, type MockTicketQueueItem } from "../../ui/mockData";

export function AppShell() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [blockedFilter, setBlockedFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState("TKT-LOCAL-1001");
  const [selectedTicket, setSelectedTicket] = useState(() => getTicketDetail("TKT-LOCAL-1001"));
  const [auditTimeline, setAuditTimeline] = useState<MockAuditEvent[]>([]);
  const [ticketQueueData, setTicketQueueData] = useState<MockTicketQueueItem[]>(ticketQueue);
  const [approvalQueue, setApprovalQueue] = useState<MockApprovalItem[]>([]);
  const [readOnlyMode, setReadOnlyMode] = useState<ReturnType<typeof getReadOnlyDataMode>>("mock");
  const [triageMessage, setTriageMessage] = useState("");
  const [triageError, setTriageError] = useState("");
  const [triageInProgress, setTriageInProgress] = useState(false);

  const loadReadOnlyData = async (modeOverride?: string) => {
    const mode = modeOverride === "mock" || modeOverride === "supabase-dev-readonly" ? modeOverride : getReadOnlyDataMode();
    setReadOnlyMode(mode);

    const [queue, approvals] = await Promise.all([
      getReadOnlyTicketQueue(),
      getReadOnlyApprovalQueue(),
    ]);

    setTicketQueueData(queue);
    setApprovalQueue(approvals);

    const activeId = queue.find((ticket) => ticket.id === selectedTicketId)?.id ?? queue[0]?.id ?? selectedTicketId;
    setSelectedTicketId(activeId);
  };

  useEffect(() => {
    loadReadOnlyData().catch(() => {
      setTicketQueueData(ticketQueue);
      setApprovalQueue([]);
      setReadOnlyMode("mock");
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateDetail = async () => {
      const [detail, timeline] = await Promise.all([
        getReadOnlyTicketDetail(selectedTicketId),
        getReadOnlyTicketAuditTimeline(selectedTicketId),
      ]);

      if (!cancelled) {
        setSelectedTicket(detail);
        setAuditTimeline(timeline);
      }
    };

    hydrateDetail().catch(() => {
      if (!cancelled) {
        setSelectedTicket(getTicketDetail(selectedTicketId));
        setAuditTimeline(auditTrail);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedTicketId]);

  const clients = useMemo(() => {
    return Array.from(new Set(ticketQueueData.map((ticket) => ticket.clientName)));
  }, [ticketQueueData]);

  const sites = useMemo(() => {
    return Array.from(new Set(ticketQueueData.map((ticket) => ticket.siteName)));
  }, [ticketQueueData]);

  const filteredTickets: MockTicketQueueItem[] = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return ticketQueueData.filter((ticket) => {
      const statusMatch = statusFilter === "all" || ticket.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || ticket.priority === priorityFilter;
      const clientMatch = clientFilter === "all" || ticket.clientName === clientFilter;
      const siteMatch = siteFilter === "all" || ticket.siteName === siteFilter;
      const blockedMatch =
        blockedFilter === "all" ||
        (blockedFilter === "blocked" && ticket.status === "blocked") ||
        (blockedFilter === "not-blocked" && ticket.status !== "blocked");
      const searchMatch =
        normalizedSearch.length === 0 ||
        `${ticket.id} ${ticket.title} ${ticket.clientName} ${ticket.siteName}`.toLowerCase().includes(normalizedSearch);

      return statusMatch && priorityMatch && clientMatch && siteMatch && blockedMatch && searchMatch;
    });
  }, [searchText, statusFilter, priorityFilter, clientFilter, siteFilter, blockedFilter, ticketQueueData]);

  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  const handleTriageTicketAction = async () => {
    if (readOnlyMode !== "supabase-dev-readonly") {
      setTriageError("Triage is only available in guarded Supabase-dev data mode.");
      return;
    }

    if (!selectedTicket?.workflowId) {
      setTriageError("No workflow identifier available for this ticket.");
      return;
    }

    setTriageError("");
    setTriageMessage("");
    setTriageInProgress(true);

    const result = handleTriageTicket({
      tenantContext: {
        agencyId: selectedTicket.tenantContext.agencyId,
        clientId: selectedTicket.tenantContext.clientId,
        siteId: selectedTicket.tenantContext.siteId,
      },
      actorContext: {
        actorRole: ActorRole.CS_AGENT,
        actorReference: "phase5c-ui-operator",
      },
      ticketId: selectedTicket.workflowId,
      rationale: "Manual CS triage from phase-5C UI",
    });

    if (result.status === "error") {
      setTriageError(result.error);
      setTriageMessage("");
      setTriageInProgress(false);
      return;
    }

    const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
    const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
    setSelectedTicket(refreshed);
    setAuditTimeline(timeline);
    setTriageMessage(`Ticket ${selectedTicket.id} triaged successfully.`);
    setTriageInProgress(false);
  };

  const canTriageSelected = readOnlyMode === "supabase-dev-readonly" && selectedTicket.status === "received";

  return (
    <div className="phase4a-shell">
      <header className="phase4a-header">
        <div>
          <p className="brand-kicker">Website Support Studio</p>
          <h1>Internal Operator Workspace</h1>
          <p>Phase 5A Live Read-Only Data Integration</p>
        </div>
            <span className="status-pill">
              {getReadOnlyModeLabel()} · Triage-only phase (send/approval/close disabled)
            </span>
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
            <li>
                {readOnlyMode === "supabase-dev-readonly"
                  ? "Live read-only data is allowed only in guarded dev mode."
                  : "Queue views are in mock data mode until guarded dev env is supplied."}
              </li>
              <li>Live read-only mode is safe-read only and requires WSS_ALLOW_SUPABASE_VALIDATION=dev guard.</li>
                <li>Planned workflow: draft → approval → send → close.</li>
                <li>Phase 5C enables triage action (received → triaged) in guarded workflow execution.</li>
                <li>Send/approval/close actions are not available in this phase.</li>
            </ul>
          </section>

          <CreateTicketForm />

          <section className="phase4a-card phase4d-search-panel">
            <h2>Search and Filters</h2>
            <p className="placeholder-meta">
              {readOnlyMode === "supabase-dev-readonly"
                ? "All results are loaded from read-only guarded Supabase for this phase."
                : "Mock-data only mode until guarded dev env is supplied."}
            </p>
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
                  <option value="reply_drafted">reply_drafted</option>
                  <option value="awaiting_gary_approval">awaiting_gary_approval</option>
                  <option value="approved_to_send">approved_to_send</option>
                  <option value="sent_to_customer">sent_to_customer</option>
                  <option value="blocked">blocked</option>
                  <option value="closed">closed</option>
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
                  <option value="normal">normal</option>
                  <option value="critical">critical</option>
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
          <ReadOnlyTicketDetail
            ticket={selectedTicket}
            canTriage={canTriageSelected}
            isTriageInProgress={triageInProgress}
            triageMessage={triageMessage}
            triageError={triageError}
            onTriage={handleTriageTicketAction}
          />

          <section className="phase4a-card">
            <h2>Audit Trail Placeholder</h2>
            <div className="placeholder-table">
              {auditTimeline.map((event) => (
                <article key={event.id} className="placeholder-row">
                  <div>
                    <strong>{event.eventType}</strong> for {event.ticketId}
                  </div>
                  <div className="placeholder-meta">
                    {event.summary} · actor: {event.actor} · {event.occurredAt}
                  </div>
                  <button type="button" disabled>
                    View details (read-only)
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="phase4a-card">
            <h2>Approval Queue Placeholder</h2>
            <div className="placeholder-table">
              {(approvalQueue ?? []).map((item) => (
                <article key={item.id} className="placeholder-row">
                  <div>
                    <strong>{item.id}</strong> ({item.ticketId})
                  </div>
                  <div className="placeholder-meta">
                    Requested by {item.requestBy} · state: {item.state} · {item.submittedAt}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="phase4a-card">
            <h2>System Status / Validation Placeholder</h2>
            <ul>
            <li>Read-only data mode: {readOnlyMode}.</li>
            <li>Live read-only mode is intentionally guarded by explicit environment flags.</li>
            <li>Route files: not introduced in this phase.</li>
            <li>Live writes/mutations: triage-only in guarded mode; other actions disabled.</li>
            <li>Auth/email/provider: not added.</li>
          </ul>
        </section>
        </main>
      </div>
    </div>
  );
}
