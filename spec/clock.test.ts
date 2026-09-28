import { describe, expect, it } from "vitest";
import {
  canberraWallTimeToEpochMs,
  minutesUntilMidnight,
  nextBoundaryDelayMinutes,
  nextReloadDelayMinutes,
  nextReloadTargetEpochMs,
} from "../src/lib/clock";

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

// A tab parked on *tomorrow*'s date view (isToday false) never scheduled a
// reload at all before this existed — nextBoundaryDelay was unconditionally
// null for any non-today view — so real midnight arriving, and that date
// becoming today, would never switch on its "(today)" label or live
// highlighting without a manual reload or another tab's SSE-triggered one.
// See src/pages/index.astro's nextBoundaryDelay for the "view is exactly
// tomorrow" branch this feeds.
describe("minutesUntilMidnight", () => {
  it("counts the minutes left in the day", () => {
    expect(minutesUntilMidnight("09:00")).toBe(15 * 60);
    expect(minutesUntilMidnight("23:50")).toBe(10);
    expect(minutesUntilMidnight("00:00")).toBe(24 * 60);
  });
});

// nextReloadDelayMinutes is wall-clock *minute* arithmetic, which quietly
// assumes a wall-clock minute is always a real minute — false on the two
// nights a year Canberra's clocks shift for daylight saving. 2026-10-04 is
// this year's real spring-forward date (02:00 AEST jumps straight to 03:00
// AEDT). A tab open at 01:00 that night, with nothing left to wait for
// today, gets minutesUntilMidnight("01:00") = 1380 minutes — but real
// Canberra midnight is only 1320 real minutes away, because the day it's
// waiting out is itself an hour short. Scheduling the naive 1380-minute
// delay with setTimeout — as src/pages/index.astro did before this test
// existed — fires the reload 60 real minutes after the date has already
// rolled over, leaving the page showing a stale "(today)" label and
// highlighting for that whole hour.
describe("canberraWallTimeToEpochMs / nextReloadTargetEpochMs (DST safety)", () => {
  it("resolves an ordinary wall-clock date+time to its real UTC instant", () => {
    expect(canberraWallTimeToEpochMs("2026-06-15", "14:30")).toBe(
      new Date("2026-06-15T14:30:00+10:00").getTime(),
    );
  });

  it("returns null for a wall-clock time inside the spring-forward skipped hour", () => {
    expect(canberraWallTimeToEpochMs("2026-10-04", "02:30")).toBeNull();
  });

  it("the naive minute-count for midnight is wrong by exactly the DST offset on the transition night", () => {
    const nowEpoch = canberraWallTimeToEpochMs("2026-10-04", "01:00")!;
    const naiveTargetEpoch = nowEpoch + minutesUntilMidnight("01:00") * 60_000;
    const realMidnightEpoch = canberraWallTimeToEpochMs("2026-10-05", "00:00")!;
    expect(naiveTargetEpoch - realMidnightEpoch).toBe(60 * 60_000);
  });

  it("nextReloadTargetEpochMs lands exactly on real Canberra midnight across the spring-forward night", () => {
    const target = nextReloadTargetEpochMs("2026-10-04", "01:00", []);
    expect(target).toBe(canberraWallTimeToEpochMs("2026-10-05", "00:00"));
  });

  it("nextReloadTargetEpochMs still prefers a sooner same-day booking boundary over midnight", () => {
    const target = nextReloadTargetEpochMs("2026-06-15", "09:00", ["09:30"]);
    expect(target).toBe(canberraWallTimeToEpochMs("2026-06-15", "09:30"));
  });

  it("resolves correctly across the autumn fall-back night too", () => {
    // 2026-04-05 is this year's real fall-back date (03:00 AEDT repeats as
    // 02:00 AEST) — an ordinary hour either side of the repeated one still
    // resolves to its own real instant, not the naive wall-clock guess.
    const target = nextReloadTargetEpochMs("2026-04-05", "01:00", []);
    expect(target).toBe(canberraWallTimeToEpochMs("2026-04-06", "00:00"));
  });
});
