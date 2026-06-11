const API = "https://api.resend.com";
const FROM = process.env.WSS_EMAIL_FROM || "Website Support Studio <notifications@websitesupportstudio.com>";
const REPLY_TO = process.env.WSS_EMAIL_REPLY_TO || "corristonconsulting@gmail.com";
const SITE_URL = process.env.WSS_SITE_URL || "https://www.websitesupportstudio.com";
const APP_URL = process.env.WSS_APP_URL || "https://app.websitesupportstudio.com";

const templates = [
  ["wss-customer-welcome", "Welcome to Website Support Studio", "Welcome to Website Support Studio", "Welcome to Website Support Studio, {{{CUSTOMER_NAME}}}.", ["Your WSS workspace is ready for website requests, launch details, and support updates.", "You own your accounts. We request access only where needed, and ownership stays with you."], "Open your workspace", APP_URL],
  ["wss-customer-founder-purchase-confirmation", "Founder Website Package purchase confirmation", "Founder Website Package confirmed", "Your Founder Website Package purchase is confirmed.", ["Thank you for choosing Website Support Studio. The next step is collecting the website details we need to build and launch cleanly.", "Gary will review your intake and follow up from corristonconsulting@gmail.com."], "Start website intake", `${SITE_URL}/contact?source=founder-package-paid`],
  ["wss-customer-website-build-intake-received", "Website build intake received", "We received your website build intake", "We received your website build intake.", ["Gary will review the details and reply with the next practical step.", "If anything changes, reply to this email and we will keep the project notes current."], "Visit Website Support Studio", SITE_URL],
  ["wss-customer-request-received", "Request received", "Request received: {{{REQUEST_TITLE}}}", "We received your request: {{{REQUEST_TITLE}}}.", ["It is now in the Website Support Studio queue for review.", "You can keep adding context in your workspace. We will respond when the next action is ready."], "Open your request", APP_URL],
  ["wss-customer-request-updated", "Request updated", "Request updated: {{{REQUEST_TITLE}}}", "Your request was updated: {{{REQUEST_TITLE}}}.", ["Open your workspace to review the latest status and any notes from WSS."], "Review the update", APP_URL],
  ["wss-customer-request-completed", "Request completed", "Request completed: {{{REQUEST_TITLE}}}", "Your request is complete: {{{REQUEST_TITLE}}}.", ["If anything looks off, reply with the details and we will review it."], "View request", APP_URL],
  ["wss-customer-website-launched", "Website launched", "Your website is launched", "Your website is launched.", ["Congratulations. Website Support Studio will keep the next 30 days focused on launch support and any practical cleanup.", "You own the accounts connected to your website, analytics, and business profiles."], "View your site", SITE_URL],
  ["wss-customer-payment-received", "Payment received", "Payment received", "Payment received. Thank you.", ["Your Website Support Studio account remains active and ready for website requests."], "Open Website Support Studio", APP_URL],
  ["wss-internal-founder-purchase", "New Founder Website Package purchase", "WSS: New Founder Website Package purchase", "New Founder Website Package purchase.", ["Buyer: {{{CUSTOMER_EMAIL}}}", "Amount: {{{AMOUNT}}}", "Stripe session: {{{STRIPE_SESSION_ID}}}"], "Open Stripe", "https://dashboard.stripe.com/payments"],
  ["wss-internal-contact-submission", "New contact form submission", "WSS: New contact form submission", "New Website Support Studio contact form submission.", ["Name: {{{CUSTOMER_NAME}}}", "Email: {{{CUSTOMER_EMAIL}}}", "Message: {{{MESSAGE}}}"], "Reply to contact", "mailto:{{{CUSTOMER_EMAIL}}}"],
  ["wss-internal-customer-signup", "New customer signup", "WSS: New customer signup/onboarding", "A customer account or onboarding event completed.", ["Email: {{{CUSTOMER_EMAIL}}}", "Company: {{{COMPANY_NAME}}}", "Website: {{{WEBSITE_URL}}}", "Status: {{{STATUS}}}"], "Open app", APP_URL],
  ["wss-internal-customer-request", "New customer request", "WSS: New customer request", "A customer submitted a new request.", ["Request: {{{REQUEST_TITLE}}}", "Ticket: {{{TICKET_NUMBER}}}", "Site: {{{SITE_NAME}}}", "Priority: {{{PRIORITY}}}"], "Open operator console", APP_URL],
  ["wss-internal-customer-reply", "Customer reply received", "WSS: Customer reply received", "A customer reply was received.", ["Customer: {{{CUSTOMER_EMAIL}}}", "Request: {{{REQUEST_TITLE}}}", "Message: {{{MESSAGE}}}"], "Open operator console", APP_URL],
  ["wss-internal-payment-failed", "Payment failed", "WSS: Payment failed", "A Website Support Studio payment failed.", ["Customer: {{{CUSTOMER_EMAIL}}}", "Subscription: {{{STRIPE_SUBSCRIPTION_ID}}}", "Invoice: {{{STRIPE_INVOICE_ID}}}"], "Open Stripe", "https://dashboard.stripe.com/invoices"],
  ["wss-internal-subscription-canceled", "Subscription canceled", "WSS: Subscription canceled", "A Website Support Studio subscription was canceled.", ["Customer: {{{CUSTOMER_EMAIL}}}", "Subscription: {{{STRIPE_SUBSCRIPTION_ID}}}", "Status: {{{STATUS}}}"], "Open Stripe", "https://dashboard.stripe.com/subscriptions"],
];

