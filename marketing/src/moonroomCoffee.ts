import { WEBSITE_PACKAGE } from "./consts";

export const moonroom = {
  name: "Moonroom Coffee",
  badge: "Sample Business",
  location: "Seminole Heights · Tampa, FL",
  phoneLabel: "(813) 555-0186",
  phoneHref: "tel:+18135550186",
  email: "hello@moonroomcoffee.example",
  address: "5208 N Florida Ave, Tampa, FL 33603",
  hours: [
    "Monday-Friday 7am-3pm",
    "Saturday 8am-4pm",
    "Sunday 8am-2pm",
  ],
  checkoutHref: WEBSITE_PACKAGE.ctaHref,
  heroImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=82",
  heroAlt: "Barista pouring latte art at a warm neighborhood coffee bar",
  tagline: "Small-batch coffee, morning pastries, and soft-lit tables in Seminole Heights.",
} as const;

export const moonroomNav = [
  { href: "/templates/luna/coffee-shop", label: "Home" },
  { href: "/templates/luna/coffee-shop/menu", label: "Menu" },
  { href: "/templates/luna/coffee-shop/about", label: "About" },
  { href: "/templates/luna/coffee-shop/events", label: "Events" },
  { href: "/templates/luna/coffee-shop/contact", label: "Contact" },
] as const;

export const moonroomMenu = [
  { name: "Moonroom Latte", price: "$5.75", body: "House espresso, steamed milk, vanilla-cardamom syrup, and a quiet finish." },
  { name: "Orange Blossom Cold Brew", price: "$5.25", body: "Slow-steeped cold brew with citrus peel, brown sugar, and a splash of cream." },
  { name: "Honey Oat Cortado", price: "$4.85", body: "A short, balanced espresso drink with oat milk and local honey." },
  { name: "Midnight Mocha", price: "$5.95", body: "Dark cocoa, espresso, milk, and sea salt for a not-too-sweet mocha." },
  { name: "Butter Croissant", price: "$4.50", body: "Flaky morning pastry warmed to order while supplies last." },
  { name: "Citrus Olive Oil Loaf", price: "$4.25", body: "Bright, tender slice made for slow mornings and second coffees." },
] as const;

export const moonroomFeatured = [
  { img: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80", caption: "House espresso bar" },
  { img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80", caption: "Seasonal cold brew" },
  { img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80", caption: "Morning pastry case" },
  { img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80", caption: "Window seats and work tables" },
  { img: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80", caption: "Weekend makers pop-ups" },
  { img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=80", caption: "Coffee boxes for small teams" },
] as const;

export const moonroomEvents = [
  { title: "Saturday Vinyl Mornings", body: "A slow-start playlist, limited pastry batch, and extra seating from 9am to noon." },
  { title: "Neighborhood Maker Table", body: "A rotating weekend table for candles, prints, flowers, and small local goods." },
  { title: "Office Coffee Boxes", body: "Batch brew, cups, milk, sweeteners, and pastry add-ons for small team mornings." },
] as const;

export const moonroomTrust = [
  "Menu and hours visible before the visit",
  "Clear directions and neighborhood context",
  "Event and catering inquiry path",
  "Warm photography that immediately says coffee shop",
] as const;
