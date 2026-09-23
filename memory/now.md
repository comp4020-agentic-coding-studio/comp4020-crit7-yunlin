# now

**State:** deepen phase, 148h to cutoff at the start of this run. Base build
plus last run's API-boundary validation fix were already committed, pushed,
and deployed. This run found and fixed a real rendering bug, then closed out
several deepen-phase candidates the previous hand-off had queued.

**What I did this run:** re-fetched the brief (unchanged), took stock of the
clean git tree, then read every source file fresh with a new question each
time rather than re-running the existing checklist:

- **Found and fixed a real bug**: `index.astro`'s intro paragraph had
  `<a href="/readme/">the README</a>` starting its own source line. Astro's
  compiler trims a trailing newline+indentation text node that sits directly
  before an element's start tag instead of collapsing it to a space (unlike
  the rest of the paragraph's line breaks, which collapse fine mid-text-node)
  — so the built HTML literally had zero whitespace between "see" and the
  anchor, rendering as "seethe README" glued together. Confirmed via
  `curl`-ing the built server's raw HTML (not just eyeballing a screenshot —
  a mobile-viewport `agent-browser` screenshot is what first surfaced it).
  Fixed by moving the anchor onto the same source line as the word before it
  (`— see\n        the <a href="/readme/">README</a> for...`), so the line
  break stays inside one text node where normal whitespace collapse applies;
  verified by rebuilding, curling, and re-screenshotting both viewports.
  Committed (`1d6cf75`) and deployed; confirmed live at
  `https://comp4020-crit7-yunlin.fly.dev/` via `curl`.
- **Mobile viewport (390x844) pass**: this is what surfaced the bug above.
  Otherwise clean — seal highlight, "— now" annotation, cancel button, and
  the booking form all render legibly at that width.
- **Dark-mode emulation** (`agent-browser set media dark`): identical
  rendering to light mode, as expected — this app has no
  `prefers-color-scheme` media query, a deliberate fixed-palette choice
  matching crit 4/5's precedent, not an oversight.
- **Forced-colors/prefers-contrast emulation** (raw CDP script, since
  `agent-browser` has no shortcut for it — same technique logged in
  `MEMORY.md` for crit 5): `--seal` gets correctly overridden to system
  colours everywhere it's used (the active-row background, border-left, the
  "— now" text, the error banner, the dark "book" button). The one-accent
  "happening now" meaning degrades to a plain black border-left plus the
  italic "— now" text once colour is stripped — a real reduction in how
  visible it is (every room card already has its own black border, so the
  extra border-left reads as subtler than in colour), but every room's
  active/free state is still legible from the border/text alone, not lost
  outright. Judged this the expected, correct behaviour of forced-colors
  mode (it's designed to replace author colour with structure, and there is
  a structural cue here), not a bug to fix — same "closed clean" call
  `MEMORY.md` already logged for crit 5's equivalent check.
- Ran `pnpm check` (35/35 green) before and after the fix, deployed, and
  confirmed the live URL serves the new HTML.

**Single most important next action:** this is not the final run — don't
write `reflections/crit-7.md` yet. Deepen-phase candidates still open, in
roughly the order I'd try them: (1) a slow-connection throttled-load pass
(the artefact HD band's third named scenario, per `MEMORY.md`'s standing
practice — never tried on this repo yet); (2) whether SQLite's WAL mode
plus Fly's single-machine auto-suspend could ever lose an in-flight write —
still just a hunch, not a concrete mechanism, so don't manufacture a test
without one; (3) reread `README.md`/`PROCESS.md`/this `CLAUDE.md` against
what's actually shipped, the same "does this checkable claim hold" pass the
group's other crits already do routinely for this repo — not yet done here.
Whatever's tried next, prefer a genuinely new question over re-verifying
what this run already closed (mobile viewport, dark mode, forced-colors are
all done, not just "probably fine").
