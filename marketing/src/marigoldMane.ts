import { WEBSITE_PACKAGE } from "./consts";

export const marigold = {
  name: "Marigold & Mane",
  badge: "Sample Business",
  location: "Hyde Park · Tampa, FL",
  phoneLabel: "(813) 555-0148",
  phoneHref: "tel:+18135550148",
  email: "hello@marigoldandmane.example",
  address: "1618 W Swann Ave, Tampa, FL 33606",
  hours: [
    "Tuesday 10am-6pm",
    "Wednesday 10am-6pm",
    "Thursday 11am-7pm",
    "Friday 10am-6pm",
    "Saturday 9am-3pm",
  ],
  checkoutHref: WEBSITE_PACKAGE.ctaHref,
  heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=82",
  heroAlt: "Warm salon interior with styling chairs and mirrors",
  tagline: "Soft color, lived-in cuts, and calm appointments in Hyde Park.",
} as const;

export const marigoldNav = [
  { href: "/templates/luna/salon", label: "Home" },
  { href: "/templates/luna/salon/services", label: "Services" },
  { href: "/templates/luna/salon/gallery", label: "Gallery" },
  { href: "/templates/luna/salon/about", label: "About" },
  { href: "/templates/luna/salon/contact", label: "Contact" },
] as const;

export const marigoldServices = [
  { name: "Signature Cut & Finish", price: "From $72", time: "60-75 min", body: "A shape-first haircut, soft blowout, and styling plan that works with your daily routine." },
  { name: "Dimensional Color", price: "From $145", time: "2-3 hrs", body: "Low-maintenance brightness, glossing, and tone work for color that grows out softly." },
  { name: "Lived-In Blonding", price: "From $210", time: "3-4 hrs", body: "Hand-painted brightness, root shadow, gloss, and finish for a softer grow-out between visits." },
  { name: "Event Styling", price: "From $95", time: "75 min", body: "Loose waves, polished updos, and photo-ready styling for evenings, weddings, and portraits." },
  { name: "Gloss & Treatment", price: "From $58", time: "45 min", body: "A quick refresh for tone, shine, hydration, and smoother styling between larger appointments." },
  { name: "New Guest Consultation", price: "Complimentary", time: "15 min", body: "A short conversation about your hair history, goals, maintenance, and best next appointment." },
] as const;

export const marigoldGallery = [
  "Soft brunette gloss",
  "Face-framing layers",
  "Lived-in blonde",
  "Loose event waves",
  "Copper refresh",
  "Quiet salon detail",
] as const;

export const marigoldTrust = [
  "Clear service menu before booking",
  "New-guest consults for color planning",
  "Low-maintenance color approach",
  "Appointment requests answered within one business day",
] as const;
