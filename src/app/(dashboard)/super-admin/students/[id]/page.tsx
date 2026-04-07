import Link from "next/link";
import { notFound } from "next/navigation";

import {
  convertStudentToMonthlyAction,
  createRejoinInvoiceAction,
  rejoinStudentAction,
  sendStudentAdminNoteAction,
  updateStudentMonthlyFeeAction,
  updateStudentSeatAction,
  updateStudentStatusAction,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireDashboardContext } from "@/lib/auth";
import { isRegistrationFeeApplicable } from "@/lib/billing-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type StudentDetailParams = {
  id: string;
};

type BillRow = {
  id: string;
  invoice_kind: "admission" | "monthly_renewal" | "manual";
  title: string | null;
  month: number | null;
  year: number | null;
  due_date: string | null;
  base_amount: number;
  registration_amount: number;
  caution_amount: number;
  amount_due: number;
  amount_paid: number;
  status: "pending" | "proof_submitted" | "partial" | "paid" | "rejected_proof" | "overdue";
  created_at: string;
};

type TxRow = {
  id: string;
  bill_id: string;
  amount: number;
  payment_proof_url: string | null;
  reference_number: string | null;
  verification_status: "pending" | "verified" | "rejected" | "closed";
  verification_notes: string | null;
  submitted_at: string;
};

type ExitRow = {
  id: string;
  exit_date: string;
  refund_eligible: boolean;
  status: "pending" | "processed" | "rejected";
  created_at: string;
  admin_notes: string | null;
};

type NightLogRow = {
  id: string;
  entry_time: string;
  planned_exit_time: string;
  actual_exit_time: string | null;
  status: "active" | "completed" | "late";
  created_at: string;
};

type StudentNotificationRow = {
  id: string;
  category: string;
  title: string;
  body: string;
  created_at: string;
};

type SeatShiftLogRow = {
  id: string;
  old_seat_id: string | null;
  new_seat_id: string | null;
  shifted_at: string;
  reason: string | null;
  old_seat?: { seat_number?: number } | null;
  new_seat?: { seat_number?: number } | null;
};

const statusOptions = [
  "pending_payment",
  "pending_onboarding",
  "active",
  "inactive",
  "waitlist",
  "rejected",
  "archived",
] as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value: number) {
  return `₹${Math.max(0, Number(value) || 0).toFixed(0)}`;
}

