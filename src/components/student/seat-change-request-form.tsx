"use client";

import { useActionState, useId } from "react";

import { requestSeatChangeAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

const initialState = {
  status: "idle" as const,
  message: "",
};

export function SeatChangeRequestForm({
  seats,
}: {
  seats: Array<{ id: string; seat_number: number }>;
}) {
  const [state, formAction] = useActionState(requestSeatChangeAction, initialState);
  const helpId = useId();

  return (
    <form action={formAction} className="mt-6">
      {state.message ? (
        <div
          className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
            state.status === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <p id={helpId} className="mb-3 text-sm text-[#536352]">
        Choose one currently available seat and send a single request for staff approval.
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-8">
        {seats.map((seat) => (
          <label key={seat.id} className="group relative flex cursor-pointer flex-col items-center gap-1">
            <input type="radio" name="new_seat_id" value={seat.id} className="peer sr-only" required aria-describedby={helpId} />
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 border-[#d7ddd3] bg-[#f7faf5] text-[#1b3022] transition peer-checked:border-[#1b3022] peer-checked:bg-[#1b3022] peer-checked:text-white group-hover:border-[#1b3022]/40">
              <span className="text-sm font-black">#{seat.seat_number}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <PendingSubmitButton
          idleLabel="Submit request"
          pendingLabel="Submitting..."
          className="rounded-2xl bg-[#1b3022] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1b3022]/20 transition hover:bg-[#27452e] disabled:opacity-50"
        />
        <p className="text-sm text-[#536352]">You cannot create another request until staff resolves the current one.</p>
      </div>
    </form>
  );
}
