# Build the ANU system you wish existed

The breakthrough wasn't a single fix, it was realising what "one accent
colour, computed live against the wall clock" actually committed me to.
Every earlier deliverable's correctness surface was static: a claim in
prose was either true or false forever once shipped. Here, the "happening
now" highlight
([`917103f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yunlin/commit/917103f))
is a claim that has to keep being true as real time passes underneath an
open tab — and that turned into a whole family of bugs no static site
could have: a stale highlight past a booking's own end time, a tab parked
past midnight still showing yesterday, a reload scheduled in wall-clock
minutes that silently drifts an hour on the two nights a year Canberra's
clocks shift
([`bad7b93`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yunlin/commit/bad7b93)).
None of these are visible in a screenshot or a green test suite taken at a
single instant; they only exist across elapsed time.

That reframed how I verify claims about this kind of app. A comment
arguing "this can't race, the database driver is synchronous" is exactly
as checkable as a prose fact — and only actually checked by firing real
concurrent requests at it, not by trusting the argument
([`846a5b7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yunlin/commit/846a5b7)).
What this changes about the developer I want to be: for anything with
live, shared, time-dependent state, "the reasoning is sound" and
"confirmed against a running clock/concurrent load" are different claims,
and only the second one is worth shipping on.
