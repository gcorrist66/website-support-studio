# WSS Launch Readiness
**Date:** 2026-06-15  
**Prepared by:** Claude / Cowork  
**Methodology:** WSS_PREVIEW_METHODOLOGY_V2 (Wave 3) + V1 (Campaign A P1/P2)

---

## READY NOW

| Prospect | Email | Preview | Zoho | Action |
|----------|-------|---------|------|--------|
| **Gold's Concrete** | ✅ goldsconcrete@gmail.com | ✅ /golds-concrete | ✅ 1511887000001104006 | Send |
| **Nashville Painting** | ✅ sales@nashvillepaintingcompany.com | ✅ /nashville-painting | ✅ 1511887000001104007 | Send |

Both send from `sales@corristonconsulting.com` via Zoho. Packages below.

---

## READY AFTER ONE FIX

| Prospect | What's Missing | Fix |
|----------|---------------|-----|
| **Authentic Air Solutions** | Preview not deployed | Deploy to previews.websitesupportstudio.com/authentic-air-solutions — then send. Email ✅, owner ✅, Zoho ✅ |
| **Consistent AC** | No direct email + preview not deployed | Call Tim at (813) 440-0317 → get email → deploy preview → send |

---

## BLOCKED

| Item | Reason | Owner |
|------|--------|-------|
| Wave 3 preview deployment | `wss-prospect-previews` is a Node.js serverless app deployed via Codex. Source code not in mounted directories. V2 HTML files exist at `website-support-studio/marketing/public/prospect-previews/v2/` but cannot be deployed to the previews subdomain without the original project source. | Gary → Codex |
| Consistent AC direct email | No public email found — contact form only. Call (813) 440-0317 first. | Gary |

---

## ZOHO RECONCILIATION — COMPLETED 2026-06-15

### Updates applied this session (all SUCCESS):

| Record | Zoho ID | What Changed |
|--------|---------|-------------|
| AKAP Concrete | 1511887000001105003 | Email → fmeyer@akap.com |
| All Trees Considered | 1511887000001105006 | Email → team@alltreesconsideredllc.com |
| Eastside Garage Door | 1511887000001105008 | Email → info@eastsidegaragedoor.com |
| American Standard Garage Door | 1511887000001105007 | Email → Americanstandardgaragedoors@gmail.com; Owner → Zach Wallace |
| Gold's Concrete Services | 1511887000001104006 | Owner → Andrew Gold; Lead_Status → Not Contacted |
| Nashville Painting Company | 1511887000001104007 | Owner → Jeremy Reeves; Email → sales@nashvillepaintingcompany.com; Lead_Status → Not Contacted |
| Authentic Air Solutions (NEW) | 1511887000001124603 | Created: Travis Jackson Sr., info@authenticairsolutionsllc.com, (813) 817-7854 |

### Campaign B — Reconciled

All 6 Campaign B records now have confirmed emails in Zoho. All previews confirmed captured in wss-prospects.ts.

| Prospect | Zoho ID | Email in Zoho | Preview |
|----------|---------|--------------|---------|
| Construction Theory | 1511887000001104008 | jeff@constructiontheory.com ✅ | /construction-theory ✅ |
| AKAP Concrete | 1511887000001105003 | fmeyer@akap.com ✅ | /akap-concrete ✅ |
| All Trees Considered | 1511887000001105006 | team@alltreesconsideredllc.com ✅ | /all-trees-considered ✅ |
| Eastside Garage Door | 1511887000001105008 | info@eastsidegaragedoor.com ✅ | /eastside-garage-door ✅ |
| American Standard | 1511887000001105007 | Americanstandardgaragedoors@gmail.com ✅ | /american-standard-garage-door ✅ |
| Florida Boys Lawn | 1511887000001105005 | hello@floridaboyslandscape.com ✅ | /florida-boys-landscape ✅ |

Campaign B is send-ready once Gary approves. None sent yet. All Lead_Status = null (not contacted).

---

## VERIFICATION CHECKLIST

