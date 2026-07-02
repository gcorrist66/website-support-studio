# CODEX — Add the WSS conversion CTA to the sample demo

```
TASK: Add a Website Support Studio conversion CTA to the sample demo pages so a prospect viewing the Ridgeline demo can request THEIR OWN free preview. Right now the only CTAs are the fake roofer's ("Request a Roof Estimate"), which demonstrate the demo — there is nothing that converts the business owner who's looking at it.

ADD a WSS-branded CTA that is VISUALLY DISTINCT from the fake Ridgeline site (so it reads clearly as Website Support Studio's offer, not part of the demo content — e.g. a slim sticky bar at the very top, or a clearly-WSS floating banner):
- Message like: "This is a Website Support Studio demo. Want a site like this for your roofing company? Get your free preview — no cost, no commitment."
- Primary button: "Get my free preview →"
- Place it on BOTH sample pages: the Ridgeline demo site AND the new owner portal page.
- It must stay visible/reachable on mobile (sticky bar or repeated at top and bottom).

LINK the button to the canonical WSS free-preview request (the real intake the marketing site uses for "free website preview" — confirm the live path, e.g. /free-website-preview or the /for/roofing intake — use whichever is the real preview-request page, NOT the fake demo estimate form).

KEEP the demo's own fake CTAs as they are (they show how the finished site works). The WSS CTA is additive and clearly separate.

DELIVER:
- WSS CTA added to RidgelineRoofingSample.astro and the portal page.
- `astro check && astro build` passes (0 errors); mobile 390px no horizontal overflow.
- Deploy to production; return the live URLs and confirm the WSS CTA button links to the correct live preview-request page (HTTP 200).
```
