export const WSS_INTERNAL_TO = "corristonconsulting@gmail.com";
export const WSS_REPLY_TO = "corristonconsulting@gmail.com";
export const WSS_SITE_URL = "https://www.websitesupportstudio.com";
export const WSS_APP_URL = "https://app.websitesupportstudio.com";

type TemplateAudience = "customer" | "internal";

export type WssTemplateAlias =
  | "wss-customer-welcome"
  | "wss-customer-founder-purchase-confirmation"
  | "wss-customer-website-build-intake-received"
  | "wss-customer-request-received"
  | "wss-customer-request-updated"
  | "wss-customer-request-completed"
  | "wss-customer-website-launched"
  | "wss-customer-payment-received"
  | "wss-internal-founder-purchase"
  | "wss-internal-contact-submission"
  | "wss-internal-free-preview-request"
  | "wss-internal-customer-signup"
  | "wss-internal-customer-request"
  | "wss-internal-customer-reply"
  | "wss-internal-payment-failed"
  | "wss-internal-subscription-canceled";

interface TemplateDefinition {
  alias: WssTemplateAlias;
  name: string;
  subject: string;
  audience: TemplateAudience;
  ctaLabel?: string;
  ctaUrl?: string;
  intro: string;
  body: string[];
}

export interface WssEmailPayload {
  to: string | string[];
  alias: WssTemplateAlias;
  variables?: Record<string, string | number | null | undefined>;
  subject?: string;
  replyTo?: string;
}

