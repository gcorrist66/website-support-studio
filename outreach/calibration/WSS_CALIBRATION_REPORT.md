# WSS Prospect Qualification — Calibration Report (Pilot #1)

**Purpose:** validate the scoring system before scaling outreach. **Not** a lead-gen campaign — no outreach sent, no emails written, nothing over 50, framework docs unmodified.
**Source of truth:** `WSS_PROSPECT_QUALIFICATION_FRAMEWORK.md` + `WSS_PROSPECT_EVALUATION_WORKFLOW.md`.
**Model under test:** Priority = 0.60×Opportunity + 0.40×BusinessQuality · gates: BizQ<30→max Tier C · Opp<35→max Tier C + Preview=No.
**Date:** 2026-06-18 · **Sample:** 50 Tier-A-industry candidates (31 real businesses website-reviewed + 19 industry-adjacent noise records).

---

## 1. Executive summary — what the pilot proved

1. **The model runs correctly, but it compresses almost everything into Tier C.** Of 31 scored businesses: **0 Tier A, 1 Tier B, 29 Tier C, 1 Tier D.** That is not a data fluke — it's structural (see §4).
2. **Root cause — Opportunity and Business Quality are inversely correlated in the real world.** Successful local businesses have *already* invested in decent websites (low opportunity); the weak sites tend to sit on *thin* businesses (low business quality). Averaging two anti-correlated scores pulls results to the middle, and the 80-point Tier-A bar essentially never fires.
3. **Targeting is the bigger lever than scoring.** 19 of 50 candidates (38%) from company-level Apollo search were **not even ICP** — associations, recruiters, marketing agencies, publications, foreign firms. The earlier *owner-title people search* returned far cleaner real businesses. Fix discovery first.
4. **Preview eligibility is too tight** — only **5 of 31** qualified, because the Opp≥50 bar sits above the sample's average opportunity (43.6).

---

## 2. Method & the targeting finding (evidence)

Candidates were pulled from Apollo **company search** across Tier A NAICS and keyword tags (small, US). That method returned heavy noise:

| Noise type | Examples surfaced | Disposition |
|---|---|---|
| Associations / boards | ACCA, DANB, ADHA, AmSpa, Feline Vet Med Assoc | DQ (nonprofit/association) |
| Recruiting / staffing | Lexitas, Considine Search, BRIX, Dental Career Services, Plona | DQ (B2B) |
| Marketing agencies / coaching | WEBRIS, "Fractional Law Firm CMO," Law Firm Mentor, Med Spa Magic Marketing | DQ (B2B) |
| Publications / education | PTJ Journal, VETgirl, HVAC School, Today's Veterinary Nurse | DQ |
| Foreign / enterprise / no-site | (UK/IT/JP/IN firms), Lexitas $105M PE-owned, Varsity (no website) | DQ |

**19/50 = 38% noise.** The 31 real businesses were the de-noised remainder. This validates the **disqualification rules** (every noise type was correctly DQ-able at Step 1) and is the report's #1 process recommendation (§7).

The 31 real businesses each had their **homepage genuinely fetched and reviewed** (design, mobile/viewport, CTA/booking path, trust, local SEO) and scored against firmographics (revenue, founded year, headcount growth).

---

## 3. Full scored sample (50)

`C*` = Priority would place higher but a **gate capped it at C** (weak business or already-strong site). Preview column: Y/N.

