# WSS SEO/GEO/AEO Scorecard

Date: 2026-07-11
Repo: `/Users/garycorriston/website-support-studio`
Branch: `wss-scorecard`
Build audited: `marketing/dist` from `cd marketing && npm run build`

## Scope and Method

I audited the 46 sitemap-indexable pages in the rendered Astro build. I excluded `/templates/*` and sample routes because they render `noindex, follow` and are intentionally absent from the sitemap. I did not audit the root Vite app.

Requested routes not present in this repo/build, so they were not scored: `/products`, `/website-gallery`, `/website-health`, `/free-website-preview`, `/founder-website-package`, `/custom-websites`.

Site averages across the 46 audited pages:

| Pillar | Average |
|---|---:|
| SEO | 93 |
| GEO | 83 |
| AEO | 54 |
| Overall | 77 |

Emerging/readiness checks: `llms.txt` is present; `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, ChatGPT-User, Claude-Web, and Applebot-Extended on public content; sitemap is present; all audited pages are in the sitemap; `/templates/*` are excluded from the sitemap.

## Score Table

| Page | SEO | GEO | AEO | Overall | Biggest lever |
|---|---:|---:|---:|---:|---|
| `/contact` | 99 | 67 | 14 | 60 | Add visible FAQs + FAQPage JSON-LD |
| `/for/concrete` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/electrician` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/garage-door` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/irrigation` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/landscaping` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/pest-control` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/pool-company` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/pressure-washing` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/for/tree-service` | 85 | 78 | 26 | 63 | Add visible FAQs + FAQPage JSON-LD |
| `/articles` | 100 | 81 | 14 | 65 | Add visible FAQs + FAQPage JSON-LD |
| `/for/hvac` | 93 | 78 | 26 | 66 | Add visible FAQs + FAQPage JSON-LD |
| `/for/plumber` | 93 | 78 | 26 | 66 | Add visible FAQs + FAQPage JSON-LD |
| `/for/roofing` | 93 | 78 | 26 | 66 | Add visible FAQs + FAQPage JSON-LD |
| `/revenue-leak-audit` | 98 | 65 | 38 | 67 | Add visible FAQs + FAQPage JSON-LD |
| `/for/attorney` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/boutique` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/coffee-shop` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/construction` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/consultant` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/dental` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/financial` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/medical` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/restaurant` | 90 | 69 | 46 | 68 | Add visible FAQs + FAQPage JSON-LD |
| `/for/salon` | 98 | 69 | 46 | 71 | Add visible FAQs + FAQPage JSON-LD |
| `/terms` | 98 | 81 | 33 | 71 | Add visible FAQs + FAQPage JSON-LD |
| `/cookies` | 100 | 81 | 34 | 72 | Add visible FAQs + FAQPage JSON-LD |
| `/privacy` | 98 | 81 | 37 | 72 | Add visible FAQs + FAQPage JSON-LD |
| `/about` | 100 | 83 | 36 | 73 | Add visible FAQs + FAQPage JSON-LD |
| `/` | 98 | 82 | 55 | 78 | Add visible FAQs + FAQPage JSON-LD |
| `/faqs` | 98 | 86 | 53 | 79 | Tighten meta description to 70-170 chars |
| `/pricing` | 90 | 93 | 65 | 83 | Tighten meta description to 70-170 chars |
| `/services` | 100 | 90 | 58 | 83 | Add visible FAQs + FAQPage JSON-LD |
| `/articles/hvac-website-design-seo-aeo-geo` | 98 | 100 | 80 | 93 | Shorten rendered title to 25-65 chars |
| `/articles/introducing-website-support-studio` | 90 | 100 | 100 | 97 | Tighten meta description to 70-170 chars |
| `/articles/concrete-contractor-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/electrician-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/garage-door-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/irrigation-sprinkler-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/landscaping-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/pest-control-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/plumber-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/pool-company-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/pressure-washing-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/roofing-website-templates-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |
| `/articles/tree-service-website-design-seo-aeo-geo` | 98 | 100 | 99 | 99 | Shorten rendered title to 25-65 chars |

## Systemic Findings

### 1. TEMPLATE-LEVEL: Non-article pages mostly lack visible FAQ sections and FAQPage JSON-LD

What is broken: 32 pages have no `FAQPage` JSON-LD. The AEO average is only 54 largely because most non-article pages do not provide answer-engine-ready Q&A blocks.

Pages hit: `/contact`, `/articles`, all 22 `/for/*` pages, `/revenue-leak-audit`, `/terms`, `/cookies`, `/privacy`, `/about`, `/`, `/pricing`, `/services`.

Fix surface: shared FAQ data plus templates/components: `marketing/src/pages/for/[industry].astro`, the existing static `marketing/src/pages/for/*.astro` pages, `marketing/src/pages/contact.astro`, `marketing/src/pages/articles/index.astro`, `marketing/src/pages/revenue-leak-audit.astro`, `marketing/src/pages/services.astro`, and optionally legal pages if we want answer snippets there.

Pillars lifted: AEO primarily; GEO secondarily when visible FAQ matches `FAQPage`.

Rough points estimate: +20 to +35 AEO on the 32 affected pages; +6 to +10 GEO where FAQ schema is added and valid.

### 2. TEMPLATE-LEVEL: `/for/*` pages are thin for competitive local-service terms

What is broken: all 22 `/for/*` pages are below 700 words. The 12 data-driven pages are around 278-302 words; the 10 older static pages are around 507-526 words. The pages have good SEO plumbing, but they are light on answer-first service, location, FAQ, and buying-decision content.

Pages hit: all 22 `/for/*` pages in the sitemap.

Fix surface: `marketing/src/pages/for/[industry].astro` plus `marketing/src/data/industries.ts` for the 12 data-driven pages; migrate or extend the 10 static `marketing/src/pages/for/*.astro` pages.

Pillars lifted: AEO, GEO, and SEO content-depth signals.

Rough points estimate: +10 to +25 AEO and +5 to +12 GEO per `/for/*` page; smaller SEO lift because technical SEO is already mostly strong.

### 3. TEMPLATE-LEVEL: 10 older static `/for/*` pages lack Service schema and Breadcrumb schema

What is broken: the 12 newer industry pages render `Service` and `BreadcrumbList` JSON-LD. The 10 older static industry pages only render the global Organization/WebSite graph.

Pages hit: `/for/attorney`, `/for/boutique`, `/for/coffee-shop`, `/for/construction`, `/for/consultant`, `/for/dental`, `/for/financial`, `/for/medical`, `/for/restaurant`, `/for/salon`.

Fix surface: either migrate those pages into the data-driven industry route pattern, or add `serviceSchema()` and `breadcrumbSchema()` to each static page.

Pillars lifted: GEO mostly; AEO slightly if paired with FAQs.

Rough points estimate: +10 to +18 GEO on each of the 10 older `/for/*` pages.

### 4. TEMPLATE-LEVEL: Rendered titles are often too long because the site suffix is appended everywhere

What is broken: 32 pages render titles over 65 characters. This is most visible on the 13 article pages and many `/for/*` pages because `BaseHead` appends ` — Website Support Studio`.

Pages hit: 32 pages, including all 13 articles, most `/for/*` pages, and `/pricing`.

Fix surface: `marketing/src/components/BaseHead.astro` plus page title inputs. Options: add an explicit `seoTitle`/`fullTitle` escape hatch, shorten article title props, or conditionally avoid suffixing already-complete article titles.

Pillars lifted: SEO.

Rough points estimate: +2 to +8 SEO on affected pages. Lower leverage than FAQ/content/schema, but easy to batch.

### 5. TEMPLATE/PAGE-LEVEL: Several meta descriptions are too long

What is broken: 7 pages render descriptions over 170 characters. The home page is 259 chars, `/pricing` is 247, `/articles/introducing-website-support-studio` is 261, `/terms` is 214, `/privacy` is 186, `/faqs` is 183, and `/revenue-leak-audit` is 172.

Pages hit: `/`, `/pricing`, `/articles/introducing-website-support-studio`, `/terms`, `/privacy`, `/faqs`, `/revenue-leak-audit`.

Fix surface: page-level `description` props and article frontmatter/content data.

Pillars lifted: SEO.

Rough points estimate: +2 to +8 SEO on each affected page.

### 6. TEMPLATE/PAGE-LEVEL: `/revenue-leak-audit` has no page-specific structured data

What is broken: `/revenue-leak-audit` has strong content depth but only global Organization/WebSite JSON-LD. It lacks `Service`, `BreadcrumbList`, and FAQ schema.

Pages hit: `/revenue-leak-audit`.

Fix surface: `marketing/src/pages/revenue-leak-audit.astro`.

Pillars lifted: GEO and AEO.

Rough points estimate: +18 to +25 GEO and +20 to +30 AEO.

## Per-Page-Specific Gaps

- `/contact`: worst overall score at 60. It has good SEO tags and `ContactPage`/breadcrumb schema, but only 160 words, no question headings, and no FAQ schema. Add a short "Before you send this" FAQ block and answer-first guidance.
- `/articles`: has `CollectionPage` and strong SEO, but AEO is 14 because there are no FAQ/answer sections or question headings. Add "Which guide should I read first?" style Q&A and an `ItemList` if not already present in the collection schema payload.
- `/revenue-leak-audit`: content depth is strong, but GEO is only 65 because page-specific schema is missing. Add `Service`, breadcrumb, and visible FAQ/FAQPage.
- `/services`: SEO/GEO are strong, but AEO is 58. Add visible service FAQs and `FAQPage`; the existing question link to `/faqs` is not enough for page-level AEO.
- `/about`: SEO/GEO are healthy, but AEO is 36. Add a small FAQ about who runs WSS, who the service is for, and what happens after launch.
- Legal pages `/terms`, `/privacy`, `/cookies`: These are indexable and in the sitemap. They score fine on SEO/GEO but weak on AEO. If these are intentionally indexable, add concise legal-policy FAQs or consider whether they should remain SEO targets.
- `/faqs`: already has 34 FAQ entities and visible FAQ content. The biggest issue is the 183-character meta description.
- `/pricing`: good GEO and decent AEO. Tighten the 247-character meta description and add page-level FAQ schema if pricing FAQs are visible here rather than only linked out.

## Batch Fix Plan

1. Add a reusable visible FAQ block and schema plumbing.
   - Create/extend shared FAQ data by route type.
   - Add route-specific visible FAQs and `faqSchema()` to `/for/[industry]`, static `/for/*.astro`, `/services`, `/contact`, `/articles`, `/revenue-leak-audit`, `/about`, `/`, and `/pricing`.
   - Highest AEO lift across the most pages.

2. Strengthen all `/for/*` pages.
   - For the 12 data-driven pages, add fields in `marketing/src/data/industries.ts` for buyer questions, answer-first sections, service-specific bullets, and FAQ pairs.
   - For the 10 static pages, either migrate to the data-driven model or add the same content/schema manually.
   - Target 700-900 words for each `/for/*` page.

3. Bring the 10 older static industry pages up to the newer schema standard.
   - Add `Service` and `BreadcrumbList` schema or migrate them into the `[industry].astro` route/data model.
   - This is the cleanest GEO batch lift.

4. Add missing page-specific schema to `/revenue-leak-audit`.
   - Add `Service`, `BreadcrumbList`, and `FAQPage` matching visible FAQ content.
   - This single page has enough depth to score much higher once schema is present.

5. Fix title and meta length hygiene.
   - Add a `fullTitle`/`seoTitle` escape hatch to `BaseHead` or shorten page title props.
   - Rewrite the 7 overlong meta descriptions to 70-170 characters.

6. Optional after the big lifts: add more answer-first H2s.
   - 19 pages have zero question-format H2s.
   - Use headings like "What should a [industry] website include?" and answer directly in the first paragraph.

## Checker-Discrepancy Notes

- The rendered Astro HTML contains valid meta descriptions on all 46 audited pages. The known checker bug that reports descriptions as "2 chars" is incorrect for this build. Example actual rendered lengths: `/contact` 128 chars, `/for/concrete` 114 chars, `/articles/concrete-contractor-website-design-seo-aeo-geo` 146 chars.
- JSON-LD is present in rendered output, but the buggy regex checker may miss it. Every audited page has Organization and WebSite JSON-LD. Article pages have Article/NewsArticle, BreadcrumbList, and FAQPage JSON-LD. The 12 newer data-driven `/for/*` pages have Service and BreadcrumbList JSON-LD.
- `/templates/*` and sample routes are intentionally `noindex, follow` and excluded from the sitemap. They should not be penalized as missing sitemap/indexability for this scorecard.
- The sitemap has 46 indexable URLs. It includes 13 article pages and zero `/templates/*` pages.

## Validation Log

- `cd marketing && npm run build` passed.
- Astro check result: 0 errors, 0 warnings, 0 hints.
- Build output: 174 pages.
- Audited source: `marketing/dist`.
- Audited pages: 46 sitemap-indexable URLs.
- Excluded: noindexed `/templates/*`, sample pages, redirects/legacy AIO URLs, and the root Vite app.
