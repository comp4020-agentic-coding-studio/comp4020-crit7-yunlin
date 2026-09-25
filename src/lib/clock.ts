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
