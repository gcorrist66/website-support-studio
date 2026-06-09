/**
 * Operator pilot status — read-only diagnostic bundle for Production Pilot Mode.
 *
 * This is intentionally tiny: it resolves the current tenant's Stripe + WSS state so the
 * operator console can surface the exact fields Gary has been checking manually.
 */
import { getAuthClient } from "../auth/realAuthClient";

export interface OperatorPilotStatus {
  buyerEmail: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: string | null;
  stripeStatus: string | null;
  wssStatus: string | null;
  ownerClaimed: boolean | null;
  onboardingStatus: string | null;
  orgMemberCount: number | null;
  siteCount: number | null;
}

const EMPTY_STATUS: OperatorPilotStatus = {
  buyerEmail: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  plan: null,
  stripeStatus: null,
  wssStatus: null,
  ownerClaimed: null,
  onboardingStatus: null,
  orgMemberCount: null,
  siteCount: null,
};

export function createEmptyOperatorPilotStatus(): OperatorPilotStatus {
  return EMPTY_STATUS;
}

export async function loadOperatorPilotStatus(clientId: string): Promise<OperatorPilotStatus> {
  const client = getAuthClient();
  if (!client || !clientId) {
    return createEmptyOperatorPilotStatus();
  }

  const { data, error } = await client.functions.invoke("operator-pilot-status", {
    body: { client_id: clientId },
  });

  if (error || !data || typeof data !== "object") {
    return createEmptyOperatorPilotStatus();
  }

  const row = data as Record<string, unknown>;
  return {
    buyerEmail: typeof row.buyer_email === "string" ? row.buyer_email : null,
    stripeCustomerId: typeof row.stripe_customer_id === "string" ? row.stripe_customer_id : null,
    stripeSubscriptionId: typeof row.stripe_subscription_id === "string" ? row.stripe_subscription_id : null,
    plan: typeof row.plan === "string" ? row.plan : null,
    stripeStatus: typeof row.stripe_status === "string" ? row.stripe_status : null,
    wssStatus: typeof row.wss_status === "string" ? row.wss_status : null,
    ownerClaimed: typeof row.owner_claimed === "boolean" ? row.owner_claimed : null,
    onboardingStatus: typeof row.onboarding_status === "string" ? row.onboarding_status : null,
    orgMemberCount: typeof row.org_member_count === "number" ? row.org_member_count : null,
    siteCount: typeof row.site_count === "number" ? row.site_count : null,
  };
}

