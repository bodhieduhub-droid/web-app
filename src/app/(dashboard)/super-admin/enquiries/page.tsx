import Link from "next/link";
import { Suspense } from "react";
import { deleteEnquiryAction } from "@/app/(dashboard)/actions";
import type { EnquiryRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatToIST } from "@/lib/date-utils";
import { DeleteEnquiryButton } from "@/components/admin/delete-enquiry-button";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLSelect } from "@/components/ui/url-select";
import { Loader2 } from "lucide-react";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";

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

async function EnquiryMetrics() {
  const supabase = createAdminClient();
  const [{ count: total }, { count: fresh }, { count: blocked }, { count: converted }] = await Promise.all([
    supabase.from("enquiries").select("*", { count: "exact", head: true }),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "seat_blocked"),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "converted"),
  ]);

  const items = [
    { label: "Total", value: total ?? 0 },
    { label: "New", value: fresh ?? 0 },
    { label: "Seat Blocked", value: blocked ?? 0 },
    { label: "Converted", value: converted ?? 0 },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="premium-card p-4 relative group overflow-hidden">
          <div className="premium-card-inner"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c] relative z-10">{item.label}</p>
          <p className="mt-2 text-2xl font-black text-[#1b3022] relative z-10">{item.value}</p>
        </div>
      ))}
    </section>
  );
}

async function EnquiryList({ query, statusFilter, assignedFilter, initialPage }: { 
  query: string; 
  statusFilter: string; 
  assignedFilter: string; 
  initialPage: number 
}) {
  const pageSize = 12;
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
  const filteredCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (assignedFilter !== "all") params.set("assigned", assignedFilter);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <>
      <div className="overflow-hidden premium-card min-h-[400px]">
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
        <p>Page {currentPage} of {totalPages} · {filteredCount} results</p>
        <div className="flex items-center gap-2">
          <Link href={pageHref(currentPage - 1)} className={`rounded-xl border border-[#d8e0d4] px-3 py-2 hover:bg-[#f5f8f3] transition-colors ${currentPage <= 1 ? "pointer-events-none opacity-40" : ""}`}>Prev</Link>
          <Link href={pageHref(currentPage + 1)} className={`rounded-xl border border-[#d8e0d4] px-3 py-2 hover:bg-[#f5f8f3] transition-colors ${currentPage >= totalPages ? "pointer-events-none opacity-40" : ""}`}>Next</Link>
        </div>
      </div>
    </>
  );
}

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
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);

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
        <DebouncedSearch defaultValue={query} placeholder="Search name / phone / email" className="relative z-10" />
        <URLSelect
          name="status"
          defaultValue={statusFilter}
          options={[
            { value: "all", label: "All status" },
            { value: "new", label: "New" },
            { value: "contacted", label: "Contacted" },
            { value: "seat_blocked", label: "Seat blocked" },
            { value: "converted", label: "Converted" },
            { value: "closed", label: "Closed" },
          ]}
        />
        <URLSelect
          name="assigned"
          defaultValue={assignedFilter}
          options={[
            { value: "all", label: "All ownership" },
            { value: "yes", label: "Assigned" },
            { value: "no", label: "Unassigned" },
          ]}
        />
      </div>

      <Suspense fallback={<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-24 premium-card animate-pulse" />)}</div>}>
        <EnquiryMetrics />
      </Suspense>

      <RealtimeTableListener table="enquiries" />

      <Suspense fallback={<div className="h-96 premium-card animate-pulse flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin opacity-20" /></div>}>
        <EnquiryList query={query} statusFilter={statusFilter} assignedFilter={assignedFilter} initialPage={initialPage} />
      </Suspense>
    </div>
  );
}
