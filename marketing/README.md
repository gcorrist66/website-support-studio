# Website Support Studio — Public Site (`marketing/`)

The public marketing, SEO, legal, and content site for **Website Support Studio**,
operated by Corriston Consulting, LLC. Built with **Astro (static / SSG)** so every
page ships crawlable HTML with full metadata and JSON-LD in the initial response —
for search engines, social unfurlers, and AI answer engines that do not run JS.

This is **separate** from the authenticated operator console (the Vite + React app
in the repository root, under `../src`). The console is unchanged.

## Commands

```bash
npm install      # install dependencies
npm run dev      # local dev server
npm run build    # type-check (astro check) + static build to dist/
npm run preview  # preview the built site
```

## Structure

- `src/consts.ts` — single source of truth for verified business facts (entity,
  contact, sub-processors, brand, nav). Update facts here, not in pages.
- `src/schema.ts` — typed JSON-LD builders (Organization, WebSite+SearchAction,
  Service, Article, Breadcrumb, FAQ, Person).
- `src/components/BaseHead.astro` — per-page title/description/canonical/OG/Twitter.
- `src/layouts/` — `BaseLayout` (all pages) and `ArticleLayout` (content).
- `src/pages/` — home, about, services, pricing, contact, privacy, terms, cookies,
  articles index, and the dynamic article route.
- `src/content/articles/` — markdown articles (content collection).
- `public/robots.txt`, `public/og/` — robots + social image.

## Canonical domain

`https://websitesupportstudio.com` (apex), set in `src/consts.ts` → `SITE_URL`
and consumed by `astro.config.mjs` for canonical URLs and sitemap generation.

## Deploy model

Static output (`dist/`) deploys to the apex domain. The operator console deploys
separately (e.g. an `app.` subdomain or `/app` path); `robots.txt` already
disallows `/app`, `/admin`, `/api/`, `/login`, `/account`.
