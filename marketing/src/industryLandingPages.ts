import { WEBSITE_PACKAGE } from "./consts";

export type IndustryLandingPage = {
  slug:
    | "roofing"
    | "construction"
    | "salon"
    | "coffee-shop"
    | "hvac"
    | "plumbing"
    | "electrical"
    | "pools"
    | "irrigation"
    | "garage-doors"
    | "pest-control"
    | "tree-service"
    | "concrete"
    | "pressure-washing"
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
  seoTitle?: string;
  metaDescription?: string;
  ogImage?: string;
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
  seoSections?: {
    eyebrow: string;
    title: string;
    body: string;
    items: { title: string; body: string }[];
  }[];
  faqs?: { q: string; a: string }[];
};

export const INDUSTRY_LANDING_PAGES: Record<IndustryLandingPage["slug"], IndustryLandingPage> = {
  roofing: {
    slug: "roofing",
    industry: "Roofing",
    eyebrow: "websites for roofing companies",
    title: "Roofing website design that gets estimates requested.",
    description:
      "A roofing-specific website design service for roofers who need repair, replacement, storm damage, inspection, and emergency leads from mobile homeowners.",
    seoTitle: "Roofing Website Design for Roofing Companies",
    metaDescription:
      "Roofing website design for roofers who need mobile estimate requests, storm damage pages, service areas, project proof, and lead capture.",
    ogImage: "/templates/ridgeline-roofing-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1635424824849-1b09bdcc55b1?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Roofing website design example with a roofer working on a residential shingle roof",
    accent: "#f97316",
    demoName: "Ridgeline Roofing",
    demoRoute: "/templates/sample/ridgeline-roofing",
    demoType: "Summit roofing sample",
    problems: [
      "Homeowners searching after a leak or hail storm need to know whether you handle repairs, replacements, storm damage, and inspections before they call.",
      "Roofing traffic is urgent and mobile. If the estimate request, phone tap, or service-area answer is buried, the lead goes to another roofer.",
      "Generic contractor websites usually miss roofing-specific proof: roof age, leak symptoms, storm documentation, insurance language, financing, and before-and-after project photos.",
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
    serviceFocus: {
      eyebrow: "roofing website features",
      title: "Roofing website features built around estimates, not brochure clicks.",
      items: [
        {
          title: "Repair and replacement paths",
          body: "Separate roof repair, replacement, inspection, and storm damage pages help homeowners choose the right next step.",
        },
        {
          title: "Lead capture for estimate requests",
          body: "Prominent forms, tap-to-call buttons, and photo-ready request flows make the estimate path obvious on every device.",
        },
        {
          title: "Trust and project proof",
          body: "Badges, service-area copy, insurance-claim context, financing language, and project galleries support high-value roof decisions.",
        },
      ],
    },
    seoSections: [
      {
        eyebrow: "roofing website cost",
        title: "What does a roofing website design cost?",
        body: "Most roofers do not need a sprawling agency build to test a better website. Website Support Studio starts with a focused free preview, then turns approved direction into a launch-ready site with ownership preserved.",
        items: [
          { title: "Free preview first", body: "Request a no-cost preview before committing to a paid build." },
          { title: "Scope stays practical", body: "Core pages focus on services, towns, estimate requests, proof, and contact paths." },
          { title: "Monthly plan optional", body: "You own your domain, site, and content. Maintenance is optional after launch." },
        ],
      },
      {
        eyebrow: "roofing website examples",
        title: "See a roofing website example before you request yours.",
        body: "The Ridgeline Roofing sample shows a premium roofing template structure: full-bleed roof imagery, estimate-first CTAs, storm language, project proof, owner portal, and mobile lead capture.",
        items: [
          { title: "Homeowner-facing demo", body: "Click through the public roofing website example and see how estimate requests are framed." },
          { title: "Owner portal demo", body: "See the sample dashboard a roofer would use for leads, site status, change requests, and billing notes." },
          { title: "Re-skinnable for your company", body: "Your services, towns, phone number, photos, and brand replace the fictitious Ridgeline content." },
        ],
      },
      {
        eyebrow: "mobile roofing leads",
        title: "Mobile roofing websites need fast call and estimate paths.",
        body: "Roofing searches often happen from a driveway, attic, or storm-damaged home. The page should load fast, explain coverage, show trust signals, and make the phone or estimate form reachable immediately.",
        items: [
          { title: "Tap-to-call header", body: "Phone access stays prominent for urgent repair and emergency roof openings." },
          { title: "Sticky mobile conversion", body: "The estimate CTA remains reachable as homeowners scan services and proof." },
          { title: "Service-area clarity", body: "Town and neighborhood coverage helps filter qualified local roofing leads before form submission." },
        ],
      },
    ],
    faqs: [
      {
        q: "What should a roofing website include?",
        a: "A roofing website should include repair, replacement, storm damage, inspections, emergency service, service areas, project proof, trust badges, tap-to-call links, and an obvious estimate request path.",
      },
      {
        q: "Can I see roofing website examples before requesting a preview?",
        a: "Yes. The Ridgeline Roofing demo is a fictitious roofing website example showing the layout, estimate flow, owner portal, service sections, and project proof structure.",
      },
      {
        q: "Does Website Support Studio build websites for roofing companies?",
        a: "Yes. Website Support Studio builds roofing website designs for roofers and exterior service businesses, then adapts the copy, photos, towns, services, and phone number for the specific company.",
      },
      {
        q: "Do I own my roofing website?",
        a: "Yes. You own your domain, site, and content. Monthly support is optional and can be canceled without losing the website.",
      },
    ],
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
    title: "HVAC website design for no-cool calls, tune-ups, and installs.",
    description:
      "HVAC website design for contractors who need AC repair calls, heating leads, maintenance-plan signups, replacement estimates, and seasonal service-area visibility.",
    seoTitle: "HVAC Website Design for HVAC Companies",
    metaDescription:
      "HVAC website design for AC repair, heating, tune-ups, maintenance plans, installs, service areas, and mobile request-service lead capture.",
    ogImage: "/templates/northwind-hvac-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "HVAC technician servicing residential equipment",
    accent: "#0284c7",
    demoName: "Northwind Heating & Air",
    demoRoute: "/templates/sample/northwind-hvac",
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
    seoSections: [
      {
        eyebrow: "_hvac_website_cost",
        title: "What does an HVAC website need to earn service calls?",
        body:
          "An HVAC website has to work during seasonal pressure. Homeowners need AC repair, heating repair, tune-up, install, financing, and service-area answers quickly on mobile.",
        items: [
          { title: "Emergency and seasonal paths", body: "No-cool and no-heat traffic should reach request-service actions without sorting through a generic services page." },
          { title: "Maintenance plan visibility", body: "Tune-ups and recurring plans need their own clear value story so one-time service visitors can become repeat customers." },
          { title: "Replacement estimate confidence", body: "Install pages should explain age, sizing, financing, comfort problems, and quote next steps." },
        ],
      },
      {
        eyebrow: "_hvac_examples",
        title: "See an HVAC website example before you ask for your preview.",
        body:
          "The Northwind Heating & Air demo shows a premium HVAC website with service calls, owner portal, service-area copy, project proof, and content marketing built in.",
        items: [
          { title: "HVAC sample site", body: "View the Northwind demo to see how service pages, CTAs, trust signals, and mobile layout work together." },
          { title: "Owner portal example", body: "The portal shows how new leads, site status, reviews, and support tickets can be presented to an HVAC owner." },
        ],
      },
    ],
    faqs: [
      {
        q: "What should an HVAC website include?",
        a: "An HVAC website should include AC repair, AC install, heating or furnace service, maintenance plans, indoor air quality, emergency service, service areas, trust signals, and request-service CTAs.",
      },
      {
        q: "Can I see an HVAC website example first?",
        a: "Yes. The Northwind Heating & Air demo is a fictitious HVAC website example showing the layout, service sections, owner portal, content card, and mobile lead capture.",
      },
      {
        q: "Do HVAC websites need maintenance-plan content?",
        a: "Yes. Maintenance plans turn seasonal repair visitors into recurring customers and give the site helpful content that can rank before peak AC or heating demand.",
      },
    ],
  },
  plumbing: {
    slug: "plumbing",
    industry: "Plumbing",
    eyebrow: "websites for plumbing companies",
    title: "Plumber website design for emergency calls and planned projects.",
    description:
      "Plumber website design for companies that need emergency calls, drain and leak requests, water heater leads, repipe inquiries, and trust signals that convert mobile homeowners.",
    seoTitle: "Plumber Website Design for Plumbing Companies",
    metaDescription:
      "Plumber website design for emergency plumbing, drain cleaning, leaks, water heaters, service areas, trust proof, and mobile request-service lead capture.",
    ogImage: "/templates/mainline-plumbing-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Plumber working under a sink with hand tools",
    accent: "#0f766e",
    demoName: "Mainline Plumbing Co.",
    demoRoute: "/templates/sample/mainline-plumbing",
    demoType: "Premium plumbing sample",
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
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Emergency availability", "Service area", "Phone number", "Photos/logo if available"],
    serviceFocus: {
      eyebrow: "_plumbing_service_paths",
      title: "Built around emergency calls and higher-value plumbing projects.",
      items: [
        { title: "Emergency plumbing", body: "Make active leaks, backups, burst pipes, and urgent shutoff questions visible without making the site chaotic." },
        { title: "Water heaters", body: "Give repair and replacement prospects a focused path for symptoms, age, quote requests, and timing." },
        { title: "Drain and sewer work", body: "Separate clogged drain and sewer-line language from general repair copy so search intent is clear." },
        { title: "Trust and pricing cues", body: "Surface license, insurance, service area, process, and upfront next steps before asking for form details." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_plumbing_website_cost",
        title: "What does a plumbing website need to win both emergency and planned work?",
        body:
          "Plumbing websites have to convert in seconds during emergencies while still giving planners enough detail for water heaters, repipes, sewer work, and fixture projects.",
        items: [
          { title: "Emergency-first mobile flow", body: "The phone and request path should be visible before a stressed homeowner reads long service copy." },
          { title: "Project-specific pages", body: "Water heater, drain, leak, sewer, repipe, and fixture content should be separated so Google and AI can match intent." },
          { title: "Trust before form fill", body: "License, insurance, reviews, process, and service-area details reduce hesitation before a homeowner invites a plumber in." },
        ],
      },
      {
        eyebrow: "_plumbing_examples",
        title: "See a plumber website example before requesting your preview.",
        body:
          "The Mainline Plumbing Co. demo shows a premium plumbing website with emergency CTAs, service categories, owner portal, project proof, and content marketing built in.",
        items: [
          { title: "Plumbing sample site", body: "View the Mainline demo to see emergency paths, service cards, trust proof, and mobile conversion." },
          { title: "Owner portal example", body: "The portal shows how leads, site status, reviews, and support tickets can be presented to a plumbing owner." },
        ],
      },
    ],
    faqs: [
      {
        q: "What should a plumbing website include?",
        a: "A plumbing website should include emergency plumbing, drain cleaning, leak repair, water heaters, fixtures, sewer or repipe content, service areas, trust signals, and fast mobile CTAs.",
      },
      {
        q: "Can I see a plumbing website example first?",
        a: "Yes. The Mainline Plumbing Co. demo is a fictitious plumbing website example showing the layout, owner portal, service sections, and emergency lead capture.",
      },
      {
        q: "Should a plumber website focus on emergency calls or bigger projects?",
        a: "Both. Emergency pages win urgent calls, while water heater, sewer, repipe, and fixture pages help capture higher-value planned work.",
      },
    ],
  },
  electrical: {
    slug: "electrical",
    industry: "Electrical",
    eyebrow: "websites for electricians",
    title: "Electrician website design built on trust, safety, and growth work.",
    description:
      "Electrical website design for licensed electricians who need emergency repair calls, EV charger leads, panel upgrade estimates, generator projects, and trust signals homeowners can see fast.",
    seoTitle: "Electrician Website Design for Electrical Contractors",
    metaDescription:
      "Electrician website design for licensed electrical contractors offering EV chargers, panel upgrades, generators, rewiring, lighting, repairs, and emergency service.",
    ogImage: "/templates/brightwire-electric-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Licensed electrician working safely inside an electrical panel",
    accent: "#f97316",
    demoName: "Brightwire Electric",
    demoRoute: "/templates/sample/brightwire-electric",
    demoType: "Premium electrical sample",
    demoCtaLabel: "View Electrical Example",
    problems: [
      "Electrical visitors need proof before they click: license, insurance, certifications, service area, and a safety-first process.",
      "Emergency electrical calls and planned upgrades are different buying moments. A good site separates no-power repairs from EV chargers, panel upgrades, generators, and rewiring.",
      "Generic contractor copy undersells high-value electrical work. Homeowners researching EV chargers or backup generators need clear next steps before they request an estimate.",
    ],
    exampleBullets: [
      "Trust-forward hero with license and safety signals",
      "Service paths for EV chargers, panels, generators, rewiring, lighting, repairs, and emergency calls",
      "Owner portal, content card, gallery, and service-area proof",
      "Mobile request-service CTAs without fake testimonials or fake credentials",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the site around your license, certifications, electrical services, towns, phone number, and photos.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Electrical services", "License and certifications", "Service areas", "Phone number", "Hours", "Photos/logo if available"],
    ownerMessage: {
      eyebrow: "_electrical_owner_focus",
      title: "Safety-sensitive work needs a website that proves trust quickly.",
      body:
        "Homeowners are careful about who touches panels, wiring, EV chargers, and generators. Website Support Studio gives electricians a polished site that makes licensing, safety, and high-value services easy to understand before the first call.",
      points: [
        "License, insurance, and certification signals are visible early.",
        "EV charger, panel upgrade, and generator content gets its own path.",
        "Emergency electrical requests stay easy to find on mobile.",
        "Service-area pages help homeowners confirm local fit before calling.",
      ],
    },
    serviceFocus: {
      eyebrow: "_electrical_service_paths",
      title: "Built around safety-first calls and higher-value electrical projects.",
      items: [
        { title: "Panel upgrades", body: "Give 100-amp, 200-amp, breaker, and capacity questions a clear estimate path." },
        { title: "EV charger installs", body: "Capture homeowners researching Level 2 chargers, garage wiring, permits, and panel readiness." },
        { title: "Generators", body: "Explain backup power, transfer switches, whole-home generator planning, and quote next steps." },
        { title: "Rewiring", body: "Separate old wiring, remodel wiring, and safety concerns from basic repair copy." },
        { title: "Lighting and repairs", body: "Make fixture installs, troubleshooting, outlets, switches, and emergency repairs easy to request." },
        { title: "Trust proof", body: "Put licensing, insurance, certifications, and safety process before the form." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_electrical_growth_services",
      title: "Electrical websites should sell today's emergencies and tomorrow's upgrade work.",
      intro:
        "The best electrician sites do more than list repairs. They capture urgent no-power calls while building demand for EV charger installs, panel upgrades, generators, and rewiring projects.",
      items: [
        { title: "Emergency service", body: "Make urgent electrical repair and safety issue requests obvious on mobile." },
        { title: "EV charger demand", body: "Dedicated charger content helps you show up before homeowners call the dealership's referral list." },
        { title: "Panel upgrade estimates", body: "Panel capacity, breaker issues, and 200-amp upgrade pages turn research into estimate requests." },
        { title: "Generator projects", body: "Backup power content supports higher-value planned consultations." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_electrician_website_cost",
        title: "What does an electrician website need to earn trust?",
        body:
          "Electrical work is safety-sensitive. The website has to prove the company is licensed, insured, local, and competent before it asks for a phone call or estimate request.",
        items: [
          { title: "Trust first", body: "License, insurance, certifications, safety language, and review modules should be visible early." },
          { title: "Emergency clarity", body: "No-power, sparking outlet, burning smell, and breaker issues need a fast call path." },
          { title: "Upgrade paths", body: "EV chargers, panel upgrades, generators, and rewiring deserve dedicated sections and content." },
        ],
      },
      {
        eyebrow: "_electrician_examples",
        title: "See an electrician website example before requesting your preview.",
        body:
          "The Brightwire Electric demo shows a premium electrician website with safety-forward trust signals, growth-service content, owner portal, gallery, and content marketing built in.",
        items: [
          { title: "Electrical sample site", body: "View the Brightwire demo to see trust signals, service cards, CTAs, and mobile conversion together." },
          { title: "Owner portal example", body: "The portal shows how electrical leads, site status, testimonials, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [
      {
        q: "What should an electrician website include?",
        a: "An electrician website should include license and insurance signals, emergency electrical repair, panel upgrades, EV charger installation, generators, rewiring, lighting, service areas, reviews, and clear request-service CTAs.",
      },
      {
        q: "Can I see an electrician website example first?",
        a: "Yes. The Brightwire Electric demo is a fictitious electrician website example showing the layout, owner portal, safety-first trust sections, service cards, and content marketing structure.",
      },
      {
        q: "Why should electrician websites highlight EV chargers and panel upgrades?",
        a: "EV chargers, panel upgrades, and generators are growing, high-value services. Dedicated pages help homeowners understand the work and help search engines and AI tools match those specific queries.",
      },
      {
        q: "Do electrician websites need stronger trust signals than other trades?",
        a: "Yes. Homeowners are letting someone work on safety-critical systems, so licensing, insurance, certifications, process, and reviews should be prominent before the form.",
      },
    ],
  },
  pools: {
    slug: "pools",
    industry: "Pools",
    eyebrow: "websites for pool service companies",
    title: "Pool company website design for weekly service and before-and-after proof.",
    description:
      "Pool company website design for teams that want recurring weekly maintenance plans, seasonal cleaning leads, repair requests, resurfacing projects, new builds, and gallery-driven trust.",
    seoTitle: "Pool Company Website Design for Service & Builds",
    metaDescription:
      "Pool company website design for weekly maintenance, cleaning, repairs, openings, resurfacing, new builds, before-and-after galleries, and local lead capture.",
    ogImage: "/templates/bluewave-pools-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Bright residential swimming pool prepared for weekly pool service",
    accent: "#f97316",
    demoName: "Bluewave Pool Co.",
    demoRoute: "/templates/sample/bluewave-pools",
    demoType: "Premium pool company sample",
    demoCtaLabel: "View Pool Company Example",
    problems: [
      "Pool companies sell an ongoing relationship, not just a one-time visit. Weekly service, chemical balancing, and maintenance plans need to be obvious before the homeowner scrolls.",
      "Builds, resurfacing, and renovations are visual decisions. A pool website needs a strong before-and-after gallery that makes the work feel real and desirable.",
      "Generic contractor pages miss the seasonal rhythm of pools: openings, closings, green-pool cleanup, equipment repairs, and recurring maintenance all need separate paths.",
    ],
    exampleBullets: [
      "Weekly maintenance and cleaning CTAs above the fold",
      "Before-and-after gallery structure for builds, resurfacing, and cleanup",
      "Pool repair, openings, closings, and service-area content",
      "Owner portal, content card, trust sections, and mobile conversion",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the site around your weekly service plans, pool services, gallery photos, towns, phone number, and reviews.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Maintenance plans", "Pool services", "Service areas", "Phone number", "Gallery photos", "Hours/logo if available"],
    ownerMessage: {
      eyebrow: "_pool_owner_focus",
      title: "Recurring service should feel easy to start and easy to trust.",
      body:
        "Pool owners want clear weekly care, clean-water confidence, and proof that the company will show up consistently. Website Support Studio gives pool companies a site that turns seasonal traffic into service plans and shows bigger projects with visual proof.",
      points: [
        "Weekly maintenance and cleaning plans get clear CTAs.",
        "Before-and-after galleries support resurfacing and build decisions.",
        "Openings, closings, repairs, and green-pool cleanup get separate paths.",
        "Service-area pages help homeowners confirm route fit before requesting a quote.",
      ],
    },
    serviceFocus: {
      eyebrow: "_pool_service_paths",
      title: "Built around weekly maintenance and the work homeowners can see.",
      items: [
        { title: "Weekly maintenance", body: "Make recurring service plans easy to understand, request, and compare." },
        { title: "Pool cleaning", body: "Give green-pool cleanup, chemical balancing, brushing, skimming, and vacuuming a direct path." },
        { title: "Repairs", body: "Separate pumps, filters, heaters, leaks, lights, automation, and equipment troubleshooting from routine service." },
        { title: "Openings and closings", body: "Seasonal pages help pool owners act before spring and fall schedules fill up." },
        { title: "Resurfacing", body: "Use before-and-after proof to explain finish updates, tile, coping, and renovation next steps." },
        { title: "New builds", body: "Let gallery imagery, project stages, and consultation CTAs support high-value pool projects." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_pool_recurring_revenue",
      title: "Pool websites should turn seasonal searches into maintenance plans.",
      intro:
        "The best pool sites do not treat every visitor like a generic contact. They separate weekly service, urgent cleanup, equipment repair, seasonal openings, resurfacing, and new-build interest.",
      items: [
        { title: "Recurring plans", body: "Weekly maintenance CTAs help turn one search into predictable monthly service revenue." },
        { title: "Seasonal demand", body: "Opening, closing, and green-pool content captures customers when timing matters." },
        { title: "Visual proof", body: "Before-and-after galleries sell resurfacing, renovation, and build work faster than claims." },
        { title: "Route-fit clarity", body: "Service-area copy helps qualify local recurring customers before the form." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_pool_website_cost",
        title: "What does a pool company website need to win recurring service?",
        body:
          "A pool website has to make weekly service feel low-friction and reliable. The site should explain what is included, where the route runs, how seasonal care works, and how to request a quote from a phone.",
        items: [
          { title: "Plan-first CTAs", body: "Get a weekly service quote and Start your maintenance plan should be easy to find." },
          { title: "Seasonal clarity", body: "Openings, closings, and cleanup pages help demand arrive before the rush." },
          { title: "Gallery proof", body: "Before-and-after photos build confidence for resurfacing, renovation, and new builds." },
        ],
      },
      {
        eyebrow: "_pool_company_examples",
        title: "See a pool company website example before requesting your preview.",
        body:
          "The Bluewave Pool Co. demo shows a premium pool company website with recurring-service CTAs, gallery proof, service cards, owner portal, and content marketing built in.",
        items: [
          { title: "Pool sample site", body: "View the Bluewave demo to see weekly maintenance, pool service, gallery, and mobile conversion working together." },
          { title: "Owner portal example", body: "The portal shows how pool service leads, site status, reviews, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [
      {
        q: "What should a pool company website include?",
        a: "A pool company website should include weekly maintenance plans, cleaning, repairs, openings and closings, resurfacing, new builds, service areas, trust signals, reviews, before-and-after galleries, and clear quote CTAs.",
      },
      {
        q: "Can I see a pool company website example first?",
        a: "Yes. The Bluewave Pool Co. demo is a fictitious pool company website example showing recurring service CTAs, owner portal, service cards, gallery proof, and content marketing.",
      },
      {
        q: "Should a pool website focus on weekly service or builds?",
        a: "Both, but the page should separate them. Weekly service creates recurring revenue, while before-and-after gallery sections help sell resurfacing, renovation, and new pool builds.",
      },
      {
        q: "Why do pool websites need strong galleries?",
        a: "Pools are visual. Before-and-after galleries help homeowners trust the quality of cleaning, resurfacing, renovation, and build work before they request a quote.",
      },
    ],
  },
  irrigation: {
    slug: "irrigation",
    industry: "Irrigation",
    eyebrow: "websites for irrigation and sprinkler companies",
    title: "Irrigation website design for seasonal bookings and water-saving upgrades.",
    description:
      "Irrigation website design for sprinkler companies that need spring start-up bookings, summer repair calls, fall winterization leads, smart-controller upgrades, and local service-area visibility.",
    seoTitle: "Irrigation Website Design for Sprinkler Companies",
    metaDescription:
      "Irrigation website design for sprinkler repair, spring start-ups, winterization blow-outs, smart controllers, drip systems, installation, and seasonal local leads.",
    ogImage: "/templates/greenline-irrigation-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Residential lawn sprinkler watering green grass for an irrigation service website",
    accent: "#f97316",
    demoName: "Greenline Irrigation",
    demoRoute: "/templates/sample/greenline-irrigation",
    demoType: "Premium irrigation sample",
    demoCtaLabel: "View Irrigation Example",
    problems: [
      "Irrigation demand arrives in waves: spring start-ups, summer sprinkler repairs, and fall winterization or blow-outs. The website needs to change the next step around the season.",
      "Sprinkler repair traffic is urgent and mobile. Broken heads, leaks, dry spots, and controller issues need a fast request path before the homeowner keeps searching.",
      "Smart controllers, drip systems, and water-saving upgrades are a different sale. The site should explain lower water bills, healthier lawns, and efficiency without burying those upgrades under basic repair copy.",
    ],
    exampleBullets: [
      "Season-aware CTAs for spring start-ups, repairs, and winterization",
      "Service paths for installation, repair, blow-outs, smart controllers, and drip systems",
      "Water-savings copy and project/results gallery structure",
      "Owner portal, content card, service-area sections, and mobile lead capture",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the site around your seasonal services, route area, reviews, photos, phone number, and water-saving upgrade offers.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Seasonal services", "Sprinkler repair scope", "Service areas", "Phone number", "Project photos", "Smart-controller or drip offers"],
    ownerMessage: {
      eyebrow: "_irrigation_owner_focus",
      title: "The right sprinkler website is ready before the season changes.",
      body:
        "Irrigation companies do not get one steady stream of demand. Spring, summer, and fall each need a different message and CTA. Website Support Studio gives sprinkler companies a site that captures the current season while building higher-value upgrade interest.",
      points: [
        "Spring start-up and fall winterization CTAs are easy to surface.",
        "Repair pages catch urgent leaks, broken heads, and controller issues.",
        "Smart-controller and drip-system content supports water-saving upgrades.",
        "Service-area pages help homeowners confirm local route fit before booking.",
      ],
    },
    serviceFocus: {
      eyebrow: "_irrigation_service_paths",
      title: "Built around the sprinkler calendar and smarter water use.",
      items: [
        { title: "Spring start-ups", body: "Make activation, inspection, head adjustment, and controller setup easy to book before the season rush." },
        { title: "Summer repairs", body: "Give broken heads, leaks, dry zones, wiring faults, and controller issues a direct mobile path." },
        { title: "Winterization blow-outs", body: "Fall blow-out pages help homeowners act before freezes and routes fill up." },
        { title: "Smart controllers", body: "Explain Wi-Fi controllers, weather-based watering, schedules, and lower water bills." },
        { title: "Drip systems", body: "Show efficient watering for beds, gardens, trees, and targeted zones." },
        { title: "Installations", body: "Support new systems, additions, zone planning, and project consultations with result-focused copy." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_seasonal_sprinkler_demand",
      title: "Irrigation websites should sell the service that matters this season.",
      intro:
        "The highest-performing sprinkler sites make the timely action obvious: start the system, fix the leak, schedule the blow-out, or upgrade the controller before the next water bill.",
      items: [
        { title: "Spring booking", body: "Start-up pages and CTAs help fill routes before homeowners turn systems on." },
        { title: "Repair capture", body: "Sprinkler repair content catches urgent summer calls from mobile searchers." },
        { title: "Fall winterization", body: "Blow-out pages win predictable seasonal demand before freeze dates." },
        { title: "Water-saving upgrades", body: "Smart-controller and drip content helps turn service visits into higher-value projects." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_irrigation_website_cost",
        title: "What does an irrigation website need to win the season?",
        body:
          "A sprinkler website needs season-specific pages and calls to action. Spring start-up, summer repair, and fall winterization traffic all have different urgency, language, and timing.",
        items: [
          { title: "Season-aware CTAs", body: "Book your spring start-up, Sprinkler repair, and Schedule winterization should each be available when relevant." },
          { title: "Repair-first mobile flow", body: "Broken sprinkler searches need a tap-to-call and request path that works quickly on a phone." },
          { title: "Savings story", body: "Smart controllers, efficient heads, and drip systems give the site an upgrade story beyond basic repairs." },
        ],
      },
      {
        eyebrow: "_irrigation_examples",
        title: "See an irrigation website example before requesting your preview.",
        body:
          "The Greenline Irrigation demo shows a premium sprinkler company website with seasonal CTAs, water-saving content, project/results gallery, owner portal, and content marketing built in.",
        items: [
          { title: "Irrigation sample site", body: "View the Greenline demo to see seasonal service paths, repair CTAs, gallery proof, and mobile conversion." },
          { title: "Owner portal example", body: "The portal shows how sprinkler leads, site status, reviews, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [
      {
        q: "What should an irrigation company website include?",
        a: "An irrigation website should include sprinkler installation, repair, spring start-ups, winterization or blow-outs, smart controllers, drip systems, service areas, reviews, trust signals, and season-aware CTAs.",
      },
      {
        q: "Can I see a sprinkler company website example first?",
        a: "Yes. The Greenline Irrigation demo is a fictitious irrigation website example showing seasonal CTAs, owner portal, service cards, project gallery, and content marketing.",
      },
      {
        q: "Why should irrigation websites focus on seasonal services?",
        a: "Sprinkler demand follows the calendar. Spring start-ups, summer repairs, and fall winterization each create predictable search waves that need their own pages and calls to action.",
      },
      {
        q: "Should irrigation websites promote smart controllers and drip systems?",
        a: "Yes. Smart controllers, efficient heads, and drip systems help sell water savings and higher-value upgrades beyond basic repair calls.",
      },
    ],
  },
  "garage-doors": {
    slug: "garage-doors",
    industry: "Garage Doors",
    eyebrow: "websites for garage door companies",
    title: "Garage door website design for urgent repair calls.",
    description: "Garage door website design for repair, replacement, openers, springs, emergency calls, service areas, and mobile booking.",
    seoTitle: "Garage Doors Website Design for Local Service Companies",
    metaDescription: "Garage door website design for repair, replacement, openers, springs, emergency calls, service areas, and mobile booking.",
    ogImage: "/templates/overpro-garage-doors-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=86",
    heroAlt: "Modern home exterior with attached garage for a garage door service website",
    accent: "#f97316",
    demoName: "OverPro Garage Doors",
    demoRoute: "/templates/sample/overpro-garage-doors",
    demoType: "Premium garage door sample",
    demoCtaLabel: "View Garage Doors Example",
    problems: [
      "Buyers need to know quickly whether you handle garage door repair, broken spring replacement, opener repair, door replacement, and whether you serve their city.",
      "Mobile visitors are often ready to act. If the quote path, phone tap, or service-area answer is buried, the lead keeps searching.",
      "Generic contractor pages miss the trade-specific proof that matters: process, local coverage, before-and-after context, and realistic service expectations.",
    ],
    exampleBullets: [
      "Garage Door Repair, Broken Spring Replacement, Opener Repair paths",
      "Trade-relevant full-bleed hero and service cards",
      "Project and before-after gallery structure",
      "Owner portal, content card, service-area sections, and mobile lead capture",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your garage door services, towns, photos, phone number, and quote process.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Service area", "Phone number", "Hours", "Logo/photos if you have them"],
    ownerMessage: {
      eyebrow: "_garage_owner_focus",
      title: "You run the garage door work. We keep the website from costing you leads.",
      body: "Website Support Studio gives garage door owners a clean website, trade-specific content, and a simple owner portal for leads, updates, testimonials, and support requests.",
      points: [
        "Garage Door Repair and Broken Spring Replacement get direct request paths.",
        "Service-area pages help local buyers confirm fit before submitting a form.",
        "Gallery and proof sections are ready for real project photos.",
        "You own the site and content; support remains optional after launch.",
      ],
    },
    serviceFocus: {
      eyebrow: "_garage_service_paths",
      title: "Built around the garage door calls and quotes that actually matter.",
      items: [
        { title: "Garage Door Repair", body: "Fast service paths for doors that will not open, will not close, grind, jam, or look unsafe." },
        { title: "Broken Spring Replacement", body: "Explain spring symptoms clearly and route homeowners to professional help instead of DIY risk." },
        { title: "Opener Repair", body: "Help visitors describe opener failures, keypad issues, sensor alignment, and noisy operation." },
        { title: "Door Replacement", body: "Show repair-vs-replace thinking for dented, aging, insulated, or damaged garage doors." },
        { title: "Preventive Tune-Ups", body: "Turn one repair into recurring maintenance with safety checks and smoother operation." },
        { title: "Commercial Doors", body: "Give local businesses a clear path for roll-up doors, dock doors, and secure access problems." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_garage_lead_paths",
      title: "urgent and repair-vs-replace should shape the website.",
      intro: "Garage door demand is a mix of panic and comparison. A stuck door traps a car, a broken spring can be dangerous, and a replacement door is a curb-appeal investment. The winning site separates those paths so AI and homeowners can see when to book repair, when to ask about replacement, and why spring work belongs with a professional.",
      items: [
        { title: "Fast request path", body: "Make the primary quote or booking action visible before visitors have to hunt." },
        { title: "Local service fit", body: "Name the towns and neighborhoods you serve so buyers can qualify themselves." },
        { title: "Proof structure", body: "Prepare galleries, checklists, and process notes for real project evidence." },
        { title: "Content that gets found", body: "Publish service and FAQ pages that answer how homeowners actually search." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_garage_website_cost",
        title: "What does a garage door website need to win local leads?",
        body: "Garage door demand is a mix of panic and comparison. A stuck door traps a car, a broken spring can be dangerous, and a replacement door is a curb-appeal investment. The winning site separates those paths so AI and homeowners can see when to book repair, when to ask about replacement, and why spring work belongs with a professional.",
        items: [
          { title: "Service-specific pages", body: "Each important service needs its own page, headline, CTA, FAQ, and local context." },
          { title: "Mobile conversion", body: "Phone, booking, and quote actions stay reachable while visitors compare services." },
          { title: "Ownership preserved", body: "You own your domain, site, and content. Maintenance stays optional after launch." },
        ],
      },
      {
        eyebrow: "_garage_examples",
        title: "See a garage door website example before requesting your preview.",
        body: "The OverPro Garage Doors demo shows a premium garage door website with service CTAs, owner portal, project proof, service areas, and content marketing built in.",
        items: [
          { title: "Sample site", body: "View the OverPro demo to see service paths, CTAs, trust signals, and mobile layout together." },
          { title: "Owner portal example", body: "The portal shows how leads, site status, testimonials, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [{"q":"What should a garage door website include?","a":"A garage door website should include urgent repair, broken springs, opener repair, replacement doors, tune-ups, commercial service, service areas, trust signals, and fast mobile booking."},{"q":"Should garage door websites explain repair versus replacement?","a":"Yes. Homeowners often do not know whether a stuck, dented, noisy, or aging door needs repair or replacement, so a clear comparison helps them request the right service."},{"q":"Why does GEO matter for garage door companies?","a":"AI search tools answer urgent local questions like who can fix a garage door that will not open, so the website needs service-area clarity, emergency language, FAQs, and structured data."}],
  },
  "pest-control": {
    slug: "pest-control",
    industry: "Pest Control",
    eyebrow: "websites for pest control companies",
    title: "Pest control website design for emergency calls and recurring plans.",
    description: "Pest control website design for emergency pest calls, recurring protection plans, termite pages, rodent control, service areas, and mobile booking.",
    seoTitle: "Pest Control Website Design for Local Service Companies",
    metaDescription: "Pest control website design for emergency pest calls, recurring protection plans, termite pages, rodent control, service areas, and mobile booking.",
    ogImage: "/templates/shieldline-pest-control-desktop.png",
    heroImage: "/templates/pest-control-treatment.svg",
    heroAlt: "Pest control treatment equipment with insect and rodent prevention visuals",
    accent: "#f97316",
    demoName: "Shieldline Pest Control",
    demoRoute: "/templates/sample/shieldline-pest-control",
    demoType: "Premium pest control sample",
    demoCtaLabel: "View Pest Control Example",
    problems: [
      "Buyers need to know quickly whether you handle general pest control, recurring protection plans, termite inspections, rodent control, and whether you serve their city.",
      "Mobile visitors are often ready to act. If the quote path, phone tap, or service-area answer is buried, the lead keeps searching.",
      "Generic contractor pages miss the trade-specific proof that matters: process, local coverage, before-and-after context, and realistic service expectations.",
    ],
    exampleBullets: [
      "General Pest Control, Recurring Protection Plans, Termite Inspections paths",
      "Trade-relevant full-bleed hero and service cards",
      "Project and before-after gallery structure",
      "Owner portal, content card, service-area sections, and mobile lead capture",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your pest control services, towns, photos, phone number, and quote process.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Service area", "Phone number", "Hours", "Logo/photos if you have them"],
    ownerMessage: {
      eyebrow: "_pest_owner_focus",
      title: "You run the pest control work. We keep the website from costing you leads.",
      body: "Website Support Studio gives pest control owners a clean website, trade-specific content, and a simple owner portal for leads, updates, testimonials, and support requests.",
      points: [
        "General Pest Control and Recurring Protection Plans get direct request paths.",
        "Service-area pages help local buyers confirm fit before submitting a form.",
        "Gallery and proof sections are ready for real project photos.",
        "You own the site and content; support remains optional after launch.",
      ],
    },
    serviceFocus: {
      eyebrow: "_pest_service_paths",
      title: "Built around the pest control calls and quotes that actually matter.",
      items: [
        { title: "General Pest Control", body: "Give homeowners a direct request path for common pests and explain the first treatment clearly." },
        { title: "Recurring Protection Plans", body: "Turn emergency calls into ongoing prevention with plan details and visit expectations." },
        { title: "Termite Inspections", body: "Separate termite inspections, treatment options, and documentation from general pest pages." },
        { title: "Rodent Control", body: "Explain inspection, trapping, sealing, cleanup notes, and follow-up without vague fear tactics." },
        { title: "Mosquito Service", body: "Make outdoor comfort plans easy to compare and book before peak mosquito months." },
        { title: "Emergency Pest Calls", body: "Provide a call-first path for urgent nest, infestation, or safety concerns." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_pest_lead_paths",
      title: "emergency and recurring plans should shape the website.",
      intro: "Pest control is not one search intent. A wasp nest, roach sighting, termite concern, and quarterly prevention plan all need different language. The website should let an anxious homeowner book urgent help while also showing that recurring protection is the cleaner long-term path.",
      items: [
        { title: "Fast request path", body: "Make the primary quote or booking action visible before visitors have to hunt." },
        { title: "Local service fit", body: "Name the towns and neighborhoods you serve so buyers can qualify themselves." },
        { title: "Proof structure", body: "Prepare galleries, checklists, and process notes for real project evidence." },
        { title: "Content that gets found", body: "Publish service and FAQ pages that answer how homeowners actually search." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_pest_website_cost",
        title: "What does a pest control website need to win local leads?",
        body: "Pest control is not one search intent. A wasp nest, roach sighting, termite concern, and quarterly prevention plan all need different language. The website should let an anxious homeowner book urgent help while also showing that recurring protection is the cleaner long-term path.",
        items: [
          { title: "Service-specific pages", body: "Each important service needs its own page, headline, CTA, FAQ, and local context." },
          { title: "Mobile conversion", body: "Phone, booking, and quote actions stay reachable while visitors compare services." },
          { title: "Ownership preserved", body: "You own your domain, site, and content. Maintenance stays optional after launch." },
        ],
      },
      {
        eyebrow: "_pest_examples",
        title: "See a pest control website example before requesting your preview.",
        body: "The Shieldline Pest Control demo shows a premium pest control website with service CTAs, owner portal, project proof, service areas, and content marketing built in.",
        items: [
          { title: "Sample site", body: "View the Shieldline demo to see service paths, CTAs, trust signals, and mobile layout together." },
          { title: "Owner portal example", body: "The portal shows how leads, site status, testimonials, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [{"q":"What should a pest control website include?","a":"A pest control website should include common pests, emergency service, recurring protection plans, termite inspections, rodent exclusion, mosquito service, service areas, safety notes, reviews, and booking CTAs."},{"q":"Should pest control sites promote recurring plans?","a":"Yes. Emergency pest calls solve the immediate problem, but recurring plans create predictable revenue and make prevention clear for homeowners."},{"q":"How can pest control companies get cited by AI search?","a":"They need specific service pages, city coverage, plain-language pest FAQs, treatment expectations, safety notes, reviews, and structured data that AI tools can extract."}],
  },
  "landscaping": {
    slug: "landscaping",
    industry: "Landscaping",
    eyebrow: "websites for landscaping companies",
    title: "Landscaping website design for recurring lawn care and seasonal work.",
    description: "Landscaping website design for lawn care, maintenance plans, seasonal cleanups, planting, mulch, service areas, and mobile estimate requests.",
    seoTitle: "Landscaping Website Design for Local Service Companies",
    metaDescription: "Landscaping website design for lawn care, maintenance plans, seasonal cleanups, planting, mulch, service areas, and mobile estimate requests.",
    ogImage: "/templates/evergreen-lawn-landscape-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1605117882932-f9e32b03fea9?auto=format&fit=crop&w=1800&q=86",
    heroAlt: "Fresh lawn and landscaped planting beds for a lawn care website",
    accent: "#65a30d",
    demoName: "Evergreen Lawn & Landscape",
    demoRoute: "/templates/sample/evergreen-lawn-landscape",
    demoType: "Premium landscaping sample",
    demoCtaLabel: "View Landscaping Example",
    problems: [
      "Buyers need to know quickly whether you handle weekly lawn care, seasonal cleanups, mulch and bed refresh, planting plans, and whether you serve their city.",
      "Mobile visitors are often ready to act. If the quote path, phone tap, or service-area answer is buried, the lead keeps searching.",
      "Generic contractor pages miss the trade-specific proof that matters: process, local coverage, before-and-after context, and realistic service expectations.",
    ],
    exampleBullets: [
      "Weekly Lawn Care, Seasonal Cleanups, Mulch and Bed Refresh paths",
      "Trade-relevant full-bleed hero and service cards",
      "Project and before-after gallery structure",
      "Owner portal, content card, service-area sections, and mobile lead capture",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your landscaping services, towns, photos, phone number, and quote process.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Service area", "Phone number", "Hours", "Logo/photos if you have them"],
    ownerMessage: {
      eyebrow: "_landscaping_owner_focus",
      title: "You run the landscaping work. We keep the website from costing you leads.",
      body: "Website Support Studio gives landscaping owners a clean website, trade-specific content, and a simple owner portal for leads, updates, testimonials, and support requests.",
      points: [
        "Weekly Lawn Care and Seasonal Cleanups get direct request paths.",
        "Service-area pages help local buyers confirm fit before submitting a form.",
        "Gallery and proof sections are ready for real project photos.",
        "You own the site and content; support remains optional after launch.",
      ],
    },
    serviceFocus: {
      eyebrow: "_landscaping_service_paths",
      title: "Built around the landscaping calls and quotes that actually matter.",
      items: [
        { title: "Weekly Lawn Care", body: "Turn one search into recurring route work with plan details, visit timing, and clear expectations." },
        { title: "Seasonal Cleanups", body: "Capture leaf removal, bed cleanup, pruning, debris haul-off, and seasonal reset demand." },
        { title: "Mulch and Bed Refresh", body: "Show fast curb-appeal work with before-and-after proof and simple estimate steps." },
        { title: "Planting Plans", body: "Help homeowners choose practical planting paths for sun, shade, privacy, and low-maintenance color." },
        { title: "Shrub Trimming", body: "Separate trimming, pruning, hedge work, and cleanup from generic lawn service copy." },
        { title: "Small Landscape Projects", body: "Support higher-ticket projects with photos, scope notes, and quote-first language." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_landscaping_lead_paths",
      title: "recurring and seasonal should shape the website.",
      intro: "Landscaping demand compounds when the site sells weekly maintenance first and seasonal projects second. A homeowner may arrive for a spring cleanup, but the site should make recurring care, mulch refreshes, planting, and small projects feel like natural next steps.",
      items: [
        { title: "Fast request path", body: "Make the primary quote or booking action visible before visitors have to hunt." },
        { title: "Local service fit", body: "Name the towns and neighborhoods you serve so buyers can qualify themselves." },
        { title: "Proof structure", body: "Prepare galleries, checklists, and process notes for real project evidence." },
        { title: "Content that gets found", body: "Publish service and FAQ pages that answer how homeowners actually search." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_landscaping_website_cost",
        title: "What does a landscaping website need to win local leads?",
        body: "Landscaping demand compounds when the site sells weekly maintenance first and seasonal projects second. A homeowner may arrive for a spring cleanup, but the site should make recurring care, mulch refreshes, planting, and small projects feel like natural next steps.",
        items: [
          { title: "Service-specific pages", body: "Each important service needs its own page, headline, CTA, FAQ, and local context." },
          { title: "Mobile conversion", body: "Phone, booking, and quote actions stay reachable while visitors compare services." },
          { title: "Ownership preserved", body: "You own your domain, site, and content. Maintenance stays optional after launch." },
        ],
      },
      {
        eyebrow: "_landscaping_examples",
        title: "See a landscaping website example before requesting your preview.",
        body: "The Evergreen Lawn & Landscape demo shows a premium landscaping website with service CTAs, owner portal, project proof, service areas, and content marketing built in.",
        items: [
          { title: "Sample site", body: "View the Evergreen demo to see service paths, CTAs, trust signals, and mobile layout together." },
          { title: "Owner portal example", body: "The portal shows how leads, site status, testimonials, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [{"q":"What should a landscaping website include?","a":"A landscaping website should include weekly lawn care, seasonal cleanups, mulch, planting, trimming, projects, service areas, gallery proof, reviews, and estimate CTAs."},{"q":"Why should landscaping websites focus on recurring maintenance?","a":"Recurring maintenance creates predictable route revenue and gives homeowners a simple reason to request service before a one-time project."},{"q":"How does seasonal content help landscaping SEO?","a":"Spring cleanup, fall cleanup, mulch, planting, and lawn care searches arrive at predictable times, so dedicated seasonal pages help rank before demand peaks."}],
  },
  "tree-service": {
    slug: "tree-service",
    industry: "Tree Service",
    eyebrow: "websites for tree service companies",
    title: "Tree service website design for safety, storm calls, and high-ticket work.",
    description: "Tree service website design for removal, trimming, storm damage, emergency tree work, stump grinding, service areas, and estimate requests.",
    seoTitle: "Tree Service Website Design for Local Service Companies",
    metaDescription: "Tree service website design for removal, trimming, storm damage, emergency tree work, stump grinding, service areas, and estimate requests.",
    ogImage: "/templates/canopy-tree-care-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=86",
    heroAlt: "Tall mature trees and canopy for a tree service website",
    accent: "#16a34a",
    demoName: "Canopy Tree Care",
    demoRoute: "/templates/sample/canopy-tree-care",
    demoType: "Premium tree service sample",
    demoCtaLabel: "View Tree Service Example",
    problems: [
      "Buyers need to know quickly whether you handle tree removal, tree trimming, storm damage, emergency tree work, and whether you serve their city.",
      "Mobile visitors are often ready to act. If the quote path, phone tap, or service-area answer is buried, the lead keeps searching.",
      "Generic contractor pages miss the trade-specific proof that matters: process, local coverage, before-and-after context, and realistic service expectations.",
    ],
    exampleBullets: [
      "Tree Removal, Tree Trimming, Storm Damage paths",
      "Trade-relevant full-bleed hero and service cards",
      "Project and before-after gallery structure",
      "Owner portal, content card, service-area sections, and mobile lead capture",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your tree service services, towns, photos, phone number, and quote process.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Service area", "Phone number", "Hours", "Logo/photos if you have them"],
    ownerMessage: {
      eyebrow: "_tree_owner_focus",
      title: "You run the tree service work. We keep the website from costing you leads.",
      body: "Website Support Studio gives tree service owners a clean website, trade-specific content, and a simple owner portal for leads, updates, testimonials, and support requests.",
      points: [
        "Tree Removal and Tree Trimming get direct request paths.",
        "Service-area pages help local buyers confirm fit before submitting a form.",
        "Gallery and proof sections are ready for real project photos.",
        "You own the site and content; support remains optional after launch.",
      ],
    },
    serviceFocus: {
      eyebrow: "_tree_service_paths",
      title: "Built around the tree service calls and quotes that actually matter.",
      items: [
        { title: "Tree Removal", body: "Explain removal planning, access, rigging, cleanup, and estimate steps for high-ticket work." },
        { title: "Tree Trimming", body: "Help homeowners request pruning for structure, roof clearance, limbs, and appearance." },
        { title: "Storm Damage", body: "Make storm calls visible with call-first guidance and safe next steps." },
        { title: "Emergency Tree Work", body: "Route dangerous hangs, blocked driveways, and roof impact to immediate contact." },
        { title: "Stump Grinding", body: "Show stump removal as a clear add-on with yard restoration expectations." },
        { title: "Tree Health Checks", body: "Support inspection-style requests for leaning, hollow, diseased, or declining trees." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_tree_lead_paths",
      title: "safety and storm and high-ticket should shape the website.",
      intro: "Tree work carries risk. A site that hides insurance, storm triage, access planning, and project proof makes homeowners hesitate. The best tree service pages answer safety questions first, then guide visitors toward removal, trimming, stump, or emergency estimates.",
      items: [
        { title: "Fast request path", body: "Make the primary quote or booking action visible before visitors have to hunt." },
        { title: "Local service fit", body: "Name the towns and neighborhoods you serve so buyers can qualify themselves." },
        { title: "Proof structure", body: "Prepare galleries, checklists, and process notes for real project evidence." },
        { title: "Content that gets found", body: "Publish service and FAQ pages that answer how homeowners actually search." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_tree_website_cost",
        title: "What does a tree service website need to win local leads?",
        body: "Tree work carries risk. A site that hides insurance, storm triage, access planning, and project proof makes homeowners hesitate. The best tree service pages answer safety questions first, then guide visitors toward removal, trimming, stump, or emergency estimates.",
        items: [
          { title: "Service-specific pages", body: "Each important service needs its own page, headline, CTA, FAQ, and local context." },
          { title: "Mobile conversion", body: "Phone, booking, and quote actions stay reachable while visitors compare services." },
          { title: "Ownership preserved", body: "You own your domain, site, and content. Maintenance stays optional after launch." },
        ],
      },
      {
        eyebrow: "_tree_examples",
        title: "See a tree service website example before requesting your preview.",
        body: "The Canopy Tree Care demo shows a premium tree service website with service CTAs, owner portal, project proof, service areas, and content marketing built in.",
        items: [
          { title: "Sample site", body: "View the Canopy demo to see service paths, CTAs, trust signals, and mobile layout together." },
          { title: "Owner portal example", body: "The portal shows how leads, site status, testimonials, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [{"q":"What should a tree service website include?","a":"A tree service website should include removal, trimming, storm damage, emergency service, stump grinding, tree health checks, service areas, safety signals, insurance language, project proof, and estimate CTAs."},{"q":"Why is safety language important on tree service websites?","a":"Tree work is high-risk and high-ticket. Homeowners need to see insurance, process, access planning, cleanup expectations, and call-first instructions for hazards."},{"q":"How can tree companies get cited in AI search?","a":"Dedicated pages for removal, trimming, storm damage, emergency work, and city service areas make it easier for AI tools to cite the company for specific local questions."}],
  },
  "concrete": {
    slug: "concrete",
    industry: "Concrete",
    eyebrow: "websites for concrete contractor",
    title: "Concrete contractor website design for visual proof and estimate requests.",
    description: "Concrete contractor website design for driveways, patios, slabs, repairs, masonry, before-and-after proof, service areas, and estimate requests.",
    seoTitle: "Concrete Website Design for Local Service Companies",
    metaDescription: "Concrete contractor website design for driveways, patios, slabs, repairs, masonry, before-and-after proof, service areas, and estimate requests.",
    ogImage: "/templates/cornerstone-concrete-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=86",
    heroAlt: "Concrete and construction worksite for a concrete contractor website",
    accent: "#f97316",
    demoName: "Cornerstone Concrete",
    demoRoute: "/templates/sample/cornerstone-concrete",
    demoType: "Premium concrete sample",
    demoCtaLabel: "View Concrete Example",
    problems: [
      "Buyers need to know quickly whether you handle concrete driveways, patios and walkways, slabs and pads, concrete repair, and whether you serve their city.",
      "Mobile visitors are often ready to act. If the quote path, phone tap, or service-area answer is buried, the lead keeps searching.",
      "Generic contractor pages miss the trade-specific proof that matters: process, local coverage, before-and-after context, and realistic service expectations.",
    ],
    exampleBullets: [
      "Concrete Driveways, Patios and Walkways, Slabs and Pads paths",
      "Trade-relevant full-bleed hero and service cards",
      "Project and before-after gallery structure",
      "Owner portal, content card, service-area sections, and mobile lead capture",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your concrete services, towns, photos, phone number, and quote process.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Service area", "Phone number", "Hours", "Logo/photos if you have them"],
    ownerMessage: {
      eyebrow: "_concrete_owner_focus",
      title: "You run the concrete work. We keep the website from costing you leads.",
      body: "Website Support Studio gives concrete contractor a clean website, trade-specific content, and a simple owner portal for leads, updates, testimonials, and support requests.",
      points: [
        "Concrete Driveways and Patios and Walkways get direct request paths.",
        "Service-area pages help local buyers confirm fit before submitting a form.",
        "Gallery and proof sections are ready for real project photos.",
        "You own the site and content; support remains optional after launch.",
      ],
    },
    serviceFocus: {
      eyebrow: "_concrete_service_paths",
      title: "Built around the concrete calls and quotes that actually matter.",
      items: [
        { title: "Concrete Driveways", body: "Show driveway replacement steps, drainage notes, finish options, and estimate expectations." },
        { title: "Patios and Walkways", body: "Use visual proof to help homeowners picture patio sizes, borders, curves, and finishes." },
        { title: "Slabs and Pads", body: "Explain thickness, prep, reinforcement, access, and scheduling for functional concrete work." },
        { title: "Concrete Repair", body: "Help visitors understand when repair is possible and when replacement may be smarter." },
        { title: "Masonry Work", body: "Separate masonry from flatwork with project examples and material clarity." },
        { title: "Stamped Concrete", body: "Support higher-value finish decisions with gallery images and maintenance expectations." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_concrete_lead_paths",
      title: "visual before/after proof should shape the website.",
      intro: "Concrete buyers are not just buying labor; they are buying a finished surface they will see every day. The site needs visual proof, project categories, finish expectations, and repair-vs-replace guidance so both homeowners and AI can understand what kind of concrete work the contractor is known for.",
      items: [
        { title: "Fast request path", body: "Make the primary quote or booking action visible before visitors have to hunt." },
        { title: "Local service fit", body: "Name the towns and neighborhoods you serve so buyers can qualify themselves." },
        { title: "Proof structure", body: "Prepare galleries, checklists, and process notes for real project evidence." },
        { title: "Content that gets found", body: "Publish service and FAQ pages that answer how homeowners actually search." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_concrete_website_cost",
        title: "What does a concrete website need to win local leads?",
        body: "Concrete buyers are not just buying labor; they are buying a finished surface they will see every day. The site needs visual proof, project categories, finish expectations, and repair-vs-replace guidance so both homeowners and AI can understand what kind of concrete work the contractor is known for.",
        items: [
          { title: "Service-specific pages", body: "Each important service needs its own page, headline, CTA, FAQ, and local context." },
          { title: "Mobile conversion", body: "Phone, booking, and quote actions stay reachable while visitors compare services." },
          { title: "Ownership preserved", body: "You own your domain, site, and content. Maintenance stays optional after launch." },
        ],
      },
      {
        eyebrow: "_concrete_examples",
        title: "See a concrete website example before requesting your preview.",
        body: "The Cornerstone Concrete demo shows a premium concrete website with service CTAs, owner portal, project proof, service areas, and content marketing built in.",
        items: [
          { title: "Sample site", body: "View the Cornerstone demo to see service paths, CTAs, trust signals, and mobile layout together." },
          { title: "Owner portal example", body: "The portal shows how leads, site status, testimonials, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [{"q":"What should a concrete contractor website include?","a":"A concrete website should include driveways, patios, slabs, walkways, repairs, masonry, stamped concrete, service areas, project galleries, reviews, and estimate CTAs."},{"q":"Why do concrete websites need before-and-after proof?","a":"Concrete is visual and high-commitment. Before-and-after photos help homeowners judge finish quality, scope, cleanup, and whether the contractor handles similar projects."},{"q":"Should concrete sites explain repair versus replacement?","a":"Yes. Crack repair, resurfacing, and replacement are different decisions, and clear comparison content helps visitors request the right estimate."}],
  },
  "pressure-washing": {
    slug: "pressure-washing",
    industry: "Pressure Washing",
    eyebrow: "websites for pressure washing companies",
    title: "Pressure washing website design for fast booking and instant proof.",
    description: "Pressure washing website design for house washing, driveways, roofs, soft washing, commercial cleaning, before-and-after proof, and fast quotes.",
    seoTitle: "Pressure Washing Website Design for Local Service Companies",
    metaDescription: "Pressure washing website design for house washing, driveways, roofs, soft washing, commercial cleaning, before-and-after proof, and fast quotes.",
    ogImage: "/templates/brightwash-exterior-cleaning-desktop.png",
    heroImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=86",
    heroAlt: "Exterior cleaning service professional for a pressure washing website",
    accent: "#0ea5e9",
    demoName: "BrightWash Exterior Cleaning",
    demoRoute: "/templates/sample/brightwash-exterior-cleaning",
    demoType: "Premium pressure washing sample",
    demoCtaLabel: "View Pressure Washing Example",
    problems: [
      "Buyers need to know quickly whether you handle house washing, driveway cleaning, roof soft washing, patios and pool decks, and whether you serve their city.",
      "Mobile visitors are often ready to act. If the quote path, phone tap, or service-area answer is buried, the lead keeps searching.",
      "Generic contractor pages miss the trade-specific proof that matters: process, local coverage, before-and-after context, and realistic service expectations.",
    ],
    exampleBullets: [
      "House Washing, Driveway Cleaning, Roof Soft Washing paths",
      "Trade-relevant full-bleed hero and service cards",
      "Project and before-after gallery structure",
      "Owner portal, content card, service-area sections, and mobile lead capture",
    ],
    trustBullets: [
      "You own your domain, website, content, and accounts.",
      "We adapt the Summit style around your pressure washing services, towns, photos, phone number, and quote process.",
      "The monthly plan after launch is optional. Cancel anytime; the website is yours either way.",
    ],
    intakeItems: ["Services", "Service area", "Phone number", "Hours", "Logo/photos if you have them"],
    ownerMessage: {
      eyebrow: "_pressure_owner_focus",
      title: "You run the pressure washing work. We keep the website from costing you leads.",
      body: "Website Support Studio gives pressure washing owners a clean website, trade-specific content, and a simple owner portal for leads, updates, testimonials, and support requests.",
      points: [
        "House Washing and Driveway Cleaning get direct request paths.",
        "Service-area pages help local buyers confirm fit before submitting a form.",
        "Gallery and proof sections are ready for real project photos.",
        "You own the site and content; support remains optional after launch.",
      ],
    },
    serviceFocus: {
      eyebrow: "_pressure_service_paths",
      title: "Built around the pressure washing calls and quotes that actually matter.",
      items: [
        { title: "House Washing", body: "Explain soft washing, safe surfaces, mildew removal, and what homeowners should expect." },
        { title: "Driveway Cleaning", body: "Use before-and-after proof to show instant curb-appeal improvement and easy booking." },
        { title: "Roof Soft Washing", body: "Separate roof-safe cleaning from high-pressure washing and explain safety clearly." },
        { title: "Patios and Pool Decks", body: "Help buyers book cleanups before gatherings, listings, and seasonal use." },
        { title: "Gutter Brightening", body: "Make add-on services visible beside house washing and driveway cleaning." },
        { title: "Commercial Cleaning", body: "Show recurring exterior cleaning options for small commercial properties." },
      ],
    },
    opportunityPaths: {
      eyebrow: "_pressure_lead_paths",
      title: "instant proof and fast booking should shape the website.",
      intro: "Pressure washing has the advantage of visible transformation. A site should show before-and-after proof early, then make booking simple with surface type, approximate size, photos, and service area. The faster the quote path feels, the more likely a buyer is to act while the dirty driveway is on their mind.",
      items: [
        { title: "Fast request path", body: "Make the primary quote or booking action visible before visitors have to hunt." },
        { title: "Local service fit", body: "Name the towns and neighborhoods you serve so buyers can qualify themselves." },
        { title: "Proof structure", body: "Prepare galleries, checklists, and process notes for real project evidence." },
        { title: "Content that gets found", body: "Publish service and FAQ pages that answer how homeowners actually search." },
      ],
    },
    seoSections: [
      {
        eyebrow: "_pressure_website_cost",
        title: "What does a pressure washing website need to win local leads?",
        body: "Pressure washing has the advantage of visible transformation. A site should show before-and-after proof early, then make booking simple with surface type, approximate size, photos, and service area. The faster the quote path feels, the more likely a buyer is to act while the dirty driveway is on their mind.",
        items: [
          { title: "Service-specific pages", body: "Each important service needs its own page, headline, CTA, FAQ, and local context." },
          { title: "Mobile conversion", body: "Phone, booking, and quote actions stay reachable while visitors compare services." },
          { title: "Ownership preserved", body: "You own your domain, site, and content. Maintenance stays optional after launch." },
        ],
      },
      {
        eyebrow: "_pressure_examples",
        title: "See a pressure washing website example before requesting your preview.",
        body: "The BrightWash Exterior Cleaning demo shows a premium pressure washing website with service CTAs, owner portal, project proof, service areas, and content marketing built in.",
        items: [
          { title: "Sample site", body: "View the BrightWash demo to see service paths, CTAs, trust signals, and mobile layout together." },
          { title: "Owner portal example", body: "The portal shows how leads, site status, testimonials, and support tickets can be presented to an owner." },
        ],
      },
    ],
    faqs: [{"q":"What should a pressure washing website include?","a":"A pressure washing website should include house washing, driveway cleaning, roof soft washing, patios, gutters, commercial cleaning, service areas, before-and-after galleries, reviews, and fast quote CTAs."},{"q":"Why are before-and-after photos important for pressure washing?","a":"Pressure washing is instantly visual. Before-and-after proof helps homeowners understand the value quickly and gives AI tools concrete project context to cite."},{"q":"Should pressure washing sites explain soft washing?","a":"Yes. Roofs, siding, and delicate surfaces need clear soft washing language so buyers know the company understands safe cleaning methods."}],
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
