/**
 * Single source of truth for Website Support Studio's public site.
 *
 * Every fact below is sourced from the Corriston Consulting repository
 * (the owning entity) and the WSS brand system. No values are placeholders.
 * If a fact is intentionally absent (e.g. public phone number), it is omitted
 * rather than invented.
 */

// ---- Canonical site ---------------------------------------------------------
export const SITE_URL = "https://websitesupportstudio.com";
export const SITE_NAME = "Website Support Studio";
export const SITE_TAGLINE = "Professional websites built, launched, and managed — you own everything";

// ---- Owning legal entity (Corriston Consulting, LLC) ------------------------
export const ORG = {
  legalName: "Corriston Consulting, LLC",
  shortName: "Corriston Consulting",
  jurisdiction: "State of Florida, United States",
  founder: "Gary Corriston",
  address: {
    locality: "Tampa",
    region: "FL",
    country: "US",
    countryName: "United States",
  },
  parentSiteUrl: "https://www.corristonconsulting.com",
} as const;

// ---- Public contact channels ------------------------------------------------
export const CONTACT = {
  email: "corristonconsulting@gmail.com",
  bookingUrl: "https://calendar.app.google/bXXqePJJqhLinTgX8",
  linkedin: "https://www.linkedin.com/company/corriston-consulting/",
} as const;

// ---- Operator console (authenticated app) -----------------------------------
export const APP_URL = "https://app.websitesupportstudio.com";
// Primary conversion destination for the public "Join Now" CTA.
export const JOIN_PATH = "/pricing";

// ---- Billing / checkout (Stage A) -------------------------------------------
// create-checkout-session Edge Function URL (public). Set at build via env:
//   PUBLIC_WSS_CHECKOUT_URL=https://<project-ref>.supabase.co/functions/v1/create-checkout-session
export const CHECKOUT_URL =
  (import.meta as { env?: Record<string, string> }).env?.PUBLIC_WSS_CHECKOUT_URL ?? "";

export const CONTACT_NOTIFY_URL =
  (import.meta as { env?: Record<string, string> }).env?.PUBLIC_WSS_CONTACT_NOTIFY_URL?.trim() ||
  "https://sfhllezyyylduxvwdxki.supabase.co/functions/v1/contact-notification";

// Manual founder pricing controls.
// Replace founderSpotsLeft with a live source later when the counter is connected.
export const FOUNDER_PRICING = {
  active: true,
  totalSpots: 25,
  spotsLeft: 17,
  discountPercent: 50,
  discountMonths: 6,
  appliesTo: ["operations"],
} as const;

// ---- Founder Website Package (primary offer) --------------------------------
// $500 one-time website build. Stripe Payment Link is wired to a live one-time
// price ($500.00 USD). The CTA opens the Stripe-hosted checkout page directly;
// after a successful payment, Stripe redirects the customer to
// /contact?source=founder-package-paid so we can collect intake details
// using the existing contact form.
export const WEBSITE_PACKAGE = {
  name: "Founder Website Package",
  price: "$500",
  cadence: "one-time",
  tagline: "A professional website, built and launched for you.",
  includes: [
    "Professional website",
    "Mobile optimization",
    "Contact forms",
    "Basic SEO setup",
    "Website launch",
    "30 days post-launch support",
  ],
  afterLaunch: {
    founder: "$199/month for months 2–7",
    standard: "$399/month from month 8",
  },
  ctaLabel: "_build_my_website",
  ctaHref: "https://buy.stripe.com/5kQ14f8gycXJ4ea4Tt9Zm08",
} as const;

// ---- Founder Website templates (the $500 package, made tangible) ------------
// Three launch templates for local service businesses. Preview images are
// committed representations; Ridgeline Roofing now points to a complete
// fictional model home at /templates/ridgeline-roofing. The
// "Start With This Template" CTA reuses the existing Founder Website Package
// Stripe Payment Link unchanged.
export const FOUNDER_WEBSITE_INCLUDES = [
  "5 pages",
  "Mobile optimization",
  "Contact forms",
  "Click-to-call",
  "Service area pages",
  "Basic SEO",
  "Hosting",
  "SSL",
  "Launch",
  "30 days support",
] as const;

export const TEMPLATES = [
  {
    key: "ridgeline-roofing",
    name: "Ridgeline Roofing",
    industry: "Roofing",
    pages: ["Home", "Services", "Service Areas", "About", "Contact"],
    demoRoute: "/templates/ridgeline-roofing",
    features: [
      "Free estimate request form",
      "Storm damage callout section",
      "Project gallery layout",
      "Click-to-call header and footer",
      "Service area pages",
    ],
    images: {
      desktop: "/templates/ridgeline-roofing-desktop.svg",
      mobile: "/templates/ridgeline-roofing-mobile.svg",
    },
  },
  {
    key: "airflow-hvac",
    name: "Airflow HVAC",
    industry: "Heating & Cooling",
    pages: ["Home", "Services", "Service Areas", "About", "Contact"],
    demoRoute: undefined,
    features: [
      "Service request form",
      "Emergency service callout section",
      "Seasonal maintenance layout",
      "Click-to-call header and footer",
      "Service area pages",
    ],
    images: {
      desktop: "/templates/airflow-hvac-desktop.svg",
      mobile: "/templates/airflow-hvac-mobile.svg",
    },
  },
  {
    key: "mainline-plumbing",
    name: "Mainline Plumbing",
    industry: "Plumbing",
    pages: ["Home", "Services", "Service Areas", "About", "Contact"],
    demoRoute: undefined,
    features: [
      "Estimate request form",
      "Emergency plumbing callout section",
      "Service list layout",
      "Click-to-call header and footer",
      "Service area pages",
    ],
    images: {
      desktop: "/templates/mainline-plumbing-desktop.svg",
      mobile: "/templates/mainline-plumbing-mobile.svg",
    },
  },
] as const;

