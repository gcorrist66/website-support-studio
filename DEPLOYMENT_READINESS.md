# Website Support Studio — Deployment Readiness Report

**Date:** 2026-06-08
**Repository:** website-support-studio
**Branch:** `phase3-local-foundation`
**Status:** Configured and validated. **No commit, no push performed.**

---

## 1. Goal & outcome

Serve the Astro marketing site as the public root at `https://websitesupportstudio.com`
while preserving the existing Vite operator console separately. Achieved via **two
Vercel projects in one repository**:

| Project | Root Directory | Domain | Indexable | Framework |
|---|---|---|---|---|
| Marketing (public) | `marketing/` | `websitesupportstudio.com` (apex) | **Yes** | Astro (static) |
| Operator console (private) | repo root (`./`) | `app.websitesupportstudio.com` | **No** (noindex) | Vite SPA |

**Why subdomain, not `/app` path:** the console is a separate build system. A
subdomain requires **zero changes to the console** (no Vite `base` rewrite, no path
collisions) and lets `robots.txt` + `sitemap.xml` serve cleanly from the apex root.
The `/app` path alternative is documented in §6 but not implemented because it would
require modifying the console.

---

## 2. Files changed

**All additive. The operator console (`src/`, root `index.html`, root `package.json`) is unchanged.**

New deployment/analytics files:
- `vercel.json` (root) — console project: SPA rewrite + `X-Robots-Tag: noindex` + security headers.
- `public/robots.txt` (root) — console: `Disallow: /` (belt-and-suspenders with the header).
- `marketing/vercel.json` — marketing project: Astro static, asset cache + security headers.
- `marketing/src/components/Analytics.astro` — env-gated GA4 (gtag) + GTM. No hardcoded IDs.
- `marketing/.env.example` — documents `PUBLIC_GA4_ID` / `PUBLIC_GTM_ID`.
- `marketing/src/layouts/BaseLayout.astro` — wires `<Analytics />` into `<head>` and the GTM `<noscript>` after `<body>`.
- `marketing/.gitignore` — adds `.env`, `.env.*` (keeps `.env.example`), `.vercel`.

No brand copy was changed and no pages were rewritten.

---

## 3. Build results

```
Marketing (analytics OFF, default):  astro check 0 errors → 11 routes built → sitemap created
Marketing (PUBLIC_GA4_ID + PUBLIC_GTM_ID set): gtag loader + GTM container + GTM noscript injected
Marketing (no env):                  0 googletagmanager references in dist  ← nothing hardcoded
Operator console (npm run build):    ✓ built (Vite), unchanged
```

Validation:
- **robots.txt** (apex) — allows crawlers incl. AI bots; `Disallow: /app /admin /api/ /login /account`; references sitemap.
- **sitemap-0.xml** — 10 public URLs; **0 private/auth/operator routes**; 404 excluded.
- **canonicals** — all apex, self-referencing, correct trailing-slash handling.
- **internal links** — 0 broken.
- **analytics** — off unless env set; injected correctly when set; no IDs in source.
- **JSON configs** — both `vercel.json` files valid.

---

## 4. Recommended production routing

```
                          Vercel (one Git repo, two projects)
                          ┌─────────────────────────────────────────────┐
 websitesupportstudio.com │  Project A · Root Dir: marketing/  (Astro)   │  → public, indexed
        (apex + www→apex) │    serves /, robots.txt, sitemap-index.xml   │
                          ├─────────────────────────────────────────────┤
app.websitesupportstudio  │  Project B · Root Dir: ./  (Vite SPA)        │  → private, noindex
              .com        │    X-Robots-Tag: noindex + robots Disallow:/ │
                          └─────────────────────────────────────────────┘
```

- Add a redirect so `www.websitesupportstudio.com` → `https://websitesupportstudio.com` (Vercel domain setting; apex is canonical).
- Point `app.` subdomain DNS to Project B.

---

## 5. Required Vercel / hosting settings

**Project A — marketing (public)**
- Root Directory: `marketing/`
- Framework preset: Astro (auto-detected; `marketing/vercel.json` pins build/output).
- Build: `npm run build` · Output: `dist`
- Production domain: `websitesupportstudio.com` (+ `www` redirect to apex).
- Env vars (Production) — **optional, analytics off until set**:
  - `PUBLIC_GA4_ID` = your `G-XXXXXXXXXX` (if using GA4), and/or
  - `PUBLIC_GTM_ID` = your `GTM-XXXXXXX` (if using GTM).

**Project B — operator console (private)**
- Root Directory: `./` (repo root)
- Framework preset: Vite (root `vercel.json` pins build/output, SPA rewrite, noindex headers).
- Build: `npm run build` · Output: `dist`
- Production domain: `app.websitesupportstudio.com`
- Env vars (Production): the console's Supabase vars (`WSS_SUPABASE_*` per `.env.example`) as applicable.

> Two projects from one repo: set each project's **Root Directory** as above. Vercel reads the `vercel.json` inside each project's root directory, so the configs do not collide.

---

## 6. Alternative: console at `/app` (not implemented)

If a single domain is required instead of a subdomain:
1. Set Vite `base: "/app/"` in `vite.config.ts` (this **changes the console build** — currently avoided).
2. Combine both build outputs and add apex `vercel.json` rewrites mapping `/app/*` → console, everything else → marketing.
3. Re-test asset paths and the SPA fallback under `/app`.
This is more fragile and touches the console, so the subdomain split in §4 is recommended.

---

## 7. Risks before push

1. **DNS / domains not yet attached** — apex and `app.` must be added to the two Vercel projects and DNS pointed. Until then, only preview URLs resolve.
2. **`marketing/` is a nested npm project** — confirm Project A's Root Directory is `marketing/` so Vercel installs/builds there, not at repo root.
3. **Analytics env not set** — by design, GA4/GTM are off until `PUBLIC_GA4_ID`/`PUBLIC_GTM_ID` are added in Vercel. The Privacy/Cookie policies describe GA4; set the env (or note analytics is pending) so policy matches reality.
4. **Console is shipped client-side** — it is `noindex` + `Disallow: /` and SPA-rewritten, but it is **not auth-gated by this config**. Auth/RLS protection is the console app's responsibility (tracked in the repo's PHASE6/PHASE7 auth docs); deployment config does not substitute for it.
5. **`@astrojs/sitemap` pinned to `3.2.1`** for Astro 4 compatibility — unpin if Astro is upgraded to v5.
6. **OG image** is the shared brand default; per-page/custom OG and self-hosted fonts remain as polish items (from the prior launch report).

---

## 8. Exact next command to push / deploy (DO NOT RUN until reviewed)

**Option A — Git-triggered deploy (recommended once projects are linked to the repo):**
```bash
cd /Users/corristonconsulting/Projects/website-support-studio
git add -A
git commit -m "Add WSS marketing site (Astro) + production deployment config"
git push origin phase3-local-foundation
# Vercel auto-builds both projects from their Root Directories on push.
```

**Option B — Vercel CLI manual production deploys (one per project):**
```bash
# Marketing (public apex) — from the marketing/ project root
cd /Users/corristonconsulting/Projects/website-support-studio/marketing
vercel --prod

# Operator console (private subdomain) — from the repo root
cd /Users/corristonconsulting/Projects/website-support-studio
vercel --prod
```

> Before first deploy, link each directory to its Vercel project: `vercel link`
> (set Root Directory to `marketing/` for Project A and `./` for Project B), then
> add the production domains and env vars per §5.

**No commit and no push were made. All changes are in the working tree for review.**
