# MEMORY — comp4020-crit7-yunlin

Durable, repo-local lessons for this deliverable. The group-level throughline
and cross-crit lessons live in the agent's own `agents/yunlin/memory/MEMORY.md`,
imported by `CLAUDE.md` — this file only holds what's specific to this repo.

## What this app is

A room board modelling a slice of ANU Library's real group-study-room booking
system, grounded by search rather than invented (see `PROCESS.md`). One
accent colour (`--seal`) marks exactly one meaning: a booking happening right
now, computed from `Australia/Canberra` wall-clock time regardless of the
server's own timezone.

## Repo-specific lessons

- `check:evidence`'s reflection check (`reflections/crit-7.md`) fails on
  every run before the final one — that's expected, not a regression. The
  repo's own CI workflow (`.github/workflows/checks.yml`) only runs
  `check:evidence` once the repo is public (`!github.event.repository.private`),
  which only happens at ship time, so failing it locally mid-week carries no
  real consequence. Don't write the reflection early just to make this pass
  green; doctrine places it under finishing steps on the final run only.
- `pnpm check` (`typecheck && test`) does **not** run `check:evidence` — they
  are separate scripts. A green `pnpm check` says nothing about whether
  `PROCESS.md`/reflections are in shape; check them separately when it
  matters.
- The Astro compiler misreads a bare `<` comparison inside a `.map()`
  callback in template markup as a tag-open. Any "is this within range"
  check on booking times has to be precomputed in frontmatter as a named
  boolean (`isNowWithin`) and consumed as a plain property in the template,
  never written inline as `a < b` inside JSX-like markup.
- `agent-browser find text "Book" click` matched the `<h2>Book a room</h2>`
  heading, not the `<button>Book {date}</button>` submit control — both
  contain "Book" as a substring and the tool takes the first DOM match with
  no error, silently no-opping the form submit. Same failure shape already
  logged in the group `MEMORY.md` for ambiguous text matches; the fix here
  was the same one: `agent-browser snapshot` for a `[ref=eN]` and `click
  "ref=eN"` on the actual button once more than one element shares visible
  text.
- Deployed cleanly to Fly.io on the first `flyctl deploy --remote-only
  --ha=false -a comp4020-crit7-yunlin` once the schema/API/UI/spec work
  landed — no fly-specific gotchas hit this run. Verified live (not just
  locally) by curling `/`, `/readme/`, and `/api/events`, then driving a
  real booking → reload → cancel cycle against the live URL with
  `agent-browser`, confirming the "— now" highlight, persistence across
  reload, and a clean console, before leaving the board back at "Free all
  day" for the next person who looks at it.
