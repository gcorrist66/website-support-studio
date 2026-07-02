# WSS_PROSPECT_EVALUATION_WORKFLOW

**Owner:** Website Support Studio (Corriston Consulting, LLC)
**Status:** Official operating workflow. Implements `WSS_PROSPECT_QUALIFICATION_FRAMEWORK.md` (the source of truth).
**Audience:** Apollo, Cowork, Codex, Claude, Hermes, future agents + human reviewer.
**Version:** 1.0 · 2026-06-18
**Approved interpretation:** the master score is the **WSS Opportunity & Fit** model — **higher = better WSS opportunity.** Objective is qualified opportunity, not volume.

---

## 0. The three scores (read first)

Every prospect produces **three independent 0–100 scores**:

| Score | Measures | Direction | Source |
|---|---|---|---|
| **Opportunity Score** | How weak/improvable the website is, + industry fit | Higher = weaker site / better fit = more opportunity | Framework §4 (website dims 90 + industry fit 10) |
| **Business Quality Score** | How valuable/healthy the business is (budget, conversion potential) | Higher = stronger business | Framework §7 green flags |
| **WSS Priority Score** | The decision score — who to pursue first | Higher = pursue first | Formula in Step 5 |

**Priority is what drives the Tier.** Opportunity and Business Quality are the inputs. The whole point: **weak website (high Opportunity) + strong business (high Business Quality) = top Priority.**

---

## 1. Evaluation process — per single prospect

> Steps run in order. Steps 1–2 are **gates** (a failure ends evaluation as Disqualified or Hold). Steps 3–7 produce the scores and decision.

### Step 1 — Business validation (gate)
Confirm the business is real, active, in-ICP, and reachable.
- **Active / alive:** live site, recent reviews, current hours, recent posts, or other proof of operation.
- **ICP fit (Framework §1):** local service / professional / multi-location / small / growing; ~3–100 employees; ~$500K–$25M revenue.
- **Decision maker identifiable:** Owner / Founder / President / Managing Partner / Partner / CEO / Office Manager / Marketing Director.
- **Disqualifiers (Framework §3):** out of business, no website, government, public school, university, nonprofit, Fortune 500, enterprise, in-house web team.
- **Outcome:** any disqualifier → **DISQUALIFIED** (stop, record reason). Not active or no decision maker → **HOLD**. Otherwise → continue.

### Step 2 — Website review (gate + observation)
- Confirm a **website exists** (no site → DISQUALIFIED per §3).
- Visit and record **observations**: capture each **Red Flag** present (Framework §6) and each **Green Flag** present (§7).
- Note URL, platform if obvious (Wix/GoDaddy/WordPress/etc.), mobile behavior, and any broken elements.
- **Outcome:** observations feed Steps 3–4. Low-confidence/ambiguous → flag for manual review (§6 below).

### Step 3 — Opportunity scoring (0–100)
Score the six Framework §4 categories from the website observations (more points = weaker site / better fit):

| Category | Max | Anchor |
|---|---:|---|
| Website Design Quality | 20 | 0 modern → 20 very outdated/generic |
| Mobile Experience | 20 | 0 flawless → 20 broken on phone |
| Conversion Quality | 20 | 0 clear CTA+booking → 20 no CTA/broken forms |
| Trust Signals | 15 | 0 strong proof → 15 none |
| Local SEO Signals | 15 | 0 strong local → 15 invisible |
| Industry Fit | 10 | 10 Tier A · 6 Tier B · 2 in-ICP · 0 outside |
| **Opportunity Score** | **100** | sum |

Use the Framework §4.1 sub-bands for each. **Record the per-category numbers** (reproducibility, §11).

### Step 4 — Business quality scoring (0–100)
Score business value from §7 green flags + activity signals:

| Signal | Max | Anchor |
|---|---:|---|
| Business activity / alive | 15 | recent operation, responsive |
| Reviews (volume × rating) | 25 | many strong reviews = high |
| Service offering strength | 10 | clear, specialized, premium |
| Multiple locations | 15 | 0 single → 15 several |
| Lead-generation dependence | 15 | relies on inbound = high (likely to invest) |
| Growth indicators | 10 | hiring, expanding, new services |
| Marketing investment | 10 | running ads / agency / active social = budget |
| **Business Quality Score** | **100** | sum |

*Justification: reviews, locations, lead-dependence, and marketing spend are the strongest available proxies for **budget + willingness to pay for recurring website work** — the thing that turns a preview into a client.*

### Step 5 — Priority score calculation (0–100)
**Base formula:**
> **WSS Priority Score = round( 0.60 × Opportunity + 0.40 × Business Quality )**

*Weighting justification: the website gap is the reason WSS is relevant and the hook for the free preview, so Opportunity leads (60%). Business Quality predicts budget and recurring conversion, so it's a strong secondary (40%) — never ignored, because a beautiful pitch to a broke business is wasted effort.*

