/**
 * Stage B — customer claim + onboarding data access (authenticated Supabase client).
 *
 * Thin wrappers over the SECURITY DEFINER RPCs that complete "Become Customer":
 *   - claimMyPaidOrg(): first-login claim of the paid org (-> org_owner membership).
 *   - completePaidOnboarding(): owner finalizes onboarding for the existing paid org.
 *
 * No dashboard/portal/capacity logic. Uses the real auth client; returns safe defaults when
 * auth is disabled/unconfigured so callers never crash.
 */
import { getAuthClient } from "../auth/realAuthClient";

export interface ClaimResult {
  has_org: boolean;
  org_id: string | null;
  onboarding_status: "onboarding_required" | "complete" | null;
  claimed: boolean;
}

const NO_ORG: ClaimResult = { has_org: false, org_id: null, onboarding_status: null, claimed: false };

/** Claim (or resolve) the caller's paid org. Idempotent. */
export async function claimMyPaidOrg(): Promise<ClaimResult> {
  const client = getAuthClient();
  if (!client) {
    return NO_ORG;
  }
  const { data, error } = await client.rpc("claim_my_paid_org");
  if (error || !data) {
    return NO_ORG;
  }
  return data as ClaimResult;
}

export interface OnboardingInput {
  orgId: string;
  companyName: string;
  websiteUrl: string;
  websiteCount: number | null;
  cmsPlatform: string;
  primaryContactName: string;
  primaryContactEmail: string;
  supportEmail: string;
}

export interface OnboardingResult {
  org_id: string;
  onboarding_status: "onboarding_required" | "complete";
}

/** Finalize onboarding for the owner's existing paid org. */
export async function completePaidOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const client = getAuthClient();
  if (!client) {
    throw new Error("auth_not_configured");
  }
  const { data, error } = await client.rpc("complete_paid_onboarding", {
    p_org_id: input.orgId,
    p_company_name: input.companyName,
    p_website_url: input.websiteUrl,
    p_website_count: input.websiteCount,
    p_cms_platform: input.cmsPlatform,
    p_primary_contact_name: input.primaryContactName,
    p_primary_contact_email: input.primaryContactEmail,
    p_support_email: input.supportEmail,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "onboarding_failed");
  }
  return data as OnboardingResult;
}
