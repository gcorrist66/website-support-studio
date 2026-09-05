# Corriston Consulting — Outreach Sequences (ready to load in Apollo)

Merge fields: `{{first_name}}`, `{{company}}`. Keep sends low/personalized. All written short for cold deliverability. Pick one subject (A/B the top two).

---

## Sequence 1 — WARM reconnect · Peer / Partner
*For the ~13 martech/agency founders in `owners-enriched.csv` tagged `Partner`. Goal: reconnect + referral/collab, NOT a pitch.*

**Subjects:** "been a minute, {{first_name}}" · "{{company}} + a quick idea"

**Email 1 (day 0)**
> Hey {{first_name}} — we connected on LinkedIn a while back and I wanted to actually reach out instead of letting it sit.
>
> I've been heads-down at Corriston building AI marketing systems for clients — and I keep running into work that's a better fit for what you're doing at {{company}} than for me. Figured it's worth comparing notes.
>
> Not pitching you anything — genuinely wondering if there's a referral or collab angle since we're playing in adjacent sandboxes. Open to a quick 15 min?

**Email 2 (day +4)**
> Quick follow-up, {{first_name}} — concretely, I've got clients who need {{company}}-type help and vice versa. A simple referral loop could be worth real money to both of us. Worth a short call?

**Email 3 (day +6, breakup)**
> I'll leave it here so I'm not cluttering your inbox — but the door's open anytime. If a referral ever makes sense, I'm easy to find. Good luck with {{company}}.

---

## Sequence 2 — WARM reconnect · Soft-buyer
*For real operators in the warm list tagged `B`. Goal: reconnect → light build offer.*

**Subjects:** "{{first_name}} — reconnecting + a thought on {{company}}" · "what I'd automate at {{company}}"

**Email 1 (day 0)**
> Hey {{first_name}} — been a while since we connected, and I wanted to reach out properly.
>
> What I do now: I build AI systems that take the repetitive grunt work off marketing teams — basically an assistant that never sleeps, never gets sick, and doesn't drop the ball at 11pm. You stay in control; it just handles the boring 20% that eats everyone's week.
>
> If there's a repetitive thing chewing up hours at {{company}}, I'd happily show you exactly what I'd build to kill it — no pitch, just a useful look. Worth 15 min?

**Email 2 (day +4)**
> Following up, {{first_name}} — one example: a client was losing ~6 hrs/week to manual reporting; we replaced it with a bounded AI workflow they approve in one click. Curious what your equivalent time-sink is at {{company}}.

**Email 3 (day +6, breakup)**
> Last one from me — if now's not the time, no worries at all. Whenever you want a second set of eyes on what AI could take off your plate, just reply. Good seeing your name pop up again.

---

## Sequence 3 — COLD net-new · Track B "assistant that never sleeps"
*For sourced e-comm / SaaS / operator buyers (Apollo). Goal: 20-min "what should we build you" teardown → Project.*

**Subjects:** "an assistant for {{company}} that never sleeps" · "{{first_name}}, the boring 20% of your week"

**Email 1 (day 0)**
> {{first_name}} — quick one. Most {{company}}-size teams lose a chunk of every week to the same repetitive marketing tasks: reporting, list cleanup, follow-ups, content reformatting.
>
> I build bounded AI assistants that do exactly that work — you approve everything, nothing runs wild. Think tireless teammate, not a black box.
>
> If you give me 20 minutes, I'll point at one repetitive thing in your week and tell you precisely what I'd build to take it off your plate. Worth a look?

**Email 2 (day +3)**
> {{first_name}} — the teams pulling ahead right now aren't the ones with the fanciest AI, they're the ones who quietly automated the grunt work first. Happy to show you where {{company}}'s easiest win is. 20 min?

**Email 3 (day +6, breakup)**
> I'll stop here, {{first_name}}. If "an assistant that never sleeps" ever sounds useful for {{company}}, reply and I'll bring one concrete build idea to the call. Either way, good luck.

---

## Sequence 4 — COLD net-new · Track A "AI, on a leash" (healthcare/regulated)
*For sourced healthcare practice owners/admins (Apollo). Goal: free AI-Readiness Audit → paid Audit.*

**Subjects:** "AI at {{company}} — but on a leash" · "before you let AI near patient marketing"

**Email 1 (day 0)**
> {{first_name}} — AI isn't scary for a practice like {{company}}; it just needs a leash. The risk isn't using it, it's letting it touch patient marketing before your tracking and guardrails are sound.
>
> I run a short **AI-Readiness check** for practices: where AI can safely save you time, where it can't yet, and what to fix first. We did the same attribution work for a healthcare client and found tracked revenue they were completely missing.
>
> Want me to run the check for {{company}}? Free, ~15 minutes of your time.

**Email 2 (day +4)**
> {{first_name}} — the practices getting AI wrong are the ones who skipped the measurement step. The check just makes sure {{company}} isn't one of them. Happy to send findings even if we never work together.

**Email 3 (day +6, breakup)**
> Last note — if it's not a priority right now, no problem. Whenever you want the AI-readiness check for {{company}}, just reply. Wishing the practice well.

---

### Notes
- **Cadence:** 3 touches over ~6 days per contact; ~20–30 sends/day/inbox once warm, mailbox rotation on.
- **Suppression:** exclude anyone in `cbo-suppression-list.csv`; one `campaign_route` per contact.
- **Next:** CBO + WSS sequences follow the same structure (SMB/website-support framing) once you're ready.
