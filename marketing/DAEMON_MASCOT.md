# WSS — `_daemon` mascot direction (documentation only)

> Future mascot direction for Website Support Studio. **No implementation in this pass** —
> this records the intended visual direction so a designer (or a later sprint) can execute it.

## Concept

The **`_daemon`** is the brand personification of the WSS operating model: an always-on
background process that watches one queue, picks up every request, runs it through the
defined lifecycle, and never ships without sign-off. In Unix terms, a daemon is a process
that runs quietly and reliably in the background — exactly the promise WSS makes about
website operations. The mascot makes that promise tangible.

## Visual direction

- **Flatter** — flat vector, minimal gradients/shadows. Reads cleanly at favicon size and on a slide.
- **More square** — built on the same square geometry as the 4-quadrant logomark (squares with
  a small corner radius), not a round/blobby character. The body should echo the logo grid.
- **Less generic** — a distinct silhouette, not a generic robot/ghost/blob. Identity should be
  obvious in a one-color stamp.
- **`_wss` on chest** — the snake_case wordmark `_wss` rendered on the daemon's chest/face plate,
  with the leading underscore in WSS blue (the brand tell), monospace (JetBrains Mono).
- **WSS colors** — the four brand quadrant colors:
  - amber `#F4B142`
  - cyan `#35DCEA`
  - mulberry `#A83489`
  - blue `#0443FB` (also the underscore accent / `--wordmark-accent`)
  - on the brand surface `#FAFAF7`, ink `#0B1220`.
- **Simple vector style** — SVG, even stroke weights, limited palette, no photoreal rendering.

## Construction notes (for whoever builds it)

- Base the body on the logomark's 2×2 square grid so the daemon and the logo feel like one system.
- Keep it monoline / flat-fill; ship a single-color variant (ink on surface, and inverse) for stamps,
  loading states, and the favicon.
- Pair it with the existing `JetBrains Mono` wordmark; the `_wss` chest plate uses the same
  `<span class="us">` blue-underscore treatment as the rest of the site.
- Provide sizes: 16, 24, 32 (favicon/inline) and a hero size; verify the silhouette survives at 16px.

## Where it would appear (later)

Empty queue / "all caught up" states, the loading indicator, the 404, onboarding success, and
social/OG imagery. **Not** added anywhere in this pass.
