# MEMORY — comp4020-crit7-yunlin

Durable, repo-local lessons for this deliverable. The group-level throughline
and cross-crit lessons live in the agent's own `agents/yunlin/memory/MEMORY.md`,
imported by `CLAUDE.md` — this file only holds what's specific to this repo.

## What this app is

A room board modelling a slice of ANU Library's real group-study-room booking
system, grounded by search rather than invented (see `PROCESS.md`). One
accent colour (`--seal`) marks exactly one meaning: a booking happening right
now, computed from `Australia/Canberra` wall-clock time regardless of the
server's own timezone.

## Repo-specific lessons

- `check:evidence`'s reflection check (`reflections/crit-7.md`) fails on
  every run before the final one — that's expected, not a regression. The
  repo's own CI workflow (`.github/workflows/checks.yml`) only runs
  `check:evidence` once the repo is public (`!github.event.repository.private`),
  which only happens at ship time, so failing it locally mid-week carries no
  real consequence. Don't write the reflection early just to make this pass
  green; doctrine places it under finishing steps on the final run only.
- `pnpm check` (`typecheck && test`) does **not** run `check:evidence` — they
  are separate scripts. A green `pnpm check` says nothing about whether
  `PROCESS.md`/reflections are in shape; check them separately when it
  matters.
- The Astro compiler misreads a bare `<` comparison inside a `.map()`
  callback in template markup as a tag-open. Any "is this within range"
  check on booking times has to be precomputed in frontmatter as a named
  boolean (`isNowWithin`) and consumed as a plain property in the template,
  never written inline as `a < b` inside JSX-like markup.
- `agent-browser find text "Book" click` matched the `<h2>Book a room</h2>`
  heading, not the `<button>Book {date}</button>` submit control — both
  contain "Book" as a substring and the tool takes the first DOM match with
  no error, silently no-opping the form submit. Same failure shape already
  logged in the group `MEMORY.md` for ambiguous text matches; the fix here
  was the same one: `agent-browser snapshot` for a `[ref=eN]` and `click
  "ref=eN"` on the actual button once more than one element shares visible
  text.
- The one-accent rule needs checking against every rule that touches colour,
  not just the "happening now" cases: `.error` (the validation/conflict
  banner) reused `--seal` for a second, unrelated meaning from the very
  commit that introduced the accent (`917103f`), whose own message claimed
  "the one accent colour marks exactly one thing" — never actually true.
  Fixed by moving `.error` to plain `--ink` styling. Worth grepping
  `styles.css` for every `var(--seal)` use whenever revisiting this repo,
  not just eyeballing the room-board rows the rule is framed around.
- Deployed cleanly to Fly.io on the first `flyctl deploy --remote-only
  --ha=false -a comp4020-crit7-yunlin` once the schema/API/UI/spec work
  landed — no fly-specific gotchas hit this run. Verified live (not just
  locally) by curling `/`, `/readme/`, and `/api/events`, then driving a
  real booking → reload → cancel cycle against the live URL with
  `agent-browser`, confirming the "— now" highlight, persistence across
  reload, and a clean console, before leaving the board back at "Free all
  day" for the next person who looks at it.
- **Cross-tab SSE live update confirmed clean with two genuinely separate
  `agent-browser` sessions** (`--session tabA` / `--session tabB`, both
  `--args "--no-sandbox"` on this container), not just the single
  `EventSource` probe a prior run had already tried. Against the built
  `pnpm preview` server: tab A submitted a booking, tab B (untouched)
  auto-reloaded via the shared `EventEmitter` bus with no manual reload
  command and rendered the new row; tab B then cancelled it and tab A's
  own reload reflected the cancellation the same way. Both directions
  clean, console clean throughout on both tabs. This is the scenario
  `index.astro`'s own comment names ("two people looking at the same day
  never work from stale information") — worth treating as the check that
  actually discharges that comment's claim, distinct from a same-tab
  `EventSource` probe.
- Two `agent-browser` footguns hit while driving the booking form for the
  check above: `fill` on a native `<input type="time">` silently leaves
  the value empty (Chromium's time control doesn't accept the plain
  colon-separated keystrokes `fill` types) — set `.value` via `eval` and
  dispatch `input`+`change` events instead. And a bare `click "button"`
  selector matched the time input's own exposed "Show time picker"
  accessibility-tree button, not the form's real submit button, with no
  error — the same ambiguous-match shape already logged for `find text
  ... click` in the group `MEMORY.md`, but here from a plain-tag selector
  rather than a text match; `snapshot` for a `ref=` and `click "ref=eN"`
  fixed it.
- **A bfcache restore of this SSE-driven page keeps the live `EventSource`
  connection working, confirmed live rather than assumed from the spec's
  "connections may survive bfcache" wording.** Built and ran `pnpm preview`
  against a fresh temp SQLite DB (see the WAL footgun below), opened two
  real `agent-browser` sessions (`tabA`/`tabB`), instrumented `tabA` with
  `pagehide`/`pageshow` listeners before navigating it away to `/readme/`
  and back with `agent-browser back` — confirmed a genuine bfcache restore
  (`pagehide persisted=true`, `pageshow persisted=true`), not a fresh
  reload. With `tabA` then left untouched, `tabB` made a real booking on
  the same date; `tabA` auto-updated (its injected `window.__bfcacheLog`
  global came back `null` afterwards, confirming the update happened via
  the app's own `location.reload()`, not a stale DOM read) and rendered
  the new row with no manual command. Reverse direction (cancel from
  `tabB`) reflected on the untouched, already-bfcache-restored `tabA` the
  same way. Console clean on both tabs throughout. Couldn't intercept the
  page's own `EventSource` construction directly (it's a `const` inside an
  IIFE in the inline script, already run by the time an `eval` can patch
  `window.EventSource` — same "not really global" gotcha logged in the
  group `MEMORY.md` for module-scoped `audioCtx`), so this checked the
  real end-to-end behaviour instead of the connection's internal state —
  a genuine clean result, no fix needed.
- **A stale WAL/SHM file pair left behind after deleting a SQLite main
  database file will silently replay old data into a "fresh" database on
  next open.** Setting up a scratch DB for the bfcache check above,
  deleting just `app.db` (not `app.db-wal`/`app.db-shm`, both left over
  from an earlier `drizzle-kit push` against the same path) caused
  `better-sqlite3` to recover the old WAL onto the new empty file on
  startup, so the app's own `migrate()` call hit "table already exists"
  and 500'd with no obvious cause from the error text alone. Fixed by
  `rm -rf`-ing the whole scratch directory rather than just the `.db`
  file. Worth deleting the entire directory (or all three `.db`/`.db-wal`/
  `.db-shm` files together) whenever resetting a scratch SQLite DB for a
  live check in this repo, not just the main file.
