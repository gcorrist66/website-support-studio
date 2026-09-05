# Founder Website Package — Sales Process Design

**Status:** Design only. Nothing deployed, pushed, or changed in production.
No Stripe, onboarding, or v2-foundation work. Template/demo/gallery visual work
is explicitly out of scope here (Codex owns it); this document designs the
**process around the offer** — from cold prospect to active WSS customer.

**Owner:** Corriston Consulting, LLC / Website Support Studio
**Date:** June 12, 2026

**Offer (unchanged):** Founder Website Package — $500 one-time → $199/month
months 2–7 → $399/month from month 8. Customer owns the website and all
accounts. 30 days post-launch support included.

**Items marked `PROPOSED` are new policy this document invents and Gary must
approve before any customer sees them** (refund terms, revision counts, SLA,
enrollment timing). Everything else restates existing, published facts.

---

## 1. Executive Summary

The offer is strong and the checkout is already low-friction (one click to a
live Stripe Payment Link). The sales process around it has three structural
gaps:

1. **The moment after payment is the weakest point in the funnel.** Today a
   customer pays $500 and lands on the generic contact form
   (`/contact?source=founder-package-paid`). The highest-anxiety moment of the
   relationship — *"did that just work? what happens now?"* — is answered by a
   page that wasn't designed for it. Buyer's remorse begins in silence.
2. **Pre-purchase, the process is invisible.** Nothing tells a prospect what
   happens after the click, what they'll need to provide, or when they'll be
   live. People don't buy when they can't picture the next step.
3. **The bridge from "launched website" to "active WSS customer" is undefined.**
   The $500 payment link sells a one-time build; the $199/month relationship —
   the actual business model — currently has no designed moment where it
   begins.

The design below closes all three with one journey map, a friction-ranked
trust system, a purchase flow that keeps the direct-to-Stripe click, a
post-purchase experience built around a `/welcome` page + structured intake +
a day-by-day build week, and a 25-question Founder FAQ. The principle
throughout: **friction before payment is removed; structure after payment is
added.** Low-friction buying, high-structure delivering.

---

## 2. The Founder Customer Journey (cold prospect → active WSS customer)

Every step, with the asset that serves it and the exit condition that moves
the customer forward. Stages 1–4 are pre-purchase (remove friction); 5–10 are
post-purchase (add structure).

| # | Stage | What happens | Serving asset | Exit condition |
|---|-------|--------------|---------------|----------------|
| 1 | **Aware** | Prospect hears of WSS — outreach to the 16 audit-flow prospects, referral, local search, article, Missed Jobs Report routing ("your site needs replacing") | Outreach email, articles, audit reports | Visits the site |
| 2 | **Evaluating the product** | Reads hero, walks a demo (Ridgeline live route), checks `/templates`, compares to their current site | Homepage, demo sites, `/templates` | Believes "this is a real finished website" |
| 3 | **Evaluating the deal** | Checks price, what's included, what's NOT included, the monthly question, ownership | Pricing page, includes list, customizable-vs-custom split, FAQ | Believes "$500 is real and I keep everything" |
| 4 | **Evaluating the risk** | "What happens after I pay? What do I have to do? Who are these people? Can I get out?" | **"What happens next" strip (§5), Founder FAQ (§7), ownership guarantee, founder identity block, contact escape hatch** | Clicks the CTA |
| 5 | **Payment** | Stripe-hosted checkout, Apple/Google Pay capable, recognizable and trusted | Stripe Payment Link (existing, unchanged) | Payment succeeds |
| 6 | **Confirmation** | Lands on `/welcome` (§6.1): "You're in. Here's exactly what happens now." Confirmation email arrives in minutes | `/welcome` page + confirmation email | Starts intake |
| 7 | **Intake** | 10-minute structured form: business facts, domain, services, towns, photos/logo upload, template preference | Intake form (§6.3) + asset checklist | Intake complete → **the build clock starts** |
| 8 | **Build week** | Kickoff confirmation → build days → preview link → one revision round → launch prep | Day-by-day schedule (§6.5), preview link, revision window | Customer approves preview |
| 9 | **Launch + 30-day window** | Site goes live; launch email with "your website, your logins" ownership packet; 30 days of included fixes/tweaks | Launch email, ownership packet, support address | Day ~21 reached |
| 10 | **Operations enrollment** | The designed moment the monthly relationship begins: day-21 email + mention at launch — "your included 30 days ends on [date]; founder rate $199/mo locks your spot" — explicit opt-in | Enrollment email (§6.6), pricing page plan card | Subscribes → **Active WSS customer** (or declines cleanly and stays a happy referral source) |

