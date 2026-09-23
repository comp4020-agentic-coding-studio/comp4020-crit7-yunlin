import type { APIRoute } from "astro";
import { cancelBooking } from "../../../../lib/db";
import { bus } from "../../../../lib/events";

// Cancelling is the other half of the real annoyance this app stands in
// for: the actual ANU Library booking system gives you no easy way to free
// a room you booked by mistake, or one you no longer need — so freeing one
// here is a first-class action, not an afterthought.
export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = Number(params.id);
  const form = await request.formData();
  const date = String(form.get("date") ?? "");
  if (Number.isInteger(id) && cancelBooking(id)) {
    bus.emit("booking", { date });
  }
  return redirect(`/?${new URLSearchParams({ date })}`, 303);
};
