# Phase 1 — Template Audit (2026 quality bar)

Scope = public sample templates surfaced by `DESIGN_SYSTEMS` in `marketing/src/consts.ts`, plus the back-office portal demo and the `/templates` catalog. Ranks: **A = Keep, B = Refresh, C = Rebuild.**

## Architecture facts (ground truth)
- 8 sample businesses share ONE layout — `components/sample-sites/SampleBusinessLayout.astro` — driven by `sampleBusinesses.ts` (systemKeys: summit/harbor/atlas/ember/foundry). Fixing this layout lifts all 8 at once.
  - harbor-wellness, ridgeline-roofing, greenline-landscaping, northstar-air, mainline-plumbing, table-and-hearth, atlas-advisory, harbor-legal-group
- Luna design system = 3 single-brand layouts: `MarigoldManeLayout` (salon / Marigold & Mane), `MoonroomCoffeeLayout` (Moonroom Coffee), `WillowThreadLayout` (Willow Thread / boutique), each with its own data file.
- `back-office` portal demo: `pages/templates/sample/back-office/index.astro`.
- Legacy/not gallery-linked: `LunaDemoSite.astro` + `luna.ts` + `pages/templates/luna/index.astro`, and standalone `pages/templates/ridgeline-roofing/*` (gallery links to the sample-business ridgeline instead). Left as-is.

## Cross-cutting defects vs the bar (the reasons for the B grades)
1. **No mobile hamburger nav** — every sample layout (SampleBusinessLayout + all 3 Luna layouts) hides nav with `display:none` at ≤900px and offers no menu. Mobile users can't navigate. (Critical.)
2. **Text-only galleries/proof** — Luna galleries render `{item}` strings in gradient tiles; SampleBusinessLayout proof tiles are gradient+text. No real image proof → looks unfinished for visual businesses.
3. **SampleBusinessLayout hero H1 too small** — `clamp(1.18rem,3.4vw,2.1rem)`; max 2.1rem desktop is weak vs leaders.
4. **Weak phone/CTA model in SampleBusinessLayout** — no phone in header; sticky mobile bar only says "Build My Website" (WSS upsell), not a business action (Call / Request).
5. **No icon trust row** in SampleBusinessLayout hero (trust is buried as text bullets lower down).

## Rankings
| Template | Rank | Reasoning (vs bar) |
|---|---|---|
| **SampleBusinessLayout family** (8 businesses) | **B — Refresh** | Strong structure, completeness, local specificity. Held back by small hero H1, no mobile nav, text-only proof, weak phone surfacing, no hero trust row. One shared refresh fixes all 8. |
| **Luna — Marigold & Mane (salon)** | **B — Refresh** | Great hero type, CTA hierarchy, story. Gaps: text-only gallery, no mobile hamburger. |
| **Luna — Moonroom Coffee** | **B — Refresh** | Same strengths/gaps; events section is a plus. |
| **Luna — Willow Thread (boutique)** | **B — Refresh** | Same strengths/gaps; collections clear; needs image gallery + mobile nav. |
| **Back-office portal demo** | **A — Keep** | Credible owner dashboard (leads, requests, analytics, plan) that justifies the managed fee. No fabricated data. Optional minor polish only. |
| **/templates catalog page** | **A — Keep** | Clear storefront for the design systems; not a per-business template. |
| Legacy LunaDemoSite / standalone ridgeline pages | n/a (Keep, not surfaced) | Not linked from the gallery; out of scope. |

**KEEP:** back-office portal, /templates catalog (+ legacy/unsurfaced pages left untouched).
**REFRESH:** SampleBusinessLayout (8 businesses) + Marigold & Mane + Moonroom Coffee + Willow Thread.
**REBUILD:** none — nothing is broken enough to warrant a from-scratch rebuild; targeted refreshes reach the bar.
