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

/** Customer-facing effort tiers. No hard CU numbers — per-effort pricing is not finalized, so we use
 *  the same relative framing the marketing FAQ already uses ("fewer units" vs "more units"). */
export type EffortLevel = "low" | "medium" | "high";

export interface EffortLevelDef {
  key: EffortLevel;
  name: string;
  /** One-line summary for a card/header. */
  summary: string;
  /** Concrete example requests at this effort. */
  examples: string[];
  /** Relative unit cost, qualitative (no invented numbers). */
  relativeCost: "fewest" | "moderate" | "most";
}

export const EFFORT_LEVELS: Record<EffortLevel, EffortLevelDef> = {
  low: {
    key: "low",
    name: "Low effort",
    summary: "Quick changes we can usually turn around fast.",
    examples: ["Edit text or fix a typo", "Swap an image or logo", "Update a link or button", "Small content tweaks"],
    relativeCost: "fewest",
  },
  medium: {
    key: "medium",
    name: "Medium effort",
    summary: "Standard updates that take a bit more work.",
    examples: ["Add a new section to a page", "Adjust layout or styling", "Configure a form or plugin", "Update content across several pages"],
    relativeCost: "moderate",
  },
  high: {
    key: "high",
    name: "High effort",
    summary: "Involved work that uses the most capacity.",
    examples: ["Build a new page or template", "Set up an integration", "Complex troubleshooting", "Performance or SEO overhaul"],
    relativeCost: "most",
  },
};

export const EFFORT_LEVEL_ORDER: EffortLevel[] = ["low", "medium", "high"];

/** Short plain-language explanation of what a Capacity Unit is (mirrors the marketing FAQ). */
export const CAPACITY_EXPLAINER =
  "Capacity Units measure the effort of each request. Your plan includes a monthly allotment — a " +
  "simple change costs fewer units, more involved work costs more. Your allotment refreshes every month.";

/**
 * How usage is tracked today. Flip `automated` to true (and remove the pilot note) when a real CU
 * ledger/consumption engine lands. Until then the UI must present used/remaining as estimates.
 */
export const USAGE_TRACKING = {
  automated: false,
  mode: "manual_pilot" as const,
  note:
    "During the pilot, Capacity Unit usage is tracked manually by your operator and updated here. " +
    "Automated, real-time metering is coming soon.",
};

/** Replenishment / top-up messaging, derived from the plan + add-on catalog (no Stripe IDs). */
export const REPLENISHMENT = {
  refresh: "Your Capacity Units refresh at the start of each billing period.",
  topups: [ADDONS.topup_50, ADDONS.topup_100, ADDONS.topup_250].map((a) => ({
    key: a.key,
    name: a.name,
    /** null price => amount shown at checkout (top-up pricing is a pending business input). */
    priceUsd: a.priceUsd,
  })),
  dns: { name: ADDONS.dns.name, priceUsd: ADDONS.dns.priceUsd },
  note: "Need more in a busy month? Add a top-up (50, 100, or 250 Capacity Units) anytime from your account.",
};

/** Build a single human-readable billing/replenishment line for a plan. */
export function buildBillingMessage(planKey: PlanKey | null): string {
  if (!planKey) {
    return "We couldn't find an active plan on your account. Contact support if this looks wrong.";
  }
  const plan = PLANS[planKey];
  const cu = plan.capacityUnits != null ? `${plan.capacityUnits} Capacity Units` : "a custom Capacity Unit allotment";
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
