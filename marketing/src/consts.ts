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
  lockPolicy: "Founder pricing is locked in while your account remains active.",
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
    founder: "$199/month",
    standard: "Founder pricing is locked in while your account remains active.",
  },
  ctaLabel: "_build_my_website",
  ctaHref: "https://buy.stripe.com/5kQ14f8gycXJ4ea4Tt9Zm08",
} as const;

// ---- Founder Website design systems (the $500 package, made flexible) ----
// Design system starting points for local businesses. Customers choose the
// website style they like; Website Support Studio adapts the words, photos,
// colors, services, calls to action, and local trust signals to their business.
// The "Start With This Style" CTA reuses the existing Founder Website Package
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

export const DESIGN_SYSTEMS = [
  {
    key: "harbor",
    name: "Harbor",
    personality: "Calm, trustworthy, polished, established.",
    visualStyle: "Soft neutrals, deep blue accents, generous whitespace, clean cards, and trust-first sections.",
    industry: "Professional services, medical, wellness, home services",
    pages: ["Home", "Services", "Proof", "Service Areas", "Contact"],
    demoRoute: undefined,
    sampleSites: [
      { label: "Wellness Sample", href: "/templates/sample/harbor-wellness" },
    ],
    fits: ["Professional services", "Medical offices", "Wellness", "Home services"],
    exampleBusinesses: ["Dental office", "Bookkeeping firm", "Physical therapy clinic", "Home inspection company"],
    adaptableFrom: "Dental office",
    adaptableTo: ["Roofing company", "Financial planner", "Med spa", "Therapist", "Home inspection company"],
    features: [
      "Trust-forward hero and proof sections",
      "Clear service architecture",
      "Appointment or estimate calls to action",
      "Local credibility blocks",
      "Contact and intake path",
    ],
    images: {
      desktop: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=82",
      mobile: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=700&q=82",
    },
    preview: {
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=82",
      alt: "Polished professional office lounge with calm blue seating",
      label: "Design system",
      headline: "A calm, polished website style for businesses that need trust fast.",
      signals: ["Trust", "Services", "Proof", "Appointments"],
    },
  },
  {
    key: "luna",
    name: "Luna",
    personality: "Elegant, warm, stylish, intimate.",
    visualStyle: "Soft contrast, editorial imagery, rounded cards, refined type, warm neutrals, and boutique spacing.",
    industry: "Salon, boutique, cafe, restaurant, wellness",
    pages: ["Home", "Services/Menu/Collections", "Gallery/Events/Visit", "About", "Contact"],
    demoRoute: "/templates/luna/salon",
    sampleSites: [
      { label: "Salon Sample", href: "/templates/luna/salon" },
      { label: "Coffee Sample", href: "/templates/luna/coffee-shop" },
      { label: "Boutique Sample", href: "/templates/luna/boutique" },
    ],
    fits: ["Salons", "Boutiques", "Coffee shops", "Restaurants", "Wellness studios"],
    exampleBusinesses: ["Hair salon", "Local boutique", "Candle shop", "Yoga studio", "Brunch cafe"],
    adaptableFrom: "Salon",
    adaptableTo: ["Boutique", "Coffee shop", "Restaurant", "Wellness studio", "Florist"],
    features: [
      "Image-led hero and service menus",
      "Gallery or portfolio sections",
      "Appointment and visit calls to action",
      "Hours and location blocks",
      "Warm brand story section",
    ],
    images: {
      desktop: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1100&q=82",
      mobile: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=82",
    },
    preview: {
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1100&q=82",
      alt: "Elegant salon chairs and styling stations",
      label: "Website style",
      headline: "A warm, image-led website style for businesses where atmosphere matters.",
      signals: ["Style", "Gallery", "Appointments", "Local visits"],
    },
  },
  {
    key: "summit",
    name: "Summit",
    personality: "Bold, capable, outdoorsy, dependable.",
    visualStyle: "Strong hero imagery, rugged contrast, slate tones, safety accents, direct CTAs, and action-first layouts.",
    industry: "Contractors, roofing, landscaping, outdoor services",
    pages: ["Home", "Services", "Service Areas", "Proof", "Contact"],
    demoRoute: undefined,
    sampleSites: [
      { label: "Roofing Sample", href: "/templates/sample/ridgeline-roofing" },
      { label: "Landscaping Sample", href: "/templates/sample/greenline-landscaping" },
      { label: "HVAC Sample", href: "/templates/sample/northstar-air" },
    ],
    fits: ["Roofing", "Landscaping", "Tree service", "Exterior painting", "Outdoor services"],
    exampleBusinesses: ["Roofing company", "Landscaping crew", "Tree service", "Window installer", "Exterior painter"],
    adaptableFrom: "Roofing company",
    adaptableTo: ["Landscaping business", "Tree service", "Exterior painting company", "Gym", "Outdoor equipment rental"],
    features: [
      "Estimate-first conversion path",
      "Emergency or priority service callouts",
      "Service area structure",
      "Project and proof sections",
      "Click-to-call header and footer",
    ],
    images: {
      desktop: "/templates/ridgeline-roofing-desktop.svg",
      mobile: "/templates/ridgeline-roofing-mobile.svg",
    },
    preview: {
      image: "https://images.unsplash.com/photo-1635424824849-1b09bdcc55b1?auto=format&fit=crop&w=1100&q=82",
      alt: "Roofer working on a residential shingle roof",
      label: "Design system",
      headline: "A bold, dependable website style for businesses built around estimates and service calls.",
      signals: ["Estimates", "Service areas", "Proof", "Urgent calls"],
    },
  },
  {
    key: "foundry",
    name: "Foundry",
    personality: "Industrial, precise, confident, no-nonsense.",
    visualStyle: "Strong grid, charcoal tones, bold headings, technical details, process blocks, and sharp CTA sections.",
    industry: "Trades, manufacturing, auto, construction, B2B services",
    pages: ["Home", "Services", "Process", "Service Areas", "Contact"],
    demoRoute: undefined,
    sampleSites: [
      { label: "Plumbing Sample", href: "/templates/sample/mainline-plumbing" },
    ],
    fits: ["Plumbing", "HVAC", "Auto repair", "Manufacturing", "Commercial contractors"],
    exampleBusinesses: ["Plumbing company", "HVAC service", "Machine shop", "Auto repair shop", "Commercial contractor"],
    adaptableFrom: "Auto repair shop",
    adaptableTo: ["Plumbing company", "HVAC company", "Welding shop", "Contractor", "Equipment rental business"],
    features: [
      "Technical service menus",
      "Repair and maintenance callouts",
      "Process and diagnostic sections",
      "Emergency service path",
      "Commercial credibility blocks",
    ],
    images: {
      desktop: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1100&q=82",
      mobile: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=700&q=82",
    },
    preview: {
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1100&q=82",
      alt: "Industrial workshop with tools and machinery",
      label: "Starting point",
      headline: "A precise, industrial website style for technical businesses and trades.",
      signals: ["Process", "Repairs", "Maintenance", "Commercial"],
    },
  },
  {
    key: "ember",
    name: "Ember",
    personality: "Warm, energetic, flavorful, social.",
    visualStyle: "Rich warm colors, food/editorial imagery, menu-style sections, inviting CTAs, and cozy local atmosphere.",
    industry: "Restaurants, coffee shops, bakeries, bars, food trucks",
    pages: ["Home", "Menu", "Hours", "Events", "Contact"],
    demoRoute: undefined,
    sampleSites: [
      { label: "Restaurant Sample", href: "/templates/sample/table-and-hearth" },
    ],
    fits: ["Restaurants", "Coffee shops", "Bakeries", "Bars", "Caterers"],
    exampleBusinesses: ["Coffee shop", "Pizza restaurant", "Bakery", "Brunch cafe", "Catering company"],
    adaptableFrom: "Coffee shop",
    adaptableTo: ["Restaurant", "Bakery", "Bar", "Food truck", "Catering service"],
    features: [
      "Menu and featured item sections",
      "Hours and location blocks",
      "Reservation, ordering, or directions CTAs",
      "Events and catering callouts",
      "Neighborhood story section",
    ],
    images: {
      desktop: "https://images.unsplash.com/photo-1551529563-fce9529e67ac?auto=format&fit=crop&w=1100&q=82",
      mobile: "https://images.unsplash.com/photo-1551529563-fce9529e67ac?auto=format&fit=crop&w=700&q=82",
    },
    preview: {
      image: "https://images.unsplash.com/photo-1551529563-fce9529e67ac?auto=format&fit=crop&w=1100&q=82",
      alt: "Coffee shop counter with menu boards and barista station",
      label: "Design system",
      headline: "A warm, local website style for menus, hours, events, and visits.",
      signals: ["Menu", "Hours", "Ordering", "Events"],
    },
  },
  {
    key: "atlas",
    name: "Atlas",
    personality: "Modern, strategic, premium, authoritative.",
    visualStyle: "Large type, confident spacing, subtle gradients, data/trust sections, and strong comparison blocks.",
    industry: "Consulting, legal, accounting, IT, B2B services",
    pages: ["Home", "Services", "Approach", "Proof", "Contact"],
    demoRoute: undefined,
    sampleSites: [
      { label: "Consultant Sample", href: "/templates/sample/atlas-advisory" },
      { label: "Legal Sample", href: "/templates/sample/harbor-legal-group" },
    ],
    fits: ["Consultants", "Law firms", "Accounting", "IT services", "Agencies"],
    exampleBusinesses: ["Marketing consultant", "Law office", "IT services company", "Accounting firm", "Fractional CFO"],
    adaptableFrom: "Consulting firm",
    adaptableTo: ["Law office", "IT company", "Accounting practice", "Recruiting firm", "Business coach"],
    features: [
      "Authority-first hero and value proposition",
      "Service and offer comparison sections",
      "Process and approach blocks",
      "Trust and proof structure",
      "Consultation-focused CTA path",
    ],
    images: {
      desktop: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=82",
      mobile: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=700&q=82",
    },
    preview: {
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=82",
      alt: "Modern team strategy session in a bright office",
      label: "Website style",
      headline: "A strategic, authority-led website style for experts and professional firms.",
      signals: ["Authority", "Services", "Process", "Consultations"],
    },
  },
] as const;

