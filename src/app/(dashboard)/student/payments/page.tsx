import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";

import { PaymentProofForm } from "@/components/student/payment-proof-form";
import type { BillRecord, TransactionRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHubSettings } from "@/lib/settings";
import { getOptimizedImage } from "@/lib/utils";
import { CardsSkeleton, ListSkeleton } from "@/components/dashboard/suspense-skeletons";
import { formatToIST } from "@/lib/date-utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const statusColor: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  proof_submitted: "bg-blue-50 text-blue-700 border-blue-200",
  partial: "bg-orange-50 text-orange-700 border-orange-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  rejected_proof: "bg-red-50 text-red-700 border-red-200",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const TRANSACTION_PAGE_SIZE = 12;
const FALLBACK_STUDENT_QR = "/student-payment-qr.png";

// Async: summary stats + UPI info + open invoices
async function PaymentsSummary({
  studentId,
  focusedInvoiceId,
}: {
  studentId: string;
  focusedInvoiceId: string | null;
}) {
  const supabase = createAdminClient();
  const [settings, { data: bills }, { data: transactionRows }] = await Promise.all([
    getHubSettings(),
    supabase.from("bills").select("*").eq("reader_id", studentId).order("created_at", { ascending: false }).limit(120),
    supabase.from("transactions").select("id, bill_id, amount, verification_status, submitted_at, payment_proof_url").eq("reader_id", studentId).order("created_at", { ascending: false }).limit(120),
  ]);

  const allBills = (bills ?? []) as BillRecord[];
  const allTransactions = (transactionRows ?? []) as TransactionRecord[];
  const openBills = allBills.filter((b) => b.status !== "paid");
  const paidBills = allBills.filter((b) => b.status === "paid");
  const latestRejectedByBill = allTransactions
    .filter((t) => t.verification_status === "rejected")
    .reduce<Record<string, TransactionRecord>>((acc, tx) => {
      if (!acc[tx.bill_id]) acc[tx.bill_id] = tx;
      return acc;
    }, {});
  const pendingTransactionBillIds = new Set(
    allTransactions.filter((t) => t.verification_status === "pending").map((t) => t.bill_id),
  );
  const totalDue = openBills.reduce((s, b) => s + (b.amount_due - b.amount_paid), 0);
  const totalPaid = allTransactions.filter((t) => t.verification_status === "verified").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Due", value: `₹${totalDue.toFixed(0)}`, accent: totalDue > 0 },
          { label: "Total Verified Paid", value: `₹${totalPaid.toFixed(0)}`, accent: false },
          { label: "Open Invoices", value: String(openBills.length), accent: openBills.length > 0 },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-[1.8rem] border p-6 ${stat.accent ? "border-red-200 bg-red-50" : "border-[#d8e0d4] bg-white"} shadow-lg shadow-[#27452e]/6`}>
            <p className="text-sm font-semibold text-[#6d7c6c]">{stat.label}</p>
            <p className={`mt-4 text-4xl font-black ${stat.accent ? "text-red-700" : "text-[#1b3022]"}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* UPI Info */}
      {(settings.static_upi_id || settings.static_upi_name || settings.static_upi_qr_url || FALLBACK_STUDENT_QR) && (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-[#6d7c6c]">Hub UPI Details</p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#536352]">
                Pay via UPI, keep a screenshot ready, then upload it below for verification.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#d8e0d4] bg-[#f7faf5] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#5c6d5c]">
                  1. Scan / Pay
                </span>
                <span className="rounded-full border border-[#d8e0d4] bg-[#f7faf5] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#5c6d5c]">
                  2. Screenshot
                </span>
                <span className="rounded-full border border-[#d8e0d4] bg-[#f7faf5] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#5c6d5c]">
                  3. Upload proof
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {settings.static_upi_id && (
                  <div className="rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d7c6c]">UPI ID</p>
                    <p className="mt-1 break-all text-base font-black text-[#1b3022]">{settings.static_upi_id}</p>
                  </div>
                )}
                {settings.static_upi_name && (
                  <div className="rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d7c6c]">Name</p>
                    <p className="mt-1 text-base font-black text-[#1b3022]">{settings.static_upi_name}</p>
                  </div>
                )}
              </div>
            </div>

            {(settings.static_upi_qr_url || FALLBACK_STUDENT_QR) && (
              <div className="mx-auto w-fit rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] p-3 lg:mx-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d7c6c]">UPI QR</p>
                <Image
                  src={getOptimizedImage(settings.static_upi_qr_url || FALLBACK_STUDENT_QR, 300)}
                  alt="Hub UPI QR"
                  width={176}
                  height={176}
                  className="mt-2 h-40 w-40 rounded-xl object-cover sm:h-44 sm:w-44"
                  unoptimized
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Open Invoices */}
      <div>
        <p className="mb-4 text-sm font-semibold text-[#6d7c6c]">Open Invoices</p>
        {openBills.length > 0 ? (
          <div className="space-y-4">
            {openBills.map((bill) => (
              <div
                key={bill.id}
                id={`invoice-${bill.id}`}
                className={`rounded-[2rem] border bg-white p-6 shadow-lg shadow-[#27452e]/6 ${
                  focusedInvoiceId === bill.id ? "border-[#1b3022] ring-2 ring-[#1b3022]/10" : "border-[#d8e0d4]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black text-[#1b3022]">{bill.title || "Invoice"}</p>
                    <p className="mt-1 text-sm font-medium text-[#60705f]">
                      Due: ₹{(bill.amount_due - bill.amount_paid).toFixed(0)}
                      {bill.due_date ? ` · By ${bill.due_date}` : ""}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm font-semibold text-[#536352] sm:grid-cols-3">
                      <p className="rounded-xl bg-[#f5f8f3] px-3 py-2">Base: ₹{Number(bill.base_amount || 0).toFixed(0)}</p>
                      <p className="rounded-xl bg-[#f5f8f3] px-3 py-2">Registration: ₹{Number(bill.registration_amount || 0).toFixed(0)}</p>
                      <p className="rounded-xl bg-[#f5f8f3] px-3 py-2">Caution: ₹{Number(bill.caution_amount || 0).toFixed(0)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold uppercase ${statusColor[bill.status] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
                    {bill.status.replaceAll("_", " ")}
                  </span>
                </div>

                {bill.status === "rejected_proof" && latestRejectedByBill[bill.id]?.verification_notes && (
                  <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    Rejected reason: {latestRejectedByBill[bill.id].verification_notes}
                  </div>
                )}

                {bill.status !== "proof_submitted" && !pendingTransactionBillIds.has(bill.id) ? (
                  <PaymentProofForm
                    billId={bill.id}
                    defaultAmount={bill.amount_due - bill.amount_paid}
                    isRejectedProof={bill.status === "rejected_proof"}
                  />
                ) : (
                  <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                    Payment proof submitted — awaiting staff verification.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-8 text-center shadow-lg shadow-[#27452e]/6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="mt-4 text-lg font-black text-[#1b3022]">All clear!</p>
            <p className="mt-2 text-sm font-medium text-[#536352]">No pending invoices right now.</p>
          </div>
        )}
      </div>

      {/* Paid Invoices */}
      {paidBills.length > 0 && (
        <div>
          <p className="mb-4 text-sm font-semibold text-[#6d7c6c]">Paid Invoices</p>
          <div className="space-y-3">
            {paidBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-[#d8e0d4] bg-white px-5 py-4 shadow shadow-[#27452e]/4 opacity-70">
                <div>
                  <p className="font-black text-[#1b3022]">{bill.title || "Invoice"}</p>
                  <p className="mt-1 text-sm font-medium text-[#60705f]">₹{bill.amount_due} · Paid</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Paid</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Async: transaction history (paginated separately)
async function TransactionHistory({
  studentId,
  txCursor,
}: {
  studentId: string;
  txCursor: string | null;
}) {
  const supabase = createAdminClient();
  const query = supabase
    .from("transactions")
    .select("id, bill_id, amount, verification_status, submitted_at, payment_proof_url, type, verification_notes")
    .eq("reader_id", studentId)
    .order("submitted_at", { ascending: false })
    .limit(TRANSACTION_PAGE_SIZE + 1);

  if (txCursor) query.lt("submitted_at", txCursor);
  const { data: rows } = await query;

  const allTransactions = (rows ?? []) as TransactionRecord[];
  const paged = allTransactions.slice(0, TRANSACTION_PAGE_SIZE);
  const nextTxCursor =
    allTransactions.length > TRANSACTION_PAGE_SIZE
      ? paged[paged.length - 1]?.submitted_at ?? null
      : null;
  const ledgerAdjustments = paged.filter((t) => ["refund", "manual_adjustment"].includes(t.type));

  return (
    <div className="space-y-8">
      {/* Transaction History */}
      <div>
        <p className="mb-4 text-sm font-semibold text-[#6d7c6c]">Transaction History</p>
        {paged.length > 0 ? (
          <div className="space-y-3">
            {paged.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-[#d8e0d4] bg-white px-5 py-4 shadow shadow-[#27452e]/4">
                <div>
                  <p className={`font-black ${t.amount < 0 ? "text-red-700" : "text-[#1b3022]"}`}>
                    {t.amount < 0 ? `-₹${Math.abs(t.amount)}` : `₹${t.amount}`}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#60705f]">
                    {formatToIST(t.submitted_at).split(",")[0]}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#6d7c6c]">{t.type.replaceAll("_", " ")}</p>
                  {t.verification_notes && <p className="mt-1 text-sm font-semibold text-[#536352]">{t.verification_notes}</p>}
                  {t.payment_proof_url && (
                    <a href={t.payment_proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                      <img
                        src={getOptimizedImage(t.payment_proof_url, 200)}
                        alt="Payment proof"
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg border border-[#d8e0d4] object-cover"
                      />
                    </a>
                  )}
                </div>
                <span className={`rounded-full border px-3 py-1 text-sm font-semibold uppercase ${statusColor[t.verification_status] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
                  {t.verification_status.replaceAll("_", " ")}
                </span>
              </div>
            ))}
            {nextTxCursor && (
              <div className="pt-2">
                <Link
                  href={`/student/payments?txCursor=${encodeURIComponent(nextTxCursor)}`}
                  className="inline-flex rounded-2xl border border-[#d8e0d4] px-4 py-3 text-sm font-semibold text-[#1b3022] transition hover:bg-[#f3f7f0]"
                >
                  Load older transactions
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 text-sm font-medium text-[#536352] shadow-lg shadow-[#27452e]/6">
            No transactions recorded yet.
          </div>
        )}
      </div>

      {/* Refund / Adjustment Ledger */}
      {ledgerAdjustments.length > 0 && (
        <div>
          <p className="mb-4 text-sm font-semibold text-[#6d7c6c]">Refund &amp; Adjustment Ledger</p>
          <div className="space-y-3">
            {ledgerAdjustments.map((entry) => (
              <div key={entry.id} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white px-5 py-4 shadow shadow-[#27452e]/4">
                <p className={`font-black ${entry.amount < 0 ? "text-red-700" : "text-[#1b3022]"}`}>
                  {entry.amount < 0 ? `Refund -₹${Math.abs(entry.amount)}` : `Adjustment +₹${entry.amount}`}
                </p>
                <p className="mt-1 text-sm font-medium text-[#60705f]">{formatToIST(entry.submitted_at)}</p>
                <p className="mt-1 text-sm font-semibold text-[#536352]">{entry.verification_notes || "No note"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ invoiceId?: string; txCursor?: string }>;
}) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const resolvedSearchParams = (await searchParams) ?? {};
  const txCursor = resolvedSearchParams.txCursor ?? null;
  const focusedInvoiceId = resolvedSearchParams.invoiceId ?? null;

  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-sm font-semibold text-white/60">Payments</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Billing &amp; Dues</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Track your invoices, submit UPI payment screenshots, and view verified transactions.
        </p>
      </section>

      {/* ── Summary + Invoices (SUSPENSE — streams independently) ── */}
      <Suspense fallback={<CardsSkeleton count={3} cols={3} />}>
        <PaymentsSummary studentId={student.id} focusedInvoiceId={focusedInvoiceId} />
      </Suspense>

      {/* ── Transaction History (SUSPENSE — streams independently) ── */}
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <TransactionHistory studentId={student.id} txCursor={txCursor} />
      </Suspense>
    </div>
  );
}