| # | Business | Vertical | Opp | BizQ | Pri | Tier | Prev | Note |
|--:|---|---|--:|--:|--:|:--:|:--:|---|
|1|SunTrust Remodeling|Remodeling|66|31|52|C|Y|Dated template, form-only CTA; young/thin biz|
|2|Carbon Remodeling|Remodeling|31|44|36|D|N|Modern WP; new co, no reviews|
|3|Mandolin HVAC|HVAC|44|47|45|C|N|Modern but no booking, empty reviews|
|4|Quality Remodeling|Remodeling|49|46|48|C|N|Squarespace, dated; financing+reviews|
|5|Matrix Plumbing & HVAC|Plumbing|88|22|62|C*|N|Very weak site; tiny biz (gated)|
|6|TraVek Remodeling|Remodeling|24|82|47|C*|N|Excellent site; $15.7M, 700+ reviews (low opp)|
|7|Gryphon Roofing|Roofing|30|74|48|C*|N|Strong site+reviews (low opp)|
|8|Sunny Bliss Plumbing|Plumbing|20|76|42|C*|N|Excellent site, 1000+ reviews (low opp)|
|9|Blue Fox HVAC|HVAC|62|39|53|C|Y|Stripped site, weak CTA; growing|
|10|Cornett Roofing|Roofing|46|66|54|C|N|Modern, placeholder reviews; $17.9M|
|11|MSI Plumbing|Plumbing|34|58|44|C*|N|Modern, online scheduling, awards|
|12|AG O'Brien Plumbing|Plumbing|59|49|55|C|Y|Dated, contact-form only; 90 yrs|
|13|Blue Collars Plumbing|Plumbing|34|54|42|C*|N|ServiceTitan booking; 2 locations|
|14|Hill Construction|Construction|41|60|49|C|N|Clean build, no quote form; $9.7M|
|15|**LandMark Constructions**|Construction|82|56|**72**|**B**|Y|No-viewport/PHP-error site; $22.7M (see anomaly)|
|16|Cold Comfort HVAC|HVAC|45|40|47|C|N|Wix, noindex, email-quote only|
|17|Kech Development|Construction|44|45|44|C|N|Single-page WP, no map/NAP|
|18|SCMI Inc|Specialty Trade|54|62|57|C|N|Spanish-only, unfilled counters; 50 yrs|
|19|Swell Energy|Solar|22|70|41|C*|N|Polished Gatsby site; press, $8.7M (low opp)|
|20|DrBalcony|Inspection|24|64|40|C*|N|Modern, instant-estimate; app, reviews (low opp)|
|21|Olympia Chiro/PT|Chiropractic/PT|26|68|43|C*|N|Modern, 4 locations, booking (low opp)|
|22|VDS Pets|Veterinary|24|78|46|C*|N|Modern, 19 locations (low opp)|
|23|Physical Therapy First|Physical Therapy|34|58|44|C*|N|Dated theme, appt form; 3 locations|
|24|Suffolk PT/Chiro|PT/Chiro|33|55|42|C*|N|Modern, 4 locations; empty counters|
|25|E3 Rehab|Physical Therapy|55|56|55|C|Y|No viewport, Lorem-Ipsum placeholders|
|26|JL Law Firm|Law Firm|82|24|59|C*|N|GoDaddy builder, generic; solo/thin (gated)|
|27|Raleigh Immigration Law|Law Firm|40|56|46|C|N|Modern, booking, bilingual, reviews|
|28|Gehi & Associates|Law Firm|33|58|43|C*|N|Modern WP, content-heavy, 2 states|
|29|RobMark Law|Law Firm|55|30|45|C|N|Site unreachable — LOW CONFIDENCE|
|30|Marina Sirras|Law Firm|44|52|47|C|N|Thin homepage, legacy host; recruiter-niche|
|31|Cash Offer Kentucky|Real Estate|26|62|40|C*|N|Carrot template, strong local SEO (low opp)|
| 32–50 | **19 DQ noise records** | — | — | — | — | DQ | N | associations/recruiters/agencies/foreign/no-site (see §2) |

---

## 4. Summary statistics

**Tier distribution (all 50):** Tier A **0** · Tier B **1** · Tier C **29** · Tier D **1** · Disqualified **19**.
**Scored set (31) averages:** Opportunity **43.6** · Business Quality **54.3** · Priority **48.0**.

Telling signal: **average Business Quality (54.3) > average Opportunity (43.6).** The sampled real businesses generally have *better websites than business weaknesses* — i.e., for healthy local businesses, the site is often already "good enough," which is exactly why opportunity (and therefore priority/tier) stays low.

---

## 5. Top 25 by Priority

(Ranked by Priority; tier/gate and preview shown. ⚠ = gate-capped or low-confidence.)

| Rank | Business | Pri | Tier | Prev | Why |
|--:|---|--:|:--:|:--:|---|
|1|LandMark Constructions|72|B|Y|Weak site + big biz — but B2B GC (anomaly, §6)|
|2|Matrix Plumbing & HVAC|62|C⚠|N|Weakest site in set; biz too thin (gated)|
|3|JL Law Firm|59|C⚠|N|Very weak site; solo firm (gated)|
|4|SCMI Inc|57|C|N|Dated Spanish-only; established|
|5|AG O'Brien Plumbing|55|C|Y|Dated, contact-only; 90-yr business|
|6|E3 Rehab|55|C|Y|No-viewport, placeholder content; active brand|
|7|Cornett Roofing|54|C|N|Placeholder reviews; $17.9M|
|8|Blue Fox HVAC|53|C|Y|Stripped site; growing|
|9|SunTrust Remodeling|52|C|Y|Dated template; young biz|
|10|Hill Construction|49|C|N|No quote form; $9.7M|
|11|Quality Remodeling|48|C|N|Dated Squarespace|
|12|Gryphon Roofing|48|C⚠|N|Strong reviews, decent site|
|13|TraVek Remodeling|47|C⚠|N|Excellent site, $15.7M (low opp)|
|14|Cold Comfort HVAC|47|C|N|Wix, noindex|
|15|Marina Sirras|47|C|N|Thin site; recruiter-niche law|
|16|VDS Pets|46|C⚠|N|Strong site, 19 locations|
|17|Raleigh Immigration Law|46|C|N|Modern, bilingual|
|18|Mandolin HVAC|45|C|N|No booking|
|19|RobMark Law|45|C|N|⚠ unreachable, low-confidence|
|20|MSI Plumbing|44|C⚠|N|Modern, awards|
|21|Kech Development|44|C|N|Single-page site|
|22|Physical Therapy First|44|C⚠|N|Dated theme, 3 locations|
|23|Olympia Chiro/PT|43|C⚠|N|Strong site, 4 locations|
|24|Gehi & Associates|43|C⚠|N|Modern content site|
|25|Sunny Bliss Plumbing|42|C⚠|N|Excellent site, 1000+ reviews|

