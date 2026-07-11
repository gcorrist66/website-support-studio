# Website Support Studio SEO/GEO/AEO Audit

Date: 2026-07-11
Repo: `/Users/garycorriston/website-support-studio`
Branch: `wss-seo-audit`
Scope: audit and prioritized fix plan only. No source fixes made in this pass.

## Executive Summary

The repo is current with GitHub `origin/main` before this audit branch commit. The requested stack expectation was Next.js App Router, but the actual repo is split:

- Public marketing site: Astro SSG in `marketing/`
- Private/operator console: Vite React app at repo root

The public Astro site is mostly indexable in source and in a local rendered build. It emits canonical tags, indexable robots meta, OpenGraph, Twitter cards, Organization/WebSite JSON-LD, Service schema, Article schema, Person schema, Breadcrumb schema, and FAQPage schema on `/faqs`.

The highest-risk issue is deployment routing, not the Astro template layer. The repo root is intentionally private and noindexed. If `websitesupportstudio.com` is pointed at the root Vite project instead of the `marketing/` project, crawlers will see `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` plus `robots.txt` `Disallow: /`. That would explain a live checker reporting missing or tiny metadata even though the Astro marketing build is healthy.

## Audit Checks Run

- Confirmed repo path: `/Users/garycorriston/website-support-studio`
- Confirmed branch: `wss-seo-audit`
- Ran `git fetch --all --prune`
- Confirmed `HEAD` and `origin/main` both pointed at `5555b66d8c9c20cd0851933284134b1f0e543066` before this audit commit
- Inspected robots, sitemap config, metadata templates, layouts, article template, content collections, and page sources
- Installed marketing dependencies with `npm ci`
- Ran `npm run build` from `marketing/`
- Inspected rendered `marketing/dist` HTML, `robots.txt`, and generated sitemap files
- Searched Google Drive for WSS/SEO reference docs

Build result:

```text
marketing npm run build
astro check: 0 errors, 0 warnings, 0 hints
astro build: 104 pages built
sitemap-index.xml created
```

Dependency note: `npm ci` reported 8 existing npm audit findings in the marketing dependency tree (6 moderate, 2 high). I did not change dependencies.

## Google Drive Cross-Check

Relevant Drive results found:

- `WSS Playbook - Kai Stone Channel Mining`: confirms WSS positioning should emphasize a low-friction website and lead-response system for local service businesses, especially home-service niches. The current site partly matches this through `/for/*` pages and sample sites, but homepage language still leans broad/back-office-heavy.
- `llms.txt`: found a Corriston Consulting `llms.txt` in Drive, not a Website Support Studio `llms.txt` in this repo.

Repo mismatch from Drive:

- There is no committed `llms.txt` for `websitesupportstudio.com`.
- The Drive `llms.txt` that exists is for `corristonconsulting.com`, so it should not be copied verbatim to WSS. WSS needs its own source-of-truth file.

## Indexability Findings

### What is healthy

- `marketing/public/robots.txt` allows the public site and explicitly allows major AI/answer crawlers while disallowing private paths.
- `marketing/public/robots.txt` points to `https://websitesupportstudio.com/sitemap-index.xml`.
- `marketing/astro.config.mjs` sets `site: SITE_URL`, static output, and the Astro sitemap integration.
- `marketing/src/consts.ts` sets `SITE_URL = "https://websitesupportstudio.com"`.
- `marketing/src/components/BaseHead.astro` emits canonical, description, robots, OG, and Twitter tags.
- Rendered marketing homepage emits:
  - canonical: `https://websitesupportstudio.com/`
  - robots: `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`
  - title: `Website Support Studio - Get a Professional Website for $500`
  - description: real but long, not empty
- Rendered `/faqs` emits FAQPage JSON-LD.
- Rendered article page emits Article JSON-LD, Person JSON-LD, BreadcrumbList JSON-LD, and article OG metadata.

### What is risky

Root Vite app indexability guardrails:

- `/Users/garycorriston/website-support-studio/vercel.json` applies this to every root route:

```json
{ "key": "X-Robots-Tag", "value": "noindex, nofollow, noarchive, nosnippet" }
```

- `/Users/garycorriston/website-support-studio/public/robots.txt` says:

```text
User-agent: *
Disallow: /
```

Those settings are correct for `app.websitesupportstudio.com`, but catastrophic if the apex domain points to the repo root project.

The repo already documents the intended split in `/Users/garycorriston/website-support-studio/DEPLOYMENT_READINESS.md`:

- `websitesupportstudio.com` should use Vercel Project A with Root Directory `marketing/`
- `app.websitesupportstudio.com` should use Vercel Project B with Root Directory `./`

## Template Layer Findings

### Base metadata

Path: `/Users/garycorriston/website-support-studio/marketing/src/components/BaseHead.astro`

Status: strong foundation.

It centralizes:

- title template
- meta description
- canonical
- robots
- OG metadata
- Twitter metadata
- article published/modified OG fields
- icons

Risk: the template always emits explicit robots meta. That is fine, but production HTTP headers still override meta if the wrong Vercel project/header config is applied.

### Layout and JSON-LD

