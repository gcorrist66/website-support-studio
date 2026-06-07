export type MockTicketQueueItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  submittedBy: string;
  updatedAt: string;
};

export type MockApprovalItem = {
  id: string;
  ticketId: string;
  requestBy: string;
  state: "awaiting_gary_approval" | "needs_rework";
  submittedAt: string;
};

export type MockAuditEvent = {
  id: string;
  ticketId: string;
  eventType: string;
  summary: string;
  actor: string;
  occurredAt: string;
};

export const ticketQueue: MockTicketQueueItem[] = [
  {
    id: "TKT-LOCAL-1001",
    title: "Checkout button on campaign page fails",
    status: "received",
    priority: "medium",
    submittedBy: "Customer A",
    updatedAt: "2026-06-07T10:15:00Z",
  },
  {
    id: "TKT-LOCAL-1002",
    title: "FAQ section shows stale pricing",
    status: "triaged",
    priority: "high",
    submittedBy: "Support Form",
    updatedAt: "2026-06-07T09:50:00Z",
  },
];

export const approvalQueue: MockApprovalItem[] = [
  {
    id: "APR-LOCAL-010",
    ticketId: "TKT-LOCAL-1002",
    requestBy: "agent.jane@agency.internal",
    state: "awaiting_gary_approval",
    submittedAt: "2026-06-07T09:58:00Z",
  },
];

export const auditTrail: MockAuditEvent[] = [
  {
    id: "AUD-LOCAL-001",
    ticketId: "TKT-LOCAL-1002",
    eventType: "ticket_created",
    summary: "Local foundation ticket created for UI shell proofing",
    actor: "cs_agent",
    occurredAt: "2026-06-07T09:45:00Z",
  },
  {
    id: "AUD-LOCAL-002",
    ticketId: "TKT-LOCAL-1002",
    eventType: "approval_requested",
    summary: "Draft approval requested from local context",
    actor: "cs_agent",
    occurredAt: "2026-06-07T09:58:00Z",
  },
];
