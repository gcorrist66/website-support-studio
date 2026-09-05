# Client Admin Panel — Design for Founder Website Package Customers

**Status:** Design only. Nothing deployed, pushed, or changed in production.
No Stripe, onboarding, or v2-foundation work. This document designs *on top
of* the existing customer workspace and operator console — it does not modify
them.

**Existing infrastructure this design builds on (verified in repo):**
- Customer workspace at `app.websitesupportstudio.com`: profile, request
  submission with attachments, feedback categories (feedback / feature
  request / bug report / other), capacity summary, plan/billing card
- Request lifecycle: `received → triaged → reply_drafted → approved_to_send
  → delivered → closed`, with an expedited path
- Operator console: board/queue, feedback surface, project access
- Marketing-site contact-notification edge function (the form→email pattern)

**Genuinely new in this design:** the Lead Inbox, the Testimonial Approval
flow, the Upgrade Shelf, and the packaging of all of it as a named, included
deliverable of the $500 Founder Website Package.

**Owner:** Corriston Consulting, LLC / Website Support Studio
**Date:** June 12, 2026

---

## 1. Executive Summary

Today a Founder Website customer receives a public website. This design adds
the second half of the product: **every WSS-built website ships with a small
back office** — one place where the owner sees their leads arrive, asks for
changes, approves testimonials, and understands their plan. Customer-facing
name: **"Your Website's Back Office"** `PROPOSED — naming options in §2`. It
is the existing customer workspace, extended with three new modules and
packaged as a headline deliverable rather than a hidden utility.

Strategically, the panel converts a one-time sale into a managed
relationship, because it is **where the website's value becomes visible**.
A website's wins are invisible by default — calls just ring, forms just
arrive. The panel is where the owner *sees* "11 leads this month, 4 changes
made, your form was tested on the 12th." That visibility is what makes
$199/month feel obviously worth keeping, makes upgrades discoverable without
being pushy, and gives every future product (Operations summaries, Missed
Jobs Report deliveries) a place to live.

MVP discipline: ship the **Lead Inbox** (the only module the owner will check
weekly), re-label the existing request system in owner language, and show a
read-only plan card with a static upgrade shelf. The testimonial flow follows
once operator tooling exists. Nothing resembling a CMS, analytics suite, or
chat gets built.

---

## 2. Definition

### What is it?

A lightweight client portal included with every Founder Website: log in and
see **Leads** (every form submission from your website), **Requests** (ask
for changes; see status), **Testimonials** (approve what goes on your site),
**Your Plan** (what you pay, what's included, where you stand), and
**Add-ons** (what else we can do). Five sections, no manuals.

It is explicitly **not** a website editor. The customer never edits the site
directly — that's the WSS model (operator-done, human-approved). The panel is
where they *direct* and *observe* the work, not perform it.

**Naming** `PROPOSED`: customer-facing label options — "Your Back Office"
(recommended: owner language, implies business value), "My Website HQ,"
or plain "Your Account." Avoid "admin panel," "portal," "dashboard"
(software words). The marketing bullet becomes: *"Includes your own back
office — see every lead, request changes, and watch the work happen."*

### Who uses it?

The owner (or office manager) of a Founder Website customer — the same person
answering the phone. Design constraints that follow: phone-first layout,
zero training, one idea per screen, email notifications carry the urgent
things so the panel never *has* to be checked.

### What problem does it solve?

- **For the customer:** "Where did that lead go?" / "Did they ever fix that
  thing I mentioned?" / "What am I paying for?" — one place answers all
  three. It also replaces the lead anxiety of forms-going-to-spam with a
  permanent, visible record.
- **For WSS:** the website stops being a deliverable that leaves home. Every
  lead arriving in *our* panel, every request flowing through *our* desk, is
  the relationship operating. Retention stops depending on memory of a good
  build and starts depending on visible, current value.

### How does it support retention?

1. **Habit loop:** leads are checked weekly → the panel is visited weekly →
   the plan's value is witnessed weekly. (This is why the Lead Inbox must be
   the best thing in it.)
2. **Visible work:** request statuses and the future What-We-Did summary
   make the monthly fee concrete.
3. **The step-up moment survives:** at month 8 ($199→$399), the owner is
   looking at a screen full of delivered leads and completed requests — the
   renewal argument makes itself.