export const TEMPLATES = DESIGN_SYSTEMS;

// What we adapt to each business inside the $500 package, versus what is
// quoted separately as custom work. Shared across all design systems.
export const DESIGN_SYSTEM_CUSTOMIZABLE = [
  "Your business name and logo",
  "Colors and fonts to match your brand",
  "All text and page copy",
  "Your photos (or licensed stock photos)",
  "Your list of services",
  "Your service areas",
  "Contact details, phone number, and business hours",
] as const;

export const DESIGN_SYSTEM_CUSTOM_WORK = [
  "Online booking or scheduling systems",
  "E-commerce and online payments",
  "Customer logins or portals",
  "Pages beyond the included five",
  "Third-party software integrations",
  "Custom features and functionality",
] as const;

export const TEMPLATE_CUSTOMIZABLE = DESIGN_SYSTEM_CUSTOMIZABLE;
export const TEMPLATE_CUSTOM_WORK = DESIGN_SYSTEM_CUSTOM_WORK;

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
    price: "$199",
    founderPrice: "$199",
    founderDiscountLabel: "Founder rate",
    founderAvailability: "17 founder spots remaining",
    founderPlanKey: "operations_founder",
    cadence: "/month",
    sites: "1 website",
    cu: "50 Website Requests / month",
    blurb: "Ongoing website updates and support for one business website.",
    founderBlurb: "Same Operations plan at founder pricing, locked in while your account remains active.",
    points: [
      "Submit Website Requests from your Back Office",
      "We prepare updates; you approve changes before they go live",
      "Clear request history and status updates",
      "50 Website Requests each month",
    ],
    cta: "checkout" as const,
  },
  {
    key: "growth",
    name: "Growth",
    price: "$899",
    cadence: "/month",
    sites: "up to 5 websites",
    cu: "150 Website Requests / month",
    blurb: "Ongoing website support across a small portfolio of sites.",
    recommended: true,
    points: [
      "Everything in Operations",
      "Coverage across up to 5 websites",
      "150 Website Requests each month",
      "Clear website request and support reporting",
    ],
    cta: "checkout" as const,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    sites: "custom",
    cu: "Custom Website Request volume",
    blurb: "Custom Website Request volume, coverage, and onboarding for larger website estates.",
    points: [
      "Everything in Growth",
      "Custom Website Request capacity and site coverage",
      "Custom onboarding and SLAs",
      "Dedicated commercial terms",
    ],
    cta: "contact" as const,
  },
] as const;

export const ADDONS = [
  { key: "topup_50", name: "50 Website Requests", note: "$150 one-time · $3.00 / credit · rolls over until used" },
  { key: "topup_100", name: "100 Website Requests", note: "$275 one-time · $2.75 / credit · rolls over until used" },
  { key: "topup_250", name: "250 Website Requests", note: "$625 one-time · $2.50 / credit · rolls over until used" },
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
