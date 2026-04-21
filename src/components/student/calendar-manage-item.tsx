"use client";

import { useActionState, useId, useState } from "react";

import { deleteStudentCalendarEntryAction, updateStudentCalendarEntryAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { StudentCalendarEntryRecord } from "@/lib/app-types";

const initialState = {
  status: "idle" as const,
  message: "",
  fieldErrors: {} as Partial<Record<"title" | "starts_at" | "ends_at", string>>,
};

function formatDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function labelFromValue(value: string) {
  return value.replaceAll("_", " ");
}

export function CalendarManageItem({
  entry,
  plannerEntryTypes,
  plannerStatuses,
  chipClassName,
}: {
  entry: StudentCalendarEntryRecord;
  plannerEntryTypes: ReadonlyArray<readonly [string, string]>;
  plannerStatuses: ReadonlyArray<readonly [string, string]>;
  chipClassName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState(updateStudentCalendarEntryAction, initialState);
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
    <article className="rounded-[1.6rem] border border-[#d8e0d4] bg-[#fbfcfa] p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-base font-black text-[#1b3022] sm:text-lg">{entry.title}</p>
          <p className="mt-1 text-sm font-medium text-[#6d7c6c]">
            {labelFromValue(entry.entry_type)} · {labelFromValue(entry.status)}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${chipClassName}`}>
          {entry.is_all_day ? "All day" : "Timed"}
        </span>
      </button>

      {isOpen ? (
        <>
          <form action={formAction} className="mt-4 grid gap-4 border-t border-[#e4eae0] pt-4">
            <input type="hidden" name="entry_id" value={entry.id} />

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
                defaultValue={entry.title}
                className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
                aria-invalid={Boolean(state.fieldErrors.title)}
              />
              {state.fieldErrors.title ? <p className="text-sm font-medium text-red-600">{state.fieldErrors.title}</p> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor={typeId} className="block text-sm font-semibold text-[#1b3022]">
                  Item type
                </label>
                <select id={typeId} name="entry_type" defaultValue={entry.entry_type} className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]">
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
                <select id={statusId} name="status" defaultValue={entry.status} className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]">
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
                  defaultValue={formatDateTimeInput(entry.starts_at)}
                  aria-describedby={startsHelpId}
                  aria-invalid={Boolean(state.fieldErrors.starts_at)}
                  className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
                />
                <p id={startsHelpId} className="text-sm text-[#536352]">
                  Update when the task or event should begin.
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
                  defaultValue={formatDateTimeInput(entry.ends_at)}
                  aria-describedby={endsHelpId}
                  aria-invalid={Boolean(state.fieldErrors.ends_at)}
                  className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
                />
                <p id={endsHelpId} className="text-sm text-[#536352]">
                  Leave blank for single-timestamp items. End time must be later than start time.
                </p>
                {state.fieldErrors.ends_at ? <p className="text-sm font-medium text-red-600">{state.fieldErrors.ends_at}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={allDayId} className="block text-sm font-semibold text-[#1b3022]">
                Time style
              </label>
              <select id={allDayId} name="is_all_day" defaultValue={entry.is_all_day ? "yes" : "no"} className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]">
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
                defaultValue={entry.notes}
                className="min-h-28 w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-4 text-sm font-semibold text-[#1b3022]"
              />
            </div>

            <PendingSubmitButton idleLabel="Save changes" pendingLabel="Saving..." className="rounded-2xl bg-[#1b3022] px-4 py-3 text-sm font-semibold text-white" />
          </form>

          <form action={deleteStudentCalendarEntryAction} className="mt-3">
            <input type="hidden" name="entry_id" value={entry.id} />
            <PendingSubmitButton idleLabel="Delete item" pendingLabel="Deleting..." className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700" />
          </form>
        </>
      ) : null}
    </article>
  );
}
