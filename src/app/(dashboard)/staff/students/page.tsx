import Link from "next/link";
import { createRejoinInvoiceAction, rejoinStudentAction, verifyStudentIdProofAction, rejectStudentIdProofAction } from "@/app/(dashboard)/actions";
import type { StudentRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLSelect } from "@/components/ui/url-select";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  type?: string;
};

export default async function StaffStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();
  const statusFilter = (resolved.status ?? "all").trim();
  const typeFilter = (resolved.type ?? "all").trim();

  const supabase = createAdminClient();
  
  let studentsQuery = supabase
    .from("readers")
    .select("id, name, phone, status, reader_type, monthly_fee, onboarding_completed, caution_refunded, id_proof_url, id_proof_verified, seats:seats!fixed_seat_id(seat_number)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") studentsQuery = studentsQuery.eq("status", statusFilter);
  if (typeFilter !== "all") studentsQuery = studentsQuery.eq("reader_type", typeFilter);
  if (query) {
    studentsQuery = studentsQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  // 1. Fetch Students
  const { data: students, error: studentsError } = await studentsQuery.limit(100);
  if (studentsError) console.error("[StaffStudents] Students Fetch Error:", studentsError);

  const studentIds = (students ?? []).map(s => s.id);

  // 2. Fetch Open Bills for these specific students only
  const { data: openBills } = studentIds.length
    ? await supabase
        .from("bills")
        .select("reader_id, status")
        .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
        .in("reader_id", studentIds)
    : { data: [] };

  const openBillReaderIds = new Set((openBills ?? []).map((bill) => bill.reader_id));

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Students</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Student Records</h1>
        </div>
        <Link
          href="/staff/students/onboard"
          className="rounded-2xl bg-[#1b3022] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#1b3022]/20 transition hover:bg-[#27452e]"
        >
          Add Student
        </Link>
      </section>

      <div className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_180px_180px]">
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search by name or phone" 
          className="relative z-10"
        />
        <URLSelect
          name="status"
          defaultValue={statusFilter}
          options={[
            { value: "all", label: "All statuses" },
            { value: "pending_payment", label: "Pending Payment" },
            { value: "pending_onboarding", label: "Pending Onboarding" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "waitlist", label: "Waitlist" },
            { value: "archived", label: "Archived" },
          ]}
        />
        <URLSelect
          name="type"
          defaultValue={typeFilter}
          options={[
            { value: "all", label: "All plans" },
            { value: "monthly", label: "Monthly" },
            { value: "weekly", label: "Weekly" },
            { value: "daily", label: "Daily" },
          ]}
        />
      </div>

      <div className="space-y-4">
        {((students ?? []) as unknown as (StudentRecord & { seats?: { seat_number?: number } | null })[]).map((student) => (
          <article key={student.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1b3022]">{student.name}</h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6d7c6c]">
                  {student.reader_type} Plan · {student.status.replaceAll("_", " ")}
                </p>
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

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {student.status === "archived" && student.caution_refunded && (
                <form action={rejoinStudentAction}>
                  <input type="hidden" name="reader_id" value={student.id} />
                  <button
                    type="submit"
                    className="rounded-2xl bg-[#1b3022] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white transition hover:bg-[#27452e]"
                  >
                    Rejoin Student
                  </button>
                </form>
              )}

              {student.id_proof_url && (
                <>
                  <a
                    href={student.id_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#1b3022] transition hover:bg-[#f3f7f0]"
                  >
                    View ID Proof
                  </a>
                  {!(student as any).id_proof_verified ? (
                    <form action={verifyStudentIdProofAction}>
                      <input type="hidden" name="reader_id" value={student.id} />
                      <PendingSubmitButton
                        idleLabel="Verify ID Proof"
                        pendingLabel="Verifying..."
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700"
                      />
                    </form>
                  ) : (
                    <span className="rounded-2xl bg-emerald-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-800">
                      ID Verified ✓
                    </span>
                  )}
                  {!(student as any).id_proof_verified && (
                    <form action={rejectStudentIdProofAction}>
                      <input type="hidden" name="reader_id" value={student.id} />
                      <PendingSubmitButton
                        idleLabel="Reject ID Proof"
                        pendingLabel="Rejecting..."
                        className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#7d2f2f]"
                      />
                    </form>
                  )}
                </>
              )}

              {student.status === "pending_payment" && !openBillReaderIds.has(student.id) && (
                <form action={createRejoinInvoiceAction}>
                  <input type="hidden" name="reader_id" value={student.id} />
                  <button
                    type="submit"
                    className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#1b3022] transition hover:bg-[#f3f7f0]"
                  >
                    Create Due Invoice
                  </button>
                </form>
              )}
            </div>

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
