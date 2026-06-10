import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { LogoLockup } from "../brand/LogoLockup";
import { MonoLabel } from "../brand/MonoLabel";
import {
  listMySites,
  removeRequestAttachment,
  submitCustomerFeedback,
  submitCustomerRequestWithAttachments,
  uploadRequestAttachment,
  type CustomerRequestAttachmentDraft,
  type FeedbackCategory,
  type SiteOption,
} from "../../data/customerRequests";
import { loadOperatorPilotStatus, createEmptyOperatorPilotStatus, type OperatorPilotStatus } from "../../data/operatorPilotStatus";
import {
  ticketDetails,
  ticketQueue,
  type MockTicketDetail,
  type MockTicketQueueItem,
} from "../../ui/mockData";
import {
  getReadOnlyTicketDetail,
  getReadOnlyTicketQueue,
} from "../../data/readOnlyTicketData";

type ConsoleSection = "overview" | "board" | "requests" | "profile" | "website_access" | "activity" | "health";
type FeedbackTab = "bug_report" | "feature_request" | "general_feedback";
type CreditTopupKey = "topup_50" | "topup_100" | "topup_250";
type WebsitePlatformKey = "wordpress" | "shopify" | "webflow" | "squarespace" | "wix" | "custom_other" | "hosting_dns";
type RequestType = "website_update" | "bug_report" | "urgent_issue" | "question" | "other";
type RequestUrgency = "normal" | "high" | "urgent";
type AttachmentState = CustomerRequestAttachmentDraft & {
  id: string;
  status: "uploading" | "ready" | "error";
  previewUrl: string | null;
  error: string | null;
};

const SECTION_ORDER: ConsoleSection[] = [
  "overview",
  "board",
  "requests",
  "website_access",
  "activity",
  "health",
  "profile",
];

const FEEDBACK_TABS: Array<{ key: FeedbackTab; label: string; category: FeedbackCategory; hint: string }> = [
  {
    key: "bug_report",
    label: "bug_report",
    category: "bug_report",
    hint: "Something is broken, confusing, or behaving unexpectedly.",
  },
  {
    key: "feature_request",
    label: "feature_request",
    category: "feature_request",
    hint: "A workflow or capability you want to add.",
  },
  {
    key: "general_feedback",
    label: "general_feedback",
    category: "feedback",
    hint: "General comments, praise, or process notes.",
  },
];

const REQUEST_TYPES: RequestType[] = ["website_update", "bug_report", "urgent_issue", "question", "other"];
const REQUEST_URGENCIES: RequestUrgency[] = ["normal", "high", "urgent"];
const ACCEPT_ATTR = ".png,.jpg,.jpeg,.pdf,.doc,.docx,.csv,.txt,.zip,image/png,image/jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain,application/zip,application/x-zip-compressed";
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

const ACCOUNT_SUMMARY = {
  profile: "gary",
  company: "north_coast_retail",
  website: "northcoast.example",
  currentPlan: "operations",
  billingStatus: "active",
  founderPricingStatus: "founder pricing active",
  founderPricingMessage:
    "50% off for the first 6 months. founder pricing runs for the first 6 months, then standard pricing becomes $399/month. We show this clearly so there are no surprise billing changes.",
  creditsIncluded: 40,
  creditsUsed: 22,
  creditsRemaining: 18,
  lowEffortExplanation: "small edits, content swaps, image changes, typo fixes, and quick CMS updates.",
  mediumEffortExplanation: "single-page changes, plugin updates, form adjustments, and structured content work.",
  highEffortExplanation: "multi-step repairs, staging coordination, layout fixes, and broader site changes.",
  replenishmentMessaging:
    "monthly credits refresh each month and do not roll over. purchased top-ups stay on the account until used, roll over, and are used after monthly credits run out.",
};

const CREDIT_EFFORTS = [
  {
    key: "low_effort",
    label: "low_effort",
    credits: 1,
    examples: ACCOUNT_SUMMARY.lowEffortExplanation,
  },
  {
    key: "medium_effort",
    label: "medium_effort",
    credits: 3,
    examples: ACCOUNT_SUMMARY.mediumEffortExplanation,
  },
  {
    key: "high_effort",
    label: "high_effort",
    credits: 8,
    examples: ACCOUNT_SUMMARY.highEffortExplanation,
  },
] as const;

const CREDIT_TOPUPS: Array<{
  key: CreditTopupKey;
  label: string;
  credits: number;
  price: string;
  note: string;
}> = [
  {
    key: "topup_50",
    label: "50_credits",
    credits: 50,
    price: "$150",
    note: "$3.00 / credit. purchased credits roll over and are used after monthly credits.",
  },
  {
    key: "topup_100",
    label: "100_credits",
    credits: 100,
    price: "$275",
    note: "$2.75 / credit. purchased credits roll over and are used after monthly credits.",
  },
  {
    key: "topup_250",
    label: "250_credits",
    credits: 250,
    price: "$625",
    note: "$2.50 / credit. purchased credits roll over and are used after monthly credits.",
  },
];

const CREDIT_POLICY = [
  "monthly capacity units refresh each month and do not roll over.",
  "purchased top-up credits stay on the account until used.",
  "top-up credits roll over and are used after the monthly allocation is exhausted.",
] as const;

const CHECKOUT_FUNCTION_URL = "https://sfhllezyyylduxvwdxki.supabase.co/functions/v1/create-checkout-session";

