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
export const SITE_TAGLINE = "Managed website operations and support for revenue-critical sites";

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
    founderBlurb: "The same Operations plan at a lower introductory rate for the first 6 months.",
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
