import Link from "next/link";
import { notFound } from "next/navigation";

import {
  processExitAction,
  rejectExitAction,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { id: string };

function money(value: number | null | undefined) {
  return `₹${Math.max(0, Number(value || 0)).toFixed(0)}`;
}

function asDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

export default async function SuperAdminExitRequestDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireDashboardContext(["super_admin", "staff"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: exitRequest } = await supabase
    .from("exit_requests")
    .select("*, readers(*, seats:fixed_seat_id(seat_number))")
    .eq("id", id)
    .maybeSingle();

  if (!exitRequest) notFound();

  const student = exitRequest.readers as {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    status: string;
    monthly_fee: number;
    caution_paid: boolean;
    caution_refunded: boolean;
    seats?: { seat_number?: number } | null;
  } | null;

  const [openBillsRes, txRes, notifRes] = student
    ? await Promise.all([
        supabase
          .from("bills")
          .select("id, title, amount_due, amount_paid, status, due_date")
          .eq("reader_id", student.id)
          .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("transactions")
          .select("id, amount, verification_status, submitted_at, bill_id")
          .eq("reader_id", student.id)
          .order("submitted_at", { ascending: false })
          .limit(10),
        supabase
          .from("notifications")
          .select("id, title, category, created_at")
          .eq("audience_type", "reader")
          .eq("audience_id", student.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const openDue = (openBillsRes.data ?? []).reduce((sum, bill) => sum + Math.max(0, Number(bill.amount_due) - Number(bill.amount_paid)), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Exit Request Detail</p>
            <h1 className="mt-3 text-3xl font-black text-[#1b3022]">{student?.name || "Student"}</h1>
            <p className="mt-2 text-sm font-semibold text-[#536352]">Exit Date: {new Date(exitRequest.exit_date).toLocaleDateString("en-IN")}</p>
            <p className="text-sm font-semibold text-[#536352]">Request Created: {asDateTime(exitRequest.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="rounded-full border border-[#d8e0d4] bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
              {exitRequest.status.replaceAll("_", " ")}
            </p>
            <Link href="/super-admin/exit-requests" className="mt-3 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]">
              Back to Exit Requests
            </Link>
            {student?.id ? (
              <Link href={`/super-admin/students/${student.id}`} className="mt-2 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]">
                Open Student
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Seat</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{student?.seats?.seat_number ? `Seat ${student.seats.seat_number}` : "Unassigned"}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Student Status</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{student?.status?.replaceAll("_", " ") || "-"}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Monthly Fee</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{money(student?.monthly_fee)}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Open Due</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{money(openDue)}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Refund Eligible</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{exitRequest.refund_eligible ? "Yes" : "No"}</p>
          </div>
        </div>
      </section>

      {exitRequest.status === "pending" ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <form action={processExitAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Process Exit</p>
            <input type="hidden" name="exit_request_id" value={exitRequest.id} />
            <textarea
              name="admin_notes"
              placeholder="Reason / settlement note"
              className="mt-3 min-h-32 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
            />
            <PendingSubmitButton
              idleLabel="Process Exit"
              pendingLabel="Processing..."
              className="mt-3 rounded-xl bg-[#1b3022] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            />
          </form>

          <form action={rejectExitAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Reject Exit</p>
            <input type="hidden" name="exit_request_id" value={exitRequest.id} />
            <textarea
              name="admin_notes"
              placeholder="Rejection reason (required by policy)"
              className="mt-3 min-h-32 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
            />
            <PendingSubmitButton
              idleLabel="Reject Exit"
              pendingLabel="Rejecting..."
              className="mt-3 rounded-xl border border-[#d7ddd3] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
            />
          </form>
        </section>
      ) : (
        <section className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Resolution</p>
          <p className="mt-2 text-sm font-semibold text-[#536352]">Status: {exitRequest.status.replaceAll("_", " ")}</p>
          <p className="mt-2 text-sm font-semibold text-[#536352]">Admin note: {exitRequest.admin_notes || "No note"}</p>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Open Bills</p>
          <div className="mt-3 space-y-2">
            {(openBillsRes.data ?? []).map((bill) => (
              <div key={bill.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-sm font-black text-[#1b3022]">{bill.title || bill.id}</p>
                <p className="text-xs font-semibold text-[#556455]">Due {money(Number(bill.amount_due) - Number(bill.amount_paid))} · {bill.status}</p>
              </div>
            ))}
            {(openBillsRes.data ?? []).length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No open bills.</p> : null}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Recent Transactions</p>
          <div className="mt-3 space-y-2">
            {(txRes.data ?? []).map((tx) => (
              <div key={tx.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-sm font-black text-[#1b3022]">{money(tx.amount)} · {tx.verification_status}</p>
                <p className="text-xs font-semibold text-[#556455]">{asDateTime(tx.submitted_at)}</p>
              </div>
            ))}
            {(txRes.data ?? []).length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No transactions.</p> : null}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Notification Trail</p>
          <div className="mt-3 space-y-2">
            {(notifRes.data ?? []).map((n) => (
              <div key={n.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-sm font-black text-[#1b3022]">{n.title}</p>
                <p className="text-xs font-semibold text-[#556455]">{n.category} · {asDateTime(n.created_at)}</p>
              </div>
            ))}
            {(notifRes.data ?? []).length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No notifications.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
