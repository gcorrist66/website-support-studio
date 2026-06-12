import { WEBSITE_PACKAGE } from "./consts";

export type IndustryLandingPage = {
  slug: "roofing" | "salon" | "coffee-shop";
  industry: string;
  eyebrow: string;
  title: string;
  description: string;
  heroImage: string;
  heroAlt: string;
  accent: string;
  demoName: string;
  demoRoute: string;
  demoType: string;
  problems: string[];
  exampleBullets: string[];
  trustBullets: string[];
  intakeItems: string[];
};

export const INDUSTRY_LANDING_PAGES: Record<IndustryLandingPage["slug"], IndustryLandingPage> = {
  roofing: {
    slug: "roofing",
    industry: "Roofing",
    eyebrow: "websites for roofing companies",
    title: "A roofing website that makes estimates easy to request.",
    description:
      "Show homeowners roof repair, replacement, storm damage, inspections, and emergency help in a format built for fast mobile decisions.",
    heroImage: "https://images.unsplash.com/photo-1635424824849-1b09bdcc55b1?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Roofer working on a residential shingle roof",
    accent: "#f97316",
    demoName: "Ridgeline Roofing",
    demoRoute: "/templates/sample/ridgeline-roofing",
    demoType: "Summit roofing sample",
    problems: [
      "Homeowners need to know whether you handle repairs, replacements, storm damage, and inspections before they call.",
      "Roofing traffic is urgent and mobile. If the next step is buried, the estimate request goes somewhere else.",
      "A generic website does not explain service area, roof problems, or the trust signals a homeowner needs.",
    ],
    exampleBullets: [
      "Roof-specific hero and service paths",
      "Estimate-first conversion sections",
      "Storm damage, inspection, and emergency language",
      "Project-style proof without fake testimonials",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your roofing services, towns, photos, and phone number.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Service area", "Phone number", "Hours", "Logo/photos if you have them"],
  },
  salon: {
    slug: "salon",
    industry: "Salon",
    eyebrow: "websites for salons and stylists",
    title: "A salon website that feels polished before the first appointment.",
    description:
      "Show services, style, pricing context, gallery moments, hours, location, and appointment paths without making guests hunt.",
    heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Warm salon interior with styling chairs and mirrors",
    accent: "#bf6f5e",
    demoName: "Marigold & Mane",
    demoRoute: "/templates/luna/salon",
    demoType: "Luna salon sample",
    problems: [
      "Guests want to understand services, style, hours, and appointment fit before they reach out.",
      "A salon site has to sell atmosphere quickly. Generic pages make the business feel unfinished.",
      "If booking, consultation, and contact paths are unclear, interested guests drift to Instagram instead.",
    ],
    exampleBullets: [
      "Editorial salon visuals and warm service sections",
      "Services, gallery, about, and contact pages",
      "Appointment-oriented calls to action",
      "Sample business labeling without fake reviews",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Luna around your services, stylist story, photos, hours, and appointment process.",
      "No logo or polished copy yet? We can create the structure and write the pages with you.",
    ],
    intakeItems: ["Services", "Appointment process", "Hours", "Location", "Stylist story/photos if available"],
  },
  "coffee-shop": {
    slug: "coffee-shop",
    industry: "Coffee Shop",
    eyebrow: "websites for coffee shops and cafes",
    title: "A coffee shop website that makes people want to visit.",
    description:
      "Put the menu, hours, location, atmosphere, events, and catering inquiries where customers can act on them fast.",
    heroImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Barista pouring latte art at a warm neighborhood coffee bar",
    accent: "#b8783f",
    demoName: "Moonroom Coffee",
    demoRoute: "/templates/luna/coffee-shop",
    demoType: "Luna coffee shop sample",
    problems: [
      "Cafe visitors check hours, menu, location, and vibe quickly, usually from their phone.",
      "A coffee shop website should create appetite and confidence, not just list contact details.",
      "Events, catering, and neighborhood reasons to visit often get lost when the site is too thin.",
    ],
    exampleBullets: [
      "Menu-first sections with featured drinks",
      "Hours, visit details, events, and contact paths",
      "Warm imagery that immediately says coffee shop",
      "Sample business labeling without fake testimonials",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Luna around your menu, hours, location, photos, events, and inquiries.",
      "The $500 build includes launch and 30 days of post-launch support.",
    ],
    intakeItems: ["Menu highlights", "Hours", "Location", "Events/catering", "Photos/logo if available"],
  },
};

export const founderCheckoutHref = WEBSITE_PACKAGE.ctaHref;
