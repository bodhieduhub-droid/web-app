import Link from "next/link";

import { closeRejectedPaymentProof, rejectPaymentProof, verifyPaymentProof } from "@/app/(dashboard)/actions";
import type { BillRecord, TransactionRecord } from "@/lib/app-types";
import { finalizeFinance, getFinancePeriodWindow, resolveFinancePeriod, summarizeFinance } from "@/lib/finance-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { OptimisticTransactionVerification } from "./optimistic-transaction-verification";

type PaymentRow = BillRecord & {
  readers?: { name?: string; phone?: string } | null;
  transactions?: TransactionRecord[] | null;
};
type BillAuditRow = {
  id: string;
  bill_id: string;
  action: string;
  notes: string | null;
  created_at: string;
};

import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLSelect } from "@/components/ui/url-select";

export const dynamic = "force-dynamic";

type SearchParams = {
  period?: string;
  page?: string;
  q?: string;
};

export default async function StaffBillingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = (resolvedSearchParams.q ?? "").trim();
  const financePeriod = resolveFinancePeriod(resolvedSearchParams.period);
  const financeWindow = getFinancePeriodWindow(financePeriod);
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const pageSize = 8;
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const from = (initialPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();

  let billsQuery = supabase
    .from("bills")
    .select("*, readers!inner(name, phone), transactions(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (query) {
    billsQuery = billsQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`, { foreignTable: "readers" });
  }

  const { data: bills, count } = await billsQuery.range(from, to);
  const billIds = (bills ?? []).map((bill) => bill.id);
  const { data: financeRows } = await supabase
    .from("transactions")
    .select("amount,type,payment_mode")
    .in("verification_status", ["verified", "closed"])
    .gte("verified_at", financeWindow.startIso)
    .lt("verified_at", financeWindow.endIso);
  const { data: audits } = billIds.length
    ? await supabase
        .from("bill_audit_logs")
        .select("id,bill_id,action,notes,created_at")
        .in("bill_id", billIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const finance = finalizeFinance(summarizeFinance(financeRows));
  const auditByBill = new Map<string, BillAuditRow[]>();
  for (const row of (audits ?? []) as BillAuditRow[]) {
    const entries = auditByBill.get(row.bill_id) ?? [];
    entries.push(row);
    auditByBill.set(row.bill_id, entries);
  }
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);
  const params = new URLSearchParams();
  if (financePeriod !== "monthly") params.set("period", financePeriod);
  const pageHref = (page: number) => {
    params.set("page", String(page));
    return `?${params.toString()}`;
  };
  const periodLabel = financePeriod === "daily" ? "Daily" : financePeriod === "weekly" ? "Weekly" : "Monthly";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Staff Billing</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Verification Desk</h1>
        </div>
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search student or phone..." 
          className="w-full md:w-80"
        />
      </section>

      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
        <URLSelect
          name="period"
          defaultValue={financePeriod}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
          className="w-full md:w-48"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: `${periodLabel} Revenue`, value: `₹${finance.revenue.toFixed(0)}` },
          { label: `${periodLabel} Expense`, value: `₹${finance.expense.toFixed(0)}` },
          { label: `${periodLabel} Net`, value: `₹${finance.net.toFixed(0)}` },
          { label: "Cash / Offline", value: `₹${finance.cashIn.toFixed(0)}` },
          { label: "UPI Verified", value: `₹${finance.upiIn.toFixed(0)}` },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="space-y-4">
        {((bills ?? []) as PaymentRow[]).map((bill) => {
          const openTransactions = (bill.transactions ?? []).filter((transaction) =>
            ["pending", "rejected"].includes(transaction.verification_status),
          );
          const auditTrail = auditByBill.get(bill.id) ?? [];

          return (
            <article key={bill.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-[#1b3022]">{bill.readers?.name || "Student"}</p>
                  <p className="mt-2 text-sm font-medium text-[#556455]">{bill.title || bill.invoice_kind}</p>
                </div>
                <span className="rounded-full bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
                  {bill.status.replaceAll("_", " ")}
                </span>
              </div>

              {openTransactions.length > 0 ? openTransactions.map((transaction) => (
                <OptimisticTransactionVerification key={transaction.id} transaction={transaction} />
              )) : (
                <div className="mt-5 rounded-[1.5rem] bg-[#f5f8f3] p-4 text-sm font-medium text-[#556455]">
                  No open proof for this invoice.
                </div>
              )}

              <div className="mt-4 rounded-[1.5rem] bg-[#f5f8f3] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#6d7c6c]">Invoice Audit Trail</p>
                <div className="mt-2 space-y-2">
                  {auditTrail.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="rounded-xl bg-white px-3 py-2">
                      <p className="text-xs font-black text-[#1b3022]">{entry.action.replaceAll("_", " ")}</p>
                      <p className="text-xs font-semibold text-[#556455]">{entry.notes || "No note"}</p>
                      <p className="text-[11px] font-semibold text-[#6d7c6c]">{new Date(entry.created_at).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                  {auditTrail.length === 0 ? <p className="text-xs font-semibold text-[#6d7c6c]">No invoice audit entries.</p> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-[1.2rem] border border-[#d8e0d4] bg-white px-4 py-3 text-xs font-bold text-[#1b3022] shadow-lg shadow-[#27452e]/6">
        <p>
          Page {currentPage} of {totalPages} · {totalCount} invoices
        </p>
        <div className="flex items-center gap-2">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className="rounded-xl border border-[#d8e0d4] px-3 py-2">
              Prev
            </Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-3 py-2 text-[#9aa79a]">Prev</span>
          )}
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)} className="rounded-xl border border-[#d8e0d4] px-3 py-2">
              Next
            </Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-3 py-2 text-[#9aa79a]">Next</span>
          )}
        </div>
      </div>
    </div>
  );
}