export default async function SuperAdminStudentDetailPage({
  params,
}: {
  params: Promise<StudentDetailParams>;
}) {
  await requireDashboardContext(["super_admin", "staff"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const [studentRes, seatsRes, billsRes, txRes, exitsRes, nightLogsRes, notificationsRes, seatShiftsRes] = await Promise.all([
    supabase
    .from("readers")
    .select(
        "id,name,email,phone,user_id,reader_type,status,monthly_fee,onboarding_completed,registration_paid,caution_paid,caution_refunded,join_date,fixed_seat_id,address,purpose,seats:fixed_seat_id(seat_number)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("seats").select("id,seat_number,status,assigned_reader_id").order("seat_number", { ascending: true }),
    supabase
      .from("bills")
      .select("id,invoice_kind,title,month,year,due_date,base_amount,registration_amount,caution_amount,amount_due,amount_paid,status,created_at")
      .eq("reader_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("transactions")
      .select("id,bill_id,amount,payment_proof_url,reference_number,verification_status,verification_notes,submitted_at")
      .eq("reader_id", id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabase
      .from("exit_requests")
      .select("id,exit_date,refund_eligible,status,created_at,admin_notes")
      .eq("reader_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("night_logs")
      .select("id,entry_time,planned_exit_time,actual_exit_time,status,created_at")
      .eq("reader_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("id,category,title,body,created_at")
      .eq("audience_type", "reader")
      .eq("audience_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("seat_shift_logs")
      .select("id,old_seat_id,new_seat_id,shifted_at,reason,old_seat:old_seat_id(seat_number),new_seat:new_seat_id(seat_number)")
      .eq("reader_id", id)
      .order("shifted_at", { ascending: false })
      .limit(20),
  ]);

  if (!studentRes.data) {
    notFound();
  }

  const student = studentRes.data as {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    user_id: string | null;
    reader_type: string;
    status: string;
    monthly_fee: number;
    onboarding_completed: boolean;
    registration_paid: boolean;
    caution_paid: boolean;
    caution_refunded: boolean;
    join_date: string | null;
    fixed_seat_id: string | null;
    address: string | null;
    purpose: string | null;
    seats?: { seat_number?: number } | null;
  };

  const seats = (seatsRes.data ?? []) as Array<{
    id: string;
    seat_number: number;
    status: "available" | "occupied" | "blocked";
    assigned_reader_id: string | null;
  }>;

  const bills = (billsRes.data ?? []) as BillRow[];
  const txs = (txRes.data ?? []) as TxRow[];
  const exits = (exitsRes.data ?? []) as ExitRow[];
  const nightLogs = (nightLogsRes.data ?? []) as NightLogRow[];
  const notifications = (notificationsRes.data ?? []) as StudentNotificationRow[];
  const seatShifts = (seatShiftsRes.data ?? []) as SeatShiftLogRow[];

  const openBills = bills.filter((bill) => ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"].includes(bill.status));
  const overdueBills = bills.filter((bill) => bill.status === "overdue");
  const totalDue = openBills.reduce((sum, bill) => sum + Math.max(0, (bill.amount_due ?? 0) - (bill.amount_paid ?? 0)), 0);

  const seatOptions = seats.filter((seat) => seat.status === "available" || seat.id === student.fixed_seat_id);
  const hasOpenInvoice = openBills.length > 0;
  const registrationWillApply = isRegistrationFeeApplicable(student.join_date, new Date());

  const txByBill = new Map<string, TxRow[]>();
  for (const tx of txs) {
    const arr = txByBill.get(tx.bill_id) ?? [];
    arr.push(tx);
    txByBill.set(tx.bill_id, arr);
  }

  const timeline = [
    ...bills.map((bill) => ({
      at: bill.created_at,
      type: "Bill",
      label: `${bill.title || bill.invoice_kind} · ${money(bill.amount_due)} · ${bill.status.replaceAll("_", " ")}`,
    })),
    ...txs.map((tx) => ({
      at: tx.submitted_at,
      type: "Proof",
      label: `${money(tx.amount)} · ${tx.verification_status}${tx.reference_number ? ` · Ref ${tx.reference_number}` : ""}`,
    })),
    ...seatShifts.map((shift) => ({
      at: shift.shifted_at,
      type: "Seat",
      label: `Seat ${shift.old_seat?.seat_number ?? "None"} to ${shift.new_seat?.seat_number ?? "None"}${shift.reason ? ` · ${shift.reason}` : ""}`,
    })),
    ...exits.map((exitReq) => ({
      at: exitReq.created_at,
      type: "Exit",
      label: `${exitReq.status} · Exit ${formatDate(exitReq.exit_date)}`,
    })),
    ...nightLogs.map((log) => ({
      at: log.created_at,
      type: "Night",
      label: `${log.status} · Entry ${formatDate(log.entry_time)}`,
    })),
    ...notifications.map((n) => ({
      at: n.created_at,
      type: "Notify",
      label: `${n.title} · ${n.category}`,
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 30);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Student Detail</p>
            <h1 className="mt-3 text-4xl font-black text-[#1b3022]">{student.name}</h1>
            <p className="mt-2 text-sm font-semibold text-[#556455]">{student.email || "No email"}</p>
            <p className="text-sm font-semibold text-[#556455]">{student.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#6d7c6c]">{student.reader_type}</p>
            <p className="mt-2 text-3xl font-black text-[#1b3022] capitalize">{student.status.replaceAll("_", " ")}</p>
            <Link
              href="/super-admin/students"
              className="mt-3 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]"
            >
              Back to Listing
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-[1.3rem] bg-[#f5f8f3] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Seat</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">
              {student.seats?.seat_number ? `Seat ${student.seats.seat_number}` : "Not assigned"}
            </p>
          </div>
          <div className="rounded-[1.3rem] bg-[#f5f8f3] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Monthly Fee</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{money(student.monthly_fee)}</p>
          </div>
          <div className="rounded-[1.3rem] bg-[#f5f8f3] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">Open Bills</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{openBills.length}</p>
          </div>
          <div className="rounded-[1.3rem] bg-[#f8f2e7] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9b6b1a]">Overdue Bills</p>
            <p className="mt-2 text-2xl font-black text-[#7c4f08]">{overdueBills.length}</p>
          </div>
          <div className="rounded-[1.3rem] bg-[#f8eef0] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#964b4b]">Total Due</p>
            <p className="mt-2 text-2xl font-black text-[#7d2f2f]">{money(totalDue)}</p>
          </div>
        </div>
      </section>

      {(student.status === "archived" || student.status === "pending_payment") && (
        <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Rejoin Wizard</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-[#f5f8f3] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6d7c6c]">Step 1</p>
              <p className="mt-1 text-sm font-bold text-[#1b3022]">Assign available seat</p>
              <form action={updateStudentSeatAction} className="mt-3 space-y-2">
                <input type="hidden" name="reader_id" value={student.id} />
                <select
                  name="seat_id"
                  defaultValue={student.fixed_seat_id ?? ""}
                  className="w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]"
                >
                  <option value="">Select seat</option>
                  {seatOptions.map((seat) => (
                    <option key={seat.id} value={seat.id}>
                      Seat {seat.seat_number}
                    </option>
                  ))}
                </select>
                <PendingSubmitButton
                  idleLabel="Save Seat"
                  pendingLabel="Saving..."
                  className="rounded-xl border border-[#d8e0d4] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
                />
              </form>
            </div>

            <div className="rounded-2xl bg-[#f5f8f3] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6d7c6c]">Step 2</p>
              <p className="mt-1 text-sm font-bold text-[#1b3022]">Fee policy check</p>
              <p className="mt-2 text-xs font-semibold text-[#556455]">
                Registration fee: {registrationWillApply ? "Applicable (rejoin beyond validity)" : "Not applicable (within validity)"}.
              </p>
              <p className="mt-1 text-xs font-semibold text-[#556455]">
                Caution: charged on rejoin invoice and marked pending until payment verification.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f5f8f3] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6d7c6c]">Step 3</p>
              <p className="mt-1 text-sm font-bold text-[#1b3022]">Create invoice and notify</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {student.status === "archived" ? (
                  <form action={rejoinStudentAction}>
                    <input type="hidden" name="reader_id" value={student.id} />
                    <PendingSubmitButton
                      idleLabel="Approve Rejoin"
                      pendingLabel="Processing..."
                      className="rounded-xl bg-[#1b3022] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                    />
                  </form>
                ) : null}
                {student.status === "pending_payment" && !hasOpenInvoice ? (
                  <form action={createRejoinInvoiceAction}>
                    <input type="hidden" name="reader_id" value={student.id} />
                    <PendingSubmitButton
                      idleLabel="Create Invoice"
                      pendingLabel="Creating..."
                      className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
                    />
                  </form>
                ) : null}
                <form action={sendStudentAdminNoteAction}>
                  <input type="hidden" name="reader_id" value={student.id} />
                  <input type="hidden" name="title" value="Rejoin flow update" />
                  <input type="hidden" name="body" value="Your rejoin request is under process. Please complete invoice payment when prompted." />
                  <input type="hidden" name="link" value="/student/payments" />
                  <PendingSubmitButton
                    idleLabel="Notify Student"
                    pendingLabel="Sending..."
                    className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
                  />
                </form>
              </div>
              {student.status === "pending_payment" && hasOpenInvoice ? (
                <p className="mt-2 text-xs font-semibold text-emerald-700">Invoice already open.</p>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-4">
        <form action={updateStudentStatusAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Change Status</h2>
          <input type="hidden" name="reader_id" value={student.id} />
          <div className="mt-4 flex gap-2">
            <select
              name="status"
              defaultValue={student.status}
              className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <PendingSubmitButton
              idleLabel="Save"
              pendingLabel="..."
              className="rounded-2xl border border-[#d8e0d4] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#1b3022]"
            />
          </div>
        </form>

        <form action={updateStudentMonthlyFeeAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Update Monthly Fee</h2>
          <input type="hidden" name="reader_id" value={student.id} />
          <div className="mt-4 flex gap-2">
            <input
              name="monthly_fee"
              type="number"
              min={1}
              defaultValue={student.monthly_fee}
              className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
            />
            <PendingSubmitButton
              idleLabel="Save"
              pendingLabel="..."
              className="rounded-2xl border border-[#d8e0d4] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#1b3022]"
            />
          </div>
        </form>

        <form action={updateStudentSeatAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Assign / Release Seat</h2>
          <input type="hidden" name="reader_id" value={student.id} />
          <div className="mt-4 flex gap-2">
            <select
              name="seat_id"
              defaultValue={student.fixed_seat_id ?? ""}
              className="w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
            >
              <option value="">Release seat</option>
              {seatOptions.map((seat) => (
                <option key={seat.id} value={seat.id}>
                  Seat {seat.seat_number}{seat.id === student.fixed_seat_id ? " (current)" : ""}
                </option>
              ))}
            </select>
            <PendingSubmitButton
              idleLabel="Save"
              pendingLabel="..."
              className="rounded-2xl border border-[#d8e0d4] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#1b3022]"
            />
          </div>
        </form>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/super-admin/billing"
              className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
            >
              Billing
            </Link>
            <Link
              href="/super-admin/exit-requests"
              className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
            >
              Exit Requests
            </Link>
            {student.status === "archived" && student.caution_refunded && (
              <form action={rejoinStudentAction}>
                <input type="hidden" name="reader_id" value={student.id} />
                <PendingSubmitButton
                  idleLabel="Rejoin"
                  pendingLabel="..."
                  className="rounded-2xl bg-[#1b3022] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white"
                />
              </form>
            )}
            {student.status === "pending_payment" && !hasOpenInvoice && (
              <form action={createRejoinInvoiceAction}>
                <input type="hidden" name="reader_id" value={student.id} />
                <PendingSubmitButton
                  idleLabel="Create Invoice"
                  pendingLabel="..."
                  className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
                />
              </form>
            )}
          </div>
          {student.status === "pending_payment" && hasOpenInvoice ? (
            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Invoice already open</p>
          ) : null}
        </div>
      </section>

      {student.reader_type !== "monthly" ? (
        <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Convert To Monthly</h2>
          <p className="mt-2 text-sm font-semibold text-[#556455]">
            One-click upgrade with safeguards: requires email, creates portal login if missing, blocks conversion when open invoices exist, then creates monthly conversion invoice.
          </p>
          <form action={convertStudentToMonthlyAction} className="mt-4 grid gap-3 md:grid-cols-[220px_auto]">
            <input type="hidden" name="reader_id" value={student.id} />
            <input
              name="monthly_fee"
              type="number"
              min={1}
              defaultValue={1650}
              className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
            />
            <PendingSubmitButton
              idleLabel={student.user_id ? "Convert + Create Invoice" : "Create Portal + Convert"}
              pendingLabel="Converting..."
              className="w-fit rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-white"
            />
          </form>
        </section>
      ) : null}

      <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Send Note To Student</h2>
        <form action={sendStudentAdminNoteAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="reader_id" value={student.id} />
          <input
            name="title"
            required
            placeholder="Subject"
            className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
          />
          <input
            name="link"
            placeholder="Link (optional, e.g. /student/payments)"
            className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Message"
            className="md:col-span-2 rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
          />
          <PendingSubmitButton
            idleLabel="Send Notification"
            pendingLabel="Sending..."
            className="md:col-span-2 w-fit rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white"
          />
        </form>
      </section>

      <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Billing History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
                <th className="px-3 py-2">Invoice</th>
                <th className="px-3 py-2">Breakdown</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => {
                const remaining = Math.max(0, (bill.amount_due ?? 0) - (bill.amount_paid ?? 0));
                const relatedTx = txByBill.get(bill.id) ?? [];
                return (
                  <tr key={bill.id} className="border-t border-[#e4eae0] align-top">
                    <td className="px-3 py-3">
                      <p className="text-sm font-black text-[#1b3022]">{bill.title || bill.invoice_kind}</p>
                      <p className="text-xs font-semibold text-[#6d7c6c]">{formatDate(bill.created_at)}</p>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-[#556455]">
                      Base {money(bill.base_amount)} · Reg {money(bill.registration_amount)} · Caution {money(bill.caution_amount)}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-[#1b3022]">{money(bill.amount_due)}</td>
                    <td className="px-3 py-3 text-sm font-bold text-emerald-700">{money(bill.amount_paid)}</td>
                    <td className="px-3 py-3 text-sm font-bold text-[#7d2f2f]">{money(remaining)}</td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1b3022]">{bill.status.replaceAll("_", " ")}</p>
                      {relatedTx.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {relatedTx.slice(0, 2).map((tx) => (
                            <div key={tx.id} className="rounded-xl bg-[#f5f8f3] px-2 py-2">
                              <p className="text-[11px] font-bold text-[#1b3022]">{money(tx.amount)} · {tx.verification_status}</p>
                              {tx.payment_proof_url ? (
                                <a href={tx.payment_proof_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] font-bold text-[#1b3022] underline">
                                  Open Proof
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm font-semibold text-[#6d7c6c]">
                    No invoice history available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Exit Requests</h2>
          <div className="mt-4 space-y-3">
            {exits.map((exitReq) => (
              <div key={exitReq.id} className="rounded-2xl bg-[#f5f8f3] p-3">
                <p className="text-sm font-black text-[#1b3022] capitalize">{exitReq.status}</p>
                <p className="text-xs font-semibold text-[#556455]">Exit date: {formatDate(exitReq.exit_date)}</p>
                <p className="text-xs font-semibold text-[#556455]">Refund eligible: {exitReq.refund_eligible ? "Yes" : "No"}</p>
                {exitReq.admin_notes ? <p className="mt-1 text-xs font-semibold text-[#556455]">Notes: {exitReq.admin_notes}</p> : null}
              </div>
            ))}
            {exits.length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No exit request records.</p> : null}
          </div>
        </article>

        <article className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Night Logs</h2>
          <div className="mt-4 space-y-3">
            {nightLogs.map((log) => (
              <div key={log.id} className="rounded-2xl bg-[#f5f8f3] p-3">
                <p className="text-sm font-black text-[#1b3022] capitalize">{log.status}</p>
                <p className="text-xs font-semibold text-[#556455]">Entry: {formatDate(log.entry_time)}</p>
                <p className="text-xs font-semibold text-[#556455]">Planned exit: {formatDate(log.planned_exit_time)}</p>
                <p className="text-xs font-semibold text-[#556455]">Actual exit: {formatDate(log.actual_exit_time)}</p>
              </div>
            ))}
            {nightLogs.length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No night log records.</p> : null}
          </div>
        </article>
      </section>

      <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">Student Timeline</h2>
        <div className="mt-4 space-y-2">
          {timeline.map((item, index) => (
            <div key={`${item.type}-${index}-${item.at}`} className="rounded-2xl bg-[#f5f8f3] p-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6d7c6c]">{item.type}</p>
              <p className="mt-1 text-sm font-bold text-[#1b3022]">{item.label}</p>
              <p className="text-xs font-semibold text-[#556455]">{formatDate(item.at)}</p>
            </div>
          ))}
          {timeline.length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No activity timeline yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
