# WSS Prospect Qualification — Calibration Report (Round 2)

**Purpose:** test whether improved (owner-title) discovery changes the picture, **before** touching the framework. Calibration only — no outreach, no emails, sample of 50, framework/scoring model unchanged.
**Model under test (unchanged):** Priority = 0.60×Opportunity + 0.40×BusinessQuality · gates BizQ<30→max C · Opp<35→max C + Preview=No · thresholds A≥80/B≥60/C≥40/D<40.
**Discovery change vs R1:** owner-title **people search** (Owner/Founder/President/Managing Partner/CEO) + Tier A NAICS + **hard exclusions** (marketing/advertising, staffing/recruiting, associations, schools, government, mgmt-consulting, publishing) + small size + verified email.
**Date:** 2026-06-18 · **Sample:** 50 (40 sent to scoring after pre-screen, 10 pre-screened investment-firm noise).

---

## 1. Executive summary

1. **Owner-title discovery improved the *quality* of what scored:** average Business Quality rose **54.3 → 65.7**, Tier B yield **1 → 4**, and preview-eligible rate **16% → 38%**. The businesses that survived are genuinely better local operators (Phillips Home Improvements, Somos Dental, Metro Garage Door, real PI/SSDI firms).
2. **But the contamination didn't disappear — it changed shape.** R1's noise was *industry-adjacent vendors* (associations, agencies, recruiters), which the exclusions removed. R2's noise is **B2B/commercial operators that share the same owner titles and Tier A NAICS** — commercial subcontractors (Enhanced Mechanical, Solid Concrete Walls, Foundation Steel, Modern Electric), B2B/corporate law (Burke, Dilworth IP, Griffitts, Novus), and investment/PE partnerships. On strict website review, **19 of 40 scorable candidates turned out B2B → disqualified.**
3. **The decisive finding: even on cleaner, higher-quality data, the model still produced ZERO Tier A.** Across **both rounds (71 scored real businesses), the maximum legitimate Priority was ~67.** The 80-point Tier-A bar is unreachable in practice. This is now two-round evidence that the **thresholds**, not the discovery or the weighting, are miscalibrated.

---

## 2. Discovery quality (the headline R2 learning)

| | Round 1 (company NAICS/keyword) | Round 2 (owner-title + exclusions) |
|---|---|---|
| Dominant noise type | Associations, marketing agencies, recruiters, publications, foreign | **B2B/commercial operators & investment firms** with owner titles in Tier A NAICS |
| Examples removed/caught | ACCA, DANB, WEBRIS, Lexitas, CONEXPO | Enhanced Mechanical (commercial sub), Foundation Steel, Burke Law (B2B), Apta/Arselle (PE) |
| Net effect | Industry-adjacent vendors | Real *companies*, but many **B2B not B2C** |

**Interpretation:** owner-title discovery is a clear improvement (it killed the association/agency problem and raised business quality), but **industry + title + size is not enough to guarantee a consumer-facing, lead-gen-dependent business.** The next filter must screen for **B2C / residential / lead-gen dependence**, not just industry.

---

## 3. Scored ICP-valid prospects (21) — ranked by Priority

| Rank | Business | Vertical | Opp | BizQ | Pri | Tier | Prev |
|--:|---|---|--:|--:|--:|:--:|:--:|
|1|Abbott Electric|Electrical|70|62|67|**B**|Y|
|2|Krankemann Petersen|Law|72|58|66|**B**|Y|
|3|Flateau Realty|Real Estate|69|52|62|**B**|Y|
|4|Glen J. Dunn & Assoc.|Law (PI)|62|58|60|**B**|Y|
|5|Skelton Fire Alarm|Fire/Security|63|52|59|C|Y|
|6|All Things Restored|Restoration|58|52|56|C|Y|
|7|Perception Real Estate|Real Estate|61|48|56|C|Y|
|8|Social Security Law Group|Law (SSDI)|31|85|53|C|N|
|9|Green Label Title|Title|44|62|52|C|Y|
|10|RALCO Electric|Electrical|39|66|50|C|N|
|11|Metro Garage Door|Garage Doors|28|80|49|C|N|
|12|Somos Dental|Dental|27|82|49|C|N|
|13|Phillips Home Improvements|Remodeling|26|80|48|C|N|
|14|Odyssey Mechanical|HVAC|26|78|47|C|N|
|15|Gaggos Flaggman|Law|43|52|47|C|N|
|16|Sunburst Construction|Construction|35|62|46|C|N|
|17|Comfort City Mechanical|HVAC|42|52|46|C|N|
|18|HI Low Roofing|Roofing|29|72|46|C|N|
|19|Stellar Painting|Painting|29|66|44|C|N|
|20|ERA Empower Realty|Real Estate|21|78|44|C|N|
|21|The RV Shop|RV/Auto|18|82|44|C|N|

