/**
 * Single source of truth for every FAQ on the site.
 *
 * The /faqs page renders all groups and is the only page that emits FAQPage
 * structured data. Other pages link to it via "see_all_questions →" rather than
 * duplicating questions (which would split FAQ rich-result signals across pages).
 */
export interface Faq {
  q: string;
  a: string;
}

export interface FaqGroup {
  /** snake_case marker label, e.g. "_services" */
  marker: string;
  items: Faq[];
}

export const FOUNDER_WEBSITE_FAQS: Faq[] = [
  {
    q: "What happens right after I pay?",
    a: "You get a Stripe receipt and one next step: a short intake form about your business. The moment you finish it, your build starts. Pay, tell us about your business, we build, you review, and you're live.",
  },
  {
    q: "What exactly do I get for $500?",
    a: "A complete five-page website built for your business: mobile optimization, contact forms wired to your inbox, click-to-call, basic SEO setup, hosting, SSL, launch, and 30 days of post-launch support.",
  },
  {
    q: "Why is it only $500?",
    a: "Because we're not starting from scratch. We've already designed and tested the websites we adapt to your business, so the build takes days, not months. The $500 build is how we earn the chance to keep running your site month to month afterward.",
  },
  {
    q: "What if I don't have a logo or photos?",
    a: "No problem, and no delay. No logo means a clean professional text treatment in your colors. No photos means licensed photography appropriate to your trade. You can swap in real photos later.",
  },
  {
    q: "How long does the website take?",
    a: "Your build starts when the intake form is complete, because we cannot build before we know your business. From there, we build in days, send a preview, and launch after review.",
  },
  {
    q: "What do I own?",
    a: "You own the website, domain, content, and connected accounts. Google Analytics, Search Console, and other accounts are set up under your accounts, and you can revoke our access whenever you like.",
  },
  {
    q: "What happens after launch?",
    a: "You get 30 days of post-launch support included. After that, the Operations plan is optional: $199/month, locked in while your account remains active. Cancel anytime. The website is yours either way.",
  },
];

