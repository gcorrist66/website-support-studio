/**
 * Customer account data contract — the single read-only shape the customer MMVP needs.
 *
 * Composes existing, RLS-protected sources (no new tables, no migration, no Stripe secrets):
 *   - loadCustomerWorkspaceSummary() → org, plan, subscription status, capacity included
 *   - the auth session → customer email
 *   - RLS-scoped COUNT queries on `tickets` → support vs. product-feedback counts
 *   - billing/capacity metadata → effort levels, replenishment messaging, capacity model
 *
 * Safety:
 *   - Every query is read-only and RLS-scoped to the caller's org (a customer can only ever read
 *     their own subscription/sites/tickets; see supabase phase_e_rls policies).
 *   - Stripe IDs are intentionally WITHHELD from the browser. They are not needed for customer-facing
 *     visibility and operators can see them via the operator-pilot-status function. The contract
 *     keeps the fields (as null) so a future server-side path can populate them "if safe".
 *   - Billing history/invoices are NOT exposed: there is no invoices table and no safe in-browser
 *     Stripe portal path. `billingHistoryAvailable` is false until a server-side path exists.
 */
import { getAuthClient } from "../auth/realAuthClient";
import {
  CAPACITY_EXPLAINER,
  EFFORT_LEVELS,
  EFFORT_LEVEL_ORDER,
  REPLENISHMENT,
  buildBillingMessage,
  buildCapacityModel,
  type CapacityModel,
  type EffortLevelDef,
} from "../billing/capacity";
import type { PlanKey } from "../billing/plans";
import { FEEDBACK_TITLE_LIKE } from "../domain/requestKind";
import { loadCustomerWorkspaceSummary } from "./customerWorkspace";

export interface CustomerAccount {
  // Identity
  customerEmail: string | null;
  orgId: string;
  company: string;
  website: string | null;

  // Plan + subscription
  planKey: PlanKey | null;
  planName: string;
  monthlyUsd: number | null;
  subscriptionStatus: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;

  // Stripe (withheld from client by design; null unless a safe server path fills them)
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  // Capacity / credits
  capacity: CapacityModel;
  capacityExplainer: string;
  effortLevels: EffortLevelDef[];
  replenishment: typeof REPLENISHMENT;
  billingMessage: string;

  // Activity counts (read-only, RLS-scoped). null = could not be safely read.
  supportRequestCount: number | null;
  productFeedbackCount: number | null;

  // Billing history
  billingHistoryAvailable: boolean;
  billingHistoryNote: string;
}

function emptyAccount(orgId: string): CustomerAccount {
  const capacity = buildCapacityModel(null);
  return {
    customerEmail: null,
    orgId,
    company: "Your organization",
    website: null,
    planKey: null,
    planName: "Plan not found",
    monthlyUsd: null,
    subscriptionStatus: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    capacity,
    capacityExplainer: CAPACITY_EXPLAINER,
    effortLevels: EFFORT_LEVEL_ORDER.map((k) => EFFORT_LEVELS[k]),
    replenishment: REPLENISHMENT,
    billingMessage: buildBillingMessage(null),
    supportRequestCount: null,
    productFeedbackCount: null,
    billingHistoryAvailable: false,
    billingHistoryNote:
      "Invoice history isn't shown here yet. Your card statement reflects your monthly charge; " +
      "contact support if you need a copy of an invoice.",
  };
}

/** First site URL for the caller's org (RLS-scoped). Used as the account's "website". */
async function firstSiteUrl(): Promise<string | null> {
  const client = getAuthClient();
  if (!client) return null;
  const { data, error } = await client.from("sites").select("url").not("url", "is", null).order("name").limit(1);
  if (error || !data || data.length === 0) return null;
  const url = (data[0] as { url: string | null }).url;
  return typeof url === "string" && url.trim().length > 0 ? url : null;
}

/** RLS-scoped count of the caller's tickets matching (or not matching) the feedback title prefix. */
async function countTickets(feedback: boolean): Promise<number | null> {
  const client = getAuthClient();
  if (!client) return null;
  let query = client.from("tickets").select("id", { count: "exact", head: true });
  query = feedback
    ? query.ilike("title", FEEDBACK_TITLE_LIKE)
    : query.not("title", "ilike", FEEDBACK_TITLE_LIKE);
  const { count, error } = await query;
  if (error) return null;
  return count ?? 0;
}

/**
 * Load the full customer account contract. Always resolves (never throws) — on any error it returns
 * a clearly-empty/safe shape so the UI can degrade gracefully.
 */
export async function loadCustomerAccount(orgId: string): Promise<CustomerAccount> {
  const client = getAuthClient();
  if (!client || !orgId) return emptyAccount(orgId);

  const summary = await loadCustomerWorkspaceSummary(orgId);

  let customerEmail: string | null = null;
  try {
    const { data } = await client.auth.getUser();
    customerEmail = data.user?.email ?? null;
  } catch {
    customerEmail = null;
  }

  const [supportRequestCount, productFeedbackCount, website] = await Promise.all([
    countTickets(false),
    countTickets(true),
    firstSiteUrl(),
  ]);

  const base = emptyAccount(orgId);
  return {
    ...base,
    customerEmail,
    company: summary.orgName,
    website,
    planKey: summary.planKey,
    planName: summary.planName,
    monthlyUsd: summary.monthlyUsd,
    subscriptionStatus: summary.subscriptionStatus,
    currentPeriodStart: summary.currentPeriodStart,
    currentPeriodEnd: summary.currentPeriodEnd,
    capacity: buildCapacityModel(summary.capacityIncluded),
    billingMessage: buildBillingMessage(summary.planKey),
    supportRequestCount,
    productFeedbackCount,
  };
}
