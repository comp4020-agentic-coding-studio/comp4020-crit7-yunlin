# now

**State:** deepen phase, 159h to cutoff at the start of this run, now further
along. Base build (schema, overlap-checked booking API, cancel, SSE reload,
paper/serif/seal UI, README/CLAUDE.md/PROCESS.md) was already committed and
pushed from the previous run. This run found and fixed a real bug: the
booking write endpoint (`src/pages/api/bookings.ts`) trusted `roomId`/
`date`/`startTime`/`endTime` shape entirely, so a crafted POST bypassing the
HTML form (this repo's own `spec/booking.test.ts` already posts via raw
`fetch`, so this isn't a hypothetical attacker) could (a) crash with an
unhandled `SqliteError`/raw 500 via a nonexistent `roomId` — the foreign-key
constraint fires, but nothing caught it — or (b) write garbage time strings
(e.g. `"0"`/`"9"`) that happened to satisfy the only check
(`startTime < endTime`), corrupting the column the overlap check and the
"happening now" `--seal` highlight both string-compare against. Fixed by
validating room existence and date/time regex shape at the API boundary
(commit `675571d`), added three new tests in `spec/booking.test.ts` proving
each crafted case now gets a graceful redirect with the right error code
instead of a 500 or silent corruption, verified live against both a local
built server and the redeployed Fly app (crafted requests to
`https://comp4020-crit7-yunlin.fly.dev/api/bookings` now redirect with
`error=room`/`error=invalid` instead of crashing), and confirmed the
ordinary booking flow and the error banner still render correctly with
`agent-browser`. `pnpm check` is green (35/35 tests). Deployed
(`flyctl deploy --remote-only --ha=false -a comp4020-crit7-yunlin`), working
tree clean, pushed to `origin/main`.

**What I did this run:** read the brief again from the course API (unchanged
from the previous run's fetch), took stock of the existing build, read every
source file and the existing spec, then looked for a genuine correctness gap
rather than re-verifying what was already checked. Found and fixed the
validation gap above, wrote regression tests, verified live (local build
and the redeployed Fly app), pushed, deployed.

**Single most important next action:** this is not the final run — don't
write `reflections/crit-7.md` yet. Deepen-phase candidates still open, in
roughly the order I'd try them: (1) a live `agent-browser` pass at the
390x844 mobile marking viewport specifically for the booking form and date
nav (never checked this repo at that viewport); (2) `forced-colors`/
`prefers-reduced-motion`/dark-mode media emulation against the `--seal`
active-row highlight and error banner, per the group's standing CDP-script
technique in `MEMORY.md`; (3) whether SQLite's WAL mode plus Fly's single-
machine setup could ever let a stopped/auto-suspended machine lose an
in-flight write — probably not worth chasing without a concrete mechanism,
but worth a `flyctl logs` read if anything looks off; (4) a slow-connection
throttled-load pass per the group's standing artefact-HD-band check. Don't
manufacture a pass if a fresh read of the source turns up nothing — this
run's bug was found by reading every file with a "what could a crafted
request do here" question, not by re-running an existing checklist; the
next run should ask its own new question of the code, not just repeat this
one's technique verbatim.
