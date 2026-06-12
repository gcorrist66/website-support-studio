import { WEBSITE_PACKAGE } from "./consts";

export type IndustryLandingPage = {
  slug:
    | "roofing"
    | "construction"
    | "salon"
    | "coffee-shop"
    | "hvac"
    | "plumbing"
    | "landscaping"
    | "restaurant"
    | "boutique"
    | "consultant"
    | "medical"
    | "dental"
    | "attorney"
    | "financial";
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
  demoCtaLabel?: string;
  ownerMessage?: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
  };
  serviceFocus?: {
    eyebrow: string;
    title: string;
    items: { title: string; body: string }[];
  };
  opportunityPaths?: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { title: string; body: string }[];
  };
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
  construction: {
    slug: "construction",
    industry: "Construction",
    eyebrow: "websites for construction companies",
    title: "A construction website that turns project interest into estimate requests.",
    description:
      "Show your services, project types, service area, consultation path, and trust signals in a site homeowners and property managers can understand quickly.",
    heroImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Construction worker reviewing plans on an active job site",
    accent: "#f97316",
    demoName: "Ridgeline Roofing",
    demoRoute: "/templates/sample/ridgeline-roofing",
    demoType: "Summit construction and exterior-services sample",
    problems: [
      "Construction prospects need to know what kind of work you do, where you work, and how to start a project conversation.",
      "A thin website can make a capable contractor look less established than the work deserves.",
      "Estimate requests should be obvious on mobile, especially when someone is comparing multiple local companies.",
    ],
    exampleBullets: [
      "Project and service sections built around estimate requests",
      "Strong exterior-service visual direction",
      "Service area and consultation paths",
      "Trust structure without fake project results",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your construction services, project types, towns, photos, and estimate flow.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Project types", "Service area", "Phone number", "Photos/logo if available"],
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
    eyebrow: "websites for ac and hvac companies",
    title: "An AC/HVAC website built for service calls, installs, and tune-ups.",
    description:
      "Your team should be running service calls, replacement installs, maintenance plans, and seasonal rush work. We handle the website path that turns hot and cold houses into clear requests.",
    heroImage: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "HVAC technician servicing residential equipment",
    accent: "#0284c7",
    demoName: "Northstar Air",
    demoRoute: "/templates/sample/northstar-air",
    demoType: "Sample AC/HVAC website",
    demoCtaLabel: "View HVAC Example",
    problems: [
      "HVAC visitors are often hot, cold, or worried their system is failing. AC repair, heating repair, and emergency service paths need to be obvious immediately.",
      "Replacement installs, financing questions, maintenance plans, and tune-ups should not compete for attention in one generic paragraph.",
      "A strong AC/HVAC site gives homeowners confidence before they call: service areas, seasonal availability, reviews, quote requests, and clear next steps.",
    ],
    exampleBullets: [
      "AC repair, heating service, maintenance plan, and replacement install paths",
      "Emergency service and seasonal rush messaging",
      "Quote, financing, and request-service CTAs",
      "Service-area and trust sections without fake reviews or fake results",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your HVAC services, service area, hours, phone number, and seasonal offers.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["AC/heating services", "Service areas", "Phone number", "Hours", "Maintenance plans or install offers", "Photos/logo if available"],
    ownerMessage: {
      eyebrow: "_hvac_owner_focus",
      title: "You run the HVAC work. We keep the website from costing you calls.",
      body:
        "You should not be updating pages during the summer AC rush, rewriting heating service copy before a cold snap, or wondering whether a broken form is costing you jobs. Website Support Studio gives HVAC owners a clean website path and a simple place to request updates after launch.",
      points: [
        "AC repair calls and no-cool requests stay easy to find.",
        "Heating repair, furnace service, and winter calls get their own path.",
        "Maintenance plans, replacements, financing, and quote requests are separated clearly.",
        "Service-area pages help homeowners confirm you work in their city.",
      ],
    },
    serviceFocus: {
      eyebrow: "_hvac_service_paths",
      title: "Built around the calls HVAC companies actually want.",
      items: [
        { title: "Emergency service calls", body: "Make urgent no-heat and no-cool requests visible without making the page feel panicked." },
        { title: "AC repair", body: "Give cooling prospects a direct path for warm air, short cycling, airflow issues, and system checks." },
        { title: "Heating repair", body: "Separate furnace, heat pump, thermostat, and winter comfort problems from general service copy." },
        { title: "Maintenance plans", body: "Explain spring and fall tune-ups, priority scheduling, and recurring comfort checks." },
        { title: "Replacement installs", body: "Create a cleaner path for quote requests, right-sized options, and financing conversations." },
        { title: "Reviews and trust signals", body: "Show service area, hours, phone paths, and proof cues without inventing testimonials." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_meet_you_where_you_are",
      title: "Whether Clay flags a first website or a missed-jobs problem, the path is simple.",
      intro:
        "HVAC companies do not all need the same thing. Some need a first real website. Some need a refresh. Some need ongoing support or a better way to capture calls and quote requests.",
      items: [
        { title: "Founder Website Package", body: "For HVAC companies that need a clean, professional first site fast." },
        { title: "Website Refresh", body: "For companies with an existing site that feels dated, thin, or hard to use on mobile." },
        { title: "Website Operations", body: "For teams that need ongoing updates, service pages, seasonal changes, and support requests handled." },
        { title: "Conversion Optimization", body: "For HVAC sites that get traffic but bury call, quote, financing, or maintenance-plan actions." },
        { title: "Missed Jobs Review", body: "For companies where weak forms, unclear services, or hidden CTAs may be leaking service calls." },
      ],
    },
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
  consultant: {
    slug: "consultant",
    industry: "Consultant",
    eyebrow: "websites for consultants",
    title: "A consulting website that makes expertise easy to understand.",
    description:
      "Show your advisory offers, process, fit, and consultation path with a professional website built for trust before the first call.",
    heroImage: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Consulting team reviewing strategy in a bright office",
    accent: "#4f46e5",
    demoName: "Atlas Advisory Group",
    demoRoute: "/templates/sample/atlas-advisory",
    demoType: "Atlas consultant sample",
    problems: [
      "Consulting buyers need to understand what you do, who you help, and what the first conversation is for.",
      "Vague expertise pages create hesitation because prospects cannot see your process or where they fit.",
      "A strong consultant website turns authority into a clear consultation path without fake case studies.",
    ],
    exampleBullets: [
      "Clear advisory offers and consultation CTAs",
      "Process-led proof without invented client wins",
      "Professional services layout built around trust",
      "Authority and fit signals before the first call",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Atlas around your consulting offers, positioning, process, and booking path.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Ideal clients", "Consultation path", "Bio", "Logo/photos if available"],
  },
  medical: {
    slug: "medical",
    industry: "Medical",
    eyebrow: "websites for medical practices",
    title: "A medical website that helps patients feel oriented before they call.",
    description:
      "Explain services, appointments, location, visit expectations, and contact paths in a calm site that avoids hype and builds confidence.",
    heroImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Bright medical clinic room with treatment table",
    accent: "#2563eb",
    demoName: "Harbor Wellness Clinic",
    demoRoute: "/templates/sample/harbor-wellness",
    demoType: "Harbor medical and wellness sample",
    problems: [
      "Patients need plain-language service information, location details, and appointment expectations before reaching out.",
      "Medical-adjacent websites should reduce anxiety, not bury people in jargon or overclaim results.",
      "A generic website can make a legitimate practice feel harder to trust than it should.",
    ],
    exampleBullets: [
      "Calm clinical design and clear service pages",
      "Appointment-first contact path",
      "Visit expectations and practical care details",
      "No fake testimonials or medical promises",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Harbor around your services, appointment process, location, and patient-facing language.",
      "The $500 build includes launch and 30 days of post-launch support.",
    ],
    intakeItems: ["Services", "Appointment process", "Location", "Hours", "Provider/clinic photos if available"],
  },
  dental: {
    slug: "dental",
    industry: "Dental",
    eyebrow: "websites for dental offices",
    title: "A dental website that makes new-patient next steps clear.",
    description:
      "Show services, new-patient details, office location, hours, and appointment requests in a trust-first format patients can scan quickly.",
    heroImage: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Clean dental treatment room with chair and equipment",
    accent: "#0891b2",
    demoName: "Harbor Wellness Clinic",
    demoRoute: "/templates/sample/harbor-wellness",
    demoType: "Harbor healthcare sample",
    problems: [
      "Dental patients want to know what you offer, whether you accept new patients, and how to request an appointment.",
      "Service lists, office details, and comfort cues need to be easy to find on mobile.",
      "A dental website should feel professional and reassuring without fake reviews or unverifiable claims.",
    ],
    exampleBullets: [
      "Trust-forward layout for patient decision-making",
      "Service, appointment, location, and visit-detail sections",
      "Calm healthcare-style visual language",
      "Flexible Harbor structure ready for dental copy",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Harbor around your dental services, office details, patient instructions, and appointment flow.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Dental services", "New-patient process", "Hours", "Location", "Office photos/logo if available"],
  },
  attorney: {
    slug: "attorney",
    industry: "Attorney",
    eyebrow: "websites for attorneys",
    title: "A law firm website that makes the right inquiry easier to make.",
    description:
      "Present practice areas, attorney background, consultation next steps, and contact paths in a professional site that builds credibility quickly.",
    heroImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Law office desk with legal books and paperwork",
    accent: "#334155",
    demoName: "Harbor Legal Group",
    demoRoute: "/templates/sample/harbor-legal-group",
    demoType: "Atlas legal sample",
    problems: [
      "Legal prospects need to understand practice fit, consultation next steps, and how to contact the office.",
      "A vague professional-services site can make a serious practice feel generic or hard to evaluate.",
      "Attorney websites need authority, clarity, and restraint without fake case results or testimonials.",
    ],
    exampleBullets: [
      "Practice-area structure for small law firms",
      "Consultation and inquiry CTAs",
      "Process and resources sections",
      "No fake outcomes, reviews, or case claims",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Atlas around your practice areas, attorney bio, consultation flow, and location.",
      "The  build includes launch and 30 days of post-launch support.",
    ],
    intakeItems: ["Practice areas", "Attorney bio", "Consultation process", "Location", "Logo/headshot if available"],
  },
  financial: {
    slug: "financial",
    industry: "Financial",
    eyebrow: "websites for financial professionals",
    title: "A financial services website that makes trust visible before the first call.",
    description:
      "Explain who you help, what you offer, your process, and the consultation path with a polished site built for careful decision-making.",
    heroImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Financial planning documents and calculator on a desk",
    accent: "#16a34a",
    demoName: "Atlas Advisory Group",
    demoRoute: "/templates/sample/atlas-advisory",
    demoType: "Atlas financial and advisory sample",
    problems: [
      "Financial prospects need to understand fit, services, process, and next steps before they share sensitive goals.",
      "Trust matters more than hype. A polished site should explain the relationship without overpromising outcomes.",
      "A generic website can make a careful buyer wonder whether the practice is equally generic.",
    ],
    exampleBullets: [
      "Advisory-style service and process sections",
      "Consultation-first conversion path",
      "Professional trust language without fake results",
      "Clear fit and next-step framing",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt Atlas around your services, audience, compliance-safe language, and consultation flow.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Client fit", "Consultation process", "Compliance notes", "Logo/headshot if available"],
  },
};

export const founderCheckoutHref = WEBSITE_PACKAGE.ctaHref;
