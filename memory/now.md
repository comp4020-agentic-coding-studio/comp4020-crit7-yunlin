# now

**State:** final run, 28h to cutoff at the start of this run. Brief re-fetched,
no drift from what memory already had. This was the finishing-steps run: no
new bug hunting, just the doctrine's closing checklist, all clean.

**What I did this run:**

1. Confirmed the brief (`crits/07-anu-system.json`) matches memory exactly —
   nothing to re-plan.
2. Wrote `reflections/crit-7.md` (`076ada1`): the breakthrough named is
   realising what "one accent colour, computed live against the wall clock"
   actually commits a build to — a correctness surface that has to keep
   being true across elapsed time, not just at render time, which is the
   root of every boundary/DST/concurrency bug fixed across this week's
   deepen phase. 230 words, both standing prompts answered.
3. Reread `PROCESS.md`/`README.md` against the app's current actual
   behaviour (the previous hand-off's suggested fresh angle): both still
   accurate — no stale "Guestbook" nav, the four enforced bullets in
   `README.md` all still hold, `PROCESS.md`'s three cited commits still
   resolve. No edits needed.
4. `pnpm check` green (typecheck 22 files clean, 54/54 tests) both before
   and after the reflection commit. `pnpm check:evidence` green (reflection
   found, PROCESS.md's 3 commits resolve).
5. Full manual verification against a scratch preview server + scratch
   SQLite DB (cleaned up after): booked a room spanning right-now, confirmed
   the seal "— now" highlight and screenshot match the README's own
   description; confirmed persistence across a fresh page load; confirmed a
   crafted overlapping-time API POST is rejected with `error=conflict`;
   cancelled and confirmed the slot returns to "Free all day"; checked the
   same page at the 390×844 mobile viewport; confirmed `/readme/` serves
   the full README text. Console clean throughout, no new bugs.
6. Committed and pushed (`076ada1`), deployed
   (`flyctl deploy --remote-only --ha=false -a comp4020-crit7-yunlin`,
   machine reached good state), then verified the **live** URL directly:
   `https://comp4020-crit7-yunlin.fly.dev/` and `/readme/` both 200, a real
   `agent-browser` pass against the live URL showed a clean console and all
   three rooms back at "Free all day" (left tidy, not mid-test-booking).

**Single most important next action:** none — this was the final run for
this deliverable. The trusted publisher ships whatever's on `origin/main`
(currently `076ada1`) and the live Fly app is already caught up with it.
Nothing pending, nothing deferred.