4. **Upgrades live where trust lives** — offered on a shelf inside a tool
   that's already proving value, not in cold emails.

---

## 3. Core Sections

| Section | Purpose | Data shown | Customer actions | Operator actions | Future expansion |
|---|---|---|---|---|---|
| **Leads** | Every website form submission, permanently | Lead list: name, contact, message, source page, time, status, new/read | Read, mark status, click-to-call/email, add a note | None routinely (§9 privacy posture); monitor delivery health | Call-tracking entries, lead source labels, simple counts ("12 this month vs 8 last") |
| **Requests** | Ask for website changes; see them happen | Open + recent requests, owner-language status, attachments, replies | Submit (4 types §5), attach files, reply, confirm done | Full existing lifecycle on the operator board | Becomes the Operations surface; What-We-Did summaries render here |
| **Feedback / Features / Bugs** | Existing categories, folded INTO Requests (§5) — one composer, not three menus | (within Requests) | (within Requests) | Triage by type tag | Feature-request voting if volume ever justifies it |
| **Testimonials** | Owner-approved words for their site | Drafts awaiting approval, approved, published | Approve / edit / reject; submit raw feedback when asked | Request reviews, draft testimonials, publish approved ones via normal request flow | Google-review routing ("also post this to Google?") |
| **Your Plan** | What I pay, what I get, where I stand | Plan name, rate, founder-rate timeline, included list, status, support level, allowance summary | Read; "talk to us about my plan" link | Keep plan facts accurate | Invoices list (display-only), Operations allowance meter |
| **Add-ons** | Discoverable next steps, zero pressure | Shelf of 6–7 cards (§8) | "Tell me more" → creates an inquiry request | Receive inquiry, respond with quote/scoping | Per-customer relevance (e.g., MJR card appears when lead volume looks weak) `PROPOSED` |

Navigation: five items max. Leads is the default landing tab — it's the one
they came for.

---

## 4. Lead Inbox (the flagship module)

### Flow

Website form submitted → stored as a lead record (per site, per customer) →
**email/SMS notification to the owner immediately** (the panel is the record,
never the bottleneck — leads must not depend on anyone logging in) → appears
in Lead Inbox as **NEW**.

The existing marketing pattern (form → edge function → email) extends to
form → edge function → **lead record + email**. Design note: this is the
panel's only new data pipeline and the most valuable; it also makes WSS's
own promise self-demonstrating ("forms that land in your inbox in seconds" —
now with a receipt).

### Lead record

| Field | Detail |
|---|---|
| Status dot | **NEW** (unread) / read — bold row until opened |
| Name | From form |
| Contact | Phone (tap-to-call on mobile) and/or email (tap-to-email) |
| Message | Full text, untruncated on open |
| Source page | Which page the form was on — "Service Areas: Arvada," "Contact" — owners learn what's working without an analytics lesson |
| Timestamp | "Today 2:14pm" style, exact on hover |
| Status | One tap: **New → Replied → Booked → Closed** `PROPOSED` |
| Note | One free-text line ("quoted $8,400, call back Tues") |

### Status design rationale

Four statuses, owner vocabulary, optional to use. **Booked** is the one that
matters: it's the customer self-reporting revenue attributable to the
website — the single most valuable retention data point WSS can possess
("your website booked 9 jobs this quarter" at renewal time), and a quiet
on-ramp to Missed Jobs Report thinking (a pile of NEW leads older than a day
*is* a speed-to-lead finding).

### Empty state

"No leads yet — your forms are wired and tested. When someone submits, it
lands here and in your email within seconds." (Tested = the §Operations
monthly form test once subscribed; the empty state never blames, never nags.)

---

## 5. Request System (feedback / feature / bug / content update)

**Reuse, don't rebuild:** the existing composer already supports categories
and attachments. Design changes are packaging:

1. **One entry point** — a single big button: **"Ask us for something"** —
   then four owner-language types:
   - **Change my website** (content update — new photos, hours, copy, pages)
     ← new category, will be ~80% of volume
   - **Something's broken** (bug report)
   - **An idea / something I want** (feature request)
   - **General feedback** (feedback)
