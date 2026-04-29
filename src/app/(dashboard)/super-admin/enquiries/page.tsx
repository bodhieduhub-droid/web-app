import Link from "next/link";
import { deleteEnquiryAction } from "@/app/(dashboard)/actions";
import type { EnquiryRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatToIST } from "@/lib/date-utils";
import { DeleteEnquiryButton } from "@/components/admin/delete-enquiry-button";
import { DebouncedSearch } from "@/components/ui/debounced-search";

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

      <div className="grid gap-3 premium-card p-4 md:grid-cols-[1fr_180px_180px]">
        <div className="premium-card-inner"></div>
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search name / phone / email" 
          className="relative z-10"
        />
        <form className="contents">
          <select 
            name="status" 
            defaultValue={statusFilter} 
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              params.set("status", e.target.value);
              params.set("page", "1");
              window.location.search = params.toString();
            }}
            className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)] relative z-10"
          >
            <option value="all">All status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="seat_blocked">Seat blocked</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
          <select 
            name="assigned" 
            defaultValue={assignedFilter} 
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              params.set("assigned", e.target.value);
              params.set("page", "1");
              window.location.search = params.toString();
            }}
            className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)] relative z-10"
          >
            <option value="all">All ownership</option>
            <option value="yes">Assigned</option>
            <option value="no">Unassigned</option>
          </select>
        </form>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: metrics.total },
          { label: "New", value: metrics.fresh },
          { label: "Seat Blocked", value: metrics.blocked },
          { label: "Converted", value: metrics.converted },
        ].map((item) => (
          <div key={item.label} className="premium-card p-4 relative group overflow-hidden">
            <div className="premium-card-inner"></div>
            <div className="absolute -inset-4 bg-gradient-to-br from-[#1b3022]/0 to-[#1b3022]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[2rem]"></div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c] relative z-10">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022] relative z-10 transition-transform duration-200 group-hover:scale-[1.02] origin-bottom-left">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden premium-card">
        <div className="premium-card-inner"></div>
        <table className="min-w-full text-left relative z-10">
          <thead className="bg-[#f5f8f3] border-b border-[#e4eae0]">
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-5 py-4">Lead</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Owner</th>
              <th className="px-5 py-4">Created</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((enquiry) => (
              <tr key={enquiry.id} className="interactive-row border-b border-[#e4eae0]/50 hover:bg-[#f9fbf8]">
                <td className="px-5 py-4">
                  <p className="font-black text-[#1b3022]">{enquiry.name}</p>
                  <p className="text-xs font-semibold text-[#6d7c6c]">{enquiry.phone} · {enquiry.email || "No email"}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-[#f2f6ec] border border-[#d8e0d4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#536352]">
                    {enquiry.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm font-bold text-[#1b3022]">{enquiry.profiles?.full_name || "Unassigned"}</td>
                <td className="px-5 py-4 text-xs font-semibold text-[#6d7c6c]">{formatToIST(enquiry.created_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/super-admin/enquiries/${enquiry.id}`} className="rounded-xl border border-[#d8e0d4] bg-white hover:bg-[#f0f5ec] px-3 py-2 text-xs font-black text-[#1b3022] shadow-sm transition-colors">
                      Open Detail
                    </Link>
                    <DeleteEnquiryButton enquiryId={enquiry.id} className="h-9 w-9 bg-white border border-[#d8e0d4] hover:bg-[#ffecec] hover:border-[#ffcaca] hover:text-[#e03131]" />
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <p className="text-sm font-bold text-[#1b3022]">No enquiries found</p>
                  <p className="text-xs font-medium text-[#6d7c6c] mt-1">Adjust your filters to see more results.</p>
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
