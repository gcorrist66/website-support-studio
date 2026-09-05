# Cold Outreach Infrastructure — Setup Spec (subdomain approach, 3 brands)

**Decision:** send from a **subdomain of each brand's own established domain** — inherits the parent domain's age/legitimacy (passes inspection by high-end buyers), $0 new registration, each brand sends as itself. **Tradeoff:** a subdomain only *partially* isolates reputation, so keep cold volume sane — don't let it bleed into the root domain's client/product mail.

---

## 1. The send subdomains

| Brand | Send subdomain | Notes |
|---|---|---|
| Corriston | **go.corristonconsulting.com** | Same brand — clean |
| CBO | **go.campaignbudgetoptimizer.com** | CBO's own product domain (brand-pure). *Or* `go.corristonconsulting.com` if you want the "backed by Corriston" credibility transfer for high-end CBO. |
| WSS | **go.<wss-domain>** | Its own domain if it has one; else a `corristonconsulting.com` subdomain is fine (WSS buyers won't inspect) |

`go.` is clean and neutral; avoid obvious names like `outreach.`/`cold.`.

---

## 2. Order of operations (do NOT add DNS first)

1. **Add the send subdomain to your mail provider first.** Google Workspace: Admin → Account → Domains → Manage domains → **Add a domain** → add `go.corristonconsulting.com` as a **secondary domain** (not an alias). This generates your **DKIM key** and gives you the MX value.
2. **Create 2 mailboxes** on it (e.g. `gary@go.corristonconsulting.com`, `hello@go.corristonconsulting.com`).
3. **Then add the DNS records below in Squarespace.**
4. Verify the domain in the provider → turn on **warmup** → connect to Apollo.

---

## 3. Squarespace DNS records — per send subdomain (Google Workspace)

Squarespace auto-appends the root domain, so **Host** is just the prefix shown.

| Type | Host | Value | Notes |
|---|---|---|---|
| MX | `go` | `smtp.google.com` (priority **1**) | Google's single modern MX — lets you receive replies |
| TXT | `go` | `v=spf1 include:_spf.google.com ~all` | SPF |
| TXT | `google._domainkey.go` | *(paste the DKIM value Google Admin generates)* | DKIM — Admin → Apps → Gmail → **Authenticate email**, generate **2048-bit**, copy the value |
| TXT | `_dmarc.go` | `v=DMARC1; p=none; rua=mailto:dmarc@corristonconsulting.com; adkim=s; aspf=s` | Start `p=none` (monitor), tighten later |

Repeat the same pattern on each brand's domain (swap the root). If CBO/WSS domains aren't in Squarespace, add identical records in their registrar's DNS.

> **If you're on Microsoft 365 instead of Google Workspace,** the MX/SPF/DKIM values differ — tell me and I'll swap them.

---

## 4. Mailboxes + cost

- 2 inboxes per subdomain → ~40–60 sends/day/brand after warmup, with **mailbox rotation** on.
- Google Workspace is ~$7/user/mo (6 inboxes ≈ $42/mo). A dedicated cold-inbox provider is cheaper per inbox if you want to scale — DNS is the same.

## 5. Warm up + connect to Apollo

- Turn on **warmup** the day each inbox exists; ~2–3 weeks before cold volume.
- Apollo → Settings → Mailboxes → link each inbox → set daily limits → enable rotation per sequence. One Basic seat covers all 6 inboxes.
- **Exception:** warm Corriston reconnects can send now at low volume from your real `corristonconsulting.com` mailbox — no warmup needed for people who know you.

---

## 6. Master cross-brand routing (so brands never double-hit a contact)

One field in Zoho — `campaign_route` — one active value per contact:

| Route | Who | Brand/offer |
|---|---|---|
| `cbo` | SMBs running paid ads | CBO — ad-budget tool |
| `wss` | SMBs with broken/outdated sites | WSS — website support |
| `corriston-buyer` | Healthcare / e-comm / B2B owners (net-new) | Corriston — AI consulting |
| `corriston-warm` | Warm 1st-degree connections (real businesses) | Corriston — reconnect |
| `partner` | Agency / martech / consultant peers | Referral track |
| `suppress` | Already in CBO send / do-not-contact / bad fit | none |

**CBO vs WSS tiebreak (same SMB pool):** runs ads → `cbo`; website is the pain → `wss`; never both. Existing CBO 100 stay `cbo`, suppressed everywhere else.

---

## What unlocks when
- **Now:** warm Corriston reconnects (low volume, real domain), all list-building, all copy, LinkedIn DMs.
- **~Week 3 (after warmup):** cold campaigns for all three brands at ramping volume.
