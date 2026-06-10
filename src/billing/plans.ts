/**
 * Stage A — WSS plan + add-on catalog (single source of truth for the app).
 *
 * Pure metadata only (display, capacity, site limits, the plan key sent to checkout).
 * Stripe price IDs are NOT here — they live in the Edge Function env (server-side), so no
 * Stripe IDs are committed. The marketing site mirrors this in marketing/src/consts.ts.
 */
export type PlanKey = "operations" | "growth" | "enterprise";

export interface PlanDef {
  key: PlanKey;
  name: string;
  /** Monthly price in USD; null = custom (Enterprise). */
  monthlyUsd: number | null;
  capacityUnits: number | null; // null = custom
  sitesLabel: string;
  /** Checkout intent: "checkout" hits create-checkout-session; "contact" routes to /contact. */
  cta: "checkout" | "contact";
}

export const PLANS: Record<PlanKey, PlanDef> = {
  operations: { key: "operations", name: "Operations", monthlyUsd: 399, capacityUnits: 50, sitesLabel: "1 website", cta: "checkout" },
  growth: { key: "growth", name: "Growth", monthlyUsd: 899, capacityUnits: 150, sitesLabel: "up to 5 websites", cta: "checkout" },
  enterprise: { key: "enterprise", name: "Enterprise", monthlyUsd: null, capacityUnits: null, sitesLabel: "custom", cta: "contact" },
};

export type AddonKey = "topup_50" | "topup_100" | "topup_250" | "dns";

export interface AddonDef {
  key: AddonKey;
  name: string;
  /** One-time price in USD. Stripe price IDs stay in the Edge Function env. */
  priceUsd: number | null;
}

export const ADDONS: Record<AddonKey, AddonDef> = {
  topup_50: { key: "topup_50", name: "50 Capacity Units", priceUsd: 150 },
  topup_100: { key: "topup_100", name: "100 Capacity Units", priceUsd: 275 },
  topup_250: { key: "topup_250", name: "250 Capacity Units", priceUsd: 625 },
  dns: { key: "dns", name: "DNS Assistance", priceUsd: 100 },
};
