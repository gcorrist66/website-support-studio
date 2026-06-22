// Operator pilot status helper — read-only production pilot diagnostics.
//
// Returns the exact Stripe + WSS fields Gary has been checking manually, but only for
// an authenticated operator session. This does not mutate data.
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { withTimeout } from "../_shared/timeout.ts";

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

function toIso(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function maxIso(values: Array<string | null>): string | null {
  const parsed = values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (parsed.length === 0) {
    return null;
  }
  return new Date(Math.max(...parsed.map((date) => date.getTime()))).toISOString();
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
      "plan,status,stripe_customer_id,stripe_subscription_id,buyer_email,owner_claimed,created_at,updated_at,org_profiles(onboarding_status,created_at,updated_at)",
    )
    .eq("org_id", clientId)
    .maybeSingle();

  const { data: ownerRow } = await serviceClient
    .from("org_members")
    .select("created_at,updated_at,role,status")
    .eq("org_id", clientId)
    .eq("role", "org_owner")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: siteRow } = await serviceClient
    .from("sites")
    .select("created_at,updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: firstRequestRow } = await serviceClient
    .from("tickets")
    .select("created_at,updated_at,title")
    .eq("client_id", clientId)
    .not("title", "ilike", "Product feedback:%")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: firstFeedbackRow } = await serviceClient
    .from("tickets")
    .select("created_at,updated_at,title")
    .eq("client_id", clientId)
    .ilike("title", "Product feedback:%")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: latestTicketRow } = await serviceClient
    .from("tickets")
    .select("created_at,updated_at,title")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestTicketMessageRow } = await serviceClient
    .from("ticket_messages")
    .select("created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestAuditRow } = await serviceClient
    .from("ticket_audit_events")
    .select("occurred_at")
    .eq("client_id", clientId)
    .order("occurred_at", { ascending: false })
    .limit(1)
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
  const subscriptionCreatedAt = toIso((subscriptionRow as Record<string, unknown> | null)?.created_at);
  const subscriptionUpdatedAt = toIso((subscriptionRow as Record<string, unknown> | null)?.updated_at);
  const profileCreatedAt = toIso(profileRow?.created_at);
  const profileUpdatedAt = toIso(profileRow?.updated_at);
  const ownerCreatedAt = toIso((ownerRow as Record<string, unknown> | null)?.created_at);
  const ownerUpdatedAt = toIso((ownerRow as Record<string, unknown> | null)?.updated_at);
  const siteCreatedAt = toIso((siteRow as Record<string, unknown> | null)?.created_at);
  const siteUpdatedAt = toIso((siteRow as Record<string, unknown> | null)?.updated_at);
  const firstRequestCreatedAt = toIso((firstRequestRow as Record<string, unknown> | null)?.created_at);
  const firstRequestUpdatedAt = toIso((firstRequestRow as Record<string, unknown> | null)?.updated_at);
  const firstFeedbackCreatedAt = toIso((firstFeedbackRow as Record<string, unknown> | null)?.created_at);
  const firstFeedbackUpdatedAt = toIso((firstFeedbackRow as Record<string, unknown> | null)?.updated_at);
  const latestTicketUpdatedAt = toIso((latestTicketRow as Record<string, unknown> | null)?.updated_at);
  const latestTicketCreatedAt = toIso((latestTicketRow as Record<string, unknown> | null)?.created_at);
  const latestTicketMessageCreatedAt = toIso((latestTicketMessageRow as Record<string, unknown> | null)?.created_at);
  const latestAuditOccurredAt = toIso((latestAuditRow as Record<string, unknown> | null)?.occurred_at);

  let stripeStatus: string | null = null;
  let stripeLookupError: string | null = null;
  let stripeCreatedAt: string | null = null;
  if (stripeSubscriptionId) {
    try {
      const sub = await withTimeout(stripe.subscriptions.retrieve(stripeSubscriptionId), 10000, "stripe_subscription_lookup_timeout");
      stripeStatus = sub.status;
      stripeCreatedAt = typeof sub.created === "number" ? new Date(sub.created * 1000).toISOString() : null;
    } catch (error) {
      console.error(`WSS operator pilot Stripe lookup failed: ${error instanceof Error ? error.message : "unknown_error"}`);
      stripeLookupError = "stripe_lookup_failed";
    }
  }

  const purchasedTimestamp = stripeCreatedAt ?? subscriptionCreatedAt;
  const latestActivity = maxIso([
    purchasedTimestamp,
    subscriptionCreatedAt,
    subscriptionUpdatedAt,
    ownerCreatedAt,
    ownerUpdatedAt,
    profileCreatedAt,
    profileUpdatedAt,
    siteCreatedAt,
    siteUpdatedAt,
    firstRequestCreatedAt,
    latestTicketUpdatedAt,
    latestTicketCreatedAt,
    latestTicketMessageCreatedAt,
    latestAuditOccurredAt,
    firstRequestUpdatedAt,
    firstFeedbackCreatedAt,
    firstFeedbackUpdatedAt,
  ]);

  const timeline = [
    {
      key: "purchased",
      label: "Purchased",
      timestamp: purchasedTimestamp,
      source: stripeCreatedAt ? "Stripe subscription" : "WSS subscriptions row",
      field: stripeCreatedAt ? "created" : "subscriptions.created_at",
      reliability: stripeCreatedAt ? "high" : "medium",
      note: stripeCreatedAt
        ? null
        : "Stripe timestamp unavailable, so this uses the WSS subscription insert time.",
    },
    {
      key: "first_login",
      label: "First Login",
      timestamp: ownerCreatedAt,
      source: "public.org_members",
      field: "created_at",
      reliability: "high",
      note: ownerCreatedAt ? null : "No owner record yet.",
    },
    {
      key: "ownership_claimed",
      label: "Ownership Claimed",
      timestamp: ownerCreatedAt,
      source: "public.org_members",
      field: "created_at",
      reliability: "high",
      note: ownerCreatedAt ? null : "Ownership is not claimed yet.",
    },
    {
      key: "onboarding_completed",
      label: "Onboarding Completed",
      timestamp: onboardingStatus === "complete" ? profileUpdatedAt : null,
      source: "public.org_profiles",
      field: "updated_at",
      reliability: "medium",
      note:
        onboardingStatus === "complete"
          ? profileUpdatedAt
            ? null
            : "Onboarding is complete, but the completion timestamp is unavailable."
          : "Onboarding is not complete yet.",
    },
    {
      key: "site_created",
      label: "Site Created",
      timestamp: siteCreatedAt,
      source: "public.sites",
      field: "created_at",
      reliability: "high",
      note: siteCreatedAt ? null : "No site has been created yet.",
    },
    {
      key: "first_request",
      label: "First Request",
      timestamp: firstRequestCreatedAt,
      source: "public.tickets",
      field: "created_at",
      reliability: "medium",
      note: firstRequestCreatedAt ? null : "No support request has been submitted yet.",
    },
    {
      key: "first_feedback",
      label: "First Feedback",
      timestamp: firstFeedbackCreatedAt,
      source: "public.tickets",
      field: "created_at",
      reliability: "medium",
      note: firstFeedbackCreatedAt ? null : "No product feedback has been submitted yet.",
    },
    {
      key: "latest_activity",
      label: "Latest Activity",
      timestamp: latestActivity,
      source: "Aggregate",
      field: "multiple tables",
      reliability: "medium",
      note: latestActivity ? null : "No activity has been recorded yet.",
    },
  ];

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
      timeline,
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
