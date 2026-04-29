import Link from "next/link";

import { generateMonthlyInvoices } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { BillRecord, TransactionRecord } from "@/lib/app-types";
import { finalizeFinance, getFinancePeriodWindow, resolveFinancePeriod, summarizeFinance } from "@/lib/finance-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLSelect } from "@/components/ui/url-select";

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
    .select("*, readers!inner(id, name, phone), transactions(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") billsQuery = billsQuery.eq("status", statusFilter);

  if (query) {
    billsQuery = billsQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%,title.ilike.%${query}%`, { foreignTable: "readers" });
  }

  const { data: billsRaw, count } = await billsQuery.range(from, to);
  const totalCount = count ?? 0;
  const bills = (billsRaw ?? []) as BillRow[];

  const { data: financeRows } = await supabase
    .from("transactions")
    .select("amount,type,payment_mode")
    .in("verification_status", ["verified", "closed"])
    .gte("verified_at", financeWindow.startIso)
    .lt("verified_at", financeWindow.endIso);

  const rawStats = summarizeFinance(financeRows ?? []);
  const stats = finalizeFinance(rawStats);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (financePeriod !== "daily") params.set("period", financePeriod);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Billing Desk</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Finance Hub</h1>
        </div>
        <form action={generateMonthlyInvoices}>
          <PendingSubmitButton
            idleLabel="Generate Monthly Due"
            pendingLabel="Generating..."
            className="rounded-2xl bg-[#1b3022] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#1b3022]/20"
          />
        </form>
      </section>

      <div className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_180px_180px]">
        <div className="premium-card-inner"></div>
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search student, phone or invoice" 
          className="relative z-10"
        />
        <URLSelect
          name="status"
          defaultValue={statusFilter}
          options={statusOptions.map(s => ({ value: s, label: s.replaceAll("_", " ") }))}
        />
        <URLSelect
          name="period"
          defaultValue={financePeriod}
          options={[
            { value: "daily", label: "Daily Period" },
            { value: "weekly", label: "Weekly Period" },
            { value: "monthly", label: "Monthly Period" },
          ]}
        />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Cash", value: stats.cashIn },
          { label: "UPI", value: stats.upiIn },
          { label: "Count", value: stats.collectionsCount },
          { label: "Revenue", value: stats.revenue, highlight: true },
          { label: "Expense", value: stats.expense, warning: true },
          { label: "Profit", value: stats.net, success: true },
        ].map((item) => (
          <div key={item.label} className={`rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 ${item.highlight ? 'bg-[#f5f8f3]' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
            <p className={`mt-2 text-2xl font-black ${item.warning ? 'text-[#7d2f2f]' : item.success ? 'text-emerald-700' : 'text-[#1b3022]'}`}>
              {item.label === "Count" ? "" : "₹"}{item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-[2rem] border border-[#d8e0d4] bg-white shadow-xl shadow-[#27452e]/6">
        <table className="w-full text-left">
          <thead className="bg-[#f5f8f3] border-b border-[#e4eae0]">
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef3ea]">
            {bills.map((bill) => (
              <tr key={bill.id} className="text-sm font-semibold text-[#1b3022] hover:bg-[#fcfdfb] transition-colors">
                <td className="px-6 py-4">
                  <p className="font-black text-[#1b3022]">{bill.title || bill.invoice_kind.replaceAll("_", " ")}</p>
                  <p className="text-[10px] font-bold text-[#6d7c6c] uppercase tracking-wider">{bill.id.slice(0, 8)}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-[#1b3022]">{bill.readers?.name}</p>
                  <p className="text-xs text-[#6d7c6c]">{bill.readers?.phone}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="font-black">₹{bill.amount_due.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-700">Paid ₹{bill.amount_paid.toLocaleString()}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    bill.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                    bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-[#f0f4ee] text-[#4e5d4d]'
                  }`}>
                    {bill.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/super-admin/students/${bill.reader_id}`}
                    className="inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#1b3022] hover:bg-[#f5f8f3]"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {bills.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-[#6d7c6c] italic">
                  No billing records found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-[1.4rem] border border-[#d8e0d4] bg-white px-4 py-3 text-xs font-bold text-[#1b3022] shadow-xl shadow-[#27452e]/6">
        <p>Page {currentPage} of {totalPages} · {totalCount} records</p>
        <div className="flex gap-2">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className="rounded-xl border border-[#d8e0d4] px-4 py-2 hover:bg-[#f5f8f3]">Prev</Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-4 py-2 text-[#9aa79a]">Prev</span>
          )}
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)} className="rounded-xl border border-[#d8e0d4] px-4 py-2 hover:bg-[#f5f8f3]">Next</Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-4 py-2 text-[#9aa79a]">Next</span>
          )}
        </div>
      </div>
    </div>
  );
}
