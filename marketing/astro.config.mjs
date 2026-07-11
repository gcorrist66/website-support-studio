import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { existsSync, statSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_URL } from "./src/consts";

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(rootDir, "src");
const orphanTemplateRedirects = {
  "/templates/luna": {
    status: 301,
    destination: "/templates",
  },
  "/templates/ridgeline-roofing": {
    status: 301,
    destination: "/templates/sample/ridgeline-roofing",
  },
  "/templates/ridgeline-roofing/services": {
    status: 301,
    destination: "/templates/sample/ridgeline-roofing/services",
  },
  "/templates/ridgeline-roofing/about": {
    status: 301,
    destination: "/templates/sample/ridgeline-roofing/about",
  },
  "/templates/ridgeline-roofing/contact": {
    status: 301,
    destination: "/templates/sample/ridgeline-roofing/contact",
  },
  "/templates/ridgeline-roofing/service-area": {
    status: 301,
    destination: "/templates/sample/ridgeline-roofing/service-area",
  },
};
const industryAliasRedirects = {
  "/for/plumbing": {
    status: 301,
    destination: "/for/plumber",
  },
};
const aioToAeoRedirects = {
  "/articles/concrete-contractor-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/concrete-contractor-website-design-seo-aeo-geo",
  },
  "/articles/electrician-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/electrician-website-design-seo-aeo-geo",
  },
  "/articles/garage-door-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/garage-door-website-design-seo-aeo-geo",
  },
  "/articles/hvac-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/hvac-website-design-seo-aeo-geo",
  },
  "/articles/irrigation-sprinkler-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/irrigation-sprinkler-website-design-seo-aeo-geo",
  },
  "/articles/landscaping-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/landscaping-website-design-seo-aeo-geo",
  },
  "/articles/pest-control-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/pest-control-website-design-seo-aeo-geo",
  },
  "/articles/plumber-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/plumber-website-design-seo-aeo-geo",
  },
  "/articles/pool-company-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/pool-company-website-design-seo-aeo-geo",
  },
  "/articles/pressure-washing-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/pressure-washing-website-design-seo-aeo-geo",
  },
  "/articles/roofing-website-templates-seo-aio-geo": {
    status: 301,
    destination: "/articles/roofing-website-templates-seo-aeo-geo",
  },
  "/articles/tree-service-website-design-seo-aio-geo": {
    status: 301,
    destination: "/articles/tree-service-website-design-seo-aeo-geo",
  },
};

function sourceLastmod(filePath) {
  if (!existsSync(filePath)) return new Date().toISOString();

  const frontmatter = readFileSync(filePath, "utf8").match(/^---\s*([\s\S]*?)\s*---/);
  const modified = frontmatter?.[1]?.match(/^dateModified:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1];
  const published = frontmatter?.[1]?.match(/^datePublished:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1];
  const frontmatterDate = modified ?? published;

  if (frontmatterDate) {
    return new Date(`${frontmatterDate}T00:00:00Z`).toISOString();
  }

  return statSync(filePath).mtime.toISOString();
}

function sourceForPath(pathname) {
  if (pathname === "/") return join(srcDir, "pages/index.astro");
  if (pathname.startsWith("/articles/")) {
    return join(srcDir, "content/articles", `${pathname.replace("/articles/", "")}.md`);
  }

  const route = pathname.replace(/^\//, "");
  const candidates = [
    join(srcDir, "pages", `${route}.astro`),
    join(srcDir, "pages", route, "index.astro"),
  ];

  return candidates.find((filePath) => existsSync(filePath)) ?? join(srcDir, "consts.ts");
}

function isPrivateOrDemo(page) {
  const { pathname } = new URL(page);
  return (
    pathname === "/templates" ||
    pathname.startsWith("/templates/") ||
    pathname.includes("/sample/") ||
    pathname.includes("/demo/") ||
    pathname.includes("/app") ||
    pathname.includes("/admin") ||
    pathname.includes("/api/") ||
    pathname.includes("/login") ||
    pathname.includes("/account")
  );
}

// Static (SSG) output. Every public page is rendered to crawlable HTML at build
// time so titles, meta, canonical, OpenGraph, Twitter, and JSON-LD are present
// in the initial response for search engines, social unfurlers, and AI answer
// engines that do not execute JavaScript.
export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "never",
  redirects: {
    ...orphanTemplateRedirects,
    ...industryAliasRedirects,
    ...aioToAeoRedirects,
  },
  build: {
    format: "directory",
  },
  integrations: [
    sitemap({
      // Legal "last updated" cadence is low; content/marketing is higher.
      changefreq: "weekly",
      priority: 0.7,
      // Private/auth/demo surfaces are reachable when linked, but not submitted
      // for indexing. Demo pages also emit page-level noindex from BaseLayout.
      filter: (page) => !isPrivateOrDemo(page),
      serialize: (item) => {
        const { pathname } = new URL(item.url);
        return {
          ...item,
          lastmod: sourceLastmod(sourceForPath(pathname)),
        };
      },
    }),
  ],
});
