import { useMemo } from "react";

import { MonoLabel } from "../brand/MonoLabel";
import type { MockTicketQueueItem } from "../../ui/mockData";

const ACCESS_STATES = ["requested", "received", "verified", "blocked"] as const;
export type AccessTrackState = (typeof ACCESS_STATES)[number];
export type ProjectAccessState = "not_applicable" | AccessTrackState;

type ProjectAccessPageProps = {
  tickets: MockTicketQueueItem[];
  accessStates: Record<string, ProjectAccessState>;
  onSetAccessState?: (ticketId: string, state: AccessTrackState) => void;
};

type AccessRow = MockTicketQueueItem & { accessState: AccessTrackState };

function deriveAccessState(ticket: MockTicketQueueItem, override?: ProjectAccessState): AccessTrackState {
  const normalizedReason = ticket.blockedReason?.toLowerCase() ?? "";
  if (override && override !== "not_applicable") {
    return override;
  }
  if (normalizedReason.includes("access") || normalizedReason.includes("credential") || normalizedReason.includes("login")) {
    return "requested";
  }
  if (normalizedReason.includes("blocked") || normalizedReason.includes("reject")) {
    return "blocked";
  }
  if (ticket.status === "sent_to_customer" || ticket.status === "closed") {
    return "verified";
  }
  if (ticket.status === "reply_drafted" || ticket.status === "approved_to_send") {
    return "received";
  }
  return "requested";
}

function stateHint(state: AccessTrackState): string {
  if (state === "requested") {
    return "access is still missing and customer action is usually required.";
  }
  if (state === "received") {
    return "customer shared credentials or granted preliminary platform access.";
  }
  if (state === "verified") {
    return "access is confirmed and work can proceed.";
  }
  return "access is blocked; confirm scope, invitation, or permission requirements.";
}

export function ProjectAccessPage({ tickets, accessStates, onSetAccessState }: ProjectAccessPageProps) {
  const accessRows = useMemo<AccessRow[]>(
    () =>
      tickets.map((ticket) => ({
        ...ticket,
        accessState: deriveAccessState(ticket, accessStates[ticket.id]),
      })),
    [tickets, accessStates],
  );

  const groupedRows = useMemo(() => {
    const grouped = ACCESS_STATES.map((state) => ({
      state,
      items: accessRows.filter((row) => row.accessState === state),
    }));
    return {
      counts: Object.fromEntries(grouped.map((item) => [item.state, item.items.length])) as Record<AccessTrackState, number>,
      columns: grouped,
    };
  }, [accessRows]);

  return (
    <section className="wss-panel">
      <article className="wss-section-heading">
        <p className="wss-card-kicker">
          <MonoLabel text="project_access" />
        </p>
        <h2>
          <MonoLabel text="access dashboard" />
        </h2>
        <p className="wss-section-description">
          Track platform access states so requests can move from blocked to executable.
        </p>
      </article>

      <div className="wss-project-access-grid">
        {groupedRows.columns.map((column) => (
          <article key={column.state} className="wss-project-access-card">
            <div className="wss-project-access-head">
              <h3>
                <MonoLabel text={column.state} />
              </h3>
              <span>{groupedRows.counts[column.state]}</span>
            </div>
            <p className="wss-section-description">{stateHint(column.state)}</p>

            <div className="wss-project-access-list">
              {column.items.length === 0 ? (
                <p className="wss-empty-state">none</p>
              ) : (
                column.items.map((ticket) => (
                  <article key={ticket.id} className="wss-request-item">
                    <strong>{ticket.title}</strong>
                    <span>
                      {ticket.clientName} / {ticket.siteName}
                    </span>
                    <span>
                      <MonoLabel text={ticket.accessState} /> · {ticket.status}
                    </span>
                    <label className="wss-field">
                      <span className="wss-field-label">
                        <MonoLabel text="set_access_state" />
                      </span>
                      <select
                        className="wss-input"
                        value={ticket.accessState}
                        onChange={(event) => {
                          if (!onSetAccessState) {
                            return;
                          }
                          const nextState = event.currentTarget.value as AccessTrackState;
                          onSetAccessState(ticket.id, nextState);
                        }}
                      >
                        {ACCESS_STATES.map((state) => (
                          <option key={`${ticket.id}-${state}`} value={state}>
                            {state.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