### Authentic Air Solutions
| Item | Value | Status |
|------|-------|--------|
| Owner | Travis Jackson Sr. | ✅ BBB + DBPR |
| Email | info@authenticairsolutionsllc.com | ✅ Found in V2 preview footer |
| Phone | (813) 817-7854 | ✅ Confirmed |
| Emergency line | (813) 298-9207 | ✅ Confirmed |
| V2 preview HTML | website-support-studio/marketing/public/prospect-previews/v2/authentic-air.html | ✅ Built |
| Desktop screenshot (current) | screenshots/authentic-current-desktop.png | ✅ Captured |
| Mobile screenshot (current) | screenshots/authentic-current-mobile.png | ✅ Captured |
| Desktop screenshot (preview) | screenshots/authentic-preview-desktop.png | ✅ Captured |
| Mobile screenshot (preview) | screenshots/authentic-preview-mobile.png | ✅ Captured |
| Competitor (Gulf Coast Air) | screenshots/authentic-competitor-gulf-coast-desktop.png | ✅ Captured |
| Preview URL deployed | previews.websitesupportstudio.com/authentic-air-solutions | ❌ Deploy required |
| Zoho record | 1511887000001124603 | ✅ Created |
| License | CAC1820318 | ✅ In preview |
| BBB | A+ accredited | ✅ In preview |

### Consistent AC
| Item | Value | Status |
|------|-------|--------|
| Owner | Timothy Krouse | ✅ BBB confirmed |
| Email | Not found publicly | ❌ Call to obtain |
| Phone | (813) 440-0317 | ✅ BBB + Yelp + Buzzfile |
| Contact form | consistentac.com/contact-us | ✅ Alternative only |
| V2 preview HTML | website-support-studio/marketing/public/prospect-previews/v2/consistent-ac.html | ✅ Built |
| Desktop screenshot (current) | screenshots/consistent-current-desktop.png | ✅ Captured |
| Mobile screenshot (current) | screenshots/consistent-current-mobile.png | ✅ Captured |
| Desktop screenshot (preview) | screenshots/consistent-preview-desktop.png | ✅ Captured |
| Mobile screenshot (preview) | screenshots/consistent-preview-mobile.png | ✅ Captured |
| Competitor (Acree Air) | screenshots/consistent-competitor-acree-desktop.png | ✅ Captured |
| Preview URL deployed | previews.websitesupportstudio.com/consistent-ac | ❌ Deploy required |
| Zoho record | Not created | ❌ Need email first |
| License | CAC1819934 | ✅ In preview |

### Gold's Concrete Services
| Item | Value | Status |
|------|-------|--------|
| Owner | Andrew Gold | ✅ BBB + website About page |
| Email | goldsconcrete@gmail.com | ✅ Confirmed |
| Phone | (816) 741-3733 | ✅ Confirmed |
| Preview URL | https://previews.websitesupportstudio.com/golds-concrete | ✅ Live |
| Homepage screenshot | screenshots/golds-concrete-homepage.png | ✅ Captured |
| Hero screenshot | screenshots/golds-concrete-hero.png | ✅ Captured |
| Mobile screenshot | screenshots/golds-concrete-mobile.png | ✅ Captured |
| Zoho record | 1511887000001104006 | ✅ Updated |
| Proof hook | Perfect 5.0 / 27 reviews | ✅ Verified |

### Nashville Painting Company
| Item | Value | Status |
|------|-------|--------|
| Owner | Jeremy Reeves | ✅ LinkedIn + BBB |
| Email | sales@nashvillepaintingcompany.com | ✅ Confirmed |
| Phone | (615) 590-5050 | ✅ Confirmed |
| Preview URL | https://previews.websitesupportstudio.com/nashville-painting | ✅ Live |
| Hero screenshot | screenshots/nashville-painting-hero.png | ✅ Captured |
| Homepage screenshot | screenshots/nashville-painting-homepage.png | ✅ Captured |
| Mobile screenshot | screenshots/nashville-painting-mobile.png | ✅ Captured |
| Zoho record | 1511887000001104007 | ✅ Updated |
| BBB | Accredited | ✅ Confirmed |

