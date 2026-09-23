import { beforeAll, describe, expect, inject, it } from "vitest";

// This week's own spec: the brief's three checkable promises for a full-stack
// prototype — the core flow persists across a reload, a real annoyance the
// real system has (double-booking a room) can't happen here, and cancelling
// actually frees the slot — driven against the running app over HTTP, the
// same way the starter's own (now-removed) guestbook test did.
const baseUrl = inject("baseUrl");

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const post = (path: string, body: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

const roomsPage = async (date: string) => {
  const res = await fetch(new URL(`/?date=${date}`, baseUrl));
  return res.text();
};

describe("booking a room", () => {
  const date = "2031-03-17";
  const bookedBy = `spec probe ${process.hrtime.bigint()}`;

  it("accepts a booking and redirects back to the board", async () => {
    const res = await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "1", startTime: "09:00", endTime: "10:00", bookedBy }),
    );
    expect(res.status).toBe(303);
    expect(new URL(res.headers.get("location") ?? "", baseUrl).pathname).toBe("/");
  });

  it("persists the booking: a fresh page load for that date includes it", async () => {
    expect(await roomsPage(date)).toContain(bookedBy);
  });

  it("rejects a second booking that overlaps the first", async () => {
    const clash = `clash ${process.hrtime.bigint()}`;
    const res = await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "1", startTime: "09:30", endTime: "10:30", bookedBy: clash }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("error=conflict");

    const page = await roomsPage(date);
    expect(page).not.toContain(clash);
    expect(page).toContain(bookedBy);
  });

  it("accepts a non-overlapping booking for the same room and date", async () => {
    const later = `later ${process.hrtime.bigint()}`;
    const res = await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "1", startTime: "10:00", endTime: "11:00", bookedBy: later }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).not.toContain("error");
    expect(await roomsPage(date)).toContain(later);
  });

  it("broadcasts a new booking over the SSE stream", async () => {
    const live = `live probe ${process.hrtime.bigint()}`;

    // subscribe first, then post, then read until the event arrives
    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "2", startTime: "13:00", endTime: "14:00", bookedBy: live }),
    );

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes(date)) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before the event arrived");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    expect(received).toContain("event: booking");
  }, 10_000);
});

describe("cancelling a booking", () => {
  const date = "2031-04-02";
  let bookingId: number;

  beforeAll(async () => {
    await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "3", startTime: "15:00", endTime: "16:00", bookedBy: "to be cancelled" }),
    );
    const rows = await fetch(new URL(`/?date=${date}`, baseUrl)).then((r) => r.text());
    const match = rows.match(/\/api\/bookings\/(\d+)\/cancel/);
    if (!match) throw new Error("couldn't find the booking's cancel form");
    bookingId = Number(match[1]);
  });

  it("frees the room: a fresh page load no longer shows the booking", async () => {
    const res = await post(`/api/bookings/${bookingId}/cancel`, new URLSearchParams({ date }));
    expect(res.status).toBe(303);

    const page = await roomsPage(date);
    expect(page).not.toContain("to be cancelled");
    expect(page).toContain("Free all day");
  });

  it("lets the freed slot be booked again", async () => {
    const res = await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "3", startTime: "15:00", endTime: "16:00", bookedBy: "second booker" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).not.toContain("error");
    expect(await roomsPage(date)).toContain("second booker");
  });
});

// The room dropdown and time inputs only ever send well-formed values, but
// nothing stops a request from skipping the form entirely (this file's own
// `post` helper does) — the write endpoint has to reject what the browser
// would never send, not just what a person might type into a real input.
describe("rejecting requests the form itself would never send", () => {
  const date = "2031-05-14";

  it("rejects a room id that doesn't exist, instead of crashing", async () => {
    const res = await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "999", startTime: "09:00", endTime: "10:00", bookedBy: "ghost room" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("error=room");
    expect(await roomsPage(date)).not.toContain("ghost room");
  });

  it("rejects time strings that aren't HH:MM, even ones that sort correctly", async () => {
    const res = await post(
      "/api/bookings",
      new URLSearchParams({ date, roomId: "1", startTime: "0", endTime: "9", bookedBy: "garbage time" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("error=invalid");
    expect(await roomsPage(date)).not.toContain("garbage time");
  });

  it("rejects a date that isn't YYYY-MM-DD", async () => {
    const res = await post(
      "/api/bookings",
      new URLSearchParams({
        date: "not-a-date",
        roomId: "1",
        startTime: "09:00",
        endTime: "10:00",
        bookedBy: "bad date",
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("error=date");
  });
});
