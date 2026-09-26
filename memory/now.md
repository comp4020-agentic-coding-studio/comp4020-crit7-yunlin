# now

**State:** deepen phase, 87h to cutoff at the start of this run. Brief
re-fetched, matches what's already been worked from — no drift. Picked up
the prior hand-off's flagged next action (the cancel path's own concurrency
claim), closed it clean, then found and fixed a real gap in this repo's own
`memory/MEMORY.md`.

**What I did this run:**

1. Read `src/lib/db.ts`'s `cancelBooking`: same no-`await`-in-between shape
   as `addBooking`, whose read-then-write race had already been verified
   live and locked into a test last run. Verified live rather than trusting
   the analogy: built against a scratch DB, fired 5 genuinely concurrent
   `curl` cancels of the same booking id (all 303, exactly one actual
   deletion, no crash), then repeated a cancel-racing-a-new-overlapping-
   booking scenario ~20 times — invariant held every time (the original
   booking is always gone once both requests resolve, and the racer's own
   booking lands iff its own redirect carried no `error=conflict`; never
   both present, never a silent unexplained loss).
2. Turned both checks into permanent regression tests in
   `spec/booking.test.ts` (46/46 green, was 44), committed (`a1df375`).
   Test-only, no runtime behaviour change, so no redeploy needed — same
   judgement as last run's equivalent commit.
3. Followed the hand-off's second suggested angle: reread `PROCESS.md`/
   `README.md` against the current codebase for a claim gone stale.
   Checked page structure (no leftover "Guestbook", the historical bug
   mention in `PROCESS.md` is correctly past-tense), the SSE/boundary
   reload mechanisms in `index.astro` match what both files describe, the
   cited ANU Library URL still resolves (200), and `check:evidence` only
   fails on the reflection marker (expected — deferred to the final run).
   Clean, no stale claims found.
4. While doing that reread I opened this repo's own `memory/MEMORY.md` (not
   just the agent's global one) and found it stopped recording repo-
   specific fixes after the "happening now" staleness bug (`595e3c9`) —
   the midnight-rollover fix (`88d99f1`), the tomorrow-view fix (`84b4328`),
   and the `addBooking` concurrency test (`846a5b7`) had only ever been
   logged in the agent's *global* `agents/yunlin/memory/MEMORY.md`, which
   lives outside this repo and doesn't publish with it. Since this file's
   own header says repo-specific lessons belong here (cross-crit ones go in
   the global file), that's a real gap between what this repo's own memory
   shows and what was actually done — not just a redundant note to skip.
   Backfilled all three missing entries plus this run's cancel-concurrency
   and clean-reread findings, committed.

**Single most important next action:** the concurrency-race lens (both
write endpoints) and the wall-clock boundary-enumeration lens are now both
closed dry, and the stale-claims reread of PROCESS.md/README.md came back
clean too — three fresh angles in a row with nothing new. The next run
should try a genuinely different subsystem rather than a variant of any of
these: candidates worth trying first are (a) whether this repo's own
`memory/MEMORY.md` needs the same backfill check repeated periodically
going forward (a discipline, not a one-off fix) — check it's been kept in
sync with the global file after any future fix, not just this once; and
(b) a lens this repo hasn't tried yet at all, e.g. the CDP-level
forced-colors/DPR/slow-connection checks the crit 4/5 lineage used
extensively but this repo has only tried a subset of (freeze/thaw,
bfcache, forced-colors already done — resize-mid-load-under-throttling and
DPR-rescale on this content-shaped rather than canvas-shaped page haven't).
Not yet at finishing steps; the reflection and any PROCESS.md refresh stay
deferred to the run the prompt calls last, per doctrine.
