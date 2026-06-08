# WSS Tenant-Model Decision — Canonical Agency, Resolution, Slugs, Onboarding

**Date:** 2026-06-08
**Status:** Architecture decision pass. No code, no SQL, no migrations, no commits.
**Source of truth:** `AUTH_FOUNDATION_PLAN.md`, `AUTH_CUSTOMER_IDENTITY_DESIGN.md`.
**Resolves:** the Phase D onboarding RPC blocker (canonical `agency_id` + slug strategy).
**Not in scope:** RLS (Phase E) is NOT started here.

> Decisive prior input: WSS is being *"split out so I can grow it at scale but keep Corriston Consulting's instance separate."* That means WSS is its own first-party operation, with Corriston Consulting as a *separate* tenant later — which points directly at the agency model below.

---

## 1. Recommended agency model

**Decision: Option A — a single canonical first-party agency named "Website Support Studio", architected to be multi-agency-ready (Option C deferred, not built now). Reject B and day-one C.**

- The `agency` row is the **operating service provider** whose operators triage/approve and who owns client relationships. The first-party operator of the platform is WSS itself.
- **Corriston Consulting, LLC** remains the **legal operator/owner** (reflected in branding and legal pages) and, per your split-to-scale intent, becomes **its own agency tenant later** — exactly the "keep Corriston's instance separate" outcome. Naming the canonical agency "Corriston Consulting" (Option B) would re-conflate the two you just separated.
- **Option C (multi-agency on day one)** is over-engineering: no second agency exists yet, and it would force agency-context resolution and broader RLS before there's demand. The hierarchy already supports N agencies, so multi-agency stays **additive** — we build one agency now without precluding many.

**Canonical agency identity:** name = `Website Support Studio`, slug = `website-support-studio` (a real production agency row created by a real bootstrap migration — never the dev seed `…00a6`).

| Dimension | Implication of Option A |
|---|---|
| **Operational** | One first-party desk; all current operators belong to the WSS agency. Clean, single-tenant operations today. |
| **Reporting** | Metrics roll up under one agency now; when Corriston's instance / resellers become agencies, reporting naturally partitions by `agency_id` with no remodeling. |
| **Onboarding** | Every new customer org is created under the canonical WSS agency by default — a single deterministic parent (see §2). |
| **Reseller (future)** | A reseller = a new `agencies` row + `agency_members`; their customers are `clients` under their `agency_id`. No schema change. |
| **White-label (future)** | A white-label partner is just another agency with its own brand/domain mapping to its `agency_id`; agency resolution (§2) keys off the entry context, defaulting to WSS. |

---

## 2. Agency resolution design

**Principle: resolve by a stable canonical SLUG (config-driven), never by a hardcoded UUID, and fail closed.**

- A real **bootstrap migration** creates the canonical agency with slug `website-support-studio` (generated UUID, not the dev seed id). The dev seed agency stays dev-only and is never used in production.
- Onboarding resolves `agency_id` by looking up the agency whose `slug` equals a **canonical-slug constant** (sourced from app/server config, e.g. `WSS_CANONICAL_AGENCY_SLUG`, default `website-support-studio`) — **not** a literal UUID baked into code.
- **Future-compatible:** the resolver accepts an optional *agency context* (reseller/white-label entry point — e.g. a signup-surface key or custom domain). When context is present, resolve that agency; when absent, fall back to the canonical WSS agency.

**Onboarding flow (agency step):**
1. Determine agency context from the entry point (none today → canonical).
2. Resolve `agency_id := select id from agencies where slug = <resolved-slug>`.
3. Proceed with org creation under that `agency_id`.

**Lookup flow:**
`canonical-slug (config)` → `agencies.slug` lookup → `agency_id`.

**Fallback behavior (fail closed):**
- If the canonical agency row does **not** exist → onboarding **aborts with a clear error**; it must **never** orphan an org or fall back to the dev seed agency. The bootstrap migration is therefore a hard prerequisite for enabling onboarding.
- If an *unknown* agency context is supplied → reject (do not silently default a reseller signup to WSS) — except the explicit "no context" case, which defaults to canonical.

---

## 3. Client slug algorithm (exact)

Goal: deterministic, collision-safe, human-readable, URL-safe, unique within `(agency_id, slug)`.

**Base generation (from company name):**
1. Unicode-normalize (NFKD) and strip combining diacritics → ASCII (e.g. `Café` → `cafe`).
2. Lowercase.
3. Replace every run of non-`[a-z0-9]` characters with a single hyphen `-`.
4. Trim leading/trailing hyphens; collapse repeated hyphens to one.
5. Truncate to a max length (recommend **50**), then trim any trailing hyphen left by truncation.
6. If the result is empty (name was all symbols) → use fallback base `org`.
7. If the base equals a **reserved word** (`admin`, `api`, `app`, `auth`, `login`, `logout`, `callback`, `settings`, `billing`, `new`, `org`, `www`) → treat as a collision (go to uniqueness with a numeric suffix).

**Uniqueness within the agency:**
8. If `base` is free for this `agency_id` → use `base`.
9. Else append `-2`, `-3`, … : pick the **lowest integer n ≥ 2** such that `base-n` is free.
10. **Concurrency safety:** rely on the `unique(agency_id, slug)` constraint — attempt the insert; on unique violation, increment `n` and retry (bounded retries). The DB constraint, not the pre-check, is the source of truth.

**Examples:** `Acme Corporation` → `acme-corporation`; second `Acme Corporation` → `acme-corporation-2`; `Café & Co.!!!` → `cafe-co`.

---

## 4. Site slug algorithm (exact)

Goal: same properties, unique within `(client_id, slug)`. Derived from the website URL.

