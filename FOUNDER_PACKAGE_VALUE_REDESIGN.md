# Founder Website Package — Perceived Value Redesign

**Status:** Design only. Nothing deployed, pushed, or changed in production.
No Stripe, onboarding, or v2-foundation work. This doc defines what gets built
next (demo sites + gallery v2) and the requirements for building it.

**Owner:** Corriston Consulting, LLC / Website Support Studio
**Date:** June 12, 2026
**Builds on:** the live Template Gallery MVP (commit `25ea457`)

---

## 1. Executive Summary

The gallery MVP did its architectural job: data structure, page, CTAs, and
routing are correct. But it sells **structure** — wireframes, page lists,
feature chips — and structure is what every $59 theme shop sells. A visitor
can't have the reaction *"how is he only charging $500?"* while looking at a
gray-bar diagram labeled "placeholder," because the thing being priced isn't
visible yet.

The fix is a **model-home strategy**: build the three demo companies as
complete, clickable, photographed, finished business websites — Ridgeline
Roofing, Airflow HVAC, Mainline Plumbing — each with its own brand, photos,
copy, reviews block, service-area pages, and working forms. Then re-present
the gallery as a *portfolio of finished websites you can visit*, not a chooser
of templates you must imagine. The word "template" leaves every customer
surface. The previews become real screenshots. Every card links to a live
demo. The reaction we want comes from **recognition** ("that's basically my
company") followed by **price disbelief** ("...and it's $500?") — and the page
answers the disbelief honestly in a "Why only $500?" section, which converts
suspicion into trust.

Nothing about the offer changes: same $500, same includes, same Stripe link,
same CTA flow. This is a perception redesign with one prerequisite build (the
demos) and one copy/asset pass (the gallery and package presentation).

---

## 2. Current Homepage Audit — What Lowers Perceived Value

Reviewed: hero, gallery section, `/templates`, and the package presentation in
`consts.ts` / pricing page, as live at commit `48d515c`.

### What lowers perceived value

1. **The word "template" — used everywhere, priced like a commodity.**
   Kicker (`_template_gallery`), headline support copy ("Three proven website
   templates"), CTAs ("Start With This Template"), URL (`/templates`), alt
   text. "Template" means ThemeForest, Wix, $59-and-DIY. Every repetition
   re-anchors $500 as *expensive for a template* instead of *impossibly cheap
   for a finished website*. The MVP's safest noun is the redesign's biggest
   liability.
2. **Wireframe previews that say "placeholder" on their face.** The SVGs are
   gray bars and blocks, literally captioned "template preview placeholder."
   They are honest (correctly so — no demos existed) but they communicate
   *unbuilt*. Nobody covets a diagram.
3. **Structure language instead of outcome language.** Page chips ("Home,
   Services, Service Areas, About, Contact") are identical across all three
   cards — which visually proves the suspicion we need to kill: *same
   skeleton, three coats of paint.* Listing pages adds zero desire; every
   website ever made has these pages.
4. **The feature strip sells table stakes as value.** "SSL," "Hosting,"
   "5 pages" rendered as flat gray chips reads like a spec sheet. SSL is
   worth $0 emotionally; it's the seatbelt, not the car.
5. **No trade reality anywhere.** No roof, no truck, no crew, no thermostat,
   no pipe wrench. Trades owners buy from photos of real work — ours shows
   abstract rectangles.
6. **Promise/payoff gap.** "See exactly what $500 buys" is a strong headline
   that the section then *under-delivers*: "exactly" followed by wireframes
   actively erodes trust in the headline.

### What creates uncertainty

- "What will *mine* actually look like?" — wireframes give no answer.
- "Can I see one?" — nothing is clickable; no live example exists.
- "Will it look generic?" — three identical-layout cards suggest yes.
- "What do I have to provide?" — photos, copy, logo? Never addressed.
- "Is this company real?" — placeholder previews + a $500 price + a direct
  Stripe link is a pattern that, without proof, reads scammy to a cautious
  owner.

### What feels unfinished

The placeholders (by design), the sameness of the three cards, and the
`/templates` detail page restating the same chips and lists with no imagery
of an actual finished page. The MVP shows the *shape* of the product; nothing
yet shows the *product*.

---

## 3. The Strategic Reframe: Model Homes, Not Floor Plans

A home builder doesn't sell floor plans to first-time buyers — they furnish a
model home, bake cookies, and let you walk through it. The current gallery is
floor plans. The redesign is model homes:

| Template thinking (current) | Finished-business thinking (target) |
|----------------------------|--------------------------------------|
| "Three proven templates" | "Three finished websites. Walk through one." |
| Wireframe preview | Real screenshot of a real-looking homepage |
| Page list chips | The actual pages, visitable |
| "Start With This Template" | "Make this my website — $500" |
| Pick a layout | Recognize your company |
| `_template_gallery` | `_finished_websites` (or `_walk_through_one`) |

**The honesty line (non-negotiable, consistent with prior rules):** the demo
companies are openly fictional — model homes, not client work. Each demo
carries a slim banner: *"Demo company — this is the website we build for
$500."* We never present demos as customer projects, never claim fictional
reviews as reviews *of WSS*, and the demo footer notes "Sample reviews shown."
Staged is honest when the staging is declared; the model home has a sales
office sign on the lawn.

The banner is also the conversion trick: **every demo site is itself a
landing page.** A prospect who clicks "visit the live site" is now browsing a
finished product with a persistent "get this for $500" bar. Shares, forwards
("look at this one"), and return visits all land on a selling surface.

---

## 4. What Each Owner Should See (recognition design)

The reaction "that's basically my company" comes from five recognition
triggers per vertical: their work, their truck, their offer, their customer,
their towns. Each demo is built around them — and the three demos get
**distinct brand systems** (palette, type pairing, photography style) so they
read as three different companies, not one theme recolored.

### Ridgeline Roofing — what a roofing owner sees
- **Hero:** drone-angle photo of a crew on a steep asphalt roof, golden hour;
  headline about protecting the home, not about roofing SEO.
- **Offer bar:** "Free roof inspection" + storm-damage response banner
  (hail/wind) — the two offers every roofer runs.
- **Proof:** completed-roof gallery (before/after shingle close-ups), GAF-style
  certification badge area (generic "certified installer" iconography — no
  real brand marks we don't have rights to), financing available strip.
- **Reviews block:** 5-star strip, review text about cleanup, crew courtesy,
  and insurance-claim help (the three things real roofing reviews mention).
- **Service areas:** Denver metro — Arvada, Lakewood, Aurora, Thornton,
  Centennial. Real suburb names = instant credibility.
- **Brand:** deep slate + safety-orange accent; bold condensed headings.

### Airflow HVAC — what an HVAC owner sees
- **Hero:** uniformed tech at a condenser unit, gauges in hand; headline about
  comfort/same-day service.
- **Offer bar:** "Same-day AC repair" + seasonal tune-up price point +
  maintenance plan block ("$14/mo priority club" pattern).
- **Proof:** 24/7 emergency badge, response-time promise, brands-we-service
  grid (generic), install gallery.
- **Reviews:** speed of arrival, honest quote vs. competitor, tech explained
  everything — the real HVAC review triad.
- **Service areas:** Tampa metro — Brandon, Riverview, Wesley Chapel, Clearwater,
  St. Petersburg.
- **Brand:** cool blue/white + warm accent (heating/cooling duality); rounded,
  friendly type.

### Mainline Plumbing — what a plumbing owner sees
- **Hero:** close-up of hands on copper/PEX work, headline about answering at
  2am — plumbing is bought in emergencies.
- **Offer bar:** "Emergency? We answer." click-to-call dominant; water heater
  replacement and repipe as the two flagship service cards.
- **Proof:** licensed/insured/license-number line, upfront-pricing promise,
  van-in-driveway photo (the visual every homeowner associates with relief).
- **Reviews:** showed up fast, fixed it same visit, fair price under pressure.
- **Service areas:** Columbus metro — Dublin, Westerville, Grove City,
  Hilliard, Gahanna.
- **Brand:** navy + brass/copper accent; sturdy slab-ish type.

Three different metros (CO / FL / OH) quietly signal "this works anywhere,"
and prevents two demos competing in the same fictional town.

---

## 5. Gallery Redesign Recommendations (homepage section v2)

Same section slot, same data architecture (`TEMPLATES` array gains fields;
nothing renamed internally), new presentation:

1. **Section header:**
   - Kicker: `_finished_websites`
   - H2 stays: **"See exactly what $500 buys."** (now it can keep its promise)
   - Lede: "Three complete websites we built for businesses like yours.
     Click one. Tap around. Everything you see is included."
2. **Cards become portfolio pieces:**
   - Full-width browser-framed **screenshot of the demo homepage** (real
     photography visible in the thumbnail), phone screenshot overlapping the
     corner — the same composition pattern as now, with real pixels instead
     of wireframes.
   - Company name + one-line persona: "Roofing · Denver, CO".
   - **`Visit the live site →`** — the single highest-leverage element on the
     page. A clickable finished website is the proof no copy can substitute.
   - One outcome line replaces the page chips: *"Built to turn storm calls
     into booked inspections"* / *"Built to win the same-day repair call"* /
     *"Built to be found at 2am."*
   - CTAs: primary **`Make This My Website — $500`** (same Stripe href,
     unchanged flow); secondary `Visit the live site`. ("View Details" page
     remains for the comparison shopper, linked from the section footer.)
3. **Page chips move** to `/templates` detail page only — and there, each page
   name becomes a **screenshot thumbnail** of that actual page on the demo
   (Services, Service Areas, Contact…), because "5 pages" shown is worth ten
   times "5 pages" listed.
4. **Feature strip rewritten as outcomes** (same 10 items, owner language,
   with the table stakes compressed):
   - "5 pages" → "Five pages, written and built for your trade"
   - "Service area pages" → "A page for every town you serve — where the
     'near me' calls come from"
   - "Contact forms" → "Forms that land in your inbox in seconds"
   - "Click-to-call" → "Your number, tappable, on every screen"
   - "Basic SEO" → "Set up so Google can actually find you"
   - "Hosting / SSL / Launch" → one item: "Hosting, security, and launch —
     handled"
   - "Mobile optimization" → "Looks right on the phone your customers use"
   - "30 days support" → "30 days of fixes and tweaks after launch, included"
5. **Add the missing answer section — "Why is it only $500?"** directly under
   the gallery. The disbelief we're engineering must be answered or it decays
   into suspicion:
   > "Because we're not starting from scratch. We've already designed and
   > tested these three websites — we adapt one to your company in days, not
   > months. And honestly: the $500 build is how we earn the chance to run
   > your website month to month afterward. You get an agency-grade site for
   > the price of a service call; we get a customer we can keep being useful
   > to. Everyone's incentives point the same way."
   Saying the quiet part is the trust move that makes $500 read as *strategy*
   rather than *cheapness*.
6. **Hero gains a visual.** The text-only hero leaves the page's first screen
   valueless. Add the laptop+phone composite of Ridgeline (the best-looking
   demo) right of the hero copy — the price headline and the finished product
   in the same glance is the entire pitch.

---

## 6. Before / After Strategy

**Verdict: yes — one section, staged honestly, replaced with real pairs as
customers launch.** Reasoning: roughly half the buyers (and all 16 audit-flow
prospects) have a bad site rather than no site; before/after is the fastest
emotional proof of transformation. But we have no client befores yet, and
faking one as client work is off-limits.

**Honest staging pattern:** build one deliberately typical 2012-era contractor
page — tiny text, stretched photo, phone number buried, not mobile-responsive
— labeled *"The website most contractors are running today."* Pair it with
Ridgeline in an interactive slider:

> **Recognize the one on the left?**
> [ slider: dated site ⟷ Ridgeline Roofing ]
> "If your website looks like the left, you're losing calls to companies that
> look like the right. Fixing that costs $500 and takes about a week."

Example pairs (described for the asset build):
1. **The 2012 special** → Ridgeline: stretched header photo and 8pt body text
   vs. full-bleed crew photo with one giant tappable number.
2. **The phone test:** the dated site pinched-and-zoomed on a phone mock vs.
   Airflow's thumb-sized "Call now" — caption: "73% of your customers are on
   a phone." *(TK: verify stat or cut the number and keep the visual.)*
3. **The 2am test:** dated site's buried contact page vs. Mainline's
   emergency-call bar — caption: "Which one gets the 2am water-heater call?"

Rules: the "before" is never attributed to a real business, never to a
competitor, and never screenshotted from a real site. When the first real
customers launch, swap in true before/afters (with written permission) — at
which point this becomes the strongest section on the page.

---

## 7. Demo Site Requirements (build checklist — before any screenshot)

Prerequisite for everything above. Applies to all three; per-vertical content
in §4. A demo may be screenshotted and linked only when every box checks.

### Identity (per demo)
- [ ] Designed logo (real design work, not a font treatment) + favicon + OG image
- [ ] Fictional but plausible identity: tagline, founded year, license number
      in the correct state format, hours, service radius
- [ ] Phone number that is **non-routable or owned by us** (no real stranger's
      number); ideally a tracking number so demo calls prove our own tracking
- [ ] Metro + 5–6 real suburbs (per §4) used consistently across all pages
- [ ] Distinct brand system: palette, type pairing, button/component styling —
      the three demos must not look like siblings

### Content (per demo)
- [ ] All 5 pages fully written — zero lorem, zero "TK," trade-correct
      vocabulary (squares, SEER, repipe — the words that signal "they know us")
- [ ] Licensed photography that doesn't read as stock: hero shot, crew shot,
      2–3 action close-ups, 6–8 item completed-work gallery, vehicle shot.
      Consistent "cast" and lighting within each company; no watermarks, no
      handshake-clipart genre
- [ ] 3–5 sample reviews, realistic content per §4 triads, "Sample reviews
      shown" disclosure in the demo footer
- [ ] Service-area pages live for each listed suburb (these are a headline
      feature — they must actually exist in the demo)
- [ ] Offer elements per vertical (inspection banner / tune-up block /
      emergency bar)

### Function (per demo)
- [ ] Forms actually submit (to a WSS test inbox) and show a confirmation —
      prospects will test them
- [ ] Click-to-call wired on every page
- [ ] Mobile-perfect at 375px; no horizontal scroll; tap targets ≥44px
- [ ] Fast: aim Lighthouse mobile ≥90 performance — speed is a *demonstrable*
      part of the product ("loads in about a second" can go on the page only
      if true)
- [ ] Demo banner: slim, dismissible — "Demo company · This is the website we
      build for $500 → [Make this my website]"
- [ ] Indexable decision: `noindex` the demos (recommended — they shouldn't
      compete with customer sites or confuse local search)

### Screenshot kit (after QA, per demo)
- [ ] Desktop homepage at 1440×900 (browser-framed), phone homepage at 390×844
- [ ] One screenshot per inner page for `/templates` thumbnails
- [ ] The hero laptop+phone composite (Ridgeline)
- [ ] Before/after slider assets (§6)
- All screenshots from the live demo — never mockups that outrun the real thing

**Hosting note (design decision, not built here):** demos live at
`demo.websitesupportstudio.com/ridgeline` (or per-demo subdomains) — same
infrastructure as customer sites, which makes the demos *literally* the
product.

---

## 8. Founder Package Value Audit — does the page justify $500?

**Today: not yet.** The current page justifies roughly its visible evidence —
a tidy promise, a spec list, wireframes. That reads like "$500 template
service," which is the founder's exact critique. The price *feels* high for
what's shown and low for what's actually delivered; both are presentation
failures, not offer failures.

What raises the *felt* worth while charging $500:

| Feels worth | What creates it | Status |
|-------------|-----------------|--------|
| **$1,500** | Finished, clickable demos with real photography; portfolio presentation; three visibly different brands; screenshots replacing wireframes | Unlocked by §7 build |
| **$2,500** | Craft visibility: the build-week timeline ("what happens after you pay" day by day), design reasoning on the page ("why your number is in the header"), measurable specs stated honestly (load time, mobile scores), the outcome-language feature strip | Copy + one section, after demos |
| **$5,000** | Anchoring + answered disbelief: agency comparison row ("Custom agency: $5,000–$8,000 and 6–10 weeks · Founder Website: $500 and about a week — here's why"), the "Why only $500?" honesty block, the before/after slider, the existing 30-day support reframed as risk reversal | Copy + §5.5 + §6 |

The "$5,000 feel" layer is where *"how is he only charging $500?"* actually
happens — but only if the disbelief is answered immediately (§5.5). Disbelief
with an answer is a hook; disbelief without one is a red flag.

**Explicitly unchanged:** the $500 price, the includes list (re-worded, not
re-scoped), the after-launch pricing, the Stripe link and checkout flow, and
the no-fake-testimonials rule.

---

## 9. Final Recommendation & Build Order

**Build the model homes; retire the floor plans.** Everything else is a copy
pass once the demos exist.

1. **Build the three demo sites** to the §7 checklist (Ridgeline first — it
   becomes the hero composite and the before/after "after").
2. **Screenshot kit** from the live demos.
3. **Gallery v2** per §5: kill "template" on every customer surface, swap
   wireframes for screenshots, add "visit the live site," rewrite the feature
   strip, add "Why only $500?".
4. **Hero composite** added to the homepage hero.
5. **Before/after section** with the staged "typical contractor site" (§6).
6. `/templates` page becomes "the walkthrough": per-page screenshot thumbnails,
   persona blurbs, same CTAs. URL can stay `/templates` for now (it's indexed
   and linked); revisit a redirect to `/websites` only as a later SEO decision,
   not part of this pass.

Success test, same as the founder's: show the rebuilt section cold and watch
for the two-beat reaction — recognition (*"that's basically my company"*),
then price disbelief (*"...$500?"*), then the page answering it before
suspicion forms. If any beat is missing, the section isn't done.

One sentence to keep on the wall during the rebuild: **nobody covets a
diagram — show the house with the lights on.**
