/**
 * Customer request submission — data access.
 *
 * Sites are read RLS-scoped (the customer only sees their own org's sites). Ticket creation goes
 * exclusively through the submit_customer_request SECURITY DEFINER RPC — the browser never inserts
 * tickets directly and never handles agency/client IDs.
 */
import { getAuthClient } from "../auth/realAuthClient";

export interface SiteOption {
  id: string;
  name: string;
}

export interface CustomerRequestAttachmentDraft {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  publicUrl: string;
}

export interface CustomerRequestAttachmentRecord extends CustomerRequestAttachmentDraft {
  id: string;
  createdAt: string;
}

export interface CustomerRequestRecord {
  ticketId: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  siteId: string;
  siteName: string;
  createdAt: string;
  updatedAt: string;
  attachments: CustomerRequestAttachmentRecord[];
}

const ATTACHMENT_BUCKET = "request_attachments";
const ACCEPTED_ATTACHMENT_EXTENSIONS = new Set(["png", "jpg", "jpeg", "pdf", "doc", "docx", "csv", "txt", "zip"]);
const ACCEPTED_ATTACHMENT_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

function getRandomId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeFileName(name: string): string {
  return name.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

function getExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function isAcceptedAttachment(file: File): boolean {
  const extension = getExtension(file.name);
  if (extension && ACCEPTED_ATTACHMENT_EXTENSIONS.has(extension)) {
    return true;
  }
  if (file.type && ACCEPTED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return true;
  }
  return false;
}

function inferMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }
  switch (getExtension(file.name)) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "csv":
      return "text/csv";
    case "txt":
      return "text/plain";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

export async function listMySites(): Promise<SiteOption[]> {
  const client = getAuthClient();
  if (!client) {
    return [];
  }
  const { data, error } = await client.from("sites").select("id,name").order("name");
  if (error || !data) {
    return [];
  }
  return data as SiteOption[];
}

export interface SubmitRequestInput {
  siteId: string;
  title: string;
  description: string;
  priority: string;
}

export interface SubmitRequestResult {
  ticket_id: string;
  ticket_number: string;
  status: string;
}

export async function submitCustomerRequest(input: SubmitRequestInput): Promise<SubmitRequestResult> {
  const client = getAuthClient();
  if (!client) {
    throw new Error("auth_not_configured");
  }
  const { data, error } = await client.rpc("submit_customer_request", {
    p_site_id: input.siteId,
    p_title: input.title,
    p_description: input.description,
    p_priority: input.priority,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "submit_failed");
  }
  return data as SubmitRequestResult;
}

export interface SubmitCustomerRequestWithAttachmentsInput extends SubmitRequestInput {
  attachments: Array<{
    storagePath: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
  }>;
}

export async function submitCustomerRequestWithAttachments(
  input: SubmitCustomerRequestWithAttachmentsInput,
): Promise<SubmitRequestResult> {
  const client = getAuthClient();
  if (!client) {
    throw new Error("auth_not_configured");
  }
  const { data, error } = await client.rpc("submit_customer_request_with_attachments", {
    p_site_id: input.siteId,
    p_title: input.title,
    p_description: input.description,
    p_priority: input.priority,
    p_attachments: input.attachments,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "submit_failed");
  }
  return data as SubmitRequestResult;
}

export async function uploadRequestAttachment(file: File, draftId: string): Promise<CustomerRequestAttachmentDraft> {
  if (!isAcceptedAttachment(file)) {
    throw new Error("unsupported_attachment_type");
  }

  const client = getAuthClient();
  if (!client) {
    throw new Error("auth_not_configured");
  }

  const attachmentId = getRandomId();
  const storagePath = `drafts/${draftId}/${attachmentId}/${normalizeFileName(file.name)}`;
  const mimeType = inferMimeType(file);
  const { error } = await client.storage.from(ATTACHMENT_BUCKET).upload(storagePath, file, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message ?? "attachment_upload_failed");
  }

  const publicUrl = client.storage.from(ATTACHMENT_BUCKET).getPublicUrl(storagePath).data.publicUrl;

  return {
    storagePath,
    fileName: file.name,
    mimeType,
    fileSizeBytes: file.size,
    publicUrl,
  };
}

export async function removeRequestAttachment(storagePath: string): Promise<void> {
  const client = getAuthClient();
  if (!client) {
    return;
  }
  await client.storage.from(ATTACHMENT_BUCKET).remove([storagePath]);
}

