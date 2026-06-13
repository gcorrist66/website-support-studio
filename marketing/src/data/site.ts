export type Service = {
  title: string;
  summary: string;
  duration: string;
  price: string;
};

export type NavItem = {
  label: string;
  path: string;
};

export const siteConfig = {
  siteUrl: "https://www.example.com",
  businessName: "MH Electrical and Solar",
  siteName: "MH Electrical & Solar",
  legalName: "MH Electrical and Solar",
  category: "Electrician",
  city: "Denver",
  state: "CO",
  country: "US",
  tagLine: "Electrician services in Denver, CO",
  description:
    "MH Electrical and Solar is an electrician serving Denver, CO with a focus on clear, reliable service communication.",
  ratingValue: "5.0",
  reviewCount: 85,
  googleBusinessProfileSearchUrl: "https://www.google.com/maps/search/?api=1&query=MH%20Electrical%20and%20Solar%20Denver%2C%20CO",
  verified: {
    facts: [
      "Business: MH Electrical and Solar",
      "City/State: Denver, CO",
      "Category: Electrician",
      "Rating: 5.0",
      "Review count: 85"
    ]
  }
};

export const navItems: NavItem[] = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "Gallery", path: "/gallery" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" }
];

export const featuredServices: Service[] = [
  {
    title: "Residential Electrical Services",
    summary: "Share your details for a clear estimate and practical project planning.",
    duration: "Varies",
    price: "Quote on request"
  },
  {
    title: "Commercial and Home Rewiring Support",
    summary: "Work is planned with straightforward communication and project-oriented updates.",
    duration: "Varies",
    price: "Quote on request"
  },
  {
    title: "Electrical Troubleshooting",
    summary: "Review notes with clear next-step recommendations and timeline expectations.",
    duration: "Varies",
    price: "Quote on request"
  }
];

export const serviceCatalog = [
  {
    title: "Electrical Panel Services",
    summary: "Service-focused electrical assessment and panel-related coordination.",
    duration: "Varies",
    price: "Quote on request"
  },
  {
    title: "Lighting and Outlet Updates",
    summary: "Project-first support for reliability and installation planning.",
    duration: "Varies",
    price: "Quote on request"
  },
  {
    title: "Small Solar-Ready Upgrades",
    summary: "Planning support for solar-ready electrical prep and related inspection readiness.",
    duration: "Varies",
    price: "Quote on request"
  },
  {
    title: "Maintenance and Safety Checks",
    summary: "Routine review of electrical systems with a practical action list.",
    duration: "Varies",
    price: "Quote on request"
  },
  {
    title: "Outdoor and External Lighting",
    summary: "Clear options for outdoor electrical reliability and protection.",
    duration: "Varies",
    price: "Quote on request"
  },
  {
    title: "Commercial Electrical Consultation",
    summary: "Initial consultation for larger work including timeline, materials, and coordination.",
    duration: "Varies",
    price: "Quote on request"
  }
];

export const galleryHighlights = [
  "Panel board layout review for a commercial project",
  "Lighting circuit organization and documentation",
  "Outdoor outlet and fixture planning scenario",
  "Residential electrical pre-inspection planning items",
  "Solar-ready electrical planning sequence",
  "Service timeline and handoff template"
];
