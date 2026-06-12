import { WEBSITE_PACKAGE } from "./consts";

export type IndustryLandingPage = {
  slug: "roofing" | "salon" | "coffee-shop" | "hvac" | "plumbing" | "landscaping" | "restaurant" | "boutique";
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
  hvac: {
    slug: "hvac",
    industry: "HVAC",
    eyebrow: "websites for hvac companies",
    title: "An HVAC website built for urgent comfort calls.",
    description:
      "Show heating, cooling, tune-ups, repairs, emergency service, and seasonal maintenance in a website homeowners can act on quickly.",
    heroImage: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "HVAC technician servicing residential equipment",
    accent: "#0284c7",
    demoName: "Northstar Air",
    demoRoute: "/templates/sample/northstar-air",
    demoType: "Summit HVAC sample",
    problems: [
      "HVAC visitors are often hot, cold, or worried their system is failing. The service path needs to be immediate.",
      "Repair, replacement, tune-up, and emergency calls should not compete for attention in one generic paragraph.",
      "A strong HVAC site gives homeowners confidence before they call: service area, timing, maintenance options, and clear next steps.",
    ],
    exampleBullets: [
      "Repair-first and tune-up-ready page structure",
      "Heating, cooling, maintenance, and urgent service paths",
      "Strong click-to-call and estimate CTAs",
      "Service proof without fake reviews or fake results",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your HVAC services, service area, hours, phone number, and seasonal offers.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Heating/cooling services", "Service area", "Phone number", "Hours", "Maintenance offers/photos if available"],
  },
  plumbing: {
    slug: "plumbing",
    industry: "Plumbing",
    eyebrow: "websites for plumbing companies",
    title: "A plumbing website that makes emergency and repair calls obvious.",
    description:
      "Put leaks, drains, water heaters, fixture repairs, emergency service, and service-area details where customers can find them fast.",
    heroImage: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Plumber working under a sink with hand tools",
    accent: "#0f766e",
    demoName: "Mainline Plumbing",
    demoRoute: "/templates/sample/mainline-plumbing",
    demoType: "Foundry plumbing sample",
    problems: [
      "Plumbing visitors are usually trying to stop a problem, schedule a repair, or understand whether you handle their issue.",
      "Emergency service, drains, fixtures, and water heater work need clear separate paths.",
      "If the website feels vague, customers assume the company is vague too and keep searching.",
    ],
    exampleBullets: [
      "Service-first layout for repairs and maintenance",
      "Emergency and routine request paths",
      "Clear plumbing categories without clutter",
      "Trust and process sections that do not rely on fake testimonials",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Foundry style around your plumbing services, service area, emergency path, and contact process.",
      "The $500 build includes launch and 30 days of post-launch support.",
    ],
    intakeItems: ["Services", "Emergency availability", "Service area", "Phone number", "Photos/logo if available"],
  },
  landscaping: {
    slug: "landscaping",
    industry: "Landscaping",
    eyebrow: "websites for landscaping companies",
    title: "A landscaping website that turns curb appeal into estimate requests.",
    description:
      "Show lawn care, cleanups, mulch, planting, hardscapes, seasonal work, and service areas with visuals that feel local and practical.",
    heroImage: "https://images.unsplash.com/photo-1605117882932-f9e32b03fea9?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Freshly landscaped front yard with green lawn and planting beds",
    accent: "#65a30d",
    demoName: "Greenline Landscaping",
    demoRoute: "/templates/sample/greenline-landscaping",
    demoType: "Summit landscaping sample",
    problems: [
      "Landscaping customers want to know what kind of work you do: maintenance, cleanup, planting, mulch, or projects.",
      "Seasonal demand moves quickly. The website needs to make estimate requests feel simple.",
      "Outdoor-service sites need visual proof and service clarity without pretending sample work is a real client portfolio.",
    ],
    exampleBullets: [
      "Lawn care, seasonal cleanup, planting, and hardscape paths",
      "Outdoor visuals that immediately signal landscaping",
      "Project-style sections for service confidence",
      "Estimate-focused mobile CTAs",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your landscaping services, towns, seasonal offers, and estimate flow.",
      "No polished photos yet? We can start with licensed imagery and replace it with your work later.",
    ],
    intakeItems: ["Services", "Service area", "Seasonal offers", "Phone number", "Project photos if available"],
  },
  restaurant: {
    slug: "restaurant",
    industry: "Restaurant",
    eyebrow: "websites for restaurants",
    title: "A restaurant website that helps people decide where to eat.",
    description:
      "Show menu highlights, hours, location, atmosphere, reservations, ordering, events, and contact details in a page flow built for hungry visitors.",
    heroImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Warm restaurant dining room with tables and ambient lighting",
    accent: "#c2410c",
    demoName: "Table & Hearth",
    demoRoute: "/templates/sample/table-and-hearth",
    demoType: "Ember restaurant sample",
    problems: [
      "Restaurant visitors make fast decisions from their phone: menu, hours, location, reservations, and vibe.",
      "If the site hides basic details or feels unfinished, people choose the next place on the list.",
      "A restaurant website needs appetite, trust, and action without fake testimonials or invented press.",
    ],
    exampleBullets: [
      "Menu, hours, events, and contact paths",
      "Warm food-and-dining visual direction",
      "Reservation or ordering CTA placement",
      "Local atmosphere without fake customer claims",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Ember style around your menu, hours, location, photos, and reservation or ordering path.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Menu highlights", "Hours", "Location", "Reservations/ordering", "Food and dining photos if available"],
  },
  boutique: {
    slug: "boutique",
    industry: "Boutique",
    eyebrow: "websites for boutiques",
    title: "A boutique website that makes your shop feel worth visiting.",
    description:
      "Show collections, shop atmosphere, hours, location, visit details, and contact paths with a polished style that feels small-business premium.",
    heroImage: "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Boutique clothing rack with warm retail display",
    accent: "#8f5b74",
    demoName: "Willow Thread",
    demoRoute: "/templates/luna/boutique",
    demoType: "Luna boutique sample",
    problems: [
      "Boutique shoppers want a feel for the store before they visit: style, collections, hours, and location.",
      "A thin or generic website can make a thoughtful local shop feel less established than it is.",
      "The right site should support discovery, visits, questions, and seasonal collections without pretending to be ecommerce if it is not.",
    ],
    exampleBullets: [
      "Collections, visit, about, and contact pages",
      "Editorial boutique visual style",
      "Local shopping and visit-focused CTAs",
      "Sample business labeling without fake reviews",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Luna around your collections, shop story, hours, location, and product photography.",
      "No polished product photos yet? We can start with licensed imagery and replace it as your shop grows.",
    ],
    intakeItems: ["Collections", "Hours", "Location", "Shop story", "Product or interior photos if available"],
  },
};

export const founderCheckoutHref = WEBSITE_PACKAGE.ctaHref;
