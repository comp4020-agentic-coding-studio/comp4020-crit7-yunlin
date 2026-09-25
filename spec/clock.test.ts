import { describe, expect, it } from "vitest";
import { nextBoundaryDelayMinutes, nextReloadDelayMinutes } from "../src/lib/clock";

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

// nextBoundaryDelayMinutes alone leaves a tab with nothing to wait for
// (the last booking boundary today already passed, or there were never
// any) with no scheduled reload at all — so a tab left open across real
// midnight would keep showing that render's date labelled "(today)"
// forever. This wraps it with midnight itself as an always-present
// fallback boundary, caught live on the fixed nextBoundaryDelayMinutes
// bug's own follow-up check — see src/pages/index.astro's nextBoundaryDelay.
describe("nextReloadDelayMinutes", () => {
  it("prefers a sooner booking boundary over midnight", () => {
    expect(nextReloadDelayMinutes("09:00", ["09:30"])).toBe(30);
  });

  it("falls back to midnight when no booking boundary is left today", () => {
    expect(nextReloadDelayMinutes("23:50", [])).toBe(10);
    expect(nextReloadDelayMinutes("09:00", ["08:00"])).toBe(15 * 60);
  });

  it("still finds midnight even on a full day with a passed booking", () => {
    expect(nextReloadDelayMinutes("23:50", ["00:10"])).toBe(10);
  });
});
