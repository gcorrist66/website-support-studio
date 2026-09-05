# Founder Website Package — Trust & Conversion System

**Status:** Design only. Nothing deployed, pushed, or changed in production.
No Stripe, onboarding, or v2-foundation work.

**Series position:** third Founder Package design doc. The value redesign
(`FOUNDER_PACKAGE_VALUE_REDESIGN.md`) makes the product *desirable*; the sales
process (`FOUNDER_PACKAGE_SALES_PROCESS.md`) makes it *buyable*; this document
makes it *safe*. Where those docs defined strategy and process, this one
delivers the **final customer-facing copy** for every trust surface, ready to
place when implementation is approved.

**Policy dependencies:** four `PROPOSED` policies from the sales-process doc
(7-business-day launch SLA, one consolidated revision round, refund terms,
domain-cost handling) appear in final copy below. **Gary must approve them
before any of this text ships.** They are marked inline.

**Owner:** Corriston Consulting, LLC / Website Support Studio
**Date:** June 12, 2026

---

## 1. Executive Summary

The product is becoming real — a live demo, a gallery, working checkout. That
success creates the next problem: the better the demos look, the more the
price looks impossible, and *"why should I trust this?"* becomes the entire
remaining sale. An unknown company, a too-good price, and a direct payment
link is — pattern-wise — what a scam looks like. The prospect isn't wrong to
hesitate; the site simply hasn't given them the evidence to stop.

The system below is built on one rule: **every trust claim must be checkable.**
Not "we're trustworthy" but *here is the demo you can click, the rubric'd
process you can read, the legal entity you can look up, the terms section that
says you keep everything, the guarantee with its conditions stated, and the
founder's actual name and inbox.* Checkable claims compound; assurances don't.

It ships as seven copy-final assets: the ranked trust audit, the "Why only
$500?" honesty section, the "What happens next" experience, the Ownership
Story ("you own everything" made concrete enough to verify), the Launch
Promise (timeline + communication + revisions as commitments), and the
assembled Trust Stack — what goes where, in what order, on every surface from
homepage to launch email.

---

## 2. Trust Audit — every hesitation, ranked

Method: walk the buying moment as a skeptical owner with $500 and a bad prior
experience with a web guy. Severity = share of otherwise-ready buyers it
stops × how silently it kills (silent killers rank higher — nobody emails you
about a doubt; they just leave).

| Rank | Hesitation (in their words) | Type | Why it kills |
|------|----------------------------|------|--------------|
| 1 | "What's the catch?" / "Why only $500?" | Price disbelief | The flagship doubt. A finished-looking site for $500 violates their price map ($3–10K from agencies, $0 DIY). Unanswered, the brain fills the gap with "hidden fees," "hostage hosting," or "scam." |
| 2 | "What happens after I pay?" | Process opacity | Paying into silence. No visible step 2 = no purchase. The current post-payment landing (generic contact form) confirms the fear if they ever test it. |
| 3 | "Will they hold my website hostage?" | Ownership fear | Nearly every owner knows someone whose web guy owned the domain, the hosting, or the logins. This is the trade's deepest scar tissue — and our monthly plan *sounds* like the setup for it. |
| 4 | "Who are these people?" | Identity opacity | No faces, no address, no story = no accountability. A $500 mistake with nobody to call. |
| 5 | "What if I hate it?" | Outcome risk | No visible revision/refund path means the $500 feels like a bet on taste. |
| 6 | "I don't have a logo / photos / words" | Effort & eligibility anxiety | Reads as disqualification: "I'm not ready to buy this yet." They leave planning to return after they 'get organized' — which is never. |
| 7 | "The monthly is the real trap" | Subscription fear | $199 → $399 reads as bait-and-escalate unless the optionality and the cancel-and-keep-everything terms are loud. |
| 8 | "Is my $500 even safe?" | Payment fear | Card-on-an-unknown-site anxiety. Mostly solved by Stripe's hosted page — but only if they get there; the fear acts *before* the click. |
| 9 | "When will it actually be live?" | Timeline vagueness | "Soon" from a contractor's web vendor has burned everyone. No date = no urgency = no decision. |
| 10 | "Will it look like a cookie-cutter template?" | Differentiation doubt | Softened by the demos; fully answered by the customizable list + "two roofers in different cities" framing. |
| 11 | "My trade isn't shown" | Fit doubt | Three demos read as three eligible trades unless the page says otherwise. |
| 12 | "What about my current site / domain / email mid-switch?" | Transition fear | Owners fear the gap: a weekend where calls go nowhere. One unanswered question about email on the domain can stall the whole purchase. |
| 13 | "No reviews anywhere" | Social-proof absence | Real, but weakest of the majors — checkable evidence (demos, process, identity, terms) substitutes until real launches generate real proof. Honesty about newness beats silence. |
| 14 | "Why is there pressure?" (spots counter, etc.) | Manipulation alarm | Scarcity from a stranger reads as a tactic. The founder counter is real — but it must be explained or it costs more trust than it creates urgency. |
| 15 | "It's $500 — but is it $500 of *my time* too?" | Hidden-cost suspicion | Time is the second currency. "About two hours total" must be stated, not implied. |

