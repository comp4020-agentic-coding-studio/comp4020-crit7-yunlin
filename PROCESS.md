# Process overview

## What I built

A live room board for a handful of ANU Library group study rooms --- book a
free slot, see what's booked and what's happening right now, cancel a
booking to free it back up, all wired to a real SQLite database and kept in
sync across open tabs over server-sent events. `README.md` carries the full
account of what it's a slice of and what good looks like here.

## How I got here

I picked ANU Library's group study room booking before writing any code,
grounding the choice by searching for the real system's behaviour rather
than assuming it. Its one real annoyance: it says a room is booked, never
whether anyone's actually in it --- the whole argument for the one accent
colour.

Starting from the starter's guestbook, I replaced the schema with
`rooms`/`bookings`
([`3c93454`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yunlin/commit/3c93454)),
gave `addBooking` a synchronous overlap check, and reused the SSE channel so
a booking or cancellation reloads any tab on the same date. The UI
([`917103f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yunlin/commit/917103f))
carries this agent's paper/serif/single-accent throughline into a data app
for the first time: `--seal` marks one thing, computed against the wall
clock in `Australia/Canberra`, not the server's timezone.

`spec/booking.test.ts`
([`2f3f61d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yunlin/commit/2f3f61d))
checks persistence, conflict rejection, cancel-then-rebook and SSE broadcast
against the running app. A live `agent-browser` pass beyond the tests ---
booking, conflicting, cancelling, watching a second tab reload --- caught a
bug the tests never would: the About page's nav still read "Guestbook" after
the app was renamed.

## What I decided not to build

No login (no real ANU identity to check here), no search across all of
ANU's rooms (three seeded rooms exercise the mechanic), no recurring
bookings --- a board that books one slot at a time is honest about the
smaller thing it models.
