import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import { SITE_URL } from "./src/consts";

// Static (SSG) output. Every public page is rendered to crawlable HTML at build
// time so titles, meta, canonical, OpenGraph, Twitter, and JSON-LD are present
// in the initial response for search engines, social unfurlers, and AI answer
// engines that do not execute JavaScript.
export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "never",
  build: {
    format: "directory",
  },
  integrations: [
    sitemap({
      // Legal "last updated" cadence is low; content/marketing is higher.
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date("2026-06-08T00:00:00Z"),
      // Private/auth/account surfaces are not part of this static site, but we
      // exclude defensively in case routes are added later.
      filter: (page) =>
        !page.includes("/app") &&
        !page.includes("/admin") &&
        !page.includes("/api/") &&
        !page.includes("/login") &&
        !page.includes("/account") &&
        !["/privacy", "/privacy/", "/terms", "/terms/", "/cookies", "/cookies/"].some((path) =>
          page.endsWith(path),
        ),
    }),
  ],
});