Path: `/Users/garycorriston/website-support-studio/marketing/src/layouts/BaseLayout.astro`

Status: strong foundation.

It emits global Organization and WebSite schema on every page and allows page-specific schemas.

Path: `/Users/garycorriston/website-support-studio/marketing/src/schema.ts`

Status: good schema builder coverage.

Existing builders:

- Organization
- WebSite
- Service
- BreadcrumbList
- FAQPage
- Person
- Article/NewsArticle

Risk: `websiteSchema()` declares a SearchAction pointing to `/articles?q={search_term_string}`. I did not find an actual search experience on `/articles`. Either implement search or remove SearchAction to avoid structured-data promises that the page does not satisfy.

### Articles

Paths:

- `/Users/garycorriston/website-support-studio/marketing/src/content/articles/introducing-website-support-studio.md`
- `/Users/garycorriston/website-support-studio/marketing/src/layouts/ArticleLayout.astro`
- `/Users/garycorriston/website-support-studio/marketing/src/pages/articles/[...slug].astro`

Status: technically solid, content volume thin.

Facts:

- One non-draft article exists.
- Article word count: 1,690 words.
- Article has title, description, summary, category, author, datePublished, dateModified.
- Article layout emits visible byline and date.
- Rendered article emits Article/NewsArticle JSON-LD, Person JSON-LD, and breadcrumbs.
- Article contains a FAQ section in prose, but FAQ schema is only emitted on `/faqs`, not article pages.

Risk: one article is not enough to build topical authority or answer-engine recall. The single article is more launch/announcement than a demand-capture article.

## Sitemap Findings

Generated files:

- `/Users/garycorriston/website-support-studio/marketing/dist/sitemap-index.xml`
- `/Users/garycorriston/website-support-studio/marketing/dist/sitemap-0.xml`

Rendered build result: 104 URLs.

Healthy:

- The sitemap is generated during the marketing build.
- `/articles/introducing-website-support-studio` is included.
- `/for/*` industry pages are included.
- Private `/app`, `/admin`, `/api`, `/login`, and `/account` paths are filtered.

Risks:

- `lastmod` is hardcoded to `2026-06-08T00:00:00Z` for every URL in `marketing/astro.config.mjs`.
- The sitemap includes many demo/template/sample URLs. That may be intentional if sample sites are SEO assets, but it should be an explicit strategy. If not, they can dilute crawl focus and put fictional businesses in search results.
- The sitemap generated 104 URLs, while older deployment docs mention 10 public URLs. The docs are stale relative to current route count.

## Content and AEO/GEO Findings

### Current strengths

- Clear offer pages exist: `/`, `/services`, `/pricing`, `/templates`, `/faqs`, `/articles`.
- Industry landing pages exist under `/for/*`.
- FAQ content is substantial and structured on `/faqs`.
- Entity graph ties WSS to Corriston Consulting and Gary Corriston.
- Robots allows major AI/answer crawlers.

### Current gaps

- Only one article exists.
- No WSS-specific `llms.txt` exists in source.
- Many page meta descriptions are overlong, especially homepage, pricing, templates, privacy, terms, revenue-leak-audit, and the article. They are not empty, but they are often too long for clean SERP display.
- The homepage rendered meta description is approximately 246 characters. A checker reporting a 2-character description is likely seeing the wrong deployment or stale live HTML, not the local Astro marketing build.
- The homepage has a FAQ UI section through `FounderTrustLayer`, but the only FAQPage schema source is `/faqs`. That is a defensible single-source strategy, but the homepage may miss answer-rich eligibility for its own visible questions.
- The Drive playbook emphasizes local service businesses and lead-response outcomes. The live homepage source includes that idea, but it also spends significant above-fold attention on Back Office/dashboard language. The positioning should be tightened after indexability is confirmed.

## Priority Fix Plan

### P0 - Confirm production serves the marketing project at the apex

Why:

The marketing build is indexable. The root build is intentionally noindexed. A wrong Vercel root directory or domain assignment would fully suppress indexing.

Evidence:

- Root `/vercel.json` sets `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
- Root `/public/robots.txt` disallows `/`.
- Marketing `/marketing/vercel.json` does not set a noindex header.
- Marketing rendered HTML emits indexable robots meta.

Action:

1. In Vercel, confirm `websitesupportstudio.com` is attached to the project whose Root Directory is `marketing/`.
2. Confirm `app.websitesupportstudio.com` is attached to the root Vite console project.
3. Fetch live headers:

```bash
curl -I https://websitesupportstudio.com/
curl -s https://websitesupportstudio.com/robots.txt
curl -s https://websitesupportstudio.com/ | rg -o '<title>.*</title>|name="description" content="[^"]+"|name="robots" content="[^"]+"|rel="canonical" href="[^"]+"'
```

Success criteria:

- No `X-Robots-Tag: noindex` on `https://websitesupportstudio.com/`.
- Live robots allows `/`.
- Live homepage title/description/canonical match the Astro marketing output.

### P0 - Add WSS-specific `llms.txt`

Why:

The repo has AI crawler allowance, but no WSS-specific `llms.txt`. Google Drive has a Corriston Consulting `llms.txt`, not a WSS one.

