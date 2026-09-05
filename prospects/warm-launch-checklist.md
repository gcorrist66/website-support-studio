# Warm Corriston Launch — Checklist ($0, send from sales@)

Sequence: **Corriston — Warm Reconnect (Operators)** (inactive) — app.apollo.io/#/sequences/6a34abc47a6745000ce47fcc
Contacts: 36 loaded — labels `Corriston Warm - Operator` (24) and `Corriston Warm - Partner` (12).

## Before you flip it on (30 sec, optional but smart)
- In Squarespace DNS, update the **root `@` SPF** to include Google so your sent mail authenticates:
  `v=spf1 include:_spf.google.com include:one.zoho.com ~all`
  (You currently have only Zoho there; Gmail-sent mail will authenticate better with this.)

## Launch (4 clicks in Apollo)
1. Open the sequence → **Add contacts** → filter by label **`Corriston Warm - Operator`** → add the 24.
2. Confirm sender = **sales@corristonconsulting.com** (already your default).
3. Set a **low daily cap: ~10/day** (Settings → schedule / max emails) so 24 go out over ~2–3 days, not all at once.
4. Review the 3 emails once, then **Activate**.

> Start with the 24 **Operators** only. The 12 **Partners** want a different (referral) note — hold them; that sequence is next.

## Monitor (your RBL / deliverability watch)
- **Blocklists:** check `corristonconsulting.com` + your IP at mxtoolbox.com/blacklists weekly (and Spamhaus/Barracuda).
- **Google Postmaster Tools:** add the domain — watch spam rate (<0.3%) and domain reputation.
- **In Apollo:** watch **bounce rate** and **spam-block rate** per send. Healthy = bounce <3%, replies >10% (warm).
- **Pause triggers:** if bounce >5%, spam-blocks climb, or you land on a blocklist → pause, fix, slow down. These are warm contacts so risk is low, but watch the first 2 days closely.

## After a few replies / sales
- Then justify the cold infra (Winnr fresh-domain inboxes) for the cold net-new push — paid for by the warm wins.