Two journey rules:

- **The build clock starts at completed intake, not at payment** — the only
  honest way to promise a timeline, since we can't build without their facts.
  The `/welcome` page says this explicitly, which also motivates fast intake.
- **Stage 10 is opt-in, stated from the first screen.** "Then $199/month" is
  already on the hero; the process makes the start of billing a visible,
  chosen moment, not a surprise. Surprise billing would poison the referral
  engine this offer depends on.

---

## 3. Friction Analysis

Ranked by estimated lost buyers. "Stage" = where in the journey it kills.

| # | Friction | Stage | Severity | Fix (and where it lives) |
|---|----------|-------|----------|--------------------------|
| 1 | **"What happens after I pay?"** — no visible process; paying $500 into silence | 4→5 | Critical | "What happens next" 4-step strip beside every CTA (§5.2); `/welcome` page; build-week timeline published on the site |
| 2 | **"What do I have to do?"** — effort anxiety: photos? writing? logo? domain? hours of homework? | 3–4 | Critical | "You bring 10 minutes, we bring the rest" block: the intake is ~10 minutes, everything has a no-asset default (§6.4); FAQ #6–#10 |
| 3 | **"Is this a scam?"** — unknown company + low price + direct payment link | 4 | High | Stripe-hosted checkout (recognizable), founder identity block (Gary, Tampa FL, Corriston Consulting LLC), live demo site, legal pages, contact escape hatch, launch guarantee `PROPOSED` |
| 4 | **"Why only $500?"** — price too low to be true | 3 | High | The honesty answer (FAQ #2): pre-built designs + we earn the monthly relationship. Disbelief answered is a hook; unanswered it reads as a catch |
| 5 | **"Is the $199/month required? Will I be trapped?"** — subscription fear hiding inside a one-time price | 3 | High | One canonical sentence everywhere: *"The monthly plan is optional. Cancel anytime. The website is yours either way."* FAQ #3, #11, #12; ownership packet at launch |
| 6 | **"Will it fit MY business?"** — only three trades shown; "I'm an electrician/landscaper" | 2 | Medium-high | FAQ #14 + a line under the gallery: "Not your trade? The same build works for any local service business — pick the closest design." |
| 7 | **"What about my current website/domain?"** — fear of losing the domain, email, or old site mid-switch | 3 | Medium-high | FAQ #8–#10: you keep your domain, we handle the move, old site stays up until the new one is live, email untouched |
| 8 | **"What if I hate it?"** — no visible revision/refund path | 4 | Medium | Published revision round + pre-build full-refund window `PROPOSED` (§6.7); FAQ #23–#24 |
| 9 | **"When will it be live?"** — no committed timeline | 3 | Medium | The SLA `PROPOSED`: live within 7 business days of completed intake; day-by-day schedule published |
| 10 | **"I need to talk to a human first"** — some buyers can't self-serve $500 | 4 | Medium | Booking link as tertiary CTA ("15-minute call with Gary — no pitch, just answers"); never a required step |
| 11 | **"Which template do I pick?"** — choice paralysis across three cards | 2 | Low | Defuse in copy: choice happens *in intake, after payment*, and is changeable; "pick the closest — we adapt it either way" |
| 12 | **Post-payment intake = generic contact form** — process credibility collapses exactly when belief peaked | 6 | Critical (for completion, refunds, and word of mouth) | The entire §6 |

The pattern: almost every friction is an **unanswered question, not a missing
feature.** The sales process is mostly a question-answering machine placed in
the right order.

---

## 4. Trust Builder Framework (no fake testimonials — none, ever)

Ranked by how many critical frictions each one kills. Build order follows rank.

| Rank | Trust builder | Kills frictions | Form |
|------|---------------|-----------------|------|
| 1 | **The visible process** — "what happens next" strip + published build-week timeline + launch SLA | #1, #9, #12 | 4-step strip beside CTAs; timeline section; `/welcome` |
| 2 | **Live demo site(s)** — a finished website you can click (Ridgeline live; others as Codex ships them) | #3, #6, and the value problem itself | Already in flight — referenced, not designed here |
| 3 | **The ownership guarantee** — "Your domain, your website, your accounts, your logins. Cancel anything; keep everything." | #5, #3 | One canonical block reused on homepage, pricing, FAQ, launch email; backed by the existing terms §13 |
| 4 | **The effort promise** — "You bring 10 minutes and your phone number. We bring everything else." + no-asset defaults | #2 | Block near CTA + intake design (§6.4) |
| 5 | **The honesty answer to the price** — why $500 works (pre-built designs, we earn the monthly) | #4 | FAQ #2 + short on-page block |
| 6 | **Founder identity** — Gary, Tampa, Corriston Consulting LLC, photo, direct email, booking link | #3, #10 | About block + FAQ tail + email signatures |
| 7 | **The launch guarantee** `PROPOSED` — "If we don't launch your approved site, you get every dollar back." Plus full refund any time before build starts | #8, #3 | One sentence under the primary CTA |
| 8 | **The Founder FAQ** (§7) — 25 questions answered plainly | nearly all, as the catch-all | New `_founder_website` group in the existing FAQ system |
| 9 | **Real receipts over time** — first launched customers become before/afters and named testimonials (with permission), replacing nothing fake because nothing fake was ever there | #3 long-term | Post-launch ask built into day-30 email |

What deliberately does *not* appear: invented reviews, fake launch counters,
"as seen in" logos, urgency timers. The founder-spots counter (17 of 25)
already exists for the operations plan and is real; it stays the only scarcity
on the site.

---

## 5. The Purchase Process (what happens when they click)

### 5.1 Keep the direct-to-Stripe click — decision and rationale

Two candidate flows were considered:

- **A. Direct (current):** CTA → Stripe Payment Link → pay → redirect.
- **B. Pre-checkout step:** CTA → short form (name, business, template) → Stripe.

**Decision: A.** Every added pre-payment field is a place to abandon, and
everything a pre-checkout form would collect is collected better in the
post-payment intake (when commitment is already made). Option B re-introduces
exactly the friction the offer exists to remove. The fixes go *around* the
click, not in front of it.

### 5.2 The "what happens next" strip (the missing pre-click asset)

A compact 4-step strip rendered beside/below every Founder CTA — the single
highest-leverage pre-purchase addition in this document:

> **1. Pay $500** — secure Stripe checkout, takes a minute.
> **2. Tell us about your business** — a 10-minute form. No logo or photos? We handle it.
> **3. We build** — your site is ready to preview within days; one round of changes included.
> **4. You're live** — launched on your domain, with 30 days of included support.
> *Live within 7 business days of step 2.* `PROPOSED SLA`

With one trust sentence beneath the primary CTA:
> *You own everything. The monthly plan afterward is optional. Cancel anytime.*

### 5.3 The click, step by step (design state)

1. Prospect clicks `_build_my_website` (or a template card CTA).
2. Stripe-hosted checkout opens — existing live Payment Link, **unchanged**.
   Card / Apple Pay / Google Pay. Receipt from Stripe automatically.
3. On success, Stripe redirects to the post-purchase surface. **Today:**
   `/contact?source=founder-package-paid`. **Designed target:** `/welcome`
   (§6.1). Changing the redirect URL is a one-line Stripe Payment Link
   setting — **explicitly not done now** (no-Stripe constraint); recorded
   here as the single config change this design eventually requires.
4. Confirmation email sends (§6.2).

Interim note: until `/welcome` exists, the contact page can read the
`source=founder-package-paid` param and swap its heading to "Payment received —
tell us about your business" with the intake fields. Same design, thinner
surface; still a marketing-site-only change, made when implementation is
approved.

---

## 6. Post-Purchase Experience

The moment `payment succeeded` fires, the relationship inverts: stop selling,
start structuring. Every hour of post-payment silence converts excitement into
doubt.

### 6.1 The `/welcome` confirmation page (design spec)

- **Headline:** "You're in. Here's exactly what happens now."
- Payment confirmation line ("Receipt is on its way from Stripe").
- The same 4-step strip, with step 1 checked off — visual continuity from the
  promise they just bought.
- **One action:** Start the intake (button) — "takes about 10 minutes, and
  your build clock starts the moment you finish."
- Expectation line: "Prefer to do it later? The form link is in your email.
  Nothing is lost — but the build can't start until we have it."
- Founder sign-off: small Gary block with direct email — "a person, not a
  ticket queue."
- `noindex`. No nav distractions beyond the logo.

### 6.2 The confirmation email (draft)

> **Subject: Payment received — let's build your website**
>
> You're in. Here's the whole process from here:
>
> 1. ✅ Payment — done.
> 2. **Tell us about your business** → [Start the 10-minute form]
> 3. We build, you preview, we adjust.
> 4. You're live — with 30 days of included support.
>
> Your build starts the moment the form is done. Most owners finish it in
> about 10 minutes — and if you don't have a logo or photos, skip those
> questions; we'll handle it.
>
> Reply to this email any time. A person answers — usually me.
>
> — Gary Corriston, Website Support Studio (Corriston Consulting, LLC)

Send-from: the existing contact address; replies must reach a monitored inbox
(this is itself a trust feature — practice what the Missed Jobs Report
preaches).

### 6.3 The intake form (field spec — one page, ~10 minutes)

Grouped so the customer always knows why we're asking. Required fields are the
minimum buildable set; everything else is skippable with defaults.

**Your business (required):** business name · trade/services offered (checklist
+ free text) · phone number for the site · email for leads · service towns
(list, 3–8) · business hours · license number (optional, recommended).

**Your domain (required choice):** I have a domain (which?) / I need one
(we'll register it in *your* name — you own it) / not sure (we'll sort it on
a quick call).

**Your look (all skippable):** logo upload (or "no logo — use a clean text
treatment") · photo uploads, up to ~10 (or "no photos — use licensed stock
for my trade") · closest design: Ridgeline / Airflow / Mainline / "you pick."

**Words (skippable):** anything you definitely want said (free text) · top 3
services to feature · what makes you different (one line, optional).

**The old site (if any):** current URL · keep anything from it? · who controls
the domain login (helps us plan the cutover; old site stays up until launch).

Completion screen: "Done — your build has started. Expect a preview link by
[day]." (Date computed from the `PROPOSED` SLA.)

### 6.4 No-asset defaults (kills friction #2)

Published as policy so nobody stalls before buying *or* during intake:
no logo → professional text logotype in your colors; no photos → licensed
trade-appropriate photography; no copy → we write all five pages from your
intake answers (you review everything at preview); no domain → we register one
in your name, ~$15–20/yr registrar cost, you own it `PROPOSED: confirm domain
cost handling — absorbed vs. passed through`.

### 6.5 The first 7 days (the build week)

| Day | What happens | Customer sees |
|-----|--------------|---------------|
| 0 | Payment → `/welcome` → intake (ideally same day) | Confirmation email |
| 1 | We review intake; chase anything ambiguous **once, by email, with our best-guess default stated** ("we'll assume X unless you say otherwise") — missing answers never silently stop the build | "Build started" note |
| 2–4 | Build: adapt the chosen design — name, brand, copy, photos, services, towns, forms wired, click-to-call wired | (quiet — expectation set on day 1) |
| 5 | **Preview link** + short walkthrough note ("check your phone first — that's where your customers are") | Preview email |
| 5–6 | **One revision round** `PROPOSED` — customer sends a single consolidated list; we apply it. Additional rounds roll into the 30-day support window post-launch, which in practice gives them more total adjustment room, not less | Revised preview |
| 6–7 | Approval → launch prep: DNS/domain cutover, SSL, forms re-tested live, GA4 + Search Console set up **under their accounts** | "Launching" note |
| 7 | **Launch.** Launch email: live URL, the ownership packet (every login: domain, hosting access note, analytics — *theirs*), what the 30 days covers, and the support address | Launch email 🎉 |

`PROPOSED` SLA: **live within 7 business days of completed intake**, customer
delays excluded; if we miss it for reasons on our side, the customer can ask
for a full refund (§6.7). The clock-start rule makes this promise keepable.

### 6.6 Days 8–30: the included support window → operations enrollment

- **Day 8 check-in:** "Anything look wrong on any device? Tweaks are included
  for the next 3 weeks." (Also requests permission to use the launch as a
  before/after — the real-proof engine.)
- **Days 8–29:** fixes and small tweaks honored via the support address.
- **Day 21 — the enrollment moment** `PROPOSED`:
  > "Your included support ends on [date]. From there, the Operations plan
  > keeps your site updated, monitored, and fixed — **$199/month at the
  > founder rate for your first 6 months, then $399/month.** Optional. Cancel
  > anytime. Your website is yours either way. [Keep my site managed →]"
  Links to the existing pricing-page plan (existing subscription checkout —
  untouched). Mentioned once at launch, once at day 21, once at day 29. Three
  touches, no drip campaign.
- **Day 30:** window closes; final note either welcomes them to Operations or
  ends cleanly: "You're launched and you own everything. We're here when you
  need us." A clean ending is the referral engine.

### 6.7 Refund & revision policy `PROPOSED — needs founder approval`

- Full refund, no questions, **any time before the build starts** (intake
  incomplete or day-1 review not begun).
- **Launch guarantee:** if we fail to launch your approved site, full refund.
- After launch: no refunds (the deliverable is delivered) — the 30-day window
  handles dissatisfaction with specifics.
- One consolidated revision round at preview; further adjustments in the
  30-day window. Hard scope line stays the published customizable-vs-custom
  table.

---

## 7. The Founder FAQ — Top 25, Answered

Designed as a new `_founder_website` group in the existing `faqs.ts` system
(single source of truth, FAQPage schema on `/faqs` only — per the established
pattern). Answers state existing facts; `PROPOSED` markers inherit §6.7
pending approval and are removed/edited per Gary's decisions.

1. **What exactly do I get for $500?**
   A complete five-page website — home, services, service areas, about,
   contact — built for your trade, on your domain: mobile-optimized, contact
   forms wired to your inbox, click-to-call, basic SEO setup, hosting, SSL,
   launch, and 30 days of post-launch support. Everything in the includes
   list, nothing metered.

2. **Why is it only $500?**
   Because we're not starting from scratch — we've already designed and
   tested the websites we adapt to your business, so the build takes days,
   not months. And honestly: the $500 build is how we earn the chance to keep
   running your site month to month afterward. You get the site cheap; we get
   a customer worth keeping. Both of those are the plan.

3. **Is the $199/month required?**
   No. It's optional, it starts only if you choose it after launch, and you
   can cancel anytime. The website is yours either way.

4. **What happens right after I pay?**
   You land on a confirmation page and get an email with one link: a
   10-minute form about your business. The moment you finish it, your build
   starts. Pay → tell us about your business → we build → you're live.

5. **How long until my website is live?**
   About a week: we target launch within 7 business days of your completed
   intake form. `PROPOSED SLA` The clock starts at the form, not the payment,
   because we can't build before we know your business.

6. **What do I have to provide?**
   About 10 minutes of answers: business name, services, towns you serve,
   phone, hours, and — if you have them — your logo and photos. That's it.
   We do the rest.

7. **I don't have a logo or photos.**
   No problem, and no delay. No logo → a clean professional text treatment in
   your colors. No photos → licensed photography appropriate to your trade.
   You can swap in real photos later (that's a great use of the 30-day
   window).

8. **I already have a website. What happens to it?**
   It stays up until your new site is ready. We build the new one, you
   approve it, and we switch your domain over at launch — no gap where
   customers find nothing.

9. **I already have a domain. Do I keep it?**
   Yes — it stays in your name and your registrar account. We never take
   ownership of it. We'll guide the DNS pointing at launch (and your email on
   that domain is untouched).