Action:

1. Add `/Users/garycorriston/website-support-studio/marketing/public/llms.txt`.
2. Make it specific to `websitesupportstudio.com`.
3. Include primary WSS pages, `/for/*` industry pages, `/templates`, `/faqs`, and the article index.
4. Do not copy the Corriston Consulting Drive file verbatim.

Success criteria:

- `https://websitesupportstudio.com/llms.txt` returns 200 after deploy.
- The file describes WSS, not Corriston Consulting broadly.

### P1 - Fix sitemap freshness and crawl focus

Why:

All sitemap URLs use the same static lastmod. The sitemap also includes many fictional/demo/sample pages. That may be intentional, but it should be decided, not accidental.

Action:

1. Replace the hardcoded `lastmod: new Date("2026-06-08T00:00:00Z")` with route-aware or build-time freshness.
2. Decide which template/sample routes should be indexable.
3. If fictional sample pages should not rank, exclude or noindex those routes.
4. Update stale deployment docs that still reference 10 public URLs.

Success criteria:

- Sitemap `lastmod` reflects actual content freshness.
- Sitemap contains only URLs intended for public discovery.
- Search Console sitemap submission matches intended URL count.

### P1 - Tighten meta descriptions and source-of-truth page copy

Why:

The Astro build does not have empty metadata, but several descriptions are too long and broad. SERPs and AI summaries need tighter page-level summaries.

Action:

1. Create a page metadata inventory.
2. Rewrite descriptions to roughly 140-160 characters where possible.
3. Prioritize `/`, `/services`, `/pricing`, `/templates`, `/faqs`, `/articles`, and `/for/*`.
4. Keep the homepage aligned with the Drive playbook: local service website, quote/call flow, fast launch, human support layer.

Success criteria:

- Important pages have concise, unique descriptions.
- Homepage description reflects the WSS offer without overloading Back Office features.
- Rendered HTML confirms descriptions match source.

### P1 - Build a real answer/content cluster

Why:

One launch article is not enough for SEO/GEO/AEO visibility. The existing article template is technically sound, so the bottleneck is content inventory and search-intent coverage.

Action:

Create 8-12 focused articles or guides before chasing advanced schema changes. Suggested first cluster:

- How much should a small business website cost in 2026?
- What should a contractor website include?
- Website redesign checklist for local service businesses
- Why contact forms fail and how to test them
- What is included in a $500 business website?
- Website support vs hiring a web designer
- Local service website SEO basics
- What happens after a website launches?
- How to choose a website style for a small business
- Service area pages explained for contractors

Success criteria:

- Each article has a clear keyword/topic, question-led H2s, concise direct answers, and internal links to the relevant offer page.
- Article schema continues to render on all article pages.
- `/articles` becomes a real topical hub, not just a launch announcement.

### P2 - Resolve SearchAction mismatch

Why:

The WebSite schema advertises search at `/articles?q={search_term_string}`, but the source does not show a real search experience.

Action:

Either:

- implement article search that honors `?q=`, or
- remove the SearchAction from `websiteSchema()`.

Success criteria:

- Structured data matches actual page behavior.

### P2 - Decide FAQ schema placement strategy

Why:

FAQPage schema is correctly emitted on `/faqs`, but visible FAQ snippets also appear on other pages through shared components. A single-source FAQ strategy is fine, but it should be intentional.

Action:

1. Keep `/faqs` as the canonical FAQ schema source, or
2. Add page-specific FAQ schema only where the visible FAQ content is unique and important to the page intent.

Success criteria:

- No duplicate bloated FAQ schema everywhere.
- High-value pages have schema only when it matches visible content and search intent.

### P2 - Add rendered-output SEO checks to CI or a script

Why:

The difference between root app and marketing app makes source inspection alone too easy to misread.

Action:

Add a simple script that builds `marketing/` and checks:

- homepage has title, description, canonical, indexable robots
- `/robots.txt` allows `/`
- `/sitemap-index.xml` exists
- `/faqs` contains FAQPage JSON-LD
- article pages contain Article JSON-LD
- no public marketing route emits `noindex` except intended utility pages

Success criteria:

- Future SEO regressions are caught locally before deploy.

## Top 5 Findings

1. The root Vite app is deliberately noindexed and robots-blocked. If the apex domain points there, the site is effectively invisible to search.
2. The Astro marketing site renders indexable metadata correctly. A live report showing a tiny or missing description likely indicates wrong deployment, stale production, or checker hitting the root app.
3. No WSS-specific `llms.txt` exists in the repo, while Drive has a Corriston Consulting `llms.txt` that should not be copied verbatim.
4. The generated sitemap works, but every URL has the same hardcoded `lastmod`, and 104 URLs include many sample/demo/template routes that need an explicit indexability strategy.
5. The technical article/schema layer is sound, but the content moat is thin: only one article exists, so WSS needs a real answer-led content cluster.

## Files Changed In This Task

- `/Users/garycorriston/website-support-studio/docs/wss-seo-audit.md`

No production code, content pages, deployment files, robots files, sitemap config, secrets, or database files were changed.