const WEBSITE_ACCESS_PLATFORMS: Array<{
  key: WebsitePlatformKey;
  label: string;
  icon: string;
  required: string[];
  optional: string[];
  canChange: string[];
  customerNeeds: string[];
  nextStep: string;
}> = [
  {
    key: "wordpress",
    label: "wordpress",
    icon: "wp",
    required: ["admin login", "plugin/theme access when the request touches code, layout, or integrations"],
    optional: ["hosting access if file/server changes are needed", "backup and staging access before larger changes"],
    canChange: ["content, menus, forms, plugins, themes, and approved site settings"],
    customerNeeds: ["a temporary admin user or secure credential share", "backup location or restore process for safer changes"],
    nextStep: "send a temporary WordPress admin invite, then add hosting or staging access if the request needs it.",
  },
  {
    key: "shopify",
    label: "shopify",
    icon: "sh",
    required: ["staff or collaborator access", "theme access for layout, liquid, or storefront changes"],
    optional: ["app permissions only when a request touches that app", "domain access if DNS or routing is involved"],
    canChange: ["themes, sections, product/content updates, navigation, and app configuration with approval"],
    customerNeeds: ["approve the collaborator request", "confirm any app-specific permissions before work starts"],
    nextStep: "invite WSS as a Shopify collaborator or staff user with theme permissions.",
  },
  {
    key: "webflow",
    label: "webflow",
    icon: "wf",
    required: ["workspace or site access", "designer/editor access"],
    optional: ["CMS access for collection work", "publish permission when WSS should ship approved changes"],
    canChange: ["pages, components, styles, CMS content, interactions, and approved publish-ready updates"],
    customerNeeds: ["invite WSS to the workspace/site", "confirm whether changes should stay in draft or be published"],
    nextStep: "add WSS to the Webflow workspace or site with designer/editor access.",
  },
  {
    key: "squarespace",
    label: "squarespace",
    icon: "sq",
    required: ["contributor or admin access"],
    optional: ["domain/DNS access if routing, email records, or certificates are part of the request"],
    canChange: ["pages, blocks, navigation, forms, basic design settings, and approved content updates"],
    customerNeeds: ["invite WSS as a contributor", "confirm domain owner access if DNS work is needed"],
    nextStep: "send a Squarespace contributor invite with permissions matched to the request.",
  },
  {
    key: "wix",
    label: "wix",
    icon: "wx",
    required: ["contributor or admin access", "site dashboard access"],
    optional: ["app permissions only when the request touches a specific Wix app", "domain access for DNS or routing changes"],
    canChange: ["site content, design settings, forms, apps, navigation, and approved dashboard updates"],
    customerNeeds: ["invite WSS from the Wix dashboard", "confirm whether WSS can publish after approval"],
    nextStep: "invite WSS as a Wix contributor/admin for the specific site.",
  },
  {
    key: "custom_other",
    label: "custom / other",
    icon: "<>",
    required: ["CMS/admin access", "hosting, SFTP, or Git access if applicable"],
    optional: ["DNS/domain access if routing is part of the request", "staging and backup access before risky changes"],
    canChange: ["CMS content, templates, code-backed updates, integrations, and approved deployment work"],
    customerNeeds: ["tell WSS what platform powers the site", "share the safest admin, Git, SFTP, or hosting path available"],
    nextStep: "send the platform name and safest access path; WSS will confirm the minimum required access.",
  },
  {
    key: "hosting_dns",
    label: "hosting / dns access",
    icon: "dns",
    required: ["hosting access for server, file, SSL, backup, or environment changes", "DNS/domain access for records and routing"],
    optional: ["read-only access first if the host supports it", "staging/snapshot access before production changes"],
    canChange: ["DNS records, redirects, SSL, backups, deploy settings, and approved hosting configuration"],
    customerNeeds: ["confirm the registrar and host", "share temporary access or invite WSS as a delegated user"],
    nextStep: "identify the host/registrar, then invite WSS or prepare temporary access for the exact task.",
  },
];

const ACTIVE_REQUEST_STATUSES = new Set<MockTicketQueueItem["status"]>([
  "received",
  "triaged",
  "blocked",
  "awaiting_gary_approval",
  "reply_drafted",
  "approved_to_send",
]);

function getSectionFromPath(pathname: string): ConsoleSection {
  const cleaned = pathname.replace(/\/+$/, "");
  const segment = cleaned.split("/").filter(Boolean)[0];
  if (segment && SECTION_ORDER.includes(segment as ConsoleSection)) {
    return segment as ConsoleSection;
  }
  return "overview";
}

function isSectionPath(pathname: string): boolean {
  return SECTION_ORDER.some((section) => pathname === `/${section}` || pathname.startsWith(`/${section}/`));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "not available";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? "not available" : value.toLocaleString("en-US");
}

function formatPriority(priority: MockTicketQueueItem["priority"]): string {
  return priority;
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function getRandomId(prefix = "req"): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function isAcceptedAttachment(file: File): boolean {
  const extension = getExtension(file.name);
  return ACCEPTED_ATTACHMENT_EXTENSIONS.has(extension) || Boolean(file.type && ACCEPTED_ATTACHMENT_MIME_TYPES.has(file.type));
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

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function getAttachmentLabel(mimeType: string): string {
  if (mimeType === "application/pdf") {
    return "pdf";
  }
  if (mimeType.includes("word")) {
    return "doc";
  }
  if (mimeType === "text/csv") {
    return "csv";
  }
  if (mimeType === "text/plain") {
    return "txt";
  }
  if (mimeType.includes("zip")) {
    return "zip";
  }
  return mimeType.split("/").at(-1) ?? "file";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function urgencyToPriority(urgency: RequestUrgency): MockTicketQueueItem["priority"] {
  return urgency === "urgent" ? "urgent" : urgency === "high" ? "high" : "normal";
}

function isElevatedPriority(priority: MockTicketQueueItem["priority"]): boolean {
  return priority === "high" || priority === "urgent" || priority === "critical";
}

function encodeRequestDescription(type: RequestType, urgency: RequestUrgency, description: string): string {
  const flag = urgency === "urgent" ? "\nagent_flag: urgent request - review first" : "";
  const body = description.trim() || "No extra description provided.";
  return `request_type: ${type}\nurgency: ${urgency}${flag}\n\n${body}`;
}

function getFallbackSites(queue: MockTicketQueueItem[]): SiteOption[] {
  const seen = new Set<string>();
  return queue.reduce<SiteOption[]>((sites, ticket) => {
    if (!ticket.siteId || seen.has(ticket.siteId)) {
      return sites;
    }
    seen.add(ticket.siteId);
    sites.push({ id: ticket.siteId, name: ticket.siteName });
    return sites;
  }, []);
}

function mergeOptimisticRequests(queue: MockTicketQueueItem[], optimistic: MockTicketQueueItem[]): MockTicketQueueItem[] {
  if (optimistic.length === 0) {
    return queue;
  }
  const liveIds = new Set(queue.map((ticket) => ticket.id));
  return [...optimistic.filter((ticket) => !liveIds.has(ticket.id)), ...queue];
}

function boardLaneForTicket(ticket: MockTicketQueueItem): "new" | "triage" | "waiting_on_us" | "waiting_on_customer" | "review" | "complete" {
  switch (ticket.status) {
    case "received":
      return "new";
    case "triaged":
      return "triage";
    case "blocked":
      return ticket.blockedReason?.toLowerCase().includes("customer") ? "waiting_on_customer" : "waiting_on_us";
    case "reply_drafted":
    case "awaiting_gary_approval":
    case "approved_to_send":
      return "review";
    case "sent_to_customer":
    case "closed":
      return "complete";
    default:
      return "new";
  }
}

function getTicketDetail(ticketId: string): MockTicketDetail {
  return ticketDetails.find((ticket) => ticket.id === ticketId) ?? ticketDetails[0];
}

function OverviewCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="wss-stat-card">
      <p className="wss-card-kicker">
        <MonoLabel text={title} />
      </p>
      <strong className="wss-stat-value">{value}</strong>
      <p className="wss-card-note">{note}</p>
    </article>
  );
}

function SectionHeading({
  title,
  eyebrow,
  description,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
}) {
  return (
    <div className="wss-section-heading">
      {eyebrow ? (
        <p className="wss-card-kicker">
          <MonoLabel text={eyebrow} />
        </p>
      ) : null}
      <h2>
        <MonoLabel text={title} />
      </h2>
      {description ? <p className="wss-section-description">{description}</p> : null}
    </div>
  );
}

function NavLabel({ text }: { text: string }) {
  const parts = text.split("_");
  return (
    <span className="wss-nav-label">
      <span className="wss-nav-underscore" aria-hidden="true">
        _
      </span>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {index > 0 ? (
            <span className="wss-nav-underscore" aria-hidden="true">
              _
            </span>
          ) : null}
          {part}
        </span>
      ))}
    </span>
  );
}

