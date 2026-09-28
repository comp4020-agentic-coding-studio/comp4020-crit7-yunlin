# now

**State:** deepen phase, 45h to cutoff at the start of this run. Brief
re-fetched, no drift. Found and fixed a real bug from the last hand-off's
two named candidates; the second candidate turned out to already be
covered. Committed, pushed, redeployed, live URL confirmed.

**What I did this run:**

1. **Candidate (a), the crafted `date` field on `[id]/cancel.ts`** — the
   last hand-off correctly flagged this as read-but-not-live-checked. Built
   a scratch preview server, booked a real room, opened a real `curl -N
   /api/events` observer, then POSTed a cancel with `date=not-a-real-date`.
   Confirmed a **real bug**: the cancellation deleted the row correctly,
   but broadcast `{"date":"not-a-real-date"}` over SSE — so a genuine
   observer tab parked on the booking's real date (`payload.date === date`
   in `index.astro`'s inline script) never matched and silently missed the
   cancellation, staying stale until some *other* event on that date
   happened to fire, or midnight. This breaks the app's own stated
   live-update guarantee for exactly the crafted-request path this repo's
   own standing practice says to check.
   - Root cause: `cancel.ts` broadcast the client-submitted form field
     directly, unlike `bookings.ts` (which broadcasts `booking.date`, the
     value returned from the DB after validation) — an inconsistency
     between the two write endpoints' own broadcast pattern that a reread
     surfaced once the live check confirmed it mattered.
   - Fix (`cbd021b`): `cancelBooking` (`src/lib/db.ts`) now returns the
     deleted row's own `date` (or `null`) instead of a bare boolean;
     `cancel.ts` broadcasts that authoritative value. The redirect still
     uses the submitted field, since that only picks which view the
     submitting browser lands on — harmless even if a client lies to
     itself.
   - Added a regression test (`spec/booking.test.ts`, "cancelling with a
     crafted, mismatched date field") that posts a real crafted request
     over `fetch` and reads the real SSE stream, asserting the broadcast
     date matches the booking's real date and never contains the crafted
     value.
   - Reverified live in a real `agent-browser` tab (not just the vitest
     regression): booked a room, opened the board on today's date in a
     real tab, tagged `window.__marker`, cancelled via a raw `curl` with a
     bogus date, and confirmed the tab actually reloaded (marker gone,
     cancelled booking no longer shown) — the exact behaviour that was
     broken before the fix.
2. **Candidate (b), rapid double-submit of the same cancel form** — turned
   out to already be closed. `spec/booking.test.ts`'s "cancelling the same
   booking from multiple requests at once" (added two runs ago, `a1df375`)
   already drives 5 genuinely concurrent cancel POSTs via `Promise.all` and
   asserts no error and exactly-once cancellation. The prior hand-off's
   claim that this "hasn't been driven live" was stale/mistaken — worth
   rereading the actual spec file before treating a memory-recalled gap as
   real, not just trusting the previous hand-off's own wording. No new
   test needed; `cancelBooking`'s new `string | null` return (from the
   fix above) is exercised by this existing concurrent test too (still
   green: only the one request that actually deletes a row gets a non-null
   date and emits; the other four get `null` and skip the emit, which is
   the same one-emit-per-real-change invariant `addBooking`'s overlap
   check already has).
3. `pnpm check` green (48/48, one new test). Committed, pushed to
   `origin/main`, deployed with `flyctl deploy --remote-only --ha=false`,
   confirmed `https://comp4020-crit7-yunlin.fly.dev/` and `/readme/` both
   200 on the redeployed machine.
4. Scratch servers/DBs fully cleaned up (`rm -rf` the whole scratch dir
   each time, per the WAL-sidecar lesson), `agent-browser` session closed,
   `git status` clean.

**Single most important next action:** this closes the last two named
candidates from the deepen list (one real bug fixed, one confirmed
already covered) — six independent lenses have now found real, fixed
bugs or clean results across this repo's two write endpoints, the
wall-clock boundaries, the HD-band trio, forced-colors/contrast, and
connection-drop robustness. The next run should look for a genuinely new
angle rather than a further variant of concurrency/crafted-input checking
on these same two endpoints, which is starting to feel thoroughly
exhausted. Still 45h out at this run's start — not yet finishing steps;
reflection and `PROCESS.md`'s final read-through stay deferred to the run
the prompt calls last, per doctrine. Worth also glancing at whether this
run's fix (the `cancelBooking` return-type change) needs backfilling into
the repo-local `memory/MEMORY.md` too, per the standing "the two memory
files don't stay in sync automatically" lesson — not yet done this run,
should be first thing next run if not done here.
