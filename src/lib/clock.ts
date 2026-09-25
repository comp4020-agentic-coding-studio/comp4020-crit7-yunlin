function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// The "happening now" highlight (src/pages/index.astro's isNowWithin) is
// computed once, at render time, against `nowTime`. Nothing else on the page
// re-checks the wall clock, so a tab left open across a booking's start or
// end minute would keep showing that render's answer forever unless some
// other tab's booking happens to trigger the SSE reload first. This computes
// how long, in minutes, until the next such boundary today — the moment the
// page's own answer would go stale — so the client can schedule exactly one
// reload for then, rather than polling on an interval.
export function nextBoundaryDelayMinutes(nowTime: string, boundaries: string[]): number | null {
  const now = toMinutes(nowTime);
  const future = boundaries.map(toMinutes).filter((m) => m > now);
  return future.length > 0 ? Math.min(...future) - now : null;
}

// A tab can be left open on a day with no booking boundaries left to wait
// for (the last one already passed, or there were never any today) — in
// which case nextBoundaryDelayMinutes alone schedules nothing, and the
// board's date-nav "(today)" label and its whole rendered date would stay
// stuck on the render's day forever once real midnight passes. This always
// finds a reload time within the next 24h by treating midnight itself as a
// boundary, so the day rolls over on its own even with nothing booked.
export function nextReloadDelayMinutes(nowTime: string, boundaries: string[]): number {
  const now = toMinutes(nowTime);
  const untilMidnight = 24 * 60 - now;
  const bookingDelay = nextBoundaryDelayMinutes(nowTime, boundaries);
  return bookingDelay === null ? untilMidnight : Math.min(bookingDelay, untilMidnight);
}
