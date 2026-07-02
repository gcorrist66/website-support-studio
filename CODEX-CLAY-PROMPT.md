# CODEX — Clay Enrich Prompt (revised to match available Clay tools)

**How to use:** run this ONLY AFTER Doge has saved its raw CSV to:
`/Users/corristonconsulting/Projects/website-support-studio/outreach/[VERTICAL]-nationwide-raw.csv`

Codex's Clay connection does **find + enrich** (contact/company search, standard email enrichment) — it does **not** expose a ZeroBounce/NeverBounce verify step or the Prospeo→Datagma→FindyMail waterfall. So this pass enriches and scores confidence; **deliverability verification happens in the next step (Apollo on import).**

---

```
TASK: Using Clay, enrich the prospect list. Do NOT attempt deliverability verification — just enrich and report Clay's own confidence.

Input file: /Users/corristonconsulting/Projects/website-support-studio/outreach/[VERTICAL]-nationwide-raw.csv
Input columns: company, owner_first_name, owner_last_name, owner_email, phone, website_url, city, state

Per row, using the Clay tools actually available to you:
1. If owner name is missing/unsure → Clay contact/company search by company + domain; keep only title Owner/Founder/President/Co-Owner. Fill first_name, last_name, title.
2. Find/confirm the owner's email → Clay standard email enrichment. Prefer the owner's direct email over info@/contact@.
3. Record whatever confidence/quality signal Clay returns for the email in a `clay_confidence` column (e.g. high/medium/low, or the score Clay gives). If Clay returns nothing, write "none".

OUTPUT one CSV, same columns PLUS: title, clay_confidence, email_source.
Keep EVERY row that has a name + an email — do not drop rows here. Verification is the next step, not this one.

Save as: /Users/corristonconsulting/Projects/website-support-studio/outreach/[VERTICAL]-nationwide-enriched.csv
```

---

## Verification happens AFTER this — in Apollo (no new bill)
1. Upload `[VERTICAL]-nationwide-enriched.csv` to Apollo.
2. Apollo runs **email verification on import** — it flags each as Verified / Unverified / etc.
3. **Enroll ONLY the "Verified" contacts** into the WSS sequence. Leave Unverified out (or send to a needs-review list).

This keeps the zero-bounce rule intact using tools we already have. (Optional backup if you want a second opinion: a free bulk verifier like NeverBounce's free tier — drop the CSV in, keep only "valid.")
