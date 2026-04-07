import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  page?: string;
};

type SeatShiftRow = {
  id: string;
  shifted_at: string;
  reason: string | null;
  readers?: { name?: string; phone?: string } | null;
  old_seat?: { seat_number?: number } | null;
  new_seat?: { seat_number?: number } | null;
};

function asDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

export default async function SuperAdminSeatHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();
  const requestedPage = Number.parseInt(resolved.page ?? "1", 10);

  const pageSize = 20;
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const from = (initialPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();

  let shiftQuery = supabase
    .from("seat_shift_logs")
    .select("id,shifted_at,reason,readers(name,phone),old_seat:old_seat_id(seat_number),new_seat:new_seat_id(seat_number)", { count: "exact" })
    .order("shifted_at", { ascending: false });

  if (query) {
    const q = query.replaceAll(",", " ").replaceAll("%", "").replaceAll("*", "").trim();
    const { data: matchedReaders } = await supabase
      .from("readers")
      .select("id")
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(2500);
    const ids = (matchedReaders ?? []).map((row) => row.id);
    if (ids.length > 0) {
      shiftQuery = shiftQuery.in("reader_id", ids);
    } else {
      shiftQuery = shiftQuery.in("reader_id", ["00000000-0000-0000-0000-000000000000"]);
    }
  }

  const [{ data: shifts, count }, { data: currentlyBlocked }] = await Promise.all([
    shiftQuery.range(from, to),
    supabase
      .from("seats")
      .select("id, seat_number, block_reason, updated_at, profiles:blocked_by_profile_id(full_name)")
      .eq("status", "blocked")
      .order("seat_number", { ascending: true }),
  ]);

  const rows = (shifts ?? []) as SeatShiftRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const pageHref = (page: number) => {
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Seat History</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Seat Shift Timeline</h1>
      </section>

      <div className="flex gap-2">
        <Link href="/super-admin/seats" className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022]">
          Back To Seats
        </Link>
      </div>

      <form className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_auto]">
        <input
          name="q"
          defaultValue={resolved.q ?? ""}
          placeholder="Search by student name or phone"
          className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
        />
        <button type="submit" className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white">
          Apply
        </button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Shift Records</p>
          <p className="mt-2 text-2xl font-black text-[#1b3022]">{totalCount}</p>
        </div>
        <div className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Visible Page</p>
          <p className="mt-2 text-2xl font-black text-[#1b3022]">{rows.length}</p>
        </div>
        <div className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Currently Blocked Seats</p>
          <p className="mt-2 text-2xl font-black text-[#1b3022]">{currentlyBlocked?.length ?? 0}</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-[1.6rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6">
        <table className="min-w-full text-left">
          <thead className="bg-[#f5f8f3]">
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Shifted At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#e4eae0]">
                <td className="px-4 py-4">
                  <p className="font-black text-[#1b3022]">{row.readers?.name || "Student"}</p>
                  <p className="text-xs font-semibold text-[#6d7c6c]">{row.readers?.phone || "No phone"}</p>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{row.old_seat?.seat_number ? `Seat ${row.old_seat.seat_number}` : "None"}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{row.new_seat?.seat_number ? `Seat ${row.new_seat.seat_number}` : "None"}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#6d7c6c]">{row.reason || "No reason"}</td>
                <td className="px-4 py-4 text-xs font-semibold text-[#6d7c6c]">{asDate(row.shifted_at)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-[#6d7c6c]">
                  No seat history found.
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
