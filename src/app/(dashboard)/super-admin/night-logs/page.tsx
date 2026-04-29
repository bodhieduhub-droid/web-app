import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLSelect } from "@/components/ui/url-select";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";
import { LocalStorageCache } from "@/components/ui/local-storage-cache";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  page?: string;
};

type NightLogRow = {
  id: string;
  entry_time: string;
  planned_exit_time: string;
  actual_exit_time: string | null;
  status: "active" | "completed" | "late";
  readers?: { id?: string; name?: string; phone?: string } | null;
  seats?: { seat_number?: number } | null;
};

function asDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

export default async function SuperAdminNightLogsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();
  const statusFilter = (resolved.status ?? "all").trim();
  const requestedPage = Number.parseInt(resolved.page ?? "1", 10);

  const pageSize = 20;
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const from = (initialPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();

  let logsQuery = supabase
    .from("night_logs")
    .select("id,entry_time,planned_exit_time,actual_exit_time,status,readers!inner(id,name,phone),seats(seat_number)", { count: "exact" })
    .order("entry_time", { ascending: false });

  if (statusFilter !== "all") logsQuery = logsQuery.eq("status", statusFilter);

  if (query) {
    logsQuery = logsQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`, { foreignTable: "readers" });
  }

  const { data, count } = await logsQuery.range(from, to);
  const rows = (data ?? []) as NightLogRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);

  const activeCount = rows.filter((row) => row.status === "active").length;
  const lateCount = rows.filter((row) => row.status === "late").length;

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (statusFilter !== "all") params.set("status", statusFilter);
  const pageHref = (page: number) => {
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <RealtimeTableListener table="night_logs" />
      <RealtimeTableListener table="readers" />
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Night Logs</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Late Sitting Monitor</h1>
      </section>

      <div className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_220px]">
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search by student name or phone" 
          className="relative z-10"
        />
        <URLSelect
          name="status"
          defaultValue={statusFilter}
          options={[
            { value: "all", label: "All status" },
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "late", label: "Late" },
          ]}
        />
      </div>

      <LocalStorageCache cacheKey="night-logs-summary" data={{ totalCount, activeCount, lateCount }}>
        {(data) => {
          const d = data || { totalCount: 0, activeCount: 0, lateCount: 0 };
          return (
            <section className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Logs", value: d.totalCount },
                { label: "Active (Page)", value: d.activeCount },
                { label: "Late (Page)", value: d.lateCount },
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
              <th className="px-4 py-3">Seat</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Planned Exit</th>
              <th className="px-4 py-3">Actual Exit</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#e4eae0]">
                <td className="px-4 py-4">
                  <p className="font-black text-[#1b3022]">{row.readers?.name || "Student"}</p>
                  <p className="text-xs font-semibold text-[#6d7c6c]">{row.readers?.phone || "No phone"}</p>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{row.seats?.seat_number ? `Seat ${row.seats.seat_number}` : "-"}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#6d7c6c]">{asDate(row.entry_time)}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#6d7c6c]">{asDate(row.planned_exit_time)}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#6d7c6c]">{asDate(row.actual_exit_time)}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{row.status}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm font-semibold text-[#6d7c6c]">
                  No night logs found.
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
