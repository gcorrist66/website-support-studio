/**
 * Operator project delivery — live read + write path (Website Project MVP).
 *
 * Writes go exclusively through the self-authorizing SECURITY DEFINER operator_* RPCs (operator
 * authorization + tenant scoping + audit are all enforced server-side). Reads use the operator's
 * RLS-scoped SELECT on the project tables (operator-only policies). `isLive()` mirrors the existing
 * operatorWorkflow pattern: true only when a real operator session exists.
 */
import { getAuthClient } from "../auth/realAuthClient";

export interface OperatorClientOption {
  id: string;
  name: string;
}

export interface OperatorProject {
  id: string;
  projectNumber: string;
  clientId: string;
  title: string;
  summary: string | null;
  projectType: string;
  status: string;
  paymentStatus: string;
  priceCents: number | null;
  currency: string;
  websiteUrl: string | null;
  platform: string | null;
  accessStatus: string;
  targetDeliveryDate: string | null;
  intakeNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorMilestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  sortOrder: number;
  dueAt: string | null;
  completedAt: string | null;
}

export interface OperatorDeliverable {
  id: string;
  title: string;
  kind: string;
  url: string | null;
  status: string;
  deliveredAt: string | null;
  acceptedAt: string | null;
}

export interface OperatorProjectDetail {
  project: OperatorProject;
  milestones: OperatorMilestone[];
  deliverables: OperatorDeliverable[];
}

export interface CreateProjectInput {
  clientId: string;
  title: string;
  projectType: string;
  summary?: string | null;
  priceCents?: number | null;
  intakeNotes?: string | null;
  websiteUrl?: string | null;
  platform?: string | null;
  targetDeliveryDate?: string | null;
}

export interface UpdateProjectInput {
  projectId: string;
  title?: string | null;
  summary?: string | null;
  websiteUrl?: string | null;
  platform?: string | null;
  priceCents?: number | null;
  targetDeliveryDate?: string | null;
  intakeNotes?: string | null;
  paymentStatus?: string | null;
}

const PROJECT_COLUMNS =
  "id,project_number,client_id,title,summary,project_type,status,payment_status,price_cents,currency,website_url,platform,access_status,target_delivery_date,intake_notes,created_at,updated_at";

