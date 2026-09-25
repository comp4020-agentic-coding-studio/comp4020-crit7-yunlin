import { describe, expect, it } from "vitest";
import { nextBoundaryDelayMinutes } from "../src/lib/clock";

// Caught live, against the running app, before this existed: the "happening
// now" highlight is computed once per render, so a tab left open across a
// booking's start or end minute kept showing that render's stale answer
// forever unless some other tab's booking happened to trigger a reload
// first. This is the pure minute-arithmetic this fix schedules a reload
// from — see src/pages/index.astro's nextBoundaryDelay.
describe("nextBoundaryDelayMinutes", () => {
  it("finds the nearest future boundary among several", () => {
    expect(nextBoundaryDelayMinutes("09:00", ["09:30", "10:00", "09:05"])).toBe(5);
  });

  it("ignores boundaries at or before now", () => {
    expect(nextBoundaryDelayMinutes("09:00", ["08:00", "09:00"])).toBeNull();
  });

  it("returns null with no boundaries today", () => {
    expect(nextBoundaryDelayMinutes("09:00", [])).toBeNull();
  });

  it("doesn't wrap past midnight — a booking never spans two days here", () => {
    expect(nextBoundaryDelayMinutes("23:50", ["00:10"])).toBeNull();
  });
});