**Gates (apply after the base, in order):**
1. **Hard disqualifier** (§3) or **no website** → **DISQUALIFIED** (no tier).
2. **Business Quality < 30** → cap final Tier at **C** (budget risk), even if base ≥ 60. Tag `value-gated`.
3. **Opportunity < 35** (site already strong) → cap final Tier at **C** and Preview = No (nothing compelling to preview). Tag `low-opportunity`.
4. Otherwise → Tier from base score (Step 6).

### Step 6 — Tier assignment
From the WSS Priority Score (Framework §5):

| Tier | Priority | Action |
|---|---|---|
| **A** | 80–100 | Immediate outreach |
| **B** | 60–79 | Good target — normal flow |
| **C** | 40–59 | Future opportunity — nurture/revisit |
| **D** | <40 | Do not actively pursue |

### Step 7 — Free Website Preview eligibility (Framework §10)
**Preview Eligible = Yes** only if ALL: website exists · can be meaningfully improved (Opportunity ≥ ~50, or several §6 red flags) · decision maker identified · business appears active · fits ICP · not disqualified. Otherwise **No** (record why). Tier C/D default to **No / not now**.

---

## 2. Scoring template (agents must output this exact shape)

```
Business Name:
Website:
Industry:                    (and Tier A / Tier B / outside)
Opportunity Score:           0–100
Business Quality Score:      0–100
WSS Priority Score:          0–100
Tier:                        A / B / C / D  (or DISQUALIFIED)
Preview Eligible:            Yes / No
Reasoning:
  - Website observations:    (red flags seen; design/mobile/conversion/trust/local notes)
  - Business observations:   (reviews, locations, growth, marketing, activity)
  - Risks:                   (budget risk, deliverability, wrong contact, ambiguity)
  - Opportunity summary:     (one line: why pursue / why not)
Score breakdown (required):  Opp [Design/ Mobile/ Conversion/ Trust/ LocalSEO/ Fit];
                             BizQ [Activity/ Reviews/ Service/ Locations/ LeadGen/ Growth/ Marketing]
Decision + reason:           Pursue now / Hold / Disqualify — because…
```

---

## 3. Example evaluations

### Example A — Tier A (ideal prospect)
```
Business Name:           Summit Roofing Co. (illustrative)
Website:                 summitroofing.example
Industry:                Roofing (Tier A)
Opportunity Score:       81
Business Quality Score:  94
WSS Priority Score:      86   (0.6×81 + 0.4×94)
Tier:                    A
Preview Eligible:        Yes
Reasoning:
  - Website observations: 2014-era template, no online booking, only a contact form,
    not mobile-optimized, reviews not surfaced on site. Red flags: outdated design,
    poor mobile, no booking, no quote path, missing trust signals.
  - Business observations: 18 employees, 3 locations, 120 Google reviews @4.9, runs
    Google Ads, hiring. Green flags: active, strong reviews, multi-location, marketing
    spend, growth.
  - Risks: none material; confirm correct owner email.
  - Opportunity summary: Strong, lead-dependent business with a clearly weak site — exactly who says yes to a free preview.
Score breakdown: Opp [18/16/18/9/10/10]; BizQ [14/24/9/15/14/9/9]
Decision: Pursue now — top of queue, preview-eligible.
```

### Example B — Tier B
```
Business Name:           Bright Smile Dental (illustrative)
Website:                 brightsmile.example
Industry:                Dentists (Tier A industry)
Opportunity Score:       62
Business Quality Score:  66
WSS Priority Score:      64   (0.6×62 + 0.4×66)
Tier:                    B
Preview Eligible:        Yes
Reasoning:
  - Website observations: functional but dated; weak mobile and conversion path; thin
    trust section. Red flags: poor mobile, weak CTA, few trust signals.
  - Business observations: 8 employees, single location, 60 reviews @4.7, no visible ads.
  - Risks: single location → moderate budget; confirm lead dependence.
  - Opportunity summary: Solid, improvable; good normal-flow target.
Score breakdown: Opp [10/13/14/6/9/10]; BizQ [13/18/8/4/12/6/5]
Decision: Pursue — second priority band.
```

### Example C — Tier C (future opportunity)
```
Business Name:           Lakeside Accounting (illustrative)
Website:                 lakesidecpa.example
Industry:                Accounting (Tier B)
Opportunity Score:       43
Business Quality Score:  50
WSS Priority Score:      46   (0.6×43 + 0.4×50)
Tier:                    C
Preview Eligible:        No (revisit)
Reasoning:
  - Website observations: reasonably modern, has booking; mainly weak local SEO + thin
    content. Few hard red flags.
  - Business observations: 5 employees, single location, 12 reviews @4.5, low marketing.
  - Risks: site is decent → soft pitch; smaller business → budget uncertain.
  - Opportunity summary: Not enough website pain today; nurture and re-score later.
Score breakdown: Opp [6/6/7/7/11/6]; BizQ [12/10/7/4/9/4/4]
Decision: Hold — future opportunity.
```

