import { ArrowRightLeft, CheckCircle2, XCircle } from "lucide-react";

import { approveSeatChangeAction, denySeatChangeAction } from "@/app/(dashboard)/actions";
import { SeatMapBoard } from "@/components/dashboard/seat-map-board";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { createAdminClient } from "@/lib/supabase/admin";

import { URLSelect } from "@/components/ui/url-select";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { SeatSummaryDisplay } from "@/components/dashboard/seat-summary-display";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
};

interface SeatChangeRequest {
  id: string;
  reader_id: string;
  current_seat_id: string | null;
  requested_seat_id: string;
  status: string;
  created_at: string;
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
      .select("id, seat_number, status, block_reason, readers:readers!fixed_seat_id(name,id,reader_type)")
      .order("seat_number", { ascending: true }),
    supabase
      .from("seat_change_requests")
      .select("id, reader_id, current_seat_id, requested_seat_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("readers")
      .select("id,name,status,reader_type")
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

  const requests = (pendingRequests ?? []) as SeatChangeRequest[];
  const requestReaderIds = Array.from(new Set(requests.map((request) => request.reader_id)));
  const requestSeatIds = Array.from(
    new Set(
      requests.flatMap((request) =>
        [request.current_seat_id, request.requested_seat_id].filter(Boolean) as string[],
      ),
    ),
  );
  const [{ data: requestReaders }, { data: requestSeats }] = await Promise.all([
    requestReaderIds.length
      ? supabase.from("readers").select("id, name").in("id", requestReaderIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    requestSeatIds.length
      ? supabase.from("seats").select("id, seat_number").in("id", requestSeatIds)
      : Promise.resolve({ data: [] as { id: string; seat_number: number }[] }),
  ]);
  const readerMap = new Map((requestReaders ?? []).map((reader) => [reader.id, reader.name]));
  const seatNumberMap = new Map((requestSeats ?? []).map((seat) => [seat.id, seat.seat_number]));

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
      reader_type: (seat.readers as any)?.reader_type ?? null,
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

      <SeatSummaryDisplay data={{ total, available, blocked, occupied }} />

      <div className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_220px]">
        <div className="premium-card-inner"></div>
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search by seat number or student name" 
          className="relative z-10"
        />
        <URLSelect
          name="status"
          defaultValue={statusFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "available", label: "Available" },
            { value: "blocked", label: "Blocked" },
            { value: "occupied", label: "Occupied" },
          ]}
        />
      </div>

      <RealtimeTableListener table="seats" />
      <RealtimeTableListener table="seat_change_requests" />

      <SeatMapBoard
        seats={seatMapPayload}
        candidates={(unassignedStudents ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          status: row.status,
          reader_type: row.reader_type,
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
                  <p className="font-black text-amber-900">{readerMap.get(req.reader_id) ?? "Student"}</p>
                  <p className="mt-1 text-sm font-medium text-amber-800">
                    Seat #{req.current_seat_id ? seatNumberMap.get(req.current_seat_id) ?? "?" : "None"} to Seat #{seatNumberMap.get(req.requested_seat_id) ?? "?"}
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
                    <input type="hidden" name="request_id" value={req.id} />
                    <PendingSubmitButton
                      idleLabel="Approve"
                      pendingLabel="Approving..."
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                    />
                  </form>
                  <form action={denySeatChangeAction}>
                    <input type="hidden" name="request_id" value={req.id} />
                    <PendingSubmitButton
                      idleLabel="Decline"
                      pendingLabel="Declining..."
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.25em] text-rose-700 transition hover:bg-rose-50"
                    />
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