**Preview-eligible across the whole sample: only 5** — SunTrust, Blue Fox, AG O'Brien, E3 Rehab, LandMark.

---

## 6. Scoring anomalies

1. **Strong business + modern site = low opportunity (correctly de-prioritized, but they're the "dream logos").** TraVek (Opp 24/BizQ 82), Sunny Bliss (20/76), VDS (24/78), Swell (22/70), Olympia (26/68), DrBalcony (24/64). The model is *right* (little to fix) — but note these are the most *valuable* businesses, and WSS has almost nothing to offer them. Expected and healthy behavior.
2. **Weak site + thin business → correctly gated to C.** Matrix (88/22), JL Law (82/24), SunTrust (66/31). The BizQ<30 gate fired on the worst-business cases (Matrix, JL Law) — good. SunTrust slipped the gate (BizQ 31) and stayed Preview-eligible, which seems right.
3. **False positive — LandMark Constructions (top score, 72/Tier B).** High score is driven almost entirely by a *technically broken* site (no viewport, visible PHP error). But it's a **$22.7M B2B general contractor doing public/school projects** — not a WSS-ideal buyer (B2B, may have internal IT, low consumer-lead dependence). The model over-rewarded a site defect on a poor-fit buyer. **This is the most important anomaly.**
4. **Low-confidence record:** RobMark Law site was unreachable; scored provisionally. Workflow correctly flags for manual review.

---

## 7. Recommendations (evidence-based)

> Per scope, these are **recommendations only** — the framework documents were not modified.

**A. Fix targeting before scaling (highest impact).** Stop discovering via company NAICS/keyword search (38% noise). Use **owner-title people search** (Owner/Founder/President + small size + Tier A NAICS), which returned clean local businesses in earlier tests, and add exclusions for associations/recruiting/agencies. *Evidence: §2.*

**B. Lower the tier thresholds — do NOT change the 0.60/0.40 weighting.** The weighting logic is sound; the cut-points were set for a score spread real data doesn't produce (0 Tier A, everything at C). Recommended bands, validated against this sample:
> **Tier A ≥ 70 · Tier B 55–69 · Tier C 40–54 · Tier D < 40.**
This correctly promotes LandMark-type weak-site/strong-biz cases (72) to A, lifts AG O'Brien/E3/Blue Fox/SCMI (53–57) to B, and still floors the strong-site businesses at C. *Evidence: tier distribution, §4.*

**C. Loosen Preview eligibility from Opp≥50 to Opp≥45 (or "≥3 red flags").** Only 5/31 qualified; the bar sits above average opportunity (43.6). Lowering it makes genuinely-weak sites on viable businesses (AG O'Brien, Blue Fox, SunTrust) preview-eligible without opening the floodgates. *Evidence: §1.4, §5.*

**D. Add a buyer-fit guard to Business Quality to stop B2B/enterprise false positives.** Weight **lead-generation dependence** more heavily and/or cap score for clearly B2B/contract-driven firms (e.g., GCs doing public projects). Prevents LandMark-type over-scoring. *Evidence: §6.3.*

**E. Add a real reviews source.** Business Quality currently infers reviews from the site; a Google Business Profile review count/rating feed would materially sharpen the strongest budget signal. *Process note.*

**Decision on the core model:** **Keep the 60/40 formula and both gates; adjust the tier cut-points (Rec B) and preview bar (Rec C); fix targeting (Rec A).** Re-running this same 50 under Rec B/C would yield roughly **~1 A, ~6 B, the rest C/D** — a usable priority spread instead of a flat Tier-C wall.

---

## 8. What this calibration validated vs. flagged
- **Validated:** disqualification rules (all 19 noise records correctly DQ-able), gate behavior (weak-biz and strong-site cases capped as intended), reproducible per-category scoring.
- **Flagged for adjustment:** tier thresholds (too high), preview bar (too high), targeting method (too noisy), B2B false-positive (LandMark).

*Calibration only — no outreach, no contact, sample of 50, framework unchanged.*
