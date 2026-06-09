// Stage A — stripe-webhook (Supabase Edge Function, Deno).
//
// Verifies Stripe signatures and turns payment events into WSS customer records by calling the
// SECURITY DEFINER RPCs (as service_role). Handles:
//   checkout.session.completed        -> provision_paid_customer (subscription) / log (addon)
//   customer.subscription.created     -> ensure provisioned + status
//   customer.subscription.updated     -> update_subscription_status
//   customer.subscription.deleted     -> update_subscription_status (canceled)
//   invoice.paid                      -> update_subscription_status (active + new period)  [renewal]
//   invoice.payment_failed            -> update_subscription_status (past_due)
//
// Env required:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (server-side only; never in browser)
import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-01-27.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const iso = (unixSeconds: number | null | undefined): string | null =>
  typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : null;

async function rpc(fn: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data;
}

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (e) {
    return new Response(`signature verification failed: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          const plan = (s.metadata?.plan ?? sub.metadata?.plan ?? "operations") as string;
          await rpc("provision_paid_customer", {
            p_stripe_subscription_id: sub.id,
            p_stripe_customer_id: (s.customer as string) ?? (sub.customer as string),
            p_plan: plan,
            p_buyer_email: s.customer_details?.email ?? s.customer_email ?? null,
            p_company_name: s.customer_details?.name ?? null,
            p_status: sub.status,
            p_current_period_start: iso(sub.current_period_start),
            p_current_period_end: iso(sub.current_period_end),
          });
        }
        // addon (mode 'payment'): capacity top-up / DNS is consumed by the Capacity engine (Stage C/D).
        // Stage A acknowledges it; no capacity write here.
        break;
      }
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const plan = (sub.metadata?.plan ?? "operations") as string;
        // Ensure provisioned (idempotent); buyer email resolved from the customer.
        let email: string | null = null;
        try {
          const cust = await stripe.customers.retrieve(sub.customer as string);
          if (cust && !(cust as Stripe.DeletedCustomer).deleted) email = (cust as Stripe.Customer).email ?? null;
        } catch (_) { /* ignore */ }
        await rpc("provision_paid_customer", {
          p_stripe_subscription_id: sub.id,
          p_stripe_customer_id: sub.customer as string,
          p_plan: plan,
          p_buyer_email: email,
          p_company_name: null,
          p_status: sub.status,
          p_current_period_start: iso(sub.current_period_start),
          p_current_period_end: iso(sub.current_period_end),
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await rpc("update_subscription_status", {
          p_stripe_subscription_id: sub.id,
          p_status: sub.status,
          p_current_period_start: iso(sub.current_period_start),
          p_current_period_end: iso(sub.current_period_end),
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await rpc("update_subscription_status", { p_stripe_subscription_id: sub.id, p_status: "canceled" });
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          await rpc("update_subscription_status", {
            p_stripe_subscription_id: inv.subscription as string,
            p_status: "active",
            p_current_period_start: iso(inv.period_start),
            p_current_period_end: iso(inv.period_end),
          });
          // NOTE (Stage D): replenish monthly Capacity Units for the new period here.
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          await rpc("update_subscription_status", { p_stripe_subscription_id: inv.subscription as string, p_status: "past_due" });
        }
        break;
      }
      default:
        // Unhandled event types are acknowledged (200) so Stripe doesn't retry.
        break;
    }
  } catch (e) {
    // Return 500 so Stripe retries transient failures.
    return new Response(`handler error: ${(e as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "content-type": "application/json" } });
});