10. **I don't have a domain.**
    We'll register one — in *your* name, owned by you from day one. Domains
    cost roughly $15–20/year at the registrar. `PROPOSED: confirm whether
    year one is absorbed or passed through`

11. **Do I actually own the website?**
    Yes. The website, the domain, the content, and every connected account —
    Google Analytics, Search Console, Business Profile — are set up under
    *your* accounts. You can revoke our access whenever you like. This is in
    our terms, in writing.

12. **What happens if I cancel the monthly plan?**
    Your website does not disappear. Cancelling stops the management service,
    not your site. You can migrate it, export it, or continue under a
    hosting-only arrangement — and we'll provide reasonable migration help if
    you ask. Also in the terms.

13. **Will my site look like a template? Like other customers' sites?**
    It starts from one of three designs we've built and proven for the
    trades, then gets your name, brand, colors, photos, services, towns, and
    words. Two roofers in different cities won't confuse anyone — and the
    structure underneath is shared because it's the structure that wins local
    customers.

14. **My trade isn't roofing, HVAC, or plumbing. Can I still buy?**
    Yes. The three designs are starting points, not boundaries — electricians,
    garage doors, landscaping, pest control, and most local service
    businesses fit naturally. Pick the closest design in the intake form (or
    let us pick).

15. **Can I see an example first?**
    Yes — walk through the live demo site(s) linked from the homepage.
    They're fully built, clickable demo companies: every page, form, and
    button works exactly like your site will.

