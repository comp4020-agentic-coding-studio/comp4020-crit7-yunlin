# now

**State:** deepen phase, 93h to cutoff at the start of this run. Brief
re-fetched (WebFetch only summarised it, not verbatim, but the summary
matches what's already been worked from in prior runs — no drift). This run
closed out the boundary-enumeration lens as genuinely dry, then found one
real, non-redundant gap in a different family: a live concurrency check on
the booking API that had never been tried.

**What I did this run:**

1. Checked the prior hand-off's flagged angle: a tab parked on
   `/?date=<yesterday>` (or any past date). Read `index.astro`:
   `nextBoundaryDelay` is `null` for any date that isn't today or tomorrow,
   and `isNowWithin` is hard-gated on `isToday`, so a past date's view never
   highlights anything live and never needs a reload. Confirmed live against
   the built preview server — `nextBoundaryDelay` was `null` for both
   yesterday and two-days-ago. Clean, no fix needed. This closes the
   boundary-enumeration lens (highlight staleness → midnight rollover →
   tomorrow-view rollover → yesterday-view, four checks, three fixed one
   clean) as dry — the next fresh angle should not be a fifth variant of
   "which wall-clock boundary did we miss."
2. Swept every off-screen text channel (meta description, aria-labels,
   `<title>`) against this crit's own "no login, no scope beyond the one
   flow" and "one accent, one meaning" rules, the lens crit 5's hand-off
   flagged as untried here. Found: no OG tags exist at all (not a violation,
   just an absence nobody's asked for), the one meta description and every
   aria-label describe only the book/see/cancel flow, and `grep -n "seal"
   src/styles.css` confirmed `--seal` is used in exactly one place
   (`.room li.active` / `.time::after`) — the error-banner leak this repo
   already fixed (`25f297f`) stayed fixed. Clean pass, no fix needed.
3. With both standing lenses now dry, read `src/pages/api/bookings.ts` and
   `src/lib/db.ts` fresh for a genuinely different question: `db.ts`'s own
   comment on `addBooking` claims "nothing else touches the database between
   the read and the write, because better-sqlite3's calls are synchronous"
   — a checkable claim about the app's own behaviour that had never actually
   been driven with real concurrent requests. Verified live: fired 2-way and
   then 5-way *genuinely concurrent* `curl` POSTs (real parallel OS
   processes, not sequential awaits) at the same room/date/overlapping time
   against the built preview server (needed `-H "Origin: ..."` — Astro's CSRF
   check 403s a bare cross-origin POST). Every run: exactly one booking
   landed, every other request got `error=conflict`, no double-booking in
   the rendered board. Confirmed the claim rather than just trusting the
   reasoning.
4. Turned that live check into a permanent regression test rather than
   leaving it as a one-off: added "booking the same slot from multiple
   requests at once" to `spec/booking.test.ts`, using `Promise.all` over five
   real overlapping `fetch` calls against the test harness's own running app
   server (`inject("baseUrl")`) — genuine concurrent HTTP requests, not
   mocked. Asserts exactly one wins, the rest get `error=conflict`, and the
   rendered board shows the slot exactly once. `pnpm check` now 44/44 (was
   43). Committed (`846a5b7`), pushed. Not deployed — this is a test-only
   commit with no runtime/behaviour change, so the live app doesn't need to
   catch up for anything user-visible to change.

**Single most important next action:** two full lenses (wall-clock boundary
enumeration, off-screen text/scope) are now dry, and the concurrency-race
angle that just paid off is itself a family worth one more look before
declaring *that* dry too: `addBooking`'s cancel path
(`api/bookings/[id]/cancel.ts`) hasn't had the same live-concurrency check —
what happens if two requests try to cancel the same booking at once, or if a
cancel and a new overlapping booking race each other? Read
`src/lib/db.ts`'s cancel function first; if it's the same synchronous
single-statement shape as `addBooking` the answer is probably "still safe by
the same reasoning," but confirm it live with real concurrent curl requests
before trusting that by analogy alone, the same discipline this run just
used for the booking path. If that comes back clean too, the concurrency
lens is likely dry as well, and the next angle should probably come from
rereading `PROCESS.md`/`README.md` against this repo's own three
CLAUDE.md rules (real-system grounding, one accent, no-login-no-scope) for
a claim that's gone stale as the codebase evolved, rather than manufacturing
a fourth interaction-robustness variant.
