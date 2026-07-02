# WSS Deployment Architecture

Last audited: 2026-06-19

This document defines the intended Vercel deployment ownership for Website Support Studio and the evidence-based cleanup path for removing deployment ambiguity.

## Project Map

| Purpose | Vercel project | Project ID | Framework | Root directory | Status |
| --- | --- | --- | --- | --- | --- |
| Public marketing site | `website-support-studio-marketing` | `prj_myYknJzfeuKUGKqf8Q8lkGUBBzRJ` | Astro | `marketing` | Active production |
| Authenticated app / console | `website-support-studio` | `prj_RheP1gLzORf4V949im4zvk3LOurX` | Vite | `.` | Active app |
| Prospect preview microsites | `wss-prospect-previews` | `prj_9DSPXDYSTNmxdPnK2Ngot3nWULY9` | Other/static | `.` | Active previews |
| Stale marketing project | `marketing` | `prj_gHDHOqK71LmbhjOGAZBhRtMPzGLz` | Astro | `.` | Candidate archive |
| Stale root project | `website-support-studio-main` | `prj_jACEOnFaQ3UqN6VoPQRRqd0cCwfu` | Vite | `.` | Candidate archive |

## Domain Map

| Domain | Owning Vercel project | Purpose |
| --- | --- | --- |
| `www.websitesupportstudio.com` | `website-support-studio-marketing` | Public marketing site |
| `websitesupportstudio.com` | `website-support-studio-marketing` | Apex marketing redirect/site alias |
| `app.websitesupportstudio.com` | `website-support-studio` | Authenticated app / console |
| `previews.websitesupportstudio.com` | `wss-prospect-previews` | Prospect preview pages |

Vercel domain inspection for `websitesupportstudio.com` showed this exact split. Do not move domains unless replacing this architecture intentionally.

## Repo Map

Primary GitHub repository:

```text
gcorrist66/website-support-studio
```

Relevant repo paths:

| Path | Owner |
| --- | --- |
| `/` | `website-support-studio` Vite app |
| `/marketing` | `website-support-studio-marketing` Astro site |

Local Vercel links should be:

```text
/.vercel/project.json
  projectName: website-support-studio
  projectId: prj_RheP1gLzORf4V949im4zvk3LOurX

/marketing/.vercel/project.json
  projectName: website-support-studio-marketing
  projectId: prj_myYknJzfeuKUGKqf8Q8lkGUBBzRJ
```

## Branch Map

| Branch | Intended role |
| --- | --- |
| `services-hero-main` | Current production branch for the marketing site |
| Feature branches / PR branches | Preview deployments only |
| `main` | Legacy/default branch references exist in older deployment history; do not assume it controls current marketing production |

The desired marketing production path is:

```text
Merge PR
  -> services-hero-main
  -> website-support-studio-marketing production deployment
  -> www.websitesupportstudio.com
```

## Production Flow

Expected normal production flow:

1. Open PR against `services-hero-main`.
2. Review the `Vercel - website-support-studio-marketing` preview.
3. Merge PR into `services-hero-main`.
4. Vercel automatically creates a production deployment for `website-support-studio-marketing`.
5. Production aliases update:
   - `www.websitesupportstudio.com`
   - `websitesupportstudio.com`
6. Verify the production URL directly.

Current observed issue:

- Merge commit `149567360825a1b4f37302ca240d9e2dee7292d7` produced a deployment for `website-support-studio-marketing`, but that deployment had `target: null`.
- Production was updated only after a CLI promotion.
- The current production deployment `dpl_DJeYwgN6p7ZwxwWnq2qH4y6hNUXD` has metadata `action: promote` and `originalDeploymentId: dpl_6BypXEP5qwUaXe1pzhkna2nUjkeF`.

Minimum required dashboard verification:

- In Vercel, confirm `website-support-studio-marketing` has:
  - Git repository: `gcorrist66/website-support-studio`
  - Root directory: `marketing`
  - Production branch: `services-hero-main`