export const WSS_TEMPLATES: Record<WssTemplateAlias, TemplateDefinition> = {
  "wss-customer-welcome": {
    alias: "wss-customer-welcome",
    name: "Welcome to Website Support Studio",
    subject: "Welcome to Website Support Studio",
    audience: "customer",
    ctaLabel: "Open your workspace",
    ctaUrl: WSS_APP_URL,
    intro: "Welcome to Website Support Studio, {{{CUSTOMER_NAME}}}.",
    body: [
      "Your WSS workspace is ready for website requests, launch details, and support updates.",
      "You own your accounts. We request access only where needed, and ownership stays with you.",
    ],
  },
  "wss-customer-founder-purchase-confirmation": {
    alias: "wss-customer-founder-purchase-confirmation",
    name: "Founder Website Package purchase confirmation",
    subject: "Founder Website Package confirmed",
    audience: "customer",
    ctaLabel: "Start website intake",
    ctaUrl: `${WSS_SITE_URL}/contact?source=founder-package-paid`,
    intro: "Your Founder Website Package purchase is confirmed.",
    body: [
      "Thank you for choosing Website Support Studio. The next step is collecting the website details we need to build and launch cleanly.",
      "Gary will review your intake and follow up from corristonconsulting@gmail.com.",
    ],
  },
  "wss-customer-website-build-intake-received": {
    alias: "wss-customer-website-build-intake-received",
    name: "Website build intake received",
    subject: "We received your website build intake",
    audience: "customer",
    ctaLabel: "Visit Website Support Studio",
    ctaUrl: WSS_SITE_URL,
    intro: "We received your website build intake.",
    body: [
      "Gary will review the details and reply with the next practical step.",
      "If anything changes, reply to this email and we will keep the project notes current.",
    ],
  },
  "wss-customer-request-received": {
    alias: "wss-customer-request-received",
    name: "Request received",
    subject: "Request received: {{{REQUEST_TITLE}}}",
    audience: "customer",
    ctaLabel: "Open your request",
    ctaUrl: WSS_APP_URL,
    intro: "We received your request: {{{REQUEST_TITLE}}}.",
    body: [
      "It is now in the Website Support Studio queue for review.",
      "You can keep adding context in your workspace. We will respond when the next action is ready.",
    ],
  },
  "wss-customer-request-updated": {
    alias: "wss-customer-request-updated",
    name: "Request updated",
    subject: "Request updated: {{{REQUEST_TITLE}}}",
    audience: "customer",
    ctaLabel: "Review the update",
    ctaUrl: WSS_APP_URL,
    intro: "Your request was updated: {{{REQUEST_TITLE}}}.",
    body: ["Open your workspace to review the latest status and any notes from WSS."],
  },
  "wss-customer-request-completed": {
    alias: "wss-customer-request-completed",
    name: "Request completed",
    subject: "Request completed: {{{REQUEST_TITLE}}}",
    audience: "customer",
    ctaLabel: "View request",
    ctaUrl: WSS_APP_URL,
    intro: "Your request is complete: {{{REQUEST_TITLE}}}.",
    body: ["If anything looks off, reply with the details and we will review it."],
  },
  "wss-customer-website-launched": {
    alias: "wss-customer-website-launched",
    name: "Website launched",
    subject: "Your website is launched",
    audience: "customer",
    ctaLabel: "View your site",
    ctaUrl: WSS_SITE_URL,
    intro: "Your website is launched.",
    body: [
      "Congratulations. Website Support Studio will keep the next 30 days focused on launch support and any practical cleanup.",
      "You own the accounts connected to your website, analytics, and business profiles.",
    ],
  },
  "wss-customer-payment-received": {
    alias: "wss-customer-payment-received",
    name: "Payment received",
    subject: "Payment received",
    audience: "customer",
    ctaLabel: "Open Website Support Studio",
    ctaUrl: WSS_APP_URL,
    intro: "Payment received. Thank you.",
    body: ["Your Website Support Studio account remains active and ready for website requests."],
  },
  "wss-internal-founder-purchase": {
    alias: "wss-internal-founder-purchase",
    name: "New Founder Website Package purchase",
    subject: "WSS: New Founder Website Package purchase",
    audience: "internal",
    ctaLabel: "Open Stripe",
    ctaUrl: "https://dashboard.stripe.com/payments",
    intro: "New Founder Website Package purchase.",
    body: ["Buyer: {{{CUSTOMER_EMAIL}}}", "Amount: {{{AMOUNT}}}", "Stripe session: {{{STRIPE_SESSION_ID}}}"],
  },
  "wss-internal-contact-submission": {
    alias: "wss-internal-contact-submission",
    name: "New contact form submission",
    subject: "WSS: New contact form submission",
    audience: "internal",
    ctaLabel: "Reply to contact",
    ctaUrl: "mailto:{{{CUSTOMER_EMAIL}}}",
    intro: "New Website Support Studio contact form submission.",
    body: ["Name: {{{CUSTOMER_NAME}}}", "Email: {{{CUSTOMER_EMAIL}}}", "Message: {{{MESSAGE}}}"],
  },
  "wss-internal-free-preview-request": {
    alias: "wss-internal-free-preview-request",
    name: "New free website preview request",
    subject: "WSS: New free website preview request",
    audience: "internal",
    ctaLabel: "Open preview request",
    ctaUrl: WSS_APP_URL,
    intro: "New free website preview request.",
    body: [
      "Request ID: {{{REQUEST_ID}}}",
      "Business: {{{BUSINESS_NAME}}}",
      "Contact: {{{CUSTOMER_NAME}}} — {{{CUSTOMER_EMAIL}}} — {{{CUSTOMER_PHONE}}}",
      "Current website: {{{CURRENT_WEBSITE_URL}}}",
      "Normalized domain: {{{NORMALIZED_DOMAIN}}}",
      "Primary goal: {{{PRIMARY_GOAL}}}",
      "Industry: {{{INDUSTRY}}}",
      "Pages needed: {{{PAGES_NEEDED}}}",
      "Preferred style: {{{PREFERRED_STYLE}}}",
      "Services/products: {{{SERVICES_TO_HIGHLIGHT}}}",
      "Target customers: {{{TARGET_CUSTOMERS}}}",
      "Inspiration websites: {{{INSPIRATION_WEBSITES}}}",
      "Logo/brand colors available: {{{LOGO_BRAND_COLORS_AVAILABLE}}}",
      "Business description: {{{BUSINESS_DESCRIPTION}}}",
      "Additional notes: {{{ADDITIONAL_NOTES}}}",
    ],
  },
  "wss-internal-customer-signup": {
    alias: "wss-internal-customer-signup",
    name: "New customer signup",
    subject: "WSS: New customer signup/onboarding",
    audience: "internal",
    ctaLabel: "Open app",
    ctaUrl: WSS_APP_URL,
    intro: "A customer account or onboarding event completed.",
    body: ["Email: {{{CUSTOMER_EMAIL}}}", "Company: {{{COMPANY_NAME}}}", "Website: {{{WEBSITE_URL}}}", "Status: {{{STATUS}}}"],
  },
  "wss-internal-customer-request": {
    alias: "wss-internal-customer-request",
    name: "New customer request",
    subject: "WSS: New customer request",
    audience: "internal",
    ctaLabel: "Open operator console",
    ctaUrl: WSS_APP_URL,
    intro: "A customer submitted a new request.",
    body: ["Request: {{{REQUEST_TITLE}}}", "Ticket: {{{TICKET_NUMBER}}}", "Site: {{{SITE_NAME}}}", "Priority: {{{PRIORITY}}}"],
  },
  "wss-internal-customer-reply": {
    alias: "wss-internal-customer-reply",
    name: "Customer reply received",
    subject: "WSS: Customer reply received",
    audience: "internal",
    ctaLabel: "Open operator console",
    ctaUrl: WSS_APP_URL,
    intro: "A customer reply was received.",
    body: ["Customer: {{{CUSTOMER_EMAIL}}}", "Request: {{{REQUEST_TITLE}}}", "Message: {{{MESSAGE}}}"],
  },
  "wss-internal-payment-failed": {
    alias: "wss-internal-payment-failed",
    name: "Payment failed",
    subject: "WSS: Payment failed",
    audience: "internal",
    ctaLabel: "Open Stripe",
    ctaUrl: "https://dashboard.stripe.com/invoices",
    intro: "A Website Support Studio payment failed.",
    body: ["Customer: {{{CUSTOMER_EMAIL}}}", "Subscription: {{{STRIPE_SUBSCRIPTION_ID}}}", "Invoice: {{{STRIPE_INVOICE_ID}}}"],
  },
  "wss-internal-subscription-canceled": {
    alias: "wss-internal-subscription-canceled",
    name: "Subscription canceled",
    subject: "WSS: Subscription canceled",
    audience: "internal",
    ctaLabel: "Open Stripe",
    ctaUrl: "https://dashboard.stripe.com/subscriptions",
    intro: "A Website Support Studio subscription was canceled.",
    body: ["Customer: {{{CUSTOMER_EMAIL}}}", "Subscription: {{{STRIPE_SUBSCRIPTION_ID}}}", "Status: {{{STATUS}}}"],
  },
};

