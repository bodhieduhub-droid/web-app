import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  addBillLedgerEntryAction,
  closeRejectedPaymentProof,
  removeBillTransactionAction,
  recordOfflinePaymentAction,
  rejectPaymentProof,
  updateBillFromAdminAction,
  verifyPaymentProof,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { BillRecord, TransactionRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOptimizedImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { id: string };

type BillDetailRow = BillRecord & {
  readers?: { id?: string; name?: string; phone?: string; email?: string } | null;
  transactions?: TransactionRecord[] | null;
};

type BillAuditRow = {
  id: string;
  bill_id: string;
  action: string;
  notes: string | null;
  created_at: string;
  actor_profile?: { full_name?: string | null } | null;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
};

function asMoney(value: number | null | undefined) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

function safeText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function BillingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: bill }, { data: audits }] = await Promise.all([
    supabase
      .from("bills")
      .select("*, readers(id,name,phone,email), transactions(*)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("bill_audit_logs")
      .select("id,bill_id,action,notes,created_at,before_state,after_state,actor_profile:actor_profile_id(full_name)")
      .eq("bill_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!bill) notFound();

  const detail = bill as BillDetailRow;
  const allTx = (detail.transactions ?? []) as TransactionRecord[];
  const pendingOrRejected = allTx.filter((t) => ["pending", "rejected"].includes(t.verification_status));
  const ledgerTx = allTx.filter((t) => ["verified", "closed"].includes(t.verification_status));
  const remaining = Math.max(0, Number(detail.amount_due) - Number(detail.amount_paid));
  const auditTrail = (audits ?? []) as BillAuditRow[];
  const currentStatus = safeText(detail.status, "pending");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Billing Detail</p>
            <h1 className="mt-3 text-3xl font-black text-[#1b3022]">{detail.title || detail.invoice_kind}</h1>
            <p className="mt-2 text-sm font-semibold text-[#536352]">Invoice ID: {detail.id}</p>
            <p className="text-sm font-semibold text-[#536352]">Student: {detail.readers?.name || "Student"}</p>
            <p className="text-sm font-semibold text-[#536352]">Phone: {detail.readers?.phone || "No phone"}</p>
          </div>
          <div className="text-right">
            <p className="rounded-full border border-[#d8e0d4] bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
              {currentStatus.replaceAll("_", " ")}
            </p>
            <Link href="/super-admin/billing" className="mt-3 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]">
              Back to Billing
            </Link>
            {detail.readers?.id ? (
              <Link href={`/super-admin/students/${detail.readers.id}`} className="mt-2 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]">
                Open Student
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Base", value: asMoney(detail.base_amount) },
            { label: "Registration", value: asMoney(detail.registration_amount) },
            { label: "Caution", value: asMoney(detail.caution_amount) },
            { label: "Paid", value: asMoney(detail.amount_paid) },
            { label: "Balance", value: asMoney(remaining) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">{m.label}</p>
              <p className="mt-1 text-xl font-black text-[#1b3022]">{m.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Proof Verification Queue</p>
        {pendingOrRejected.length > 0 ? (
          <div className="mt-4 space-y-3">
            {pendingOrRejected.map((transaction) => (
              <div key={transaction.id} className="rounded-[1.2rem] border border-[#e4eae0] bg-[#f5f8f3] p-4">
                <p className="text-sm font-black text-[#1b3022]">Proof amount: {asMoney(transaction.amount)}</p>
                <p className="text-xs font-semibold text-[#6d7c6c]">Status: {safeText(transaction.verification_status, "pending").replaceAll("_", " ")}</p>
                {transaction.payment_proof_url ? (
                  <div className="mt-2 flex items-start gap-3">
                    <a className="inline-block" href={transaction.payment_proof_url} target="_blank" rel="noreferrer">
                      <Image
                        src={getOptimizedImage(transaction.payment_proof_url, 300)}
                        alt="Proof thumbnail"
                        width={80}
                        height={80}
                        className="rounded-xl border border-[#d8e0d4] object-cover shadow-sm"
                      />
                    </a>
                    <a className="text-sm font-bold text-[#1b3022] underline" href={transaction.payment_proof_url} target="_blank" rel="noreferrer">
                      Open full screenshot
                    </a>
                  </div>
                ) : null}
                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  <form action={verifyPaymentProof} className="space-y-2">
                    <input type="hidden" name="transaction_id" value={transaction.id} />
                    <input name="notes" placeholder="Verification note" className="w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
                    <PendingSubmitButton idleLabel="Mark Paid" pendingLabel="Marking..." className="w-full rounded-xl bg-[#1b3022] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white" />
                  </form>
                  <form action={rejectPaymentProof} className="space-y-2">
                    <input type="hidden" name="transaction_id" value={transaction.id} />
                    <input name="notes" placeholder="Reason for rejection" className="w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
                    <PendingSubmitButton idleLabel="Reject Proof" pendingLabel="Rejecting..." className="w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#1b3022]" />
                  </form>
                  <form action={closeRejectedPaymentProof} className="space-y-2">
                    <input type="hidden" name="transaction_id" value={transaction.id} />
                    <PendingSubmitButton idleLabel="Close Rejected" pendingLabel="Closing..." className="w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#1b3022]" />
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm font-semibold text-[#6d7c6c]">No open payment proof for this invoice.</p>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <form action={updateBillFromAdminAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Invoice Edit</p>
          <input type="hidden" name="bill_id" value={detail.id} />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <input name="base_amount" defaultValue={detail.base_amount} type="number" step="0.01" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
            <input name="registration_amount" defaultValue={detail.registration_amount} type="number" step="0.01" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
            <input name="caution_amount" defaultValue={detail.caution_amount} type="number" step="0.01" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
            <input name="amount_due" defaultValue={detail.amount_due} type="number" step="0.01" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
            <input name="due_date" defaultValue={detail.due_date ?? ""} type="date" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
            <select name="status" defaultValue={currentStatus} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
              {["pending", "proof_submitted", "partial", "paid", "rejected_proof", "overdue"].map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </div>
          <input name="note" placeholder="Audit note" className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
          <PendingSubmitButton idleLabel="Save Invoice Edit" pendingLabel="Saving..." className="mt-3 rounded-xl bg-[#1b3022] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white" />
        </form>

        <form action={addBillLedgerEntryAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Refund / Adjustment</p>
          <input type="hidden" name="bill_id" value={detail.id} />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <select name="entry_type" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
              <option value="manual_adjustment">Manual adjustment</option>
              <option value="refund">Refund</option>
            </select>
            <input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
          </div>
          <input name="note" placeholder="Reason / note" className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
          <PendingSubmitButton idleLabel="Post Ledger Entry" pendingLabel="Posting..." className="mt-3 rounded-xl border border-[#d7ddd3] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]" />
        </form>
      </section>

      <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Record Offline Payment</p>
        <form action={recordOfflinePaymentAction} className="mt-3 grid gap-2 md:grid-cols-4">
          <input type="hidden" name="bill_id" value={detail.id} />
          <select name="payment_mode" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
            <option value="cash">Cash</option>
            <option value="offline">Offline transfer</option>
          </select>
          <input name="amount" type="number" step="0.01" min="1" placeholder="Amount received" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
          <input name="note" placeholder="Receipt / note" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]" />
          <PendingSubmitButton idleLabel="Record Payment" pendingLabel="Recording..." className="rounded-xl bg-[#1b3022] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white" />
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Ledger Entries</p>
          <div className="mt-3 space-y-2">
            {ledgerTx.slice(0, 20).map((entry) => (
              <div key={entry.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-xs font-black text-[#1b3022]">{safeText(entry.type, "manual").replaceAll("_", " ")} · {asMoney(entry.amount)}</p>
                <p className="text-xs font-semibold text-[#556455]">{safeText(entry.verification_notes, "No note")}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#6d7c6c]">{new Date(entry.submitted_at).toLocaleString("en-IN")}</p>
                  <form action={removeBillTransactionAction}>
                    <input type="hidden" name="bill_id" value={detail.id} />
                    <input type="hidden" name="transaction_id" value={entry.id} />
                    <PendingSubmitButton
                      idleLabel="Remove"
                      pendingLabel="Removing..."
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-red-700"
                    />
                  </form>
                </div>
              </div>
            ))}
            {ledgerTx.length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No ledger entries.</p> : null}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Audit Trail</p>
          <div className="mt-3 space-y-2">
            {auditTrail.slice(0, 20).map((entry) => (
              <div key={entry.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-xs font-black text-[#1b3022]">{safeText(entry.action, "audit").replaceAll("_", " ")}</p>
                <p className="text-xs font-semibold text-[#556455]">{safeText(entry.notes, "No note")}</p>
                <p className="text-[11px] font-semibold text-[#6d7c6c]">{entry.actor_profile?.full_name || "Admin"} · {new Date(entry.created_at).toLocaleString("en-IN")}</p>
              </div>
            ))}
            {auditTrail.length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No audit records.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
