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
- **A CDP `Page.setWebLifecycleState("frozen")`/`"active"` freeze-thaw cycle
  on this SSE page checked clean, the same technique used on crit 4/5's
  canvas apps, never yet tried on a server-rendered SSE page.** Attached to
  the built `pnpm preview` server's page target over the raw CDP websocket,
  injected a `window.__marker`, froze the page, made a real booking via a
  plain `fetch` POST (needs an `Origin` header matching the server or
  Astro's own CSRF check 403s it — no browser context to supply one
  automatically), waited, thawed, forced a frame with
  `Page.captureScreenshot` (the standing headless rAF/deferred-notification
  quirk applies here too), then read state: `window.__marker` came back
  `undefined` (proof a real `location.reload()` fired, not a stale read)
  and the new booking rendered correctly, console clean throughout. Also
  checked **forced-colors/`prefers-contrast`** via
  `Emulation.setEmulatedMedia({features: [{name: "forced-colors", value:
  "active"}]})` (no `agent-browser set media` shortcut for this one either)
  against the now-fixed `.error` banner: it and the rest of the page
  correctly flip to system colours (`CanvasText`/`Canvas`/`LinkText`), since
  nothing opts out with `forced-color-adjust: none`. Both closed clean —
  no fix needed, but worth recording alongside the fixes below since they
  closed out the two angles the prior hand-off had queued.
