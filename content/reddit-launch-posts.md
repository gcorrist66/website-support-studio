# Reddit launch posts — SEO / GEO / AEO Checker

Two versions tuned to two subreddits. Copy the whole block into Reddit's editor.

Rules of thumb: post one subreddit at a time (Reddit's spam filter hates cross-posts within 24 hours), reply to every comment in the first 6 hours, and never link the tool in a comment as your first move — always answer the question first.

---

## Version 1 — r/vibecoding

**Title options (pick one):**
- Shipped a production SEO tool in one Claude session — ~$20 in tokens, real users hitting it now
- Built + deployed an SEO/GEO/AEO checker with Claude in a working session — sharing the honest tally
- One weekend, one Claude subscription, one free tool — here's what actually worked and what didn't

**Body:**

I built and shipped a free SEO / GEO / AEO checker (scores any page on Google-ranking, AI-citation, and answer-snippet signals) in a single working session with Claude as the coding assistant. Total token cost across the session was about $20. It's live and getting real traffic.

Sharing it here because r/vibecoding is where I've been learning from other people doing the same thing — non-devs and rusty-devs shipping real tools instead of pitch decks.

**What it does:** paste any URL, get three pillar scores (SEO 0-100, GEO 0-100, AEO 0-100) plus emerging signals — llms.txt validation, AI crawler access in robots.txt, sitemap check, content freshness. No login, no email.

[https://www.corristonconsulting.com/products/seo-geo-aeo-checker](https://www.corristonconsulting.com/products/seo-geo-aeo-checker)

**The honest tally:**

- Stack: Next.js 16 app I already had running. Added one API route (`/api/seo-check`) and one client component. Total new code was maybe 900 lines.
- Time: One working session for the MVP, then two more sessions to add features (llms.txt detection, AI crawler check, share buttons, contact CTA).
- Cost: ~$20 in Claude tokens for the whole build.
- What Claude did well: schema parsing, HTML tokenization, robots.txt parsing, TypeScript types, styling the results UI. All of that was fast.
- What Claude got wrong: initially predicted my service pages would benefit from short seoTitles — they wouldn't have, because the tLen was already inside the sweet spot. Cost me nothing because I caught it, but the confident-and-wrong pattern is real.
- What I'd have paid a dev shop: probably $8-15k for the same scope, six weeks out.

**What I actually needed to bring:**

Not coding chops. What I needed was: (1) enough HTML/CSS/PHP background to read code and spot mistakes, and (2) a clear specification of what I wanted the tool to do. The AI was cheap. The bottleneck was knowing what a good scoring rubric looks like.

**Honest limitation:** the tool passes its own rubric now (I ran it on itself and iterated until it scored 87). But it's a static-page scorer — it fetches server-side HTML, so client-rendered pages score badly even when they're actually fine. That's a known limitation, not a bug.

Feedback welcome. Especially interested in what other people have shipped in similar time/cost windows — trying to build a mental model of what the ceiling is.

---

## Version 2 — r/webdev or r/SEO (pick one)

**Title options (pick one for r/webdev):**
- Built a free SEO / GEO / AEO checker — paste a URL, get scored on three search stacks
- Free tool: score any page on SEO, AI citation (GEO), and answer snippets (AEO)
- Sharing a free checker I built — scores your page on Google rankings, AI citation, and featured snippets

**Title options (pick one for r/SEO):**
- Free SEO / GEO / AEO checker — no login, no email, just a URL
- I built a free checker that scores SEO + GEO + AEO independently on any URL (with llms.txt + AI crawler detection)

**Body:**

Sharing a free tool I built for scoring any page across three modern search stacks:

**SEO** — classic Google-ranking signals (title, meta, canonical, HTTPS, viewport, alt text, schema, content depth).

**GEO** — Generative Engine Optimization. What LLMs like ChatGPT, Claude, and Perplexity look for when they decide who to cite. Content depth, question-format headings, JSON-LD entities, author signal, outbound citations.

**AEO** — Answer Engine Optimization. What wins the featured snippet or the boxed answer inside an AI response. FAQPage schema, HowTo schema, question-driven H2s, answer-first paragraphs, tables, lists.

**Plus emerging signals:**

- llms.txt validation (Anthropic-proposed Markdown map for LLMs — validated against the format spec)
- Open Knowledge Format (Google Cloud v0.1 spec — informational)
- AI crawler access in robots.txt (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)
- Sitemap presence + declaration
- Content freshness signal

[https://www.corristonconsulting.com/products/seo-geo-aeo-checker](https://www.corristonconsulting.com/products/seo-geo-aeo-checker)

No login, no email required. Paste a URL, get three independent pillar scores in about ten seconds, with a specific pass/fail breakdown on each item and a prioritized fix list.

Two caveats up front:

1. **It scores answer-page competitiveness, not source authority.** Wikipedia, .gov, and major news sites will score low here because they don't need FAQPage schema to get cited — they're the sources the answer engines already trust. If your site is not one of those, the score is what you want to move.

2. **Static-page scorer.** It fetches HTML server-side, so client-rendered pages (React apps that render entirely in the browser) will look empty to the tool. Server-rendered pages, static sites, and SSR/SSG frameworks score correctly.

Would love feedback on the scoring rubric — especially from people running technical SEO. Anything I'm weighting wrong, anything I'm missing? Some of the AEO signals (specifically HowTo schema) I'm still uncertain about how heavily to weight.

---

## Follow-up comment templates

**For the "how did you make this?" question (on r/vibecoding):**

> Next.js 16 app I already had for my consulting site. Added an API route that does the fetch + parse server-side, and a client component for the form + results. HTML parsing is regex-based (I know, I know) because I wanted to avoid a headless-browser dependency. Total new code maybe 900 lines. If you want to see it, the case study post on my blog walks through the actual files and the token cost.

**For the "why does my page score low on AEO?" question (universal):**

> Almost always one of three things: (1) no FAQPage schema on the page, (2) H2s are noun phrases instead of questions, (3) no direct-answer paragraph in the first 40-60 words under each heading. If you fix those three, AEO typically jumps 20+ points. The tool shows the specific missing items under FIX THESE.

**For the "is my site being blocked from AI?" question (universal):**

> The AI crawler section shows GPTBot, ClaudeBot, PerplexityBot, and Google-Extended status from your robots.txt. If any show BLOCKED, that specific model literally cannot cite your page. Most sites are ALL_ALLOWED (default). If yours has blocks, it's usually because someone added a broad disallow rule.

**For the "how does this compare to [Ahrefs / SEMrush / Screaming Frog]?" question:**

> Very different tools. Ahrefs and SEMrush are competitive-intelligence platforms — keyword rankings, backlink data, competitor tracking. Screaming Frog is a site crawler. This is a per-page structural scorer for the three search stacks (Google, LLM citation, answer snippets) — it doesn't crawl your site, it doesn't track keywords, it just scores the one page you paste in against a rubric. Complementary to the others, not a replacement.
