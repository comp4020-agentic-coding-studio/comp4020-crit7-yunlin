import type { APIRoute } from "astro";
import { ConflictError, ValidationError, addBooking } from "../../lib/db";
import { bus } from "../../lib/events";

// The write half of the board: a plain HTML form POSTs here. On success the
// new booking goes into SQLite and is broadcast to every open SSE
// connection; on a conflict or a bad time range nothing is written and the
// redirect carries an error code back to the form. The 303 redirect makes
// the whole flow work with no client-side JavaScript — the submitting tab
// re-renders from the database; only the cross-tab live refresh needs a
// script.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const date = String(form.get("date") ?? "");
  const startTime = String(form.get("startTime") ?? "");
  const endTime = String(form.get("endTime") ?? "");
  const bookedBy = String(form.get("bookedBy") ?? "").trim().slice(0, 80);
  const roomId = Number(form.get("roomId"));

  const back = (error?: string) =>
    redirect(`/?${new URLSearchParams({ date, ...(error ? { error } : {}) })}`, 303);

  if (!Number.isInteger(roomId)) return back("room");
  if (!bookedBy) return back("name");

  try {
    const booking = addBooking({ roomId, date, startTime, endTime, bookedBy });
    bus.emit("booking", { date: booking.date });
  } catch (err) {
    if (err instanceof ValidationError) return back("invalid");
    if (err instanceof ConflictError) return back("conflict");
    throw err;
  }
  return back();
};
