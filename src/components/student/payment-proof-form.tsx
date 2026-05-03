"use client";

import { useActionState, useId, useRef, useState } from "react";

import { submitPaymentProof } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { compressImage } from "@/lib/image-utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const initialState = {
  status: "idle" as const,
  message: "",
  billId: null as string | null,
};

export function PaymentProofForm({
  billId,
  defaultAmount,
  isRejectedProof,
}: {
  billId: string;
  defaultAmount: number;
  isRejectedProof: boolean;
}) {
  const [state, formAction] = useActionState(submitPaymentProof, initialState);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const amountId = useId();
  const fileId = useId();
  const guidanceId = `${fileId}-guidance`;
  const errorId = `${fileId}-error`;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setClientError(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError("File too large. Upload a screenshot under 10MB.");
      event.target.value = "";
      return;
    }

    setClientError(null);
  }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (clientError) {
      event.preventDefault();
    }
  }

  async function handleAction(formData: FormData) {
    const proofFile = formData.get("payment_proof") as File;
    if (proofFile && proofFile.size > 0 && proofFile.type.startsWith("image/")) {
      try {
        const compressed = await compressImage(proofFile);
        formData.set("payment_proof", compressed);
      } catch (err) {
        console.error("[PaymentProofForm] Compression failed:", err);
      }
    }
    formAction(formData);
  }

  const errorMessage = clientError || (state.status === "error" && state.billId === billId ? state.message : null);
  const successMessage = state.status === "success" && state.billId === billId ? state.message : null;

  return (
    <form action={handleAction} onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="bill_id" value={billId} />

      {successMessage ? (
        <div className="col-span-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="col-span-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <div>
            <p>{errorMessage}</p>
            <p className="mt-1 text-xs font-medium text-red-600">Choose the screenshot again if your browser cleared the file input.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setClientError(null);
              fileInputRef.current?.click();
            }}
            className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Retry upload
          </button>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={amountId} className="block text-sm font-semibold text-[#1b3022]">
          Payment amount
        </label>
        <input
          id={amountId}
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultAmount}
          placeholder="Amount"
          className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
          required
        />
      </div>



      <div className="space-y-2">
        <label htmlFor={fileId} className="block text-sm font-semibold text-[#1b3022]">
          Payment screenshot
        </label>
        <input
          ref={fileInputRef}
          id={fileId}
          name="payment_proof"
          type="file"
          accept="image/*"
          className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
          aria-describedby={clientError ? `${guidanceId} ${errorId}` : guidanceId}
          onChange={handleFileChange}
          required
        />
        <p id={guidanceId} className="text-sm text-[#536352]">
          Upload a JPG, PNG, or WebP screenshot up to 10MB. Smaller files work better on slow networks.
        </p>
        {clientError ? (
          <p id={errorId} className="text-sm font-medium text-red-600">
            {clientError}
          </p>
        ) : null}
      </div>

      <PendingSubmitButton
        idleLabel={errorMessage ? "Retry Upload" : isRejectedProof ? "Re-upload Payment Proof" : "Upload Payment Proof"}
        pendingLabel="Uploading..."
        className="col-span-full rounded-2xl bg-[#1b3022] px-5 py-3 text-sm font-semibold text-white sm:col-span-1 disabled:opacity-50"
      />
    </form>
  );
}
