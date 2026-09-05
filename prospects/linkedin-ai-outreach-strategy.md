# LinkedIn → AI Consulting Outreach — Strategy Framework

**Brand:** Corriston Consulting · **Audience:** existing LinkedIn connections (warm-ish, in Zoho) · **Goal:** book AI-consulting conversations
**Status:** Framework v1 (for Gary's review). Buckets are hypotheses to validate against the actual Zoho field distribution before we write copy.
**Date:** 2026-06-18

---

## 0. ⚠️ CRITICAL FINDING (2026-06-18): email coverage is the real constraint

The grand vertical plan assumed we could *reach* people by **email**. We can't — confirmed against the actual LinkedIn data export (6,883 connections, 30 May 2026). The real funnel:

| Stage | Count | Note |
|---|---|---|
| LinkedIn 1st-degree connections (export) | 6,883 | Matches the ~6,500 in Zoho |
| **Have an email address** | **174 (2.5%)** | LinkedIn only shares email for connections who opted in |
| Minus the 100 already in CBO | **74** | CBO took the emailable cream |
| Minus poor-fit (IT, HR, students, etc.) | **48** | And these 48 are weak — IT analysts, a postdoc, a pilates instructor. Not buyers. |

**Email is effectively a dead channel for this campaign.** But the export fixes the problem a better way: every connection has a **profile URL**, and they're **1st-degree** — so LinkedIn DMs reach them with no email needed. Reachable, fit-filtered pools (CBO overlap already removed), built to `prospects/linkedin-export-targets/`:

| Bucket (file) | Usable (LinkedIn-reachable) | w/ email |
|---|---|---|
| `owners.csv` — Founders/Owners/CEOs (Track B) | **1,203** | 8 |
| `marketing-leaders.csv` (Track A/B) | 193 | 0 |
| `growth-ops.csv` — operators (Track B) | 101 | 0 |
| `healthcare.csv` (Track A) | 53 | 1 |
| `ecommerce.csv` (Track B) | 24 | 0 |
| `partner-agency.csv` — leave to CBO / referral | 107 | 0 |

**Implications:**
1. **Channel decision: LinkedIn DMs, not email.** That's where the owners and verticals actually live. The "assistant that never sleeps" warm message is ideal as a 1st-degree DM.
2. Email stays a *tiny optional* side-test (`wave1-email-residual.csv`, 48 weak fits) — low value, only if you want to compare channels.
3. Optional later: enrichment (Apollo/Clay) to add emails to the 1,203 owners if you want an email channel at scale. Not needed to start.
4. LinkedIn DMs are **rate-limited** (~20–30/day safe) and have **no subject line** — shorter format than email. Reinforces small, steady waves.

Everything below holds as the *messaging/segmentation* plan; we're now running it on **LinkedIn** as the primary channel.

---

## 1. Positioning — two angles, two emotional buyers

We have two strong lines. They are **not** interchangeable subject lines for one campaign — they target different people and pull different offers. Treat them as two tracks (and, within a bucket, as an A/B test).

### Angle A — "AI isn't scary, it just needs a leash"
- **Speaks to:** the **owner / buyer protecting the business**. Emotion = risk, control, not getting it wrong in public.
- **Pulls offer:** the **Audit** (Measure-it-first / governance). Defensive, infrastructure-first.
- **Use the line as a hook, not the value prop.** "Leash" frames AI as a dangerous animal you're restraining — great for attention, but a buyer trying to look forward-thinking to *their* boss won't forward "AI is dangerous." Pivot fast.
- **Email shape:** Hook (leash/control) → Pivot (control = ROI, accuracy, no wasted spend) → Proof (your verticals) → one small ask.
- On-brand: the leash *is* governance — Corriston's "infrastructure-first" identity. You don't let AI touch the marketing until measurement + guardrails are sound.

### Angle B — "AI isn't going to take your job — someone using AI is"
- **Speaks to:** the **individual protecting their career**. Emotion = status, falling behind, wanting leverage. Bolder, more offensive than defensive.
- **Pulls offer:** the **build** — "what can we build you to make your job easier, more efficient, and grow?" Leads with Kit C (AI ops & automation / custom builds) → a Project, not an audit.
- **Two intensities of the same idea — dial to the channel:**
  - **Bold / provocative (content + ads):** "AI isn't going to take your job — someone using AI is." Provocation earns attention where you're *not* connected.
  - **Warm / positive (1:1 outreach):** "Let's build you an assistant that never sleeps, never gets sick, and wants to help you succeed." Same message (AI = your edge), aimed at *help* not fear — zero backfire risk with warm contacts. Quietly reframes the build as a tireless **teammate**, not software, which is a far easier yes.
  - *Sharpening option:* tie "never sleeps" to a concrete outcome so it stops being a generic AI trope — e.g. "…and never drops a lead at 11pm."
- **⚠️ Warm-list rule:** these are people you're *connected to*. Don't open a senior 1:1 with the threat line — use the assistant line. Save the threat line for where it's a stranger reading an ad.
- **Keep the close regardless of track:** "what can we build you to make your job easier, more efficient, and grow?" — concrete, low-threat, flips fear into help.

### Which track does a contact get?
Add a segmentation axis on top of industry: **risk-minimizer → Angle A (Audit)** vs **leverage-seeker → Angle B (Build)**. Owners of compliance-heavy/risk-averse verticals (healthcare, anything regulated) skew A; operators, growth roles, B2B/SaaS, and solo/agency-adjacent folks skew B.

---

## 2. Segmentation logic (read this before the buckets)

Two things to be honest about up front:

1. **Bucketing is half qualification.** A 20-year network is heavy on marketers, agency peers, and vendors who either do this themselves or aren't buyers. A large share of the list won't fit any *buyer* bucket — that's a feature, not a problem. The job is to find the in-house owners/marketers and route everyone else correctly.
2. **The buckets below are hypotheses.** Before copywriting, we pull the Zoho industry/title distribution and confirm which buckets actually have volume. No point writing a healthcare sequence for 4 contacts.

**Routing rule for every connection:** Buyer bucket (1–4) → Partner track (5) → Suppress/Drop (6). One person, one route.

---

## 3. Capability menu (the "what we can do for them"), in 4 small kits

Everything Corriston does, grouped into four AI-flavored kits so we can mix-and-match per bucket instead of listing 8 services:

| Kit | What it is (plain) | The "leash" angle | Maps to |
|---|---|---|---|
| **A. Get-found-by-AI** | AI-SEO / GEO — show up in ChatGPT & Google AI answers | Control how AI describes *you* before a competitor does | `/services/seo/ai-seo`, AI-SEO/GEO posts |
| **B. Measure-it-first** | Conversion tracking & attribution rescue | AI can't optimize what you mismeasure — fix the wiring first | `/services/conversion-health-rescue`, `/tools/audit` |
| **C. AI ops & automation** | Custom automations / apps that take real work off the team | Bounded, reviewable workflows — not a black box | `/services/custom-app-development`, `/services/marketing-operations` |
| **D. Guard-railed content** | AI content with brand + claims guardrails | No hallucinated claims, no off-brand voice = the literal leash | `/services/smm`, content + brand review |

Each bucket below leads with **one** kit and keeps a second in reserve. Don't sell all four at once.

---

## 4. Industry buckets (v1 hypotheses)

### Bucket 1 — Healthcare / Medical practices & groups
- **Why this one is strongest:** Corriston already has a medical SEO practice and a published healthcare-attribution case study. Instant credibility.
- **Their AI fear:** compliance, wrong claims, patient trust — they *want* a leash.
- **Lead kit:** B (Measure-it-first) → then A (AI-SEO for "near me" + AI answers).
- **Offer:** free Conversion Health Audit, framed as an **"AI-Readiness Audit for practices."**
- **Subject test:** "AI isn't scary — but in healthcare it definitely needs a leash."

### Bucket 2 — E-commerce / DTC
- **Their AI fear:** wasting ad budget, AI tools spending money on the wrong things, off-brand product copy at scale.
- **Lead kit:** B (tracking/attribution — directly = ROAS) → D (guard-railed product/content at scale).
- **Offer:** "AI Conversion Audit" — find the leaks before you let AI scale spend.
- **Proof:** ecommerce SEO playbook + conversion-tracking work.

### Bucket 3 — B2B / SaaS / Professional services
- **Their AI fear:** generic AI content tanking brand, no pipeline attribution, demand vs. lead-gen confusion.
- **Lead kit:** A (get cited in AI answers for category terms) → C (ops/automation for lead routing & reporting).
- **Offer:** Audit or a scoped Project; this bucket is the best **Fractional** candidate ($10–20K/mo) if they have no senior in-house operator.
- **Proof:** B2B SEO playbook, lead-gen-vs-demand-gen, fractional leadership posts.

### Bucket 4 — Local & home services
- **⚠️ HIGH OVERLAP WITH CBO.** This is exactly the world the Campaign Budget Optimizer / WSS prospecting targets (HVAC, roofing, painting, concrete, construction).
- **Rule:** do **not** pitch Corriston AI consulting to anyone already in the CBO send list. Either suppress them entirely or route the contact to the CBO offer — never both in the same week.
- Only keep a home-services contact in *this* campaign if they're confirmed **not** in CBO and are a bigger/multi-location operator where consulting (not the CBO product) fits.

### Bucket 5 — Agency peers & marketing vendors → **Partner / referral track, not a sales pitch**
- These are not buyers; pitching them sells them nothing and burns goodwill.
- Different message entirely: white-label AI-SEO/measurement work, referral arrangement, or "who do you know who's nervous about AI." This is often where the *actual* deals come from.

### Bucket 6 — Unqualified / personal / dormant → **Drop**
- Recruiters, students, one-off connections, no company. Don't email. Keeps deliverability clean and protects the warm list.

---

## 4b. Targeting — wave sizing + titles

**Volume philosophy: sniper, not shotgun.** High-ticket consulting into warm connections = personalize, low volume, high conversion. Target 15–30% reply (warm), not 1–2% (cold). Deliverability cap: ~20–30 sends/day from a normal Workspace/Gmail domain, ramped. **Supply is not the constraint — your send/reply capacity is.**

### Real Zoho pool (pulled 2026-06-18; `Lead_Source = LinkedIn`)

**6,502 LinkedIn-sourced leads.** CBO has claimed 100 (1.5%) — numerically trivial, but concentrated in the *agency/media-buyer* slice, which is small, so it depletes exactly that segment. The Industry field is coarse; the buyer signal is in titles.

| Lens | Segment | Count | Read |
|---|---|---|---|
| Industry | General Business | 3,750 | Catch-all — owners hide here; bucket by title |
| Industry | Tech & Software | 1,625 | **Bucket 3 (B2B/SaaS), Track B** — biggest play |
| Industry | Consulting & Operations | 546 | Mostly **partner track**, not buyers |
| Industry | Sales & Revenue | 325 | Mixed; some Track B operators |
| Industry | Finance & Investment | 90 | Niche |
| Industry | Healthcare & Wellness | 82 | **Bucket 1, Track A** — small but highest-fit |
| Title | Founder / Owner | 807 | **Prime buyers, both tracks** — largest real opportunity |
| Title | Consultant / Fractional | 287 | **Partner / referral — do NOT pitch** |
| Title | Growth / Marketing Ops | 121 | **Track B operators** (build/assistant) |
| Title | Agency / Advertising | ~88 | **CBO's pond — leave it to CBO / partner only** |
| Title | Marketing leaders (CMO/Dir/VP/Head) | ~77 | Split A/B; partly already in CBO's 100 |
| Title | E-commerce / Shopify | ~28 | Thinner than hoped — don't over-index |

*Title counts overlap (one person can be "Founder & CMO") and are keyword-approximate — directional, not exact. Exact per-contact assignment happens at extraction.*

**Reality check vs. the original hypothesis:** Healthcare is small (82, not unlimited) — so use most of it. E-comm is thin (~28 obvious). The real volume is **Founders/Owners (807)** and **Tech & Software (1,625)** → those should lead, on Track B. Agencies are a *small* segment CBO is already nearly exhausting — concede it.

**Wave 1 (pilot, ~2–3 weeks): ~110–140 total, weighted to where the volume AND fit actually are.**

| Bucket | Wave 1 cap | Backed by |
|---|---|---|
| Founders/Owners — Track B (assistant/build) | 40–50 | 807 available — your deepest, highest-intent pool |
| Tech & SaaS — Track B | 30–40 | 1,625 available |
| Healthcare — Track A (leash/audit) | 25–30 | only 82 exist; use the bulk of them |
| E-comm / DTC — Track A or B | 10–15 | only ~28 obvious; keep small |
| Partner / referral (consultants + agencies) | 15–20 | 287 + ~88; different message, parallel |

**Titles map to the track, not just the industry:**

- **Track A (leash / Audit)** → budget + risk owners: Owner / Founder / Managing Partner, Practice Owner or Administrator, VP/Director of Marketing, CMO. People who sign off and lose sleep over getting it wrong.
- **Track B (assistant / Build)** → people who feel the daily pain: Marketing Ops / RevOps Manager, Head of Growth, Demand Gen Manager, founder-wearing-all-hats, solopreneur. Want leverage, not governance.

**Seniority rule:** small company → target the **owner/founder** (buyer *and* user). Bigger org → **split**: VP/Director Marketing gets Track A, Ops/Growth manager gets Track B.

**Per-bucket title shortlist:**

- **Healthcare:** Practice Owner, Practice Manager/Administrator, Managing Partner (physician/dentist-owner), Medical Director, VP/Dir of Marketing or Patient Acquisition (groups/DSOs). *Skip clinical-only titles with no marketing/ops authority.*
- **E-comm/DTC:** Founder/CEO (sub-$20M brands), Head of Ecommerce, Head/Dir of Growth or Performance Marketing, DTC Marketing Manager, CMO.
- **B2B/SaaS/Prof services:** Founder/CEO (small), VP Marketing, Head of Demand Gen, Dir of Growth/Revenue Marketing (Track A); Marketing Ops / RevOps / Growth roles (Track B).
- **Local/home services (non-CBO):** Owner/Operator, GM, multi-location Marketing Manager, franchise owner.
- **Partner/agency:** Agency Owner/Principal, Founder, Fractional CMO, Freelance consultant — **partner, not prospect**; white-label/referral message only.

---

## 5. Offer architecture (one ladder, reused across buckets)

Don't invent a new offer per bucket — pick the entry by **track**, then reskin with the bucket's language:

- **Angle A entry (free, low friction):** the existing **Conversion Health Audit** (`/tools/audit`), renamed per campaign as the **"AI-Readiness Audit"** — a short diagnostic of whether their measurement + guardrails are sound *enough to let AI touch the marketing.* The leash made tangible.
- **Angle B entry (free, low friction):** a **"What should we build you?" 20-minute teardown** — you look at one repetitive part of their week and name the automation/tool you'd build to kill it. The build offer made tangible. Feeds a scoped **Project**.

Both entries roll up into the same ladder:
2. **Paid step 1 — Audit:** fixed-scope diagnostic, ~3 weeks, low five figures, written report + findings call. ("Right starting point for most engagements.")
3. **Expansion — Project** (scoped build) **or Fractional** ($10–20K/mo embedded operator), depending on whether they need a thing done or a person.
4. **Advisory** ($350/hr, 10-hr min) as the low-commitment fallback for "I just want your eyes on this."

Why this works: every cold email asks only for the free audit. No price shock, qualifies intent, and the audit *is* the diagnostic that surfaces the paid work.

---

## 6. CBO dedupe / suppression plan (execution gate — not done yet)

- **DONE:** consolidated suppression list built → `prospects/cbo-suppression-list.csv` (100 contacts: cbo-linkedin-01 + 02, with email + Zoho Lead ID + tier). 100 unique emails, 76 free-mail / 24 corporate.
- **Same-pond finding:** CBO pulls from `Lead_Source = LinkedIn` in Zoho — the exact pool this campaign draws from (6,502 leads). CBO's 100 are concentrated in agency/media-buyer/martech titles. So the durable rule isn't just "suppress 100" — it's **carve by segment ownership: CBO keeps agencies & media buyers; AI-consulting takes end-advertiser owners/operators & verticals.** They naturally want different people.
- **Mechanism:** match on email (primary) + company domain (secondary, catches role-address changes). Anyone in the suppression CSV → excluded. Anyone agency/media-buyer by title → leave to CBO (partner track only).
- Belt-and-suspenders: add a Zoho field like `campaign_route` (values: cbo / linkedin-ai / partner / suppress) so a contact can only ever be in one active send.

---

## 7. Recommended next steps

1. **You:** confirm the buckets feel right and give me access to the CBO list (folder, export, or Zoho tag).
2. **Me:** pull the Zoho industry/title distribution and replace these hypothesis-buckets with real counts — show you which buckets actually have volume and who falls out.
3. **Me:** run the CBO suppression and report the clean, dedupe'd list per bucket.
4. **Then:** write the per-bucket sequences (subject + 2–3 touches each) and the renamed AI-Readiness Audit landing logic.

> Open question for you before step 2: should the "AI-Readiness Audit" be a genuinely new lightweight asset, or just a re-skin of the existing `/tools/audit` Conversion Health Audit? That choice changes how aggressive the entry CTA can be.