2. **Customer-facing statuses** — the six-stage internal lifecycle stays for
   operators; customers see four words `PROPOSED`:

   | Customer sees | Maps to internal |
   |---|---|
   | **Received** | received, triaged |
   | **In progress** | reply_drafted, in build |
   | **Waiting on you** | approval/input needed from customer |
   | **Done** | delivered, closed |

   "Waiting on you" is the operationally critical one — it must be loud
   (email + top-of-panel banner), because stalled-on-customer requests are
   where service perception dies silently.
3. **Done means shown:** completion notes include what changed and a link to
   see it live — proof over prose, one line.

Non-subscribers (Founder build + 30 days, then lapsed) keep panel access with
Leads + Testimonials + Plan visible; submitting a "Change my website" request
routes to a gentle gate: "Changes are part of the Operations plan — $199/mo
founder rate. This request is saved; want us to start?" `PROPOSED — lapsed-
customer access policy needs founder decision`

---

## 6. Testimonial Approval Flow

The trust rule (no fabricated praise, ever) gets infrastructure:

1. **WSS asks** — day-8 or day-30 touchpoint (already designed in the sales
   process): "How did the build go? Tell us in a sentence or two."
2. **Customer submits** raw words (panel form or simply replying to the
   email — operators can paste it in; never make the owner do software).
3. **WSS drafts** — operator tidies the raw words into a publishable
   testimonial (grammar, brevity — never meaning) and stages it.
4. **Customer decides** — panel card shows the draft beside their original
   words: **Approve** / **Edit** (inline, their edit becomes final) /
   **Reject** (one tap, no guilt copy).
5. **Approved → published** — flagged for placement; the actual site change
   ships through the normal operator request flow (human-approved like
   everything else). Customer sees "Live on your site →" when placed.

Statuses: `invited → submitted → drafted → awaiting_approval →
approved / rejected → published`.

Rules that keep it honest: only the customer's approved words appear,
attribution exactly as they approve it (name/business/town), revocable
anytime ("remove this" = one request), and WSS may reuse approved
testimonials on websitesupportstudio.com **only with a separate explicit
checkbox** at approval time — pre-checked nothing. `PROPOSED`

This flow also quietly builds WSS's own proof engine: every approved
testimonial with the second checkbox ticked becomes the real social proof the
marketing site has been honestly waiting for.

---

## 7. Plan & Billing View (read-only — no payment changes designed)

One card, five facts, zero surprises:

- **Plan:** "Founder Website + Operations (founder rate)" or "Founder
  Website — support window" or "Founder Website — no active plan"
- **Rate + timeline:** "$199/month — months 2–7 · standard $399/month starts
  March 2027" — the step-up date *always visible from day one* (extends the
  existing founder-timing reminder mechanism; surprise is the enemy)
- **What's included:** the owner-language deliverables list (per the
  Operations product doc) — requests allowance phrasing, monthly form test,
  monitoring, summary
- **Status:** Active / Support window (ends [date]) / Inactive — with the
  ownership sentence beneath: *"Cancelling stops the service, not your
  website. Everything stays yours."*
- **Support level:** what response to expect (next-business-day
  acknowledgment; urgent path exists) — set honestly, not aspirationally

Actions: exactly one — "Questions about your plan? Talk to us" (request
composer, pre-tagged). No self-serve plan changes, no cancel button, no
payment editing in this design (explicitly out of scope; the existing
checkout and any future self-serve billing are separate, approved work).

---

## 8. Upgrade System (the shelf, not the popup)

Design principle: **a shelf in their building, not a salesman at their
door.** Upgrade cards are always findable, never interruptive — no modals, no
banners on the Leads tab, no countdowns. The panel's credibility is worth
more than any single upsell.

The shelf (one card each — name, one outcome line, "from" price or "we'll
quote it," one button: *Tell me more*):

| Card | One-liner | Routes to |
|---|---|---|
| **More pages** | "New service or new town? Add pages that get found." | Quote request |
| **SEO package** | "Get found in more of the towns you serve." | Quote request |
| **Blog / content** | "Monthly articles that answer what your customers search." | Quote request |
| **Photo gallery** | "Your real jobs, front and center." | Quote request |
| **Missed Jobs Report** | "Find out where you're losing jobs — with proof. $750." | Existing MJR path |
| **Website Operations** | "Your website, handled monthly. From $199." | Existing plan path (hidden if already subscribed) |
| **Priority support** | "Front of the line, faster turnarounds." `PROPOSED — service tier must be defined before this card exists` | Quote request |

"Tell me more" creates a pre-tagged inquiry request — a conversation, not a
checkout (no Stripe surface here by design and by constraint). Future
`PROPOSED`: light relevance rules (MJR card rises when leads are sparse;
gallery card rises when they send lots of photos) — additive ordering only,
never popups.

---

## 9. Relationship to the Operator Console

One desk stays one desk. Every customer action lands as typed work — nothing
new to learn operator-side, just new types flowing into the existing board:

```
Customer action            → Operator console                  → Customer sees
─────────────────────────────────────────────────────────────────────────────
Change-my-website request  → queue item (content_update tag)   → Received → In progress → Done + "see it live"
Bug report                 → queue item (bug tag, urgency tri- → same, expedited path if urgent
                             aged per existing flow)
