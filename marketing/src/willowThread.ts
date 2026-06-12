import { WEBSITE_PACKAGE } from "./consts";

export const willow = {
  name: "Willow Thread",
  badge: "Sample Business",
  location: "Downtown St. Petersburg, FL",
  phoneLabel: "(727) 555-0194",
  phoneHref: "tel:+17275550194",
  email: "hello@willowthread.example",
  address: "448 Central Ave, St. Petersburg, FL 33701",
  hours: [
    "Tuesday-Friday 11am-6pm",
    "Saturday 10am-5pm",
    "Sunday 12pm-4pm",
  ],
  checkoutHref: WEBSITE_PACKAGE.ctaHref,
  heroImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=82",
  heroAlt: "Boutique clothing racks in warm natural light",
  tagline: "Small-batch clothing, easy layers, and thoughtful gifts in downtown St. Pete.",
} as const;

export const willowNav = [
  { href: "/templates/luna/boutique", label: "Home" },
  { href: "/templates/luna/boutique/collections", label: "Collections" },
  { href: "/templates/luna/boutique/about", label: "About" },
  { href: "/templates/luna/boutique/visit", label: "Visit" },
  { href: "/templates/luna/boutique/contact", label: "Contact" },
] as const;

export const willowCollections = [
  { name: "New Arrivals", price: "Weekly edits", body: "Soft sets, relaxed denim, light knits, and easy pieces chosen for Florida weather." },
  { name: "Everyday Staples", price: "Core closet", body: "Simple layers, neutral basics, and wear-again pieces that work across seasons." },
  { name: "Gifts & Accessories", price: "Under-$75 finds", body: "Small-batch jewelry, candles, scarves, cards, and pieces that feel personal." },
  { name: "Weekend Linen", price: "Warm-weather favorites", body: "Breathable dresses, button-downs, and sets for markets, brunches, and beach weekends." },
  { name: "Local Maker Shelf", price: "Rotating selection", body: "A small corner for ceramics, prints, apothecary goods, and handmade extras." },
  { name: "Styling Help", price: "Complimentary in-store", body: "Bring an occasion, a color, or one piece you love and the shop will help build around it." },
] as const;

export const willowGallery = [
  "New rack edit",
  "Gift table",
  "Linen weekend pieces",
  "Accessory tray",
  "Fitting room detail",
  "Local maker shelf",
] as const;

export const willowTrust = [
  "Clear collections before the visit",
  "Hours, location, and parking details up front",
  "Product questions and styling requests in one path",
  "Warm retail photography that immediately says boutique",
] as const;