function s(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function sn(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
function nn(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function mapProject(raw: Record<string, unknown>): OperatorProject {
  return {
    id: s(raw.id),
    projectNumber: s(raw.project_number),
    clientId: s(raw.client_id),
    title: s(raw.title) || "Untitled project",
    summary: sn(raw.summary),
    projectType: s(raw.project_type) || "new_website",
    status: s(raw.status) || "intake",
    paymentStatus: s(raw.payment_status) || "unpaid",
    priceCents: nn(raw.price_cents),
    currency: s(raw.currency) || "usd",
    websiteUrl: sn(raw.website_url),
    platform: sn(raw.platform),
    accessStatus: s(raw.access_status) || "access_needed",
    targetDeliveryDate: sn(raw.target_delivery_date),
    intakeNotes: sn(raw.intake_notes),
    createdAt: s(raw.created_at),
    updatedAt: s(raw.updated_at),
  };
}

function mapMilestone(raw: Record<string, unknown>): OperatorMilestone {
  return {
    id: s(raw.id),
    title: s(raw.title) || "Milestone",
    description: sn(raw.description),
    status: s(raw.status) || "pending",
    sortOrder: nn(raw.sort_order) ?? 0,
    dueAt: sn(raw.due_at),
    completedAt: sn(raw.completed_at),
  };
}

function mapDeliverable(raw: Record<string, unknown>): OperatorDeliverable {
  return {
    id: s(raw.id),
    title: s(raw.title) || "Deliverable",
    kind: s(raw.kind) || "link",
    url: sn(raw.url),
    status: s(raw.status) || "pending",
    deliveredAt: sn(raw.delivered_at),
    acceptedAt: sn(raw.accepted_at),
  };
}

async function call(fn: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const client = getAuthClient();
  if (!client) {
    throw new Error("auth_not_configured");
  }
  const { data, error } = await client.rpc(fn, args);
  if (error || !data) {
    throw new Error(error?.message ?? `${fn}_failed`);
  }
  return data as Record<string, unknown>;
}

export const operatorProjects = {
  /** True only when a real operator session can perform live reads/writes. */
  isLive(): boolean {
    return Boolean(getAuthClient());
  },

  async listClients(): Promise<OperatorClientOption[]> {
    const client = getAuthClient();
    if (!client) {
      return [];
    }
    const { data, error } = await client.from("clients").select("id,name").order("name");
    if (error || !data) {
      return [];
    }
    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: s(row.id),
      name: s(row.name) || "Unnamed customer",
    }));
  },

  async listProjects(): Promise<OperatorProject[]> {
    const client = getAuthClient();
    if (!client) {
      return [];
    }
    const { data, error } = await client
      .from("projects")
      .select(PROJECT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error || !data) {
      return [];
    }
    return (data as Array<Record<string, unknown>>).map(mapProject);
  },

  async loadDetail(projectId: string): Promise<OperatorProjectDetail | null> {
    const client = getAuthClient();
    if (!client || !projectId) {
      return null;
    }
    const [projectQuery, milestoneQuery, deliverableQuery] = await Promise.all([
      client.from("projects").select(PROJECT_COLUMNS).eq("id", projectId).maybeSingle(),
      client
        .from("project_milestones")
        .select("id,title,description,status,sort_order,due_at,completed_at")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
      client
        .from("project_deliverables")
        .select("id,title,kind,url,status,delivered_at,accepted_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
    ]);

    if (projectQuery.error || !projectQuery.data) {
      return null;
    }
    return {
      project: mapProject(projectQuery.data as Record<string, unknown>),
      milestones: !milestoneQuery.error && milestoneQuery.data
        ? (milestoneQuery.data as Array<Record<string, unknown>>).map(mapMilestone)
        : [],
      deliverables: !deliverableQuery.error && deliverableQuery.data
        ? (deliverableQuery.data as Array<Record<string, unknown>>).map(mapDeliverable)
        : [],
    };
  },

  createProject(input: CreateProjectInput) {
    return call("operator_create_project", {
      p_client_id: input.clientId,
      p_title: input.title,
      p_project_type: input.projectType,
      p_summary: input.summary ?? null,
      p_site_id: null,
      p_price_cents: input.priceCents ?? null,
      p_intake_notes: input.intakeNotes ?? null,
      p_website_url: input.websiteUrl ?? null,
      p_platform: input.platform ?? null,
      p_target_delivery_date: input.targetDeliveryDate ?? null,
    });
  },

  updateProject(input: UpdateProjectInput) {
    return call("operator_update_project", {
      p_project_id: input.projectId,
      p_title: input.title ?? null,
      p_summary: input.summary ?? null,
      p_website_url: input.websiteUrl ?? null,
      p_platform: input.platform ?? null,
      p_price_cents: input.priceCents ?? null,
      p_target_delivery_date: input.targetDeliveryDate ?? null,
      p_intake_notes: input.intakeNotes ?? null,
      p_payment_status: input.paymentStatus ?? null,
    });
  },

  setStatus(projectId: string, status: string, note?: string) {
    return call("operator_set_project_status", {
      p_project_id: projectId,
      p_status: status,
      p_note: note ?? null,
    });
  },

  setAccess(projectId: string, accessStatus: string, note?: string) {
    return call("operator_set_project_access", {
      p_project_id: projectId,
      p_access_status: accessStatus,
      p_note: note ?? null,
    });
  },

  applyTemplate(projectId: string, template?: string) {
    return call("operator_apply_milestone_template", {
      p_project_id: projectId,
      p_template: template ?? null,
    });
  },

  addMilestone(projectId: string, title: string, description?: string, sortOrder?: number) {
    return call("operator_add_milestone", {
      p_project_id: projectId,
      p_title: title,
      p_description: description ?? null,
      p_sort_order: sortOrder ?? 0,
      p_due_at: null,
    });
  },

  setMilestoneStatus(milestoneId: string, status: string) {
    return call("operator_set_milestone_status", {
      p_milestone_id: milestoneId,
      p_status: status,
    });
  },

  addDeliverable(projectId: string, title: string, kind: string, url?: string) {
    return call("operator_add_deliverable", {
      p_project_id: projectId,
      p_title: title,
      p_kind: kind,
      p_url: url ?? null,
    });
  },

  setDeliverableStatus(deliverableId: string, status: string) {
    return call("operator_set_deliverable_status", {
      p_deliverable_id: deliverableId,
      p_status: status,
    });
  },
};
