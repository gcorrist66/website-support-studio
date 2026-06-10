/**
 * Capacity Unit (CU) customer-facing model — metadata single source of truth.
 *
 * WSS sells a monthly allotment of Capacity Units; each request consumes units by effort. This file
 * holds ONLY display/metadata (no Stripe IDs, no DB access) so the customer UI and any backend
 * assembler share one definition of: effort levels, the capacity explainer, replenishment messaging,
 * and how usage is currently tracked.
 *
 * IMPORTANT — usage tracking: automated CU metering is NOT implemented yet. During the pilot, usage
 * is tracked manually by the operator. The contract below labels used/remaining as ESTIMATED so the
 * UI never implies precision we don't have. See USAGE_TRACKING.
 *
 * Wording is kept consistent with marketing/src/faqs.ts ("a simple change costs fewer units, more
 * involved work costs more") and marketing/src/pages/pricing.astro.
 */
import { ADDONS, PLANS, type PlanKey } from "./plans";

/** Customer-facing effort tiers. */
export type EffortLevel = "low" | "medium" | "high";

export interface EffortLevelDef {
  key: EffortLevel;
  name: string;
  /** One-line summary for a card/header. */
  summary: string;
  /** Concrete example requests at this effort. */
  examples: string[];
  creditCost: 1 | 3 | 8;
}

export const EFFORT_LEVELS: Record<EffortLevel, EffortLevelDef> = {
  low: {
    key: "low",
    name: "low effort",
    summary: "1 credit — quick changes we can usually turn around fast.",
    examples: ["edit text or fix a typo", "swap an image or logo", "update a link or button", "small content tweaks"],
    creditCost: 1,
  },
  medium: {
    key: "medium",
    name: "medium effort",
    summary: "3 credits — standard updates that take a bit more work.",
    examples: ["add a new section to a page", "adjust layout or styling", "configure a form or plugin", "update content across several pages"],
    creditCost: 3,
  },
  high: {
    key: "high",
    name: "high effort",
    summary: "8 credits — involved work that uses the most capacity.",
    examples: ["build a new page or template", "set up an integration", "complex troubleshooting", "performance or seo overhaul"],
    creditCost: 8,
  },
};

export const EFFORT_LEVEL_ORDER: EffortLevel[] = ["low", "medium", "high"];

/** Short plain-language explanation of what a Capacity Unit is (mirrors the marketing FAQ). */
export const CAPACITY_EXPLAINER =
  "capacity units measure the effort of each request. low_effort = 1 credit, medium_effort = 3 credits, " +
  "and high_effort = 8 credits. your allotment refreshes every month.";

/**
 * How usage is tracked today. Flip `automated` to true (and remove the pilot note) when a real CU
 * ledger/consumption engine lands. Until then the UI must present used/remaining as estimates.
 */
export const USAGE_TRACKING = {
  automated: false,
  mode: "manual_pilot" as const,
  note:
    "during the pilot, capacity unit usage is tracked manually by your operator and updated here. " +
    "automated, real-time metering is coming soon.",
};

/** Replenishment / top-up messaging, derived from the plan + add-on catalog (no Stripe IDs). */
export const REPLENISHMENT = {
  refresh: "your capacity units refresh at the start of each billing period.",
  topups: [ADDONS.topup_50, ADDONS.topup_100, ADDONS.topup_250].map((a) => ({
    key: a.key,
    name: a.name,
    priceUsd: a.priceUsd,
  })),
  dns: { name: ADDONS.dns.name, priceUsd: ADDONS.dns.priceUsd },
  note:
    "need more in a busy month? add a discounted top-up (50, 100, or 250 capacity units) anytime from your account. bigger work may use more credits, and project work may be priced separately.",
};

/** Build a single human-readable billing/replenishment line for a plan. */
export function buildBillingMessage(planKey: PlanKey | null): string {
  if (!planKey) {
    return "we couldn't find an active plan on your account. contact support if this looks wrong.";
  }
  const plan = PLANS[planKey];
  const cu = plan.capacityUnits != null ? `${plan.capacityUnits} capacity units` : "a custom capacity unit allotment";
  const price = plan.monthlyUsd != null ? `$${plan.monthlyUsd}/month` : "custom pricing";
  return `${plan.name} — ${price}, ${cu} each month. ${REPLENISHMENT.note}`;
}

/** The capacity snapshot the UI renders. used/remaining are estimates during the pilot. */
export interface CapacityModel {
  includedThisMonth: number | null;
  usedThisMonth: number | null;
  remainingThisMonth: number | null;
  isEstimated: boolean;
  trackingMode: string;
  trackingNote: string;
}

/**
 * Build the smallest honest capacity model. With no automated metering, used defaults to 0 and
 * remaining mirrors included — both flagged `isEstimated` so the UI can label them clearly.
 */
export function buildCapacityModel(includedThisMonth: number | null): CapacityModel {
  const used = USAGE_TRACKING.automated ? 0 : 0; // placeholder until a real ledger exists
  const remaining = includedThisMonth != null ? Math.max(includedThisMonth - used, 0) : null;
  return {
    includedThisMonth,
    usedThisMonth: includedThisMonth != null ? used : null,
    remainingThisMonth: remaining,
    isEstimated: !USAGE_TRACKING.automated,
    trackingMode: USAGE_TRACKING.mode,
    trackingNote: USAGE_TRACKING.note,
  };
}
