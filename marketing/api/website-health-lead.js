/* global console, process */

import { fetchJsonWithTimeout, requestId, timeoutErrorMessage } from "./_lib/http.js";
import { checkRateLimit } from "./_lib/rate-limit.js";

const DEFAULT_PREVIEW_WEBHOOK = "https://sfhllezyyylduxvwdxki.supabase.co/functions/v1/website-preview-request";

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default async function handler(request, response) {
  const id = requestId();

  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const body = typeof request.body === "object" ? request.body : JSON.parse(request.body || "{}");
    const firstName = String(body.first_name || "").trim();
    const business = String(body.business || "").trim();
    const email = String(body.email || "").trim();
    const audit = body.audit || {};

    if (!firstName || !business || !validEmail(email)) {
      return response.status(400).json({ ok: false, error: "missing_required_fields" });
    }

    const rateLimit = checkRateLimit(request, response, {
      namespace: "website-health-lead",
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      console.warn("[website-health-lead] rate limited", { requestId: id, retryAfter: rateLimit.retryAfter });
      return response.status(429).json({
        ok: false,
        error: "rate_limited",
        message: "Please wait a few minutes before sending another report request.",
      });
    }

    const webhookUrl =
      process.env.WSS_WEBSITE_SCORE_WEBHOOK_URL ||
      process.env.APOLLO_WEBSITE_SCORE_WEBHOOK_URL ||
      process.env.PUBLIC_WSS_WEBSITE_PREVIEW_REQUEST_URL ||
      DEFAULT_PREVIEW_WEBHOOK;

    const payload = {
      page_source: "website_health_score",
      source_url: body.source_url || "",
      referrer: body.referrer || "",
      user_agent: body.user_agent || "",
      first_name: firstName,
      name: firstName,
      business_name: business,
      business,
      email,
      company_website: audit.finalUrl || audit.requestedUrl || body.website_url || "",
      current_website_url: audit.finalUrl || audit.requestedUrl || body.website_url || "",
      website_url: audit.finalUrl || audit.requestedUrl || body.website_url || "",
      health_score: audit.score,
      findability_score: audit.findability_score,
      tier: audit.tier,
      routing_tag: audit.routing_tag,
      category_breakdown: audit.categories || [],
      top_issues: audit.topIssues || [],
      top_3_issues: audit.top_3_issues || "",
      findability_top_issues: audit.findability_top_issues || "",
      findability: audit.findability || {},
      quick_checks: audit.checks || {},
      pagespeed: audit.pageSpeed || {},
      audit_generated_at: audit.generatedAt || new Date().toISOString(),
    };

    const { response: webhookResponse, body: webhookBody } = await fetchJsonWithTimeout(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }, 12000);

    if (!webhookResponse.ok || webhookBody.ok === false) {
      console.error("[website-health-lead] webhook rejected", {
        requestId: id,
        status: webhookResponse.status,
        providerError: webhookBody?.error,
      });
      return response.status(502).json({
        ok: false,
        error: "submission_unavailable",
        message: "The report request could not be submitted right now. Please try again in a few minutes.",
      });
    }

    return response.status(200).json({ ok: true, request_id: id });
  } catch (error) {
    console.error("[website-health-lead] failed", {
      requestId: id,
      reason: timeoutErrorMessage(error),
      message: error?.message,
    });
    return response.status(500).json({
      ok: false,
      error: "lead_capture_failed",
      message: "The report request could not be submitted right now. Please try again in a few minutes.",
    });
  }
}