export async function loadMyRequests(orgId: string): Promise<CustomerRequestRecord[]> {
  const client = getAuthClient();
  if (!client || !orgId) {
    return [];
  }

  const [ticketQuery, attachmentQuery] = await Promise.all([
    client
      .from("tickets")
      .select("id,ticket_number,title,status,priority,site_id,created_at,updated_at,sites(id,name)")
      .eq("client_id", orgId)
      .order("created_at", { ascending: false }),
    client
      .from("ticket_attachments")
      .select("id,ticket_id,storage_path,file_name,mime_type,file_size_bytes,created_at")
      .eq("client_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  if (ticketQuery.error || !ticketQuery.data) {
    return [];
  }

  const attachmentsByTicket = new Map<string, CustomerRequestAttachmentRecord[]>();
  if (!attachmentQuery.error && attachmentQuery.data) {
    for (const raw of attachmentQuery.data as Array<Record<string, unknown>>) {
      const ticketId = typeof raw.ticket_id === "string" ? raw.ticket_id : "";
      const storagePath = typeof raw.storage_path === "string" ? raw.storage_path : "";
      const fileName = typeof raw.file_name === "string" ? raw.file_name : "";
      const mimeType = typeof raw.mime_type === "string" ? raw.mime_type : "";
      if (!ticketId || !storagePath || !fileName || !mimeType) {
        continue;
      }
      const publicUrl = client.storage.from(ATTACHMENT_BUCKET).getPublicUrl(storagePath).data.publicUrl;
      const attachment: CustomerRequestAttachmentRecord = {
        id: typeof raw.id === "string" ? raw.id : storagePath,
        storagePath,
        fileName,
        mimeType,
        fileSizeBytes: typeof raw.file_size_bytes === "number" ? raw.file_size_bytes : Number(raw.file_size_bytes ?? 0),
        publicUrl,
        createdAt: typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
      };
      const existing = attachmentsByTicket.get(ticketId) ?? [];
      existing.push(attachment);
      attachmentsByTicket.set(ticketId, existing);
    }
  }

  return (ticketQuery.data as Array<Record<string, unknown>>).map((raw) => {
    const siteRow = (raw.sites as Record<string, unknown> | null | undefined) ?? {};
    const ticketId = typeof raw.id === "string" ? raw.id : "";
    return {
      ticketId: ticketId || (typeof raw.ticket_number === "string" ? raw.ticket_number : ""),
      ticketNumber: typeof raw.ticket_number === "string" ? raw.ticket_number : ticketId,
      title: typeof raw.title === "string" ? raw.title : "Untitled request",
      status: typeof raw.status === "string" ? raw.status : "received",
      priority: typeof raw.priority === "string" ? raw.priority : "normal",
      siteId: typeof raw.site_id === "string" ? raw.site_id : "",
      siteName: typeof siteRow.name === "string" ? siteRow.name : "Unknown site",
      createdAt: typeof raw.created_at === "string" ? raw.created_at : new Date().toISOString(),
      updatedAt: typeof raw.updated_at === "string" ? raw.updated_at : new Date().toISOString(),
      attachments: attachmentsByTicket.get(ticketId) ?? [],
    };
  });
}

export type FeedbackCategory = "feedback" | "feature_request" | "bug_report" | "other";

const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feedback: "Feedback",
  feature_request: "Feature request",
  bug_report: "Bug report",
  other: "Other",
};

const FEEDBACK_PRIORITY_BY_CATEGORY: Record<FeedbackCategory, string> = {
  feedback: "low",
  feature_request: "normal",
  bug_report: "high",
  other: "normal",
};

export interface SubmitCustomerFeedbackInput {
  siteId: string;
  category: FeedbackCategory;
  subject: string;
  details: string;
}

export async function submitCustomerFeedback(
  input: SubmitCustomerFeedbackInput,
): Promise<SubmitRequestResult> {
  const categoryLabel = FEEDBACK_CATEGORY_LABELS[input.category];
  const title = `Product feedback: ${categoryLabel}${input.subject.trim() ? ` - ${input.subject.trim()}` : ""}`;
  const description = [
    "Internal product feedback for Corriston Consulting / website_support_studio.",
    `Category: ${categoryLabel}`,
    "",
    input.details.trim(),
  ]
    .filter((line, index, lines) => !(index === lines.length - 1 && line.length === 0))
    .join("\n");

  return submitCustomerRequest({
    siteId: input.siteId,
    title,
    description,
    priority: FEEDBACK_PRIORITY_BY_CATEGORY[input.category],
  });
}
