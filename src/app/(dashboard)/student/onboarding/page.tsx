"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { submitOnboarding } from "@/app/(dashboard)/actions";

const examCategories = ["SSC", "PSC", "UPSC", "BANKING", "RAILWAY"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Must be a child of the <form> to use useFormStatus
function FormOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[#1b3022]/90 backdrop-blur-sm">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-white" />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/50">Please wait</p>
        <p className="mt-2 text-lg font-black text-white">Uploading your details…</p>
        <p className="mt-1 text-sm font-medium text-white/60">This may take a few seconds</p>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-3 rounded-2xl bg-[#1b3022] px-6 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white transition disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Uploading…
        </>
      ) : (
        "Save And Continue"
      )}
    </button>
  );
}

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitOnboarding, { error: null });
  const [preparingForExam, setPreparingForExam] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Redirect to dashboard when action returns success (error: null, after a submission)
  useEffect(() => {
    if (submitted && state.error === null && !isPending) {
      router.push("/student");
    }
  }, [state, submitted, isPending, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setFileError(null); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max allowed is ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
    } else {
      setFileError(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Onboarding Required</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Complete Your Profile</h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/80">
          Address, purpose, and ID proof are mandatory before your dashboard access is unlocked.
        </p>
      </section>

      {/* Server-side error banner */}
      {state.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {state.error}
        </div>
      )}

      <form
        action={formAction}
        onSubmit={() => setSubmitted(true)}
        className="space-y-6 rounded-[2rem] border border-[#d8e0d4] bg-white p-8 shadow-xl shadow-[#27452e]/8"
      >
        {/* Preloader sits inside the form so useFormStatus works */}
        <FormOverlay />

        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Address</span>
          <textarea
            name="address"
            className="min-h-28 w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022] outline-none"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Purpose</span>
          <input
            name="purpose"
            className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022] outline-none"
            placeholder="Example: Full-time UPSC preparation"
            required
          />
        </label>

        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Preparing For Exams?</p>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#1b3022]">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="preparing_for_exam"
                value="yes"
                checked={preparingForExam}
                onChange={() => setPreparingForExam(true)}
              />
              Yes
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="preparing_for_exam"
                value="no"
                checked={!preparingForExam}
                onChange={() => setPreparingForExam(false)}
              />
              No
            </label>
          </div>
        </div>

        {preparingForExam && (
          <>
            <label className="block space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Exam Details</span>
              <textarea
                name="exam_details"
                className="min-h-28 w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022] outline-none"
                placeholder="Mention exam names or study direction"
              />
            </label>

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Exam Categories</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {examCategories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
                  >
                    <input type="checkbox" name="exam_categories" value={category} />
                    {category}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">ID Proof</span>
          <input
            name="id_proof"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022] outline-none"
            required
          />
          {fileError && (
            <p className="text-sm font-semibold text-red-600">{fileError}</p>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton />
          <Link href="/" className="text-[11px] font-black uppercase tracking-[0.26em] text-[#6a7b69]">
            Back Home
          </Link>
        </div>
      </form>
    </div>
  );
}