---

# OUTREACH PACKAGES

---

## GOLD'S CONCRETE SERVICES

**Sending from:** sales@corristonconsulting.com → goldsconcrete@gmail.com  
**Angle:** Proof First — perfect 5.0, 27 reviews  
**Status:** ✅ GO

### Subject Line A
Andrew — your perfect 5.0 score deserves a homepage that leads with it.

### Subject Line B
Gold's Concrete — I built something you should see before you hear a pitch.

---

### Email #1 — First Touch

Hi Andrew,

I spent some time with Gold's Concrete — your perfect 5.0 rating, your 27 reviews, the work you've done in Kansas City — and noticed your site doesn't lead with any of it.

So I built a version that does.

[SCREENSHOT — golds-concrete-homepage.png → links to preview]

Here's what I kept:
→ Your company name, your phone, your service area.

Here's what I added:
→ Your perfect 5.0 score and 27 reviews front and center. What people actually say about you. A clear path for someone who wants a quote vs. someone who wants to see your work first.

Preview: https://previews.websitesupportstudio.com/golds-concrete

No pitch. No contract. I built it to show you what's possible.

If it's worth a conversation:
https://www.corristonconsulting.com/contact

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #1 — 5 Days Later

**Subject:** Re: Gold's Concrete preview

Hi Andrew,

Following up on the preview I sent a few days ago.

https://previews.websitesupportstudio.com/golds-concrete

A perfect 5.0 is rare. Most contractors would kill for what you've already built. The preview shows what that proof looks like when someone finds you online before they call.

If you had a chance to look, I'd love to know what you think.

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #2 — 7 Days After Follow-Up #1

**Subject:** Last note — Gold's Concrete

Andrew,

Last note on this.

https://previews.websitesupportstudio.com/golds-concrete

If the timing isn't right, no problem at all.

If you ever want to talk about it:
https://www.corristonconsulting.com/contact

— Gary  
Website Support Studio

---

### 30-Second Call Opener

**Call:** (816) 741-3733

> "Hi, is this Andrew? This is Gary Corriston from Website Support Studio.
> I'm not selling anything — I built a version of your website and wanted to make sure you saw it.
>
> You have a perfect 5.0 on Google, 27 reviews — that's genuinely rare for a concrete contractor.
> Your current site doesn't show any of it. I built a version that does.
>
> Would it be okay if I sent you the link? Email or text — whichever is easier."

---

## NASHVILLE PAINTING COMPANY

**Sending from:** sales@corristonconsulting.com → sales@nashvillepaintingcompany.com  
**Angle:** Marketing Quality First — BBB accredited, professional operation  
**Status:** ✅ GO

### Subject Line A
Jeremy — Nashville Painting Company deserves a site that matches the work.

### Subject Line B
Nashville Painting — here's a site that does your business justice.

---

### Email #1 — First Touch

Hi Jeremy,

I spent some time with Nashville Painting Company — BBB accredited, professional operation, real painting expertise — and put together a preview of what a site that actually reflects that looks like.

[SCREENSHOT — nashville-painting-hero.png → links to preview]

Your current site has the foundation. The preview shows what it looks like when the professionalism of the business matches the professionalism of the site.

Preview: https://previews.websitesupportstudio.com/nashville-painting

No pitch. No contract. I built it to show you what's possible.

If it's worth a conversation:
https://www.corristonconsulting.com/contact

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #1 — 5 Days Later

**Subject:** Re: Nashville Painting Company preview

Hi Jeremy,

Following up on the preview I sent a few days ago.

https://previews.websitesupportstudio.com/nashville-painting

A BBB-accredited painting contractor in Brentwood is a different level of operation than most. The preview shows what a site looks like when it communicates that clearly — before someone even picks up the phone.

If you had a chance to look, I'd love to know what you think.

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #2 — 7 Days After Follow-Up #1

**Subject:** Last note — Nashville Painting Company

Jeremy,

Last note on this.

https://previews.websitesupportstudio.com/nashville-painting

