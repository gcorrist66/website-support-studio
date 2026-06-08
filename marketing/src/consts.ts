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
    street: "6601 South Westshore Boulevard #2403",
    locality: "Tampa",
    region: "FL",
    postalCode: "33616",
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