function FeedbackModal({
  open,
  onClose,
  defaultSiteId,
}: {
  open: boolean;
  onClose: () => void;
  defaultSiteId: string;
}) {
  const [tab, setTab] = useState<FeedbackTab>("general_feedback");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ ticketNumber: string; ticketId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setTab("general_feedback");
      setBody("");
      setSubmitting(false);
      setSubmitted(null);
      setError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      setError("please add a short note before sending.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const selected = FEEDBACK_TABS.find((item) => item.key === tab) ?? FEEDBACK_TABS[2];
      const result = await submitCustomerFeedback({
        siteId: defaultSiteId,
        category: selected.category,
        subject: selected.label,
        details: body.trim(),
      });
      setSubmitted({
        ticketId: result.ticket_id,
        ticketNumber: result.ticket_number,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "feedback_submit_failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wss-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="wss-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wss-modal-header">
          <div>
            <p className="wss-card-kicker">
              <MonoLabel text="feedback" />
            </p>
            <h2 id="feedback-modal-title">
              <MonoLabel text="send feedback" />
            </h2>
          </div>
          <button type="button" className="wss-icon-button" onClick={onClose} aria-label="close feedback modal">
            ×
          </button>
        </div>

        {submitted ? (
          <div className="wss-modal-success">
            <p className="wss-section-description">
              feedback is in the queue for website_support_studio review.
            </p>
            <p className="wss-copy">
              <strong>request id:</strong> {submitted.ticketNumber} ({submitted.ticketId})
            </p>
            <div className="wss-modal-actions">
              <button
                type="button"
                className="wss-primary-button"
                onClick={() => {
                  setSubmitted(null);
                  setBody("");
                }}
              >
                send another
              </button>
              <button type="button" className="wss-secondary-button" onClick={onClose}>
                close
              </button>
            </div>
          </div>
        ) : (
          <form className="wss-feedback-form" onSubmit={handleSubmit}>
            <div className="wss-tab-row" role="tablist" aria-label="feedback categories">
              {FEEDBACK_TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  className={tab === item.key ? "wss-tab is-active" : "wss-tab"}
                  onClick={() => setTab(item.key)}
                >
                  <MonoLabel text={item.label} />
                </button>
              ))}
            </div>

            <p className="wss-section-description">
              {FEEDBACK_TABS.find((item) => item.key === tab)?.hint}
            </p>

            <label className="wss-field">
              <span className="wss-field-label">
                <MonoLabel text="message" />
              </span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                placeholder="share the issue, idea, or note"
              />
            </label>

            {error ? (
              <p className="wss-inline-error" role="status">
                {error}
              </p>
            ) : null}

            <button type="submit" className="wss-primary-button" disabled={submitting}>
              {submitting ? "sending…" : "submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const section = getSectionFromPath(location.pathname);
  const feedbackParam = new URLSearchParams(location.search).get("feedback");
  const [queue, setQueue] = useState<MockTicketQueueItem[]>(ticketQueue);
  const [requestDetails, setRequestDetails] = useState<Record<string, MockTicketDetail>>(() =>
    Object.fromEntries(ticketDetails.map((ticket) => [ticket.id, ticket])),
  );
  const [selectedRequestId, setSelectedRequestId] = useState(ticketQueue[0]?.id ?? "");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pilotStatus, setPilotStatus] = useState<OperatorPilotStatus>(createEmptyOperatorPilotStatus());
  const [selectedPlatformKey, setSelectedPlatformKey] = useState<WebsitePlatformKey>("wordpress");
  const [topupStatus, setTopupStatus] = useState<string | null>(null);
  const [topupLoading, setTopupLoading] = useState<CreditTopupKey | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>("website_update");
  const [requestUrgency, setRequestUrgency] = useState<RequestUrgency>("normal");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestSites, setRequestSites] = useState<SiteOption[]>([]);
  const [requestSiteId, setRequestSiteId] = useState("");
  const [requestAttachments, setRequestAttachments] = useState<AttachmentState[]>([]);
  const [requestDraftId, setRequestDraftId] = useState(() => getRandomId("draft"));
  const [requestDragActive, setRequestDragActive] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<MockTicketDetail | null>(null);
  const optimisticRequestsRef = useRef<MockTicketQueueItem[]>([]);

  useEffect(() => {
    if (!isSectionPath(location.pathname)) {
      navigate("/overview", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    let active = true;
    const currentClientId = queue[0]?.clientId ?? ticketQueue[0]?.clientId ?? "";
    loadOperatorPilotStatus(currentClientId)
      .then((result) => {
        if (active) {
          setPilotStatus(result);
        }
      })
      .catch(() => {
        if (active) {
          setPilotStatus(createEmptyOperatorPilotStatus());
        }
      });

    return () => {
      active = false;
    };
  }, [queue]);

  useEffect(() => {
    let active = true;

    async function loadQueue() {
      try {
        const liveQueue = await getReadOnlyTicketQueue();
        if (active && liveQueue.length > 0) {
          setQueue(mergeOptimisticRequests(liveQueue, optimisticRequestsRef.current));
        }
      } catch {
        if (active) {
          setQueue(mergeOptimisticRequests(ticketQueue, optimisticRequestsRef.current));
        }
      }
    }

    void loadQueue();
    const interval = window.setInterval(() => {
      void loadQueue();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (queue.length === 0) {
      return;
    }
    if (!queue.some((ticket) => ticket.id === selectedRequestId)) {
      setSelectedRequestId(queue[0].id);
    }
  }, [queue, selectedRequestId]);

  useEffect(() => {
    if (!selectedRequestId) {
      return;
    }

    let active = true;

    async function loadDetail() {
      try {
        const detail = await getReadOnlyTicketDetail(selectedRequestId);
        if (active) {
          setRequestDetails((current) => ({
            ...current,
            [detail.id]: detail,
          }));
        }
      } catch {
        if (active) {
          const fallback = getTicketDetail(selectedRequestId);
          setRequestDetails((current) => ({
            ...current,
            [selectedRequestId]: current[selectedRequestId] ?? fallback,
          }));
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [selectedRequestId]);

  useEffect(() => {
    if (feedbackParam === "open" || feedbackParam === "1") {
      setFeedbackOpen(true);
    }
  }, [feedbackParam]);

  useEffect(() => {
    if (!requestModalOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !requestSubmitting) {
        closeRequestModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestModalOpen, requestSubmitting]);

  useEffect(() => {
    if (!requestModalOpen) {
      return;
    }

    let active = true;
    async function loadSites() {
      const liveSites = await listMySites().catch(() => []);
      const nextSites = liveSites.length > 0 ? liveSites : getFallbackSites(queue);
      if (!active) {
        return;
      }
      setRequestSites(nextSites);
      setRequestSiteId((current) => current || nextSites[0]?.id || "");
    }

    void loadSites();

    return () => {
      active = false;
    };
  }, [requestModalOpen, queue]);

  useEffect(() => {
    if (requestType === "urgent_issue") {
      setRequestUrgency("urgent");
    }
  }, [requestType]);

  const activeRequests = useMemo(
    () => queue.filter((ticket) => ACTIVE_REQUEST_STATUSES.has(ticket.status)),
    [queue],
  );

  const boardGroups = useMemo(() => {
    const lanes: Record<ReturnType<typeof boardLaneForTicket>, MockTicketQueueItem[]> = {
      new: [],
      triage: [],
      waiting_on_us: [],
      waiting_on_customer: [],
      review: [],
      complete: [],
    };

    for (const ticket of queue) {
      lanes[boardLaneForTicket(ticket)].push(ticket);
    }

    return lanes;
  }, [queue]);

  const selectedRequest = useMemo(
    () => requestDetails[selectedRequestId] ?? getTicketDetail(selectedRequestId) ?? ticketDetails[0],
    [requestDetails, selectedRequestId],
  );

  const recentEvents = useMemo(() => [...selectedRequest.auditTimeline].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)), [selectedRequest]);

  const overviewAtRisk = useMemo(
    () =>
      queue.find(
        (ticket) => ticket.status === "blocked" || ticket.priority === "urgent" || ticket.priority === "critical",
      ) ?? queue[0],
    [queue],
  );

  const siteIdForFeedback = selectedRequest?.tenantContext.siteId ?? queue[0]?.siteId ?? "SITE-01";
  const selectedPlatform =
    WEBSITE_ACCESS_PLATFORMS.find((platform) => platform.key === selectedPlatformKey) ?? WEBSITE_ACCESS_PLATFORMS[0];

  function openRequestSurface() {
    setRequestModalOpen(true);
  }

  function closeRequestModal() {
    if (requestSubmitting) {
      return;
    }
    if (!requestSuccess) {
      for (const attachment of requestAttachments) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
        if (attachment.status === "ready" && attachment.storagePath.startsWith("drafts/")) {
          void removeRequestAttachment(attachment.storagePath);
        }
      }
    }
    setRequestModalOpen(false);
    setRequestType("website_update");
    setRequestUrgency("normal");
    setRequestTitle("");
    setRequestDescription("");
    setRequestSiteId("");
    setRequestAttachments([]);
    setRequestDraftId(getRandomId("draft"));
    setRequestDragActive(false);
    setRequestSubmitting(false);
    setRequestError(null);
    setRequestSuccess(null);
  }

  async function addRequestFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    setRequestError(null);
    for (const file of files) {
      const attachmentId = getRandomId("attachment");
      const previewUrl = URL.createObjectURL(file);
      const mimeType = inferMimeType(file);
      const local: AttachmentState = {
        id: attachmentId,
        storagePath: "",
        fileName: file.name,
        mimeType,
        fileSizeBytes: file.size,
        publicUrl: "",
        status: "uploading",
        previewUrl,
        error: null,
      };

      setRequestAttachments((current) => [...current, local]);

      if (!isAcceptedAttachment(file)) {
        setRequestAttachments((current) =>
          current.map((item) =>
            item.id === attachmentId ? { ...item, status: "error", error: "unsupported file type" } : item,
          ),
        );
        continue;
      }

      const canUploadNow = Boolean(user) && isUuid(requestSiteId);
      if (!canUploadNow) {
        setRequestAttachments((current) =>
          current.map((item) =>
            item.id === attachmentId
              ? {
                  ...item,
                  storagePath: `local/${requestDraftId}/${attachmentId}/${file.name}`,
                  publicUrl: previewUrl,
                  status: "ready",
                }
              : item,
          ),
        );
        continue;
      }

      try {
        const uploaded = await uploadRequestAttachment(file, requestDraftId);
        setRequestAttachments((current) =>
          current.map((item) =>
            item.id === attachmentId
              ? {
                  ...item,
                  ...uploaded,
                  status: "ready",
                  error: null,
                }
              : item,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "attachment_upload_failed";
        setRequestAttachments((current) =>
          current.map((item) =>
            item.id === attachmentId
              ? {
                  ...item,
                  status: "error",
                  error: message === "unsupported_attachment_type" ? "unsupported file type" : message,
                }
              : item,
          ),
        );
      }
    }
  }

  function removeModalAttachment(attachmentId: string) {
    setRequestAttachments((current) => {
      const attachment = current.find((item) => item.id === attachmentId);
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      if (attachment?.status === "ready" && attachment.storagePath.startsWith("drafts/")) {
        void removeRequestAttachment(attachment.storagePath);
      }
      return current.filter((item) => item.id !== attachmentId);
    });
  }

  async function submitNewRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requestSiteId) {
      setRequestError("choose a website before submitting.");
      return;
    }
    if (!requestTitle.trim()) {
      setRequestError("add a short title.");
      return;
    }
    if (requestAttachments.some((item) => item.status === "uploading")) {
      setRequestError("wait for files to finish uploading.");
      return;
    }
    if (requestAttachments.some((item) => item.status === "error")) {
      setRequestError("remove or replace files with upload errors.");
      return;
    }

    const selectedSite = requestSites.find((site) => site.id === requestSiteId) ?? requestSites[0];
    const readyAttachments = requestAttachments.filter((item) => item.status === "ready" && item.storagePath.length > 0);
    const priority = urgencyToPriority(requestUrgency);
    const now = new Date().toISOString();
    const displayTitle = `${requestType}: ${requestTitle.trim()}`;
    const encodedDescription = encodeRequestDescription(requestType, requestUrgency, requestDescription);
    const liveSubmission = Boolean(user) && isUuid(requestSiteId);

    setRequestSubmitting(true);
    setRequestError(null);

    try {
      const result = liveSubmission
        ? await submitCustomerRequestWithAttachments({
            siteId: requestSiteId,
            title: displayTitle,
            description: encodedDescription,
            priority,
            attachments: readyAttachments.map((item) => ({
              storagePath: item.storagePath,
              fileName: item.fileName,
              mimeType: item.mimeType,
              fileSizeBytes: item.fileSizeBytes,
            })),
          })
        : {
            ticket_id: getRandomId("local-ticket"),
            ticket_number: `REQ-${Date.now().toString(36).toUpperCase()}`,
            status: "received",
          };

      const queueItem: MockTicketQueueItem = {
        id: result.ticket_number,
        workflowId: result.ticket_id,
        title: displayTitle,
        status: "received",
        priority,
        submittedBy: user?.email ?? "customer",
        updatedAt: now,
        siteId: selectedSite?.id ?? requestSiteId,
        siteName: selectedSite?.name ?? "selected_site",
        clientId: queue[0]?.clientId ?? "CLI-REQUEST",
        clientName: queue[0]?.clientName ?? ACCOUNT_SUMMARY.company,
        identityConfidence: liveSubmission ? "claimed" : "unknown",
      };

      const detail: MockTicketDetail = {
        id: result.ticket_number,
        workflowId: result.ticket_id,
        summary: displayTitle,
        customerRequest: encodedDescription,
        status: "received",
        priority,
        identityConfidence: queueItem.identityConfidence,
        tenantContext: {
          agencyId: queue[0]?.workflowId ?? "AG-REQUEST",
          agencyName: "website_support_studio",
          clientId: queueItem.clientId,
          clientName: queueItem.clientName,
          siteId: queueItem.siteId,
          siteName: queueItem.siteName,
        },
        submittedBy: queueItem.submittedBy,
        submittedAt: now,
        approvalStatus: "not_required",
        auditTimeline: [
          {
            id: getRandomId("audit"),
            ticketId: result.ticket_number,
            eventType: "request_received",
            summary: `${requestType} submitted with ${requestUrgency} urgency.`,
            actor: queueItem.submittedBy,
            occurredAt: now,
          },
        ],
        attachments: readyAttachments.map((item) => ({
          id: item.id,
          fileName: item.fileName,
          mimeType: item.mimeType,
          fileSizeBytes: item.fileSizeBytes,
          publicUrl: item.publicUrl || item.previewUrl || "",
          createdAt: now,
        })),
      };

      optimisticRequestsRef.current = mergeOptimisticRequests([queueItem], optimisticRequestsRef.current);
      setQueue((current) => [queueItem, ...current.filter((ticket) => ticket.id !== queueItem.id)]);
      setRequestDetails((current) => ({ ...current, [queueItem.id]: detail }));
      setSelectedRequestId(queueItem.id);
      setRequestSuccess(detail);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "submit_failed");
    } finally {
      setRequestSubmitting(false);
    }
  }

  async function startTopupCheckout(addon: CreditTopupKey) {
    setTopupStatus(null);
    setTopupLoading(addon);

    try {
      const response = await fetch(CHECKOUT_FUNCTION_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ addon }),
      });
      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      setTopupStatus(payload.error ?? "checkout_unavailable");
    } catch {
      setTopupStatus("checkout_unavailable");
    } finally {
      setTopupLoading(null);
    }
  }

  if (location.pathname === "/" || !isSectionPath(location.pathname)) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <div className="wss-shell">
      <header className="wss-header">
        <div className="wss-brand">
          <LogoLockup size={34} text="website support studio" />
          <div className="wss-brand-copy">
            <p className="wss-card-kicker">
              <MonoLabel text="operations console" />
            </p>
            <p className="wss-brand-subtitle">
              website operations, access, requests, activity, and health
            </p>
          </div>
        </div>

        <div className="wss-header-actions">
          <span className="wss-status-chip">
            <MonoLabel text="website_support_studio" />
          </span>
          <button
            type="button"
            className="wss-secondary-button"
            onClick={() => {
              void signOut();
              navigate("/login", { replace: true });
            }}
          >
            logout
          </button>
        </div>
      </header>

      <div className="wss-layout">
        <aside className="wss-sidebar">
          <nav className="wss-nav" aria-label="console sections">
            {SECTION_ORDER.map((item) => (
              <NavLink
                key={item}
                to={`/${item}`}
                className={({ isActive }) => (isActive ? "wss-nav-link is-active" : "wss-nav-link")}
              >
                <NavLabel text={item} />
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="wss-sidebar-cta"
            onClick={openRequestSurface}
            aria-label="new request"
          >
            <MonoLabel text="_new_request" />
          </button>

          <div className="wss-sidebar-note">
            <p className="wss-card-kicker">
              <MonoLabel text="quick_state" />
            </p>
            <p className="wss-sidebar-text">
              <strong>{activeRequests.length}</strong> active requests are moving through the console right now.
            </p>
          </div>
        </aside>

        <main className="wss-main">
          {section === "overview" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="overview"
                title="profile summary"
                description="A compact view of the profile, activity, and what needs attention."
              />

              <div className="wss-grid four-up">
                <OverviewCard
                  title="profile_summary"
                  value={ACCOUNT_SUMMARY.profile}
                  note={`${ACCOUNT_SUMMARY.company} · ${ACCOUNT_SUMMARY.website}`}
                />
                <OverviewCard
                  title="business_status"
                  value={ACCOUNT_SUMMARY.billingStatus}
                  note={`current plan: ${ACCOUNT_SUMMARY.currentPlan}`}
                />
                <OverviewCard
                  title="active_requests"
                  value={String(activeRequests.length)}
                  note="requests that still need attention from the team."
                />
                <OverviewCard
                  title="credits_summary"
                  value={`${ACCOUNT_SUMMARY.creditsRemaining} left`}
                  note={`${ACCOUNT_SUMMARY.creditsIncluded} included · ${ACCOUNT_SUMMARY.creditsUsed} used`}
                />
              </div>

              <div className="wss-grid two-up">
                <article className="wss-card">
                  <SectionHeading
                    title="whats_new"
                    description="Recent updates from the console and workflow trail."
                  />
                  <ul className="wss-list">
                    {recentEvents.slice(0, 3).map((event) => (
                      <li key={event.id}>
                        <strong>{event.eventType}</strong> on {event.ticketId}
                        <span>{event.summary}</span>
                        <small>{formatDateTime(event.occurredAt)}</small>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="wss-card">
                  <SectionHeading
                    title="whats_at_risk"
                    description="The main item that could slow delivery if it is not cleared."
                  />
                  {overviewAtRisk ? (
                    <div className="wss-risk-card">
                      <strong>{overviewAtRisk.title}</strong>
                      <p>
                        {overviewAtRisk.clientName} / {overviewAtRisk.siteName}
                      </p>
                      <p>
                        priority: {overviewAtRisk.priority} · status: {overviewAtRisk.status}
                      </p>
                      <p>{overviewAtRisk.blockedReason ?? "This request is active and needs attention."}</p>
                    </div>
                  ) : null}
                </article>
              </div>
            </section>
          ) : null}

          {section === "board" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="board"
                title="kanban board"
                description="Read-only status lanes for the current request flow."
              />

              <div className="wss-board-shell">
                {[
                  { key: "new", label: "new" },
                  { key: "triage", label: "triage" },
                  { key: "waiting_on_us", label: "waiting_on_us" },
                  { key: "waiting_on_customer", label: "waiting_on_customer" },
                  { key: "review", label: "review" },
                  { key: "complete", label: "complete" },
                ].map((lane) => (
                  <article key={lane.key} className="wss-board-column">
                    <div className="wss-board-column-head">
                      <h3>
                        <MonoLabel text={lane.label} />
                      </h3>
                      <span>{boardGroups[lane.key as keyof typeof boardGroups].length}</span>
                    </div>

                    <div className="wss-board-column-body">
                      {boardGroups[lane.key as keyof typeof boardGroups].length === 0 ? (
                        <p className="wss-empty-state">nothing here yet</p>
                      ) : (
                        boardGroups[lane.key as keyof typeof boardGroups].map((ticket) => (
                          <button
                            key={ticket.id}
                            type="button"
                            className={isElevatedPriority(ticket.priority) ? "wss-board-card is-urgent" : "wss-board-card"}
                            onClick={() => {
                              setSelectedRequestId(ticket.id);
                              navigate("/requests");
                            }}
                          >
                            <strong>{ticket.title}</strong>
                            <span>
                              {ticket.clientName} / {ticket.siteName}
                            </span>
                            <span>
                              priority: {formatPriority(ticket.priority)} · status: <MonoLabel text={ticket.status} />
                            </span>
                            {isElevatedPriority(ticket.priority) ? (
                              <span className="wss-priority-flag">
                                <MonoLabel text={ticket.priority === "urgent" || ticket.priority === "critical" ? "urgent_flag" : "high_priority"} />
                              </span>
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {section === "requests" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="requests"
                title="request list and detail"
                description="Pick a request on the left and read the operational detail on the right."
              />

              <div className="wss-split">
                <div className="wss-card">
                  <div className="wss-list-picker">
                    {queue.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        className={[
                          "wss-request-item",
                          selectedRequestId === ticket.id ? "is-active" : "",
                          isElevatedPriority(ticket.priority) ? "is-urgent" : "",
                        ].filter(Boolean).join(" ")}
                        onClick={() => setSelectedRequestId(ticket.id)}
                      >
                        <strong>{ticket.title}</strong>
                        <span>
                          {ticket.clientName} / {ticket.siteName}
                        </span>
                        <span>
                          <MonoLabel text={ticket.status} /> · {ticket.priority}
                        </span>
                        {isElevatedPriority(ticket.priority) ? (
                          <span className="wss-priority-flag">
                            <MonoLabel text={ticket.priority === "urgent" || ticket.priority === "critical" ? "urgent_flag" : "high_priority"} />
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                <article className="wss-card">
                  <SectionHeading
                    title={selectedRequest.summary}
                    description={`${selectedRequest.tenantContext.clientName} / ${selectedRequest.tenantContext.siteName}`}
                  />

                  {isElevatedPriority(selectedRequest.priority) ? (
                    <div className="wss-urgent-callout">
                      <MonoLabel text={selectedRequest.priority === "urgent" || selectedRequest.priority === "critical" ? "urgent_flag" : "high_priority"} />
                      <span>customer service should review this request first.</span>
                    </div>
                  ) : null}

                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="status" />
                      </dt>
                      <dd>
                        <MonoLabel text={selectedRequest.status} />
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="priority" />
                      </dt>
                      <dd>{selectedRequest.priority}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="updated_at" />
                      </dt>
                      <dd>{formatDateTime(selectedRequest.submittedAt)}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="submitted_by" />
                      </dt>
                      <dd>{selectedRequest.submittedBy}</dd>
                    </div>
                  </dl>

                  <p className="wss-copy">{selectedRequest.customerRequest}</p>

                  <div className="wss-request-attachments">
                    <div className="wss-section-heading">
                      <h3>
                        <MonoLabel text="attachments" />
                      </h3>
                      <p className="wss-section-description">
                        Evidence should be visible with the request instead of buried elsewhere.
                      </p>
                    </div>

                    {(selectedRequest.attachments ?? []).length === 0 ? (
                      <p className="wss-empty-state">no attachments on this request</p>
                    ) : (
                      <div className="wss-request-attachment-grid">
                        {(selectedRequest.attachments ?? []).map((attachment) => (
                          <article key={attachment.id} className="wss-request-attachment-card">
                            {isImageMimeType(attachment.mimeType) ? (
                              <img
                                src={attachment.publicUrl}
                                alt={attachment.fileName}
                                className="wss-request-attachment-thumb"
                              />
                            ) : (
                              <div className="wss-request-attachment-mark">
                                <MonoLabel text={attachment.mimeType.split("/").at(-1) ?? "file"} />
                              </div>
                            )}
                            <div className="wss-request-attachment-meta">
                              <strong>{attachment.fileName}</strong>
                              <span>{formatBytes(attachment.fileSizeBytes)}</span>
                              <span>{formatDateTime(attachment.createdAt)}</span>
                              <div className="wss-request-attachment-actions">
                                <a href={attachment.publicUrl} target="_blank" rel="noreferrer">
                                  open
                                </a>
                                <a href={attachment.publicUrl} download={attachment.fileName}>
                                  download
                                </a>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </div>
            </section>
          ) : null}

          {section === "profile" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="profile"
                title="profile details"
                description="The customer profile surface lives here, including credits and billing status."
              />

              <div className="wss-grid two-up">
                <article className="wss-card">
                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="profile" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.profile}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="company" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.company}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="website" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.website}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="current_plan" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.currentPlan}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="billing_status" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.billingStatus}</dd>
                    </div>
                    <div className="wss-founder-status-row">
                      <dt>
                        <MonoLabel text="founder_status" />
                      </dt>
                      <dd>
                        <strong>
                          <MonoLabel text={ACCOUNT_SUMMARY.founderPricingStatus} />
                        </strong>
                        <span>{ACCOUNT_SUMMARY.founderPricingMessage}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="logout" />
                      </dt>
                      <dd>
                        <button
                          type="button"
                          className="wss-secondary-button"
                          onClick={() => {
                            void signOut();
                            navigate("/login", { replace: true });
                          }}
                        >
                          logout
                        </button>
                      </dd>
                    </div>
                  </dl>
                </article>

                <article className="wss-card">
                  <SectionHeading title="credits_summary" description="How credits are used, refreshed, and topped up." />
                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="credits_included" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.creditsIncluded}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="credits_used" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.creditsUsed}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="credits_remaining" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.creditsRemaining}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="replenishment" />
                      </dt>
                      <dd>{ACCOUNT_SUMMARY.replenishmentMessaging}</dd>
                    </div>
                  </dl>

                  <div className="wss-credit-model" aria-label="credit effort costs">
                    {CREDIT_EFFORTS.map((effort) => (
                      <article key={effort.key} className="wss-credit-row">
                        <div>
                          <p className="wss-card-kicker">
                            <MonoLabel text={effort.label} />
                          </p>
                          <strong>
                            {effort.credits} {effort.credits === 1 ? "credit" : "credits"}
                          </strong>
                        </div>
                        <p>{effort.examples}</p>
                      </article>
                    ))}
                  </div>

                  <div className="wss-topup-area">
                    <SectionHeading
                      title="buy_more_credits"
                      description="Discounted top-ups are available for active customers when a month gets busy."
                    />
                    <ul className="wss-list">
                      {CREDIT_POLICY.map((item) => (
                        <li key={item}>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="wss-topup-grid">
                      {CREDIT_TOPUPS.map((topup) => (
                        <article key={topup.key} className="wss-topup-card">
                          <p className="wss-card-kicker">
                            <MonoLabel text={topup.label} />
                          </p>
                          <strong>{topup.price}</strong>
                          <p>{topup.note}</p>
                          <button
                            type="button"
                            className="wss-soft-cta"
                            onClick={() => void startTopupCheckout(topup.key)}
                            disabled={topupLoading !== null}
                          >
                            {topupLoading === topup.key ? "opening_checkout" : "buy_top_up"}
                          </button>
                        </article>
                      ))}
                    </div>
                    {topupStatus ? (
                      <p className="wss-inline-error" role="status">
                        {topupStatus === "price_not_configured" || topupStatus === "unknown_plan_or_addon"
                          ? "top-up checkout is waiting on live Stripe price configuration."
                          : "top-up checkout is temporarily unavailable."}
                      </p>
                    ) : null}
                  </div>
                </article>
              </div>
            </section>
          ) : null}

          {section === "website_access" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="website_access"
                title="connect_website"
                description="Choose the platform and follow the access checklist for the safest way to let WSS work on the site."
              />

              <div className="wss-platform-grid" role="list" aria-label="supported website platforms">
                {WEBSITE_ACCESS_PLATFORMS.map((platform) => (
                  <button
                    key={platform.key}
                    type="button"
                    className={
                      selectedPlatformKey === platform.key ? "wss-platform-card is-active" : "wss-platform-card"
                    }
                    onClick={() => setSelectedPlatformKey(platform.key)}
                  >
                    <span className="wss-platform-icon" aria-hidden="true">
                      {platform.icon}
                    </span>
                    <span>
                      <NavLabel text={platform.label.replaceAll(" / ", "_").replaceAll(" ", "_")} />
                    </span>
                  </button>
                ))}
              </div>

              <article className="wss-card wss-platform-detail">
                <SectionHeading
                  title={`${selectedPlatform.label.replaceAll(" / ", "_").replaceAll(" ", "_")}_checklist`}
                  description="Required access is the minimum. Optional access is only requested when the work needs it."
                />
                <div className="wss-checklist-grid">
                  <div>
                    <p className="wss-badge tone-blue">
                      <MonoLabel text="required" />
                    </p>
                    <ul className="wss-list">
                      {selectedPlatform.required.map((item) => (
                        <li key={item}>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="wss-badge tone-amber">
                      <MonoLabel text="optional" />
                    </p>
                    <ul className="wss-list">
                      {selectedPlatform.optional.map((item) => (
                        <li key={item}>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="wss-badge tone-blue">
                      <MonoLabel text="wss_can_change" />
                    </p>
                    <ul className="wss-list">
                      {selectedPlatform.canChange.map((item) => (
                        <li key={item}>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="wss-badge tone-mulberry">
                      <MonoLabel text="customer_next_step" />
                    </p>
                    <ul className="wss-list">
                      {selectedPlatform.customerNeeds.map((item) => (
                        <li key={item}>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="wss-next-step">
                  <p className="wss-card-kicker">
                    <MonoLabel text="next_step" />
                  </p>
                  <p>{selectedPlatform.nextStep}</p>
                </div>
              </article>
            </section>
          ) : null}

          {section === "activity" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="activity"
                title="recent activity"
                description="A concise trail of what happened most recently."
              />

              <article className="wss-card">
                <ul className="wss-list">
                  {recentEvents.slice(0, 8).map((event) => (
                    <li key={event.id}>
                      <strong>
                        <MonoLabel text={event.eventType} />
                      </strong>
                      <span>
                        {event.ticketId} · {event.summary}
                      </span>
                      <small>{formatDateTime(event.occurredAt)}</small>
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          ) : null}

          {section === "health" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="health"
                title="diagnostics"
                description="Pilot status and light operational diagnostics live here without taking over the rest of the console."
              />

              <div className="wss-grid two-up">
                <article className="wss-card">
                  <SectionHeading title="pilot_status" />
                  <dl className="wss-detail-grid">
                    <div>
                      <dt>
                        <MonoLabel text="buyer_email" />
                      </dt>
                      <dd>{pilotStatus.buyerEmail ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="stripe_status" />
                      </dt>
                      <dd>{pilotStatus.stripeStatus ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="wss_status" />
                      </dt>
                      <dd>{pilotStatus.wssStatus ?? "not available"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="owner_claimed" />
                      </dt>
                      <dd>{pilotStatus.ownerClaimed === null ? "not available" : pilotStatus.ownerClaimed ? "true" : "false"}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="site_count" />
                      </dt>
                      <dd>{formatCount(pilotStatus.siteCount)}</dd>
                    </div>
                    <div>
                      <dt>
                        <MonoLabel text="org_member_count" />
                      </dt>
                      <dd>{formatCount(pilotStatus.orgMemberCount)}</dd>
                    </div>
                  </dl>
                </article>

                <article className="wss-card">
                  <SectionHeading title="diagnostic_timeline" />
                  <ul className="wss-list">
                    {(pilotStatus.timeline.length > 0 ? pilotStatus.timeline : []).slice(0, 4).map((item) => (
                      <li key={item.key}>
                        <strong>{item.label}</strong>
                        <span>
                          {item.source} · {item.field} · {item.reliability}
                        </span>
                        <small>{formatDateTime(item.timestamp)}</small>
                        {item.note ? <span>{item.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {requestModalOpen ? (
        <div className="wss-modal-backdrop" onClick={closeRequestModal} role="presentation">
          <div
            className="wss-modal wss-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wss-request-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="wss-modal-header">
              <div>
                <p className="wss-card-kicker">
                  <MonoLabel text="website_support_studio" />
                </p>
                <h2 id="wss-request-modal-title">
                  <MonoLabel text="new_request" />
                </h2>
                <p className="wss-section-description">
                  choose the work type, urgency, website, and attach screenshots or files.
                </p>
              </div>
              <button type="button" className="wss-icon-button" onClick={closeRequestModal} aria-label="close new request">
                x
              </button>
            </div>

            {requestSuccess ? (
              <div className="wss-modal-success">
                <p className="wss-section-description">
                  <MonoLabel text="request_submitted" />
                </p>
                <p className="wss-copy">
                  {requestSuccess.id} is now in the <MonoLabel text="new" /> board column.
                </p>
                <div className="wss-modal-actions">
                  <button
                    type="button"
                    className="wss-soft-cta"
                    onClick={() => {
                      closeRequestModal();
                      navigate("/requests");
                    }}
                  >
                    view_request
                  </button>
                  <button type="button" className="wss-secondary-button" onClick={closeRequestModal}>
                    close
                  </button>
                </div>
              </div>
            ) : (
              <form className="wss-request-form" onSubmit={(event) => void submitNewRequest(event)}>
                <div className="wss-form-grid">
                  <label className="wss-field">
                    <span className="wss-field-label">
                      <MonoLabel text="request_type" />
                    </span>
                    <select
                      className="wss-input"
                      value={requestType}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => setRequestType(event.target.value as RequestType)}
                    >
                      {REQUEST_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="wss-field">
                    <span className="wss-field-label">
                      <MonoLabel text="urgency" />
                    </span>
                    <select
                      className="wss-input"
                      value={requestUrgency}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => setRequestUrgency(event.target.value as RequestUrgency)}
                    >
                      {REQUEST_URGENCIES.map((urgency) => (
                        <option key={urgency} value={urgency}>
                          {urgency}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {requestUrgency === "urgent" ? (
                  <div className="wss-urgent-callout">
                    <MonoLabel text="urgent_flag" />
                    <span>this request will be flagged for the customer service agent.</span>
                  </div>
                ) : null}

                <label className="wss-field">
                  <span className="wss-field-label">
                    <MonoLabel text="title" />
                  </span>
                  <input
                    className="wss-input"
                    value={requestTitle}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setRequestTitle(event.target.value)}
                    placeholder="short summary"
                    required
                  />
                </label>

                <label className="wss-field">
                  <span className="wss-field-label">
                    <MonoLabel text="description" />
                  </span>
                  <textarea
                    value={requestDescription}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setRequestDescription(event.target.value)}
                    placeholder="what changed, what broke, or what should WSS look at?"
                  />
                </label>

                <label className="wss-field">
                  <span className="wss-field-label">
                    <MonoLabel text="website_site" />
                  </span>
                  <select
                    className="wss-input"
                    value={requestSiteId}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) => setRequestSiteId(event.target.value)}
                    disabled={requestSites.length === 0}
                  >
                    {requestSites.length === 0 ? (
                      <option value="">no websites available</option>
                    ) : (
                      requestSites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <div
                  className={requestDragActive ? "wss-dropzone is-active" : "wss-dropzone"}
                  onDragOver={(event: DragEvent<HTMLDivElement>) => {
                    event.preventDefault();
                    setRequestDragActive(true);
                  }}
                  onDragLeave={() => setRequestDragActive(false)}
                  onDrop={(event: DragEvent<HTMLDivElement>) => {
                    event.preventDefault();
                    setRequestDragActive(false);
                    void addRequestFiles(event.dataTransfer.files);
                  }}
                >
                  <div>
                    <strong>
                      <MonoLabel text="attachments" />
                    </strong>
                    <p>images, pdf, doc, docx, csv, txt, zip</p>
                  </div>
                  <label className="wss-upload-button">
                    <input
                      type="file"
                      multiple
                      accept={ACCEPT_ATTR}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        if (event.target.files) {
                          void addRequestFiles(event.target.files);
                        }
                        event.target.value = "";
                      }}
                    />
                    attach_files
                  </label>
                </div>

                {requestAttachments.length > 0 ? (
                  <div className="wss-request-attachment-grid">
                    {requestAttachments.map((attachment) => (
                      <article key={attachment.id} className="wss-request-attachment-card">
                        {isImageMimeType(attachment.mimeType) && (attachment.publicUrl || attachment.previewUrl) ? (
                          <img
                            src={attachment.publicUrl || attachment.previewUrl || ""}
                            alt={attachment.fileName}
                            className="wss-request-attachment-thumb"
                          />
                        ) : (
                          <div className="wss-request-attachment-mark">
                            <MonoLabel text={getAttachmentLabel(attachment.mimeType)} />
                          </div>
                        )}
                        <div className="wss-request-attachment-meta">
                          <strong>{attachment.fileName}</strong>
                          <span>{formatBytes(attachment.fileSizeBytes)}</span>
                          <span>{attachment.status === "error" ? attachment.error : attachment.status}</span>
                          <div className="wss-request-attachment-actions">
                            <button type="button" onClick={() => removeModalAttachment(attachment.id)}>
                              remove
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                {requestError ? (
                  <p className="wss-inline-error" role="alert">
                    {requestError}
                  </p>
                ) : null}

                <div className="wss-modal-actions">
                  <button type="button" className="wss-secondary-button" onClick={closeRequestModal}>
                    cancel
                  </button>
                  <button type="submit" className="wss-soft-cta" disabled={requestSubmitting || requestSites.length === 0}>
                    {requestSubmitting ? "submitting" : "submit_request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <button type="button" className="wss-feedback-launcher" onClick={() => setFeedbackOpen(true)}>
        feedback
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} defaultSiteId={siteIdForFeedback} />
    </div>
  );
}
