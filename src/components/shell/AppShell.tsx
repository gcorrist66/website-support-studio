import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { LogoLockup } from "../brand/LogoLockup";
import { MonoLabel } from "../brand/MonoLabel";
import { ProjectAccessPage, type ProjectAccessState } from "../operator/ProjectAccessPage";
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
  getReadOnlySendContext,
} from "../../data/readOnlyTicketData";
import { operatorWorkflow } from "../../data/operatorWorkflow";

type ConsoleSection =
  | "admin"
  | "overview"
  | "board"
  | "requests"
  | "project_intake"
  | "project_access"
  | "profile"
  | "website_access"
  | "activity"
  | "health";

type AccessTrackState = "not_applicable" | "requested" | "received" | "verified" | "blocked";
type NeedAttentionLane =
  | "new_requests"
  | "waiting_on_customer"
  | "waiting_on_access"
  | "waiting_on_gary"
  | "ready_to_close";
type FeedbackTab = "bug_report" | "feature_request" | "general_feedback";
type CreditTopupKey = "topup_50" | "topup_100" | "topup_250";
type WebsitePlatformKey = "wordpress" | "shopify" | "webflow" | "squarespace" | "wix" | "custom_other" | "hosting_dns";
type RequestType = "website_update" | "bug_report" | "urgent_issue" | "question" | "other";
type RequestUrgency = "normal" | "high" | "urgent";
type ProjectIntakeStep =
  | "business_information"
  | "branding"
  | "services"
  | "products"
  | "pages"
  | "navigation"
  | "images"
  | "content"
  | "pricing"
  | "inspiration"
  | "social_links"
  | "comments"
  | "package";
type AttachmentState = CustomerRequestAttachmentDraft & {
  id: string;
  status: "uploading" | "ready" | "error";
  previewUrl: string | null;
  error: string | null;
};
type IntakeUpload = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  publicUrl: string;
  status: "local" | "uploading" | "ready" | "error";
  error: string | null;
  associateWithPage?: string;
};
type IntakeServiceItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: IntakeUpload | null;
};
type IntakeProductItem = IntakeServiceItem;
type IntakeInspirationItem = {
  id: string;
  url: string;
  likes: string;
};
type WebsiteProjectIntake = {
  businessInformation: {
    businessName: string;
    tagline: string;
    phone: string;
    email: string;
    address: string;
    serviceArea: string;
    yearsInBusiness: string;
    businessDescription: string;
    comments: string;
  };
  branding: {
    logoUploads: IntakeUpload[];
    logoNotes: string;
    noLogo: boolean;
  };
  services: IntakeServiceItem[];
  products: IntakeProductItem[];
  pages: {
    selected: string[];
    custom: string[];
  };
  navigation: string[];
  images: IntakeUpload[];
  content: {
    uploads: IntakeUpload[];
    pastedText: string;
  };
  pricing: {
    showPricing: "not_sure" | "yes" | "no";
    notes: string;
  };
  inspiration: IntakeInspirationItem[];
  socialLinks: {
    facebook: string;
    instagram: string;
    linkedIn: string;
    youtube: string;
    tiktok: string;
    googleBusinessProfile: string;
  };
  comments: string;
  meta: {
    logoCreationNeeded: boolean;
    updatedAt: string | null;
  };
};

const SECTION_ORDER: ConsoleSection[] = [
  "admin",
  "overview",
  "board",
  "requests",
  "project_intake",
  "project_access",
  "website_access",
  "activity",
  "health",
  "profile",
];

