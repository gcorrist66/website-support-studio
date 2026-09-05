# Clay Brief — Enrich + Source for the AI-Consulting Campaign

**Date:** 2026-06-18 · **Rule:** small test batches first, measure, then scale. Don't burn credits on a blind full run.

---

## Job 1 — Enrich warm owners with work emails

**Why:** 1,203 fit-filtered, CBO-deduped founders/owners from your LinkedIn export. They're warm (1st-degree) but LinkedIn-only. Adding verified work email makes them **multi-channel** (DM + email) — highest-ROI Clay spend.

- **Input (test batch):** `owners-clay-test-100.csv` — 100 newest owner/founder connections. Columns: First Name, Last Name, Company, URL (LinkedIn profile), Position.
- **Clay recipe:** import → **Find Work Email** (waterfall: e.g. Prospeo/Datagma/FindyMail) keyed off LinkedIn URL + Company → **Validate Email** (e.g. ZeroBounce/MailTester).
- **Measure on the 100:** email find-rate %, validation pass %, cost/valid-email. 
- **Scale rule:** only run the remaining 1,103 if find-rate clears ~50% and cost/email is acceptable.
- **Full pool:** `owners.csv` (1,203).

---

## Job 2 — Source net-new targets in the thin verticals

**Why:** your connections are thin where the strongest fit lives (healthcare 53, e-comm 24). Clay sources fresh companies + decision-makers with emails. **Cold**, so smaller, sharper, and tracked separately from warm.

**Universal rules for sourced lists:**
- **Geo:** US (unless you say otherwise).
- **Dedupe:** against (a) your 6,883 connections and (b) the CBO suppression list before any outreach.
- **Test size:** 50 per vertical first; review fit; then scale.
- **Tag:** `source = clay-net-new`, separate from warm connections.

### Vertical A — Healthcare practices (Track A: "leash / AI-readiness audit")
- **Companies:** independent medical, dental, derm, ortho, optometry, physical-therapy, veterinary, med-spa practices & small groups (≈2–25 providers, 5–100 employees).
- **Titles:** Owner, Practice Owner, Practice Manager / Administrator, Managing Partner, Physician-owner; for groups/DSOs: Marketing Director, Patient Acquisition.
- **Exclude:** hospitals/health systems, pharma, large enterprises, solo practitioners with no practice, recruiters.
- **Nice-to-have signals:** runs Google Ads, has a booking/website, recently hiring marketing.

### Vertical B — E-commerce / DTC brands (Track B: "assistant that never sleeps")
- **Companies:** DTC/e-commerce brands, ~$1M–$50M revenue, on Shopify/BigCommerce.
- **Titles:** Founder / CEO, Head of E-commerce, Head of Growth / Performance Marketing, DTC Marketing Manager, CMO.
- **Exclude:** marketplaces, dropship/arbitrage, agencies, sub-$1M hobby stores.
- **Nice-to-have signals:** Shopify Plus, running Meta/Google ads, recent funding.

### (Optional) Vertical C — Local multi-location operators (Track B)
- Multi-location service/retail businesses **outside CBO's home-services lane** (e.g. fitness studios, dental groups, restaurant groups). Skip if it risks overlapping CBO.

---

## When Clay is connected
Run `/mcp` to authorize Clay (the auto-connect is blocked for non-browser clients). Once it's green I can either drive the enrichment/sourcing through the Clay tools directly, or hand you a ready-to-paste table recipe — your call.
