"use client";

import { useActionState, useId } from "react";

import { createStudentCalendarEntryAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

const initialState = {
  status: "idle" as const,
  message: "",
  fieldErrors: {} as Partial<Record<"title" | "starts_at" | "ends_at", string>>,
};

export function CalendarAddForm({
  defaultStartsAt,
  plannerEntryTypes,
  plannerStatuses,
}: {
  defaultStartsAt: string;
  plannerEntryTypes: ReadonlyArray<readonly [string, string]>;
  plannerStatuses: ReadonlyArray<readonly [string, string]>;
}) {
  const [state, formAction] = useActionState(createStudentCalendarEntryAction, initialState);
  const titleId = useId();
  const typeId = useId();
  const statusId = useId();
  const startsAtId = useId();
  const endsAtId = useId();
  const allDayId = useId();
  const notesId = useId();
  const startsHelpId = `${startsAtId}-help`;
  const endsHelpId = `${endsAtId}-help`;

  return (
    <form action={formAction} className="grid gap-4 rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-[#536352]">Quick add</p>
        <h2 className="mt-2 text-2xl font-black text-[#1b3022]">Create a planner item</h2>
        <p className="mt-2 text-sm font-medium text-[#536352]">
          Add study targets, mock tests, revision reminders, interview slots, or personal events.
        </p>
      </div>

      {state.message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            state.status === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={titleId} className="block text-sm font-semibold text-[#1b3022]">
          Title
        </label>
        <input
          id={titleId}
          name="title"
          required
          placeholder="What do you want to plan?"
          className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
          aria-invalid={Boolean(state.fieldErrors.title)}
        />
        {state.fieldErrors.title ? <p className="text-sm font-medium text-red-600">{state.fieldErrors.title}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={typeId} className="block text-sm font-semibold text-[#1b3022]">
            Item type
          </label>
          <select id={typeId} name="entry_type" defaultValue="goal" className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            {plannerEntryTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor={statusId} className="block text-sm font-semibold text-[#1b3022]">
            Status
          </label>
          <select id={statusId} name="status" defaultValue="planned" className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            {plannerStatuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={startsAtId} className="block text-sm font-semibold text-[#1b3022]">
            Start date and time
          </label>
          <input
            id={startsAtId}
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={defaultStartsAt}
            aria-describedby={startsHelpId}
            aria-invalid={Boolean(state.fieldErrors.starts_at)}
            className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
          />
          <p id={startsHelpId} className="text-sm text-[#536352]">
            Choose when this task or event should begin.
          </p>
          {state.fieldErrors.starts_at ? <p className="text-sm font-medium text-red-600">{state.fieldErrors.starts_at}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor={endsAtId} className="block text-sm font-semibold text-[#1b3022]">
            End date and time
          </label>
          <input
            id={endsAtId}
            name="ends_at"
            type="datetime-local"
            aria-describedby={endsHelpId}
            aria-invalid={Boolean(state.fieldErrors.ends_at)}
            className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
          />
          <p id={endsHelpId} className="text-sm text-[#536352]">
            Leave this empty for a single timestamp. End time must be later than start time.
          </p>
          {state.fieldErrors.ends_at ? <p className="text-sm font-medium text-red-600">{state.fieldErrors.ends_at}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={allDayId} className="block text-sm font-semibold text-[#1b3022]">
          Time style
        </label>
        <select id={allDayId} name="is_all_day" defaultValue="no" className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
          <option value="no">Timed item</option>
          <option value="yes">All day</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor={notesId} className="block text-sm font-semibold text-[#1b3022]">
          Notes
        </label>
        <textarea
          id={notesId}
          name="notes"
          placeholder="Add details, study topic, target score, checklist, or reminder note"
          className="min-h-32 w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]"
        />
      </div>

      <PendingSubmitButton idleLabel="Save to calendar" pendingLabel="Saving..." className="rounded-2xl bg-[#1b3022] px-5 py-3 text-sm font-semibold text-white" />
    </form>
  );
}
