# WSS Template/Sample/Demo Route Inventory

Date: 2026-07-11
Repo: `/Users/garycorriston/website-support-studio`
Scope: template/sample/demo route inventory after orphan-removal cleanup.

## Summary

All kept template/sample/demo routes remain functional. Phase 1 keeps them out of the sitemap and emits `noindex, follow` on `/templates` and all `/templates/*` routes.

Classification counts:

- KEEP: 66 routes
- UPDATE CANDIDATE: 1 route
- REMOVED WITH 301: 6 routes

Removed routes:

- `/templates/luna` -> `/templates`
- `/templates/ridgeline-roofing` -> `/templates/sample/ridgeline-roofing`
- `/templates/ridgeline-roofing/services` -> `/templates/sample/ridgeline-roofing/services`
- `/templates/ridgeline-roofing/about` -> `/templates/sample/ridgeline-roofing/about`
- `/templates/ridgeline-roofing/contact` -> `/templates/sample/ridgeline-roofing/contact`
- `/templates/ridgeline-roofing/service-area` -> `/templates/sample/ridgeline-roofing/service-area`

Current article CTA check:

- `/articles/introducing-website-support-studio` links to `/contact`.
- I did not find article CTAs linking to sample templates in the current article set.

## Route Inventory

| Route | File | Linked from | Last modified | Classification |
|---|---|---|---|---|
| `/templates` | `marketing/src/pages/templates.astro` | Home CTAs, pricing CTAs, FAQ CTAs, `FounderTrustLayer`, sample Back Office | 2026-07-11 | UPDATE CANDIDATE - useful gallery/design-system page, but noindexed as a template gallery |
| `/templates/sample/back-office` | `marketing/src/pages/templates/sample/back-office/index.astro` | Home, pricing, FAQs, `/templates`, `/for/*`, sample layouts, Luna sample layouts | 2026-07-11 | KEEP - preview funnel and repeated CTA target |
| `/templates/luna` | Deleted | No non-self inbound link found in source | 2026-07-11 | REMOVED WITH 301 to `/templates` |
| `/templates/luna/salon` | `marketing/src/pages/templates/luna/salon/index.astro` | `/templates`, home sample cards, `/for/salon`, `DESIGN_SYSTEMS.sampleSites`, Luna internal nav | 2026-07-11 | KEEP |
| `/templates/luna/salon/services` | `marketing/src/pages/templates/luna/salon/services/index.astro` | Luna salon internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/salon/gallery` | `marketing/src/pages/templates/luna/salon/gallery/index.astro` | Luna salon internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/salon/about` | `marketing/src/pages/templates/luna/salon/about/index.astro` | Luna salon internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/salon/contact` | `marketing/src/pages/templates/luna/salon/contact/index.astro` | Luna salon internal nav, header CTA, page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/coffee-shop` | `marketing/src/pages/templates/luna/coffee-shop/index.astro` | `/templates`, home sample cards, `/for/coffee-shop`, `DESIGN_SYSTEMS.sampleSites`, Luna internal nav | 2026-07-11 | KEEP |
| `/templates/luna/coffee-shop/menu` | `marketing/src/pages/templates/luna/coffee-shop/menu/index.astro` | Luna coffee internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/coffee-shop/about` | `marketing/src/pages/templates/luna/coffee-shop/about/index.astro` | Luna coffee internal nav | 2026-07-11 | KEEP |
| `/templates/luna/coffee-shop/events` | `marketing/src/pages/templates/luna/coffee-shop/events/index.astro` | Luna coffee internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/coffee-shop/contact` | `marketing/src/pages/templates/luna/coffee-shop/contact/index.astro` | Luna coffee internal nav, header CTA, page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/boutique` | `marketing/src/pages/templates/luna/boutique/index.astro` | `/templates`, home sample cards, `/for/boutique`, `DESIGN_SYSTEMS.sampleSites`, Luna internal nav | 2026-07-11 | KEEP |
| `/templates/luna/boutique/collections` | `marketing/src/pages/templates/luna/boutique/collections/index.astro` | Luna boutique internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/boutique/about` | `marketing/src/pages/templates/luna/boutique/about/index.astro` | Luna boutique internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/boutique/visit` | `marketing/src/pages/templates/luna/boutique/visit/index.astro` | Luna boutique internal nav, header CTA, page CTAs | 2026-07-11 | KEEP |
| `/templates/luna/boutique/contact` | `marketing/src/pages/templates/luna/boutique/contact/index.astro` | Luna boutique internal nav and page CTAs | 2026-07-11 | KEEP |
| `/templates/ridgeline-roofing` | Deleted | Only linked inside old static Ridgeline route group | 2026-07-11 | REMOVED WITH 301 to `/templates/sample/ridgeline-roofing` |
| `/templates/ridgeline-roofing/services` | Deleted | Only linked inside old static Ridgeline route group | 2026-07-11 | REMOVED WITH 301 to `/templates/sample/ridgeline-roofing/services` |
| `/templates/ridgeline-roofing/about` | Deleted | Only linked inside old static Ridgeline route group | 2026-07-11 | REMOVED WITH 301 to `/templates/sample/ridgeline-roofing/about` |
| `/templates/ridgeline-roofing/contact` | Deleted | Only linked inside old static Ridgeline route group | 2026-07-11 | REMOVED WITH 301 to `/templates/sample/ridgeline-roofing/contact` |
| `/templates/ridgeline-roofing/service-area` | Deleted | Only linked inside old static Ridgeline route group | 2026-07-11 | REMOVED WITH 301 to `/templates/sample/ridgeline-roofing/service-area` |

## Dynamic Sample Routes

All routes below are generated by `marketing/src/pages/templates/sample/[...sample].astro` from `marketing/src/sampleBusinesses.ts`.

Shared referrers:

- `/templates` via `DESIGN_SYSTEMS.sampleSites`
- home sample cards for the first displayed design systems
- `/for/*` industry landing pages via `demoRoute`
- internal sample navigation via `samplePath()`
- `/templates/sample/back-office` appears repeatedly as a preview CTA

| Route group | Routes | Linked from | Last modified | Classification |
|---|---|---|---|---|
| Ridgeline Roofing | `/templates/sample/ridgeline-roofing`, `/templates/sample/ridgeline-roofing/services`, `/templates/sample/ridgeline-roofing/about`, `/templates/sample/ridgeline-roofing/work`, `/templates/sample/ridgeline-roofing/contact`, `/templates/sample/ridgeline-roofing/service-area`, `/templates/sample/ridgeline-roofing/service-areas` | `/templates`, home, `/for/roofing`, `/for/construction`, internal sample nav | 2026-07-11 | KEEP |
| Greenline Landscaping | `/templates/sample/greenline-landscaping`, `/templates/sample/greenline-landscaping/services`, `/templates/sample/greenline-landscaping/about`, `/templates/sample/greenline-landscaping/work`, `/templates/sample/greenline-landscaping/contact`, `/templates/sample/greenline-landscaping/service-area`, `/templates/sample/greenline-landscaping/service-areas` | `/templates`, home, `/for/landscaping`, internal sample nav | 2026-07-11 | KEEP |
| Northstar Air | `/templates/sample/northstar-air`, `/templates/sample/northstar-air/services`, `/templates/sample/northstar-air/about`, `/templates/sample/northstar-air/work`, `/templates/sample/northstar-air/contact`, `/templates/sample/northstar-air/service-area`, `/templates/sample/northstar-air/service-areas` | `/templates`, home, `/for/hvac`, internal sample nav | 2026-07-11 | KEEP |
| Harbor Wellness | `/templates/sample/harbor-wellness`, `/templates/sample/harbor-wellness/services`, `/templates/sample/harbor-wellness/about`, `/templates/sample/harbor-wellness/work`, `/templates/sample/harbor-wellness/contact`, `/templates/sample/harbor-wellness/service-area`, `/templates/sample/harbor-wellness/service-areas` | `/templates`, home, `/for/medical`, `/for/dental`, internal sample nav | 2026-07-11 | KEEP |
| Atlas Advisory | `/templates/sample/atlas-advisory`, `/templates/sample/atlas-advisory/services`, `/templates/sample/atlas-advisory/about`, `/templates/sample/atlas-advisory/work`, `/templates/sample/atlas-advisory/contact`, `/templates/sample/atlas-advisory/service-area`, `/templates/sample/atlas-advisory/service-areas` | `/templates`, home, `/for/consultant`, `/for/financial`, internal sample nav | 2026-07-11 | KEEP |
| Harbor Legal Group | `/templates/sample/harbor-legal-group`, `/templates/sample/harbor-legal-group/services`, `/templates/sample/harbor-legal-group/about`, `/templates/sample/harbor-legal-group/work`, `/templates/sample/harbor-legal-group/contact`, `/templates/sample/harbor-legal-group/service-area`, `/templates/sample/harbor-legal-group/service-areas` | `/templates`, home, `/for/attorney`, internal sample nav | 2026-07-11 | KEEP |
| Table & Hearth | `/templates/sample/table-and-hearth`, `/templates/sample/table-and-hearth/services`, `/templates/sample/table-and-hearth/about`, `/templates/sample/table-and-hearth/work`, `/templates/sample/table-and-hearth/contact` | `/templates`, home, `/for/restaurant`, internal sample nav | 2026-07-11 | KEEP |
| Mainline Plumbing | `/templates/sample/mainline-plumbing`, `/templates/sample/mainline-plumbing/services`, `/templates/sample/mainline-plumbing/about`, `/templates/sample/mainline-plumbing/work`, `/templates/sample/mainline-plumbing/contact`, `/templates/sample/mainline-plumbing/service-area`, `/templates/sample/mainline-plumbing/service-areas` | `/templates`, home, `/for/plumbing`, internal sample nav | 2026-07-11 | KEEP |

## Asset References

These are not routes, but they are template/demo assets referenced from source and should not be deleted without checking rendered previews:

- `/templates/ridgeline-roofing-desktop.svg` - referenced by `marketing/src/consts.ts`
- `/templates/ridgeline-roofing-mobile.svg` - referenced by `marketing/src/consts.ts`
- `/templates/airflow-hvac-desktop.svg` - referenced by `marketing/src/sampleBusinesses.ts`
