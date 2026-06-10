import { useMemo } from "react";

import { MonoLabel } from "../brand/MonoLabel";
import type { MockTicketQueueItem } from "../../ui/mockData";

type BoardColumnId = "new" | "triage" | "waiting_on_us" | "waiting_on_customer" | "review" | "complete";

const BOARD_COLUMNS: ReadonlyArray<{
  id: BoardColumnId;
  label: string;
  description: string;
}> = [
  { id: "new", label: "new", description: "just arrived" },
  { id: "triage", label: "triage", description: "needs first pass" },
  { id: "waiting_on_us", label: "waiting_on_us", description: "we owe the next step" },
  { id: "waiting_on_customer", label: "waiting_on_customer", description: "customer action needed" },
  { id: "review", label: "review", description: "needs approval or final check" },
  { id: "complete", label: "complete", description: "done or sent" },
];

function columnForStatus(status: MockTicketQueueItem["status"]): BoardColumnId {
  switch (status) {
    case "received":
      return "new";
    case "triaged":
      return "triage";
    case "reply_drafted":
    case "approved_to_send":
      return "waiting_on_us";
    case "blocked":
      return "waiting_on_customer";
    case "awaiting_gary_approval":
      return "review";
    case "sent_to_customer":
    case "closed":
      return "complete";
    default:
      return "new";
  }
}

function statusLabel(status: MockTicketQueueItem["status"]): string {
  return status.replaceAll("_", " ");
}

function priorityLabel(priority: MockTicketQueueItem["priority"]): string {
  return priority.replaceAll("_", " ");
}

type OperatorBoardProps = {
  tickets: MockTicketQueueItem[];
  selectedTicketId: string;
  onSelectTicket: (ticketId: string) => void;
};

export function OperatorBoard({ tickets, selectedTicketId, onSelectTicket }: OperatorBoardProps) {
  const columns = useMemo(() => {
    const grouped = new Map<BoardColumnId, MockTicketQueueItem[]>(
      BOARD_COLUMNS.map((column) => [column.id, []]),
    );

    for (const ticket of tickets) {
      grouped.get(columnForStatus(ticket.status))?.push(ticket);
    }

    return BOARD_COLUMNS.map((column) => ({
      ...column,
      items: grouped.get(column.id) ?? [],
    }));
  }, [tickets]);

  return (
    <section id="board" className="phase4a-card operator-board-section">
      <div className="operator-section-header">
        <div>
          <p className="pilot-status-kicker">board</p>
          <h2>
            <MonoLabel text="board" />
          </h2>
          <p className="placeholder-meta">
            read-only service operations board. cards move through the work by status; no drag and drop yet.
          </p>
        </div>
        <span className="pilot-status-badge pilot-status-badge-blue">{tickets.length} item(s)</span>
      </div>

      <div className="operator-board-grid" role="list" aria-label="service operations board">
        {columns.map((column) => (
          <article key={column.id} className="operator-board-column">
            <header className="operator-board-column-header">
              <div>
                <h3>
                  <MonoLabel text={column.label} />
                </h3>
                <p className="operator-board-column-meta">{column.description}</p>
              </div>
              <span className="operator-board-count">{column.items.length}</span>
            </header>

            {column.items.length === 0 ? (
              <p className="operator-board-empty">no items in this lane yet.</p>
            ) : (
              <div className="operator-board-list">
                {column.items.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    className="operator-board-card"
                    data-selected={selectedTicketId === ticket.id ? "true" : "false"}
                    onClick={() => onSelectTicket(ticket.id)}
                  >
                    <div className="operator-board-card-topline">
                      <strong>{ticket.title}</strong>
                      <span className="operator-board-pill">{statusLabel(ticket.status)}</span>
                    </div>
                    <div className="operator-board-card-meta">
                      <span>
                        {ticket.clientName}
                        {ticket.siteName ? ` · ${ticket.siteName}` : ""}
                      </span>
                      <span>{priorityLabel(ticket.priority)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
