# Phase 3 — What Changed (local only)

Branch: `template-refresh-2026` (worktree `wss-template-refresh`, off `main`). No deploy, no push, no Vercel, no production changes. Production prospect previews untouched (separate repo).

## Files changed (13 source files, +223 / −41)
**Shared layout (lifts all 8 sample businesses):**
- `marketing/src/components/sample-sites/SampleBusinessLayout.astro`

**Luna brand layouts:**
- `marketing/src/components/MarigoldManeLayout.astro`
- `marketing/src/components/MoonroomCoffeeLayout.astro`
- `marketing/src/components/WillowThreadLayout.astro`

**Luna data (galleries → image objects):**
- `marketing/src/marigoldMane.ts`, `marketing/src/moonroomCoffee.ts`, `marketing/src/willowThread.ts`

**Luna page renders (text tiles → image tiles):**
- `luna/salon/index.astro`, `luna/salon/gallery/index.astro`
- `luna/coffee-shop/index.astro`, `luna/coffee-shop/events/index.astro`
- `luna/boutique/index.astro`, `luna/boutique/visit/index.astro`

## SampleBusinessLayout (8 businesses: harbor-wellness, ridgeline-roofing, greenline-landscaping, northstar-air, mainline-plumbing, table-and-hearth, atlas-advisory, harbor-legal-group)
1. **Mobile hamburger nav** — replaced `display:none` nav with an accessible hamburger → slide-in drawer (nav links + phone + Preview Back Office + Build My Website; aria-expanded, click/Esc to close, scroll-lock). Fixes the critical mobile-nav defect.
2. **Bigger hero H1** — `clamp(1.18rem,3.4vw,2.1rem)` → `clamp(2rem,4.6vw,3.2rem)` (desktop now 51px); mobile floor raised to ~1.7rem. Confident, leader-grade hero.
3. **Phone surfaced** — business phone added to desktop header and the mobile drawer; mobile sticky bar changed from one button to **Call + Build My Website**.
4. **Proof tiles polished** — scenario tiles get a numbered eyebrow ("Scenario 01") + tighter typography/contrast (still honest scenario labels, no fake photos).

## Luna brand layouts (Marigold & Mane salon, Moonroom Coffee, Willow Thread boutique)
1. **Mobile hamburger nav** — same accessible hamburger→drawer pattern (nav + Preview Back Office + primary CTA).
2. **Real image galleries** — text-in-gradient tiles replaced with captioned stock images (`{img, caption}`, existing labels reused as captions; tasteful on-theme Unsplash, `object-fit:cover`, lazy). Big perceived-value lift for visual businesses. Salon: home + gallery page. Coffee: events page grid. Boutique: home + visit page.
3. **Sticky mobile bar** — now primary business action + Build My Website (salon → Request Appointment, coffee → Plan Your Visit, boutique → Plan Your Visit).

## Kept as-is (A)
- **Back-office portal demo** — already a credible owner dashboard (leads, requests, analytics, plan) that justifies the managed fee.
- `/templates` catalog page; legacy/unsurfaced `LunaDemoSite` + standalone ridgeline pages.

## No fabrication
No reviews, ratings, review counts, testimonials, certifications, licenses, awards, or results were invented. Stock gallery imagery is design content consistent with the existing hero images and the clearly-labeled fictional-sample framing — not fake social proof.

## Phase 4 — Value test ($500 setup + ~$200/mo): PASS
Each refreshed template now leads with a confident hero, surfaces the phone/primary action everywhere (header + sticky bar), navigates properly on mobile, and shows real visual proof (galleries) or honest scenario proof. Combined with the credible back-office dashboard, the set reads as a legitimate done-for-you build + managed service. A small-business owner comparing these to the quality leaders would find them believable and worth the price.
