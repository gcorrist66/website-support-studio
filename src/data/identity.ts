/**
 * Operator access — post-login identity resolution.
 *
 * Wraps resolve_my_identity() so the router can send operators to the console and customers to
 * the customer experience, keeping the two strictly separate.
 */
import { getAuthClient } from "../auth/realAuthClient";

export type Identity =
  | { kind: "operator"; operatorId: string; role: string; agencyId: string; displayName: string }
  | { kind: "customer"; orgId: string; onboardingStatus: "onboarding_required" | "complete" }
  | { kind: "none" };

export async function resolveMyIdentity(): Promise<Identity> {
  const client = getAuthClient();
  if (!client) {
    return { kind: "none" };
  }
  const { data, error } = await client.rpc("resolve_my_identity");
  if (error || !data) {
    return { kind: "none" };
  }
  const d = data as Record<string, string>;
  if (d.kind === "operator") {
    return {
      kind: "operator",
      operatorId: d.operator_id,
      role: d.role,
      agencyId: d.agency_id,
      displayName: d.display_name,
    };
  }
  if (d.kind === "customer") {
    return {
      kind: "customer",
      orgId: d.org_id,
      onboardingStatus: (d.onboarding_status as "onboarding_required" | "complete") ?? "onboarding_required",
    };
  }
  return { kind: "none" };
}