- If the production branch is not `services-hero-main`, update it there.
- After updating, test with one small approved PR and confirm the merge deployment has `target: production` without manual promotion.

## Preview Flow

PR preview deployments are expected from:

```text
Vercel - website-support-studio-marketing
```

The app project may also produce checks:

```text
Vercel - website-support-studio
```

That app check is not proof of the public marketing site. For marketing changes, verify the `website-support-studio-marketing` check and the public production domain after merge.

If duplicate checks are too noisy, configure ignored build steps or path filtering so:

- `website-support-studio-marketing` builds for `marketing/**` changes.
- `website-support-studio` builds for app/root changes.

Do not apply filtering until an app owner confirms which root paths must still trigger app deployments.

## Environment Variables

Audited by key only; secret values were not printed.

### `website-support-studio-marketing`

| Key | Targets |
| --- | --- |
| `PUBLIC_WSS_CHECKOUT_URL` | production |

### `website-support-studio`

| Key | Targets |
| --- | --- |
| `STRIPE_PRICE_TOPUP_50` | production |
| `STRIPE_PRICE_TOPUP_100` | production |
| `STRIPE_PRICE_TOPUP_250` | production |
| `VITE_WSS_REAL_AUTH_ENABLED` | production, preview |
| `VITE_SUPABASE_ANON_KEY` | production, preview |
| `VITE_SUPABASE_URL` | production, preview |

### `wss-prospect-previews`

No environment variables were listed.

## Emergency Rollback Procedure

Use rollback only after confirming the current production issue and the last known good deployment.

1. Identify the current production deployment:

```bash
vercel inspect https://www.websitesupportstudio.com
```

2. Review recent marketing deployments in Vercel:

```text
Vercel dashboard -> website-support-studio-marketing -> Deployments
```

3. Select the last known good production deployment for `website-support-studio-marketing`.
4. Use Vercel rollback/promote from the dashboard or CLI.
5. Verify:

```bash
curl -I https://www.websitesupportstudio.com
curl -L https://www.websitesupportstudio.com/free-website-preview
```

6. Confirm the expected page markers, forms, and calls to action.

Do not rollback the `website-support-studio` app project when the issue is on the public marketing site.

## Stale Project Assessment

### `marketing`

Evidence:

- Vercel project exists.
- It has only Vercel-generated domains:
  - `marketing-psi-ebon.vercel.app`
  - `marketing-gcorrist66s-projects.vercel.app`
  - `marketing-gcorrist66-gcorrist66s-projects.vercel.app`
- It does not own `www.websitesupportstudio.com` or `websitesupportstudio.com`.
- The local `marketing/.vercel/project.json` previously pointed here and has been corrected to `website-support-studio-marketing`.

Assessment:

- Safe archive candidate after checking dashboard traffic/analytics and confirming no external references depend on its Vercel URLs.

### `website-support-studio-main`

Evidence:

- Vercel project exists.
- It has only Vercel-generated domains:
  - `website-support-studio-main.vercel.app`
  - `website-support-studio-main-gcorrist66s-projects.vercel.app`
  - `website-support-studio-main-gcorrist66-gcorrist66s-projects.vercel.app`
- It does not own any `websitesupportstudio.com` domain.

Assessment:

- Safe archive candidate after checking dashboard traffic/analytics and confirming no external references depend on its Vercel URLs.

## Cleanup Checklist

1. Keep `website-support-studio-marketing` as the only production project for `www.websitesupportstudio.com` and `websitesupportstudio.com`.
2. Keep `website-support-studio` as the only project for `app.websitesupportstudio.com`.
3. Keep `wss-prospect-previews` as the only project for `previews.websitesupportstudio.com`.
4. Confirm `website-support-studio-marketing` production branch is `services-hero-main` in Vercel dashboard.
5. Confirm the next merge to `services-hero-main` creates `target: production` automatically.
6. Archive or disconnect stale projects only after checking traffic and external references.
