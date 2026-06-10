/**
 * Customer "My Website Project" — read-only data access.
 *
 * Customers NEVER read the project tables directly (those are operator-only at the RLS level). The
 * entire read path is the column-whitelisting SECURITY DEFINER RPC get_my_projects(), which returns
 * only safe fields. This module just shapes that payload into typed records for the UI — it performs
 * no writes and exposes no intake_notes / stripe ids / audit events / pending deliverables.
 */
import { getAuthClient } from "../auth/realAuthClient";
import type { ProjectPlatform } from "./websiteAccess";

export interface CustomerMilestone {
  id: string;
  title: string;
  description: string | null;
  status: string; // pending | in_progress | done | skipped
  sortOrder: number;
  dueAt: string | null;
  completedAt: string | null;
}

export interface CustomerDeliverable {
  id: string;
  title: string;
  kind: string;
  url: string | null;
  status: string; // delivered | accepted (READY only)
  deliveredAt: string | null;
  acceptedAt: string | null;
}

export interface CustomerLinkedRequest {
  ticketNumber: string;
  title: string;
  status: string;
  requestKind: string;
  createdAt: string;
}

export interface CustomerProject {
  id: string;
  projectNumber: string;
  title: string;
  summary: string | null;
  projectType: string;
  status: string;
  paymentStatus: string;
  priceCents: number | null;
  currency: string;
  websiteUrl: string | null;
  platform: ProjectPlatform | null;
  accessStatus: string;
  targetDeliveryDate: string | null;
  deliveredAt: string | null;
  closedAt: string | null;
  createdAt: string;
  actionNeeded: boolean;
  needsFromYou: string[];
  nextMilestone: { id: string; title: string; status: string; dueAt: string | null } | null;
  milestoneProgress: { done: number; total: number };
  milestones: CustomerMilestone[];
  deliverables: CustomerDeliverable[];
  requests: CustomerLinkedRequest[];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numOrNull(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function mapMilestone(raw: Record<string, unknown>): CustomerMilestone {
  return {
    id: str(raw.id),
    title: str(raw.title) || "Milestone",
    description: strOrNull(raw.description),
    status: str(raw.status) || "pending",
    sortOrder: numOrNull(raw.sort_order) ?? 0,
    dueAt: strOrNull(raw.due_at),
    completedAt: strOrNull(raw.completed_at),
  };
}

function mapDeliverable(raw: Record<string, unknown>): CustomerDeliverable {
  return {
    id: str(raw.id),
    title: str(raw.title) || "Deliverable",
    kind: str(raw.kind) || "link",
    url: strOrNull(raw.url),
    status: str(raw.status) || "delivered",
    deliveredAt: strOrNull(raw.delivered_at),
    acceptedAt: strOrNull(raw.accepted_at),
  };
}

function mapRequest(raw: Record<string, unknown>): CustomerLinkedRequest {
  return {
    ticketNumber: str(raw.ticket_number),
    title: str(raw.title) || "Request",
    status: str(raw.status) || "received",
    requestKind: str(raw.request_kind) || "support",
    createdAt: str(raw.created_at),
  };
}

function mapProject(raw: Record<string, unknown>): CustomerProject {
  const progress = (raw.milestone_progress as Record<string, unknown> | null) ?? {};
  const next = raw.next_milestone as Record<string, unknown> | null;
  const platform = strOrNull(raw.platform);
  return {
    id: str(raw.id),
    projectNumber: str(raw.project_number),
    title: str(raw.title) || "Your website project",
    summary: strOrNull(raw.summary),
    projectType: str(raw.project_type) || "new_website",
    status: str(raw.status) || "intake",
    paymentStatus: str(raw.payment_status) || "unpaid",
    priceCents: numOrNull(raw.price_cents),
    currency: str(raw.currency) || "usd",
    websiteUrl: strOrNull(raw.website_url),
    platform: platform as ProjectPlatform | null,
    accessStatus: str(raw.access_status) || "access_needed",
    targetDeliveryDate: strOrNull(raw.target_delivery_date),
    deliveredAt: strOrNull(raw.delivered_at),
    closedAt: strOrNull(raw.closed_at),
    createdAt: str(raw.created_at),
    actionNeeded: raw.action_needed === true,
    needsFromYou: Array.isArray(raw.needs_from_you)
      ? (raw.needs_from_you as unknown[]).map(str).filter((m) => m.length > 0)
      : [],
    nextMilestone: next
      ? {
          id: str(next.id),
          title: str(next.title) || "Next step",
          status: str(next.status) || "pending",
          dueAt: strOrNull(next.due_at),
        }
      : null,
    milestoneProgress: {
      done: numOrNull(progress.done) ?? 0,
      total: numOrNull(progress.total) ?? 0,
    },
    milestones: Array.isArray(raw.milestones)
      ? (raw.milestones as Array<Record<string, unknown>>).map(mapMilestone)
      : [],
    deliverables: Array.isArray(raw.deliverables)
      ? (raw.deliverables as Array<Record<string, unknown>>).map(mapDeliverable)
      : [],
    requests: Array.isArray(raw.requests)
      ? (raw.requests as Array<Record<string, unknown>>).map(mapRequest)
      : [],
  };
}

/** Load the signed-in customer's website projects via the safe read RPC. Empty array when no auth. */
export async function loadMyProjects(): Promise<CustomerProject[]> {
  const client = getAuthClient();
  if (!client) {
    return [];
  }
  const { data, error } = await client.rpc("get_my_projects");
  if (error || !data) {
    return [];
  }
  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  return rows.map(mapProject);
}