If the timing isn't right, no problem at all.

If you ever want to talk:
https://www.corristonconsulting.com/contact

— Gary  
Website Support Studio

---

### 30-Second Call Opener

**Call:** (615) 590-5050

> "Hi, is Jeremy available? This is Gary Corriston from Website Support Studio.
> I'm not selling anything — I built a preview of your website and wanted to make sure you saw it.
>
> Nashville Painting is BBB accredited — professional operation — and I built a version of your site that communicates that clearly before someone calls.
>
> Would it be okay if I sent you the link? Email or text — whichever works."

---

## AUTHENTIC AIR SOLUTIONS

**Sending from:** sales@corristonconsulting.com → info@authenticairsolutionsllc.com  
**Angle:** Proof First — BBB A+, 5-star Angi reviews, license, $2M liability hidden on current Replit site  
**Status:** 🟡 GO — pending preview deployment only

### Subject Line A
Travis — here's what your BBB A+ and 5-star reviews look like on a real website.

### Subject Line B
Authentic Air Solutions — I built something you should see before I reach out.

---

### Email #1 — First Touch

Hi Travis,

I spent some time with Authentic Air Solutions — your BBB A+ rating, your Angi reviews, your license, your service area — and I noticed your current site doesn't show any of it.

So I built a version that does.

[SCREENSHOT — authentic-preview-desktop.png → links to preview]

Here's what I preserved:
→ Your tagline. Your phone number. Your service areas. Your 24/7 emergency availability.

Here's what I added:
→ Your BBB accreditation front and center. Your real customer reviews (Cody, Brent, Carlos — word for word from Angi). Your license number and liability coverage visible before anyone calls. A clear path for residential vs. commercial vs. emergency.

Preview: https://previews.websitesupportstudio.com/authentic-air-solutions

No pitch. No contract. I built it to show you what's possible.

If it's worth a conversation:
https://www.corristonconsulting.com/contact

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #1 — 5 Days Later

**Subject:** Re: Authentic Air Solutions preview

Hi Travis,

Following up on the preview I sent a few days ago.

https://previews.websitesupportstudio.com/authentic-air-solutions

Your Angi reviews are strong — Cody mentioned you saved him thousands compared to other quotes. That's the kind of thing a homeowner looks for before they call. Your current site doesn't show it. The preview does.

If you had a chance to look, I'd love to know what you think.

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #2 — 7 Days After Follow-Up #1

**Subject:** Last note — Authentic Air Solutions

Travis,

Last note on this.

If the preview isn't something you're interested in right now, no problem at all.

https://previews.websitesupportstudio.com/authentic-air-solutions

If you ever want to talk about it:
https://www.corristonconsulting.com/contact

— Gary  
Website Support Studio

---

### 30-Second Call Opener

**Call:** (813) 817-7854

> "Hi, is this Travis? This is Gary Corriston from Website Support Studio.
> I'm not selling anything — I actually built a version of your website and I wanted to make sure you saw it before I sent anything over.
>
> I noticed your BBB accreditation and your Angi reviews but none of that's on your site.
> So I put it together and it took about 30 seconds to see the difference.
>
> I can send you the link right now if you have an email handy — or I can text it.
> What works better for you?"

---

## CONSISTENT AC (Consistent Heating and Cooling, LLC)

**Sending from:** sales@corristonconsulting.com → [email TBD — call first]  
**Angle:** Mission + Customer Story — Tim's own words and real reviews hidden in Square template  
**Status:** 🟠 SOFT GO — call Tim first, get email, then send

### Subject Line A
Tim — I took your mission statement seriously and built a site around it.

### Subject Line B
Consistent AC — here's a version of your site that leads with your work, not your payment button.

---

### Email #1 — First Touch

**Send via:** Call (813) 440-0317 to get direct email first — OR send via contact form at consistentac.com/contact-us

Hi Tim,

I spent some time with Consistent Heating and Cooling — your mission statement, your photo gallery, your customer reviews, your four-county service area — and noticed your current site doesn't lead with any of it.

