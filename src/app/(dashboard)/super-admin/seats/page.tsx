import { ArrowRightLeft, CheckCircle2, XCircle } from "lucide-react";

import { approveSeatChangeAction, denySeatChangeAction } from "@/app/(dashboard)/actions";
import { SeatMapBoard } from "@/components/dashboard/seat-map-board";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
};

interface SeatChangeRequest {
  id: string;
  body: string;
  created_at: string;
  metadata: {
    reader_id?: string;
    reader_name?: string;
    old_seat_id?: string | null;
    old_seat_number?: number | null;
    new_seat_id?: string;
    new_seat_number?: number;
  } | null;
}

type SeatRow = {
  id: string;
  seat_number: number;
  status: "available" | "occupied" | "blocked";
  block_reason: string | null;
  readers: unknown;
};

function getStudentFromSeatRelation(input: unknown): { id?: string; name?: string } | null {
  if (!input) return null;
  if (Array.isArray(input)) {
    const first = input[0] as { id?: string; name?: string } | undefined;
    if (!first) return null;
    return { id: first.id, name: first.name };
  }
  const row = input as { id?: string; name?: string };
  return { id: row.id, name: row.name };
}

export default async function SuperAdminSeatsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = (resolvedSearchParams.q ?? "").trim().toLowerCase();
  const statusFilter = (resolvedSearchParams.status ?? "all").trim();

  const supabase = createAdminClient();

  const [{ data: seats, error }, { data: pendingRequests }, { data: unassignedStudents }] = await Promise.all([
    supabase
      .from("seats")
      .select("id, seat_number, status, block_reason, readers:readers!fixed_seat_id(name,id)")
      .order("seat_number", { ascending: true }),
    supabase
      .from("notifications")
      .select("id, body, created_at, metadata")
      .eq("category", "seat_change_request")
      .is("read_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("readers")
      .select("id,name,status")
      .is("fixed_seat_id", null)
      .in("status", ["active", "pending_payment", "pending_onboarding"])
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const seatList = ((seats ?? []) as SeatRow[])
    .map((seat) => ({ ...seat, student: getStudentFromSeatRelation(seat.readers) }))
    .filter((seat) => {
      if (statusFilter !== "all" && seat.status !== statusFilter) return false;
      if (!query) return true;
      const q = query;
      return (
        String(seat.seat_number).includes(q) ||
        (seat.student?.name ?? "").toLowerCase().includes(q)
      );
    });

  const requests = ((pendingRequests ?? []) as SeatChangeRequest[]).filter(
    (req) => req.metadata?.reader_id && req.metadata?.new_seat_id,
  );

  const total = (seats ?? []).length;
  const available = (seats ?? []).filter((s) => s.status === "available").length;
  const blocked = (seats ?? []).filter((s) => s.status === "blocked").length;
  const occupied = (seats ?? []).filter((s) => s.status === "occupied").length;
  const seatMapPayload = seatList.map((seat) => {
    const student = seat.student;
    return {
      id: seat.id,
      seat_number: seat.seat_number,
      status: seat.status,
      student_name: student?.name ?? null,
      assigned_reader_id: student?.id ?? null,
      block_reason: seat.block_reason ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Seat Control</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Manual Seat Blocking And Allocation</h1>
        <a href="/super-admin/seats/history" className="mt-3 inline-block rounded-xl border border-[#d8e0d4] bg-[#f7faf5] px-3 py-2 text-xs font-black text-[#1b3022]">
          Open Seat History
        </a>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: total },
          { label: "Available", value: available },
          { label: "Blocked", value: blocked },
          { label: "Occupied", value: occupied },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-[#1b3022]">{stat.value}</p>
          </div>
        ))}
      </section>

      <form className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_220px_auto]">
        <input
          name="q"
          defaultValue={resolvedSearchParams.q ?? ""}
          placeholder="Search by seat number or student name"
          className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="blocked">Blocked</option>
          <option value="occupied">Occupied</option>
        </select>
        <button
          type="submit"
          className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white"
        >
          Apply
        </button>
      </form>

      <SeatMapBoard
        seats={seatMapPayload}
        candidates={(unassignedStudents ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          status: row.status,
        }))}
      />

      {requests.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50">
              <ArrowRightLeft className="h-4 w-4 text-amber-700" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Seat Change Requests</p>
            <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-black text-white">{requests.length}</span>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] border border-amber-200 bg-amber-50 px-6 py-4 shadow shadow-amber-100"
              >
                <div>
                  <p className="font-black text-amber-900">{req.metadata?.reader_name ?? "Student"}</p>
                  <p className="mt-1 text-sm font-medium text-amber-800">
                    Seat #{req.metadata?.old_seat_number ?? "None"} to Seat #{req.metadata?.new_seat_number ?? "?"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold text-amber-600">
                    {new Date(req.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveSeatChangeAction}>
                    <input type="hidden" name="notif_id" value={req.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </form>
                  <form action={denySeatChangeAction}>
                    <input type="hidden" name="notif_id" value={req.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-rose-700 transition hover:bg-rose-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error ? (
        <div className="rounded-[1.6rem] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          Failed to load seats: {error.message}
        </div>
      ) : seatList.length === 0 ? (
        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-6 text-sm font-semibold text-[#1b3022]">
          No seats found for current filter.
        </div>
      ) : null}
    </div>
  );
}
