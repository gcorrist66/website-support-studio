# Phase 5 — Local QA Results

Method: `npm run build` in `marketing/` (104 pages, 0 errors), then served `marketing/dist` locally and inspected pages at desktop (1280), tablet (768), and mobile (390) via headless browser (layout metrics + console + screenshots).

## To reproduce locally (no deploy)
```bash
cd /Users/corristonconsulting/Projects/wss-template-refresh/marketing
npm install          # first time only (node_modules is gitignored)
npm run build
npx serve dist       # or: python3 -m http.server 8788 --directory dist
```
Then visit e.g. `/templates/sample/northstar-air/`, `/templates/luna/salon/`, `/templates/luna/coffee-shop/events/`, `/templates/luna/boutique/`, `/templates/sample/back-office/`.

## Results
| Check | Result |
|---|---|
| Build | ✅ 104 pages, 0 errors/warnings |
| Horizontal overflow (desktop/tablet/mobile) | ✅ overflowX = 0 on every page checked (sample businesses, all 3 Luna brands, back-office). Service-map pins are clipped inside `overflow:hidden` and do not scroll the document. |
| Broken images | ✅ none — all gallery/hero/section images load (first-paint `naturalWidth:0` readings were lazy-load timing; confirmed loaded on eager). |
| Console errors | ✅ none across the full navigation sweep |
| CTA visibility | ✅ phone in header + sticky Call/primary-action bar on mobile; dual CTAs in hero; conversion strip + founder CTA preserved |
| Mobile usability | ✅ hamburger → accessible drawer (nav + phone + actions; Esc/click-to-close) works on sample + Luna layouts |
| Galleries (Luna) | ✅ salon home 3 imgs, coffee events 6 imgs, boutique home 3 imgs — all load, captioned |
| Hero hierarchy | ✅ SampleBusinessLayout H1 now 3.2rem desktop (was 2.1rem) |

## Pages spot-checked
- Sample businesses: northstar-air (desktop+mobile, hamburger drawer verified), table-and-hearth (mobile)
- Luna: salon (desktop+tablet+mobile), coffee-shop home + events, boutique home
- back-office portal (mobile)

## Screenshots captured during QA (in session)
- Northstar Air — desktop hero (big H1, header phone, hero image)
- Northstar Air — mobile hamburger drawer (nav + phone + actions)
- Marigold & Mane — desktop hero (warm palette, hero image, dual CTA)
Re-generate any view with the local serve command above.

## GO / NO-GO: **GO (local)**
Build green, QA clean across breakpoints, no overflow / broken images / console errors, mobile nav fixed, perceived value raised to the 2026 bar. Ready for your review on `template-refresh-2026`. Nothing deployed, pushed, or changed in production.