So I built a version that does.

[SCREENSHOT — consistent-preview-desktop.png → links to preview]

Here's what I kept:
→ Your mission statement, word for word. Your photos (the before/after coil cleaning, the commercial mini-split in the dining hall). Your service descriptions. Your payment option for existing customers.

Here's what I added:
→ Your four customers on the page — Mike, Annie, Teresa, Hugh — saying exactly what they told Google. Your license number where people can see it. A clear path for service calls vs. estimates vs. maintenance. A persistent call button that doesn't disappear when someone scrolls.

Preview: https://previews.websitesupportstudio.com/consistent-ac

No pitch. No contract. I built it because I thought you should see it.

If it's worth a conversation:
https://www.corristonconsulting.com/contact

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #1 — 5 Days Later

**Subject:** Re: Consistent AC preview

Hi Tim,

Following up on the preview I sent a few days ago.

https://previews.websitesupportstudio.com/consistent-ac

Annie said you came out in the middle of summer, knew the problem, and got it done the next day. Hugh said you service all his business locations and can fix it same-day so his customers stay cool. Those aren't marketing lines — that's what people say about you.

Your current site doesn't show any of it. The preview does.

If you had a chance to look, I'd love to know what you think.

— Gary Corriston  
Website Support Studio  
sales@corristonconsulting.com

---

### Follow-Up #2 — 7 Days After Follow-Up #1

**Subject:** Last note — Consistent AC

Tim,

Last note on this.

https://previews.websitesupportstudio.com/consistent-ac

If the timing isn't right, no problem at all.

If you ever want to talk:
https://www.corristonconsulting.com/contact

— Gary  
Website Support Studio

---

### 30-Second Call Opener (ALSO USE THIS TO GET EMAIL)

**Call:** (813) 440-0317

> "Hi, is this Tim? This is Gary Corriston from Website Support Studio.
> I'm not selling anything — I built a version of your website and wanted to make sure you saw it.
>
> Your mission statement, your customer reviews, your photo gallery — all of it's already written.
> I just put it where people can actually find it before they decide whether to call you.
>
> Would it be okay if I sent you the link?
> I can email it or text it — whichever is easier."

---

## GO / NO-GO SUMMARY

| Prospect | GO / NO-GO | Send Path | One-Line Condition |
|----------|------------|-----------|-------------------|
| Gold's Concrete | ✅ GO NOW | Zoho → goldsconcrete@gmail.com | No blockers |
| Nashville Painting | ✅ GO NOW | Zoho → sales@nashvillepaintingcompany.com | No blockers |
| Authentic Air Solutions | 🟡 GO (1 step) | Zoho → info@authenticairsolutionsllc.com | Deploy preview first |
| Consistent AC | 🟠 SOFT GO (2 steps) | Call → get email → Zoho | Call Tim + deploy preview |

---

## OUTSTANDING ACTIONS (for Gary)

1. **Deploy Wave 3 previews** — Open `wss-prospect-previews` project in Codex. Add routes: `/authentic-air-solutions` → authentic-air.html and `/consistent-ac` → consistent-ac.html from `website-support-studio/marketing/public/prospect-previews/v2/`. Redeploy. This unblocks Authentic Air immediately.

2. **Call Tim Krouse** — (813) 440-0317. Use the call opener above. Get direct email. Once you have it: create Zoho record, then send after preview is deployed.

3. **Send Gold's and Nashville** — Both are ready right now. Log into Zoho, open each record, send Email #1 using the packages above.

---

## FILE REFERENCES

| File | Path |
|------|------|
| Gold's Concrete outreach | prospects/outreach-golds-concrete.md |
| Nashville Painting outreach | prospects/outreach-nashville-painting.md |
| Authentic Air outreach | prospects/outreach-authentic-air-solutions.md |
| Consistent AC outreach | prospects/outreach-consistent-ac.md |
| Wave 3 readiness audit | prospects/wss-wave3-readiness.md |
| Campaign A audit | prospects/campaign-a-audit.md |
| Prospect data | lib/wss-prospects.ts |
