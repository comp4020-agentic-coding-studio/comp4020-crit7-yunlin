# now

**State:** deepen phase, 100h to cutoff at the start of this run. Brief
re-fetched, unchanged. This run closed the exact "tomorrow's view rolling
into today" angle the prior hand-off flagged as untried, and it was a real
gap — plus checked (and ruled out) a `related`-field question the prior
hand-off hadn't raised.

**What I did this run:**

1. Fetched `crits/06-a2-retro`'s own page text, since crit 7's `related`
   list names it and the doctrine says a named `-retro` crit means
   `PROCESS.md` has to carry an explicit breakthrough with before/after.
   That retro's own wording is explicitly about "the `PROCESS.md` you
   submitted with Assignment 2" — a different, already-completed
   deliverable, not this one. Concluded the rule doesn't apply to this
   repo's own `PROCESS.md`: the retro already presented from Assignment
   2's file, and this crit's `related` entry is just chronological/
   contextual, not a fresh ask of this repo. No change made — a checked,
   ruled-out finding, not a clean-pass one.
2. Followed up on the prior hand-off's flagged angle: does a tab parked on
   `/?date=<tomorrow>` (an explicit forward date-nav click) ever pick up
   that its date has become today once real midnight passes? Read
   `index.astro`: `nextBoundaryDelay` was unconditionally `null` for any
   `!isToday` view, so no reload was ever scheduled — confirmed live
   against the built preview server (curl'd the rendered
   `const nextBoundaryDelay = null;` for a `?date=` one day ahead, before
   touching anything).
3. **Fixed it**: extracted `minutesUntilMidnight` out of
   `nextReloadDelayMinutes` in `src/lib/clock.ts` (same arithmetic, no
   behaviour change to the existing function or its tests), then added a
   branch in `index.astro`: when the view is exactly tomorrow
   (`date === shiftDate(today, 1)`), schedule a reload at
   `minutesUntilMidnight(nowTime)`; any date further out still gets `null`
   (no near-term boundary worth waiting for — nobody parks a tab days
   ahead waiting for it to become today). Added
   `spec/clock.test.ts` coverage for `minutesUntilMidnight`. `pnpm check`
   now 43/43.
4. Verified live against a freshly built preview server at the real
   current Canberra time (08:35): tomorrow's `?date=` view rendered
   `nextBoundaryDelay = 925` (exactly minutes-to-midnight, matching
   today's own value since neither has bookings), while a `?date=` two
   days out correctly stayed `null`. Also caught and worked around a
   footgun while doing this: `PORT=4399`/`4501` etc. can already be held
   by an unrelated project in this shared sandbox (this run hit an "AI
   Tracker" app's page instead of the room board on first try) — `ss
   -ltnp` plus checking the response's own `<title>` before trusting a
   curl result is what caught it.
5. Committed (`84b4328`), pushed, deployed
   (`flyctl deploy --remote-only --ha=false -a comp4020-crit7-yunlin`),
   and verified the live URL directly: `/` and `/readme/` both 200, the
   served HTML's `nextBoundaryDelay` for a `?date=` one day ahead matched
   the live wall clock (923 minutes to midnight, a couple of minutes
   after the preview check), and an `agent-browser` pass against the live
   URL showed a clean console.

**Single most important next action:** this is not the final run — don't
write `reflections/crit-7.md` yet. The "enumerate every wall-clock
boundary the page's live claims depend on" lens has now closed three real
gaps in a row (highlight staleness, midnight rollover on the default view,
tomorrow's view rolling into today) — worth checking, before assuming a
fourth pass in this same family will find anything, whether there's a
symmetric gap on the *other* side: a tab parked on `/?date=<yesterday>`
(or any past date) never needs a reload since a past day's data is stable
and nothing about it will ever become "today" again — but confirm that
reasoning live rather than trusting it, the same discipline as every other
entry in this family, before ruling it out. If that comes back clean/
out-of-scope, the boundary-enumeration lens is likely genuinely dry, and
the next fresh angle should probably come from rereading every off-screen
text channel (aria-labels, meta description, the OG image if one exists)
against this crit's own "one accent, one meaning" and "no login, no scope
beyond the one flow" rules — a lens that paid off repeatedly on crit 5 but
hasn't yet had a dedicated pass on this repo.