const NEED_ATTENTION_LANES: Array<{ id: NeedAttentionLane; label: string; hint: string }> = [
  { id: "new_requests", label: "new_requests", hint: "requests newly arrived or triaged." },
  { id: "waiting_on_customer", label: "waiting_on_customer", hint: "missing customer input or approval." },
  { id: "waiting_on_access", label: "waiting_on_access", hint: "platform or hosting access still required." },
  { id: "waiting_on_gary", label: "waiting_on_gary", hint: "reply is ready and waiting for Gary review." },
  { id: "ready_to_close", label: "ready_to_close", hint: "reply done; final wrap is ready." },
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
const PROJECT_INTAKE_STORAGE_KEY = "wss_project_intake_v1";
const PROJECT_INTAKE_STEPS: Array<{ key: ProjectIntakeStep; label: string; hint: string }> = [
  { key: "business_information", label: "business_information", hint: "Name, contact details, service area, and what the business does." },
  { key: "branding", label: "branding", hint: "Logo files, notes, or a flag that logo creation is needed." },
  { key: "services", label: "services", hint: "Services WSS should include, even if details are rough." },
  { key: "products", label: "products", hint: "Products, descriptions, prices, and optional images." },
  { key: "pages", label: "pages", hint: "Suggested and custom pages for the site map." },
  { key: "navigation", label: "navigation", hint: "Menu links the customer wants visitors to see." },
  { key: "images", label: "images", hint: "Photos or image bundles and where they might belong." },
  { key: "content", label: "content", hint: "Current website copy, documents, brochures, or pasted notes." },
  { key: "pricing", label: "pricing", hint: "Whether pricing should appear publicly." },
  { key: "inspiration", label: "inspiration", hint: "Websites the customer likes and why." },
  { key: "social_links", label: "social_links", hint: "Social and business profile URLs." },
  { key: "comments", label: "comments", hint: "Anything else WSS should know." },
  { key: "package", label: "package", hint: "Review and create the structured website project package." },
] as const;
const PROJECT_PAGE_SUGGESTIONS = ["home", "about", "services", "pricing", "gallery", "faq", "contact"] as const;
const PROJECT_PAGE_ASSOCIATIONS = [...PROJECT_PAGE_SUGGESTIONS, "all pages", "not sure"] as const;
const LOGO_ACCEPT_ATTR = ".svg,.png,.ai,.eps,.pdf,image/svg+xml,image/png,application/pdf,application/postscript";
const PROJECT_IMAGE_ACCEPT_ATTR = ".jpg,.jpeg,.png,.webp,.pdf,.zip,image/jpeg,image/png,image/webp,application/pdf,application/zip,application/x-zip-compressed";
const PROJECT_CONTENT_ACCEPT_ATTR = ".pdf,.doc,.docx,.txt,.csv,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/zip,application/x-zip-compressed";
const SOCIAL_LINK_FIELDS: Array<{ key: keyof WebsiteProjectIntake["socialLinks"]; label: string }> = [
  { key: "facebook", label: "facebook" },
  { key: "instagram", label: "instagram" },
  { key: "linkedIn", label: "linkedin" },
  { key: "youtube", label: "youtube" },
  { key: "tiktok", label: "tiktok" },
  { key: "googleBusinessProfile", label: "google_business_profile" },
];

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
const APP_LEGAL_LINKS = [
  { href: "https://websitesupportstudio.com/privacy", label: "privacy_policy" },
  { href: "https://websitesupportstudio.com/terms", label: "terms_of_service" },
  { href: "https://websitesupportstudio.com/terms#acceptable-use", label: "acceptable_use" },
  { href: "https://websitesupportstudio.com/cookies", label: "cookie_policy" },
] as const;

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

function createIntakeUpload(file: File, associateWithPage?: string): IntakeUpload {
  return {
    id: getRandomId("intake-file"),
    fileName: file.name,
    mimeType: inferMimeType(file),
    fileSizeBytes: file.size,
    storagePath: "",
    publicUrl: "",
    status: "local",
    error: null,
    associateWithPage,
  };
}

function createEmptyIntakeService(): IntakeServiceItem {
  return {
    id: getRandomId("service"),
    name: "",
    description: "",
    price: "",
    image: null,
  };
}

function createEmptyIntakeProduct(): IntakeProductItem {
  return {
    id: getRandomId("product"),
    name: "",
    description: "",
    price: "",
    image: null,
  };
}

function createEmptyInspiration(): IntakeInspirationItem {
  return {
    id: getRandomId("inspiration"),
    url: "",
    likes: "",
  };
}

function createEmptyProjectIntake(): WebsiteProjectIntake {
  return {
    businessInformation: {
      businessName: "",
      tagline: "",
      phone: "",
      email: "",
      address: "",
      serviceArea: "",
      yearsInBusiness: "",
      businessDescription: "",
      comments: "",
    },
    branding: {
      logoUploads: [],
      logoNotes: "",
      noLogo: false,
    },
    services: [createEmptyIntakeService()],
    products: [createEmptyIntakeProduct()],
    pages: {
      selected: [...PROJECT_PAGE_SUGGESTIONS],
      custom: [],
    },
    navigation: ["home", "about", "services", "contact"],
    images: [],
    content: {
      uploads: [],
      pastedText: "",
    },
    pricing: {
      showPricing: "not_sure",
      notes: "",
    },
    inspiration: [createEmptyInspiration()],
    socialLinks: {
      facebook: "",
      instagram: "",
      linkedIn: "",
      youtube: "",
      tiktok: "",
      googleBusinessProfile: "",
    },
    comments: "",
    meta: {
      logoCreationNeeded: false,
      updatedAt: null,
    },
  };
}

function mergeProjectIntake(value: unknown): WebsiteProjectIntake {
  const empty = createEmptyProjectIntake();
  if (!value || typeof value !== "object") {
    return empty;
  }
  const saved = value as Partial<WebsiteProjectIntake>;
  return {
    ...empty,
    ...saved,
    businessInformation: { ...empty.businessInformation, ...saved.businessInformation },
    branding: { ...empty.branding, ...saved.branding },
    services: Array.isArray(saved.services) && saved.services.length > 0 ? saved.services : empty.services,
    products: Array.isArray(saved.products) && saved.products.length > 0 ? saved.products : empty.products,
    pages: { ...empty.pages, ...saved.pages },
    navigation: Array.isArray(saved.navigation) && saved.navigation.length > 0 ? saved.navigation : empty.navigation,
    images: Array.isArray(saved.images) ? saved.images : empty.images,
    content: { ...empty.content, ...saved.content },
    pricing: { ...empty.pricing, ...saved.pricing },
    inspiration: Array.isArray(saved.inspiration) && saved.inspiration.length > 0 ? saved.inspiration : empty.inspiration,
    socialLinks: { ...empty.socialLinks, ...saved.socialLinks },
    meta: { ...empty.meta, ...saved.meta },
  };
}

function loadProjectIntakeDraft(): WebsiteProjectIntake {
  if (typeof window === "undefined") {
    return createEmptyProjectIntake();
  }
  try {
    const raw = window.localStorage.getItem(PROJECT_INTAKE_STORAGE_KEY);
    return raw ? mergeProjectIntake(JSON.parse(raw)) : createEmptyProjectIntake();
  } catch {
    return createEmptyProjectIntake();
  }
}

function getProjectPages(intake: WebsiteProjectIntake): string[] {
  return Array.from(new Set([...intake.pages.selected, ...intake.pages.custom.map((page) => page.trim()).filter(Boolean)]));
}

function buildWebsiteProjectPackage(intake: WebsiteProjectIntake) {
  return {
    package_type: "website_project_intake",
    philosophy: "nothing is required; WSS can draft with AI, placeholders, and operator review when details are missing.",
    business_information: intake.businessInformation,
    branding: {
      ...intake.branding,
      logo_creation_needed: intake.branding.noLogo,
    },
    services: intake.services,
    products: intake.products,
    pages: getProjectPages(intake),
    navigation: intake.navigation.filter((item) => item.trim()),
    images: intake.images,
    content: intake.content,
    pricing: intake.pricing,
    inspiration: intake.inspiration.filter((item) => item.url.trim() || item.likes.trim()),
    social_links: intake.socialLinks,
    comments: intake.comments,
    flags: {
      logo_creation_needed: intake.branding.noLogo,
      sparse_intake_ok: true,
      operator_review_required: true,
    },
    generated_at: new Date().toISOString(),
  };
}

function collectReadyIntakeAttachments(intake: WebsiteProjectIntake) {
  return collectIntakeUploads(intake).filter((upload) => upload.status === "ready" && upload.storagePath);
}

function collectIntakeUploads(intake: WebsiteProjectIntake) {
  return [
    ...intake.branding.logoUploads,
    ...intake.images,
    ...intake.content.uploads,
  ];
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

function includesReasonFragment(value: string | null | undefined, fragments: string[]): boolean {
  const normalized = (value ?? "").toLowerCase();
  return fragments.some((fragment) => normalized.includes(fragment));
}

function isAccessRequested(ticket: MockTicketQueueItem | MockTicketDetail): boolean {
  return (
    ticket.status === "blocked" &&
    includesReasonFragment(ticket.blockedReason, ["access", "credential", "admin", "wss", "invite"])
  );
}

function isNeedAttentionLane(ticket: MockTicketQueueItem): NeedAttentionLane {
  if (ticket.status === "received" || ticket.status === "triaged") {
    return "new_requests";
  }
  if (ticket.status === "blocked") {
    if (includesReasonFragment(ticket.blockedReason, ["access", "credential", "platform", "invite"])) {
      return "waiting_on_access";
    }
    if (includesReasonFragment(ticket.blockedReason, ["customer", "data", "approval", "information"])) {
      return "waiting_on_customer";
    }
    return "waiting_on_customer";
  }
  if (ticket.status === "awaiting_gary_approval" || ticket.status === "reply_drafted") {
    return "waiting_on_gary";
  }
  if (ticket.status === "approved_to_send" || ticket.status === "sent_to_customer") {
    return "ready_to_close";
  }
  return "new_requests";
}

function inferAccessState(
  ticket: MockTicketQueueItem | MockTicketDetail,
  override?: AccessTrackState,
): AccessTrackState {
  if (override && override !== "not_applicable") {
    return override;
  }
  if (isAccessRequested(ticket)) {
    return "requested";
  }
  if (ticket.status === "blocked") {
    return "blocked";
  }
  return "not_applicable";
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
  const [projectIntake, setProjectIntake] = useState<WebsiteProjectIntake>(() => loadProjectIntakeDraft());
  const [projectIntakeStep, setProjectIntakeStep] = useState<ProjectIntakeStep>("business_information");
  const [projectIntakeSavedAt, setProjectIntakeSavedAt] = useState<string | null>(null);
  const [projectIntakeSubmittedId, setProjectIntakeSubmittedId] = useState<string | null>(null);
  const [projectIntakeSubmitting, setProjectIntakeSubmitting] = useState(false);
  const [projectIntakeError, setProjectIntakeError] = useState<string | null>(null);
  const [requestDraftBodies, setRequestDraftBodies] = useState<Record<string, string>>({});
  const [requestCloseNotes, setRequestCloseNotes] = useState<Record<string, string>>({});
  const [requestInternalNotes, setRequestInternalNotes] = useState<Record<string, string>>({});
  const [requestAssignees, setRequestAssignees] = useState<Record<string, string>>({});
  const [requestClaims, setRequestClaims] = useState<Record<string, string>>({});
  const [requestAssignedOwners, setRequestAssignedOwners] = useState<Record<string, string>>({});
  const [requestAccessStates, setRequestAccessStates] = useState<Record<string, AccessTrackState>>({});
  const [requestActionBusy, setRequestActionBusy] = useState<string | null>(null);
  const [requestActionMessage, setRequestActionMessage] = useState<string | null>(null);
  const [requestActionError, setRequestActionError] = useState<string | null>(null);
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

  useEffect(() => {
    const nextIntake = {
      ...projectIntake,
      branding: {
        ...projectIntake.branding,
        logoUploads: projectIntake.branding.noLogo ? [] : projectIntake.branding.logoUploads,
      },
      meta: {
        ...projectIntake.meta,
        logoCreationNeeded: projectIntake.branding.noLogo,
        updatedAt: new Date().toISOString(),
      },
    };
    window.localStorage.setItem(PROJECT_INTAKE_STORAGE_KEY, JSON.stringify(nextIntake));
    setProjectIntakeSavedAt(nextIntake.meta.updatedAt);
  }, [projectIntake]);

  const activeRequests = useMemo(
    () => queue.filter((ticket) => ACTIVE_REQUEST_STATUSES.has(ticket.status)),
    [queue],
  );

  const needAttentionGroups = useMemo(() => {
    const groups: Record<NeedAttentionLane, MockTicketQueueItem[]> = {
      new_requests: [],
      waiting_on_customer: [],
      waiting_on_access: [],
      waiting_on_gary: [],
      ready_to_close: [],
    };
    for (const ticket of queue) {
      groups[isNeedAttentionLane(ticket)].push(ticket);
    }
    return groups;
  }, [queue]);

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
  const selectedRequestIdSafe = selectedRequest.id;
  const selectedRequestClaimedBy = requestClaims[selectedRequestIdSafe] ?? "";
  const selectedRequestAssignedTo = requestAssignedOwners[selectedRequestIdSafe] ?? requestClaims[selectedRequestIdSafe] ?? "";
  const selectedRequestDraftBody = requestDraftBodies[selectedRequestIdSafe] ?? "";
  const selectedRequestInternalNote = requestInternalNotes[selectedRequestIdSafe] ?? "";
  const selectedRequestCloseNote = requestCloseNotes[selectedRequestIdSafe] ?? "";
  const selectedRequestAccessState = inferAccessState(selectedRequest, requestAccessStates[selectedRequestIdSafe]);
  const selectedRequestAssigneeInput = requestAssignees[selectedRequestIdSafe] ?? user?.email ?? "";
  const operatorActor =
    ((user?.user_metadata as { full_name?: string } | undefined)?.full_name?.trim()) ||
    user?.email?.trim() ||
    "gary";

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
  const projectPages = getProjectPages(projectIntake);
  const projectPackagePreview = buildWebsiteProjectPackage(projectIntake);

  function clearRequestActionMessages() {
    setRequestActionMessage(null);
    setRequestActionError(null);
  }

  function updateSelectedRequestLocalDetail(mutator: (current: MockTicketDetail) => MockTicketDetail) {
    if (!selectedRequestIdSafe) {
      return;
    }
    setRequestDetails((current) => {
      const currentRequest = current[selectedRequestIdSafe];
      if (!currentRequest) {
        return current;
      }
      return {
        ...current,
        [selectedRequestIdSafe]: mutator(currentRequest),
      };
    });
  }

  function appendRequestAuditEvent(ticketId: string, summary: string, eventType = "operator_action") {
    setRequestDetails((current) => {
      const currentRequest = current[ticketId];
      if (!currentRequest) {
        return current;
      }
      return {
        ...current,
        [ticketId]: {
          ...currentRequest,
          auditTimeline: [
            ...currentRequest.auditTimeline,
            {
              id: getRandomId("operator"),
              ticketId,
              eventType,
              summary,
              actor: operatorActor,
              occurredAt: new Date().toISOString(),
            },
          ],
        },
      };
    });
  }

  function applyTicketStatus(ticketId: string, status: MockTicketQueueItem["status"], blockedReason?: string | null) {
    setQueue((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
              blockedReason: blockedReason === null ? undefined : blockedReason ?? ticket.blockedReason,
              updatedAt: new Date().toISOString(),
            }
          : ticket,
      ),
    );
    updateSelectedRequestLocalDetail((current) => ({
      ...current,
      status,
      blockedReason: blockedReason ?? current.blockedReason,
    }));
    appendRequestAuditEvent(ticketId, `status updated to ${status}`, "operator_status_update");
  }

  function setRequestAccess(ticketId: string, state: ProjectAccessState) {
    setRequestAccessStates((current) => ({ ...current, [ticketId]: state }));
    const details =
      state === "requested"
        ? "access requested"
        : state === "received"
          ? "access received from customer or shared channel"
          : state === "verified"
            ? "access verified and ready to proceed"
            : "access blocked; operator review required";
    appendRequestAuditEvent(ticketId, details, "operator_access_update");
  }

  async function runRequestAction(
    actionId: string,
    execute: () => Promise<void> | void,
    pendingMessage: string,
  ) {
    if (!selectedRequestIdSafe) {
      return;
    }
    clearRequestActionMessages();
    setRequestActionBusy(actionId);
    try {
      await execute();
      setRequestActionMessage(pendingMessage);
    } catch {
      setRequestActionError("request_action_failed");
    } finally {
      setRequestActionBusy(null);
    }
  }

  function handleClaimRequest() {
    if (!selectedRequestIdSafe) {
      return;
    }
    void runRequestAction(
      "claim",
      () => {
        setRequestClaims((current) => ({ ...current, [selectedRequestIdSafe]: operatorActor }));
        appendRequestAuditEvent(selectedRequestIdSafe, `claimed by ${operatorActor}`, "request_claim");
      },
      "request claimed",
    );
  }

  function handleAssignRequest() {
    if (!selectedRequestIdSafe) {
      return;
    }
    const assignee = requestAssignees[selectedRequestIdSafe]?.trim() || operatorActor;
    if (!assignee) {
      return;
    }
    void runRequestAction(
      "assign",
      () => {
        setRequestAssignedOwners((current) => ({ ...current, [selectedRequestIdSafe]: assignee }));
        appendRequestAuditEvent(selectedRequestIdSafe, `assigned to ${assignee}`, "request_assign");
      },
      `assigned to ${assignee}`,
    );
  }

  function handleAddInternalNote() {
    if (!selectedRequestIdSafe || !requestInternalNotes[selectedRequestIdSafe]?.trim()) {
      return;
    }
    const note = requestInternalNotes[selectedRequestIdSafe].trim();
    void runRequestAction(
      "internal-note",
      () => {
        const noteEvent = `${operatorActor}: ${note}`;
        appendRequestAuditEvent(selectedRequestIdSafe, noteEvent, "operator_internal_note");
        setRequestInternalNotes((current) => ({ ...current, [selectedRequestIdSafe]: "" }));
        setRequestActionMessage("internal note added");
      },
      "internal note added",
    );
  }

  function handleDraftReply() {
    if (!selectedRequestIdSafe || !selectedRequestDraftBody.trim()) {
      return;
    }
    const body = selectedRequestDraftBody.trim();
    const workflowId = selectedRequest.workflowId || selectedRequest.id;
    const summary = `draft created (${selectedRequest.workflowId ? "live" : "local"}): ${body.slice(0, 48)}`;
    void runRequestAction(
      "draft-reply",
      async () => {
        if (operatorWorkflow.isLive() && workflowId) {
          await operatorWorkflow.draftReply(workflowId, body);
        }
        appendRequestAuditEvent(selectedRequestIdSafe, summary, "operator_draft_reply");
        applyTicketStatus(selectedRequestIdSafe, "reply_drafted");
      },
      "draft saved",
    );
  }

  function handleSendReply() {
    if (!selectedRequestIdSafe) {
      return;
    }
    const workflowId = selectedRequest.workflowId || selectedRequest.id;
    void runRequestAction(
      "send-reply",
      async () => {
        if (!operatorWorkflow.isLive()) {
          applyTicketStatus(selectedRequestIdSafe, "sent_to_customer");
          return;
        }
        const context = await getReadOnlySendContext(workflowId);
        await operatorWorkflow.send(workflowId, context?.recipientEmail);
        applyTicketStatus(selectedRequestIdSafe, "sent_to_customer");
      },
      "reply sent",
    );
  }

  function handleSetWaitingOnCustomer() {
    if (!selectedRequestIdSafe) {
      return;
    }
    void runRequestAction(
      "waiting-on-customer",
      () => {
        applyTicketStatus(selectedRequestIdSafe, "blocked", "awaiting_customer_information");
      },
      "request marked waiting on customer",
    );
  }

  function handleSetWaitingOnAccess() {
    if (!selectedRequestIdSafe) {
      return;
    }
    void runRequestAction(
      "waiting-on-access",
      () => {
        applyTicketStatus(selectedRequestIdSafe, "blocked", "awaiting_access_grant");
        setRequestAccess(selectedRequestIdSafe, "requested");
      },
      "request marked waiting on access",
    );
  }

  function handleSetReadyToClose() {
    if (!selectedRequestIdSafe) {
      return;
    }
    void runRequestAction(
      "ready-to-close",
      () => {
        applyTicketStatus(selectedRequestIdSafe, "approved_to_send");
        setRequestAccess(selectedRequestIdSafe, "verified");
      },
      "request marked ready to close",
    );
  }

  function handleCloseRequest() {
    if (!selectedRequestIdSafe || !selectedRequestCloseNote.trim()) {
      return;
    }
    const workflowId = selectedRequest.workflowId || selectedRequest.id;
    const note = selectedRequestCloseNote.trim();
    void runRequestAction(
      "close-request",
      async () => {
        if (operatorWorkflow.isLive() && workflowId) {
          await operatorWorkflow.close(workflowId, note);
        }
        applyTicketStatus(selectedRequestIdSafe, "closed");
      },
      "request closed",
    );
  }

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

  function updateProjectBusinessField(field: keyof WebsiteProjectIntake["businessInformation"], value: string) {
    setProjectIntake((current) => ({
      ...current,
      businessInformation: {
        ...current.businessInformation,
        [field]: value,
      },
    }));
  }

  function updateProjectBranding(updates: Partial<WebsiteProjectIntake["branding"]>) {
    setProjectIntake((current) => ({
      ...current,
      branding: {
        ...current.branding,
        ...updates,
      },
    }));
  }

  function updateProjectSocialField(field: keyof WebsiteProjectIntake["socialLinks"], value: string) {
    setProjectIntake((current) => ({
      ...current,
      socialLinks: {
        ...current.socialLinks,
        [field]: value,
      },
    }));
  }

  function updateProjectUploadState(
    kind: "logo" | "images" | "content",
    uploadId: string,
    updates: Partial<IntakeUpload>,
  ) {
    setProjectIntake((current) => {
      if (kind === "logo") {
        return {
          ...current,
          branding: {
            ...current.branding,
            logoUploads: current.branding.logoUploads.map((upload) =>
              upload.id === uploadId ? { ...upload, ...updates } : upload,
            ),
          },
        };
      }
      if (kind === "content") {
        return {
          ...current,
          content: {
            ...current.content,
            uploads: current.content.uploads.map((upload) =>
              upload.id === uploadId ? { ...upload, ...updates } : upload,
            ),
          },
        };
      }
      return {
        ...current,
        images: current.images.map((upload) => (upload.id === uploadId ? { ...upload, ...updates } : upload)),
      };
    });
  }

  function addProjectUploads(kind: "logo" | "images" | "content", fileList: FileList | File[], associateWithPage?: string) {
    const files = Array.from(fileList);
    const uploads = files.map((file) => ({
      file,
      upload: {
        ...createIntakeUpload(file, associateWithPage),
        status: user ? "uploading" as const : "local" as const,
      },
    }));
    if (uploads.length === 0) {
      return;
    }
    setProjectIntake((current) => {
      const uploadDrafts = uploads.map((item) => item.upload);
      if (kind === "logo") {
        return {
          ...current,
          branding: {
            ...current.branding,
            logoUploads: [...current.branding.logoUploads, ...uploadDrafts],
          },
        };
      }
      if (kind === "content") {
        return {
          ...current,
          content: {
            ...current.content,
            uploads: [...current.content.uploads, ...uploadDrafts],
          },
        };
      }
      return {
        ...current,
        images: [...current.images, ...uploadDrafts],
      };
    });

    if (!user) {
      return;
    }

    uploads.forEach(({ file, upload }) => {
      void uploadRequestAttachment(file, `website-project-${upload.id}`)
        .then((uploaded) => updateProjectUploadState(kind, upload.id, { ...uploaded, status: "ready", error: null }))
        .catch((error) =>
          updateProjectUploadState(kind, upload.id, {
            status: "error",
            error: error instanceof Error ? error.message : "upload_failed",
          }),
        );
    });
  }

  function removeProjectUpload(kind: "logo" | "images" | "content", uploadId: string) {
    setProjectIntake((current) => {
      if (kind === "logo") {
        return {
          ...current,
          branding: {
            ...current.branding,
            logoUploads: current.branding.logoUploads.filter((upload) => upload.id !== uploadId),
          },
        };
      }
      if (kind === "content") {
        return {
          ...current,
          content: {
            ...current.content,
            uploads: current.content.uploads.filter((upload) => upload.id !== uploadId),
          },
        };
      }
      return {
        ...current,
        images: current.images.filter((upload) => upload.id !== uploadId),
      };
    });
  }

  function updateImagePageAssociation(uploadId: string, page: string) {
    setProjectIntake((current) => ({
      ...current,
      images: current.images.map((upload) => (upload.id === uploadId ? { ...upload, associateWithPage: page } : upload)),
    }));
  }

  function updateProjectService(index: number, updates: Partial<IntakeServiceItem>) {
    setProjectIntake((current) => ({
      ...current,
      services: current.services.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)),
    }));
  }

  function updateProjectProduct(index: number, updates: Partial<IntakeProductItem>) {
    setProjectIntake((current) => ({
      ...current,
      products: current.products.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)),
    }));
  }

  function addServiceImage(index: number, fileList: FileList | File[]) {
    const file = Array.from(fileList)[0];
    if (!file) {
      return;
    }
    updateProjectService(index, { image: createIntakeUpload(file) });
  }

  function addProductImage(index: number, fileList: FileList | File[]) {
    const file = Array.from(fileList)[0];
    if (!file) {
      return;
    }
    updateProjectProduct(index, { image: createIntakeUpload(file) });
  }

  function updateProjectInspiration(index: number, updates: Partial<IntakeInspirationItem>) {
    setProjectIntake((current) => ({
      ...current,
      inspiration: current.inspiration.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item)),
    }));
  }

  async function submitProjectIntakePackage() {
    if (projectIntakeSubmitting) {
      return;
    }
    if (collectIntakeUploads(projectIntake).some((upload) => upload.status === "uploading")) {
      setProjectIntakeError("wait for uploads to finish before creating the package.");
      return;
    }
    const projectPackage = buildWebsiteProjectPackage(projectIntake);
    const now = new Date().toISOString();
    const selectedSite = requestSites[0];
    const liveSubmission = Boolean(user) && Boolean(selectedSite) && isUuid(selectedSite.id);
    const title = `website_project: ${projectIntake.businessInformation.businessName.trim() || ACCOUNT_SUMMARY.company} intake package`;
    const readyAttachments = collectReadyIntakeAttachments(projectIntake);

    setProjectIntakeSubmitting(true);
    setProjectIntakeError(null);

    try {
      const result = liveSubmission
        ? await submitCustomerRequestWithAttachments({
            siteId: selectedSite.id,
            title,
            description: JSON.stringify(projectPackage, null, 2),
            priority: "normal",
            attachments: readyAttachments.map((upload) => ({
              storagePath: upload.storagePath,
              fileName: upload.fileName,
              mimeType: upload.mimeType,
              fileSizeBytes: upload.fileSizeBytes,
            })),
          })
        : {
            ticket_id: getRandomId("local-website-project"),
            ticket_number: `WEB-${Date.now().toString(36).toUpperCase()}`,
            status: "received",
          };

    const queueItem: MockTicketQueueItem = {
      id: result.ticket_number,
      workflowId: result.ticket_id,
      title,
      status: "received",
      priority: "normal",
      submittedBy: user?.email ?? "customer",
      updatedAt: now,
      siteId: selectedSite?.id ?? ACCOUNT_SUMMARY.website,
      siteName: selectedSite?.name ?? ACCOUNT_SUMMARY.website,
      clientId: queue[0]?.clientId ?? "CLI-WEBSITE-PROJECT",
      clientName: projectIntake.businessInformation.businessName.trim() || ACCOUNT_SUMMARY.company,
      identityConfidence: liveSubmission ? "claimed" : "unknown",
    };
    const detail: MockTicketDetail = {
      id: result.ticket_number,
      workflowId: queueItem.workflowId,
      summary: title,
      customerRequest: JSON.stringify(projectPackage, null, 2),
      status: "received",
      priority: "normal",
      identityConfidence: queueItem.identityConfidence,
      tenantContext: {
        agencyId: "website_support_studio",
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
          eventType: "website_project_intake_submitted",
          summary: "Structured website project package created for operator review.",
          actor: queueItem.submittedBy,
          occurredAt: now,
        },
      ],
      attachments: readyAttachments.map((upload) => ({
        id: upload.id,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        fileSizeBytes: upload.fileSizeBytes,
        publicUrl: upload.publicUrl,
        createdAt: now,
      })),
    };
    optimisticRequestsRef.current = mergeOptimisticRequests([queueItem], optimisticRequestsRef.current);
    setQueue((current) => [queueItem, ...current.filter((ticket) => ticket.id !== queueItem.id)]);
    setRequestDetails((current) => ({ ...current, [queueItem.id]: detail }));
    setSelectedRequestId(queueItem.id);
      setProjectIntakeSubmittedId(result.ticket_number);
    } catch (error) {
      setProjectIntakeError(error instanceof Error ? error.message : "website_project_submit_failed");
    } finally {
      setProjectIntakeSubmitting(false);
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
          {section === "admin" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="operator"
                title="operator dashboard"
                description="Need attention first. Use this queue before metrics."
              />

              <article className="wss-card">
                <SectionHeading
                  title="needs_attention"
                  description="Prioritized request lanes for immediate operator action."
                />
                <div className="wss-need-attention-grid">
                  {NEED_ATTENTION_LANES.map((lane) => (
                    <section key={lane.id} className="wss-attention-lane">
                      <div className="wss-attention-lane-head">
                        <h3>
                          <MonoLabel text={lane.label} />
                        </h3>
                        <span>{needAttentionGroups[lane.id].length}</span>
                      </div>
                      <p className="wss-section-description">{lane.hint}</p>
                      <div className="wss-attention-lane-body">
                        {needAttentionGroups[lane.id].length === 0 ? (
                          <p className="wss-empty-state">none</p>
                        ) : (
                          needAttentionGroups[lane.id].map((ticket) => (
                            <button
                              key={ticket.id}
                              type="button"
                              className="wss-request-item"
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
                                <MonoLabel text={ticket.status} /> · {ticket.priority}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              </article>

              <div className="wss-grid three-up">
                <article className="wss-card">
                  <SectionHeading title="operations" description="Core workload and handoff surfaces." />
                  <ul className="wss-list">
                    <li>
                      <button type="button" className="wss-secondary-button" onClick={() => navigate("/overview")}>
                        overview
                      </button>
                    </li>
                    <li>
                      <button type="button" className="wss-secondary-button" onClick={() => navigate("/board")}>
                        board
                      </button>
                    </li>
                    <li>
                      <button type="button" className="wss-secondary-button" onClick={() => navigate("/requests")}>
                        requests
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="wss-secondary-button"
                        onClick={() => navigate("/project_intake")}
                      >
                        project_intake
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="wss-secondary-button"
                        onClick={() => navigate("/project_access")}
                      >
                        project_access
                      </button>
                    </li>
                  </ul>
                </article>

                <article className="wss-card">
                  <SectionHeading
                    title="account surfaces"
                    description="Profile, website access, and operational health checks."
                  />
                  <ul className="wss-list">
                    <li>
                      <button type="button" className="wss-secondary-button" onClick={() => navigate("/profile")}>
                        profile
                      </button>
                    </li>
                    <li>
                      <button type="button" className="wss-secondary-button" onClick={() => navigate("/website_access")}>
                        website_access
                      </button>
                    </li>
                    <li>
                      <button type="button" className="wss-secondary-button" onClick={() => navigate("/activity")}>
                        activity
                      </button>
                    </li>
                    <li>
                      <button type="button" className="wss-secondary-button" onClick={() => navigate("/health")}>
                        health
                      </button>
                    </li>
                  </ul>
                </article>

                <article className="wss-card">
                  <SectionHeading title="support links" description="Keep customer communication and support quick." />
                  <p className="wss-copy">No new admin stack. Use existing operator surfaces above.</p>
                  <div className="wss-modal-actions">
                    <button type="button" className="wss-soft-cta" onClick={() => navigate("/requests")}>
                      open_requests
                    </button>
                  </div>
                  <p className="wss-copy">
                    Gary / operator users should start here, then move into requests, board, or health.
                  </p>
                </article>
              </div>
            </section>
          ) : null}

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

                  <article className="wss-card">
                    <div className="wss-section-heading">
                      <h3>
                        <MonoLabel text="operator_action_bar" />
                      </h3>
                      <p className="wss-section-description">
                        action list is optimistically tracked in this operator console layer.
                      </p>
                    </div>

                    <div className="wss-copy">
                      <strong>state:</strong>{" "}
                      <MonoLabel text={selectedRequest.status} />
                    </div>
                    {selectedRequestClaimedBy ? (
                      <p className="wss-copy">
                        <strong>claimed_by:</strong> {selectedRequestClaimedBy}
                      </p>
                    ) : null}
                    {selectedRequestAssignedTo ? (
                      <p className="wss-copy">
                        <strong>assigned_to:</strong> {selectedRequestAssignedTo}
                      </p>
                    ) : null}
                    <p className="wss-copy">
                      <strong>access_state:</strong> {selectedRequestAccessState}
                    </p>

                    <div className="wss-modal-actions">
                      <button type="button" className="wss-secondary-button" disabled={Boolean(requestActionBusy)} onClick={handleClaimRequest}>
                        {requestActionBusy === "claim" ? "claiming..." : "claim"}
                      </button>
                      <label className="wss-field">
                        <span className="wss-field-label">
                          <MonoLabel text="assignee" />
                        </span>
                        <input
                          className="wss-input"
                          value={selectedRequestAssigneeInput}
                          onChange={(event) =>
                            setRequestAssignees((current) => ({
                              ...current,
                              [selectedRequestIdSafe]: event.target.value,
                            }))
                          }
                          placeholder="assignee email or name"
                        />
                      </label>
                      <button type="button" className="wss-secondary-button" disabled={Boolean(requestActionBusy)} onClick={handleAssignRequest}>
                        {requestActionBusy === "assign" ? "assigning..." : "assign"}
                      </button>
                    </div>

                    <div className="wss-field">
                      <label htmlFor={`internal-note-${selectedRequestIdSafe}`} className="wss-field-label">
                        <MonoLabel text="internal_note" />
                      </label>
                      <textarea
                        id={`internal-note-${selectedRequestIdSafe}`}
                        className="wss-input"
                        value={selectedRequestInternalNote}
                        onChange={(event) =>
                          setRequestInternalNotes((current) => ({
                            ...current,
                            [selectedRequestIdSafe]: event.target.value,
                          }))
                        }
                        placeholder="operator-only context and next steps"
                      />
                      <button
                        type="button"
                        className="wss-secondary-button"
                        disabled={
                          Boolean(requestActionBusy) ||
                          !selectedRequestInternalNote.trim() ||
                          !selectedRequestIdSafe
                        }
                        onClick={handleAddInternalNote}
                      >
                        {requestActionBusy === "internal-note" ? "saving_note..." : "add_internal_note"}
                      </button>
                    </div>

                    <div className="wss-field">
                      <label htmlFor={`draft-${selectedRequestIdSafe}`} className="wss-field-label">
                        <MonoLabel text="draft_reply_body" />
                      </label>
                      <textarea
                        id={`draft-${selectedRequestIdSafe}`}
                        className="wss-input"
                        value={selectedRequestDraftBody}
                        onChange={(event) =>
                          setRequestDraftBodies((current) => ({
                            ...current,
                            [selectedRequestIdSafe]: event.target.value,
                          }))
                        }
                        placeholder="write a draft response for review, approval, and send."
                      />
                      <div className="wss-modal-actions">
                        <button
                          type="button"
                          className="wss-secondary-button"
                          disabled={Boolean(requestActionBusy) || !selectedRequestDraftBody.trim() || !selectedRequestIdSafe}
                          onClick={handleDraftReply}
                        >
                          {requestActionBusy === "draft-reply" ? "saving_reply..." : "draft_reply"}
                        </button>
                      </div>
                    </div>

                    <div className="wss-modal-actions">
                      <button
                        type="button"
                        className="wss-secondary-button"
                        disabled={Boolean(requestActionBusy) || !selectedRequestIdSafe}
                        onClick={handleSendReply}
                      >
                        {requestActionBusy === "send-reply" ? "sending_reply..." : "send_reply"}
                      </button>
                      <button
                        type="button"
                        className="wss-secondary-button"
                        disabled={Boolean(requestActionBusy) || !selectedRequestIdSafe}
                        onClick={handleSetWaitingOnCustomer}
                      >
                        {requestActionBusy === "waiting-on-customer" ? "updating..." : "waiting_on_customer"}
                      </button>
                      <button
                        type="button"
                        className="wss-secondary-button"
                        disabled={Boolean(requestActionBusy) || !selectedRequestIdSafe}
                        onClick={handleSetWaitingOnAccess}
                      >
                        {requestActionBusy === "waiting-on-access" ? "updating..." : "waiting_on_access"}
                      </button>
                      <button
                        type="button"
                        className="wss-secondary-button"
                        disabled={Boolean(requestActionBusy) || !selectedRequestIdSafe}
                        onClick={handleSetReadyToClose}
                      >
                        {requestActionBusy === "ready-to-close" ? "updating..." : "ready_to_close"}
                      </button>
                    </div>

                    <div className="wss-field">
                      <label htmlFor={`close-${selectedRequestIdSafe}`} className="wss-field-label">
                        <MonoLabel text="close_request_note" />
                      </label>
                      <textarea
                        id={`close-${selectedRequestIdSafe}`}
                        className="wss-input"
                        value={selectedRequestCloseNote}
                        onChange={(event) =>
                          setRequestCloseNotes((current) => ({
                            ...current,
                            [selectedRequestIdSafe]: event.target.value,
                          }))
                        }
                        placeholder="closure reason required"
                      />
                      <button
                        type="button"
                        className="wss-secondary-button"
                        disabled={
                          Boolean(requestActionBusy) || !selectedRequestIdSafe || !selectedRequestCloseNote.trim()
                        }
                        onClick={handleCloseRequest}
                      >
                        {requestActionBusy === "close-request" ? "closing_request..." : "close_request"}
                      </button>
                    </div>

                    {requestActionMessage ? <p className="wss-copy">{requestActionMessage}</p> : null}
                    {requestActionError ? <p className="wss-inline-error">{requestActionError}</p> : null}
                  </article>

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

          {section === "project_intake" ? (
            <section className="wss-panel">
              <SectionHeading
                eyebrow="project_intake"
                title="website_project_intake"
                description="Share whatever you have. Nothing is required; WSS can draft with AI, placeholders, and operator review."
              />

              <div className="wss-intake-shell">
                <aside className="wss-intake-steps" aria-label="website project intake sections">
                  {PROJECT_INTAKE_STEPS.map((step) => (
                    <button
                      key={step.key}
                      type="button"
                      className={projectIntakeStep === step.key ? "is-active" : ""}
                      onClick={() => setProjectIntakeStep(step.key)}
                    >
                      <MonoLabel text={step.label} />
                      <span>{step.hint}</span>
                    </button>
                  ))}
                </aside>

                <article className="wss-card wss-intake-panel">
                  <div className="wss-intake-status">
                    <span>
                      {projectIntakeSavedAt ? `saved locally ${formatDateTime(projectIntakeSavedAt)}` : "draft ready"}
                    </span>
                    {projectIntakeSubmittedId ? (
                      <button
                        type="button"
                        className="wss-secondary-button"
                        onClick={() => {
                          setSelectedRequestId(projectIntakeSubmittedId);
                          navigate("/requests");
                        }}
                      >
                        view_package_request
                      </button>
                    ) : null}
                  </div>

                  {projectIntakeStep === "business_information" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="business_information" description="Basic identity and context for the website project." />
                      <div className="wss-form-grid">
                        {[
                          ["businessName", "business_name"],
                          ["tagline", "tagline"],
                          ["phone", "phone"],
                          ["email", "email"],
                          ["address", "address"],
                          ["serviceArea", "service_area"],
                          ["yearsInBusiness", "years_in_business"],
                        ].map(([field, label]) => (
                          <label key={field} className="wss-field">
                            <span className="wss-field-label">
                              <MonoLabel text={label} />
                            </span>
                            <input
                              className="wss-input"
                              value={projectIntake.businessInformation[field as keyof WebsiteProjectIntake["businessInformation"]]}
                              onChange={(event) =>
                                updateProjectBusinessField(field as keyof WebsiteProjectIntake["businessInformation"], event.target.value)
                              }
                            />
                          </label>
                        ))}
                      </div>
                      <label className="wss-field">
                        <span className="wss-field-label">
                          <MonoLabel text="business_description" />
                        </span>
                        <textarea
                          value={projectIntake.businessInformation.businessDescription}
                          onChange={(event) => updateProjectBusinessField("businessDescription", event.target.value)}
                          placeholder="what does the business do, who does it serve, and what should the website help visitors understand?"
                        />
                      </label>
                      <label className="wss-field">
                        <span className="wss-field-label">
                          <MonoLabel text="comments" />
                        </span>
                        <textarea
                          value={projectIntake.businessInformation.comments}
                          onChange={(event) => updateProjectBusinessField("comments", event.target.value)}
                          placeholder="anything else about the business"
                        />
                      </label>
                    </div>
                  ) : null}

                  {projectIntakeStep === "branding" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="branding" description="Upload a logo if one exists, or flag that WSS should help create one." />
                      <div className="wss-intake-callout">
                        accepted formats: svg, png, ai, eps, pdf
                      </div>
                      <label className="wss-check-row">
                        <input
                          type="checkbox"
                          checked={projectIntake.branding.noLogo}
                          onChange={(event) =>
                            updateProjectBranding({
                              noLogo: event.target.checked,
                              logoUploads: event.target.checked ? [] : projectIntake.branding.logoUploads,
                            })
                          }
                        />
                        <span>I do not have a logo</span>
                      </label>
                      {projectIntake.branding.noLogo ? (
                        <p className="wss-intake-flag">
                          <MonoLabel text="logo_creation_needed" /> · Logo creation is available as an additional service.
                        </p>
                      ) : (
                        <label className="wss-dropzone">
                          <div>
                            <strong>
                              <MonoLabel text="logo_upload" />
                            </strong>
                            <p>svg, png, ai, eps, pdf</p>
                          </div>
                          <span className="wss-upload-button">
                            <input
                              type="file"
                              multiple
                              accept={LOGO_ACCEPT_ATTR}
                              onChange={(event) => {
                                if (event.target.files) {
                                  addProjectUploads("logo", event.target.files);
                                }
                                event.target.value = "";
                              }}
                            />
                            attach_logo
                          </span>
                        </label>
                      )}
                      <div className="wss-intake-upload-list">
                        {projectIntake.branding.logoUploads.map((upload) => (
                          <div key={upload.id}>
                            <span>{upload.fileName} · {formatBytes(upload.fileSizeBytes)} · {upload.status}</span>
                            <button type="button" onClick={() => removeProjectUpload("logo", upload.id)}>remove</button>
                          </div>
                        ))}
                      </div>
                      <label className="wss-field">
                        <span className="wss-field-label">
                          <MonoLabel text="logo_notes" />
                        </span>
                        <textarea
                          value={projectIntake.branding.logoNotes}
                          onChange={(event) => updateProjectBranding({ logoNotes: event.target.value })}
                          placeholder="colors, versions, usage notes, or rough preferences"
                        />
                      </label>
                    </div>
                  ) : null}

                  {projectIntakeStep === "services" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="services" description="Add as many services as are useful. Price and image are optional." />
                      {projectIntake.services.map((service, index) => (
                        <div key={service.id} className="wss-repeat-card">
                          <div className="wss-form-grid">
                            <label className="wss-field">
                              <span className="wss-field-label"><MonoLabel text="service_name" /></span>
                              <input className="wss-input" value={service.name} onChange={(event) => updateProjectService(index, { name: event.target.value })} />
                            </label>
                            <label className="wss-field">
                              <span className="wss-field-label"><MonoLabel text="price_optional" /></span>
                              <input className="wss-input" value={service.price} onChange={(event) => updateProjectService(index, { price: event.target.value })} />
                            </label>
                          </div>
                          <label className="wss-field">
                            <span className="wss-field-label"><MonoLabel text="description" /></span>
                            <textarea value={service.description} onChange={(event) => updateProjectService(index, { description: event.target.value })} />
                          </label>
                          <label className="wss-upload-button">
                            <input
                              type="file"
                              accept={PROJECT_IMAGE_ACCEPT_ATTR}
                              onChange={(event) => {
                                if (event.target.files) {
                                  addServiceImage(index, event.target.files);
                                }
                                event.target.value = "";
                              }}
                            />
                            image_optional
                          </label>
                          {service.image ? <p className="wss-card-note">{service.image.fileName}</p> : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="wss-secondary-button"
                        onClick={() => setProjectIntake((current) => ({ ...current, services: [...current.services, createEmptyIntakeService()] }))}
                      >
                        add_service
                      </button>
                    </div>
                  ) : null}

                  {projectIntakeStep === "products" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="products" description="Add products if the site should feature or sell them." />
                      {projectIntake.products.map((product, index) => (
                        <div key={product.id} className="wss-repeat-card">
                          <div className="wss-form-grid">
                            <label className="wss-field">
                              <span className="wss-field-label"><MonoLabel text="product_name" /></span>
                              <input className="wss-input" value={product.name} onChange={(event) => updateProjectProduct(index, { name: event.target.value })} />
                            </label>
                            <label className="wss-field">
                              <span className="wss-field-label"><MonoLabel text="price_optional" /></span>
                              <input className="wss-input" value={product.price} onChange={(event) => updateProjectProduct(index, { price: event.target.value })} />
                            </label>
                          </div>
                          <label className="wss-field">
                            <span className="wss-field-label"><MonoLabel text="description" /></span>
                            <textarea value={product.description} onChange={(event) => updateProjectProduct(index, { description: event.target.value })} />
                          </label>
                          <label className="wss-upload-button">
                            <input
                              type="file"
                              accept={PROJECT_IMAGE_ACCEPT_ATTR}
                              onChange={(event) => {
                                if (event.target.files) {
                                  addProductImage(index, event.target.files);
                                }
                                event.target.value = "";
                              }}
                            />
                            image_optional
                          </label>
                          {product.image ? <p className="wss-card-note">{product.image.fileName}</p> : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="wss-secondary-button"
                        onClick={() => setProjectIntake((current) => ({ ...current, products: [...current.products, createEmptyIntakeProduct()] }))}
                      >
                        add_product
                      </button>
                    </div>
                  ) : null}

                  {projectIntakeStep === "pages" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="pages" description="Default pages are suggested. Remove or add whatever fits." />
                      <div className="wss-option-grid">
                        {PROJECT_PAGE_SUGGESTIONS.map((page) => (
                          <label key={page} className="wss-check-row">
                            <input
                              type="checkbox"
                              checked={projectIntake.pages.selected.includes(page)}
                              onChange={(event) =>
                                setProjectIntake((current) => ({
                                  ...current,
                                  pages: {
                                    ...current.pages,
                                    selected: event.target.checked
                                      ? [...current.pages.selected, page]
                                      : current.pages.selected.filter((item) => item !== page),
                                  },
                                }))
                              }
                            />
                            <MonoLabel text={page} />
                          </label>
                        ))}
                      </div>
                      <div className="wss-repeat-card">
                        <p className="wss-card-kicker"><MonoLabel text="custom_pages" /></p>
                        {projectIntake.pages.custom.map((page, index) => (
                          <input
                            key={`${index}-${page}`}
                            className="wss-input"
                            value={page}
                            onChange={(event) =>
                              setProjectIntake((current) => ({
                                ...current,
                                pages: {
                                  ...current.pages,
                                  custom: current.pages.custom.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                                },
                              }))
                            }
                          />
                        ))}
                        <button
                          type="button"
                          className="wss-secondary-button"
                          onClick={() => setProjectIntake((current) => ({ ...current, pages: { ...current.pages, custom: [...current.pages.custom, ""] } }))}
                        >
                          add_custom_page
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {projectIntakeStep === "navigation" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="navigation" description="What links should appear in the website menu?" />
                      {projectIntake.navigation.map((item, index) => (
                        <input
                          key={`${index}-${item}`}
                          className="wss-input"
                          value={item}
                          onChange={(event) =>
                            setProjectIntake((current) => ({
                              ...current,
                              navigation: current.navigation.map((navItem, navIndex) => (navIndex === index ? event.target.value : navItem)),
                            }))
                          }
                        />
                      ))}
                      <button
                        type="button"
                        className="wss-secondary-button"
                        onClick={() => setProjectIntake((current) => ({ ...current, navigation: [...current.navigation, ""] }))}
                      >
                        add_menu_link
                      </button>
                    </div>
                  ) : null}

                  {projectIntakeStep === "images" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="images" description="Upload jpg, png, webp, pdf, or zip files and associate them with pages if you know where they belong." />
                      <label className="wss-dropzone">
                        <div>
                          <strong><MonoLabel text="image_uploads" /></strong>
                          <p>jpg, png, webp, pdf, zip</p>
                        </div>
                        <span className="wss-upload-button">
                          <input
                            type="file"
                            multiple
                            accept={PROJECT_IMAGE_ACCEPT_ATTR}
                            onChange={(event) => {
                              if (event.target.files) {
                                addProjectUploads("images", event.target.files, "not sure");
                              }
                              event.target.value = "";
                            }}
                          />
                          attach_images
                        </span>
                      </label>
                      <div className="wss-intake-upload-list">
                        {projectIntake.images.map((upload) => (
                          <div key={upload.id}>
                            <span>{upload.fileName} · {formatBytes(upload.fileSizeBytes)} · {upload.status}</span>
                            <select value={upload.associateWithPage ?? "not sure"} onChange={(event) => updateImagePageAssociation(upload.id, event.target.value)}>
                              {PROJECT_PAGE_ASSOCIATIONS.map((page) => (
                                <option key={page} value={page}>{page}</option>
                              ))}
                              {projectPages.map((page) => (
                                <option key={`custom-${page}`} value={page}>{page}</option>
                              ))}
                            </select>
                            <button type="button" onClick={() => removeProjectUpload("images", upload.id)}>remove</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {projectIntakeStep === "content" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="content" description="Upload current pages, articles, brochures, PDFs, Word docs, or marketing materials. Paste text if easier." />
                      <label className="wss-dropzone">
                        <div>
                          <strong><MonoLabel text="content_uploads" /></strong>
                          <p>pdf, doc, docx, txt, csv, zip</p>
                        </div>
                        <span className="wss-upload-button">
                          <input
                            type="file"
                            multiple
                            accept={PROJECT_CONTENT_ACCEPT_ATTR}
                            onChange={(event) => {
                              if (event.target.files) {
                                addProjectUploads("content", event.target.files);
                              }
                              event.target.value = "";
                            }}
                          />
                          attach_content
                        </span>
                      </label>
                      <div className="wss-intake-upload-list">
                        {projectIntake.content.uploads.map((upload) => (
                          <div key={upload.id}>
                            <span>{upload.fileName} · {formatBytes(upload.fileSizeBytes)} · {upload.status}</span>
                            <button type="button" onClick={() => removeProjectUpload("content", upload.id)}>remove</button>
                          </div>
                        ))}
                      </div>
                      <label className="wss-field">
                        <span className="wss-field-label"><MonoLabel text="paste_text" /></span>
                        <textarea
                          value={projectIntake.content.pastedText}
                          onChange={(event) => setProjectIntake((current) => ({ ...current, content: { ...current.content, pastedText: event.target.value } }))}
                          placeholder="paste copy, notes, page drafts, or rough content here"
                        />
                      </label>
                    </div>
                  ) : null}

                  {projectIntakeStep === "pricing" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="pricing" description="Optional. WSS can draft with placeholders if you are not sure yet." />
                      <label className="wss-field">
                        <span className="wss-field-label"><MonoLabel text="show_pricing_on_website" /></span>
                        <select
                          className="wss-input"
                          value={projectIntake.pricing.showPricing}
                          onChange={(event) =>
                            setProjectIntake((current) => ({
                              ...current,
                              pricing: { ...current.pricing, showPricing: event.target.value as WebsiteProjectIntake["pricing"]["showPricing"] },
                            }))
                          }
                        >
                          <option value="not_sure">not_sure</option>
                          <option value="yes">yes</option>
                          <option value="no">no</option>
                        </select>
                      </label>
                      <label className="wss-field">
                        <span className="wss-field-label"><MonoLabel text="pricing_notes" /></span>
                        <textarea
                          value={projectIntake.pricing.notes}
                          onChange={(event) => setProjectIntake((current) => ({ ...current, pricing: { ...current.pricing, notes: event.target.value } }))}
                          placeholder="pricing packages, ranges, or notes WSS should consider"
                        />
                      </label>
                    </div>
                  ) : null}

                  {projectIntakeStep === "inspiration" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="inspiration" description="Share websites you like and what you like about them." />
                      {projectIntake.inspiration.map((item, index) => (
                        <div key={item.id} className="wss-repeat-card">
                          <label className="wss-field">
                            <span className="wss-field-label"><MonoLabel text="website_url" /></span>
                            <input className="wss-input" value={item.url} onChange={(event) => updateProjectInspiration(index, { url: event.target.value })} />
                          </label>
                          <label className="wss-field">
                            <span className="wss-field-label"><MonoLabel text="what_do_you_like" /></span>
                            <textarea value={item.likes} onChange={(event) => updateProjectInspiration(index, { likes: event.target.value })} />
                          </label>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="wss-secondary-button"
                        onClick={() => setProjectIntake((current) => ({ ...current, inspiration: [...current.inspiration, createEmptyInspiration()] }))}
                      >
                        add_inspiration
                      </button>
                    </div>
                  ) : null}

                  {projectIntakeStep === "social_links" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="social_links" description="Add whatever profiles are relevant." />
                      <div className="wss-form-grid">
                        {SOCIAL_LINK_FIELDS.map((field) => (
                          <label key={field.key} className="wss-field">
                            <span className="wss-field-label"><MonoLabel text={field.label} /></span>
                            <input
                              className="wss-input"
                              value={projectIntake.socialLinks[field.key]}
                              onChange={(event) => updateProjectSocialField(field.key, event.target.value)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {projectIntakeStep === "comments" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="comments" description="Large notes field for everything else." />
                      <label className="wss-field">
                        <span className="wss-field-label"><MonoLabel text="comments" /></span>
                        <textarea
                          value={projectIntake.comments}
                          onChange={(event) => setProjectIntake((current) => ({ ...current, comments: event.target.value }))}
                          placeholder="goals, preferences, competitors, concerns, deadlines, must-haves, nice-to-haves"
                        />
                      </label>
                    </div>
                  ) : null}

                  {projectIntakeStep === "package" ? (
                    <div className="wss-intake-form">
                      <SectionHeading title="structured_package" description="Create the website project package for WSS review. Empty fields are okay." />
                      <div className="wss-grid three-up">
                        <OverviewCard title="pages" value={String(projectPages.length)} note={projectPages.join(", ") || "WSS can suggest pages."} />
                        <OverviewCard title="services" value={String(projectIntake.services.length)} note="repeatable service entries" />
                        <OverviewCard title="uploads" value={String(projectIntake.branding.logoUploads.length + projectIntake.images.length + projectIntake.content.uploads.length)} note="file metadata captured" />
                      </div>
                      <pre className="wss-package-preview">{JSON.stringify(projectPackagePreview, null, 2)}</pre>
                      <div className="wss-modal-actions">
                        <button
                          type="button"
                          className="wss-soft-cta"
                          onClick={() => {
                            void submitProjectIntakePackage();
                          }}
                          disabled={projectIntakeSubmitting}
                        >
                          {projectIntakeSubmitting ? "creating_package" : "create_project_package"}
                        </button>
                        <button type="button" className="wss-secondary-button" onClick={() => setProjectIntake(createEmptyProjectIntake())}>
                          reset_draft
                        </button>
                      </div>
                      {projectIntakeError ? <p className="wss-inline-error">{projectIntakeError}</p> : null}
                    </div>
                  ) : null}
                </article>
              </div>
            </section>
          ) : null}

          {section === "project_access" ? (
            <ProjectAccessPage
              tickets={queue}
              accessStates={requestAccessStates}
              onSetAccessState={setRequestAccess}
            />
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

      <footer className="wss-app-footer">
        <div>
          <p>
            © 2026 <MonoLabel text="website_support_studio" />
          </p>
          <nav aria-label="legal links">
            {APP_LEGAL_LINKS.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                <MonoLabel text={link.label} />
              </a>
            ))}
          </nav>
        </div>
        <p className="wss-app-attribution">
          <MonoLabel text="a corriston consulting service" />
          <a href="https://www.corristonconsulting.com" target="_blank" rel="noreferrer">
            corristonconsulting.com
          </a>
        </p>
      </footer>

      <button type="button" className="wss-feedback-launcher" onClick={() => setFeedbackOpen(true)}>
        feedback
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} defaultSiteId={siteIdForFeedback} />
    </div>
  );
}
