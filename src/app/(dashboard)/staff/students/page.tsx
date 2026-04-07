import { createRejoinInvoiceAction, rejoinStudentAction } from "@/app/(dashboard)/actions";
import type { StudentRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function StaffStudentsPage() {
  const supabase = createAdminClient();
  const [{ data: students }, { data: openBills }] = await Promise.all([
    supabase
      .from("readers")
      .select("*, seats:fixed_seat_id(seat_number)")
      .order("created_at", { ascending: false }),
    supabase
      .from("bills")
      .select("reader_id, status")
      .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]),
  ]);

  const openBillReaderIds = new Set((openBills ?? []).map((bill) => bill.reader_id));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Students</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Student Records</h1>
      </section>

      <div className="space-y-4">
        {((students ?? []) as (StudentRecord & { seats?: { seat_number?: number } | null })[]).map((student) => (
          <article key={student.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-black text-[#1b3022]">{student.name}</p>
                <p className="mt-2 text-sm font-medium text-[#556455]">{student.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#6d7c6c]">{student.reader_type}</p>
                <p className="mt-2 text-sm font-bold capitalize text-[#1b3022]">{student.status.replaceAll("_", " ")}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.4rem] bg-[#f5f8f3] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Seat</p>
                <p className="mt-2 font-black text-[#1b3022]">{student.seats?.seat_number ? `Seat ${student.seats.seat_number}` : "Not assigned"}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[#f5f8f3] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Monthly Fee</p>
                <p className="mt-2 font-black text-[#1b3022]">₹{student.monthly_fee}</p>
              </div>
              <div className="rounded-[1.4rem] bg-[#f5f8f3] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Onboarding</p>
                <p className="mt-2 font-black text-[#1b3022]">{student.onboarding_completed ? "Complete" : "Pending"}</p>
              </div>
            </div>

            {student.status === "archived" && student.caution_refunded && (
              <form action={rejoinStudentAction} className="mt-5">
                <input type="hidden" name="reader_id" value={student.id} />
                <button
                  type="submit"
                  className="rounded-2xl bg-[#1b3022] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-[#27452e]"
                >
                  Rejoin Student
                </button>
              </form>
            )}

            {student.status === "pending_payment" && !openBillReaderIds.has(student.id) && (
              <form action={createRejoinInvoiceAction} className="mt-3">
                <input type="hidden" name="reader_id" value={student.id} />
                <button
                  type="submit"
                  className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#1b3022] transition hover:bg-[#f3f7f0]"
                >
                  Create Due Invoice
                </button>
              </form>
            )}

            {student.status === "pending_payment" && openBillReaderIds.has(student.id) && (
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                Invoice already open in billing
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
