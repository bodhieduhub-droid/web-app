import Link from "next/link";
import { notFound } from "next/navigation";

import {
  blockSeatForEnquiry,
  convertEnquiryToStudent,
  updateEnquiryAction,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireDashboardContext } from "@/lib/auth";
import type { SeatRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { id: string };

function asDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

export default async function SuperAdminEnquiryDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireDashboardContext(["super_admin", "staff"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: enquiry }, { data: seats }, { data: staff }, { data: linkedSeat }] = await Promise.all([
    supabase.from("enquiries").select("*, profiles:assigned_to(full_name)").eq("id", id).maybeSingle(),
    supabase
      .from("seats")
      .select("id, seat_number, status")
      .in("status", ["available", "blocked"])
      .order("seat_number", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["super_admin", "staff"])
      .order("full_name", { ascending: true }),
    supabase
      .from("seats")
      .select("id, seat_number, status, block_reason")
      .eq("linked_enquiry_id", id)
      .eq("status", "blocked")
      .maybeSingle(),
  ]);

  if (!enquiry) notFound();

  const seatOptions = (seats ?? []) as Pick<SeatRecord, "id" | "seat_number" | "status">[];
  const staffOptions = (staff ?? []) as Array<{ id: string; full_name: string | null; role: string }>;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Enquiry Detail</p>
            <h1 className="mt-3 text-3xl font-black text-[#1b3022]">{enquiry.name}</h1>
            <p className="mt-2 text-sm font-semibold text-[#536352]">{enquiry.phone} · {enquiry.email || "No email"}</p>
            <p className="text-sm font-semibold text-[#536352]">Created: {asDate(enquiry.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="rounded-full border border-[#d8e0d4] bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
              {enquiry.status.replaceAll("_", " ")}
            </p>
            <Link href="/super-admin/enquiries" className="mt-3 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]">
              Back to Enquiries
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Status</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{enquiry.status.replaceAll("_", " ")}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Owner</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{enquiry.profiles?.full_name || "Unassigned"}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Linked Seat</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{linkedSeat?.seat_number ? `Seat ${linkedSeat.seat_number}` : "None"}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Converted</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{enquiry.converted_reader_id ? "Yes" : "No"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <form action={updateEnquiryAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Lead Management</p>
          <input type="hidden" name="enquiry_id" value={enquiry.id} />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <select name="status" defaultValue={enquiry.status} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="seat_blocked">Seat blocked</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
            <select name="assigned_to" defaultValue={enquiry.assigned_to ?? ""} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
              <option value="">Unassigned</option>
              {staffOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {(member.full_name || "User") + " (" + member.role + ")"}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="notes"
            defaultValue={enquiry.notes ?? ""}
            placeholder="Call notes / context"
            className="mt-2 min-h-28 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
          />
          <PendingSubmitButton
            idleLabel="Save Lead Update"
            pendingLabel="Saving..."
            className="mt-3 rounded-xl bg-[#1b3022] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white"
          />
        </form>

        <form action={blockSeatForEnquiry} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Seat Block</p>
          <input type="hidden" name="enquiry_id" value={enquiry.id} />
          <div className="mt-3 grid gap-2">
            <select name="seat_id" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]" required>
              <option value="">Choose seat</option>
              {seatOptions.filter((seat) => seat.status === "available").map((seat) => (
                <option key={seat.id} value={seat.id}>
                  Seat {seat.seat_number}
                </option>
              ))}
            </select>
            <input name="reason" defaultValue={linkedSeat?.block_reason || "Seat blocked for follow-up"} placeholder="Reason for block" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]" />
          </div>
          <PendingSubmitButton
            idleLabel="Block Seat"
            pendingLabel="Blocking..."
            className="mt-3 rounded-xl border border-[#d7ddd3] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
          />
        </form>
      </section>

      {enquiry.status !== "converted" ? (
        <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Convert To Student</p>
          <form action={convertEnquiryToStudent} className="mt-3 grid gap-2 md:grid-cols-6">
            <input type="hidden" name="enquiry_id" value={enquiry.id} />
            <input name="email" type="email" defaultValue={enquiry.email ?? ""} placeholder="Student email" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022] md:col-span-2" required />
            <select name="reader_type" defaultValue="monthly" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]">
              <option value="daily">Daily plan (Rs 150)</option>
              <option value="weekly">Weekly plan (Rs 650)</option>
              <option value="monthly">Monthly plan (Rs 1650)</option>
            </select>
            <select name="portal_access" defaultValue="no" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]">
              <option value="no">No portal login</option>
              <option value="yes">Create portal login</option>
            </select>
            <select name="seat_id" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]" required>
              <option value="">Assign seat</option>
              {seatOptions.filter((seat) => seat.status === "available").map((seat) => (
                <option key={seat.id} value={seat.id}>
                  Seat {seat.seat_number}
                </option>
              ))}
            </select>
            <input name="plan_fee" type="number" defaultValue={1650} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]" />
            <input name="join_date" type="date" className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022] md:col-span-2" />
            <PendingSubmitButton
              idleLabel="Convert + Send Credentials"
              pendingLabel="Converting..."
              className="rounded-xl bg-[#1b3022] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white md:col-span-6"
            />
          </form>
        </section>
      ) : null}
    </div>
  );
}
