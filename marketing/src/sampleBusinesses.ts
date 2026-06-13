export type ServiceAreaCity = {
  city: string;
  neighborhoods: string[];
};

export type ServiceAreaInfo = {
  dma: string;
  mapLabel?: string;
  coverageCopy: string;
  cityGroups: ServiceAreaCity[];
};

export type SampleBusiness = {
  slug: string;
  systemKey: string;
  systemName: string;
  name: string;
  category: string;
  location: string;
  badge: string;
  tagline: string;
  headline: string;
  description: string;
  phoneLabel: string;
  phoneHref: string;
  email: string;
  address: string;
  hours: string[];
  heroImage: string;
  heroAlt: string;
  serviceSectionImage?: string;
  serviceSectionImageAlt?: string;
  trustSectionImage?: string;
  trustSectionImageAlt?: string;
  accent: string;
  dark: string;
  soft: string;
  nav: { href: string; label: string; page: SamplePage }[];
  servicesLabel: string;
  servicesIntro: string;
  services: { name: string; meta: string; body: string }[];
  proofLabel: string;
  proofIntro: string;
  proofItems: string[];
  aboutHeadline: string;
  aboutBody: string;
  trustHeadline?: string;
  trustIntro?: string;
  ownerSection?: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    cardTitle: string;
    cardItems: string[];
  };
  localSection?: {
    eyebrow: string;
    title: string;
    body: string;
    items: string[];
  };
  trust: string[];
  contactPrompt: string;
  proofHeadline?: string;
  contactTitle?: string;
  formTitle?: string;
  formButtonLabel?: string;
  primaryCtaLabel?: string;
  emergencyServiceNote?: string;
  financingTopics?: string[];
  financingIntro?: string;
  serviceArea?: ServiceAreaInfo;
};

export type SamplePage = "home" | "services" | "about" | "proof" | "service-area" | "contact";

const nav = (
  base: string,
  servicesLabel = "Services",
  proofLabel = "Work",
  includeServiceArea = false,
) => [
  { href: base, label: "Home", page: "home" as const },
  { href: `${base}/services`, label: servicesLabel, page: "services" as const },
  ...(includeServiceArea ? [{ href: `${base}/service-area`, label: "Service Areas", page: "service-area" as const }] : []),
  { href: `${base}/about`, label: "About", page: "about" as const },
  { href: `${base}/work`, label: proofLabel, page: "proof" as const },
  { href: `${base}/contact`, label: "Contact", page: "contact" as const },
];

