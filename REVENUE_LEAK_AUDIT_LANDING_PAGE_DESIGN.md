# Revenue Leak Audit — Landing Page & Sales System Design

**Status:** Design only. Nothing here is deployed, pushed, wired to Stripe, or
referenced from the marketing site, onboarding, or v2-foundation.

**Companion to:** `REVENUE_LEAK_AUDIT_OFFER_DESIGN.md` (the offer definition,
audit framework, scoring rubric, report structure, and implementation path).

**Owner:** Corriston Consulting, LLC
**Date:** June 12, 2026

**Offer ladder this page sells into:**

```
Revenue Leak Snapshot   $250          (entry / de-risk)
        ↓  ($250 credits to Audit within 30 days)
Revenue Leak Audit      $750          (the product this page sells)
        ↓  ($750 credits to Sprint ≥ $2,500 within 30 days)
Implementation Sprint   $1,500–$3,500
        ↓
Advisory                $750–$1,500/mo
```

---

## 1. Executive Summary

This page sells a $750 diagnostic to owners of roofing, HVAC, plumbing, and
electrical businesses **who already have a website and already get leads**. The
single most important strategic choice: the page never argues their marketing
is bad or their website is ugly — it argues that **money is falling through a
system nobody is watching**, and that for $750 they can see exactly where, with
evidence, in two weeks.

Everything follows from that: the hero leads with missed calls and dead quotes
(not design or SEO), the proof section uses our own research across 88 local
service businesses and a sample scorecard (no testimonials exist yet — none are
faked), the score section makes the deliverable feel like a physical object,
and the CTA system gives a skeptical owner a $250 on-ramp without letting it
cannibalize the $750 sale. The page closes with the credit ladder, which
reframes the audit from "a cost" to "a deposit on the fix."

Recommended home: **corristonconsulting.com/revenue-leak-audit** — this is a
Corriston Consulting offer (measurement, attribution, advisory), and the
target buyer explicitly does *not* need what the WSS front door sells
(a new website). WSS appears only downstream, as the execution engine for
website-tagged roadmap items.

---

## 2. Landing Page Strategy

### Why would someone buy this?

Three buying triggers, in order of strength:

1. **Loss aversion with a number on it.** "You're probably losing $X/month"
   is more motivating than "you could grow." The page constantly converts
   abstract leakage into job-value math the owner can check on a napkin:
   *one missed $8,000 roof job pays for the audit ten times.*
2. **Suspicion confirmed.** Most owners already suspect leads are slipping —
   the office misses calls, quotes go quiet, the ad company's report says
   "clicks" and never "jobs." The audit doesn't have to create the fear; it
   has to promise *certainty and evidence* where there is currently a vague
   bad feeling.
3. **A safe first step.** $750, fixed scope, two weeks, ~2 hours of their
   time, no contract, no "strategy call" with a salesperson, and a published
   deliverable list. It reads like buying a product, not entering a pitch.

### What pain does it solve?

- Calls ring out or hit voicemail and nobody knows how many or what they cost.
- Forms break silently or get answered the next day, when the lead has already
  hired whoever answered first.
- Ad/SEO spend can't be tied to booked jobs, so renewing the contract is faith.
- Quotes leave the building and die in silence — no follow-up system.
- Whole towns inside the service area never see the business in search.
- The owner *feels* all of this but can't see it, prove it, or rank it.

### What outcome do they get?

In two weeks, for $750: a Revenue Leak Score for the business, a leak map with
a dollar estimate at every stage of their lead path, evidence (recorded test
calls, timestamped form tests, the spend-vs-proof table), and a prioritized
roadmap where every fix has an owner, an effort size, and an estimated monthly
recovery. Plus the safety: if the business scores 85+, the report says
"you're fine, don't buy anything" — in writing.

### Strategic positioning rules (carried from the offer design)

- Sell **"find out where you're losing jobs"** — never "website audit,"
  never "marketing audit." Those phrases trigger comparison with $99 SEO
  report mills and free agency audits (answered head-on in Objections).
- The audience already has a website; the page must say so *early and
  approvingly* ("your website is probably fine") to disarm the assumption
  that this is a redesign pitch.
- Every claim ties to evidence we can actually produce: our 88-business
  research set, sample artifacts, methodology transparency. No invented
  customers, no fabricated stats.

---

## 3. Landing Page Structure (wireframe, top to bottom)

