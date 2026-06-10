export type MockTicketQueueItem = {
  id: string;
  workflowId?: string;
  title: string;
  status:
    | "received"
    | "triaged"
    | "blocked"
    | "awaiting_gary_approval"
    | "approved_to_send"
    | "sent_to_customer"
    | "reply_drafted"
    | "closed";
  priority: "low" | "medium" | "high" | "urgent" | "normal" | "critical";
  submittedBy: string;
  updatedAt: string;
  siteId: string;
  siteName: string;
  clientId: string;
  clientName: string;
  blockedReason?: string;
  identityConfidence: "known" | "claimed" | "unknown";
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

export type MockRequestAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  publicUrl: string;
  createdAt: string;
};

export type MockTicketDetail = {
  id: string;
  workflowId?: string;
  summary: string;
  customerRequest: string;
  status:
    | "received"
    | "triaged"
    | "blocked"
    | "awaiting_gary_approval"
    | "approved_to_send"
    | "sent_to_customer"
    | "reply_drafted"
    | "closed";
  priority: "low" | "medium" | "high" | "urgent" | "normal" | "critical";
  identityConfidence: "known" | "claimed" | "unknown";
  tenantContext: {
    agencyId: string;
    agencyName: string;
    clientId: string;
    clientName: string;
    siteId: string;
    siteName: string;
  };
  submittedBy: string;
  submittedAt: string;
  approvalStatus: "not_required" | "awaiting_approval" | "approved" | "rejected";
  blockedReason?: string;
  auditTimeline: MockAuditEvent[];
  attachments?: MockRequestAttachment[];
};

