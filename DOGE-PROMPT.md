# DOGE — WSS Prospect Scrape Prompt

**How to use:** copy everything in the box below into Doge. To run a different trade, change the two **[VERTICAL]** spots and the filename. Keep everything else identical — the strict rules are what make the list usable.

---

```
TASK: Find me residential [VERTICAL] companies that are owner-operated and have a WEAK or MISSING website. Work STATE BY STATE for even national coverage — do NOT cluster results in one city or one state.

COVERAGE: Pull up to 5 qualifying businesses PER STATE, across these states this run:
[STATE LIST — e.g. FL, TX, GA, NC, SC, TN, OH, PA, AZ, CO]
(That's ~50 total at 5 each. Next run, use a fresh block of states. No more than 5 from any single state.)

NON-NEGOTIABLE RULE: Every row must include the owner's FIRST name, LAST name, AND a working email. If you cannot find all three for a business, SKIP it and find another. Do not pad — 40 complete rows beats 50 with holes.

QUALIFY only if ALL are true:
- Local, owner-operated, serves HOMEOWNERS (residential — not commercial/B2B).
- [VERTICAL] (the target trade).
- Small: roughly 3–50 employees, not a national brand or franchise.
- Website is WEAK — meets 2+ of: fewer than ~10 pages; dated/template design; old copyright year; not mobile-friendly; no online booking or quote/estimate form; no reviews shown. OR it has NO real website (social/Google-only) — that qualifies too.

DISQUALIFY (skip): national chains, franchises, commercial-only operators (serve GCs/builders/facilities), marketing agencies, directories, anything with a strong modern site.

OUTPUT as CSV, these exact columns:
company, owner_first_name, owner_last_name, owner_email, phone, website_url, city, state, website_pages, reviews, weakness_note

- owner_email: prefer the owner's direct/named email; use info@/contact@ only if no owner email exists, and note it.
- website_pages: a number, or "no-site".
- reviews: count + rating if available (e.g. "47 ★4.8").
- weakness_note: one line on WHY the site is weak — the sales hook (e.g. "2013 template, no quote form, not mobile").

Save as: /Users/corristonconsulting/Projects/website-support-studio/outreach/[VERTICAL]-nationwide-raw.csv
```

---

**Run order:** roofing → HVAC → plumbing → garage doors → remodeling → landscaping. One trade per run, nationwide each time.
**Then:** hand the raw CSV to Codex (see CODEX-CLAY-PROMPT.md) for enrichment + verification before anything is sent.