| # | Section | Job | Primary element |
|---|---------|-----|-----------------|
| 1 | Hero | Stop the scroll; name the pain; state the promise | Headline + leak-math line + 2 CTAs |
| 2 | The Leak Strip | Make leakage concrete in 5 seconds | 4 stat-style pain tiles (research-sourced) |
| 3 | "Your website is fine" | Disarm the redesign suspicion; qualify the reader | Short manifesto block |
| 4 | What $750 Buys | Show the 9 deliverables as tangible objects | Deliverables grid + sample report visual |
| 5 | Revenue Leak Score | Make the score feel like a physical instrument | Gauge + pillar bars + bands |
| 6 | How It Works | Reduce effort anxiety; show the two-week path | 5-step journey timeline |
| 7 | Proof (no testimonials yet) | Borrow credibility from method + research | Findings wall + sample scorecard + founder block |
| 8 | The Math | Let them justify the price themselves | Worked example: one missed job vs. $750 |
| 9 | Objections / FAQ | Answer the top 10 in their own words | Accordion FAQ |
| 10 | The Ladder | Show what happens after (credit mechanics) | Snapshot → Audit → Sprint → Advisory graphic |
| 11 | Final close | Decision moment with risk reversal | Audit CTA + Snapshot CTA + guarantee line |
| 12 | Footer | Edge cases and trust | Contact CTA, Corriston/WSS identity, legal |