Top-3 takeaway: the audit's heaviest items (#1–#3) are all answered by
*honesty assets* — the price explanation, the visible process, and the
ownership story. That's where the copy effort goes.

---

## 3. Trust Builders — the assets, ranked by hesitations killed

| Rank | Asset | Kills # | Status |
|------|-------|---------|--------|
| 1 | **"Why only $500?" section** (§4) | 1, 7, 14 | Copy final below |
| 2 | **"What happens next" experience** (§5) | 2, 9, 15, 6 | Copy final below |
| 3 | **Ownership Story** (§6) | 3, 7, 12 | Copy final below |
| 4 | **Launch Promise** (§7) | 5, 9, 2 | Copy final below (3 `PROPOSED` policies) |
| 5 | **Live demo sites** | 10, 11, 13 partially | Exists (Ridgeline); others in flight — referenced, not designed here |
| 6 | **Founder identity block** (§8.2) | 4, 13 | Copy final below |
| 7 | **Founder FAQ (25 Q&A)** | catch-all | Already written — sales-process doc §7 |
| 8 | **No-asset defaults** ("don't have a logo?") | 6 | Policy in sales-process doc §6.4; surfaced in §5 copy here |
| 9 | **Real-proof engine** (permissioned before/afters from actual launches) | 13, over time | Day-30 ask designed in sales-process doc; placeholder rules below |

Deliberately absent, restated: fake testimonials, fake counters, "as seen in"
logos, countdown timers. One real scarcity exists (founder operations rate,
17 of 25) and it gets one explaining sentence wherever it appears: *"Founder
pricing is limited to our first 25 operations customers because their
feedback shapes the service — that's the whole reason."*

---

## 4. "Why Only $500?" — the honesty section (copy final)

Placement: homepage, directly under the gallery/offer section; reused on
`/templates` and as FAQ #2. Format: kicker + headline + three short
paragraphs. No bullets — this one should read like a person talking.

> `_why_only_$500`
>
> **The honest answer to the question you're already asking.**
>
> Most web designers start every project from a blank page — that's why they
> charge $3,000 to $10,000 and take two months. We don't start from blank. We
> spent the time and money up front designing and testing websites built
> specifically for the trades, and we adapt one to your business: your name,
> your colors, your photos, your services, your towns. What's left is days of
> work, not months. That's the first half of the answer.
>
> The second half: the $500 build is how we earn the right to keep your
> website running afterward — $199 a month for your first six months, $399
> after, *if you want it.* It's optional, you can cancel anytime, and the
> website is yours either way. We're betting that if we build you something
> good and treat you straight, you'll stay. That bet is the business model.
>
> So there's no catch — there's a structure. You get an agency-quality
> website for the price of a service call. We get the chance to prove we're
> worth keeping. Everyone's incentives point the same direction.

Why this works: it names the suspicion before they voice it, gives a
*mechanism* (pre-built designs) rather than an assurance, and discloses our
self-interest — disclosed self-interest is the most believable sentence a
seller can utter. It also quietly answers #7 (the monthly "trap") inside the
price answer, where the suspicion actually lives.

---

## 5. "What Happens Next?" — the customer-facing experience (copy final)

The internal process (clock rules, chase rules, SLAs) lives in the
sales-process doc. This is the **customer-facing version** — one asset,
rendered three ways: a strip beside CTAs, a full section on the homepage and
`/templates`, and the skeleton of the `/welcome` page.

### 5.1 The full section

