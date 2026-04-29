"use client";

import { useOptimistic, useState, useTransition } from "react";
import { verifyPaymentProof, rejectPaymentProof, closeRejectedPaymentProof } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { TransactionRecord } from "@/lib/app-types";

export function OptimisticTransactionVerification({ 
  transaction 
}: { 
  transaction: TransactionRecord 
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<"closed" | "pending" | "verified" | "rejected", "closed" | "pending" | "verified" | "rejected">(
    transaction.verification_status,
    (state, newStatus) => newStatus
  );

  if (optimisticStatus === "verified" || optimisticStatus === "closed") {
    return (
      <div className="mt-5 rounded-[1.5rem] bg-emerald-50 p-4 border border-emerald-100 animate-in fade-in zoom-in duration-300">
        <p className="font-black text-emerald-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Payment Verified
        </p>
      </div>
    );
  }

  if (optimisticStatus === "rejected") {
     // For simplicity, we'll just show the form again if rejected, 
     // but we could also show a "Rejected" badge.
  }

  const handleVerify = async (formData: FormData) => {
    startTransition(async () => {
      setOptimisticStatus("verified");
      await verifyPaymentProof(formData);
    });
  };

  const handleReject = async (formData: FormData) => {
    startTransition(async () => {
      setOptimisticStatus("rejected");
      await rejectPaymentProof(formData);
    });
  };

  const handleClose = async (formData: FormData) => {
    startTransition(async () => {
      setOptimisticStatus("closed");
      await closeRejectedPaymentProof(formData);
    });
  };

  return (
    <div className={`mt-5 rounded-[1.5rem] bg-[#f5f8f3] p-4 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}>
      <p className="font-black text-[#1b3022]">Proof amount: ₹{transaction.amount}</p>
      {transaction.payment_proof_url ? (
        <a className="mt-2 inline-block text-sm font-bold text-[#1b3022] underline" href={transaction.payment_proof_url} target="_blank" rel="noreferrer">
          Open uploaded screenshot
        </a>
      ) : null}
      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <form action={handleVerify} className="space-y-3">
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <input name="notes" placeholder="Verification note" className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          <PendingSubmitButton 
            idleLabel="Mark Paid"
            className="w-full rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white" 
          />
        </form>
        <form action={handleReject} className="space-y-3">
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <input name="notes" placeholder="Reason for rejection" className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          <PendingSubmitButton 
            idleLabel="Reject Proof"
            className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#1b3022]" 
          />
        </form>
        <form action={handleClose} className="space-y-3">
          <input type="hidden" name="transaction_id" value={transaction.id} />
          <PendingSubmitButton 
            idleLabel="Close Rejected Proof"
            className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#1b3022]" 
          />
        </form>
      </div>
    </div>
  );
}
