/**
 * Website Project MVP — shared, framework-free labels + guided website-access copy.
 *
 * Pure data: imported by both the operator project detail and the read-only customer project panel
 * so the two surfaces stay in lockstep. NO credential storage and NO OAuth — the guidance only tells
 * the customer how to add website_support_studio as a user/collaborator. We never ask for passwords.
 */

export type ProjectPlatform = "wordpress" | "shopify" | "wix" | "other";
export type WebsiteAccessStatus =
  | "access_needed"
  | "access_requested"
  | "access_received"
  | "verified"
  | "blocked";

/** Ordered "happy path" of the access lifecycle (blocked is an off-ramp, not a step). */
export const ACCESS_STATUS_FLOW: WebsiteAccessStatus[] = [
  "access_needed",
  "access_requested",
  "access_received",
  "verified",
];

export const ACCESS_STATUS_OPTIONS: WebsiteAccessStatus[] = [
  "access_needed",
  "access_requested",
  "access_received",
  "verified",
  "blocked",
];

export const ACCESS_STATUS_LABEL: Record<WebsiteAccessStatus, string> = {
  access_needed: "Access needed",
  access_requested: "Access requested",
  access_received: "Access received",
  verified: "Access verified",
  blocked: "Access blocked",
};

export const PLATFORM_LABEL: Record<ProjectPlatform, string> = {
  wordpress: "WordPress",
  shopify: "Shopify",
  wix: "Wix",
  other: "Other",
};

/** Raw delivery status → customer-friendly label (operators still see the raw enum elsewhere). */
export const PROJECT_STATUS_CUSTOMER_LABEL: Record<string, string> = {
  intake: "Getting started",
  scoping: "Planning",
  in_progress: "In progress",
  waiting_on_customer: "Waiting on you",
  in_review: "In review",
  delivered: "Delivered",
  closed: "Complete",
  blocked: "On hold",
  cancelled: "Cancelled",
};

export function projectStatusLabel(status: string): string {
  return PROJECT_STATUS_CUSTOMER_LABEL[status] ?? status.replaceAll("_", " ");
}

export function accessStatusLabel(status: string): string {
  return ACCESS_STATUS_LABEL[status as WebsiteAccessStatus] ?? status.replaceAll("_", " ");
}

export function platformLabel(platform: string | null | undefined): string {
  if (!platform) {
    return "Not set";
  }
  return PLATFORM_LABEL[platform as ProjectPlatform] ?? platform;
}

export interface AccessGuidance {
  platform: ProjectPlatform | "unknown";
  headline: string;
  steps: string[];
  /** Recommendations / nice-to-haves shown below the required steps. */
  recommended: string[];
  /** Always-on safety note (no credentials). */
  safety: string;
  comingSoon?: boolean;
}

const SUPPORT_USER = "support@websitesupportstudio.com";

/** Platform-keyed guided-access copy (UI only). WordPress + Shopify are first-class; Wix is a placeholder. */
export function getAccessGuidance(platform: string | null | undefined): AccessGuidance {
  const safety =
    "Never share passwords. Add website_support_studio as a user/collaborator so access can be revoked anytime — we store no credentials.";

  switch ((platform ?? "").toLowerCase()) {
    case "wordpress":
      return {
        platform: "wordpress",
        headline: "Grant WordPress access",
        steps: [
          `In WordPress, go to Users → Add New and add ${SUPPORT_USER} as an Administrator.`,
          "Send us your WordPress login URL (usually yoursite.com/wp-admin).",
          "Confirm the account can manage plugins and edit the active theme.",
        ],
        recommended: [
          "A recent backup or a staging copy is recommended before larger changes.",
        ],
        safety,
      };
    case "shopify":
      return {
        platform: "shopify",
        headline: "Grant Shopify access",
        steps: [
          `In Shopify, go to Settings → Users and permissions and invite ${SUPPORT_USER} as staff (or send a collaborator request).`,
          "Grant Themes access so we can edit your storefront.",
          "Grant Apps access only if your request needs a specific app.",
        ],
        recommended: [
          "If this project includes launch work, share domain / DNS access so we can point your domain.",
        ],
        safety,
      };
    case "wix":
      return {
        platform: "wix",
        headline: "Wix access — coming next",
        steps: [
          "Guided Wix access is coming next. For now, we'll coordinate access with you directly.",
        ],
        recommended: [],
        safety,
        comingSoon: true,
      };
    default:
      return {
        platform: "unknown",
        headline: "Grant website access",
        steps: [
          "Once your platform is set, you'll see step-by-step instructions here for adding us as a user.",
        ],
        recommended: [],
        safety,
      };
  }
}
