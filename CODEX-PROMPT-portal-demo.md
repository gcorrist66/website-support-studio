# CODEX — Add a sample "client portal" to the Ridgeline demo

```
TASK: Build a fake/sample CLIENT PORTAL and link the Ridgeline Roofing demo to it, so a prospect viewing the demo can see that a Website Support Studio site COMES WITH an owner portal. This is a selling point — "we build, host, and maintain it, and you get a portal to run it."

CONTEXT:
- The Ridgeline demo lives at /templates/sample/ridgeline-roofing (component: marketing/src/components/sample-sites/RidgelineRoofingSample.astro). You just rebuilt it and deployed to production.
- There is NO portal page yet. Build one as another sample page so it's all demo/fictitious ("Ridgeline Roofing" owner view, DEMO SAMPLE marker).

BUILD a sample owner portal page (premium, on-brand, orange #f97316 accent, mobile-first, accessible):
- A logged-in "owner dashboard" view for Ridgeline Roofing (fictitious — no real auth, it's a static demo).
- Show the value of what the owner GETS with their WSS site. Suggested panels:
  • New estimate requests / leads coming in from the site (sample list: name, town, roof issue, date)
  • Site status: live, hosted, SSL secure, last updated date, uptime
  • "Request a change" panel (e.g. update hours, add a photo, change phone) — shows they don't touch code, WSS handles it
  • Simple traffic/calls snapshot (placeholder numbers, clearly sample)
  • Billing / plan: "Monthly plan — optional, cancel anytime. You own your domain, site, and content."
- Keep a clear "DEMO SAMPLE · FICTITIOUS" marker so it's obviously an example.

LINK IT FROM THE DEMO:
- Add a visible link from the Ridgeline demo site to this portal — e.g. an "Owner Login" / "Client Portal" link in the site header, AND a short section on the demo like "Every site comes with your own portal" with a "See the owner portal →" button.
- The portal page should have a way back to the demo site.

DELIVER:
- The portal page at a clean route (e.g. /templates/sample/ridgeline-roofing/portal).
- The link added to RidgelineRoofingSample.astro.
- Run `astro check && astro build` (0 errors), verify mobile at 390px has no horizontal overflow.
- Deploy to production and return the live portal URL + confirm it returns HTTP 200 and links both ways with the demo.

Do not add real authentication or collect real data — it's a static showcase.
```
