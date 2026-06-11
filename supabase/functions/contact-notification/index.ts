import { corsHeaders } from "../_shared/cors.ts";
import { internalNotificationTo, sendWssEmail } from "../_shared/wss-email.ts";

const FALLBACK_EMAIL = "corristonconsulting@gmail.com";

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405, cors);
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.company_website === "string" && body.company_website.trim().length > 0) {
      return json({ ok: false, error: "invalid_submission" }, 400, cors);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!email.includes("@") || message.length === 0) {
      return json({ ok: false, error: "email_and_message_required", fallbackEmail: FALLBACK_EMAIL }, 400, cors);
    }

    const delivery = await sendWssEmail({
      to: internalNotificationTo(),
      alias: "wss-internal-contact-submission",
      replyTo: email,
      variables: {
        CUSTOMER_NAME: name || "Not provided",
        CUSTOMER_EMAIL: email,
        MESSAGE: message,
        CTA_URL: `mailto:${email}`,
        CTA_LABEL: "Reply to contact",
      },
    });

    if (!delivery.ok) {
      console.error(`WSS contact notification failed: ${delivery.error ?? "unknown_error"}`);
      return json({ ok: false, error: "notification_failed", fallbackEmail: FALLBACK_EMAIL }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  } catch (error) {
    console.error(`WSS contact notification error: ${(error as Error).message}`);
    return json({ ok: false, error: "notification_failed", fallbackEmail: FALLBACK_EMAIL }, 502, cors);
  }
});