// What we adapt to each business inside the $500 package, versus what is
// quoted separately as custom work. Shared across all three templates.
export const TEMPLATE_CUSTOMIZABLE = [
  "Your business name and logo",
  "Colors and fonts to match your brand",
  "All text and page copy",
  "Your photos (or licensed stock photos)",
  "Your list of services",
  "Your service areas",
  "Contact details, phone number, and business hours",
] as const;

export const TEMPLATE_CUSTOM_WORK = [
  "Online booking or scheduling systems",
  "E-commerce and online payments",
  "Customer logins or portals",
  "Pages beyond the included five",
  "Third-party software integrations",
  "Custom features and functionality",
] as const;

// ---- Account ownership (the customer owns their own accounts) ----------------
export const ACCOUNT_OWNERSHIP = {
  headline: "You own your accounts — always.",
  accounts: [
    "Google Analytics",
    "Search Console",
    "Google Business Profile",
    "Google Ads",
    "Meta Business Manager",
  ],
  detail:
    "We set them up under your accounts, assist with setup, connect integrations, and request access where needed. Ownership stays with you, and you can revoke access at any time.",
} as const;

export const PLANS = [
  {
    key: "operations",
    name: "Operations",
    price: "$399",
    founderPrice: "$199.50",
    founderDiscountLabel: "50% off",
    founderAvailability: "17 founder spots remaining",
    founderPlanKey: "operations_founder",
    cadence: "/month",
    sites: "1 website",
    cu: "50 Capacity Units / month",
    blurb: "Managed website operations for a single revenue-critical site.",
    founderBlurb: "Same Operations plan at founder pricing for the first 6 months, then standard pricing after the founder period ends.",
    points: [
      "Single-desk request intake",
      "Operator-led support with mandatory human approval",
      "Per-request audit trail",
      "50 Capacity Units each month",
    ],
    cta: "checkout" as const,
  },
  {
    key: "growth",
    name: "Growth",
    price: "$899",
    cadence: "/month",
    sites: "up to 5 websites",
    cu: "150 Capacity Units / month",
    blurb: "Operations across a portfolio of sites with more monthly capacity.",
    recommended: true,
    points: [
      "Everything in Operations",
      "Coverage across up to 5 websites",
      "150 Capacity Units each month",
      "Operational reporting",
    ],
    cta: "checkout" as const,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    sites: "custom",
    cu: "Custom capacity",
    blurb: "Custom capacity, coverage, and onboarding for larger estates.",
    points: [
      "Everything in Growth",
      "Custom Capacity Units and site coverage",
      "Custom onboarding and SLAs",
      "Dedicated commercial terms",
    ],
    cta: "contact" as const,
  },
] as const;

export const ADDONS = [
  { key: "topup_50", name: "50 Capacity Units", note: "$150 one-time · $3.00 / credit · rolls over until used" },
  { key: "topup_100", name: "100 Capacity Units", note: "$275 one-time · $2.75 / credit · rolls over until used" },
  { key: "topup_250", name: "250 Capacity Units", note: "$625 one-time · $2.50 / credit · rolls over until used" },
  { key: "dns", name: "DNS Assistance", note: "$100 one-time" },
] as const;

// ---- Sub-processors / vendors actually in the stack -------------------------
// Used to keep the privacy, cookie, and sub-processor disclosures truthful.
export const SUBPROCESSORS = [
  { name: "Supabase", role: "Application database, authentication, and audit logging", region: "United States" },
  { name: "Vercel", role: "Site hosting, edge delivery, and build infrastructure", region: "United States" },
  { name: "Stripe", role: "Subscription billing and payment processing", region: "United States" },
  { name: "Resend", role: "Transactional and notification email delivery", region: "United States" },
  { name: "Google (Analytics 4 / Tag Manager / Fonts)", role: "Privacy-respecting usage analytics and web font delivery", region: "United States" },
] as const;

// ---- Brand palette (WSS brand system — Google-complement HSL) ---------------
export const BRAND = {
  amber: "#F4B142",
  cyan: "#35DCEA",
  blue: "#0443FB",
  mulberry: "#A83489",
  ink: "#0B1220",
  surface: "#FAFAF7",
} as const;

// ---- Primary navigation (snake_case voice is the brand tell) ----------------
export const NAV = [
  { href: "/services", label: "services" },
  { href: "/pricing", label: "pricing" },
  { href: "/articles", label: "articles" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
] as const;

export const FOOTER_LEGAL = [
  { href: "/privacy", label: "privacy_policy" },
  { href: "/terms", label: "terms_of_service" },
  { href: "/cookies", label: "cookie_policy" },
] as const;

// ---- Default social image ---------------------------------------------------
// 1200x630. See public/og/ — the SVG source is committed; export to PNG before
// launch for maximum unfurler compatibility (tracked as a launch step).
export const DEFAULT_OG_IMAGE = "/og/og-default.png";

// ---- Legal effective date ---------------------------------------------------
export const LEGAL_EFFECTIVE_DATE = "June 8, 2026";
