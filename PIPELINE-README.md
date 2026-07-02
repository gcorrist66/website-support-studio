# WSS Prospect Pipeline — how the pieces fit

Goal: a zero-bounce, owner-named, send-ready list of WSS prospects, nationwide, one trade at a time.

All files land in ONE handoff folder so the agents can read each other's output:
`/Users/corristonconsulting/Projects/website-support-studio/outreach/`

## The flow
1. **Doge scrapes** → `DOGE-PROMPT.md` → saves `outreach/[vertical]-nationwide-raw.csv`
   (owner first/last + email required on every row; weak/no-site businesses only)
2. **Codex + Clay enrich** → `CODEX-CLAY-PROMPT.md` → saves `outreach/[vertical]-nationwide-enriched.csv`
   (fills owner name + email, records Clay confidence. NOTE: Codex's Clay does find/enrich only — it does NOT verify deliverability. Keep all named+emailed rows here; verify in step 4.)
3. **Dedupe against who we've already touched** → check the enriched file against
   `outreach/WSS-suppression-master.csv` (159 emails: already-emailed, bounced, CBO, Corriston-warm, in-sequence)
   → I run this in one step the moment the enriched file lands.
4. **Load + VERIFY in Apollo** → Upload CSV → Apollo verifies emails on import → enroll ONLY "Verified" contacts into the WSS sequence. (This is where the zero-bounce rule is enforced — Clay can't verify, Apollo can.)
5. **Send** → personalize with `owner_first_name` + `weakness_note`.

### Sequencing rule (this caused Codex's first failure)
Codex must run AFTER Doge's raw file exists in the folder. If Codex reports "couldn't find the list," Doge hasn't saved yet — wait for `outreach/[vertical]-nationwide-raw.csv` to appear, then run Codex.

## Files in this project
- `DOGE-PROMPT.md` — the scrape prompt (swap [VERTICAL] per run)
- `CODEX-CLAY-PROMPT.md` — the enrich + verify prompt
- `outreach/WSS-scraping-brief-doge-clay.md` — full spec / reference behind both prompts
- `outreach/WSS-suppression-master.csv` — do-not-contact list (159), dedupe every new batch against this
- `outreach/wss-free-preview-sequence.md` — the email copy
- `outreach/WSS-master-upload.csv` — the 56 fresh prospects already pulled from prior research (loadable now)

## Standing rules
- Nationwide, never single-metro (the weak-site + owner-named + verified-email combo is rare; geography must be wide).
- One trade per run.
- Nothing gets emailed that Clay hasn't verified `valid/deliverable`.
- Every new batch is deduped against `WSS-suppression-master.csv` before send.
