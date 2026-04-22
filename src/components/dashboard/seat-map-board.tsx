"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import { assignSeatFromMapAction, blockSeatForEnquiry, releaseSeat } from "@/app/(dashboard)/actions";
import { Spinner } from "@/components/ui/spinner";

type SeatCard = {
  id: string;
  seat_number: number;
  status: "available" | "occupied" | "blocked";
  student_name?: string | null;
  assigned_reader_id?: string | null;
  reader_type?: string | null;
  block_reason?: string | null;
};

type CandidateStudent = {
  id: string;
  name: string;
  status: string;
  reader_type: string;
};

export function SeatMapBoard({
  seats,
  candidates,
}: {
  seats: SeatCard[];
  candidates: CandidateStudent[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [dragStudentId, setDragStudentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rolePrefix = pathname.startsWith("/staff") ? "/staff" : "/super-admin";

  const candidateMap = useMemo(() => new Map(candidates.map((s) => [s.id, s])), [candidates]);
  const occupancy = useMemo(() => {
    const total = seats.length || 1;
    const occupied = seats.filter((seat) => seat.status === "occupied").length;
    const available = seats.filter((seat) => seat.status === "available").length;
    const blocked = seats.filter((seat) => seat.status === "blocked").length;
    const percentage = Math.round((occupied / total) * 100);
    return { total, occupied, available, blocked, percentage };
  }, [seats]);

  const onDropSeat = (seat: SeatCard) => {
    if (!dragStudentId) return;
    if (seat.status !== "available") {
      setMessage("Seat is not available. Drop only on available seats.");
      return;
    }
    const student = candidateMap.get(dragStudentId);
    if (!student) {
      setMessage("Student is not eligible for seat assignment.");
      return;
    }

    setMessage(`Assigning ${student.name} to Seat ${seat.seat_number}...`);
    setProcessingId(seat.id);
    startTransition(async () => {
      const form = new FormData();
      form.set("reader_id", student.id);
      form.set("seat_id", seat.id);
      await assignSeatFromMapAction(form);
      setMessage(`Assigned ${student.name} to Seat ${seat.seat_number}.`);
      setProcessingId(null);
      router.refresh();
    });
  };

  const onBlockSeat = (seat: SeatCard) => {
    const reason = (blockReasons[seat.id] ?? "").trim();
    setProcessingId(seat.id);
    startTransition(async () => {
      const form = new FormData();
      form.set("seat_id", seat.id);
      if (reason) form.set("reason", reason);
      await blockSeatForEnquiry(form);
      setMessage(`Seat ${seat.seat_number} blocked.`);
      setProcessingId(null);
      router.refresh();
    });
  };

  const onReleaseSeat = (seat: SeatCard) => {
    setProcessingId(seat.id);
    startTransition(async () => {
      const form = new FormData();
      form.set("seat_id", seat.id);
      await releaseSeat(form);
      setMessage(`Seat ${seat.seat_number} released.`);
      setProcessingId(null);
      router.refresh();
    });
  };

  return (
    <section className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Visual Seat Map</p>
          <h3 className="mt-2 text-2xl font-black text-[#1b3022]">Drag Student To Available Seat</h3>
        </div>
        <div className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Available</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">Occupied</span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">Blocked</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e4eae0] bg-[#f7faf5] p-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Unassigned students</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {candidates.map((student) => (
            <button
              key={student.id}
              type="button"
              draggable
              onDragStart={() => setDragStudentId(student.id)}
              className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-bold text-[#1b3022] hover:bg-[#f7faf5]"
              title={`Plan: ${student.reader_type} | Status: ${student.status.replaceAll("_", " ")}`}
            >
              {student.name}
              <span className="ml-2 rounded-md bg-[#eef3ea] px-1 py-0.5 text-[9px] uppercase text-[#6b7b69]">
                {student.reader_type[0]}
              </span>
            </button>
          ))}
          {candidates.length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No unassigned active/pending students.</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Seats", value: occupancy.total, tone: "bg-white" },
          { label: "Occupied", value: occupancy.occupied, tone: "bg-slate-50" },
          { label: "Available", value: occupancy.available, tone: "bg-emerald-50" },
          { label: "Blocked", value: occupancy.blocked, tone: "bg-amber-50" },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border border-[#d7ddd3] px-3 py-3 ${item.tone}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">{item.label}</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-[#d7ddd3] bg-[#f7faf5] p-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#1b3022]">
          <span>Occupancy Heat</span>
          <span>{occupancy.percentage}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-[#dde4d9]">
          <div
            className={`h-2 rounded-full ${
              occupancy.percentage >= 90
                ? "bg-red-500"
                : occupancy.percentage >= 70
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            }`}
            style={{ width: `${occupancy.percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {seats.map((seat) => {
          const seatClass =
            seat.status === "available"
              ? "border-emerald-200 bg-emerald-50"
              : seat.status === "blocked"
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200 bg-slate-100";
          return (
            <div
              key={seat.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDropSeat(seat)}
              className={`rounded-2xl border p-3 ${seatClass}`}
            >
              <p className="text-sm font-black text-[#1b3022]">Seat {seat.seat_number}</p>
              <p className="mt-1 text-xs font-semibold text-[#435442] uppercase tracking-[0.14em]">
                {seat.status} {seat.reader_type ? `(${seat.reader_type})` : ""}
              </p>
              <p className="mt-2 text-xs font-black text-[#1b3022] truncate">{seat.student_name || "Unassigned"}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#556455]">Reason: {seat.block_reason || "None"}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`${rolePrefix}/seats/${seat.id}/history`}
                  className="rounded-lg border border-[#cdd7c8] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#6d7c6c] hover:bg-[#f3f7f0]"
                >
                  History
                </Link>
                {seat.status === "occupied" && seat.assigned_reader_id ? (
                  <>
                    <Link
                      href={`${rolePrefix}/students/${seat.assigned_reader_id}`}
                      className="rounded-lg border border-[#cdd7c8] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#1b3022]"
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      disabled={!!processingId}
                      onClick={() => onReleaseSeat(seat)}
                      className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {processingId === seat.id ? <Spinner className="h-3 w-3" /> : null}
                      Release
                    </button>
                  </>
                ) : null}
              </div>

              {seat.status === "available" ? (
                <div className="mt-2 space-y-2">
                  <input
                    value={blockReasons[seat.id] ?? ""}
                    disabled={!!processingId}
                    onChange={(event) =>
                      setBlockReasons((prev) => ({
                        ...prev,
                        [seat.id]: event.target.value,
                      }))
                    }
                    placeholder="Reason for block"
                    className="w-full rounded-lg border border-[#cdd7c8] bg-white px-2 py-1 text-[11px] font-semibold text-[#1b3022] outline-none focus:ring-1 focus:ring-[#1b3022]/20"
                  />
                  <button
                    type="button"
                    disabled={!!processingId}
                    onClick={() => onBlockSeat(seat)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#cdd7c8] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#1b3022] hover:bg-[#f3f7f0] disabled:opacity-50"
                  >
                    {processingId === seat.id ? <Spinner className="h-3 w-3" /> : null}
                    Block Seat
                  </button>
                </div>
              ) : null}

              {seat.status === "blocked" ? (
                <button
                  type="button"
                  disabled={!!processingId}
                  onClick={() => onReleaseSeat(seat)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#cdd7c8] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#1b3022] hover:bg-[#f3f7f0] disabled:opacity-50"
                >
                  {processingId === seat.id ? <Spinner className="h-3 w-3" /> : null}
                  Release Block
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs font-semibold text-[#556455]">{pending ? "Updating seat assignment..." : message || "Drag a student card and drop it on an available seat."}</p>
    </section>
  );
}