16. **What's NOT included in the $500?**
    Online booking systems, e-commerce, customer portals, pages beyond the
    five, and custom integrations — those are quoted separately if you want
    them. The published "customizable vs. custom work" table is the exact
    line.

17. **Can I get more than 5 pages?**
    Yes — extra pages are quoted as custom work, or handled later through the
    monthly plan (service-area pages are a common addition). The five-page
    package is deliberately tight; that's what keeps it $500 and one week.

18. **Who writes the text?**
    We do, from your intake answers — built for your trade and your towns.
    You review every word at the preview and can change anything. If you love
    writing, the intake has a spot for anything you want said verbatim.

19. **Will I rank #1 on Google?**
    Nobody honest promises that. What's included: clean technical SEO, proper
    titles and descriptions, service-area pages, fast mobile-friendly pages,
    and Search Console + Analytics set up under your accounts so progress is
    measurable. Ongoing SEO work is what the monthly plan and separate
    engagements are for.

20. **What are service area pages and why do they matter?**
    A page for each town you serve. When someone in one of those towns
    searches "[your trade] near me" or "[trade] in [town]," these pages are
    what gives you a shot at showing up. They're the workhorse of local-
    service websites.

21. **Can I make changes after launch?**
    Yes — for the first 30 days, fixes and small tweaks are included. After
    that, changes go through the optional monthly plan, or you can edit it
    yourself / hire anyone you like. It's your website.

