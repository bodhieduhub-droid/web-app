import Link from "next/link";

import type { EnquiryRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatToIST } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  assigned?: string;
  page?: string;
};

type EnquiryRow = EnquiryRecord & {
  profiles?: { full_name?: string | null } | null;
};

export default async function SuperAdminEnquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();
  const statusFilter = (resolved.status ?? "all").trim();
  const assignedFilter = (resolved.assigned ?? "all").trim();
  const requestedPage = Number.parseInt(resolved.page ?? "1", 10);
  const pageSize = 12;
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const from = (initialPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();
  let enquiriesQuery = supabase
    .from("enquiries")
    .select("*, profiles:assigned_to(full_name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") enquiriesQuery = enquiriesQuery.eq("status", statusFilter);
  if (assignedFilter === "yes") enquiriesQuery = enquiriesQuery.not("assigned_to", "is", null);
  if (assignedFilter === "no") enquiriesQuery = enquiriesQuery.is("assigned_to", null);
  if (query) {
    const q = query.replaceAll(",", " ").replaceAll("%", "").replaceAll("*", "").trim();
    enquiriesQuery = enquiriesQuery.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, count } = await enquiriesQuery.range(from, to);
  const pageRows = (data ?? []) as EnquiryRow[];
  const totalCount = count ?? 0;

  const metrics = {
    total: totalCount,
    fresh: pageRows.filter((row) => row.status === "new").length,
    blocked: pageRows.filter((row) => row.status === "seat_blocked").length,
    converted: pageRows.filter((row) => row.status === "converted").length,
  };
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (assignedFilter !== "all") params.set("assigned", assignedFilter);
  const pageHref = (page: number) => {
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Enquiries</p>
          <h1 className="mt-2 text-3xl font-black text-[#1b3022]">Public Enquiry Control Center</h1>
          <p className="mt-2 text-sm font-semibold text-[#536352]">Track lead status, seat blocks, ownership, and conversion flow from one queue.</p>
        </div>
        
        <div className="flex bg-[#f2f6ec] p-1 rounded-full border border-[#d8e0d4] shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#1b3022] rounded-full shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> List
          </div>
          <Link href="/super-admin/enquiries/kanban" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#6d7c6c] rounded-full hover:bg-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="3" height="9" x="7" y="7"/><rect width="3" height="5" x="14" y="7"/></svg> Kanban
          </Link>
        </div>
      </div>

      <form className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_180px_180px_auto]">
        <input
          name="q"
          defaultValue={resolved.q ?? ""}
          placeholder="Search name / phone / email"
          className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
        />
        <select name="status" defaultValue={statusFilter} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
          <option value="all">All status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="seat_blocked">Seat blocked</option>
          <option value="converted">Converted</option>
          <option value="closed">Closed</option>
        </select>
        <select name="assigned" defaultValue={assignedFilter} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
          <option value="all">All ownership</option>
          <option value="yes">Assigned</option>
          <option value="no">Unassigned</option>
        </select>
        <button type="submit" className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white">
          Apply
        </button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: metrics.total },
          { label: "New", value: metrics.fresh },
          { label: "Seat Blocked", value: metrics.blocked },
          { label: "Converted", value: metrics.converted },
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
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((enquiry) => (
              <tr key={enquiry.id} className="border-t border-[#e4eae0]">
                <td className="px-4 py-4">
                  <p className="font-black text-[#1b3022]">{enquiry.name}</p>
                  <p className="text-xs font-semibold text-[#6d7c6c]">{enquiry.phone} · {enquiry.email || "No email"}</p>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{enquiry.status.replaceAll("_", " ")}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{enquiry.profiles?.full_name || "Unassigned"}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#6d7c6c]">{formatToIST(enquiry.created_at)}</td>
                <td className="px-4 py-4">
                  <Link href={`/super-admin/enquiries/${enquiry.id}`} className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022]">
                    Open Detail
                  </Link>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-[#6d7c6c]">
                  No enquiries found.
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