function env(name: string, fallback = ""): string {
  return Deno.env.get(name)?.trim() || fallback;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fill(input: string, variables: Record<string, string | number | null | undefined>): string {
  return input.replace(/\{\{\{\s*([A-Z0-9_]+)\s*\}\}\}/g, (_, key: string) => escapeHtml(variables[key] ?? ""));
}

export function renderWssTemplate(alias: WssTemplateAlias, variables: Record<string, string | number | null | undefined> = {}) {
  const template = WSS_TEMPLATES[alias];
  const siteUrl = env("WSS_SITE_URL", WSS_SITE_URL);
  const ctaUrl = fill(String(variables.CTA_URL ?? template.ctaUrl ?? siteUrl), variables);
  const ctaLabel = fill(String(variables.CTA_LABEL ?? template.ctaLabel ?? "Visit Website Support Studio"), variables);
  const body = template.body.map((line) => fill(line, variables));
  const intro = fill(template.intro, variables);
  const subject = fill(template.subject, variables);
  const details = body.map((line) => `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">${line}</p>`).join("");
  const text = [
    intro,
    "",
    ...body.map((line) => line.replace(/<[^>]*>/g, "")),
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    "Website Support Studio",
    siteUrl,
    `Reply/contact: ${env("WSS_EMAIL_REPLY_TO", WSS_REPLY_TO)}`,
  ].join("\n");
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0b1220;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          <tr><td style="padding:28px 28px 18px;">
            <div style="display:inline-block;width:32px;height:32px;vertical-align:middle;margin-right:10px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;width:32px;height:32px;">
                <span style="display:block;background:#f4b142;border-radius:3px;"></span><span style="display:block;background:#35dcea;border-radius:3px;"></span>
                <span style="display:block;background:#a83489;border-radius:3px;"></span><span style="display:block;background:#0443fb;border-radius:3px;"></span>
              </div>
            </div>
            <span style="font:700 18px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0;color:#0b1220;">website<span style="color:#0443fb;">_</span>support<span style="color:#0443fb;">_</span>studio</span>
          </td></tr>
          <tr><td style="padding:0 28px 8px;"><div style="height:4px;background:linear-gradient(90deg,#f4b142 0 25%,#35dcea 25% 50%,#a83489 50% 75%,#0443fb 75% 100%);border-radius:999px;"></div></td></tr>
          <tr><td style="padding:22px 28px 10px;">
            <h1 style="margin:0 0 14px;color:#0b1220;font-size:24px;line-height:1.25;">${intro}</h1>
            ${details}
            <p style="margin:24px 0 4px;"><a href="${ctaUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:7px;">${ctaLabel}</a></p>
          </td></tr>
          <tr><td style="padding:20px 28px 28px;color:#64748b;font-size:13px;line-height:1.5;border-top:1px solid #e2e8f0;">
            Website Support Studio<br>
            <a href="${siteUrl}" style="color:#0443fb;">websitesupportstudio.com</a><br>
            Reply/contact: <a href="mailto:${env("WSS_EMAIL_REPLY_TO", WSS_REPLY_TO)}" style="color:#0443fb;">${env("WSS_EMAIL_REPLY_TO", WSS_REPLY_TO)}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, html, text };
}

export async function sendWssEmail(payload: WssEmailPayload): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) {
    console.warn(`WSS email skipped; missing RESEND_API_KEY for ${payload.alias}`);
    return { ok: false, skipped: true, error: "missing_resend_api_key" };
  }

  const variables = payload.variables ?? {};
  const rendered = renderWssTemplate(payload.alias, variables);
  const templateId = env(`RESEND_TEMPLATE_${payload.alias.toUpperCase().replace(/-/g, "_")}`);
  const body: Record<string, unknown> = {
    from: env("WSS_EMAIL_FROM", "Website Support Studio <notifications@websitesupportstudio.com>"),
    to: payload.to,
    subject: payload.subject ?? rendered.subject,
    reply_to: payload.replyTo ?? env("WSS_EMAIL_REPLY_TO", WSS_REPLY_TO),
  };
  if (templateId) {
    body.template = { id: templateId, variables };
  } else {
    body.html = rendered.html;
    body.text = rendered.text;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    console.error(`WSS email failed for ${payload.alias}: ${error}`);
    return { ok: false, error };
  }
  return { ok: true };
}

export function internalNotificationTo(): string {
  return env("WSS_INTERNAL_NOTIFICATION_TO", WSS_INTERNAL_TO);
}
