# Phase 1 — Full Site Audit (Launch Readiness / SEO Foundation)

**Repository:** website-support-studio
**Branch audited:** `phase3-local-foundation` @ `1f1b3d6`
**Date:** 2026-06-08
**Scope:** Read-only crawl of the codebase. No changes made.

---

## 0. Headline finding (read this first)

**There is no public-facing marketing website in this repository, and no SEO
foundation of any kind.**

The codebase is an **internal operator console** — a single-page React (Vite)
application that boots directly into an authenticated support-operations shell
(ticket queue, triage, draft reply, Gary-approval gate, audit timeline). This is
consistent with the project's own charter:

- `VISION.md`: "It is **not** a data platform, ticketing SaaS, or CRM."
- `README.md`: WSS is "a standalone project for operationalizing website support
  workflows."
- `ARCHITECTURE.md`: domain is `Agency → Client → Site → Ticket`; the app is a
  human-in-the-loop deterministic workflow console.

The Phase 2–7 work requested (multi-page B2B marketing site, legal pages,
flagship article, schema, sitemaps, robots, GEO/AEO) is therefore **net-new
construction**, not optimization of existing pages. Two structural blockers must
be resolved before that construction can begin — see §14.

---

## 1. Existing page inventory

| Route | Type | Status |
|---|---|---|
| `/` | CSR SPA shell → operator console (`AppShell.tsx`) | Exists (private app) |
| Home / About / Services / Pricing / Articles / Contact | Marketing pages | **Do not exist** |
| Privacy / Terms / Cookie | Legal pages | **Do not exist** |

- **No client-side router is installed** (`react-router` / `@tanstack/router`
  absent from `package.json`). The app is a single mounted component tree
  (`main.tsx` → `AppShell`). There are no distinct URLs/routes — every path
  serves the same `index.html`.
- No `src/pages/`, `src/routes/`, `content/`, or `articles/` directories exist.

## 2. Existing metadata

`index.html` (the only HTML document) contains:

```html
<title>website_support_studio</title>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#FAFAF7" />
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
<link rel="apple-touch-icon" href="/logomark-favicon-light-bg.svg" />
```

- **No `<meta name="description">`.**
- **No per-page metadata** (impossible without routing + SSR/SSG/Helmet).
- Title is the snake_case brand wordmark, not an SEO title.

## 3. Existing schema (structured data)
**None.** No JSON-LD, no `application/ld+json`, no microdata anywhere in the repo.

## 4. Existing robots.txt
**None.** No `public/robots.txt`. Crawlers currently receive no directives.

## 5. Existing sitemap generation
**None.** No `sitemap.xml`, no generation script, no build step that emits one.

## 6. Existing article/blog architecture
**None.** No content collection, no MDX/markdown pipeline, no article rendering,
no `/articles` route.

## 7. Existing legal pages
**None.** No Privacy Policy, Terms of Service, or Cookie Policy in any form.

## 8. Existing structured data
**None** (same as §3).

## 9. Existing OpenGraph implementation
**None.** No `og:*` tags. (Note: brand SVG social assets exist in `public/` —
`website-support-studio.svg`, `wss-tag.svg`, etc. — but no `og:image` is wired,
and no rasterized 1200×630 OG image exists.)

## 10. Existing Twitter/X metadata
**None.** No `twitter:*` tags.

## 11. Existing canonical implementation
**None.** No `<link rel="canonical">`.

## 12. Existing navigation architecture
- The only navigation is **inside the operator app** (`AppShell.tsx`): role
  switcher, ticket queue ↔ detail, approval queue. It is application UI, not
  site navigation.
- **No public site header/nav, no footer, no marketing IA.**

## 13. Existing internal linking structure
**None** in the public-site sense. The app has in-app state transitions only;
there are no crawlable `<a href>` links between content pages.

---

## Technical baseline (relevant to SEO work)

| Aspect | Current state |
|---|---|
| Framework | Vite 5 + React 18, **client-side rendered SPA** |
| Rendering | 100% CSR. HTML shipped to crawlers = empty `<div id="root">` |
| Routing | None installed |
| Backend | Supabase (auth, tickets, RLS); operator-only |
| Analytics | **None installed** (no GA/GTM/Plausible/PostHog/Segment) |
| Hosting | Not yet wired (`DEPLOYMENT_STRATEGY.md` is planning-only; no `vercel.json`/CI deploy) |
| Brand system | Mature & in-code: JetBrains Mono site-wide, 4-color palette (amber/cyan/mulberry/blue), snake_case voice (`MonoLabel`), `LogoLockup`. Brand tokens in `src/styles.css`. |

### SEO implication of CSR
Google *can* render JS, but AI answer engines and many crawlers (and the OG/Twitter
scrapers) **do not reliably execute JavaScript**. A pure CSR SPA will ship a blank
shell to most of the GEO/AEO surfaces this brief targets (ChatGPT, Claude,
Perplexity, Gemini, Copilot, social unfurlers). **Enterprise-grade SEO/GEO on this
brief is not achievable without a server-rendered or pre-rendered HTML layer.**

---

## 14. Blockers that must be resolved before Phase 2+

### Blocker A — Rendering architecture (technical decision)
Per-page `<title>`, meta description, canonical, OG/Twitter, and JSON-LD must be
present in the **initial HTML response**, not injected after hydration. Options:
1. Add a router + a static pre-render/SSG step within the existing Vite app
   (e.g. `vite-react-ssg` / `vite-plugin-ssr`/`vike`) for the public pages,
   leaving the operator console as a CSR island.
2. Stand up the public marketing site as a separate SSG/SSR framework
   (Next.js or Astro) and keep the Vite operator app as the authenticated app.
3. Accept CSR limitations (not recommended; defeats the GEO/AEO goal).

This is a genuine architecture decision the brief doesn't specify. It changes
every downstream file.

### Blocker B — Real business facts (content decision)
The brief forbids placeholder content and assumptions, but launch-ready Services,
Pricing, Contact, and especially the three legal pages require facts that are
**not present anywhere in the repo** and cannot be invented:

- Legal entity name & jurisdiction/governing law for ToS/Privacy (e.g. "Corriston
  Consulting, [state/country]").
- Privacy contact + data-request address; whether a DPO/privacy email exists.
- Which analytics/cookies will actually run at launch (currently **none**) — the
  Cookie/Privacy policies must describe reality.
- Sub-processors actually used (Supabase confirmed; email provider per
  `PHASE10_EMAIL_PROVIDER_PLAN.md` is still TBD; hosting/CDN TBD).
- Real Services scope, packaging, SLA/response tiers, and Pricing (figures or
  "contact sales" model).
- Public contact channel (sales email, support email, phone, mailing address).
- Canonical production domain (assumed `https://websitesupportstudio.com` — needs
  confirmation, incl. www vs apex).

---

## Recommendation
Phases 2–7 are ready to execute **as a build**, but only after (A) the rendering
architecture is chosen and (B) the business facts in Blocker B are supplied.
Proceeding without them would require fabricating an enterprise's legal, pricing,
and service reality — which the brief explicitly prohibits ("Do NOT make
assumptions. Do NOT create placeholder content.").
