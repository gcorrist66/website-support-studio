// Operator pilot status helper — read-only production pilot diagnostics.
//
// Returns the exact Stripe + WSS fields Gary has been checking manually, but only for
// an authenticated operator session. This does not mutate data.
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-01-27.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

function json(body: unknown, status = 200, cors?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(cors ?? {}),
      "content-type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  const authClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: identity, error: identityError } = await authClient.rpc("resolve_my_identity");
  if (identityError || !identity || (identity as Record<string, unknown>).kind !== "operator") {
    return json({ error: "forbidden" }, 403, cors);
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  let clientId = "";
  try {
    const body = await req.json();
    clientId = typeof body?.client_id === "string" ? body.client_id.trim() : "";
  } catch {
    clientId = "";
  }

  if (!clientId) {
    return json({ error: "missing_client_id" }, 400, cors);
  }

  const { data: subscriptionRow, error: subscriptionError } = await serviceClient
    .from("subscriptions")
    .select(
      "plan,status,stripe_customer_id,stripe_subscription_id,buyer_email,owner_claimed,org_profiles(onboarding_status)",
    )
    .eq("org_id", clientId)
    .maybeSingle();

  const { count: orgMemberCount, error: memberCountError } = await serviceClient
    .from("org_members")
    .select("id", { count: "exact", head: true })
    .eq("org_id", clientId);

  const { count: siteCount, error: siteCountError } = await serviceClient
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  const row = (subscriptionRow as Record<string, unknown> | null) ?? null;
  const profileRow = (row?.org_profiles as Record<string, unknown> | null | undefined) ?? null;
  const stripeSubscriptionId = typeof row?.stripe_subscription_id === "string" ? row.stripe_subscription_id : null;
  const stripeCustomerId = typeof row?.stripe_customer_id === "string" ? row.stripe_customer_id : null;
  const buyerEmail = typeof row?.buyer_email === "string" ? row.buyer_email : null;
  const wssStatus = typeof row?.status === "string" ? row.status : null;
  const plan = typeof row?.plan === "string" ? row.plan : null;
  const ownerClaimed = typeof row?.owner_claimed === "boolean" ? row.owner_claimed : null;
  const onboardingStatus = typeof profileRow?.onboarding_status === "string" ? profileRow.onboarding_status : null;

  let stripeStatus: string | null = null;
  let stripeLookupError: string | null = null;
  if (stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      stripeStatus = sub.status;
    } catch (error) {
      stripeLookupError = error instanceof Error ? error.message : "stripe_lookup_failed";
    }
  }

  return json(
    {
      buyer_email: buyerEmail,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan,
      stripe_status: stripeStatus,
      stripe_lookup_error: stripeLookupError,
      wss_status: wssStatus,
      owner_claimed: ownerClaimed,
      onboarding_status: onboardingStatus,
      org_member_count: memberCountError ? null : orgMemberCount ?? 0,
      site_count: siteCountError ? null : siteCount ?? 0,
      errors: {
        subscription: subscriptionError ? subscriptionError.message : null,
        org_members: memberCountError ? memberCountError.message : null,
        sites: siteCountError ? siteCountError.message : null,
      },
    },
    200,
    cors,
  );
});
