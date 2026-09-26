# now

**State:** deepen phase, 76h to cutoff at the start of this run. Brief
re-fetched, no drift. Picked up the prior hand-off's second candidate (an
untried lens on this content-shaped page), found and fixed a real bug —
the first genuine functional defect found in several runs, not another
clean-check angle.

**What I did this run:**

1. Found the SSE live-update channel has no replay/Last-Event-ID
   mechanism: any booking/cancellation broadcast while a client's
   `EventSource` is disconnected is silently lost forever, and a
   disconnect isn't hypothetical here — it's exactly what a Fly.io
   deploy restart does to every open tab. Confirmed live by killing and
   restarting the real server process mid-session (not a CDP offline
   toggle — tried that first, found it doesn't sever an open SSE
   connection at all, a real methodology gotcha now logged) and watching
   a booking made during the outage never surface on the reconnected tab.
2. Fixed by reloading on every SSE `"open"` event after the first, in
   `src/pages/index.astro`'s inline script. Verified the fix live via a
   `window` marker that verifiably vanished (proof of a real navigation)
   within seconds of a reconnect.
3. Added `spec/live-updates.test.ts`: runs the actual shipped inline
   script in jsdom (`runScripts: "dangerously"` + `beforeParse` swapping
   in a `FakeEventSource`), counting reload calls via `VirtualConsole`'s
   `"jsdomError"` event since `Location.reload` isn't redefinable.
   Confirmed it fails without the fix via a temporary `git stash`.
4. `pnpm check` green (47/47), committed (`de4732c`), deployed
   (`flyctl deploy --remote-only --ha=false -a comp4020-crit7-yunlin`),
   confirmed live: curl 200 + fix's marker string present, then a full
   `agent-browser` pass against the live URL at both marking viewports
   (desktop screenshot, 390x844 screenshot) — console clean at both, no
   errors. No leftover local servers from this repo (checked `ps`/`ss`).
5. Backfilled this run's findings into both memory files (repo-local
   `memory/MEMORY.md` and the agent's global one), per the standing
   discipline the last few hand-offs have flagged to keep them in sync
   rather than logging only in the global file.

**Single most important next action:** this closes the "content-shaped
page hasn't tried this lens yet" line from the prior hand-off's second
candidate — worth checking whether the remaining untried ones there
(DPR-rescale, resize-mid-load-under-throttling specifically) still apply,
or picking a genuinely fresh angle if a re-read finds those already
covered elsewhere. Also worth: after several runs finding either clean
results or wrap-up-style checks, this run found a real, previously-shipped
functional bug (data loss across a deploy restart) — a reminder that
"reread the page's own claims/comments for something not yet verified
end-to-end" (this bug came from taking the inline script's own comment
about SSE literally and asking what happens on disconnect, not just on
receipt) is still a productive lens even this deep into deepen phase, not
just the wall-clock/concurrency lenses already exhausted. Not yet at
finishing steps; reflection and PROCESS.md refresh stay deferred to the
run the prompt calls last, per doctrine.
