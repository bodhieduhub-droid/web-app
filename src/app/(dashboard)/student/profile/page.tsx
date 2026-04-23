import { Suspense } from "react";
import { ArrowRightLeft, FileCheck, MapPin } from "lucide-react";

import { updateExamInterestsAction } from "@/app/(dashboard)/actions";
import { SeatChangeRequestForm } from "@/components/student/seat-change-request-form";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { SeatChangeRequestRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CardsSkeleton } from "@/components/dashboard/suspense-skeletons";

export const dynamic = "force-dynamic";

const examCategories = ["SSC", "PSC", "UPSC", "BANKING", "RAILWAY"];

const statusLabel: Record<string, string> = {
  active: "Active Member",
  pending_onboarding: "Pending Onboarding",
  pending_payment: "Pending Payment",
  inactive: "Inactive",
  waitlist: "Waitlisted",
  archived: "Alumni",
  rejected: "Rejected",
};

const statusColor: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_onboarding: "bg-amber-50 text-amber-700 border-amber-200",
  pending_payment: "bg-orange-50 text-orange-700 border-orange-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  archived: "bg-purple-50 text-purple-700 border-purple-200",
};

// Async component — loads all profile data independently
async function ProfileContent({ studentId }: { studentId: string }) {
  const supabase = createAdminClient();

  const [
    { data: interests },
    { data: currentSeatData },
    { data: availableSeats },
    { data: pendingSeatRequest },
  ] = await Promise.all([
    supabase.from("student_exam_interests").select("category").eq("reader_id", studentId),
    supabase.from("seats").select("seat_number, id").eq("status", "available").order("seat_number", { ascending: true }).limit(1),
    supabase.from("seats").select("id, seat_number").eq("status", "available").order("seat_number", { ascending: true }),
    supabase
      .from("seat_change_requests")
      .select("*")
      .eq("reader_id", studentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Fetch current assigned seat for student
  const { data: studentRow } = await supabase
    .from("readers")
    .select("fixed_seat_id, status, name, email, phone, address, purpose, join_date, monthly_fee, registration_paid, caution_paid, id_proof_url, preparing_for_exam")
    .eq("id", studentId)
    .maybeSingle();

  const selectedCategories = (interests ?? []).map((i) => i.category as string);
  const seats = (availableSeats ?? []) as { id: string; seat_number: number }[];
  const activeSeatRequest = pendingSeatRequest as SeatChangeRequestRecord | null;

  // Get current seat number
  let seatNumber: number | null = null;
  if (studentRow?.fixed_seat_id) {
    const { data: seatData } = await supabase
      .from("seats")
      .select("seat_number")
      .eq("id", studentRow.fixed_seat_id)
      .maybeSingle();
    seatNumber = (seatData as { seat_number?: number } | null)?.seat_number ?? null;
  }

  // Get requested seat number
  let requestedSeatNumber: number | null = null;
  if (activeSeatRequest) {
    const { data: reqSeat } = await supabase
      .from("seats")
      .select("seat_number")
      .eq("id", activeSeatRequest.requested_seat_id)
      .maybeSingle();
    requestedSeatNumber = (reqSeat as { seat_number?: number } | null)?.seat_number ?? null;
  }

  const joinDate = studentRow?.join_date
    ? new Date(studentRow.join_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Personal Details</p>
          <div className="mt-5 space-y-3">
            {[
              { label: "Full Name", value: studentRow?.name ?? "—" },
              { label: "Email", value: studentRow?.email ?? "—" },
              { label: "Phone", value: studentRow?.phone ?? "—" },
              { label: "Address", value: studentRow?.address ?? "—" },
              { label: "Purpose", value: studentRow?.purpose ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-[#f7faf5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8a9d88]">{label}</p>
                <p className="mt-1 text-sm font-bold text-[#1b3022]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Membership */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Membership</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-[#536352]">Status</p>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${statusColor[studentRow?.status ?? ""] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
                  {statusLabel[studentRow?.status ?? ""] ?? (studentRow?.status ?? "—")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-[#536352]">Monthly Fee</p>
                <p className="text-lg font-black text-[#1b3022]">₹{studentRow?.monthly_fee ?? "—"}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-[#536352]">Joined</p>
                <p className="text-sm font-bold text-[#1b3022]">{joinDate}</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-[#536352]">Current Seat</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${seatNumber ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  <MapPin className="h-3 w-3" />
                  {seatNumber ? `Seat #${seatNumber}` : "Not Assigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Fee Deposits */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Fee Deposits</p>
            <div className="mt-4 space-y-3">
              {[
                { label: "Registration Fee", paid: studentRow?.registration_paid },
                { label: "Caution Deposit", paid: studentRow?.caution_paid },
              ].map(({ label, paid }) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-[#536352]">{label}</p>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${paid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                    {paid ? "Paid" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ID Proof */}
          {studentRow?.id_proof_url && (
            <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">ID Proof</p>
              <a
                href={studentRow.id_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#d8e0d4] px-4 py-2.5 text-sm font-bold text-[#1b3022] transition hover:bg-[#f3f7f0]"
              >
                <FileCheck className="h-4 w-4" />
                View ID Proof
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Seat Change Request */}
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ea]">
            <ArrowRightLeft className="h-5 w-5 text-[#536352]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Seat Preference</p>
            <h2 className="mt-1 text-2xl font-black text-[#1b3022]">Request Seat Change</h2>
            <p className="mt-1 text-sm font-medium text-[#536352]">
              {seatNumber
                ? `You are on Seat #${seatNumber}. Select an available seat to notify staff.`
                : "You don't have a seat assigned yet. Once assigned, you can request a change here."}
            </p>
          </div>
        </div>

        {activeSeatRequest ? (
          <div className="mt-6 rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">Seat-change request pending</p>
            <p className="mt-2 text-lg font-black text-amber-900">
              {seatNumber ? `Seat #${seatNumber}` : "No current seat"} → {requestedSeatNumber ? `Seat #${requestedSeatNumber}` : "requested seat"}
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-amber-800">
              Staff has your request. You can submit another once this one is resolved.
            </p>
            <p className="mt-3 text-sm font-medium text-amber-700">
              Requested on{" "}
              {new Date(activeSeatRequest.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        ) : seats.length > 0 ? (
          <SeatChangeRequestForm seats={seats} />
        ) : (
          <div className="mt-5 rounded-2xl bg-[#f5f8f3] px-4 py-4 text-sm font-medium text-[#536352]">
            No seats are currently available for transfer. Check back later.
          </div>
        )}
      </div>

      {/* Exam Interests */}
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Exam Preferences</p>
        <h2 className="mt-3 text-2xl font-black text-[#1b3022]">Update Your Exam Goals</h2>
        <p className="mt-2 text-sm font-medium text-[#536352]">
          Select which exams you&apos;re preparing for. This personalizes your alerts and resources.
        </p>

        <form action={updateExamInterestsAction} className="mt-6 space-y-5">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a9d88]">Preparing for exams?</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1b3022]">
                <input type="radio" name="preparing_for_exam" value="yes" defaultChecked={studentRow?.preparing_for_exam ?? false} />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#1b3022]">
                <input type="radio" name="preparing_for_exam" value="no" defaultChecked={!(studentRow?.preparing_for_exam ?? false)} />
                No
              </label>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#8a9d88]">Select categories</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {examCategories.map((cat) => (
                <label
                  key={cat}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${selectedCategories.includes(cat) ? "border-[#1b3022] bg-[#f0f7ed] text-[#1b3022]" : "border-[#d7ddd3] bg-[#f7faf5] text-[#536352]"}`}
                >
                  <input
                    type="checkbox"
                    name="exam_categories"
                    value={cat}
                    defaultChecked={selectedCategories.includes(cat)}
                    className="accent-[#1b3022]"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <PendingSubmitButton
            idleLabel="Save Preferences"
            pendingLabel="Saving…"
            className="rounded-2xl bg-[#1b3022] px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-[#1b3022]/20 transition hover:bg-[#27452e] disabled:opacity-50"
          />
        </form>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">My Profile</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">{student.name}</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Manage your membership details, seat preference, and exam goals.
        </p>
      </section>

      {/* ── Profile Content (SUSPENSE — streams independently) ── */}
      <Suspense fallback={<CardsSkeleton count={4} cols={2} />}>
        <ProfileContent studentId={student.id} />
      </Suspense>
    </div>
  );
}
