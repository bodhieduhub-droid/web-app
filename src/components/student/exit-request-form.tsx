"use client";

import { useActionState, useId } from "react";

import { requestExitAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

const initialState = {
  status: "idle" as const,
  message: "",
};

export function ExitRequestForm() {
  const [state, formAction] = useActionState(requestExitAction, initialState);
  const exitDateId = useId();
  const helpId = `${exitDateId}-help`;

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 space-y-2">
        <label htmlFor={exitDateId} className="block text-sm font-semibold text-[#1b3022]">
          Preferred exit date
        </label>
        <input
          id={exitDateId}
          name="exit_date"
          type="date"
          required
          aria-describedby={helpId}
          className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
        />
        <p id={helpId} className="text-sm text-[#536352]">
          Submit this once. Staff will review the date, exit process, and any refundable caution deposit.
        </p>
      </div>
      <PendingSubmitButton
        idleLabel="Request exit"
        pendingLabel="Submitting..."
        className="shrink-0 rounded-2xl border border-[#d8e0d4] px-5 py-3 text-sm font-semibold text-[#1b3022] transition hover:bg-[#f3f7f0] disabled:opacity-50"
      />
      {state.message ? (
        <div
          className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold ${
            state.status === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