export const FAQ_GROUPS: FaqGroup[] = [
  {
    marker: "_general",
    items: [
      { q: "What is Website Support Studio?", a: "A managed website operations and support platform for organizations with revenue-critical websites. It consolidates website, marketing, and operations requests into a single desk with defined response workflows, operational visibility, and a mandatory human approval before any change goes live. It is operated by Corriston Consulting, LLC." },
      { q: "Who is this for?", a: "Organizations with revenue-critical websites — marketing, marketing-operations, digital, and IT teams who need website changes done reliably without staffing and supervising the work themselves. It is not built for hobby sites or one-off freelance tasks." },
      { q: "How is this different from an agency or adding headcount?", a: "Agencies rotate staff and can deprioritize accounts; internal teams are usually already overloaded. Website Support Studio provides an operator-led workflow inside a defined, auditable process — every request is visible, owned, tracked, reviewed, and recorded — without you having to staff and supervise the work." },
      { q: "Does it change our website automatically?", a: "No. Every customer-facing change passes through a mandatory human approval gate, and the platform records who approved each change and when." },
      { q: "Who owns my analytics and ad accounts?", a: "You do — always. Your Google Analytics, Search Console, Google Business Profile, Google Ads, and Meta Business Manager are created and owned under your own accounts. We provide setup instructions, assist with setup, connect integrations, and request access where needed — but ownership stays with you, and you can revoke our access at any time." },
    ],
  },
  {
    marker: "_services",
    items: [
      { q: "How do requests work?", a: "You submit a request from your account. It enters one desk, gets an owner and a status, moves through triage and drafting, passes a mandatory human approval gate, and is delivered and closed — with every step recorded." },
      { q: "How fast are responses?", a: "Requests are acknowledged on the next business day and prioritized by urgency. Urgent production issues are routed through an expedited path while still passing the approval gate." },
      { q: "What counts as a request?", a: "A single, scoped piece of work — a content edit, a form fix, a tracking repair, a CMS change. Larger initiatives like full redesigns or custom application builds are scoped as separate engagements." },
      { q: "Do you work with WordPress?", a: "Yes. WordPress content, page, and configuration changes are a core request type." },
      { q: "Do you work with Webflow?", a: "Yes. Webflow updates — content, pages, and CMS collections — are supported." },
      { q: "Do you work with custom sites?", a: "Yes, for content, configuration, and front-end changes. Deep custom application development is scoped as a separate engagement." },
      { q: "Do you make code changes?", a: "We make scoped front-end and configuration changes — markup, templates, tracking, and schema. Large feature builds and backend development are scoped separately." },
      { q: "Do you provide SEO support?", a: "Yes — on-page SEO updates, metadata, schema markup, and technical fixes. Full SEO strategy engagements are scoped separately." },
      { q: "Do you manage tracking and analytics?", a: "Yes. Tag and analytics verification, tracking repairs, and GA4 / Tag Manager configuration are common requests." },
      { q: "Can you help with forms and integrations?", a: "Yes — form fixes, field changes, and common integrations such as form-to-CRM or email. Complex custom integrations are scoped separately." },
      { q: "Is every change reviewed?", a: "Yes. No customer-facing change ships without a mandatory human approval, recorded with the approver and a timestamp." },
      { q: "Who approves changes?", a: "An authorized approver on the operations side signs off before anything goes live, and the approval is recorded in the request's audit trail." },
    ],
  },
  {
    marker: "_founder_website",
    items: FOUNDER_WEBSITE_FAQS,
  },
  {
    marker: "_pricing",
    items: [
      { q: "How much does a website cost?", a: "A complete professional website is a $500 one-time Founder Website Package: a mobile-optimized website with contact forms, basic SEO, and launch, plus 30 days of post-launch support. After launch, ongoing operations are optional — $199/month, locked in while your account remains active. Growth ($899/month, up to 5 websites) and custom Enterprise are also available." },
      { q: "What's included in the $500 website?", a: "A professional website, mobile optimization, contact forms, basic SEO setup, website launch, and 30 days of post-launch support." },
      { q: "What happens after launch?", a: "You get 30 days of post-launch support included. After that, the Operations plan keeps your site updated and monitored — $199/month, locked in while your account remains active. It is optional and you can cancel anytime." },
      { q: "How does founder pricing work?", a: "Founder customers who join now get ongoing Operations for $199/month after launch. That rate stays locked in for as long as the account remains active." },
      { q: "What is a Website Request?", a: "Website Requests measure the effort of each request on the Operations plan. Every plan includes a monthly allotment; a simple change uses fewer request credits, while more involved work uses more. Monthly Website Requests refresh each month and do not roll over." },
      { q: "What happens if I run out?", a: "In a busy month you can add a top-up — 50, 100, or 250 Website Requests — at any time from your account. Purchased top-up credits stay on your account until used, do roll over, and are used after your monthly credits run out. DNS assistance is available as a $100 one-time add-on." },
      { q: "How do I get started?", a: "Start with the Founder Website Package — contact us to kick off your $500 build. We build and launch your site, then set up optional ongoing operations. For Growth or Enterprise, contact us and we'll scope it." },
      { q: "Do you offer custom plans?", a: "Yes. Enterprise covers custom capacity, site coverage, onboarding, and commercial terms — contact us to scope it." },
    ],
  },
  {
    marker: "_about",
    items: [
      { q: "Who operates Website Support Studio?", a: "Website Support Studio is operated by Corriston Consulting, LLC, a Florida limited liability company based in Tampa. The platform grew out of the firm's own internal operating model for website support." },
      { q: "Why was Website Support Studio built?", a: "The same pattern appeared across client after client: capable teams, important websites, and no shared system for getting website work done reliably. Corriston Consulting built an internal operating model — single intake, defined workflow, mandatory approval, complete record — and productized it as Website Support Studio." },
    ],
  },
];

export const ALL_FAQS: Faq[] = FAQ_GROUPS.flatMap((g) => g.items);
