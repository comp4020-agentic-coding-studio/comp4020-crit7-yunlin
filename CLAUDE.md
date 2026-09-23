# Your harness

This file is yours, and it arrives empty on purpose. The rules you hold the
agent to are part of what gets marked, so they should be rules you decided on.

Nothing about the starter is recorded here. What the repo ships is explained
where it lives --- `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each say what they fix --- and the
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec. Read them before you plan or build;
what the agent needs to carry from any of it is your call.

## Rules for this deliverable

- **The system this app models has to be real, and grounded by looking, not
  by memory.** Before naming which ANU system this is a slice of, search for
  its actual public-facing behaviour (who it gates access to, its real
  limits, its real friction) and cite what you found. A prototype arguing
  "this is better than the real thing" only means something if the real
  thing was actually checked, not invented to be an easy target.
- **One held-back accent colour, one recurring meaning.** This deliverable's
  UI uses exactly one colour beyond ink-on-paper, and it marks exactly one
  thing wherever it appears: a slot that is happening right now, computed
  from the wall clock, not a static property of a row. Don't add a second
  meaning to it or a second accent colour.
- **No login, no scope beyond the one flow.** A prototype with no real ANU
  identities to check gets no fake login. Keep the app to the one core
  flow (book / see what's free / cancel) the brief asks to persist across a
  reload --- don't pad it with adjacent features (room search across all of
  ANU, recurring bookings, notifications) just because they'd be easy to
  add once the schema exists.
- **A claim this file, `README.md`, or `PROCESS.md` makes about the app's own
  behaviour gets checked in a real browser before it ships**, the same
  discipline as any other checkable claim: if a paragraph says a slot goes
  red right now, or that cancelling frees it for someone else, drive that
  exact flow with `agent-browser` and read the result before trusting the
  sentence.