One page, no top navigation away from the offer (logo links home; that's it).
Sticky mobile footer bar with the primary CTA after 50% scroll.

---

## 4. Hero Section (final copy)

**Kicker:** For roofing, HVAC, plumbing & electrical companies

**Headline:**

> **You don't need more leads. You need to stop losing the ones you have.**

**Subheadline:**

> Missed calls, silent forms, quotes that die without a follow-up, ad spend
> nobody can tie to a booked job. The Revenue Leak Audit finds every place
> your business leaks revenue — with evidence — and tells you exactly what
> each leak costs you per month. $750. Two weeks. About two hours of your time.

**Supporting line (the napkin math, directly under subheadline):**

> One recovered job usually pays for it. *(Average roof replacement: ~$8,000–$10,000.)*

**Primary CTA (button):** `Start My Audit — $750`
**Secondary CTA (ghost link):** `See a sample report first →`

**Hero visual:** a slightly angled mock of the report's scorecard page — the
0–100 gauge, five pillar bars, and a redacted business name. The product *is*
the report; show the report. (Reuses the sample scorecard asset from §8 — one
asset, used twice.)

**Why this hero:** the first sentence concedes what every competitor promises
("more leads") and replaces it with the claim only we are making. It
immediately communicates the two required ideas — *you already have leads* and
*you may be losing revenue* — in twelve words. The secondary CTA captures the
skeptic who won't spend $750 unseen; the sample report is the best salesperson
we have before testimonials exist.

**Alternates (for testing later, not launch):**

- H1-B: "Your phone rang 60 times last month. How many became jobs?"
- H1-C: "Somewhere between the click and the booked job, you're losing money."

---

## 5. The Leak Strip (section 2 copy)

Four tiles, each one leak, each phrased as a question the owner can't answer.
Sourced from our own audit research — no invented industry stats:

1. **"How many calls went to voicemail last month?"** Most owners we audit
   can't answer. None of the phones we test are tracked.
2. **"Does your contact form actually work?"** We test every form with a real
   submission. Some never arrive. Most get answered hours later — after the
   lead called your competitor.
3. **"Which ad dollars become booked jobs?"** Not clicks. Jobs. If your
   report says 'impressions,' nobody is measuring what matters.
4. **"What happened to last month's unanswered quotes?"** Usually: nothing.
   Quote follow-up is the single biggest leak we find.

Closing line under the strip:
> In our analysis of **88 local service businesses**, the most common problem
> wasn't the website. It was everything wired around it.

*(True: the Website Replacement Score research set — 16 + 72. This line is the
page's only aggregate claim and it's ours.)*

---

## 6. "Your Website Is Fine" Block (section 3 copy)

> **This is not a website pitch.**
> We analyzed 88 local service businesses. Most websites were fine. What we
> found instead: untracked phone lines, forms nobody tested, towns full of
> customers who never see the business in search, and quotes that die in
> silence. If your website genuinely needs replacing, the audit will say so —
> and we'll tell you the cheapest honest way to fix it. But that's the
> exception. The leaks are almost always in the system around the site, and
> that's what we audit.

This block doubles as qualification: a reader with no website and no lead flow
self-selects out (and belongs in the WSS Founder Website funnel instead).

---

## 7. Audit Deliverables Section ("What $750 Buys")

Layout: 3×3 grid of cards (matches the approved framework), each card =
icon + name + one outcome-phrased line. Section header:

> **Nine deliverables. Two weeks. Fixed price.**
> Every audit follows the same published framework — same tests, same scoring
> rubric, same report. Here's exactly what you get.

| Card | Copy |
|------|------|
| **Revenue Leak Score** | One number (0–100) for the whole business, built from five weighted pillars. Know exactly how leaky you are — and re-score after fixes. |
| **Conversion Review** | Every service page's path to a call or form, tested on a phone like a real customer. Where visitors give up, and why. |
| **Form Audit** | We submit real test leads through every form and time the response. You'll see the timestamps. |
| **Call Audit** | Mystery-shop calls during business hours and after hours. Rings, voicemail behavior, callbacks — logged and recorded. |
| **Tracking Review** | GA4, conversion events, call tracking, Business Profile. A plain-English list of what you can and cannot measure today. |
| **Attribution Review** | The spend-vs-proof table: every channel, what it costs, and what you can actually prove it returns. |
| **Lead Quality Review** | Where your leads come from, how many are junk, and whether your spend buys jobs you actually want. |
| **Service Area Review** | The towns you serve vs. the towns you show up in. A coverage map of where you're invisible. |
| **The Roadmap** | Every fix, ranked by recovery-to-effort, tagged Fix Now / 30 days / 90 days — each with an owner and an estimated monthly recovery. |

Under the grid: a wide visual of the report fanned across 3–4 pages (leak map
page, scorecard page, spend-vs-proof page, roadmap page) with the caption:

> A 15–20 page report written for an owner, not a marketer — plus a 60-minute
> walkthrough call and a 30-day check-in. Every dollar estimate shows its math.

CTA under section: `Start My Audit — $750` (primary, repeated).

---

## 8. Revenue Leak Score Section (presentation design)

Goal: make an abstract score feel like an instrument reading. Three visual
elements, all reused from the actual report template (build once, use in both):

**1. The gauge.** A semicircular 0–100 gauge with the four band zones colored
and labeled. Sample needle at 58 — deliberately mid-band ("Significant
leakage") because that's the median honest result; a dramatic 23 would read
as fear-mongering, a 90 would undersell the problem.

**2. The pillar bars.** Five horizontal bars with weights printed:

```
Conversion   ████████░░░░░░░  30% of score   — do visitors become calls and forms?
Follow-up    ██████░░░░░░░░░  25% of score   — does anyone chase the lead and the quote?
Visibility   █████████░░░░░░  15% of score   — do your service areas see you at all?
Tracking     ███░░░░░░░░░░░░  15% of score   — can you count calls, forms, and jobs?
Attribution  ██░░░░░░░░░░░░░  15% of score   — can you tie spend to booked jobs?
```

**3. The bands.** Four chips with plain-English meaning:

| 85–100 | **Tight ship** — minor leaks. We'll say so and send you home. |
| 65–84 | **Leaking** — real money monthly; a focused sprint recovers most of it. |
| 40–64 | **Significant leakage** — multiple broken stages; staged 90-day plan. |
| 0–39 | **Critical** — fix the lead path before spending another marketing dollar. |

**Copy block beside the visuals:**

> **One number you can act on — and check our work against.**
> Every item we test is scored 0, 1, or 2 against a published rubric, so the
> score isn't an opinion — two auditors would give you the same number. A dead
> contact form or an untracked phone line caps its pillar at 40, because a
> catastrophic leak shouldn't be hidden by a good average. And if you score
> 85+, the report's recommendation is: don't hire us.

The "85+ means don't hire us" line is the trust mechanism for the whole page —
it appears here and again in the guarantee at the close.

---

## 9. Customer Journey Section ("How It Works")

Horizontal 5-step timeline (stacks vertically on mobile), each step =
number + name + duration + one line + "your effort" tag:

1. **Discovery** — Days 1–3 · A short intake form, read-only access grants,
   and a 30-minute kickoff call. *Your effort: ~45 minutes.*
2. **Audit** — Days 3–10 · We test everything like a customer would: mystery
   calls, real form submissions, tracking and visibility checks. You change
   nothing; staff aren't told which calls are ours. *Your effort: none.*
3. **Review** — Days 10–12 · A 60-minute call walking the leak map, the score,
   and the three biggest leaks. You correct anything we got wrong, live.
   *Your effort: 1 hour.*
4. **Delivery** — Within 24 hours of review · The final report, evidence
   appendix, and roadmap land in your inbox. *Your effort: read it.*
5. **Implementation** — Day 30+ · Fix it yourself with the roadmap (it's
   yours), or have us do it — your $750 credits in full toward any
   implementation sprint of $2,500+ booked within 30 days. *Your effort: a
   decision.*

Footer line under the timeline:

> **Two weeks, about two hours of your time.** Report delivered within 10
> business days of access granted — or the audit is free.

(Service promise carried verbatim from the offer design.)

---

## 10. Social Proof Strategy (no testimonials yet — none faked)

Until the first pilot customers grant permission for case studies, the proof
section borrows credibility from four sources we actually possess:

**A. The Findings Wall (primary).** 4–6 anonymized, true findings from our own
research and audit work, styled like report excerpts (mono font, redaction
bars over business names). Examples of the *format* (final tiles must be drawn
from real audit/research output before publishing — placeholders marked TK
until then):

> "After-hours call → voicemail full. Caller cannot leave a message." — Roofing, FL *(TK: verify)*
> "Form submitted 10:14am Tuesday. First reply: 3:52pm Wednesday." — HVAC *(TK: verify)*
> "$2,400/mo ad spend. Conversion tracking: not installed." — Plumbing *(TK: verify)*

Rule: every tile must be a real observation. If we lack six, run the Snapshot
on 3–5 friendly prospects from the 72 list (with permission) to generate them.

**B. The Sample Scorecard (secondary, doubles as hero visual and secondary-CTA
target).** A full, real-format sample report for a fictional-but-labeled
business ("Sample Co. Plumbing — demonstration report"), downloadable or
viewable as a flipbook. Clearly watermarked SAMPLE. This converts the
skeptic better than any quote because it *is* the product.

**C. The Methodology Block.** "How we audit" in 5 lines — published rubric,
0/1/2 scoring, evidence appendix, every estimate shows its math, same
framework every time. Transparency is proof when reputation hasn't compounded
yet.

**D. The Founder Block.** Gary Corriston, Corriston Consulting, LLC — short
operator-credibility bio, photo, and the 88-business research line. Local
service owners buy from a person; show the person who answers the phone.

**Case-study placeholders:** the layout reserves a three-card "Recent audits"
row rendered as the Findings Wall for launch. After the first 2–3 pilots, each
card flips to: business type + score + biggest leak found + what it was worth.
The section is *designed* for its future content so adding real proof is a
content swap, not a redesign.

**Explicitly forbidden:** invented testimonials, stock-photo "customers,"
borrowed industry statistics presented as ours, fake star ratings, and any
schema markup implying reviews exist.

---

## 11. The Math Section (price justification, section 8 copy)

> **The audit costs $750. Here's the only math that matters.**
> Average roof replacement: ~$8,000–10,000. Average HVAC install: ~$7,000–12,000.
> Average repipe: ~$4,000–8,000.
> If the audit recovers **one** job you would have missed — one answered call,
> one followed-up quote, one town where you become visible — it has paid for
> itself several times over. If it finds nothing meaningful, it will say so,
> and you'll have written proof your system is tight. That's worth $750 too.

(Ranges are public knowledge for the trades and phrased as "average ~" —
adjust per real market data before launch; flagged TK in build checklist.)

---

## 12. Objections — Top 10, Answered

Rendered as an accordion FAQ on-page (also the sales-call objection sheet).

1. **"We already have a website."**
   Good — keep it. This isn't a website pitch; most websites we audit are
   fine. The leaks are around the site: untracked calls, untested forms, slow
   follow-up, invisible service areas. If your site genuinely is the problem,
   the audit says so and we'll tell you the cheapest honest fix — that
   outcome is the exception, not the sales plan.

2. **"We already run ads."**
   Then you have the most to gain. Every lead you're paying for makes each
   leak more expensive — a missed call costs more when you bought the call.
   The audit tells you what your ad spend actually returns in booked jobs,
   which today you likely can't prove. Bring the audit to your ad vendor;
   good ones welcome it.

3. **"We already have an SEO company."**
   Keep them — we're not bidding on their work. SEO gets people *to* the
   site; we audit what happens *after*: the call, the form, the follow-up,
   the measurement. The audit also gives you a scorecard your SEO vendor's
   monthly report can be checked against.

4. **"We already use CallRail."**
   Installed isn't the same as working. We routinely find tracking numbers on
   half the pages, swap code conflicts, untagged campaigns, and dashboards
   nobody opens. We audit your existing CallRail setup as part of the call
   and tracking review — you've paid for the tool; let's make it tell the truth.

5. **"$750 is expensive — agencies offer free audits."**
   A free audit is a sales document: it exists to find reasons to sell you the
   agency's service. Ours is the product — fixed scope, published rubric,
   evidence appendix, and a report that says "you're fine" when you're fine.
   We charge for it precisely so we don't have to make it say what a pitch
   needs it to say.

6. **"You'll just upsell me at the end."**
   The roadmap tags every fix with an owner — and many are tagged *You*,
   because plenty of fixes are an afternoon of your office manager's time. If
   you want us to implement, the $750 credits in full toward a $2,500+ sprint
   within 30 days. And if you score 85+, the written recommendation is to buy
   nothing. That clause is in the sample report — go look.

7. **"I don't have time for this."**
   Total cost to you: about two hours across two weeks — a 30-minute kickoff,
   a 60-minute review, and reading the report. We do the rest from the
   outside, like a customer would. Your team doesn't prepare anything; in
   fact, it works best when they don't know which calls are ours.

8. **"My office answers every call."**
   Maybe — most owners believe that, and most are wrong after 5pm, during
   lunch, or on the second line. We test it: real calls, business hours and
   after hours, logged and recorded. If your team really catches everything,
   that's a high Conversion pillar score and one less thing to worry about.
   It's the cheapest "I told you so" your office manager will ever win.

9. **"We already know where our leads come from — we ask people."**
   "How did you hear about us?" answers are famously unreliable — people say
   "Google" whether they clicked an ad, a map listing, or a referral link.
   The attribution review shows what *recorded data* says, channel by
   channel, and where ask-based answers and tracked reality disagree —
   that gap is usually where the wasted spend hides.

10. **"Can't I just do this myself?"**
    Some of it, absolutely — and the roadmap is written so you can. But you
    can't mystery-shop your own staff, you likely don't know what a correct
    GA4/call-tracking install looks like, and the value isn't the checklist —
    it's evidence, dollar-sizing, and ranking, so you fix the $3,000/month
    leak before the $50 one. If $750 is the obstacle, start with the $250
    Snapshot.

---

## 13. CTA Structure

Three CTAs, strict hierarchy — each appears only where it does its job:

### Audit CTA — `Start My Audit — $750` (primary, green/solid)

The page's only "buy" action. Placement:
- Hero (primary button)
- After the Deliverables grid (§7)
- After the Score section (§8)
- Final close (§11 of page) — paired with the guarantee
- Sticky mobile footer bar after 50% scroll

Destination (when built): checkout or a 2-field start form (name, email →
invoice/payment). **Design note only — no Stripe work in this phase.** Price
always visible on the button: hiding it signals "sales call ambush."

### Snapshot CTA — `Not sure? Start with the $250 Snapshot` (secondary, ghost)

The de-risk path, *deliberately withheld until the price conversation*:
- The Math section (§11) — beside the price justification
- Objection #10 answer
- Final close — under the Audit button, smaller
- Exit-intent / scroll-abandon prompt (one line, dismissible)

**Not in the hero.** Putting $250 next to $750 at the top converts $750
buyers into $250 buyers; the snapshot exists to catch people who were leaving,
not to compete with the flagship. Copy always frames it as a stepping stone:
*"Outside-in checks only — calls, forms, visibility, tracking presence. One-page
scorecard in 5 business days. The $250 credits toward your audit within 30 days."*

### Contact CTA — `Questions? Talk to Gary` (tertiary, text link)

For edge cases: multi-location businesses, franchises, "is this right for me,"
and buyers who simply need a human before any purchase. Placement: FAQ tail
("Still have a question?"), footer, and the founder block. Email +
booking-calendar link (existing Corriston booking URL). Never a button — a
prominent "book a call" competes with self-serve purchase and re-introduces
the sales-meeting friction the offer is designed to remove.

### Secondary hero link — `See a sample report first →`

Not a purchase CTA; it opens the sample scorecard (§10-B). Captures skeptics
at the top without offering them a cheaper price — the sample does the
convincing, then returns them to the Audit CTA via a banner on the sample
itself.

---

## 14. Future Funnel — How Prospects Move Through the Ladder

```
                     COLD TRAFFIC                      WARM LIST (the 72)
              (ads, local SEO, referrals,           (Website Replacement Score
               linked articles, directories)             outreach replies)
                          │                                   │
                          ▼                                   ▼
              ┌─────────────────────────────────────────────────────┐
              │        LANDING PAGE  /revenue-leak-audit            │
              └─────────────────────────────────────────────────────┘
                   │                │                       │
            ready to buy      skeptical /              not ready at all
                   │          price-sensitive               │
                   ▼                ▼                       ▼
            ┌──────────┐   ┌────────────────┐      sample report download
            │  AUDIT   │◄──│ SNAPSHOT  $250 │      + founder email follow-ups
            │   $750   │   │ outside-in     │      (no drip spam; 3 emails:
            └────┬─────┘   │ 1-page score   │       sample, findings, snapshot
                 │         │ 5 biz days     │       offer — then stop)
                 │         └───────┬────────┘
                 │                 │ $250 credits to Audit ≤ 30 days
                 │                 │ (snapshot report's only CTA)
                 │◄────────────────┘
                 ▼
        Report + Review call + 30-day check-in
                 │
   ┌─────────────┼───────────────────┬─────────────────────┐
   ▼             ▼                   ▼                     ▼
score 85+    score 40–84        website condemned     wants accountability,
"you're     ┌──────────────┐    (rare)                not implementation
 fine" —    │ SPRINT       │         │                     │
 referral   │ $1.5K–$3.5K  │         ▼                     ▼
 engine     │ $750 credits │    WSS Founder         ┌──────────────┐
            └──────┬───────┘    Website $500        │ ADVISORY     │
                   │                                │ $750–1.5K/mo │
                   ▼                                └──────────────┘
        website-tagged roadmap items                        ▲
                   │                                        │
                   ▼                                        │
        WSS Operations $199/$399 per mo  ──────────────────┘
        (execution engine; quarterly re-score feeds advisory)
```

**Snapshot definition (new rung, scoped here so it stays consistent):**
outside-in checks only, requiring zero account access — one business-hours
mystery call, one after-hours call, one form test, visibility spot-check on
three service-area/service combinations, and a tracking-presence scan. Output:
one-page scorecard (same five pillars, marked "estimated — outside-in") with
the three most visible leaks. Delivered in 5 business days. ~1.5 hours of
delivery effort. Its report has exactly one CTA: apply your $250 to the full
audit. The Snapshot is also the engine for Findings Wall content and for
warming the 72-prospect list ("we ran a snapshot on your business" outreach
is permissible only as an *offer*, not as unsolicited delivered results).

**Credit mechanics (one rule per rung, printed on the page):**
- Snapshot $250 → credits to Audit within 30 days.
- Audit $750 → credits to Sprint ≥ $2,500 within 30 days.
- Sprint → first month of Advisory free if started within 30 days of sprint
  completion (proposed; confirm economics before publishing).

**Velocity expectations** (from offer-design pipeline math, restated): 72 warm
prospects → 15–20 audits (some entering via Snapshot) → ≥40% sprint attach →
2–4 advisory retainers + 3–5 WSS subscriptions as the durable tail. The
landing page's job for the warm list is to be the *credible artifact behind
the outreach email* as much as a cold-conversion machine.

---

## 15. Final Recommendation

**Build it as one long-form page at corristonconsulting.com/revenue-leak-audit,
in this exact section order, with the sample scorecard as the first asset
produced** — it is simultaneously the hero visual, the secondary-CTA target,
the skeptic-converter, and the template for real reports. Nothing on the page
depends on assets we don't have or claims we can't prove.

Launch sequence (design/ops only; no production, Stripe, or onboarding work):
1. Produce the sample scorecard + sample report (also the delivery template).
2. Run 3–5 permissioned Snapshots on friendly prospects from the 72 → real
   Findings Wall tiles (replace all TK markers).
3. Build the page per this spec; payment via existing invoicing until a
   payment link is separately approved.
4. Soft-launch to the 72 with a founder email (page as the artifact).
5. After 2–3 pilot audits: flip Findings Wall cards to mini case studies,
   then open cold traffic.

Hold the line on three things: the price stays visible on every buy button,
the Snapshot stays out of the hero, and nothing fake ever occupies the proof
section — the "85+ means don't hire us" clause is worth more than any
testimonial we could write.
