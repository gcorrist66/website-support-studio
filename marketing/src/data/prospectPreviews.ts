import type { SiteConfig, Service } from "./site";

export type DesignSystem = "lead-generation" | "modern-local";

export type ProspectPreviewConfig = SiteConfig & {
  slug: string;
  shortName: string;
  designSystem: DesignSystem;
  phone: string;
  emergencyHeadline?: string;
  emergencyCopy?: string;
  callFirstActions?: {
    label: string;
    href: string;
    variant?: "default" | "primary" | "accent";
  }[];
  homepageLead: string;
  homepageLeadCopy: string;
  sectionCopy: {
    conversionTitle: string;
    conversionCopy: string;
    mobileTitle: string;
    mobileCopy: string;
    wssSectionTitle: string;
    wssSectionCopy: string;
  };
  closingSection: {
    title: string;
    copy: string;
    primary: {
      label: string;
      href: string;
    };
    secondary?: {
      label: string;
      href: string;
    };
  };
  leadConversionBlocks?: string[];
  conversionChecklist?: string[];
  proofBar?: string[];
  reviewWall?: {
    author: string;
    quote: string;
    rating: string;
    context: string;
  }[];
  ownerStory?: {
    name: string;
    title: string;
    outcome: string;
    quote: string;
  };
  localTrustHierarchy?: string[];
  beforeAfterGallery?: {
    title: string;
    before: string;
    after: string;
  }[];
  servicesTitle: string;
  servicesLead: string;
  serviceCatalog: Service[];
  servicesHowToBook: string;
  servicesSupportCopy: string;
  aboutHeadline: string;
  aboutSummary: string;
  aboutCards: string[];
  galleryTitle: string;
  galleryLead: string;
  galleryItems: string[];
  contactSummary: string;
  contactNotesLabel: string;
  contactVisit: string;
};

const authenticAirSolutions: ProspectPreviewConfig = {
  slug: "authentic-air-solutions",
  shortName: "Authentic Air Solutions",
  phone: "(555) 219-0145",
  businessName: "Authentic Air Solutions",
  siteName: "Authentic Air Solutions",
  legalName: "Authentic Air Solutions LLC",
  siteUrl: "https://previews.websitesupportstudio.com",
  category: "Air Conditioning Service",
  city: "Your Service Area",
  state: "US",
  country: "US",
  tagLine: "Lead-ready local HVAC support and comfort confidence",
  description:
    "Authentic Air Solutions helps homeowners turn urgent HVAC needs into confident next-step actions.",
  ratingValue: "4.9",
  reviewCount: 94,
  googleBusinessProfileSearchUrl: "https://maps.google.com/maps?q=Authentic+Air+Solutions",
  verified: {
    facts: [
      "Business: Authentic Air Solutions",
      "Category: Air Conditioning Service",
      "Tagline: Lead-ready local HVAC support and comfort confidence",
      "Status: Lead-generation-first homepage and conversion flow"
    ]
  },
  designSystem: "lead-generation",
  emergencyHeadline: "24/7 Emergency HVAC Response",
  emergencyCopy:
    "If your AC or heat is failing, we treat this as priority traffic and move you directly to the right next step.",
  callFirstActions: [
    {
      label: "Call now: (555) 219-0145",
      href: "tel:+15552190145",
      variant: "primary"
    },
    {
      label: "Request same-day callback",
      href: "#service-request",
      variant: "accent"
    },
    {
      label: "See what we fix first",
      href: "#conversion-path"
    }
  ],
  homepageLead: "Get faster comfort repairs with clearer next steps",
  homepageLeadCopy:
    "This version is built to reduce bounce points and move visitors straight into a service request, estimate, or callback path.",
  sectionCopy: {
    conversionTitle: "Lead-generation flow",
    conversionCopy:
      "Primary call-to-action pathways are repeated on hero, service overview, and contact points to remove uncertainty for urgent users.",
    mobileTitle: "Mobile-ready actions",
    mobileCopy:
      "Sticky-style navigation and touch-first cards keep request paths visible on smaller screens where urgency is highest.",
    wssSectionTitle: "Emergency routing clarity",
    wssSectionCopy:
      "Urgent AC and heating failures move straight to call, callback, or request steps with no internal workflow text in the owner-facing path.",
  },
  closingSection: {
    title: "Call now and confirm your next step",
    copy:
      "Lead-generation flow closes with one clear call action so urgent comfort issues can continue into direct scheduling immediately.",
    primary: {
      label: "Call now",
      href: "tel:+15552190145"
    },
    secondary: {
      label: "Open urgent request form",
      href: "#service-request"
    }
  },
  leadConversionBlocks: [
    "Call first, then route to the right technician for hot/cold complaints.",
    "Quick triage questions confirm urgency, location, and access constraints.",
    "Single-click callback scheduling gets owners on the phone before repair windows close.",
    "Service estimate arrives quickly with clear timing and next-step options."
  ],
  conversionChecklist: [
    "Air handler no cooling after hours",
    "High humidity or no heat alarms",
    "Frequent compressor short-cycling",
    "Strange odors or unusual noise"
  ],
  servicesTitle: "Service details and comfort support pathways",
  servicesLead: "Pricing and timing are available once the service details are confirmed.",
  serviceCatalog: [
    {
      title: "Emergency HVAC Response",
      summary: "Fast intake path for high-urgency cooling or heating requests.",
      duration: "Varies",
      price: "Quote on request"
    },
    {
      title: "Annual Preventive Maintenance",
      summary: "Inspection-driven checklists with clear follow-up actions.",
      duration: "Varies",
      price: "Quote on request"
    },
    {
      title: "System Tune-ups and Comfort Audits",
      summary: "Clear service recommendations with practical timing options.",
      duration: "Varies",
      price: "Quote on request"
    }
  ],
  servicesHowToBook:
    "Use the request form with service type, urgency, and access notes. A team member follows up with the next step and schedule options.",
  servicesSupportCopy:
    "The service page is structured to move from need to confirmation quickly, with reduced field burden and direct request flow.",
  aboutHeadline: "About Authentic Air Solutions",
  aboutSummary:
    "Authentic Air Solutions is presented as a local HVAC-focused comfort service in the service area.",
  aboutCards: [
    "Rating is 4.9 with strong review momentum in the review queue.",
    "Project details are clarified during booking and pre-visit planning.",
    "Users can submit location, access constraints, and preferred timing directly in the request form."
  ],
  galleryTitle: "Service planning snapshots",
  galleryLead:
    "These examples show planning and service flow context for a lead-first conversion site and stay aligned to approved real project visuals.",
  galleryItems: [
    "Urgent callout and next-step guidance",
    "Comfort request capture flow",
    "Mobile request panel",
    "Proof stack and local trust anchors",
    "After-hours callback pathway",
    "Service area confidence section"
  ],
  contactSummary:
    "Share service type, timeline, and property access details to get a prioritized response path.",
  contactNotesLabel: "Project notes",
  contactVisit: "Service area and response windows are captured in the request form above."
};

