import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { PaymentProofForm } from "@/components/student/payment-proof-form";
import type { BillRecord, TransactionRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHubSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

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

const remoteImageLoader = ({ src }: { src: string }) => src;

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ invoiceId?: string; txCursor?: string }>;
}) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();
  const settings = await getHubSettings();
  const resolvedSearchParams = (await searchParams) ?? {};
  const txCursor = resolvedSearchParams.txCursor ?? null;
  const focusedInvoiceId = resolvedSearchParams.invoiceId ?? null;

  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .eq("reader_id", student.id)
    .order("created_at", { ascending: false })
    .limit(120);

  const { data: transactionRows } = await supabase
    .from("transactions")
    .select("*")
    .eq("reader_id", student.id)
    .order("created_at", { ascending: false })
    .limit(120);

  const transactionHistoryQuery = supabase
    .from("transactions")
    .select("*")
    .eq("reader_id", student.id)
    .order("submitted_at", { ascending: false })
    .limit(TRANSACTION_PAGE_SIZE + 1);

  if (txCursor) {
    transactionHistoryQuery.lt("submitted_at", txCursor);
  }

  const { data: transactionHistoryRows } = await transactionHistoryQuery;

  const allBills = (bills ?? []) as BillRecord[];
  const allTransactions = (transactionRows ?? []) as TransactionRecord[];
  const pagedTransactions = ((transactionHistoryRows ?? []) as TransactionRecord[]).slice(0, TRANSACTION_PAGE_SIZE);
  const nextTxCursor =
    (transactionHistoryRows ?? []).length > TRANSACTION_PAGE_SIZE
      ? pagedTransactions[pagedTransactions.length - 1]?.submitted_at ?? null
      : null;
  const openBills = allBills.filter((b) => b.status !== "paid");
  const paidBills = allBills.filter((b) => b.status === "paid");
  const latestRejectedByBill = allTransactions
    .filter((t) => t.verification_status === "rejected")
    .reduce<Record<string, TransactionRecord>>((acc, tx) => {
      if (!acc[tx.bill_id]) acc[tx.bill_id] = tx;
      return acc;
    }, {});
  const pendingTransactionBillIds = new Set(
    allTransactions.filter((transaction) => transaction.verification_status === "pending").map((transaction) => transaction.bill_id),
  );

  const totalDue = openBills.reduce((s, b) => s + (b.amount_due - b.amount_paid), 0);
  const totalPaid = allTransactions
    .filter((t) => t.verification_status === "verified")
    .reduce((s, t) => s + t.amount, 0);
  const ledgerAdjustments = allTransactions.filter((t) => ["refund", "manual_adjustment"].includes(t.type)).slice(0, 20);

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-sm font-semibold text-white/60">Payments</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Billing & Dues</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Track your invoices, submit UPI payment screenshots, and view verified transactions.
        </p>
      </section>

      {/* Summary */}
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
      {(settings.static_upi_id || settings.static_upi_name || settings.static_upi_qr_url) && (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <p className="text-sm font-semibold text-[#6d7c6c]">Hub UPI Details</p>
          <p className="mt-4 text-sm font-medium leading-7 text-[#536352]">
            Pay using the UPI ID below, then upload your screenshot for verification.
          </p>
          <div className="mt-4 flex flex-wrap gap-6">
            {settings.static_upi_id && (
              <div>
                <p className="text-sm font-semibold text-[#6d7c6c]">UPI ID</p>
                <p className="mt-1 text-lg font-black text-[#1b3022]">{settings.static_upi_id}</p>
              </div>
            )}
            {settings.static_upi_name && (
              <div>
                <p className="text-sm font-semibold text-[#6d7c6c]">Name</p>
                <p className="mt-1 text-lg font-black text-[#1b3022]">{settings.static_upi_name}</p>
              </div>
            )}
            {settings.static_upi_qr_url && (
              <div className="rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
                <p className="text-sm font-semibold text-[#6d7c6c]">UPI QR</p>
                <Image
                  loader={remoteImageLoader}
                  unoptimized
                  src={settings.static_upi_qr_url}
                  alt="Hub UPI QR"
                  width={144}
                  height={144}
                  className="mt-2 h-36 w-36 rounded-xl object-cover"
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

      {/* Transaction History */}
      <div>
        <p className="mb-4 text-sm font-semibold text-[#6d7c6c]">Transaction History</p>
        {pagedTransactions.length > 0 ? (
          <div className="space-y-3">
            {pagedTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-[#d8e0d4] bg-white px-5 py-4 shadow shadow-[#27452e]/4">
                <div>
                  <p className={`font-black ${t.amount < 0 ? "text-red-700" : "text-[#1b3022]"}`}>
                    {t.amount < 0 ? `-₹${Math.abs(t.amount)}` : `₹${t.amount}`}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#60705f]">
                    {new Date(t.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#6d7c6c]">
                    {t.type.replaceAll("_", " ")}
                  </p>
                  {t.verification_notes ? (
                    <p className="mt-1 text-sm font-semibold text-[#536352]">{t.verification_notes}</p>
                  ) : null}
                  {t.payment_proof_url && (
                    <a href={t.payment_proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                      <Image
                        loader={remoteImageLoader}
                        unoptimized
                        src={t.payment_proof_url}
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
            {nextTxCursor ? (
              <div className="pt-2">
                <Link
                  href={`/student/payments?txCursor=${encodeURIComponent(nextTxCursor)}`}
                  className="inline-flex rounded-2xl border border-[#d8e0d4] px-4 py-3 text-sm font-semibold text-[#1b3022] transition hover:bg-[#f3f7f0]"
                >
                  Load older transactions
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 text-sm font-medium text-[#536352] shadow-lg shadow-[#27452e]/6">
            No transactions recorded yet.
          </div>
        )}
      </div>

      {/* Refund / Adjustment Ledger */}
      <div>
        <p className="mb-4 text-sm font-semibold text-[#6d7c6c]">Refund & Adjustment Ledger</p>
        {ledgerAdjustments.length > 0 ? (
          <div className="space-y-3">
            {ledgerAdjustments.map((entry) => (
              <div key={entry.id} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white px-5 py-4 shadow shadow-[#27452e]/4">
                <p className={`font-black ${entry.amount < 0 ? "text-red-700" : "text-[#1b3022]"}`}>
                  {entry.amount < 0 ? `Refund -₹${Math.abs(entry.amount)}` : `Adjustment +₹${entry.amount}`}
                </p>
                <p className="mt-1 text-sm font-medium text-[#60705f]">
                  {new Date(entry.submitted_at).toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#536352]">{entry.verification_notes || "No note"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 text-sm font-medium text-[#536352] shadow-lg shadow-[#27452e]/6">
            No refund or manual adjustment entries yet.
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
