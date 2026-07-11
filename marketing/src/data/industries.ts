export type IndustrySampleMatch = {
  route: string;
  name: string;
  description: string;
};

export type IndustryPage = {
  slug: string;
  displayName: string;
  articleSlug: string;
  headline: string;
  subhead: string;
  metaDescription: string;
  sample: IndustrySampleMatch;
  sampleGap: boolean;
  gapNote?: string;
  heroImage: string;
  heroAlt: string;
  accent: string;
  proofPoints: string[];
};

export const INDUSTRY_PAGES = [
  {
    slug: "concrete",
    displayName: "Concrete Contractor",
    articleSlug: "concrete-contractor-website-design-seo-aeo-geo",
    headline: "A concrete website built around visual proof and estimate requests.",
    subhead:
      "Concrete buyers need to see services, finish quality, local proof, and a fast mobile request path before they call.",
    metaDescription:
      "Concrete contractor website preview page showing the Cornerstone Concrete sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/cornerstone-concrete",
      name: "Cornerstone Concrete",
      description: "Dedicated concrete contractor sample for driveways, patios, slabs, repairs, and estimate requests.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Concrete crew preparing a residential slab form",
    accent: "#737373",
    proofPoints: ["Driveways, patios, slabs, repairs, and masonry need separate service paths.", "Before-and-after proof matters because the finish is the product.", "Quote CTAs should be easy to reach from a phone."],
  },
  {
    slug: "electrician",
    displayName: "Electrician",
    articleSlug: "electrician-website-design-seo-aeo-geo",
    headline: "An electrician website built around trust, safety, and urgent calls.",
    subhead:
      "Electrical work is bought on trust, so the page needs safety signals, emergency paths, and clear next steps for EV chargers, panels, generators, and repairs.",
    metaDescription:
      "Electrician website preview page showing the Brightwire Electric sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/brightwire-electric",
      name: "Brightwire Electric",
      description: "Dedicated electrician sample for panel work, EV chargers, troubleshooting, and urgent service paths.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Electrician working near a residential electrical panel",
    accent: "#f59e0b",
    proofPoints: ["License, insurance, and safety cues need to be impossible to miss.", "Emergency and planned-work paths should not compete.", "EV charger, panel, and generator content creates high-value service clarity."],
  },
  {
    slug: "garage-door",
    displayName: "Garage Door",
    articleSlug: "garage-door-website-design-seo-aeo-geo",
    headline: "A garage door website built for stuck-door searches.",
    subhead:
      "Garage door buyers need fast repair options, replacement clarity, service-area confidence, and a simple path when a spring breaks or a door will not open.",
    metaDescription:
      "Garage door website preview page showing the OverPro Garage Doors sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/overpro-garage-doors",
      name: "OverPro Garage Doors",
      description: "Dedicated garage door sample for springs, openers, repairs, replacement, and urgent stuck-door calls.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Modern residential garage door and driveway",
    accent: "#475569",
    proofPoints: ["Repair, spring, opener, replacement, and tune-up paths should be separate.", "Repair-versus-replace content helps visitors choose the right estimate.", "Urgent mobile CTAs matter when a car is trapped."],
  },
  {
    slug: "hvac",
    displayName: "HVAC",
    articleSlug: "hvac-website-design-seo-aeo-geo",
    headline: "An HVAC website built for service calls, installs, and tune-ups.",
    subhead:
      "HVAC demand is urgent, seasonal, and local, so the website has to make repairs, replacement quotes, and maintenance plans easy to find fast.",
    metaDescription:
      "HVAC website preview page showing the Northstar Air sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/northstar-air",
      name: "Northstar Air",
      description: "Dedicated HVAC sample for no-cool calls, repairs, maintenance, and replacement quotes.",
    },
    sampleGap: false,
    heroImage: "https://images.pexels.com/photos/32497161/pexels-photo-32497161.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&q=80",
    heroAlt: "HVAC technician inspecting an outdoor condenser unit",
    accent: "#0ea5e9",
    proofPoints: ["No-cool and no-heat requests should be visible immediately.", "Maintenance plans and replacement installs need their own paths.", "Service areas and seasonal urgency help homeowners decide quickly."],
  },
  {
    slug: "irrigation",
    displayName: "Irrigation & Sprinkler",
    articleSlug: "irrigation-sprinkler-website-design-seo-aeo-geo",
    headline: "An irrigation website built around seasonal booking.",
    subhead:
      "Sprinkler demand follows the calendar: spring start-ups, summer repairs, fall winterization, and water-saving upgrades need clear paths.",
    metaDescription:
      "Irrigation and sprinkler website preview page showing the SprinklerWorks Irrigation sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/sprinklerworks-irrigation",
      name: "SprinklerWorks Irrigation",
      description: "Dedicated irrigation sample for sprinkler repair, start-ups, winterization, and water-smart upgrades.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Lawn sprinkler watering a green yard",
    accent: "#0891b2",
    proofPoints: ["Seasonal service pages should be ready before demand spikes.", "Repair and winterization CTAs need to be clear.", "Water-saving upgrades deserve dedicated content."],
  },
  {
    slug: "landscaping",
    displayName: "Landscaping",
    articleSlug: "landscaping-website-design-seo-aeo-geo",
    headline: "A landscaping website built for recurring lawn care and project estimates.",
    subhead:
      "Landscaping websites have to convert recurring maintenance shoppers and seasonal project buyers at the same time.",
    metaDescription:
      "Landscaping website preview page showing the Greenline Landscaping sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/greenline-landscaping",
      name: "Greenline Landscaping",
      description: "Dedicated landscaping sample for lawn care, cleanups, planting, and outdoor projects.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1605117882932-f9e32b03fea9?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Freshly landscaped front yard with green lawn and planting beds",
    accent: "#65a30d",
    proofPoints: ["Recurring maintenance needs an obvious request path.", "Seasonal cleanup and project pages should be easy to scan.", "Outdoor proof and service-area clarity build confidence."],
  },
  {
    slug: "pest-control",
    displayName: "Pest Control",
    articleSlug: "pest-control-website-design-seo-aeo-geo",
    headline: "A pest control website built for emergency help and prevention plans.",
    subhead:
      "Pest control buyers need either urgent help for an active problem or a recurring protection plan for prevention.",
    metaDescription:
      "Pest control website preview page showing the Shieldline Pest Control sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/shieldline-pest-control",
      name: "Shieldline Pest Control",
      description: "Dedicated pest control sample for active pest help, recurring plans, treatment expectations, and service areas.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1586280268958-9483002d016a?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Pest control technician preparing residential treatment equipment",
    accent: "#16a34a",
    proofPoints: ["Emergency pest calls and recurring plans need different paths.", "Treatment expectations and safety notes reduce uncertainty.", "Service-area and pest-specific FAQs help people choose quickly."],
  },
  {
    slug: "plumber",
    displayName: "Plumber",
    articleSlug: "plumber-website-design-seo-aeo-geo",
    headline: "A plumbing website built for the emergency caller and the careful planner.",
    subhead:
      "A plumbing website has to win two customers at once: the panicked emergency caller and the deliberate project planner.",
    metaDescription:
      "Plumbing website preview page showing the Mainline Plumbing sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/mainline-plumbing",
      name: "Mainline Plumbing",
      description: "Dedicated plumbing sample for leaks, drains, water heaters, and urgent service paths.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1620653713380-7a34b773fef8?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Water heater and plumbing pipes in a utility room",
    accent: "#f59e0b",
    proofPoints: ["Emergency calls need one-tap contact paths.", "Water heaters, drains, leaks, and repipes should be separated.", "Trust signals matter when someone is letting a trade into their home."],
  },
  {
    slug: "pool-company",
    displayName: "Pool Company",
    articleSlug: "pool-company-website-design-seo-aeo-geo",
    headline: "A pool company website built for recurring service and visual proof.",
    subhead:
      "Pool company websites win when weekly service is easy to start and before-and-after work is easy to understand.",
    metaDescription:
      "Pool company website preview page showing the Bluewave Pools sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/bluewave-pools",
      name: "Bluewave Pools",
      description: "Dedicated pool company sample for weekly service, cleaning, repairs, inspections, and renovation estimates.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Clean backyard swimming pool and patio",
    accent: "#0284c7",
    proofPoints: ["Weekly service should be easy to request.", "Before-and-after visuals help sell builds and renovations.", "Maintenance, cleaning, repairs, and seasonal work need clear paths."],
  },
  {
    slug: "pressure-washing",
    displayName: "Pressure Washing",
    articleSlug: "pressure-washing-website-design-seo-aeo-geo",
    headline: "A pressure washing website built for fast booking and instant proof.",
    subhead:
      "Pressure washing is visual: buyers understand the value in one before-and-after, then need a fast quote path.",
    metaDescription:
      "Pressure washing website preview page showing the Brightwash Exterior Cleaning sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/brightwash-exterior-cleaning",
      name: "Brightwash Exterior Cleaning",
      description: "Dedicated pressure washing sample for house washing, driveways, soft washing, patios, and fast quotes.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Clean home exterior and driveway after exterior washing",
    accent: "#2563eb",
    proofPoints: ["Before-and-after proof should appear early.", "House washing, driveways, roofs, patios, and gutters need distinct service language.", "Quote CTAs should feel fast and low-friction."],
  },
  {
    slug: "roofing",
    displayName: "Roofing",
    articleSlug: "roofing-website-templates-seo-aeo-geo",
    headline: "A roofing website built to make estimates easy to request.",
    subhead:
      "A roofing website template only wins jobs when the words, local signals, service pages, and technical setup make it findable.",
    metaDescription:
      "Roofing website preview page showing the Ridgeline Roofing sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/ridgeline-roofing",
      name: "Ridgeline Roofing",
      description: "Dedicated roofing sample for repairs, replacement, storm damage, and inspections.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1635424824849-1b09bdcc55b1?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Roofer working on a residential shingle roof",
    accent: "#f97316",
    proofPoints: ["Repair, replacement, storm, and inspection pages need clear separation.", "Emergency and estimate CTAs should be visible on mobile.", "Service-area and project proof help homeowners trust the next step."],
  },
  {
    slug: "tree-service",
    displayName: "Tree Service",
    articleSlug: "tree-service-website-design-seo-aeo-geo",
    headline: "A tree service website built around safety, storm urgency, and estimate requests.",
    subhead:
      "Tree service buyers are weighing safety, cost, storm urgency, property risk, and whether the right crew can handle the work.",
    metaDescription:
      "Tree service website preview page showing the Canopy Tree Care sample, CTA, and SEO/AEO/GEO guide link.",
    sample: {
      route: "/templates/sample/canopy-tree-care",
      name: "Canopy Tree Care",
      description: "Dedicated tree service sample for removal, pruning, storm cleanup, stump grinding, and safety-first estimates.",
    },
    sampleGap: false,
    heroImage: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Tall trees and residential green space",
    accent: "#15803d",
    proofPoints: ["Removal, trimming, storm damage, and stump grinding need distinct pages.", "Safety and insurance language should be easy to find.", "Storm and emergency requests need call-first clarity."],
  },
] as const satisfies readonly IndustryPage[];

export const INDUSTRY_PAGE_BY_SLUG = Object.fromEntries(INDUSTRY_PAGES.map((page) => [page.slug, page])) as Record<string, IndustryPage>;