export const SAMPLE_BUSINESSES: SampleBusiness[] = [
  {
    slug: "ridgeline-roofing",
    systemKey: "summit",
    systemName: "Summit",
    name: "Ridgeline Roofing",
    category: "Residential roofing",
    location: "Denver, CO",
    badge: "Sample Business",
    tagline: "Roof repair, replacement, inspections, and storm response for Denver homes.",
    headline: "Roofing built for hail season, sun, and snow.",
    description: "A direct, estimate-first roofing website for homeowners who need to understand services, service area, and next steps fast.",
    phoneLabel: "(303) 555-0198",
    phoneHref: "tel:+13035550198",
    email: "hello@ridgelineroofing.example",
    address: "Denver Metro Demo Area, Denver, CO 80202",
    hours: ["Monday-Friday 7am-6pm", "Saturday 8am-2pm", "Emergency tarping triage by request"],
    heroImage: "https://images.unsplash.com/photo-1635424824849-1b09bdcc55b1?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Roofer working on a residential shingle roof",
    accent: "#f97316",
    dark: "#172033",
    soft: "#eef2f7",
    nav: nav("/templates/sample/ridgeline-roofing", "Services", "Projects", true),
    servicesLabel: "Roofing services",
    servicesIntro: "A roofing site should separate urgent repair, planned replacement, inspection, and insurance-support paths clearly.",
    services: [
      { name: "Roof Replacement", meta: "Asphalt shingle and impact-rated options", body: "Full tear-off planning, ventilation review, material selection, and clean project communication." },
      { name: "Roof Repair", meta: "Leaks, flashing, shingles, vents", body: "Focused repairs for active leaks, lifted shingles, flashing issues, and storm-worn roof details." },
      { name: "Storm Damage", meta: "Hail and wind triage", body: "Inspection photos, temporary protection recommendations, and repair/replacement next steps." },
      { name: "Insurance Claim Support", meta: "Documentation-ready notes", body: "Clear scope notes and photo documentation for homeowner claim conversations." },
      { name: "Roof Inspections", meta: "Buying, selling, or post-storm", body: "Readable roof condition summaries with priority items and maintenance recommendations." },
      { name: "Emergency Tarping", meta: "Temporary protection", body: "Short-term protection planning when water intrusion or storm exposure needs immediate attention." },
    ],
    proofLabel: "Project signals",
    proofIntro: "Project pages should make the work feel concrete without inventing customer testimonials or results.",
    proofItems: ["Hail inspection checklist", "Shingle replacement scope", "Flashing repair detail", "Emergency tarp plan", "Ventilation review", "Final cleanup walkthrough"],
    aboutHeadline: "A roofing company presented with clear service confidence.",
    aboutBody: "Ridgeline Roofing is a fictional Denver roofing sample built around homeowner urgency: visible phone paths, service details, storm context, and straightforward estimate requests.",
    emergencyServiceNote: "Emergency roof openings and storm damage should surface a call-first action.",
    financingTopics: ["Roof replacement", "Storm-related replacement", "Major re-tile projects"],
    financingIntro: "For large jobs, this sample keeps financing language next to replacement and major repair conversations.",
    serviceArea: {
      dma: "Denver DMA",
      coverageCopy: "This service-area structure clarifies which nearby cities are supported before owners request estimates.",
      cityGroups: [
        { city: "Denver", neighborhoods: ["Downtown", "Cap Hill", "Stapleton", "Highland", "Cherry Creek"] },
        { city: "Aurora", neighborhoods: ["Aurora Central", "Skyline", "Green Valley Ranch"] },
        { city: "Lakewood", neighborhoods: ["Downtown Lakewood", "Cultural District", "Morrison"] },
        { city: "Golden", neighborhoods: ["Downtown Golden", "Foothills"] },
        { city: "Englewood", neighborhoods: ["Cherry Hills", "Littleton", "Berkley"] },
      ],
    },
    trust: ["Estimate-first conversion path", "Roofing imagery above the fold", "Service area and emergency language", "No fake reviews or unverifiable claims"],
    contactPrompt: "Tell Ridgeline what happened, what kind of roof you have, and whether there is active leaking.",
  },
  {
    slug: "greenline-landscaping",
    systemKey: "summit",
    systemName: "Summit",
    name: "Greenline Landscaping",
    category: "Landscaping and outdoor services",
    location: "Raleigh, NC",
    badge: "Sample Business",
    tagline: "Seasonal cleanups, lawn care, planting, mulch, and small hardscape projects.",
    headline: "Outdoor spaces that look cared for every week.",
    description: "A high-trust landscaping website for homeowners who want maintenance, refreshes, and clear seasonal service packages.",
    phoneLabel: "(919) 555-0137",
    phoneHref: "tel:+19195550137",
    email: "hello@greenlinelandscaping.example",
    address: "1220 Glenwood Ave, Raleigh, NC 27605",
    hours: ["Monday-Friday 8am-5pm", "Saturday estimates by appointment", "Closed Sunday"],
    heroImage: "https://images.unsplash.com/photo-1605117882932-f9e32b03fea9?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Freshly landscaped front yard with green lawn and planting beds",
    accent: "#65a30d",
    dark: "#1f2a1f",
    soft: "#f0f7ea",
    nav: nav("/templates/sample/greenline-landscaping", "Services", "Projects", true),
    servicesLabel: "Landscaping services",
    servicesIntro: "A landscaping site needs service packages, seasonal timing, and examples of curb-appeal work.",
    services: [
      { name: "Weekly Lawn Care", meta: "Mow, edge, blow", body: "Routine maintenance for tidy yards, clean walkways, and consistent curb appeal." },
      { name: "Seasonal Cleanups", meta: "Spring and fall", body: "Leaf removal, bed cleanup, pruning, and prep for the next growing season." },
      { name: "Mulch & Bed Refresh", meta: "Color and weed control", body: "Fresh mulch, sharp bed edges, and planting-bed cleanup for a quick exterior lift." },
      { name: "Planting Plans", meta: "Shrubs, flowers, privacy", body: "Simple planting recommendations for sun, shade, privacy, and low-maintenance color." },
      { name: "Small Hardscapes", meta: "Stone borders and paths", body: "Walkway refreshes, stone borders, gravel areas, and practical outdoor improvements." },
      { name: "Irrigation Checks", meta: "Coverage and repairs", body: "Basic sprinkler checks, dry-zone notes, and repair recommendations." },
    ],
    proofLabel: "Outdoor work",
    proofIntro: "Landscaping proof can show project types and seasonal moments without pretending to be real client work.",
    proofItems: ["Front bed refresh", "Lawn maintenance route", "Backyard cleanup", "Mulch install", "Stone border detail", "Seasonal planting plan"],
    aboutHeadline: "A local landscaping site with immediate service clarity.",
    aboutBody: "Greenline Landscaping is a fictional Raleigh landscaping sample built for estimate requests, seasonal service education, and fast mobile contact.",
    emergencyServiceNote: "For storm or weather events, add a visible urgent response path before quote details.",
    financingTopics: ["Major landscape refreshes", "Irrigation upgrades", "Small hardscape replacements"],
    financingIntro: "When projects are larger than routine care, this sample surfaces payment timing options alongside project-specific requests.",
    serviceArea: {
      dma: "Raleigh DMA",
      coverageCopy: "A local contractor sample should state coverage clearly so visitors can confirm service fit before reaching out.",
      cityGroups: [
        { city: "Raleigh", neighborhoods: ["North Hills", "Five Points", "Cameron Village", "Downtown"] },
        { city: "Wake Forest", neighborhoods: ["South Wake", "Eastwood", "Forestville"] },
        { city: "Cary", neighborhoods: ["Preston", "West Cary", "Briarcreek"] },
        { city: "Apex", neighborhoods: ["Summerfield", "Muirfield", "Downtown Apex"] },
        { city: "Holly Springs", neighborhoods: ["Holly Square", "East Holly", "Cedar Drive"] },
      ],
    },
    trust: ["Trade-specific hero image", "Clear service list", "Project-style visual cues", "Click-to-call and estimate paths"],
    contactPrompt: "Share your address area, yard size, and whether you need maintenance, cleanup, planting, or a project estimate.",
  },
  {
    slug: "northstar-air",
    systemKey: "summit",
    systemName: "Summit",
    name: "Northstar Air",
    category: "AC/HVAC service",
    location: "Minneapolis, MN",
    badge: "Sample Business",
    tagline: "AC repair, heating service, maintenance plans, and replacement quotes for Minneapolis homes.",
    headline: "When the house is too hot or too cold, the next step should be obvious.",
    description: "A fictional HVAC sample built around the real moments homeowners care about: no-cool calls, no-heat calls, tune-ups, installs, financing questions, and a fast request-service path.",
    phoneLabel: "(612) 555-0172",
    phoneHref: "tel:+16125550172",
    email: "service@northstarair.example",
    address: "2448 Lyndale Ave S, Minneapolis, MN 55405",
    hours: ["Monday-Friday 7:30am-6pm", "Saturday 8am-2pm", "Priority no-cool and no-heat requests by phone"],
    heroImage: "https://images.pexels.com/photos/32497161/pexels-photo-32497161.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&q=80",
    heroAlt: "HVAC technician inspecting an outdoor condenser unit for servicing and diagnostics",
    serviceSectionImage: "https://images.pexels.com/photos/6471911/pexels-photo-6471911.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1400&q=80",
    serviceSectionImageAlt: "Technician checking gauges on an outdoor AC unit during HVAC maintenance",
    trustSectionImage: "/templates/airflow-hvac-desktop.svg",
    trustSectionImageAlt: "HVAC airflow and temperature flow diagram",
    accent: "#0ea5e9",
    dark: "#0f2437",
    soft: "#eaf6fb",
    nav: nav("/templates/sample/northstar-air", "AC/HVAC Services", "Service Proof", true),
    servicesLabel: "AC/HVAC services",
    servicesIntro: "A strong HVAC website separates urgent repair, planned maintenance, replacement installs, air-quality questions, and quote requests so homeowners can choose the right next step fast.",
    services: [
      { name: "Emergency AC Service", meta: "No-cool priority path", body: "For warm air, failed cooling, or a home that cannot comfortably wait until next week. The request path asks what dispatch needs first." },
      { name: "AC Repair", meta: "Cooling diagnostics", body: "Clear help for short cycling, thermostat issues, weak airflow, uneven rooms, strange noises, and cooling systems that cannot keep up." },
      { name: "Heating Repair", meta: "Furnace and heat pump checks", body: "A calm no-heat path for ignition issues, blower problems, thermostat faults, and safety-first repair conversations." },
      { name: "Maintenance Plans", meta: "Spring and fall tune-ups", body: "Seasonal cleaning, inspection, performance checks, filter reminders, and recurring care language homeowners can understand." },
      { name: "Replacement Installs", meta: "Right-sized quote requests", body: "A practical path for aging systems, comfort problems, efficiency goals, financing questions, and replacement estimate requests." },
      { name: "Service Areas", meta: "City and neighborhood coverage", body: "Local service-area copy that helps homeowners quickly confirm whether this HVAC team works near them." },
      { name: "Indoor Air Quality", meta: "Filters, humidity, airflow", body: "Plain-language guidance for filtration, humidity, ventilation, stale rooms, dust concerns, and comfort from room to room." },
      { name: "Financing Questions", meta: "Quote-ready next step", body: "A simple inquiry path for homeowners comparing repair, replacement, payment options, and next-step timing." },
    ],
    proofLabel: "HVAC service proof",
    proofIntro: "Instead of fake testimonials, this sample shows the service situations a real HVAC website should make easy to understand: urgent comfort calls, seasonal maintenance, install estimates, and service-area clarity.",
    proofItems: ["No-cool dispatch path", "Furnace outage request", "Tune-up reminder", "Replacement quote next step", "Financing question", "Service-area confirmation"],
    aboutHeadline: "A local HVAC company homeowners can understand in one minute.",
    aboutBody: "Northstar Air is a fictional Minneapolis HVAC sample with a calm, service-first voice: what is wrong, where the homeowner is, how urgent it is, and what happens next.",
    trustHeadline: "Why homeowners would feel safe calling",
    trustIntro: "Northstar avoids vague contractor language and puts the homeowner's immediate question first: can you help, how do I ask, and what should I expect next?",
    emergencyServiceNote: "When comfort is unsafe, a direct call option should sit near the top of every important page.",
    financingTopics: ["Replacement installs", "Major repairs", "System upgrades"],
    financingIntro: "For high-cost HVAC decisions, show financing options near replacement and upgrade pathways before estimate requests.",
    serviceArea: {
      dma: "Minneapolis DMA",
      coverageCopy: "Service coverage is organized by city and neighborhood so homeowners can confirm local fit before submitting details.",
      cityGroups: [
        { city: "Minneapolis", neighborhoods: ["Downtown", "Northeast", "Southeast", "South Minneapolis", "Nicollet Island"] },
        { city: "St. Paul", neighborhoods: ["Macalester", "Summit Hill", "Summit Avenue", "West Side"] },
        { city: "Bloomington", neighborhoods: ["Normandale", "Wayzata Circle", "Eden Prairie"] },
        { city: "Edina", neighborhoods: ["Morningside", "Highlands", "West Country"] },
        { city: "Plymouth", neighborhoods: ["Meadow Ridge", "The Highlands", "Northridge"] },
      ],
    },
    ownerSection: {
      eyebrow: "Human trust",
      title: "Meet the kind of HVAC company this site is built for.",
      body: "Northstar is written like a small local HVAC team that knows a broken AC is not an abstract service category. It is a hot house, a sleeping baby, an older parent, or a workday interrupted by a system that stopped keeping up.",
      bullets: ["Plain-language repair paths", "No-pressure quote language", "Seasonal maintenance reminders", "A service form that asks what dispatch needs first"],
      cardTitle: "Sample trust language",
      cardItems: ["Local service team", "Repair and replacement guidance", "Respectful in-home communication", "No invented reviews or results"],
    },
    localSection: {
      eyebrow: "Local clarity",
      title: "Built for Minneapolis-area service calls.",
      body: "A real HVAC site should make service areas, urgent availability, maintenance plans, replacement quotes, and financing questions easy to find before someone fills out a form.",
      items: ["Minneapolis", "St. Paul", "Edina", "Bloomington", "Maple Grove", "Plymouth"],
    },
    trust: ["Clear no-cool and no-heat request paths", "Phone-forward service calls", "Maintenance and replacement options separated", "Service areas stated before the form"],
    contactPrompt: "Tell Northstar what is happening, whether comfort is currently out, your city, and whether this is repair, maintenance, replacement, or a financing question.",
    proofHeadline: "Real HVAC situations, shown without fake results.",
    contactTitle: "Tell Northstar what is happening.",
    formTitle: "Request service",
    formButtonLabel: "Request Service",
    primaryCtaLabel: "Request Service",
  },
  {
    slug: "harbor-wellness",
    systemKey: "harbor",
    systemName: "Harbor",
    name: "Harbor Wellness Clinic",
    category: "Wellness clinic",
    location: "Charleston, SC",
    badge: "Sample Business",
    tagline: "Physical therapy, mobility care, and recovery visits in a calm clinical setting.",
    headline: "Care that feels clear before the first appointment.",
    description: "A trust-first clinic website for services, appointment requests, care approach, and visit details.",
    phoneLabel: "(843) 555-0116",
    phoneHref: "tel:+18435550116",
    email: "care@harborwellness.example",
    address: "78 Queen St, Charleston, SC 29401",
    hours: ["Monday-Thursday 8am-6pm", "Friday 8am-3pm", "New patient consults by appointment"],
    heroImage: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Bright wellness clinic room with treatment table",
    accent: "#2563eb",
    dark: "#16324f",
    soft: "#eef6fb",
    nav: nav("/templates/sample/harbor-wellness", "Care", "Approach"),
    servicesLabel: "Care services",
    servicesIntro: "Medical and wellness sites should reduce anxiety with plain-language services and visit expectations.",
    services: [
      { name: "Mobility Assessment", meta: "First visit planning", body: "A structured intake to understand movement limits, pain patterns, and goals." },
      { name: "Physical Therapy", meta: "Plan-based sessions", body: "Guided therapeutic exercise and progress checks for everyday function." },
      { name: "Sports Recovery", meta: "Return-to-activity", body: "Care plans for runners, cyclists, weekend athletes, and active adults." },
      { name: "Posture & Desk Pain", meta: "Neck, back, shoulders", body: "Assessment and exercise guidance for workday discomfort and repetitive strain." },
      { name: "Balance & Strength", meta: "Confidence and stability", body: "Practical strength and balance support for daily movement." },
      { name: "Home Exercise Plans", meta: "Between-visit support", body: "Simple routines and clear instructions to continue progress outside the clinic." },
    ],
    proofLabel: "Care approach",
    proofIntro: "For a healthcare-adjacent sample, proof means process and clarity, not fake outcomes.",
    proofItems: ["Intake conversation", "Movement screen", "Plan explanation", "Home exercise handout", "Progress check", "Next-visit planning"],
    aboutHeadline: "A calm clinic website for people comparing care options.",
    aboutBody: "Harbor Wellness Clinic is a fictional sample built to show how a wellness provider can explain services, appointments, and ownership of care without overclaiming results.",
    trust: ["Plain-language care pages", "Appointment request path", "Calm clinical imagery", "No medical promises or testimonials"],
    contactPrompt: "Share what you are hoping to work on, whether this is a new issue, and your preferred appointment window.",
  },
  {
    slug: "atlas-advisory",
    systemKey: "atlas",
    systemName: "Atlas",
    name: "Atlas Advisory Group",
    category: "Business consulting",
    location: "Austin, TX",
    badge: "Sample Business",
    tagline: "Operations, growth planning, and decision support for service businesses.",
    headline: "Sharper operating decisions without another full-time hire.",
    description: "A consultant sample website with clear offers, authority, process, and consultation paths.",
    phoneLabel: "(512) 555-0161",
    phoneHref: "tel:+15125550161",
    email: "hello@atlasadvisory.example",
    address: "1101 E 6th St, Austin, TX 78702",
    hours: ["Monday-Friday 9am-5pm", "Consultations by appointment", "Remote advisory available"],
    heroImage: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Consulting team reviewing strategy in a bright office",
    accent: "#4f46e5",
    dark: "#17172f",
    soft: "#f1f2ff",
    nav: nav("/templates/sample/atlas-advisory", "Services", "Approach"),
    servicesLabel: "Advisory services",
    servicesIntro: "Professional-services sites need crisp offers, who they are for, and a low-friction consultation path.",
    services: [
      { name: "Operations Review", meta: "2-week diagnostic", body: "Map current workflows, bottlenecks, handoffs, and practical next improvements." },
      { name: "Growth Planning", meta: "Quarterly roadmap", body: "Prioritize offers, channels, team capacity, and the next moves that matter." },
      { name: "Process Documentation", meta: "SOP cleanup", body: "Turn recurring work into repeatable checklists and owner-ready operating notes." },
      { name: "Leadership Dashboards", meta: "Decision views", body: "Define the metrics and weekly views needed to manage service delivery." },
      { name: "Vendor Selection", meta: "Tool and partner support", body: "Compare options, clarify requirements, and avoid overbuying software." },
      { name: "Monthly Advisory", meta: "Retainer support", body: "Focused operating support for founders who need a steady outside view." },
    ],
    proofLabel: "Approach",
    proofIntro: "Consulting proof can show process and decision clarity without inventing client wins.",
    proofItems: ["Discovery call", "Workflow map", "Priority matrix", "Roadmap session", "Operating dashboard", "Founder handoff"],
    aboutHeadline: "A professional-services site that sells clarity, not fluff.",
    aboutBody: "Atlas Advisory Group is a fictional consulting sample built for authority, service fit, process clarity, and consultation conversion.",
    trust: ["Specific advisory offers", "Consultation-first CTA", "Process-led proof", "No fake case studies"],
    contactPrompt: "Share what kind of operating problem you are trying to solve and what decision you need to make next.",
  },
  {
    slug: "harbor-legal-group",
    systemKey: "atlas",
    systemName: "Atlas",
    name: "Harbor Legal Group",
    category: "Small law firm",
    location: "Tampa, FL",
    badge: "Sample Business",
    tagline: "Estate planning, small business counsel, contract review, and consultation-focused legal support.",
    headline: "Legal help that starts with a clear next step.",
    description: "A professional law firm sample website with practice areas, attorney story, process notes, and a consultation request path.",
    phoneLabel: "(813) 555-0194",
    phoneHref: "tel:+18135550194",
    email: "hello@harborlegal.example",
    address: "401 E Jackson St, Tampa, FL 33602",
    hours: ["Monday-Friday 9am-5pm", "Consultations by appointment", "Remote consults available"],
    heroImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Law office desk with legal books and paperwork",
    accent: "#334155",
    dark: "#121826",
    soft: "#f3f5f8",
    nav: nav("/templates/sample/harbor-legal-group", "Practice Areas", "Process", true),
    servicesLabel: "Practice areas",
    servicesIntro: "A small law firm site should help visitors understand fit, consultation steps, and how to ask for help without making guidance promises.",
    services: [
      { name: "Estate Planning", meta: "Wills and planning conversations", body: "Plain-language planning meetings for families who want documents, next steps, and responsibilities organized." },
      { name: "Small Business Counsel", meta: "Formation and owner questions", body: "Support for common business questions, operating basics, and contract-aware decisions." },
      { name: "Contract Review", meta: "Readable feedback", body: "Review conversations that help clients understand key terms, obligations, and follow-up questions." },
      { name: "Real Estate Review", meta: "Transaction documents", body: "Document review and consultation for selected real estate and closing-related questions." },
      { name: "Probate Guidance", meta: "Next-step orientation", body: "Consultations for families trying to understand required steps and document needs." },
      { name: "Consultations", meta: "Fit and next steps", body: "A short initial conversation to understand the matter and whether the firm may be a fit." },
    ],
    proofLabel: "Process",
    proofIntro: "For a legal sample, trust comes from clarity and restraint: what happens next, what to bring, and how contact works.",
    proofItems: ["Consultation request", "Conflict check note", "Document list", "Practice-area fit", "Next-step email", "Private follow-up"],
    aboutHeadline: "A law firm site that feels professional without overpromising.",
    aboutBody: "Harbor Legal Group is a fictional small law firm sample built to show practice-area clarity, attorney positioning, consultation paths, and appropriate disclaimers without invented reviews, outcomes, or guidance promises.",
    emergencyServiceNote: "For time-sensitive legal deadlines, keep a clear call-forward option and a concise intake note before scheduling.",
    financingTopics: ["Consultation payment terms", "Project-based billing structure", "Retainer planning support"],
    financingIntro: "For longer matters, this sample supports financing-style payment conversation without naming lenders or guaranteed rates.",
    serviceArea: {
      dma: "Tampa DMA",
      coverageCopy: "A legal practice can still include local service clarity so prospects can confirm where office-style assistance is offered.",
      cityGroups: [
        { city: "Tampa", neighborhoods: ["Hyde Park", "Ybor City", "Channelside", "Downtown", "Carrollwood"] },
        { city: "St. Petersburg", neighborhoods: ["Downtown St. Pete", "Grand Central", "Lakewood"] },
        { city: "Clearwater", neighborhoods: ["Tierra Verde", "Dunedin", "Moss Park"] },
        { city: "Sarasota", neighborhoods: ["North Sarasota", "Gulf Gate", "Downtown Sarasota"] },
      ],
    },
    trust: ["Practice-area cards", "Consultation-first CTA", "Professional legal tone", "No fake results or testimonials"],
    contactPrompt: "Share the practice area, a short description of the question, and the best way to contact you. This sample form does not create an attorney-client relationship.",
  },
  {
    slug: "table-and-hearth",
    systemKey: "ember",
    systemName: "Ember",
    name: "Table & Hearth",
    category: "Neighborhood restaurant",
    location: "Savannah, GA",
    badge: "Sample Business",
    tagline: "Wood-fired plates, seasonal sides, and relaxed dinners near Forsyth Park.",
    headline: "A warm table for weeknights and small celebrations.",
    description: "A restaurant sample website with menu highlights, hours, private-event inquiries, and clear visit paths.",
    phoneLabel: "(912) 555-0142",
    phoneHref: "tel:+19125550142",
    email: "hello@tableandhearth.example",
    address: "214 Whitaker St, Savannah, GA 31401",
    hours: ["Tuesday-Thursday 5pm-9pm", "Friday-Saturday 5pm-10pm", "Sunday brunch 10am-2pm"],
    heroImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Warm restaurant table with plated food and wine glasses",
    accent: "#d97706",
    dark: "#301a12",
    soft: "#fff3e0",
    nav: nav("/templates/sample/table-and-hearth", "Menu", "Events"),
    servicesLabel: "Menu highlights",
    servicesIntro: "Restaurants need menu clarity, hours, atmosphere, and a path for reservations or private-event questions.",
    services: [
      { name: "Wood-Fired Chicken", meta: "$28", body: "Herb-roasted chicken, charred lemon, pan jus, and seasonal greens." },
      { name: "Market Flatbread", meta: "$18", body: "Seasonal vegetables, whipped ricotta, herbs, and a crisp hearth crust." },
      { name: "Coastal Fish", meta: "$32", body: "Daily fish preparation with bright sides and simple sauces." },
      { name: "Hearth Burger", meta: "$19", body: "Double patty, smoked cheddar, onion jam, and house pickles." },
      { name: "Sunday Brunch", meta: "10am-2pm", body: "Egg dishes, pastries, coffee, and low-key weekend plates." },
      { name: "Private Table", meta: "Small groups", body: "Family-style menu planning for small celebrations and team dinners." },
    ],
    proofLabel: "Dining moments",
    proofIntro: "Food sites should make the experience tangible without fake reviews.",
    proofItems: ["Dinner service", "Sunday brunch", "Private table", "Seasonal side", "Wine corner", "Open kitchen detail"],
    aboutHeadline: "A restaurant sample built around atmosphere and action.",
    aboutBody: "Table & Hearth is a fictional restaurant sample that shows menu, hours, location, and gathering inquiries in a warm local voice.",
    trust: ["Menu-first structure", "Hours and location up front", "Event inquiry path", "No fake diner reviews"],
    contactPrompt: "Ask about a table, private dinner, menu question, or event date.",
  },
  {
    slug: "mainline-plumbing",
    systemKey: "foundry",
    systemName: "Foundry",
    name: "Mainline Plumbing",
    category: "Plumbing service",
    location: "Columbus, OH",
    badge: "Sample Business",
    tagline: "Leak repair, drain clearing, water heaters, fixture installs, and service calls.",
    headline: "Plumbing help with the problem stated plainly.",
    description: "A trades website built around urgency, service categories, phone contact, and practical next steps.",
    phoneLabel: "(614) 555-0184",
    phoneHref: "tel:+16145550184",
    email: "service@mainlineplumbing.example",
    address: "780 N High St, Columbus, OH 43215",
    hours: ["Monday-Friday 7am-6pm", "Saturday 8am-1pm", "Priority calls by phone"],
    heroImage: "https://images.unsplash.com/photo-1620653713380-7a34b773fef8?auto=format&fit=crop&w=1400&q=82",
    heroAlt: "Water heater and plumbing pipes in a utility room",
    accent: "#f59e0b",
    dark: "#202124",
    soft: "#f5f3ef",
    nav: nav("/templates/sample/mainline-plumbing", "Services", "Work", true),
    servicesLabel: "Plumbing services",
    servicesIntro: "A plumbing site needs urgent categories, clear service scope, and strong phone-first conversion.",
    services: [
      { name: "Leak Repair", meta: "Kitchen, bath, utility", body: "Find and repair visible leaks, fixture leaks, and common supply-line issues." },
      { name: "Drain Clearing", meta: "Slow or blocked drains", body: "Service for sinks, tubs, showers, and main-line symptoms with practical next steps." },
      { name: "Water Heaters", meta: "Repair and replacement", body: "Troubleshooting, replacement planning, and maintenance for tank water heaters." },
      { name: "Fixture Installs", meta: "Faucets and toilets", body: "Replace faucets, toilets, disposals, and basic fixtures cleanly and correctly." },
      { name: "Sump Pumps", meta: "Basement protection", body: "Pump replacement, float checks, and backup recommendations." },
      { name: "Inspection Notes", meta: "Homeowner clarity", body: "Plain-language summaries for observed issues and recommended priorities." },
    ],
    proofLabel: "Service scenarios",
    proofIntro: "Trades proof works best as concrete scenarios and process notes, not fake customer stories.",
    proofItems: ["Utility room repair", "Water heater replacement", "Kitchen faucet install", "Clogged drain call", "Basement pump check", "Service truck checklist"],
    aboutHeadline: "A no-nonsense plumbing site for urgent service calls.",
    aboutBody: "Mainline Plumbing is a fictional trades sample built to show how service categories, urgency, and contact paths can be clear within seconds.",
    emergencyServiceNote: "For active water loss or backups, make the call-to-ask-now path visible before all other options.",
    financingTopics: ["Water heater replacement", "Whole-home repipe planning", "Pump and system upgrades"],
    financingIntro: "For larger plumbing projects, this sample places financing discussion inside the service request path for transparency.",
    serviceArea: {
      dma: "Columbus DMA",
      coverageCopy: "A trade-style sample should communicate neighborhood and city coverage plainly so callers can confirm if a visit is in scope.",
      cityGroups: [
        { city: "Columbus", neighborhoods: ["Short North", "German Village", "Clintonville", "Bexley", "Worthington"] },
        { city: "Dublin", neighborhoods: ["Bridgeport", "Woodruff Farm", "Dublin Heights"] },
        { city: "Worthington", neighborhoods: ["Kessler", "Oakridge", "North Ridge"] },
        { city: "Grove City", neighborhoods: ["Morse Crossing", "South Grove", "Riverside"] },
      ],
    },
    trust: ["Phone-forward repair CTA", "Specific service menu", "Industrial visual style", "No fake emergency claims"],
    contactPrompt: "Tell Mainline where the plumbing issue is, what changed, and whether water is actively leaking.",
  },
];

export const SAMPLE_BUSINESS_BY_SLUG = Object.fromEntries(SAMPLE_BUSINESSES.map((business) => [business.slug, business])) as Record<string, SampleBusiness>;

export const samplePath = (business: SampleBusiness, page: SamplePage = "home") => {
  const base = `/templates/sample/${business.slug}`;
  if (page === "home") return base;
  if (page === "proof") return `${base}/work`;
  return `${base}/${page}`;
};