Feature idea / feedback    → queue item (existing categories)  → acknowledged; honest "logged" state allowed
Testimonial approval       → publish task (request flow)       → "Live on your site →"
Add-on inquiry             → quote task (pre-tagged)           → reply conversation
Lead arrives               → NOT a queue item                  → email + inbox (leads are the customer's
                                                                  work, not WSS work)
```

**Lead privacy posture** `PROPOSED`: operators see lead *delivery health*
(counts, last-delivered timestamp, failure alerts) by default — not lead
contents. Contents are accessible for support/debugging under the existing
access-controlled, recorded model. The pitch line it enables: "your leads go
to you, not through us" — consistent with the ownership story.

Notifications close every loop: customer acts → operator notified; operator
resolves → customer notified ("done" note + link). The existing
approval-gate-and-record discipline applies unchanged to anything that
touches a live site.

---

## 10. MVP Scope

### Ships first (MVP — "the panel exists and earns weekly visits")

1. **Lead Inbox** — form→record pipeline, email notification unchanged,
   new/read, source page, statuses, tap-to-call. The whole MVP justifies
   itself here.
2. **Request system re-skin** — "Ask us for something," the four types
   (content update added), four customer-facing statuses, "Waiting on you"
   alerts. (Composer, attachments, lifecycle: already built.)
3. **Plan card** — extend the existing billing card with step-up date,
   included list, ownership sentence.
4. **Static Add-ons shelf** — six cards, inquiry routing. (Priority-support
   card waits for its tier definition.)

### Waits (v1.1+)

- Testimonial flow (needs the operator drafting/staging surface)
- What-We-Did summary rendering in-panel (ships with Operations product work)
- Lead counts/trends; add-on relevance ordering; invoice display
- Lapsed-customer gating polish (policy decision first)

### Not built (deliberately, this cycle and probably ever)

- **Website editing of any kind** — breaks the operator/approval model that
  *is* the product
- Analytics dashboards (GA4 exists and is theirs; a worse copy of it helps
  no one)
- Live chat, mobile app, multi-user roles/permissions
- Self-serve billing/cancellation surfaces (separate, Stripe-adjacent work —
  out of bounds and out of scope)
- Anything requiring onboarding or v2-foundation changes

### Decisions needed from Gary

Panel name; lead statuses (the four proposed); lapsed-customer access policy;
lead privacy posture; testimonial marketing-reuse checkbox; customer-facing
status labels.

---

## 11. Final Recommendation

Build the panel as **packaging plus one pipeline**: the customer workspace
already does requests well, so the MVP's only substantial new engineering is
the Lead Inbox — and that's correct, because leads are the only thing an
owner checks weekly without being asked. Name it like a business asset
("Your Back Office"), put it in the Founder Package's included list the day
it ships (*"see every lead, request changes, watch the work happen"*), and
let the marketing claim and the product be the same thing — the panel is the
ownership story, the visible process, and the trust system, rendered as
software the customer touches.

Sequence: Lead Inbox → request re-skin → plan card → shelf → (v1.1)
testimonials. Measure one thing first: **weekly active owners** — if owners
aren't returning weekly for leads, fix that before adding anything else,
because every future product in the ladder (Operations summaries, MJR
delivery, upgrades) assumes the habit exists.

The wall sentence: **a website's value is invisible by default — the back
office is where the customer watches it work, and watching is what retains.**