> `_what_happens_next`
>
> **From "buy" to "live" — the whole path, up front.**
>
> **1 · Pay — about a minute.**
> Secure Stripe checkout (card, Apple Pay, Google Pay). You get a receipt
> immediately, and the next page tells you exactly what happens now. No
> sales call, no quote, no waiting to hear back.
>
> **2 · Tell us about your business — about 10 minutes.**
> One form: your name, services, towns, phone, hours — plus your logo and
> photos *if you have them*. **Don't have a logo? We'll design a clean text
> version. No photos? We'll use licensed shots from your trade. No words?
> We write every page for you.** Nothing about being "not ready" can stop
> this build.
>
> **3 · We build — days, not months.**
> Your site takes shape from the design you picked. Within days you get a
> private preview link — look at it on your phone first; that's where your
> customers will see it. Want changes? Send us your list and we'll make
> them. `PROPOSED: one consolidated revision round`
>
> **4 · You're live — about a week in, with a month of backup.**
> We launch on your domain — yours stays yours, and if you don't have one
> we register it *in your name*. Then you get 30 days of included fixes and
> tweaks, because real feedback starts when real customers start looking.
>
> *Target: live within 7 business days of finishing step 2.* `PROPOSED SLA`
> *Total time you'll spend: about two hours, start to finish.*

### 5.2 The CTA strip (compressed version, beside every Founder CTA)

> **Pay ($500, one-time)** → **10-min form** → **We build & you preview** →
> **Live in about a week** — then 30 days of included support.
> *You own everything. The monthly plan afterward is optional. Cancel anytime.*

### 5.3 The `/welcome` page (post-payment, headline + structure)

> **You're in. Here's exactly what happens now.**
> ✅ 1 · Payment — done. (Stripe receipt is on its way.)
> **→ 2 · Tell us about your business** — [Start the 10-minute form]
> Your build starts the moment the form is finished — that's what starts the
> clock on your launch week.
> 3 · We build, you preview, we adjust.
> 4 · You're live, with 30 days of included support.
>
> *Questions at any point? Reply to your confirmation email. A person
> answers — usually Gary.*

The continuity is the trick: the prospect sees the same four steps before
buying, at purchase, and after paying — with checkmarks appearing. A promise
that visibly converts into progress is the fastest trust loop available to a
company with no reviews yet.

---

## 6. The Ownership Story (copy final)

"You own everything" is currently a slogan. Owners have heard slogans before —
from the last guy, right up until the domain renewal came due. The fix is to
make the claim **concrete, itemized, and checkable.**

Placement: homepage section; pricing page; FAQ #11–12; *restated in the
launch email* where it stops being words (§7). Headline keeps the existing
brand line; the body does the new work.

> `_you_own_everything`
>
> **You own everything. Here's what that actually means.**
>
> - **Your domain** is registered in *your* name, in *your* registrar
>   account. Not ours. If we register it for you, it's yours from day one.
> - **Your website** — the design, the pages, the words, the photos — is
>   yours. Cancel anything, keep all of it.
> - **Your accounts** — Google Analytics, Search Console, your Google
>   Business Profile — are created *under your logins*, not ours. You can
>   revoke our access with a click, any day, no conversation required.
> - **Your leads** go to your inbox and your phone. They never pass through
>   anything you don't control.
> - **Leaving is allowed.** If you cancel the monthly plan, your website does
>   not disappear and nothing is held back: take it anywhere, export
>   everything, or keep it where it is under a simple hosting arrangement —
>   and we'll help you migrate if you ask. It's in our Terms, in writing —
>   not just on this page. [Read the ownership section of our Terms →]
>
> We built it this way on purpose. Every contractor has heard the story
> about the web guy who owned the domain. We'd rather be easy to leave —
> it keeps us honest about being worth staying for.

Then it gets **performed, not just stated**: at launch, the customer receives
the **Ownership Packet** — a one-page document listing every asset and login
that belongs to them (domain + registrar, site URL, analytics, Search Console,
GBP, where leads go), each marked "OWNER: YOU." The packet turns the page's
biggest claim into a physical artifact in their inbox — and it becomes the
single most forwardable trust asset we have ("look what they sent me").

---

## 7. The Launch Promise (copy final — all three commitments `PROPOSED`)

What a customer may reasonably expect, stated as commitments with their
conditions visible. Vague generosity ("we'll take care of you!") builds less
trust than precise promises with edges.

