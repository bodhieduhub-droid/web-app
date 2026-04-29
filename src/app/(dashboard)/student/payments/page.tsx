import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, History, Search } from "lucide-react";

import { PaymentProofForm } from "@/components/student/payment-proof-form";
import type { BillRecord, TransactionRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getHubSettings } from "@/lib/settings";
import { getOptimizedImage } from "@/lib/utils";
import { CardsSkeleton, ListSkeleton } from "@/components/dashboard/suspense-skeletons";
import { formatToIST } from "@/lib/date-utils";
import { DebouncedSearch } from "@/components/ui/debounced-search";

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

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Total Due</p>
          <p className="mt-4 text-4xl font-black text-[#1b3022]">₹{totalDue.toLocaleString()}</p>
          <p className="mt-2 text-sm font-semibold text-[#536352]">{openBills.length} pending invoices</p>
        </div>
        <div className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Hub UPI ID</p>
          <p className="mt-4 text-xl font-black text-[#1b3022]">{settings.upi_id || "Not configured"}</p>
          <p className="mt-2 text-sm font-semibold text-[#536352]">Save this for easy payments</p>
        </div>
        {settings.payment_qr_url && (
          <div className="flex items-center gap-4 rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <div className="shrink-0 overflow-hidden rounded-2xl border-2 border-[#f0f4ee]">
               <img src={getOptimizedImage(settings.payment_qr_url, 400)} alt="QR" width={80} height={80} className="h-20 w-20 object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]">Pay with QR</p>
              <p className="mt-1 text-xs font-semibold text-[#536352]">Scan to pay instantly via any UPI app.</p>
            </div>
          </div>
        )}
      </div>

      {/* Open Invoices */}
      <div className="space-y-4">
        <p className="text-sm font-black uppercase tracking-widest text-[#6d7c6c]">Open Invoices</p>
        {openBills.length > 0 ? (
          <div className="space-y-4">
            {openBills.map((bill) => (
              <div key={bill.id} id={`invoice-${bill.id}`} className={`rounded-[2rem] border p-6 shadow-lg transition-all ${focusedInvoiceId === bill.id ? "border-[#1b3022] bg-[#fcfdfb] ring-4 ring-[#1b3022]/5 shadow-xl" : "border-[#d8e0d4] bg-white"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-[#1b3022]">{bill.title || "Monthly Subscription"}</h3>
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

      {paidBills.length > 0 && (
        <div>
          <p className="mb-4 text-sm font-semibold text-[#6d7c6c]">Paid Invoices</p>
          <div className="space-y-3">
            {paidBills.slice(0, 10).map((bill) => (
              <div key={bill.id} className="flex items-center justify-between rounded-2xl border border-[#eef3ea] bg-[#fcfdfb] px-5 py-3">
                <div>
                  <p className="text-sm font-bold text-[#1b3022]">{bill.title || "Subscription"}</p>
                  <p className="text-[10px] text-[#6d7c6c]">Paid ₹{bill.amount_paid.toFixed(0)}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">Paid</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

async function TransactionHistory({
  studentId,
  txCursor,
  query,
}: {
  studentId: string;
  txCursor: string | null;
  query: string;
}) {
  const supabase = createAdminClient();
  
  let txQuery = supabase
    .from("transactions")
    .select("*")
    .eq("reader_id", studentId)
    .order("submitted_at", { ascending: false });

  if (query) {
    txQuery = txQuery.or(`type.ilike.%${query}%,verification_notes.ilike.%${query}%`);
  }
  
  if (txCursor) {
    txQuery = txQuery.lt("submitted_at", txCursor);
  }

  const { data: transactions } = await txQuery.limit(TRANSACTION_PAGE_SIZE + 1);
  const allTx = (transactions ?? []) as TransactionRecord[];
  
  const hasMore = allTx.length > TRANSACTION_PAGE_SIZE;
  const paged = allTx.slice(0, TRANSACTION_PAGE_SIZE);
  const nextTxCursor = paged.at(-1)?.submitted_at ?? null;
  const ledgerAdjustments = paged.filter((t) => t.type === "refund" || t.type === "manual_adjustment");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <History className="h-5 w-5 text-[#6d7c6c]" />
        <h2 className="text-xl font-black text-[#1b3022]">Transaction History</h2>
      </div>

      {paged.length > 0 ? (
        <div className="space-y-3">
          {paged.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-[#d8e0d4] bg-white px-5 py-4 shadow shadow-[#27452e]/4 hover:shadow-md transition-shadow">
              <div>
                <p className={`font-black ${t.amount < 0 ? "text-red-700" : "text-[#1b3022]"}`}>
                  {t.amount < 0 ? `-₹${Math.abs(t.amount)}` : `₹${t.amount}`}
                </p>
                <p className="mt-1 text-sm font-medium text-[#60705f]">
                  {formatToIST(t.submitted_at).split(",")[0]}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#6d7c6c] capitalize">{t.type.replaceAll("_", " ")}</p>
                {t.verification_notes && <p className="mt-1 text-sm font-semibold text-[#536352] italic">{t.verification_notes}</p>}
                {t.payment_proof_url && (
                  <a href={t.payment_proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block">
                    <img
                      src={getOptimizedImage(t.payment_proof_url, 200)}
                      alt="Proof"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg border border-[#d8e0d4] object-cover hover:opacity-80 transition-opacity"
                    />
                  </a>
                )}
              </div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusColor[t.verification_status] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
                {t.verification_status.replaceAll("_", " ")}
              </span>
            </div>
          ))}
          {hasMore && nextTxCursor && (
            <div className="pt-2">
              <Link
                href={`/student/payments?txCursor=${encodeURIComponent(nextTxCursor)}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className="inline-flex rounded-2xl border border-[#d8e0d4] bg-white px-6 py-3 text-sm font-black uppercase tracking-widest text-[#1b3022] hover:bg-[#f5f8f3] transition-colors shadow-sm"
              >
                Load older
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-12 text-center shadow-lg shadow-[#27452e]/6">
          <p className="text-sm font-bold text-[#6d7c6c] italic">No transactions found.</p>
        </div>
      )}
    </div>
  );
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ invoiceId?: string; txCursor?: string; q?: string }>;
}) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const resolvedSearchParams = (await searchParams) ?? {};
  const txCursor = resolvedSearchParams.txCursor ?? null;
  const focusedInvoiceId = resolvedSearchParams.invoiceId ?? null;
  const query = (resolvedSearchParams.q ?? "").trim();

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Payments</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Billing &amp; Dues</h1>
          <p className="mt-4 text-base font-medium leading-7 text-white/80 max-w-xl">
            Track your invoices, submit UPI payment screenshots, and view verified transactions.
          </p>
        </div>
        
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search history..." 
          className="w-full lg:w-96 bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </section>

      <Suspense fallback={<CardsSkeleton count={3} cols={3} />}>
        <PaymentsSummary studentId={student.id} focusedInvoiceId={focusedInvoiceId} />
      </Suspense>

      <Suspense key={txCursor + query} fallback={<ListSkeleton rows={4} />}>
        <TransactionHistory studentId={student.id} txCursor={txCursor} query={query} />
      </Suspense>
    </div>
  );
}
