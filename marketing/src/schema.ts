/**
 * JSON-LD schema builders. Centralised so entity identities (@id values) are
 * stable and reused across pages — this is what lets answer engines resolve
 * "Website Support Studio", "Corriston Consulting, LLC", and "Gary Corriston"
 * to single canonical entities rather than duplicates.
 */
import { SITE_URL, SITE_NAME, ORG, CONTACT, DEFAULT_OG_IMAGE } from "./consts";

const abs = (path: string) => new URL(path, SITE_URL).href;

// Stable entity ids
export const ID = {
  org: abs("/#organization"),
  parentOrg: `${ORG.parentSiteUrl}/#organization`,
  website: abs("/#website"),
  founder: abs("/about#gary-corriston"),
} as const;

const postalAddress = {
  "@type": "PostalAddress",
  addressLocality: ORG.address.locality,
  addressRegion: ORG.address.region,
  addressCountry: ORG.address.country,
};

/** Organization + Publisher. WSS is operated by Corriston Consulting, LLC. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ID.org,
    name: SITE_NAME,
    legalName: ORG.legalName,
    url: SITE_URL,
    logo: abs("/website-support-studio.svg"),
    image: abs(DEFAULT_OG_IMAGE),
    description:
      "Website Support Studio builds professional websites, provides a simple customer Back Office, and supports small businesses after launch. Operated by Corriston Consulting, LLC.",
    founder: { "@type": "Person", "@id": ID.founder, name: ORG.founder },
    parentOrganization: {
      "@type": "Organization",
      "@id": ID.parentOrg,
      name: ORG.legalName,
      url: ORG.parentSiteUrl,
    },
    address: postalAddress,
    email: CONTACT.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: CONTACT.email,
      url: abs("/contact"),
      areaServed: "US",
      availableLanguage: "English",
    },
    sameAs: [CONTACT.linkedin, ORG.parentSiteUrl],
  };
}

/** WebSite + SearchAction (sitelinks search box support). */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": ID.website,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": ID.org },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/articles?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Service schema for the managed-operations offering. */
export function serviceSchema(opts: {
  name: string;
  description: string;
  serviceType?: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.serviceType ?? "Managed website operations and support",
    description: opts.description,
    url: abs(opts.path),
    provider: { "@id": ID.org },
    areaServed: { "@type": "Country", name: "United States" },
    audience: {
      "@type": "Audience",
      audienceType: "Small business owners and local service businesses",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        description: "Custom pricing by engagement. Contact sales for a quote.",
      },
    },
  };
}

/** BreadcrumbList from an ordered list of {name, path}. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

/** FAQPage from {q, a} pairs. */
export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Author (Person) schema. */
export function personSchema(opts: { name: string; jobTitle: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ID.founder,
    name: opts.name,
    jobTitle: opts.jobTitle,
    url: abs(opts.path),
    worksFor: { "@id": ID.org },
  };
}

/** Article + Author + Publisher for content pages. */
export function articleSchema(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": ["Article", "NewsArticle"],
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(opts.path) },
    url: abs(opts.path),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    image: abs(opts.image ?? DEFAULT_OG_IMAGE),
    author: { "@type": "Person", "@id": ID.founder, name: opts.authorName, worksFor: { "@id": ID.org } },
    publisher: { "@id": ID.org },
    isAccessibleForFree: true,
    inLanguage: "en-US",
  };
}