const consistentAc: ProspectPreviewConfig = {
  slug: "consistent-ac",
  shortName: "Consistent AC",
  phone: "(555) 224-0081",
  businessName: "Consistent AC",
  siteName: "Consistent AC",
  legalName: "Consistent AC",
  siteUrl: "https://previews.websitesupportstudio.com",
  category: "AC Repair & Maintenance",
  city: "Your Service Area",
  state: "US",
  country: "US",
  tagLine: "Modern local HVAC homepage tuned for first-response conversions",
  description:
    "Consistent AC presents a local-first service path with review-friendly social proof and fast mobile access.",
  ratingValue: "4.8",
  reviewCount: 118,
  googleBusinessProfileSearchUrl: "https://maps.google.com/maps?q=Consistent+AC",
  verified: {
    facts: [
      "Business: Consistent AC",
      "Category: AC Repair & Maintenance",
      "Tagline: Modern local HVAC homepage tuned for first-response conversions",
      "Status: Local homepage optimization pass"
    ]
  },
  designSystem: "modern-local",
  emergencyHeadline: "Service team on call when it matters most",
  emergencyCopy:
    "Trust-first service pages keep local customers clear on who will respond, what happens next, and how quickly.",
  callFirstActions: [
    {
      label: "Call to book service",
      href: "tel:+15552240081",
      variant: "primary"
    },
  {
    label: "Open estimate request",
      href: "/contact",
      variant: "accent"
    }
  ],
  homepageLead: "Consistent comfort starts with clear local proof and a direct request path",
  homepageLeadCopy:
    "This experience emphasizes local credibility blocks, map-ready trust signals, and clear utility-first call-to-actions.",
  sectionCopy: {
    conversionTitle: "Conversion with local trust",
    conversionCopy:
      "Primary actions are paired with local context so users can quickly choose urgency, schedule window, and location confirmation.",
    mobileTitle: "Local service at mobile speed",
    mobileCopy:
      "Card-based structure and compact fields keep service capture simple on phones where high-intent users often arrive.",
    wssSectionTitle: "Local trust checkpoints",
    wssSectionCopy:
      "Trust and proximity signals stay visible as users move from first click to scheduling.",
  },
  closingSection: {
    title: "Stay local. Stay in control.",
    copy:
      "Modern-local close emphasizes trust, neighborhood familiarity, and a smooth path to schedule your next service action.",
    primary: {
      label: "Start local service request",
      href: "/contact"
    },
    secondary: {
      label: "See service areas near you",
      href: "#conversion-path"
    }
  },
  proofBar: [
    "Service in 5.2 miles radius",
    "4.8★ average in 118 verified reviews",
    "Response follow-up within 45 minutes",
    "Veteran-trained field team"
  ],
  ownerStory: {
    name: "Maya Collins",
    title: "Owner, Consistent AC",
    quote:
      "Our team shows up on time, explains every step, and leaves customers with a clear path to keep their home comfortable all season.",
    outcome: "95% of maintenance requests were scheduled within one call."
  },
  reviewWall: [
    {
      author: "Jordan P.",
      quote:
        "Booked a diagnostic on a Sunday and got a clear repair timeline the next morning. Communication was excellent.",
      rating: "5.0",
      context: "Emergency support"
    },
    {
      author: "Priya M.",
      quote:
        "The team showed up in uniform, reviewed the diagnosis, and walked our family through each option before work began.",
      rating: "5.0",
      context: "Seasonal tune-up"
    },
    {
      author: "Calvin R.",
      quote:
        "Cleaner website experience and better trust signals. We felt confident moving forward immediately.",
      rating: "4.9",
      context: "First-time customer"
    }
  ],
  localTrustHierarchy: [
    "Neighborhood-first dispatch",
    "Technicians trained in local building codes",
    "Real-time SMS updates during each visit",
    "Post-service checklist delivered for every job"
  ],
  beforeAfterGallery: [
    {
      title: "Service Entry",
      before: "No call priority, unclear timing",
      after: "Direct emergency routing and clear ETA"
    },
    {
      title: "Customer Update",
      before: "Single text, no context",
      after: "Photo-first status with simple status milestones"
    },
    {
      title: "Completion",
      before: "No recap, no closure",
      after: "Finish summary, care reminders, and next maintenance step"
    }
  ],
  servicesTitle: "Services, outcomes, and next steps",
  servicesLead: "Price and date details are confirmed after service scope is captured.",
  serviceCatalog: [
    {
      title: "AC Repair",
      summary: "Service-first intake with clear follow-up for broken or reduced performance systems.",
      duration: "Varies",
      price: "Quote on request"
    },
    {
      title: "Routine AC Tune-up",
      summary: "Preventive maintenance flow with a simple reporting checklist.",
      duration: "Varies",
      price: "Quote on request"
    },
    {
      title: "AC Installation Advice",
      summary: "Structured recommendation stage for replacement and efficiency decisions.",
      duration: "Varies",
      price: "Quote on request"
    }
  ],
  servicesHowToBook:
    "Submit your request in the form, including system age, issue urgency, and property access notes. A response plan follows quickly.",
  servicesSupportCopy:
    "Service content stays concise so visitors can move from concern to request in one flow, with local context retained.",
  aboutHeadline: "About Consistent AC",
  aboutSummary:
    "Consistent AC is positioned as a modern local HVAC partner focused on clear next steps and predictable follow-up.",
  aboutCards: [
    "Review score appears alongside service urgency so trust is visible where users decide.",
    "Field collection keeps the intake process short while still capturing what dispatch teams need.",
    "Local signals are aligned with service category and city-level context."
  ],
  galleryTitle: "Service context cards",
  galleryLead:
    "Gallery content supports the conversion flow with visual proof placeholders; swap with approved, real field photos when sourcing is complete.",
  galleryItems: [
    "Service zone map context",
    "Pre-service checklist section",
    "Emergency response path",
    "Before-response guidance",
    "Dispatcher handoff summary",
    "Customer update checkpoints"
  ],
  contactSummary:
    "Tell us about unit symptoms, service timing, and access to schedule the right route within the day.",
  contactNotesLabel: "Request notes",
  contactVisit: "Service area, urgency, and property access are captured in the request form above."
};

export const previewProspects: ProspectPreviewConfig[] = [
  authenticAirSolutions,
  consistentAc
];

export function getProspectConfig(slug: string): ProspectPreviewConfig | undefined {
  return previewProspects.find((entry) => entry.slug === slug);
}
