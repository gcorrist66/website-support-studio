# WSS — Free Website Preview Outreach Sequence

**Offer:** free, no-commitment website preview (questionnaire → WSS builds a modern homepage concept). **CTA target:** https://www.websitesupportstudio.com/free-website-preview
**Channel:** cold email to Tier A local-business owners, from a **warmed WSS sending inbox** (not corristonconsulting.com).
**Deliverability rules:** text-first, ONE link max per email, no embedded image collages (link to "example styles" instead), early-morning send, ~25–50/day after warmup. Merge: `{{first_name}}`, `{{company}}`, `{{vertical}}`.

---

## Sequence A — Generic (scalable)

**Subject options (A/B the top two):**
1. a fresh website concept for {{company}}
2. free homepage mockup for {{company}}?
3. {{company}} — want to see a new site, free?

**Email 1 (day 0)**
> Hi {{first_name}} — I help {{vertical}} businesses turn their website into a steadier source of calls and bookings.
>
> We build **free website previews**: answer a few quick questions and we'll design a modern homepage concept for {{company}} — yours to look at, no cost and no commitment.
>
> Want me to put one together? Takes you ~3 minutes to kick off: [Get your free preview]
>
> — Gary, Website Support Studio

**Email 2 (day +3, reply in thread)**
> Following up, {{first_name}} — here are a few directions we've shaped for businesses like yours (clean, mobile-first, built to get the call): [See example styles]. Happy to build {{company}}'s version free. Worth a look?

**Email 3 (day +6, breakup)**
> Last note — if a fresh site isn't a priority right now, no worries at all. Whenever you want a free preview of what {{company}}'s site could look like, the door's open: [Free preview]. Either way, wishing you a strong season.

---

## Sequence B — Personalized (for hand-picked Tier A/B prospects)

Use a specific, true observation from the website review (dated design, no online booking, not mobile-friendly). Higher reply rate, lower volume.

**Subject:** quick idea for {{company}}'s website

**Email 1 (day 0)**
> Hi {{first_name}} — I was looking at {{company}}'s site and noticed {{specific_observation}} (e.g., "there's no quick way for a visitor to request a quote" / "it isn't mobile-friendly yet").
>
> That's usually costing calls. We'll build you a **free preview** of a modern {{vertical}} homepage — no cost, no commitment — so you can see the difference before deciding anything.
>
> Want me to put {{company}}'s together? [Get your free preview]

**Email 2 (day +3)** — share the example styles + one concrete benefit tied to their vertical (e.g., "make the 'request an estimate' path obvious from the first screen").
**Email 3 (day +6)** — soft breakup, leave the link.

---

## Wave 1 — enriched contacts (6 verified) + personalized openers

*Fit ranking: strongest consumer/lead-gen fit first. Abbott & Skelton are commercial/B2B-leaning (lower fit) — included from the vetted set, but they're the exact B2C-gap the R2 report flagged.*

| Owner | Company | Email | Vertical | Fit | Personalized Email-1 opener (paste into Apollo preview) |
|---|---|---|---|---|---|
| Glen Dunn | Glen J. Dunn & Assoc. | gdunn@gjdlaw.com | Law (PI) | ★★★ | "I looked at gjdlaw.com — it's a dated Wix site for an active PI firm; a cleaner, faster homepage would convert more of your case traffic." |
| Chris Krankemann | Krankemann Petersen | wck@krankemann.com | Law (PI) | ★★★ | "I looked at krankemann.com — it's on an older platform and isn't doing much to turn injury-case searchers into calls." |
| Richard Flateau | Flateau Realty | richardflateau@flateaurealty.com | Real Estate | ★★★ | "I was on flateaurealty.com — it's a basic MLS template with no real lead capture, leaving easy buyer/seller inquiries on the table." |
| Steven Green | Green Label Title | steven@greenlabeltitle.com | Title | ★★ | "I looked at greenlabeltitle.com — strong reviews, but the page could do more to turn agents and buyers into orders." |
| James Abbott | Abbott Electric | jima@abbottelectric.com | Electrical | ★ (commercial) | "I was on abbottelectric.com — it's still on the older build with no quick way to book or request service." |
| Ron Skelton | Skelton Fire Alarm | ronny@skeltonfirealarm.com | Fire/Security | ★ (commercial) | "I was on skeltonfirealarm.com — it's a thin one-pager with no reviews or clear contact path." |

*Did not enrich (no Apollo match): All Things Restored, Perception Real Estate — retry or drop.*

---

## Notes
- **Suppression:** exclude anyone in `cbo-suppression-list.csv`, `corriston-warm` leads, and any existing WSS prospects. One `campaign_route` per contact.
- **Send window:** schedule for early morning (recipient local time) — owners read before the day starts.
- **Wave 1 candidates (calibration-vetted, Preview-eligible):** Abbott Electric, Krankemann Petersen, Flateau Realty, Glen J. Dunn, Skelton Fire Alarm, All Things Restored, Perception Real Estate, Green Label Title — use Sequence B (personalized) for these.
