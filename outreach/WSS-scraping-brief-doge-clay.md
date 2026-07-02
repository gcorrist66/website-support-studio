# WSS Prospect Sourcing Brief — for Doge (scrape) + Codex/Clay (enrich & verify)

Goal of this doc: give Doge an unambiguous spec so it returns **send-ready** WSS prospects — every row has an **owner first + last name** and a **deliverable email**. Then Clay (via Codex) verifies every email so we never bounce again.

---

## THE GOAL (fill in the 3 brackets, keep everything else)

> Find **{COUNT}** **{VERTICAL}** businesses **anywhere in the US** that are owner-operated and have a **weak or outdated website**. For each, return the **owner's first and last name**, a **deliverable email**, phone, website, and why the site is weak.

**Default first run:** `COUNT = 50` · `VERTICAL = roofing` · `GEO = United States (nationwide — do NOT restrict to one city/metro)`
(Then repeat for HVAC, plumbing, garage doors, etc.)

**Why nationwide:** the qualifying combination (owner-operated + weak/no site + findable owner name + real email) is rare, so geography must be the *widest* variable or the pool starves. WSS builds/hosts/maintains remotely — the client's location is irrelevant to fulfillment, so a match in any state is equally good. Spread the count across many metros; don't let Doge clump all 50 in one city.

---

## WHO QUALIFIES (ICP — all must be true)

1. **Local, owner-operated** service business that depends on **local consumer leads**.
2. **Industry = the target vertical** (Tier A: roofing, HVAC, plumbing, electrical, landscaping, garage doors, remodeling, pressure washing, pest control, flooring, painting, auto repair, dentists, chiropractors, PT, vet, med spa).
3. **Small:** roughly 3–50 employees / under ~$25M revenue. NOT national, NOT a franchise HQ.
4. **Website exists but is WEAK** — the WSS opportunity. Qualifies if it meets **2+** of:
   - Fewer than ~10 real pages
   - Dated / generic-template / clip-art design, old copyright year
   - Not mobile-friendly
   - No online booking and no quote/estimate form (phone-only or a bare contact form)
   - No reviews or trust signals surfaced on the site
   - **OR no real website at all** (social-only / GBP-only) — also qualifies; mark `website_pages = no-site`.

## HARD DISQUALIFIERS (skip — do not return)

- National chains, franchises, multi-state/enterprise operators
- **B2B / commercial-only** contractors (serve GCs, builders, facilities — not homeowners)
- Marketing agencies, recruiters, staffing, associations, directories, SaaS, publications
- Businesses with a **strong, modern, well-built** site (no WSS pain)
- No findable **owner name** OR no **deliverable email**

## REQUIRED OUTPUT (one CSV, these exact columns)

`company, owner_first_name, owner_last_name, owner_email, email_status, phone, website_url, city, state, industry, website_pages, reviews, weakness_note`

- `owner_email`: prefer the owner's **direct or named** email; use `info@/contact@` only if no owner email exists (and note it).
- `email_status`: `verified` or `likely`.
- `website_pages`: a number, or `no-site`.
- `reviews`: count + rating if available (e.g., "47 ★4.8").
- `weakness_note`: one line on *why* the site is weak (the hook), e.g. "2014 template, no quote form, not mobile."

## QUALITY RULES

- **Every row must have owner first name + last name + an email.** Drop rows missing either.
- One row per business; **dedupe** by domain and by email.
- Don't pad to hit the count with weak matches — fewer, cleaner rows beat a padded list.

---

## ENRICHMENT + VERIFY BACKSTOP (Codex + Clay)

For any business where Doge has company/domain but is missing the owner email or last name, run a Clay table:

1. Input: `company`, `domain`, `owner_name` (if known), `city/state`.
2. **Find owner** (if missing): Clay person-find by company + domain → returns first/last name + title (filter to Owner/Founder/President).
3. **Find email:** Clay "Find Work Email" **waterfall** (e.g., Prospeo → Datagma → FindyMail).
4. **VERIFY every email:** Clay email-verification (e.g., ZeroBounce / NeverBounce). **Only keep `valid/deliverable`.** ← this is what kills the bounce problem.
5. Output the same column schema above.

> Rule going forward: **nothing gets emailed that Clay hasn't verified as deliverable.** That single step prevents the akap.com / alltrees bounces.

---

## THEN — load & send

- Verified CSV → **Apollo** (Add Contacts → Upload CSV → map fields → Add to sequence), **or** the phone-first / preview-first motion.
- Personalize each email with `owner_first_name` + `weakness_note`.
- Suppress against: anyone already emailed, the CBO list, and Corriston warm contacts.

---

## Tip for directing Doge
Be this literal in the prompt: *"Return 50 rows. Each row MUST have owner first name, owner last name, and a working email — if you can't find all three for a business, skip it and find another. Output as CSV with these columns: [paste columns]. Only residential/consumer roofing companies, owner-operated, with a weak or missing website. No franchises, no commercial-only roofers, no agencies."* Precision in the ask = precision in the output.