function variablesFor(parts) {
  const keys = new Set();
  for (const part of parts) {
    for (const match of String(part).matchAll(/\{\{\{\s*([A-Z0-9_]+)\s*\}\}\}/g)) keys.add(match[1]);
  }
  return Array.from(keys).map((key) => ({ key, type: "string", fallback_value: "" }));
}

function html([, name, , intro, body, ctaLabel, ctaUrl]) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0b1220;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;"><tr><td style="padding:28px 28px 18px;"><span style="font:700 18px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#0b1220;">website<span style="color:#0443fb;">_</span>support<span style="color:#0443fb;">_</span>studio</span></td></tr><tr><td style="padding:0 28px 8px;"><div style="height:4px;background:linear-gradient(90deg,#f4b142 0 25%,#35dcea 25% 50%,#a83489 50% 75%,#0443fb 75% 100%);border-radius:999px;"></div></td></tr><tr><td style="padding:22px 28px 10px;"><h1 style="margin:0 0 14px;color:#0b1220;font-size:24px;line-height:1.25;">${intro}</h1>${body.map((line) => `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.6;">${line}</p>`).join("")}<p style="margin:24px 0 4px;"><a href="${ctaUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:7px;">${ctaLabel}</a></p></td></tr><tr><td style="padding:20px 28px 28px;color:#64748b;font-size:13px;line-height:1.5;border-top:1px solid #e2e8f0;">Website Support Studio<br><a href="${SITE_URL}" style="color:#0443fb;">websitesupportstudio.com</a><br>Reply/contact: <a href="mailto:${REPLY_TO}" style="color:#0443fb;">${REPLY_TO}</a></td></tr></table></td></tr></table></body></html>`;
}

function text([, name, , intro, body, ctaLabel, ctaUrl]) {
  return [name, "", intro, "", ...body, "", `${ctaLabel}: ${ctaUrl}`, "", "Website Support Studio", SITE_URL, `Reply/contact: ${REPLY_TO}`].join("\n");
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${options.method || "GET"} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

if (!process.env.RESEND_API_KEY) {
  throw new Error("Set RESEND_API_KEY before running this script.");
}

const listed = await request("/templates");
const existing = new Map((listed.data || listed).map((template) => [template.alias || template.name, template]));

for (const template of templates) {
  const [alias, name, subject] = template;
  const payload = {
    alias,
    name,
    from: FROM,
    reply_to: REPLY_TO,
    subject,
    html: html(template),
    text: text(template),
    variables: variablesFor(template),
  };
  const found = existing.get(alias);
  const result = found
    ? await request(`/templates/${found.id || alias}`, { method: "PATCH", body: JSON.stringify(payload) })
    : await request("/templates", { method: "POST", body: JSON.stringify(payload) });
  const id = result.id || found?.id || alias;
  await request(`/templates/${id}/publish`, { method: "POST", body: JSON.stringify({}) });
  console.log(`${found ? "updated" : "created"} and published ${alias}`);
}
