# now

**State:** deepen phase, 52h to cutoff at the start of this run. Brief
re-fetched (raw JSON `body`, not just WebFetch's summary), no drift. Closed
both candidates the last hand-off named, plus confirmed the live deploy is
current. No code changes this run.

**What I did this run:**

1. `pnpm check` green (47/47).
2. **In-flight-POST-vs-connection-drop**, the first candidate named last
   run: built a scratch preview server and drove raw TCP sockets (Python,
   not curl, so a Content-Length could be declared without sending the
   promised bytes) at `/api/bookings`.
   - A **truncated body** (client sends half the declared bytes, then
     closes) never reaches `addBooking` at all — Node's HTTP layer throws
     `Error: aborted` in `abortIncoming` before Astro's route handler runs,
     no partial/corrupt row was written, and the server process kept
     serving requests afterwards. Clean.
   - A **complete, valid body whose client closes the socket immediately
     without reading the response** (simulating a tab closed right after
     submit) *did* commit the write and *did* broadcast over SSE to an
     independent observing connection (`curl -N /api/events`, confirmed the
     `event: booking` line arrived) — the desired behaviour, not a bug: a
     user who bails immediately after submitting still gets their booking,
     and other tabs still hear about it. Both directions closed clean.
2. **`/readme/` page's own accessibility/live-region behaviour**, the
   second candidate: confirmed it really has nothing dynamic to check —
   `grep`ped the rendered HTML for `aria-live`/`role=`/`<script` (none),
   confirmed a clean `h1`→`h2` heading hierarchy, and loaded it live with
   `agent-browser` (empty console). This is the "nothing here to check,
   confirm quickly rather than skip it" outcome the last hand-off
   predicted, now actually confirmed rather than assumed.
3. **Live deploy freshness** (not previously logged as its own check):
   `flyctl status` showed the one machine `stopped` (fly.toml's
   `auto_stop_machines`/`auto_start_machines`, expected — cents not
   dollars), and a real `curl` to `https://comp4020-crit7-yunlin.fly.dev/`
   woke it (5s cold start) and served the correct page. `flyctl releases`
   showed v8 deployed ~23.5h before this run's start; `git log --since` on
   every source-relevant path (`src`, `spec`, `Dockerfile`, `fly.toml`,
   `drizzle`, `package.json`) found nothing committed since — the deploy is
   current, no redeploy needed this run.
4. Cleaned up: killed the scratch server, `rm -rf`'d the whole scratch
   directory (WAL-sidecar lesson), closed the `agent-browser` session.
   `git status` clean throughout; no commits this run.

**Single most important next action:** five independent lenses now closed
clean — wall-clock boundaries, concurrency (both write endpoints, complete
requests), the HD-band trio, forced-colors/prefers-contrast, and now
connection-drop robustness plus the `/readme/` page and deploy freshness.
Two small, not-yet-tried candidates for the next run, both quick: (a)
`[id]/cancel.ts` never validates its `date` form field the way
`bookings.ts` validates all of its inputs — reread the code this run and
concluded it's harmless (the field is never persisted, only echoed into a
redirect querystring and an SSE payload no mismatched tab would act on),
but that conclusion was reached by reading, not by a live crafted-request
check, so worth actually trying a garbage `date` value against
`/api/bookings/<id>/cancel` to confirm rather than trust the read; (b) a
rapid double-submit of the same cancel form (two POSTs to the same id
close together) — `cancelBooking` looks idempotent by construction (second
call's `delete` affects zero rows, `bus.emit` is gated on `removed.length
> 0`), but hasn't been driven live the way every other race in this repo
has. If both close clean too, the next run after that should look for a
genuinely different subsystem again rather than a third small validation
gap in the same file. Not yet at finishing steps (52h out); reflection and
`PROCESS.md`'s final read-through stay deferred to the run the prompt
calls last, per doctrine.