export const ticketQueue: MockTicketQueueItem[] = [
  {
  id: "TKT-LOCAL-1001",
    workflowId: "TKT-LOCAL-1001",
    title: "Checkout button on campaign page fails",
    status: "received",
    priority: "medium",
    submittedBy: "Customer A",
    updatedAt: "2026-06-07T10:15:00Z",
    siteId: "SITE-01",
    siteName: "North Coast Site",
    clientId: "CLI-01",
    clientName: "North Coast Retail",
    identityConfidence: "known",
    blockedReason: undefined,
  },
  {
    id: "TKT-LOCAL-1002",
    workflowId: "TKT-LOCAL-1002",
    title: "FAQ section shows stale pricing",
    status: "triaged",
    priority: "high",
    submittedBy: "Support Form",
    updatedAt: "2026-06-07T09:50:00Z",
    siteId: "SITE-02",
    siteName: "Acme Site",
    clientId: "CLI-02",
    clientName: "Acme Holdings",
    identityConfidence: "claimed",
  },
  {
    id: "TKT-LOCAL-1003",
    workflowId: "TKT-LOCAL-1003",
    title: "Webhook not firing after checkout",
    status: "blocked",
    priority: "urgent",
    submittedBy: "Partner Bot",
    updatedAt: "2026-06-07T09:10:00Z",
    siteId: "SITE-03",
    siteName: "Pulse Lab",
    clientId: "CLI-03",
    clientName: "Pulse Labs",
    identityConfidence: "unknown",
    blockedReason: "customer_data_required",
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
  {
    id: "AUD-LOCAL-003",
    ticketId: "TKT-LOCAL-1001",
    eventType: "ticket_created",
    summary: "Customer request captured for local queue detail review.",
    actor: "cs_agent",
    occurredAt: "2026-06-07T08:40:00Z",
  },
  {
    id: "AUD-LOCAL-004",
    ticketId: "TKT-LOCAL-1001",
    eventType: "ticket_triaged",
    summary: "Ticket triaged to local queue for review without persistence mutation.",
    actor: "cs_agent",
    occurredAt: "2026-06-07T08:55:00Z",
  },
  {
    id: "AUD-LOCAL-005",
    ticketId: "TKT-LOCAL-1001",
    eventType: "reply_drafted",
    summary: "Draft reply prepared in local only for review.",
    actor: "cs_agent",
    occurredAt: "2026-06-07T09:10:00Z",
  },
];

export const ticketDetails: MockTicketDetail[] = [
  {
    id: "TKT-LOCAL-1001",
    workflowId: "TKT-LOCAL-1001",
    summary: "Checkout button on campaign page fails",
    customerRequest:
      "Customer reports that the checkout button fails intermittently on desktop Safari and requires local investigation before reply can be prepared.",
    status: "received",
    priority: "medium",
    identityConfidence: "known",
    tenantContext: {
      agencyId: "AG-01",
      agencyName: "North Coast Agency",
      clientId: "CLI-01",
      clientName: "North Coast Retail",
      siteId: "SITE-01",
      siteName: "North Coast Site",
    },
    submittedBy: "Customer A",
    submittedAt: "2026-06-07T10:15:00Z",
    approvalStatus: "not_required",
    auditTimeline: auditTrail
      .filter((event) => event.ticketId === "TKT-LOCAL-1001")
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    attachments: [
      {
        id: "ATT-LOCAL-1001",
        fileName: "checkout-error.png",
        mimeType: "image/png",
        fileSizeBytes: 284_192,
        publicUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop",
        createdAt: "2026-06-07T10:16:00Z",
      },
      {
        id: "ATT-LOCAL-1002",
        fileName: "campaign-checkout-notes.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 182_014,
        publicUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        createdAt: "2026-06-07T10:18:00Z",
      },
    ],
  },
  {
    id: "TKT-LOCAL-1002",
    workflowId: "TKT-LOCAL-1002",
    summary: "FAQ section shows stale pricing",
    customerRequest:
      "Customer states that the pricing card on the FAQ page shows stale values compared with the current plan table.",
    status: "triaged",
    priority: "high",
    identityConfidence: "claimed",
    tenantContext: {
      agencyId: "AG-01",
      agencyName: "North Coast Agency",
      clientId: "CLI-02",
      clientName: "Acme Holdings",
      siteId: "SITE-02",
      siteName: "Acme Site",
    },
    submittedBy: "Support Form",
    submittedAt: "2026-06-07T09:50:00Z",
    approvalStatus: "awaiting_approval",
    blockedReason: undefined,
    auditTimeline: auditTrail
      .filter((event) => event.ticketId === "TKT-LOCAL-1002")
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    attachments: [
      {
        id: "ATT-LOCAL-1003",
        fileName: "pricing-screenshot.jpg",
        mimeType: "image/jpeg",
        fileSizeBytes: 198_401,
        publicUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop",
        createdAt: "2026-06-07T09:52:00Z",
      },
    ],
  },
  {
    id: "TKT-LOCAL-1003",
    workflowId: "TKT-LOCAL-1003",
    summary: "Webhook not firing after checkout",
    customerRequest:
      "Webhook notifications appear delayed or absent after successful checkout events and may impact downstream fulfillment.",
    status: "blocked",
    priority: "urgent",
    identityConfidence: "unknown",
    tenantContext: {
      agencyId: "AG-02",
      agencyName: "Pulse Agency",
      clientId: "CLI-03",
      clientName: "Pulse Labs",
      siteId: "SITE-03",
      siteName: "Pulse Lab",
    },
    submittedBy: "Partner Bot",
    submittedAt: "2026-06-07T09:10:00Z",
    approvalStatus: "rejected",
    blockedReason: "customer_data_required",
    auditTimeline: [
      {
        id: "AUD-LOCAL-006",
        ticketId: "TKT-LOCAL-1003",
        eventType: "ticket_created",
        summary: "Blocked ticket created pending customer details in local placeholder flow.",
        actor: "system",
        occurredAt: "2026-06-07T09:00:00Z",
      },
      {
        id: "AUD-LOCAL-007",
        ticketId: "TKT-LOCAL-1003",
        eventType: "ticket_blocked",
        summary: "Ticket blocked due to missing customer context required to proceed.",
        actor: "cs_agent",
        occurredAt: "2026-06-07T09:05:00Z",
      },
      {
        id: "AUD-LOCAL-008",
        ticketId: "TKT-LOCAL-1003",
        eventType: "ticket_unblocked",
        summary: "Blocked state cleared; awaiting draft in local workflow only.",
        actor: "cs_agent",
        occurredAt: "2026-06-07T09:10:00Z",
      },
    ],
    attachments: [],
  },
];

export function getTicketDetail(ticketId: string): MockTicketDetail {
  return ticketDetails.find((item) => item.id === ticketId) ?? ticketDetails[0];
}
