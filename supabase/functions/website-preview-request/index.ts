import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { internalNotificationTo, sendWssEmail } from "../_shared/wss-email.ts";

const STATUS = "new_preview_request";

type Payload = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }
  return asString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalBoolean(value: unknown): boolean | null {
  const normalized = asString(value).toLowerCase();
  if (["yes", "true", "available"].includes(normalized)) return true;
  if (["no", "false", "not_available"].includes(normalized)) return false;
  return null;
}

function normalizeDomain(rawValue: unknown): string {
  const raw = asString(rawValue).toLowerCase();
  if (!raw) return "";

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.hostname.replace(/\.$/, "").replace(/^www\./, "");
  } catch (_) {
    return "";
  }
}

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });
}

function requireFields(fields: Record<string, string>) {
  return Object.entries(fields)
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, cors);

  try {
    const body = (await req.json().catch(() => ({}))) as Payload;
    if (asString(body.company_website).length > 0) {
      return json({ ok: false, error: "invalid_submission" }, 400, cors);
    }

    const submittedAt = new Date().toISOString();
    const pagesNeeded = asStringArray(body.pages_needed);
    const normalizedDomain = normalizeDomain(body.current_website_url);
    const currentWebsiteUrl = asString(body.current_website_url);
    const normalized = {
      status: STATUS,
      submitted_at: submittedAt,
      page_source: asString(body.page_source) || "free_website_preview_landing_page",
      source_url: asString(body.source_url),
      referrer: asString(body.referrer),
      user_agent: asString(body.user_agent) || req.headers.get("user-agent") || "",
      name: asString(body.name),
      email: asString(body.email).toLowerCase(),
      phone: asString(body.phone),
      business_name: asString(body.business_name),
      current_website_url: currentWebsiteUrl,
      normalized_domain: normalizedDomain,
      industry: asString(body.industry),
      business_description: asString(body.business_description),
      pages_needed: pagesNeeded,
      preferred_style: asString(body.preferred_style),
      inspiration_websites: asString(body.inspiration_websites),
      primary_goal: asString(body.primary_goal),
      services_to_highlight: asString(body.services_to_highlight),
      target_customers: asString(body.target_customers),
      logo_brand_colors_available: optionalBoolean(body.logo_brand_colors_available),
      additional_notes: asString(body.additional_notes),
    };

    const missing = requireFields({
      name: normalized.name,
      email: normalized.email,
      business_name: normalized.business_name,
      business_description: normalized.business_description,
      primary_goal: normalized.primary_goal,
    });
    if (missing.length > 0 || !normalized.email.includes("@")) {
      return json({ ok: false, error: "validation_failed", missing }, 400, cors);
    }
    if (currentWebsiteUrl && !normalizedDomain) {
      return json({ ok: false, error: "current_website_url_invalid", message: "Please enter a valid website URL." }, 400, cors);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("WSS preview request storage missing Supabase service configuration");
      return json({ ok: false, error: "storage_not_configured" }, 502, cors);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const submission = {
      ...normalized,
      labels: {
        name: "Name",
        email: "Email",
        phone: "Phone",
        business_name: "Business name",
        current_website_url: "Current website URL",
        normalized_domain: "Normalized domain",
        industry: "Business type / industry",
        business_description: "What the business does",
        pages_needed: "Pages needed",
        preferred_style: "Preferred style",
        inspiration_websites: "Competitor or inspiration websites",
        primary_goal: "Primary goal",
        services_to_highlight: "Services/products to highlight",
        target_customers: "Target customers",
        logo_brand_colors_available: "Logo/brand colors available",
        additional_notes: "Anything else we should know",
      },
    };

    if (normalizedDomain) {
      const { data: existing, error: existingError } = await supabase
        .from("website_preview_requests")
        .select("id,status,submitted_at,business_name")
        .eq("normalized_domain", normalizedDomain)
        .neq("status", "closed")
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        console.error(`WSS preview request duplicate lookup failed: ${existingError.message}`);
        return json({ ok: false, error: "duplicate_lookup_failed" }, 502, cors);
      }

      if (existing?.id) {
        return json(
          {
            ok: false,
            error: "duplicate_preview_request",
            message:
              "We already have an active free preview request for that website. We’ll review the existing request and follow up from there.",
            existingRequestId: existing.id,
            status: existing.status,
          },
          409,
          cors,
        );
      }
    }

    const { data, error } = await supabase
      .from("website_preview_requests")
      .insert({
        ...normalized,
        phone: normalized.phone || null,
        current_website_url: normalized.current_website_url || null,
        normalized_domain: normalized.normalized_domain || null,
        industry: normalized.industry || null,
        preferred_style: normalized.preferred_style || null,
        inspiration_websites: normalized.inspiration_websites || null,
        services_to_highlight: normalized.services_to_highlight || null,
        target_customers: normalized.target_customers || null,
        additional_notes: normalized.additional_notes || null,
        submission,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      if (error?.code === "23505" && normalizedDomain) {
        return json(
          {
            ok: false,
            error: "duplicate_preview_request",
            message:
              "We already have an active free preview request for that website. We’ll review the existing request and follow up from there.",
          },
          409,
          cors,
        );
      }
      console.error(`WSS preview request storage failed: ${error?.message ?? "missing_id"}`);
      return json({ ok: false, error: "storage_failed" }, 502, cors);
    }

    const requestId = String(data.id);
    const delivery = await sendWssEmail({
      to: internalNotificationTo(),
      alias: "wss-internal-free-preview-request",
      replyTo: normalized.email,
      variables: {
        REQUEST_ID: requestId,
        CUSTOMER_NAME: normalized.name,
        CUSTOMER_EMAIL: normalized.email,
        CUSTOMER_PHONE: normalized.phone || "Not provided",
        BUSINESS_NAME: normalized.business_name,
        CURRENT_WEBSITE_URL: normalized.current_website_url || "Not provided",
        NORMALIZED_DOMAIN: normalized.normalized_domain || "Not provided",
        INDUSTRY: normalized.industry || "Not provided",
        BUSINESS_DESCRIPTION: normalized.business_description,
        PAGES_NEEDED: pagesNeeded.length ? pagesNeeded.join(", ") : "Not provided",
        PREFERRED_STYLE: normalized.preferred_style || "Not provided",
        INSPIRATION_WEBSITES: normalized.inspiration_websites || "Not provided",
        PRIMARY_GOAL: normalized.primary_goal,
        SERVICES_TO_HIGHLIGHT: normalized.services_to_highlight || "Not provided",
        TARGET_CUSTOMERS: normalized.target_customers || "Not provided",
        LOGO_BRAND_COLORS_AVAILABLE:
          normalized.logo_brand_colors_available === null
            ? "Not provided"
            : normalized.logo_brand_colors_available
              ? "Yes"
              : "No",
        ADDITIONAL_NOTES: normalized.additional_notes || "Not provided",
      },
    });

    await supabase
      .from("website_preview_requests")
      .update({
        notification_status: delivery.ok ? "sent" : "failed",
        notification_error: delivery.ok ? null : delivery.error ?? "unknown_error",
      })
      .eq("id", requestId);

    return json({ ok: true, id: requestId, status: STATUS, notificationStatus: delivery.ok ? "sent" : "failed" }, 200, cors);
  } catch (error) {
    console.error(`WSS preview request error: ${(error as Error).message}`);
    return json({ ok: false, error: "preview_request_failed" }, 502, cors);
  }
});
