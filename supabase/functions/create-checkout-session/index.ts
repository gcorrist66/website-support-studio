// Stage A — create-checkout-session (Supabase Edge Function, Deno).
//
// Creates a Stripe Checkout Session for a plan (subscription) or an add-on (one-time),
// and returns { url } for the browser to redirect to. The Stripe SECRET key lives only in
// this function's env — never in the browser. Price IDs are read from env so no IDs are
// hardcoded. The marketing "join now" button POSTs here.
//
// Body: { plan?: "operations"|"growth", addon?: "topup_50"|"topup_100"|"topup_250"|"dns",
//         email?: string }
//   - plan  -> subscription-mode checkout (recurring)
//   - addon -> payment-mode checkout (one-time); requires an existing customer org context later
//
// Env required:
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_OPERATIONS, STRIPE_PRICE_GROWTH
//   STRIPE_PRICE_TOPUP_50, STRIPE_PRICE_TOPUP_100, STRIPE_PRICE_TOPUP_250, STRIPE_PRICE_DNS  (add-ons)
//   APP_URL (e.g. https://app.websitesupportstudio.com)
//   SITE_URL (e.g. https://websitesupportstudio.com)
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-01-27.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const PLAN_PRICE: Record<string, string | undefined> = {
  operations: Deno.env.get("STRIPE_PRICE_OPERATIONS"),
  growth: Deno.env.get("STRIPE_PRICE_GROWTH"),
};
const ADDON_PRICE: Record<string, string | undefined> = {
  topup_50: Deno.env.get("STRIPE_PRICE_TOPUP_50"),
  topup_100: Deno.env.get("STRIPE_PRICE_TOPUP_100"),
  topup_250: Deno.env.get("STRIPE_PRICE_TOPUP_250"),
  dns: Deno.env.get("STRIPE_PRICE_DNS"),
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...cors, "content-type": "application/json" } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const appUrl = Deno.env.get("APP_URL") ?? "https://app.websitesupportstudio.com";
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://websitesupportstudio.com";

    let mode: "subscription" | "payment";
    let price: string | undefined;
    let metadata: Record<string, string> = {};

    if (body.plan && PLAN_PRICE[body.plan]) {
      mode = "subscription";
      price = PLAN_PRICE[body.plan];
      metadata = { plan: body.plan, kind: "plan" };
    } else if (body.addon && ADDON_PRICE[body.addon]) {
      mode = "payment";
      price = ADDON_PRICE[body.addon];
      metadata = { addon: body.addon, kind: "addon" };
    } else {
      return new Response(JSON.stringify({ error: "unknown_plan_or_addon" }), { status: 400, headers: { ...cors, "content-type": "application/json" } });
    }
    if (!price) {
      return new Response(JSON.stringify({ error: "price_not_configured" }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price, quantity: 1 }],
      customer_email: typeof body.email === "string" && body.email ? body.email : undefined,
      allow_promotion_codes: true,
      metadata,
      // Carry plan onto the subscription so the webhook can read it on subscription events.
      ...(mode === "subscription" ? { subscription_data: { metadata } } : {}),
      success_url: `${appUrl}/login?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...cors, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...cors, "content-type": "application/json" } });
  }
});
