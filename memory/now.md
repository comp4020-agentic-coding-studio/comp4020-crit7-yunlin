# now

**State:** deepen phase, 69h to cutoff at the start of this run. Brief
re-fetched, no drift. Ran the artefact criterion's own named HD-band trio
— "the keyboard, a resize mid-interaction, a slow connection" — on this
repo for the first time (repo-local memory had no prior entry for any of
the three). All three came back clean; no code changes this run.

**What I did this run:**

1. Built (`pnpm check` green, 47/47) and ran the built preview server
   against a scratch DB (`/tmp/crit7-check/app.db`, deleted the whole
   scratch directory afterwards per the standing WAL-sidecar lesson) on a
   fresh port — 4398/4399 were already held by an unrelated project in
   this shared sandbox, confirming the standing port-collision footgun.
2. Keyboard: fresh-page Tab walk from `<body>` matches DOM order exactly;
   native `required` validation blocks empty submission and moves focus to
   the first invalid field; a fully keyboard-driven booking (real
   keystrokes for the name field via `agent-browser keyboard type`, the
   `.value`+`input`/`change`-event workaround for the two time fields, Tab
   to submit, Enter) succeeded end to end; a keyboard-reached Cancel
   button (correctly ordered before the booking form) removed it the same
   way. Found and logged a new methodology footgun along the way: setting
   a time field's `.value` via `eval` *while a Tab sequence is already
   mid-flight through that field's own internal segments* leaves focus
   stuck cycling in it forever — not a real page bug (a fresh, untouched
   Tab walk always reaches the submit button normally); fix is doing the
   `.value` assignment right after a fresh `.focus()`, not interleaved
   with Tab presses on that same field.
3. Resize mid-interaction: typed into the name field at 1280×800, resized
   live to 390×844 with no reload — value and focus both survived, no
   layout breakage (screenshotted to confirm).
4. Slow connection: raw CDP script (`Target.attachToTarget` flatten mode,
   same technique logged throughout this file), throttled to
   150kbps/400ms via `Network.emulateNetworkConditions`. Page is fully
   server-rendered HTML with no external render-blocking assets, so even
   the first 350ms mid-load screenshot showed the complete, correctly
   styled page — no FOUC to catch. Full load ~1.25s, zero console errors,
   zero failed requests. A real booking submitted while the same throttle
   was still active completed correctly with a clean console.
5. Backfilled both memory files (repo-local and global) with the clean
   HD-band result and the new time-input-Tab-race footgun. No commits
   this run — nothing broke, nothing to fix; working tree stayed clean
   throughout (confirmed via `git status` before finishing).

**Single most important next action:** the HD-band trio is now closed
clean for this repo, joining the wall-clock-boundary and concurrency
lenses as exhausted angles. Next run needs a genuinely fresh question,
not a re-verification of any of these three — candidates not yet tried
here specifically: a forced-colors/prefers-contrast pass (done on crit 5's
canvas game, never on this form-based page), or rereading `README.md`/
`PROCESS.md` against the current code one more time now that this run's
work has landed (last confirmed clean a few runs back, before the
SSE-reconnect fix). Not yet at finishing steps — reflection and
`PROCESS.md` refresh stay deferred to the run the prompt calls last, per
doctrine.
