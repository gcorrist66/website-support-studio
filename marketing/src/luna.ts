export type LunaVariantKey = "salon" | "coffee-shop" | "boutique";

export const lunaDesignLanguage = {
  name: "Luna",
  thesis: "A warm, image-led design system for businesses where atmosphere matters before the first click.",
  personality: "Elegant, warm, stylish, intimate, and quietly premium.",
  visualStyle:
    "Soft contrast, editorial photography, rounded cards, refined spacing, warm neutrals, restrained accent color, and calm conversion paths.",
  staysConsistent: [
    "Editorial hero with a large atmospheric image",
    "Warm ivory background with soft card surfaces",
    "Rounded image panels and intimate spacing",
    "Service/menu/collection cards with short descriptive copy",
    "Gallery strip for visual proof without fake testimonials",
    "Clear primary CTA plus secondary visit/contact action",
  ],
  changesByBusiness: [
    "Hero headline and offer language",
    "Primary CTA label and destination",
    "Service, menu, or collection taxonomy",
    "Hours/location emphasis",
    "Photography subject matter",
    "Microcopy around appointments, ordering, or shopping",
  ],
} as const;

export const lunaVariants = {
  salon: {
    key: "salon",
    name: "Luna Salon",
    businessName: "Marigold & Mane",
    eyebrow: "Luna design system · salon adaptation",
    disclosure: "Demo website · Fictional salon adaptation",
    title: "Soft, modern hair appointments without the phone tag.",
    description:
      "A Luna salon variant for services, stylist introductions, appointment calls to action, and a portfolio-style gallery.",
    primaryCta: "Book a Style Consult",
    secondaryCta: "View Services",
    contactCta: "Request Appointment",
    phone: "tel:+18135550124",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=82",
    imageAlt: "Warm salon interior with styling chairs and mirrors",
    accent: "#c46f6a",
    dark: "#3c2524",
    soft: "#f8ebe7",
    audience: "Clients looking for color, cuts, blowouts, and event styling in a calm neighborhood salon.",
    sectionsLabel: "Signature services",
    items: [
      { title: "Dimensional Color", body: "Balayage, glossing, and color refreshes with clear maintenance guidance." },
      { title: "Cuts & Styling", body: "Shape-focused cuts, blowouts, and finish work for everyday wearability." },
      { title: "Event Hair", body: "Soft updos and polished styling for weddings, photos, and special evenings." },
    ],
    gallery: ["Color refresh", "Soft layers", "Event styling", "Quiet salon room"],
    trustPoints: ["Transparent service menu", "Appointment-first CTA", "Portfolio-ready gallery", "Hours and location block"],
    formLabel: "Appointment request",
    formFields: ["Preferred service", "Preferred day", "Hair goal"],
  },
  "coffee-shop": {
    key: "coffee-shop",
    name: "Luna Coffee Shop",
    businessName: "Moonroom Coffee",
    eyebrow: "Luna design system · coffee shop adaptation",
    disclosure: "Demo website · Fictional coffee shop adaptation",
    title: "A neighborhood coffee room for slow mornings and quick stops.",
    description:
      "A Luna coffee shop variant for menu highlights, hours, location, events, and visit-focused calls to action.",
    primaryCta: "View Today's Menu",
    secondaryCta: "Get Directions",
    contactCta: "Ask About Catering",
    phone: "tel:+18135550135",
    image:
      "https://images.unsplash.com/photo-1551529563-fce9529e67ac?auto=format&fit=crop&w=1400&q=82",
    imageAlt: "Coffee shop counter with warm lighting and menu boards",
    accent: "#a66a3f",
    dark: "#33241c",
    soft: "#f7eee3",
    audience: "Neighbors, commuters, students, and small groups looking for coffee, pastries, and a comfortable place to meet.",
    sectionsLabel: "Menu highlights",
    items: [
      { title: "House Espresso", body: "Balanced espresso drinks, seasonal syrups, and classic milk options." },
      { title: "Pastry Case", body: "Morning pastries, quick snacks, and rotating local bakery features." },
      { title: "Events & Catering", body: "Small gathering trays, office coffee boxes, and weekend community events." },
    ],
    gallery: ["Latte bar", "Pastry case", "Window seating", "Weekend event"],
    trustPoints: ["Menu-first structure", "Hours and directions", "Catering inquiry CTA", "Neighborhood story section"],
    formLabel: "Catering or event inquiry",
    formFields: ["Event type", "Pickup date", "Guest count"],
  },
  boutique: {
    key: "boutique",
    name: "Luna Boutique",
    businessName: "Willow Thread",
    eyebrow: "Luna design system · boutique adaptation",
    disclosure: "Demo website · Fictional boutique adaptation",
    title: "Small-batch pieces, styled for everyday ease.",
    description:
      "A Luna boutique variant for collections, product previews, shop visits, and local shopping calls to action.",
    primaryCta: "Shop New Arrivals",
    secondaryCta: "Plan Your Visit",
    contactCta: "Ask About Sizing",
    phone: "tel:+18135550146",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=82",
    imageAlt: "Boutique clothing racks with soft natural light",
    accent: "#8f6c8f",
    dark: "#2d2430",
    soft: "#f3ebf4",
    audience: "Local shoppers looking for curated clothing, gifts, seasonal collections, and helpful in-store styling.",
    sectionsLabel: "Featured collections",
    items: [
      { title: "New Arrivals", body: "Fresh seasonal pieces, limited quantities, and easy outfit pairings." },
      { title: "Everyday Staples", body: "Soft knits, denim, simple layers, and pieces that work across seasons." },
      { title: "Gifts & Accessories", body: "Small-batch jewelry, candles, bags, and thoughtful local finds." },
    ],
    gallery: ["New rack", "Accessory table", "Fitting room", "Gift corner"],
    trustPoints: ["Collection-first layout", "Visit and hours CTA", "Product preview sections", "Local shopping language"],
    formLabel: "Product question",
    formFields: ["Item or collection", "Size/color", "Pickup timing"],
  },
} as const;

export const lunaVariantList = [lunaVariants.salon, lunaVariants["coffee-shop"], lunaVariants.boutique] as const;