**Base generation (from website URL):**
1. If the input has no scheme, treat the whole string as a host; else parse the URL and take the **host**.
2. Lowercase the host; drop userinfo, port, path, query, and fragment.
3. Strip a leading `www.` (only `www.`, not other subdomains).
4. Convert IDN/Unicode hosts to ASCII (punycode) — or NFKD→ASCII as in §3.
5. Replace every run of non-`[a-z0-9]` (including dots) with a single hyphen `-`.
6. Trim/collapse hyphens; truncate to max length (recommend **63**); trim trailing hyphen.
7. If empty/unparseable → fall back to slugifying the org/company name, else `site`.

**Uniqueness within the client:** identical suffixing + constraint-retry strategy as §3 (steps 8–10), against `unique(client_id, slug)`.

**Examples:** `example.com` → `example-com`; `https://www.example.com/path?x=1` → `example-com`; `blog.example.com` → `blog-example-com`; collision → `example-com-2`.

---

## 5. First-site creation recommendation

**Decision: Option A — auto-create the first site during onboarding when a valid `website_url` is provided, with a graceful Option-B fallback when it is absent or invalid.**

- If `website_url` parses to a valid host → create the first `sites` row (slug per §4) in the same onboarding transaction.
- If `website_url` is missing/invalid → create the org **without** a site; the workspace prompts "add your first site." (An org may exist with zero sites.)

| Lens | Impact |
|---|---|
| **UX** | Fastest activation — the customer lands on a workspace that already reflects their site; no empty first screen. Invalid URLs degrade gracefully instead of blocking signup. |
| **Operational** | Most orgs immediately have ≥1 site, so requests (`tickets.site_id`) attach cleanly; fewer empty/orphan orgs for operators to chase. |
| **Support** | Operators see the customer's site from minute one (context for triage); the "add a site" prompt covers the multi-site / bad-URL minority. |

---

## 6. Final recommended onboarding flow

```
OAuth login (Google/GitHub)            [dev-flag gated; prod OAuth still OFF]
        ↓
/auth/callback → verified session (auth.uid())
        ↓
resolve membership by auth_user_id  (operators? org_members?)
        ↓  (none found, and no pending invite)
onboarding form  → company_name, website_url, website_count, cms_platform,
                   primary_contact_name, primary_contact_email, support_email
        ↓
complete_customer_onboarding(...)   — single atomic transaction, security definer:
   1. resolve agency_id  (canonical slug; FAIL CLOSED if missing — §2)
   2. idempotency: if this auth_user already has an ACTIVE org_owner membership
        → return that org_id + its onboarding_status (no duplicate org)
   3. create clients (organization): name=company_name, agency_id, slug=§3
   4. create org_profiles: metadata + onboarding_status
        = 'complete' if required data present, else 'onboarding_required'
        (required = company_name + primary_contact_email + (a site OR website_count))
   5. create org_members: this auth_user as org_owner, status='active'
   6. if website_url is valid → create first sites row (slug=§4); else skip
   7. commit; return { org_id, onboarding_status }
        ↓
workspace activation:
   app re-resolves membership → routes to the customer portal scoped to org_id.
   while onboarding_status='onboarding_required' → show finish-setup prompt
   (e.g. add first site); otherwise → active customer workspace.
```

Properties: **atomic** (all-or-nothing), **idempotent** (re-run returns the existing org), **fail-closed** on agency resolution, **binds by `auth_user_id`** (never email), **creates exactly one `org_owner`** (per the design's single-owner invariant).

---

## 7. Remaining blockers (ranked)

**Before the onboarding RPC can be implemented safely:**
1. **Canonical agency bootstrap** — a real (non-seed) production agency row (`website-support-studio`) + config constant for its slug. *(Foundational; everything else depends on it.)*
2. **Slug helpers** — implement §3/§4 + the reserved-word list + constraint-retry.
3. **"Required data" definition** for `onboarding_status='complete'` (proposed in §6.4 — confirm).
4. **RPC shape** — transactional, `security definer`, idempotent on `auth.uid()`.

**Before RLS (Phase E):**
5. **Final policy model** for both domains (`org_members` customer scope, `operators` agency scope) — the identity model is now final, so this is unblocked to design.
6. **Operator auth linkage** — `operators.auth_user_id` is still unlinked; staff have no real session yet. Needed so operator RLS policies have a subject.
7. **Security-definer vs RLS interplay** — confirm the onboarding RPC writes correctly under RLS once enabled.

**Before production OAuth / real customer access:**
8. **RLS enabled + verified** (hard gate — no real customer may exist without it).
9. **Production Supabase project** + Google/GitHub provider config + redirect allow-list (prod ref still TBD).
10. **Onboarding RPC live** (so a logged-in customer actually gets a workspace).
11. **Flip `VITE_WSS_REAL_AUTH_ENABLED` in production** — the very last step, gated on all above + Production Verified.

**Overall dependency order:** 1 → 2 → 3/4 (completes Phase D) → 5/6/7 (Phase E design) → 8 (Phase E enable+verify) → 9/10 → 11.

---

## 8. Recommended next phase

**Complete Phase D (still dev-flag-only, NO RLS, NO production access):**
1. Add a **canonical-agency bootstrap migration** (`website-support-studio`, real UUID, config-driven slug; dev seed untouched).
2. Implement the **slug helpers** (§3/§4) with reserved words + constraint-retry.
3. Implement **`complete_customer_onboarding`** per §6 (atomic, idempotent, fail-closed agency resolution).
4. Verify on the **dev** project only; keep `VITE_WSS_REAL_AUTH_ENABLED` off.

**Then — and only then — Phase E (RLS):** design + enable + verify policies for the customer and operator domains before any production OAuth or customer access. Per Gary's workflow, none of this is "done" until Committed → Pushed → Deployed → **Production Verified**.
