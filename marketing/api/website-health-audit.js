/* global console, process */

import { auditWebsite } from "../src/lib/websiteHealthAudit.mjs";
import { requestId, withTimeout } from "./_lib/http.js";
import { checkRateLimit } from "./_lib/rate-limit.js";

export default async function handler(request, response) {
  const id = requestId();

  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const body = typeof request.body === "object" ? request.body : JSON.parse(request.body || "{}");
    const rateLimit = checkRateLimit(request, response, {
      namespace: "website-health-audit",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      console.warn("[website-health-audit] rate limited", { requestId: id, retryAfter: rateLimit.retryAfter });
      return response.status(429).json({
        ok: false,
        error: "rate_limited",
        message: "Please wait a few minutes before running another website score.",
      });
    }

    const result = await withTimeout(auditWebsite(body.url, {
      pageSpeedApiKey: process.env.PAGESPEED_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY || "",
      placesApiKey: process.env.PLACES_API_KEY || "",
      company: body.company || body.business || body.business_name || "",
      city: body.city || "",
      state: body.state || "",
    }), 55000, "audit_timeout");
    return response.status(200).json({ ...result, request_id: id });
  } catch (error) {
    const status = ["missing_url", "invalid_url", "social_only"].includes(error?.message) ? 400 : 500;
    console.error("[website-health-audit] failed", {
      requestId: id,
      status,
      reason: error?.name === "TimeoutError" ? "provider_timeout" : "audit_failed",
      message: error?.message,
    });
    return response.status(status).json({
      ok: false,
      error: status === 400 ? "invalid_request" : "audit_failed",
      message: status === 400
        ? "Please enter a valid business website URL."
        : "The audit could not be completed right now. Please try again in a few minutes.",
      request_id: id,
    });
  }
}
