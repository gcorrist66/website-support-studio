# WSS Email 1 — v2 (visual / click-optimized)

Goal of the rework: fix OPENS (subject line + deliverability) and fix CLICKS (one hero image of a beautiful site → drives to the preview page). Hero image = **Corriston/WSS portfolio site (Gary's wife's site, with her in it)** as the eye-candy showcase.

---

## Subject lines (A/B the top two) — NOTE: no "free" in subject (spam trigger that likely caused the 3.3% open rate)
1. `a quick idea for {{company}}'s website`
2. `{{first_name}}, mocked up something for {{company}}`
3. `your {{vertical}} site could look like this`
4. `built {{company}} a new homepage to look at`

**Preview text (the gray line after the subject):** `No cost, no commitment — just take a look.`

---

## Body (text-forward, ONE hero image, ONE CTA)

> Hi {{first_name}} —
>
> I build websites for {{vertical}} businesses — clean, modern, and built to turn visitors into calls. Here's a recent one:
>
> **[ HERO IMAGE: screenshot of the showcase site — sized ~600px wide, hosted, with alt text "Modern website example by Website Support Studio" ]**
>
> I'd like to build **{{company}}** its own version — a modern homepage concept, yours to look at, no cost and no commitment. Takes you about 3 minutes to kick off.
>
> **[ CTA BUTTON: See your preview → ]**  (links to websitesupportstudio.com/free-website-preview)
>
> — Gary, Website Support Studio

---

## Why this structure
- **Subject fixes opens:** removed "free," kept it lowercase/personal/curiosity-driven with the company name. This is the single biggest lever on the 3.3%.
- **One hero image fixes clicks:** the eye-candy earns the click; the landing page delivers the full visual payoff. Image is a *taste*, not the whole meal.
- **Deliverability guardrails:** one image (not a collage), hosted (not a giant embed), real alt text, more text weight than image weight, whole email under ~100KB (so Gmail doesn't clip it), warmed inbox only.

## Image specs (when you send the screenshot)
- ~600px wide, clean crop of the homepage hero (the section with her in it — that's the attention-draw).
- Save as optimized JPG/PNG, under ~150KB.
- Host it (Zoho/Apollo media library, or the WSS site) and link, don't paste a 2MB embed.
- Always include alt text — many clients block images by default; the alt text + strong copy must still make sense if the image doesn't load.

## Still to fix separately (not in this email)
- **Verify click-tracking is actually firing** — the flat 0% clicks across ALL campaigns (even healthy CBO opens) is suspicious. Send yourself a test, click the link, confirm it registers before trusting the 0%.