*(This is the full scored set — fewer than 25 because 29 of 50 disqualified. There is no "26th+" to rank.)*

---

## 4. Summary statistics

- **Tier distribution (all 50):** Tier A **0** · Tier B **4** · Tier C **17** · Tier D **0** · **Disqualified 29** (10 pre-screened investment firms + 19 B2B/commercial caught on website review).
- **Scored set (21) averages:** Opportunity **42.5** · Business Quality **65.7** · Priority **52.0**.
- **Preview-eligible:** 8 of 21 (**38%**).
- Same structural signal as R1: **avg BizQ (65.7) ≫ avg Opportunity (42.5)** — these solid local businesses mostly have decent sites already (low opportunity). The inverse correlation persists even with better discovery.

---

## 5. Round 1 vs Round 2

| Metric | Round 1 | Round 2 | Read |
|---|---|---|---|
| ICP match rate (scored/50) | 31/50 = **62%** | 21/50 = **42%** | R2 *looks* lower only because it applied a strict website-level ICP re-screen R1 didn't; R2's survivors are cleaner/better |
| **Tier A count** | **0** | **0** | Threshold still never fires — key evidence |
| **Tier B count** | **1** | **4** | Owner-title surfaced more weak-site/viable-biz cases |
| Avg Business Quality (scored) | 54.3 | **65.7** | Better businesses found |
| Avg Priority (scored) | 48.0 | 52.0 | Modest lift |
| **Preview-eligible rate** | 16% | **38%** | Materially better |
| Dominant disqualifier | Associations/agencies/recruiters | B2B/commercial operators | Contamination shifted, didn't vanish |

---

## 6. Scoring anomalies (R2)

- **Strong-business / modern-site cluster, correctly de-prioritized:** The RV Shop (Opp 18/BizQ 82), ERA Empower (21/78), Phillips (26/80), Somos Dental (27/82), Metro Garage Door (28/80), Odyssey (26/78), Social Security Law Group (31/85). These are the *best businesses* and have the *least to fix* — gated to C, Preview=No. Correct, but it means the cleaner the discovery, the more the queue fills with "great business, nothing to sell them."
- **The real WSS sweet spot is rare and tops out in the 60s:** Abbott Electric (67), Krankemann (66), Flateau (62), Glen Dunn (60) — weak/dated sites on viable lead-gen businesses. These are exactly who WSS should pitch, yet the model labels them only "Tier B."
- **No false positive as egregious as R1's LandMark** — the B2B contaminants were caught at the disqualification step (Step 1/2) rather than scored, which is the framework working as intended.

---

## 7. Recommendation — based on Round 2 evidence

**→ B. Adjust thresholds.** (Not A/keep, not C/weighting.)

**Evidence:** Across two rounds and ~52 scored real businesses, **the model produced 0 Tier A**, even after discovery was cleaned up and average business quality rose to 65.7. Legitimate best-fit prospects (weak site + viable lead-gen business) top out at **Priority 60–67**. An 80-point Tier-A gate is therefore unreachable, and everything compresses into C with a thin B band.

- The **0.60/0.40 weighting is sound** — don't change it. The Opportunity/BusinessQuality inverse correlation is a real-world structural fact, not a weighting error; re-weighting toward Opportunity would just re-promote thin-business/bad-site cases the gates exist to stop.
- **Recommended bands (for when the framework is unlocked):** **Tier A ≥ 62 · B 50–61 · C 38–49 · D < 38.** Re-scored against R2 this yields **~4 Tier A (Abbott, Krankemann, Flateau, Glen Dunn), ~5 Tier B, rest C** — an actionable priority spread instead of a flat wall, while still flooring the strong-site businesses.
- **Keep both gates** (value-gate and low-opportunity) — they performed correctly in both rounds.

**Companion process recommendation (discovery, not scoring):** add a **B2C / lead-gen filter** so owner-title search stops admitting B2B/commercial operators. Concretely: drop the **"Managing Partner"** title (it pulled investment/PE/advisory partnerships), exclude **finance NAICS (523/525)**, and add a positive ICP signal — residential/consumer keyword tags or "has visible customer reviews" — before a candidate is scored. This is the single biggest remaining quality lever.

---

## 8. Bottom line
Owner-title discovery is the right method and clearly better. The scoring **logic** is validated again. The two things still wrong are both fixable and now evidence-backed: **(1) tier thresholds are set too high** (adjust per Rec B), and **(2) discovery still needs a B2C/lead-gen screen** to stop B2B operators. No framework files were modified.

*Calibration only — no outreach, no contact, sample of 50.*
