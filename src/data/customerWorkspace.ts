/**
 * Customer workspace data access.
 *
 * Loads the signed-in customer's org + subscription summary and site list so the dashboard can
 * show account, billing, and capacity information without building a separate billing system.
 */
import { getAuthClient } from "../auth/realAuthClient";
import { PLANS, type PlanKey } from "../billing/plans";

export interface CustomerSite {
  id: string;
  name: string;
  url: string | null;
}

export interface CustomerWorkspaceSummary {
  orgId: string;
  orgName: string;
  planKey: PlanKey | null;
  planName: string;
  monthlyUsd: number | null;
  subscriptionStatus: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  onboardingStatus: string | null;
  websiteCount: number | null;
  cmsPlatform: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  supportEmail: string | null;
  capacityIncluded: number | null;
  capacityUsed: number | null;
  capacityRemaining: number | null;
}

const EMPTY_SUMMARY: CustomerWorkspaceSummary = {
  orgId: "",
  orgName: "Your organization",
  planKey: null,
  planName: "Plan not found",
  monthlyUsd: null,
  subscriptionStatus: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  onboardingStatus: null,
  websiteCount: null,
  cmsPlatform: null,
  primaryContactName: null,
  primaryContactEmail: null,
  supportEmail: null,
  capacityIncluded: null,
  capacityUsed: null,
  capacityRemaining: null,
};

export function createEmptyCustomerWorkspaceSummary(): CustomerWorkspaceSummary {
  return EMPTY_SUMMARY;
}

export async function loadCustomerWorkspaceSummary(orgId: string): Promise<CustomerWorkspaceSummary> {
  const client = getAuthClient();
  if (!client || !orgId) {
    return createEmptyCustomerWorkspaceSummary();
  }

  const { data, error } = await client
    .from("subscriptions")
    .select(
      "plan,status,current_period_start,current_period_end,monthly_cu,clients(id,name),org_profiles(onboarding_status,website_count,cms_platform,primary_contact_name,primary_contact_email,support_email)",
    )
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data || typeof data !== "object") {
    return createEmptyCustomerWorkspaceSummary();
  }

  const row = data as Record<string, unknown>;
  const clientRow = (row.clients as Record<string, unknown> | null | undefined) ?? {};
  const profileRow = (row.org_profiles as Record<string, unknown> | null | undefined) ?? {};
  const planKey = ["operations", "growth", "enterprise"].includes(String(row.plan)) ? (row.plan as PlanKey) : null;
  const plan = planKey ? PLANS[planKey] : null;
  const capacityIncluded = plan?.capacityUnits ?? (typeof row.monthly_cu === "number" && row.monthly_cu > 0 ? row.monthly_cu : null);

  return {
    orgId,
    orgName: typeof clientRow.name === "string" && clientRow.name.trim().length > 0 ? clientRow.name : "Your organization",
    planKey,
    planName: plan?.name ?? (typeof row.plan === "string" && row.plan.trim().length > 0 ? row.plan : "Plan not found"),
    monthlyUsd: plan?.monthlyUsd ?? null,
    subscriptionStatus: typeof row.status === "string" ? row.status : null,
    currentPeriodStart: typeof row.current_period_start === "string" ? row.current_period_start : null,
    currentPeriodEnd: typeof row.current_period_end === "string" ? row.current_period_end : null,
    onboardingStatus: typeof profileRow.onboarding_status === "string" ? profileRow.onboarding_status : null,
    websiteCount: typeof profileRow.website_count === "number" ? profileRow.website_count : null,
    cmsPlatform: typeof profileRow.cms_platform === "string" ? profileRow.cms_platform : null,
    primaryContactName: typeof profileRow.primary_contact_name === "string" ? profileRow.primary_contact_name : null,
    primaryContactEmail: typeof profileRow.primary_contact_email === "string" ? profileRow.primary_contact_email : null,
    supportEmail: typeof profileRow.support_email === "string" ? profileRow.support_email : null,
    capacityIncluded,
    capacityUsed: null,
    capacityRemaining: null,
  };
}

export async function loadMySites(): Promise<CustomerSite[]> {
  const client = getAuthClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client.from("sites").select("id,name,url").order("name");
  if (error || !data) {
    return [];
  }

  return (data as CustomerSite[]).map((site) => ({
    id: site.id,
    name: site.name,
    url: site.url ?? null,
  }));
}
