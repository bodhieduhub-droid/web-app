import Link from "next/link";

import type { ExitRequestRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLSelect } from "@/components/ui/url-select";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";
import { LocalStorageCache } from "@/components/ui/local-storage-cache";

type ExitRequestRow = ExitRequestRecord & {
  readers: { name: string; phone: string; email: string | null; caution_paid: boolean; status: string } | null;
};

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  refund?: string;
  page?: string;
};

export default async function SuperAdminExitRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();
  const statusFilter = (resolved.status ?? "all").trim();
  const refundFilter = (resolved.refund ?? "all").trim();
  const requestedPage = Number.parseInt(resolved.page ?? "1", 10);
  const pageSize = 12;
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const from = (initialPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();
  let queryBuilder = supabase
    .from("exit_requests")
    .select("*, readers!inner(name, phone, email, caution_paid, status)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") queryBuilder = queryBuilder.eq("status", statusFilter);
  if (refundFilter === "yes") queryBuilder = queryBuilder.eq("refund_eligible", true);
  if (refundFilter === "no") queryBuilder = queryBuilder.eq("refund_eligible", false);
  
  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`, { foreignTable: "readers" });
  }

  const { data: exitRequests, count } = await queryBuilder.range(from, to);
  const pageRows = (exitRequests ?? []) as ExitRequestRow[];
  const totalCount = count ?? 0;

  const pendingCount = pageRows.filter((req) => req.status === "pending").length;
  const processedCount = pageRows.filter((req) => req.status === "processed").length;
  const rejectedCount = pageRows.filter((req) => req.status === "rejected").length;
  const refundEligibleCount = pageRows.filter((req) => req.refund_eligible).length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (refundFilter !== "all") params.set("refund", refundFilter);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <RealtimeTableListener table="exit_requests" />
      <RealtimeTableListener table="readers" />
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Student Off-boarding</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Exit Requests Control Center</h1>
        <p className="mt-3 text-sm leading-6 text-[#536352]">
          Manage student exit workflows. Processing an exit releases their seat, archives their profile, and automatically initiates a caution refund (if eligible).
        </p>
      </section>

      <div className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_180px_180px]">
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search student, phone or email" 
          className="relative z-10"
        />
        <URLSelect
          name="status"
          defaultValue={statusFilter}
          options={[
            { value: "all", label: "All status" },
            { value: "pending", label: "Pending" },
            { value: "processed", label: "Processed" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
        <URLSelect
          name="refund"
          defaultValue={refundFilter}
          options={[
            { value: "all", label: "All refunds" },
            { value: "yes", label: "Refund eligible" },
            { value: "no", label: "Refund not eligible" },
          ]}
        />
      </div>

      <LocalStorageCache cacheKey="exit-requests-summary" data={{ pendingCount, processedCount, rejectedCount, refundEligibleCount }}>
        {(data) => {
          const d = data || { pendingCount: 0, processedCount: 0, rejectedCount: 0, refundEligibleCount: 0 };
          return (
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Pending", value: d.pendingCount },
                { label: "Processed", value: d.processedCount },
                { label: "Rejected", value: d.rejectedCount },
                { label: "Refund Eligible", value: d.refundEligibleCount },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
                </div>
              ))}
            </section>
          );
        }}
      </LocalStorageCache>

      <div className="overflow-hidden rounded-[1.6rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6">
        <table className="min-w-full text-left">
          <thead className="bg-[#f5f8f3]">
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Exit Date</th>
              <th className="px-4 py-3">Refund</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((req) => (
              <tr key={req.id} className="border-t border-[#e4eae0] hover:bg-[#fcfdfb] transition-colors">
                <td className="px-4 py-4">
                  <p className="font-black text-[#1b3022]">{req.readers?.name || "Student"}</p>
                  <p className="text-xs font-semibold text-[#6d7c6c]">{req.readers?.phone || "No phone"}</p>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{new Date(req.exit_date).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{req.refund_eligible ? "Eligible" : "No"}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{req.status.replaceAll("_", " ")}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#6d7c6c]">{new Date(req.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-4">
                  <Link href={`/super-admin/exit-requests/${req.id}`} className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022] hover:bg-[#f5f8f3]">
                    Open Detail
                  </Link>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-[#6d7c6c]">
                  No exit requests found.
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
            <Link href={pageHref(currentPage - 1)} className="rounded-xl border border-[#d8e0d4] px-3 py-2 hover:bg-[#f5f8f3]">Prev</Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-3 py-2 text-[#9aa79a]">Prev</span>
          )}
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)} className="rounded-xl border border-[#d8e0d4] px-3 py-2 hover:bg-[#f5f8f3]">Next</Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-3 py-2 text-[#9aa79a]">Next</span>
          )}
        </div>
      </div>
    </div>
  );
}
