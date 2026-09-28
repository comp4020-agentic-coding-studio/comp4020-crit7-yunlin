# now

**State:** deepen phase, 39h to cutoff at the start of this run. Brief
re-fetched, no drift. Found and fixed a genuinely new bug class — the
wall-clock reload scheduling breaks across a Daylight Saving transition.
Committed, pushed, redeployed, live URL confirmed.

**What I did this run:**

1. Took the last hand-off's advice to find a genuinely new angle rather
   than another concurrency/crafted-input variant. Extended this repo's
   own "boundary enumeration" lens (midnight rollover, tomorrow-view
   rollover, SSE reconnect, crafted-cancel-date broadcast) to a boundary
   *kind* none of those touched: Australian DST transitions.
2. **Bug found**: `nextReloadDelayMinutes` (and the client's
   `setTimeout(delay_minutes * 60_000)`) treated a wall-clock minute as
   always equal to a real minute. False on the two nights a year Canberra
   shifts clocks. Proved it concretely: a tab open at 01:00 Canberra time
   on 2026-10-04 (this year's real spring-forward date) computes
   `minutesUntilMidnight("01:00") = 1380`, but real Canberra midnight is
   only 1320 real minutes away, since that calendar day is itself an hour
   short (02:00 AEST jumps straight to 03:00 AEDT). The naive scheduled
   reload fires 60 real minutes *after* the date has already rolled over —
   a full hour of a stale "(today)" label and stale highlighting, on a
   live-deployed app, for anyone with a tab open that specific night.
3. **Fix** (`bad7b93`): added two functions to `src/lib/clock.ts` —
   `canberraWallTimeToEpochMs(dateStr, hhmm)` (tries both AEST/AEDT
   candidate UTC offsets, keeps whichever one's own Canberra-rendered
   output matches the requested date+time; returns `null` only for the
   skipped spring-forward hour, which never occurs in real time) and
   `nextReloadTargetEpochMs(date, nowTime, boundaries)` (the absolute-epoch
   counterpart to the existing minute-count functions, which are
   unchanged). `index.astro` now computes `nextBoundaryTarget` as this
   absolute epoch instead of a minute count, and the client script
   computes its own delay as `target - Date.now()` at load time instead of
   trusting a minute count computed at render time to still mean the same
   number of real milliseconds by the time it fires. `canberraParts` and
   `shiftDate` moved from a local duplicate in `index.astro` into
   `clock.ts` proper (now shared, no behaviour change).
4. Added 6 new deterministic unit tests to `spec/clock.test.ts`: ordinary
   resolution, the skipped-hour-returns-null case, the exact 60-minute
   naive-vs-correct divergence proof, exact-midnight landing across
   spring-forward, preference for a sooner same-day boundary, and
   correctness across the autumn fall-back night too (2026-04-05, the
   repeated hour). All the original minute-arithmetic functions and their
   tests are untouched — this adds a parallel, DST-safe path rather than
   rewriting the existing one.
5. Live-verified the *ordinary* (non-DST) reload path end-to-end against a
   scratch preview server + scratch SQLite DB, since the whole scheduling
   mechanism was refactored from minute-counts to absolute epochs and a
   real DST transition can't be faked via a headless browser's system
   clock in this environment: booked a room ~75s in the future, opened a
   real `agent-browser` tab, tagged `window.__marker`, waited ~95s,
   confirmed the marker was gone (genuine reload) and the booking now
   rendered with `.active` (the "happening now" highlight correctly
   turned on via the new epoch-based scheduling). Cleaned up all scratch
   artifacts and closed the session afterwards.
6. Re-audited `src/styles.css` for the "one accent, one meaning" rule
   while in there — still clean, `.error` still plain ink, `--seal` still
   only marks the active-booking highlight.
7. `pnpm check` green both before and after live-verification: typecheck
   clean (22 files), build clean, 54/54 tests passing (48 pre-existing +
   6 new). Committed as `bad7b93`, pushed to `origin/main`, deployed with
   `flyctl deploy --remote-only --ha=false -a comp4020-crit7-yunlin`
   (machine reached good state, release v10). Confirmed live:
   `https://comp4020-crit7-yunlin.fly.dev/` and `/readme/` both 200, and
   the served HTML's `nextBoundaryTarget` value decodes to real tonight's
   Canberra midnight — proof the new code, not stale cached content, is
   live.

**Single most important next action:** this closes a seventh independent
lens on this repo (wall-clock boundaries now cover ordinary rollover,
cross-view rollover, *and* DST transitions; plus the two write endpoints'
concurrency/crafted-input surface, the HD-band trio, forced-colors/
contrast, and connection-drop robustness). The next run should look for a
genuinely new angle again rather than a further boundary-arithmetic
variant on this same clock module, which is now thoroughly covered on
both the ordinary and DST fronts. Candidate fresh angles not yet tried on
this repo: whether the SQLite migration/seed boot sequence behaves
correctly if two machine instances somehow raced to boot against an empty
volume simultaneously (Fly with `ha=false` makes this unlikely but worth
a five-minute check of whether it's actually impossible or just
improbable); or a fresh full read-through of `README.md`/`PROCESS.md`
against the app's current actual behaviour, since several fixes have
landed since either was last reread end to end. Still 39h out at this
run's start — not yet finishing steps; reflection and `PROCESS.md`'s
final read-through stay deferred to the run the prompt calls last, per
doctrine. This run's fix has already been backfilled into the repo-local
`memory/MEMORY.md` — no pending sync gap this time.
