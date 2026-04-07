import Link from "next/link";

import { generateMonthlyInvoices } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { BillRecord, TransactionRecord } from "@/lib/app-types";
import { finalizeFinance, getFinancePeriodWindow, resolveFinancePeriod, summarizeFinance } from "@/lib/finance-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  period?: string;
  page?: string;
};

type BillRow = BillRecord & {
  readers?: { id?: string; name?: string; phone?: string } | null;
  transactions?: TransactionRecord[] | null;
};

const statusOptions = ["all", "pending", "proof_submitted", "partial", "paid", "rejected_proof", "overdue"];

function matchQuery(bill: BillRow, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (bill.id || "").toLowerCase().includes(q) ||
    (bill.title || "").toLowerCase().includes(q) ||
    (bill.invoice_kind || "").toLowerCase().includes(q) ||
    (bill.readers?.name || "").toLowerCase().includes(q) ||
    (bill.readers?.phone || "").toLowerCase().includes(q)
  );
}

function safeStatus(value: unknown) {
  const text = typeof value === "string" && value.trim() ? value : "pending";
  return text;
}

export default async function SuperAdminBillingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = (resolvedSearchParams.q ?? "").trim();
  const statusFilter = (resolvedSearchParams.status ?? "all").trim();
  const financePeriod = resolveFinancePeriod(resolvedSearchParams.period);
  const financeWindow = getFinancePeriodWindow(financePeriod);
  const requestedPage = Number.parseInt(resolvedSearchParams.page ?? "1", 10);
  const pageSize = 12;
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const from = (initialPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();
  let billsQuery = supabase
    .from("bills")
    .select("*, readers(id,name,phone), transactions(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    billsQuery = billsQuery.eq("status", statusFilter);
  }
  if (query) {
    const q = query.replaceAll(",", " ").replaceAll("%", "").replaceAll("*", "").trim();
    const { data: matchedReaders } = await supabase
      .from("readers")
      .select("id")
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(3000);
    const matchedReaderIds = (matchedReaders ?? []).map((row) => row.id);
    if (matchedReaderIds.length > 0) {
      billsQuery = billsQuery.or(
        `id.ilike.%${q}%,title.ilike.%${q}%,invoice_kind.ilike.%${q}%,reader_id.in.(${matchedReaderIds.join(",")})`,
      );
    } else {
      billsQuery = billsQuery.or(`id.ilike.%${q}%,title.ilike.%${q}%,invoice_kind.ilike.%${q}%`);
    }
  }

  const { data: bills, count } = await billsQuery.range(from, to);
  const { data: financeRows } = await supabase
    .from("transactions")
    .select("amount,type,payment_mode")
    .in("verification_status", ["verified", "closed"])
    .gte("verified_at", financeWindow.startIso)
    .lt("verified_at", financeWindow.endIso);

  const finance = finalizeFinance(summarizeFinance(financeRows));
  const pageRows = ((bills ?? []) as BillRow[]).filter((bill) => matchQuery(bill, query));
  const totalCount = count ?? 0;

  const metrics = pageRows.reduce(
    (acc, bill) => {
      const pendingProofs = (bill.transactions ?? []).filter((t) => t.verification_status === "pending").length;
      const remaining = Math.max(0, Number(bill.amount_due) - Number(bill.amount_paid));
      const currentStatus = safeStatus(bill.status);
      acc.total += 1;
      acc.totalDue += remaining;
      acc.pendingProofs += pendingProofs;
      if (currentStatus === "overdue") acc.overdue += 1;
      if (currentStatus === "rejected_proof") acc.rejectedProof += 1;
      return acc;
    },
    { total: 0, totalDue: 0, pendingProofs: 0, overdue: 0, rejectedProof: 0 },
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (financePeriod !== "monthly") params.set("period", financePeriod);
  const pageHref = (page: number) => {
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Billing</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Billing Control Center</h1>
          <p className="mt-2 text-sm font-semibold text-[#536352]">Search invoices, track proof queues, and open full invoice detail pages.</p>
        </div>
        <form action={generateMonthlyInvoices}>
          <PendingSubmitButton
            idleLabel="Generate Due Invoices"
            pendingLabel="Generating..."
            className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white"
          />
        </form>
      </section>

      <form className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_220px_180px_auto]">
        <input
          name="q"
          defaultValue={resolvedSearchParams.q ?? ""}
          placeholder="Search by student, phone, invoice ID, title"
          className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
        />
        <select name="status" defaultValue={statusFilter} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : option.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select name="period" defaultValue={financePeriod} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button type="submit" className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white">
          Apply
        </button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: financeWindow.label, value: "Finance Window" },
          { label: "Revenue", value: `₹${finance.revenue.toFixed(0)}` },
          { label: "Expense / Refund", value: `₹${finance.expense.toFixed(0)}` },
          { label: "Net Collection", value: `₹${finance.net.toFixed(0)}` },
          { label: "Cash / Offline", value: `₹${finance.cashIn.toFixed(0)}` },
          { label: "UPI Verified", value: `₹${finance.upiIn.toFixed(0)}` },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Invoices", value: totalCount },
          { label: "Total Due", value: `₹${metrics.totalDue.toFixed(0)}` },
          { label: "Pending Proofs", value: metrics.pendingProofs },
          { label: "Overdue", value: metrics.overdue },
          { label: "Rejected Proof", value: metrics.rejectedProof },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-[1.6rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6">
        <table className="min-w-full text-left">
          <thead className="bg-[#f5f8f3]">
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amounts</th>
              <th className="px-4 py-3">Proof Queue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((bill) => {
              const pendingProofs = (bill.transactions ?? []).filter((t) => t.verification_status === "pending").length;
              const remaining = Math.max(0, Number(bill.amount_due) - Number(bill.amount_paid));
              const currentStatus = safeStatus(bill.status);
              return (
                <tr key={bill.id} className="border-t border-[#e4eae0]">
                  <td className="px-4 py-4">
                    <p className="font-black text-[#1b3022]">{bill.title || bill.invoice_kind}</p>
                    <p className="text-xs font-semibold text-[#6d7c6c]">{bill.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-black text-[#1b3022]">{bill.readers?.name || "Student"}</p>
                    <p className="text-xs font-semibold text-[#6d7c6c]">{bill.readers?.phone || "No phone"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs font-semibold text-[#536352]">Due ₹{Number(bill.amount_due).toFixed(0)}</p>
                    <p className="text-xs font-semibold text-emerald-700">Paid ₹{Number(bill.amount_paid).toFixed(0)}</p>
                    <p className="text-xs font-black text-[#7d2f2f]">Balance ₹{remaining.toFixed(0)}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-black text-[#1b3022]">{pendingProofs}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-[#d8e0d4] bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
                      {currentStatus.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/super-admin/billing/${bill.id}`}
                      className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022]"
                    >
                      Open Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-[#6d7c6c]">
                  No invoices found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded-[1.2rem] border border-[#d8e0d4] bg-white px-4 py-3 text-xs font-bold text-[#1b3022] shadow-lg shadow-[#27452e]/6">
        <p>
          Page {currentPage} of {totalPages} · {totalCount} results
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
