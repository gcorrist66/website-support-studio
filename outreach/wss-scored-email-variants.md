# WSS Scored Email Variants (routing-based)

Three emails, routed by the `routing_tag` on each prospect. Merge fields come straight from the scored CSVs: `{{health_score}}`, `{{top_3_issues}}`, `{{findability_top_issues}}`, `{{first_name}}`, `{{company}}`, plus the vertical's `/for/{trade}` link.

---

## A. NO-SITE  (rebuild, health = 0)  — the strongest hook
**Subject:** `{{company}} doesn't have a website — that's costing you jobs`
> Hi {{first_name}} —
>
> I went looking for {{company}}'s website to see how it stacks up, and couldn't find a real one. For a {{vertical}}, that means when a homeowner searches, the job goes to whoever shows up first — not you.
>
> I'd build you a **free preview** of a modern {{vertical}} site, yours to look at — no cost, no commitment. And you'd own it outright: domain, site, content.
>
> Want to see what {{company}}'s could look like? **[Get your free preview →]**
>
> — Gary

## B. REBUILD  (has a site, low health score)
**Subject:** `{{company}}'s website scored {{health_score}}/100`
> Hi {{first_name}} —
>
> I ran a quick health check on {{company}}'s site — it came back **{{health_score}}/100**. The main things pulling it down: {{top_3_issues}}.
>
> That's not a knock — most {{vertical}} sites have the same gaps, and they quietly cost you calls (slow on a phone, no easy way to request a quote). I'd build you a **free preview** of a modern version that fixes them — no cost, no commitment, and you own it.
>
> Want to see {{company}}'s? **[See your preview →]**
>
> — Gary

## C. GET-FOUND  (good site, low findability) — the depth play
**Subject:** `{{company}}'s site is solid — but it's hard to find`
> Hi {{first_name}} —
>
> Good news first: your website's actually in decent shape — I checked. The problem isn't the site, it's that people aren't *finding* it: {{findability_top_issues}}.
>
> A great site on page 2 with a handful of reviews still loses to the competitor who shows up first with a hundred. The fix isn't a rebuild — it's getting you found: local search, reviews, and content built to rank (and to get cited by AI search).
>
> Want me to show you what getting found would look like for {{company}}? **[Show me →]**
>
> — Gary

---

## Follow-ups (steps 2 & 3) — reuse the existing drip, in-thread, no image:
- **Day +3:** "Following up, {{first_name}} — worth a quick look? Happy to put {{company}}'s together free." → link
- **Day +7:** soft breakup, leave the link.

## Notes
- The CTA link is each vertical's `/for/{trade}` page.
- Get-found (C) ideally points at a "get found / visibility" angle of the offer, not the rebuild preview — same form is fine for v1.