### Example D — Disqualified
```
Business Name:           Apex Industrial Group (illustrative)
Website:                 apexindustrial.example
Industry:                Manufacturing (Tier B) — but…
Opportunity Score:       n/a
Business Quality Score:  n/a
WSS Priority Score:      n/a
Tier:                    DISQUALIFIED
Preview Eligible:        No
Reasoning:
  - Disqualified at Step 1: ~600 employees (enterprise), and a dedicated in-house web/dev
    team. Both are hard stops (Framework §3).
  - Opportunity summary: Out of ICP regardless of site quality — do not pursue.
Decision: Disqualify — enterprise + in-house web team.
```

---

## 4. Apollo workflow recommendations

> Recommendations only — agents do **not** change Apollo settings.

**What Apollo returns (discovery + firmographics, NOT website quality):**
- Company name, industry/NAICS, employee size, location; owner/decision-maker first name (last name masked until enrichment), title; `has_email` flag, phone, org domain.
- Apollo **cannot** judge website quality, reviews, or conversion paths — it is the *find* layer only.

**What Cowork / agent enriches & reviews (the scoring inputs Apollo can't give):**
- Resolve the **website URL** from the org domain; perform the **Step 2 website review** (red/green flags).
- Pull **business-quality signals**: review count/rating (Google), number of locations, growth/hiring, marketing/ad presence, social activity.
- Compute the **three scores + tier + preview eligibility** (deterministic once observations exist).
- Enrich the **decision-maker email** (first name + company, or LinkedIn URL) — only after the prospect clears Step 1.

**What must be manually reviewed (human):**
- Every **Tier A** before any outreach.
- Any **disqualification that's non-obvious**, and any prospect the agent flags **low-confidence** (ambiguous site, unclear owner, masked data).
- Spot-check a **sample of Tier B/C** to keep the model calibrated.

**What can be automatically scored (no human needed):**
- Firmographic gating (industry tier, size, location, hard disqualifiers).
- The **scoring math** (Steps 3–6) once website + business observations are recorded.
- Preview-eligibility logic (Step 7).
- *Website observation itself can be semi-automated (page fetch/screenshot + heuristics) but should be confidence-scored; low confidence routes to manual.*

**Division of labor, one line:** Apollo *finds*, Cowork *reviews + scores*, humans *approve Tier A + edge cases*, the math *runs itself*.

---

## 5. Prospect review queue model

A single rolling queue, processed strictly in priority order:

**Queue order:** Tier A → Tier B → Tier C → Tier D (D archived, not worked).

**Record statuses:** `new` → `scored` → `needs_manual_review` → `approved_for_outreach` → `in_outreach` → `won / hold / disqualified`.

**Rules:**
- Tier A items get human review **before** `approved_for_outreach`.
- Tier B flows through with sampled review.
- Tier C → `hold` bucket for periodic re-scoring (businesses and sites change).
- Tier D / Disqualified → archived with reason; do not re-pull without new signal.
- Every record carries its full template (§2) — no record advances without scores + reasoning.

---

## 6. How many prospects to review before outreach begins

Quality-over-volume means **calibrate before you scale.** Recommended sequence:

1. **Calibration batch: score ~50 prospects** end-to-end through this workflow.
2. **Manually review 100% of the Tier A** results + a **sample of B/C** — confirm the scores produce tiers that *look right* (a Tier A should obviously be a great prospect). Adjust anchors if the model is mis-tiering.
3. **Begin outreach only once you hold ~25–40 validated Tier A/B prospects** — roughly one week of sending at the planned ~50/day with follow-ups, so you're never sending faster than you can qualify.
4. **Maintain a rolling buffer** of ≥1 week of qualified prospects ahead of send volume, so qualification never happens under deadline pressure.

> Do not launch outreach off an unvalidated batch. The first ~50 exist to prove the scoring, not to fill a send queue.

---

## 7. Agent operating instructions (binding)

- Run **all 7 steps in order**; never score a prospect that failed Step 1 or 2.
- **Always output the full §2 template**, including the per-category score breakdown.
- **Record reasoning, observations, risks, and any disqualification reason** (Framework §11).
- **Respect the gates** (Step 5) — value-gate and low-opportunity caps are mandatory, not optional.
- **Prioritize quality over quantity.** A pile of Tier C/D records is not progress.
- **Flag low-confidence to manual review** rather than guessing.
- **Do not** pull lists, write outreach, start enrichment campaigns, or change Apollo/website/pricing as part of evaluation — evaluation ends at a scored, queued record.

---

## Appendix — Change log
- **v1.0 (2026-06-18):** Initial workflow. Defined three-score model (Opportunity / Business Quality / Priority) with the `0.60/0.40` Priority formula and value-gate + low-opportunity caps; added templates, four worked examples, Apollo division of labor, queue model, and calibration-batch guidance.