> `_the_launch_promise`
>
> **Three promises, in plain terms.**
>
> **1 · The timeline promise.** Your website goes live within **7 business
> days** of you finishing the intake form. (The clock starts at the form,
> not the payment — we can't build before we know your business.) If the
> delay is ours, you can take a full refund instead of waiting. `PROPOSED`
>
> **2 · The communication promise.** You will never wonder what's happening.
> You'll hear from us when the build starts, when your preview is ready,
> when we're launching, and when you're live — and if we ever need an answer
> from you, we'll ask once, tell you what we'll assume if we don't hear
> back, and keep building. Replies go to a person, not a ticket robot.
>
> **3 · The revision promise.** When your preview arrives, send one list of
> everything you want changed — we'll make those changes before launch.
> After launch, you get 30 days of included fixes and tweaks while real
> customers give you real feedback. `PROPOSED` And until your build starts,
> you can change your mind entirely: full refund, no questions. `PROPOSED`
>
> What we don't promise: that you'll rank #1 on Google (nobody honest does),
> or custom features beyond the package (booking systems, e-commerce,
> portals — quoted separately, before any work starts, always).

The anti-promises paragraph is load-bearing: a seller who names the limits of
the deal is presumed honest about the rest of it. It also pre-empts the two
most common post-sale disputes (rankings and scope).

---

## 8. The Founder Trust Stack — assembly and placement

### 8.1 The stack (order matters — it mirrors the order doubts arise)

| Layer | Asset | Primary surfaces |
|-------|-------|------------------|
| **Proof** | Live demo site(s) · the visible 4-step process · real before/afters as launches permit (never faked; section renders the demo + process until then) | Homepage top half, `/templates` |
| **Price honesty** | "Why only $500?" (§4) | Homepage below offer; FAQ #2 |
| **Expectations** | "What happens next" (§5) · time cost ("about two hours total") | Beside every CTA (strip); full section once per page; `/welcome` |
| **Ownership** | Ownership Story (§6) · Terms ownership section link · Ownership Packet at launch | Homepage; pricing; launch email |
| **Guarantees** | Launch Promise (§7): SLA + refund-before-build + launch guarantee + revision round (all `PROPOSED`) | Under primary CTA (one line); full block on `/templates`; FAQ |
| **Identity** | Founder block (§8.2) · legal entity, Tampa FL · direct email · booking link | About; footer; FAQ tail; every email signature |
| **FAQ** | The 25-question Founder FAQ (sales-process doc §7) | `/faqs` `_founder_website` group; linked from every section above |

### 8.2 Founder identity block (copy final)

> **Who's behind this?**
> Website Support Studio is run by **Gary Corriston** — Corriston
> Consulting, LLC, Tampa, Florida. Not a marketplace, not an offshore
> production line: a small operation that builds trade websites with a
> documented process and keeps them running. Email Gary directly at
> [contact email], or book 15 minutes — no pitch, just answers, before you
> spend a dollar. [booking link]

### 8.3 Per-surface placement map

- **Homepage:** hero (price + ownership sentence) → demos/gallery (Codex's
  surface) → CTA + strip + guarantee line → "Why only $500?" → "What happens
  next" full → Ownership Story → founder block → FAQ link.
- **`/templates`:** demos → CTA + strip → Launch Promise full → customizable
  vs. custom (exists) → FAQ link.
- **Pricing:** founder card (exists) → ownership story compact → monthly
  optionality sentence → FAQ link.
- **`/welcome` + emails:** the 4 steps with progress → promises restated at
  the moment each becomes relevant → Ownership Packet at launch.

The stack's rhythm on every surface is the same: **show → explain → promise →
sign it.** Proof first, honesty second, commitments third, a human name last.

---

## 9. Final Recommendation

Ship the trust system as copy the moment the four `PROPOSED` policies get
Gary's sign-off — SLA (7 business days from intake), revision round (one
consolidated), refund terms (full refund pre-build; launch guarantee), and
domain-cost handling. Every other element states facts that are already true,
which is exactly why this system can be built now: **the product's honesty is
already real; the site just hasn't said it out loud yet.**

Priority if building incrementally: §4 ("Why only $500?") and the §5.2 CTA
strip first — they sit at the two highest-severity hesitations and are pure
copy. Then the Ownership Story, then the Launch Promise (post-approval), then
the `/welcome` continuity, then the Ownership Packet template.

Two tests before anything ships:

1. **The skeptic test:** show the homepage to someone primed with "this is
   probably a scam" and ask them to find the catch. If they end at "the catch
   is they want the monthly" — that's a pass; it's the disclosed,
   designed answer.
2. **The checkability test:** for every trust sentence on the page, ask
   "can the reader verify this right now?" Demo → click it. Ownership →
   Terms link. Identity → look up the LLC, email the founder. Process →
   the steps with dates. Any sentence that can't be checked gets rewritten
   until it can — or cut.

The wall sentence for this layer: **assurances ask to be believed; evidence
asks to be checked. Only one of them converts a skeptic.**