- **Fixing the "computed once per render" staleness bug (below) only closes
  the boundary case where a tab is parked on *today's* view; the same page
  has two other views of the same live-highlighting condition, and each
  needed its own check.** With no bookings left today, `nextBoundaryDelay`
  returned `null` — the test suite's own documented expected result for
  that case — meaning a tab left open past the last boundary of the day
  never reloaded again, not even at midnight, contradicting the README's
  "who's booked what today" claim once the date silently became yesterday
  under the still-open tab. Fixed (`88d99f1`) by adding midnight as an
  always-present fallback boundary in `nextReloadDelayMinutes`, layered on
  top of the existing per-booking-boundary function without changing its
  own semantics or tests. The symmetric case --- a tab parked on an explicit
  `?date=<tomorrow>` view, waiting for real midnight to make that date
  become today --- had the same gap (`nextBoundaryDelay` unconditionally
  `null` for any non-today view); fixed (`84b4328`) by extracting
  `minutesUntilMidnight` and scheduling a reload for the tomorrow-view case
  specifically (see `src/pages/index.astro`'s `nextBoundaryDelay` ternary).
  A fourth check --- a tab parked on a *past* date --- came back clean: past
  dates are hard-gated off live highlighting by `isToday` and never need a
  reload. General lesson for this repo: "reload at the next boundary" is
  only as complete as the set of boundary *kinds* enumerated (an event- or
  booking-driven boundary vs. a calendar/date boundary vs. which *view* of
  the data is open), and each of this page's several views of the same
  underlying live-highlighting rule needed the question asked separately.
- **`addBooking`'s and `cancelBooking`'s own code comments each argue no two
  requests can race between their read and their write, because
  better-sqlite3 is synchronous with no `await` in between --- checked live
  with real concurrent HTTP requests rather than trusted from the reasoning
  alone, for both endpoints.** `addBooking`: five genuinely parallel `curl`
  POSTs (real backgrounded OS processes, not sequential `await`s) at the
  same overlapping room/date/time landed exactly one booking, the rest got
  `error=conflict`, confirmed against the built preview server and locked
  in as `spec/booking.test.ts`'s "booking the same slot from multiple
  requests at once" (`846a5b7`). `cancelBooking`: the same shape but with
  no read-then-write check at all (just a single delete), so five
  concurrent cancels of the same id all returned 303 with exactly one
  actual deletion and no crash; and a cancel racing a new overlapping
  booking for the freed slot, repeated across many trials, held the
  invariant that the original booking was always gone and the racer's own
  booking landed if and only if its redirect carried no `error=conflict`
  --- never both present, never a silent loss unexplained by an error param.
  Both turned into permanent regression tests (`a1df375`). Closes the
  concurrency-race lens for this repo as dry across both write endpoints.
- A fresh reread of `PROCESS.md`/`README.md` against the current codebase
  (page structure, the SSE/boundary reload mechanisms above, the cited ANU
  Library URL, the now-fixed `.error`/`--seal` leak) found no stale claims
  --- everything they describe still matches what the code does. Worth
  noting this came back clean rather than skipping the check: these two
  files were last substantively written early in the build, and a lot of
  deepen-phase work (API validation, the accent-leak fix, three boundary
  fixes, two rounds of concurrency tests) has landed since without either
  file being revisited.
- **The "happening now" highlight is computed once per server render and
  nothing on the page re-checks the wall clock afterwards — a tab left open
  across a booking's start or end minute kept showing that render's stale
  answer forever, unless some other tab's booking happened to trigger the
  existing SSE reload first.** This directly broke the crit's own "one
  accent, one meaning: computed from a live value" rule and the README's
  literal claim ("the red highlight … means exactly one thing: this slot is
  happening right now") the moment a tab sat open past a boundary with no
  other activity on that date. Found by booking a slot ending ~2 minutes
  out against the built preview server, confirming `.room li.active` was
  true, then waiting (no reload) past the end time and reading the DOM
  again with no interaction: still showing active, only clearing on a
  manual reload. Fixed by computing, server-side, the number of minutes
  until the next booking start/end boundary today (`src/lib/clock.ts`'s
  pure `nextBoundaryDelayMinutes`, unit-tested in `spec/clock.test.ts`) and
  scheduling exactly one client-side `setTimeout(() => location.reload(),
  delay*60_000 + 5_000)` for it — no polling interval, and no client-side
  timezone handling needed since the delay is plain minute arithmetic
  computed against the server's own Canberra-clock `nowTime`. Re-verified
  live against both the local preview and the deployed Fly app after
  shipping: booked a slot, confirmed `nextBoundaryDelay` in the served HTML
  and the active highlight, then (locally) let the scheduled timer fire
  with zero manual interaction and confirmed the highlight cleared itself
  and the console stayed clean. General lesson for this repo: any future
  change to the "happening now" logic needs to be checked by leaving a tab
  open across a real boundary crossing, not just checking the compute
  function returns the right answer for a fixed instant — the bug was
  never in the comparison logic, only in never re-running it.
- **The SSE stream carries no state of its own and has no Last-Event-ID
  replay, so any booking/cancellation broadcast while a client's
  `EventSource` connection is down is silently lost forever until some
  unrelated future event for the same date happens to arrive, or a
  boundary-timer (up to ~24h out) fires.** A dropped connection isn't a
  hypothetical here --- it's exactly what happens on every Fly.io deploy
  restart, an expected, routine occurrence for this app. Confirmed live:
  built against a scratch DB, opened a real tab, killed and restarted the
  actual server process (not a CDP-simulated offline toggle --- tried that
  first and found CDP's `Network.emulateNetworkConditions({offline:
  true})` does *not* sever an already-open SSE connection, a genuine
  methodology finding worth keeping in mind for future live checks), made
  a booking during the outage window, and watched the reconnected tab's
  own re-render not show it (only visible by curling with the booking's
  actual date explicitly, since a UTC-computed test-script date was one
  day behind the app's Canberra-clock "today" at the time of testing ---
  not an app bug, a test-script artifact). Fixed by reloading on every SSE
  `"open"` event after the first (`open` fires on reconnect as well as
  initial connect) in `index.astro`'s inline script --- the only safe
  assumption once reconnected is that something might have changed while
  disconnected. Verified twice live: once demonstrating the bug (event
  genuinely lost across a real kill/restart), once demonstrating the fix
  via a `window` marker that verifiably vanished (proof a real navigation
  fired) within seconds of reconnecting. Locked in with
  `spec/live-updates.test.ts`, which actually runs the shipped inline
  script in jsdom (`runScripts: "dangerously"` + a `beforeParse` hook
  swapping in a `FakeEventSource`) rather than just grepping for a code
  string --- confirmed it fails without the fix via a temporary `git
  stash`. jsdom's `Location.reload` is non-configurable like real
  Chrome's, so the test counts reload calls indirectly via
  `VirtualConsole`'s `"jsdomError"` event (jsdom reports every call to an
  unimplemented navigation API this way), filtered for messages
  containing "navigation" --- worth this technique for any future jsdom
  test needing to spy on a call to `location.reload`/`.assign`/`.href`
  without redefining the property directly. Committed and deployed
  (`de4732c`); confirmed live at both marking viewports post-deploy,
  console clean, no fix needed beyond this.
- **Ran the artefact criterion's HD-band trio — keyboard, resize
  mid-interaction, a slow connection — on this repo for the first time;
  all three came back clean, no fix needed.** Keyboard: a fresh-page Tab
  walk from `<body>` matches DOM order exactly (nav links → date-nav →
  room select → name → start time → end time → submit), a native
  `<input type="time">`'s internal hour/minute segments each consume a
  Tab stop while `document.activeElement` stays pinned to the host
  `<input>` throughout (expected Chromium behaviour, not a bug); native
  HTML5 `required` validation correctly blocks an empty submission and
  moves focus to the first invalid field; a full keyboard-only booking
  (real keystrokes via `agent-browser keyboard type` for the name field,
  the standing `.value` + `input`/`change`-event workaround for the two
  time fields, Tab to the submit button, Enter) succeeded end to end, and
  a keyboard-reached Cancel button (correctly ordered right after the
  date-nav, before the booking form) removed the booking the same way.
  One methodology trap worth flagging: setting a time field's `.value` via
  `eval` *while a Tab sequence was already mid-flight* through that same
  field's internal segments left focus stuck cycling within it
  indefinitely (many Tabs, no further movement, Enter silently no-op'd
  instead of submitting) — not a real page bug, since a fresh reload and
  an untouched Tab walk reached the submit button normally every time;
  the fix was doing the `.value` assignment right after a fresh `.focus()`
  call, before any Tab presses on that field, not interleaved with them.
  Resize mid-interaction: typed into the name field at 1280×800, resized
  live to 390×844 with no reload — the value and focus both survived, and
  a screenshot at the mobile width showed no layout breakage. Slow
  connection: a raw CDP script (same `Target.attachToTarget` flatten-mode
  technique used throughout this file) throttled to 150kbps/400ms via
  `Network.emulateNetworkConditions`, reloaded, and screenshotted at
  350ms intervals — the page is fully server-rendered HTML with no
  external render-blocking assets, so even the first mid-load screenshot
  showed the complete, correctly-styled page (no FOUC to catch, unlike a
  client-hydrated framework); full load completed in ~1.25s with zero
  console errors and zero failed requests, and a real booking submitted
  while the same throttle was still active completed correctly with a
  clean console. Worth noting this HD-band trio is a check this repo
  specifically hadn't had — the wall-clock-boundary and concurrency lenses
  above were this repo's earlier focus — and it came back clean rather
  than finding a fourth bug, a legitimate different outcome from the
  string of fixes above, not evidence the check wasn't worth running.