22. **What does the monthly plan actually do?**
    Operations: your requests (content changes, fixes, tracking, small
    updates) go into one desk, get done by an operator, and nothing ships
    without human approval — with a record of every change. $199/month for
    your first 6 months, then $399/month. Optional, cancel anytime.

23. **What if I don't like the design at preview?**
    You get a revision round before launch: send one consolidated list of
    changes and we apply it. `PROPOSED` Smaller adjustments keep flowing in
    the 30-day window after launch. And the design you saw in the demo is the
    design you get — there's no mystery reveal.

24. **What's the refund policy?**
    Full refund any time before the build starts. If we fail to launch your
    approved site, full refund. After launch, the 30-day support window
    handles fixes. `PROPOSED — pending founder approval`

25. **Who am I actually buying from? Is the payment safe?**
    Website Support Studio is operated by Corriston Consulting, LLC (Tampa,
    Florida), founded by Gary Corriston. Payment runs through Stripe's
    hosted checkout — we never see your card number — and you get a Stripe
    receipt immediately. Want a human first? Book 15 minutes; no pitch, just
    answers.

---

## 8. Final Recommendation

The funnel's shape is already right — one promise, one price, one click. What
this design adds is **the visible spine**: a prospect should be able to see
the entire path from click to launched website *before* paying, and feel the
path holding them *after* paying. Build order (all marketing-site/process
work; sequenced to respect current constraints):

1. **"What happens next" strip + trust sentence** beside every Founder CTA —
   copy-only, highest leverage per hour of work.
2. **Founder FAQ group** added to the existing `faqs.ts` system (§7), with
   the four `PROPOSED` policies resolved by Gary first: SLA (7 business days
   from intake), revision round (one consolidated), refund terms (§6.7),
   domain-cost handling.
3. **Intake form** built to §6.3 (marketing-site form, existing notify
   pipeline) and the **interim contact-page swap** for
   `source=founder-package-paid` arrivals.
4. **`/welcome` page** (§6.1) + confirmation/launch/day-21 email drafts —
   then, as its own approved one-line change later, the Stripe redirect
   target moves from `/contact` to `/welcome` (the only Stripe-adjacent item
   in this design; not done now).
5. **The enrollment moment** (§6.6) becomes the standard day-21 motion —
   the designed bridge that turns a $500 build into an active WSS customer.

One measure to watch from day one: **intake completion time** (payment →
completed form). It is the single best predictor of a healthy launch, and if
it averages more than ~48 hours, the intake is too heavy or the `/welcome`
page isn't doing its job.

The sentence to keep on the wall: **easy to buy because the path is short;
easy to trust because the path is visible.**
