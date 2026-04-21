"use client";

import { useActionState, useId } from "react";

import { submitStudentFeedbackAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

const initialState = {
  status: "idle" as const,
  message: "",
};

export function SupportTicketForm() {
  const [state, formAction] = useActionState(submitStudentFeedbackAction, initialState);
  const categoryId = useId();
  const subjectId = useId();
  const messageId = useId();

  return (
    <form action={formAction} className="mt-4 space-y-3">
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
        <label htmlFor={categoryId} className="block text-sm font-semibold text-[#1b3022]">
          Ticket category
        </label>
        <select
          id={categoryId}
          name="category"
          defaultValue="general"
          className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
        >
          <option value="general">General</option>
          <option value="facility">Facility</option>
          <option value="billing">Billing</option>
          <option value="portal">Portal</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor={subjectId} className="block text-sm font-semibold text-[#1b3022]">
          Subject
        </label>
        <input
          id={subjectId}
          name="subject"
          placeholder="Brief summary of the issue"
          required
          className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={messageId} className="block text-sm font-semibold text-[#1b3022]">
          Details
        </label>
        <textarea
          id={messageId}
          name="message"
          placeholder="Describe the issue, when it started, and what you need help with."
          required
          className="min-h-28 w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
        />
        <p className="text-sm text-[#536352]">Staff will receive this as a support ticket and reply through the dashboard workflow.</p>
      </div>

      <PendingSubmitButton
        idleLabel="Send ticket"
        pendingLabel="Sending..."
        className="rounded-2xl bg-[#1b3022] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      />
    </form>
  );
}
