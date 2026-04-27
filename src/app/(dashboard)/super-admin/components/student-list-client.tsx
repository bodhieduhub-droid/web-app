"use client";

import { useOptimistic, useTransition, useState } from "react";
import Link from "next/link";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { bulkStudentBatchAction } from "@/app/(dashboard)/actions";

type StudentRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  reader_type: string;
  status: string;
  monthly_fee: number;
  onboarding_completed: boolean;
  caution_refunded: boolean;
  seats?: { seat_number?: number } | null;
};

type BillingAggregate = {
  openCount: number;
  overdueCount: number;
  totalDue: number;
};

type StudentListClientProps = {
  students: StudentRow[];
  billMap: Map<string, BillingAggregate>;
  statusOptions: string[];
};

export function StudentListClient({ students, billMap, statusOptions }: StudentListClientProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStudents, setOptimisticStudents] = useOptimistic(
    students,
    (state, updatedState: { ids: string[]; status: string }) => {
      return state.map((student) => {
        if (updatedState.ids.includes(student.id)) {
          return { ...student, status: updatedState.status };
        }
        return student;
      });
    }
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAction = async (formData: FormData) => {
    const operation = formData.get("operation") as string;
    const targetStatus = formData.get("status") as string;

    if (operation === "status" && selectedIds.size > 0 && targetStatus) {
      startTransition(() => {
        setOptimisticStudents({ ids: Array.from(selectedIds), status: targetStatus });
      });
    }

    await bulkStudentBatchAction(formData);
    setSelectedIds(new Set());
  };

  return (
    <form action={handleAction} className="premium-card p-4">
      <div className="premium-card-inner"></div>
      <div className="grid gap-3 rounded-[1.2rem] border border-[#e4eae0]/50 bg-[#f7faf5]/50 p-3 md:grid-cols-5 relative z-10 mb-4">
        <select
          name="operation"
          defaultValue="status"
          className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-bold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)]"
        >
          <option value="status">Bulk status update</option>
          <option value="invoice">Create rejoin invoices</option>
          <option value="note">Send student note</option>
        </select>
        <select
          name="status"
          defaultValue="pending_payment"
          className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-bold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)]"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <input
          name="title"
          placeholder="Note title (for note op)"
          className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)]"
        />
        <input
          name="body"
          placeholder="Note body (for note op)"
          className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)]"
        />
        <PendingSubmitButton
          idleLabel="Run Bulk Action"
          pendingLabel="Processing..."
          className="rounded-xl bg-[#1b3022] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#27452e]"
        />
      </div>

      <div className="overflow-hidden rounded-[1.2rem] border border-[#e4eae0] relative z-10">
        <table className="min-w-full text-left">
          <thead className="bg-[#f5f8f3] border-b border-[#e4eae0]">
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-5 py-4">Select</th>
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Seat</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Due</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {optimisticStudents.map((student) => {
              const billing = billMap.get(student.id) ?? { openCount: 0, overdueCount: 0, totalDue: 0 };
              const hasOpenInvoice = billing.openCount > 0;
              return (
                <tr key={student.id} className="interactive-row border-b border-[#e4eae0]/50 hover:bg-[#f9fbf8] align-top">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      name="reader_ids"
                      value={student.id}
                      checked={selectedIds.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="h-4 w-4 rounded border-[#c7d2c1] text-[#1b3022] focus:ring-[#1b3022]"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-black text-[#1b3022]">
                      {student.name}
                      <span className="ml-2 rounded-md bg-[#eef3ea] border border-[#d8e0d4]/50 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#6b7b69]">
                        {student.reader_type}
                      </span>
                    </p>
                    <p className="text-xs font-medium text-[#536352]">{student.email || "No email"}</p>
                    <p className="text-xs font-medium text-[#536352]">{student.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[#1b3022]">
                    {student.seats?.seat_number ? `Seat ${student.seats.seat_number}` : "Not assigned"}
                  </td>
                  <td className="px-5 py-4">
                    <p className={`text-sm font-bold capitalize transition-colors duration-300 ${isPending && selectedIds.has(student.id) ? 'text-emerald-600 animate-pulse' : 'text-[#1b3022]'}`}>
                      {student.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#6d7c6c]">₹{student.monthly_fee}/month</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className={`text-sm font-black ${billing.totalDue > 0 ? "text-[#7d2f2f]" : "text-emerald-700"}`}>
                      ₹{billing.totalDue.toFixed(0)}
                    </p>
                    <p className="text-xs font-semibold text-[#6d7c6c]">
                      {billing.openCount} open · {billing.overdueCount} overdue
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/super-admin/students/${student.id}`}
                        className="rounded-xl border border-[#d8e0d4] bg-white hover:bg-[#f0f5ec] px-3 py-2 text-xs font-black text-[#1b3022] shadow-sm transition-colors"
                      >
                        View Details
                      </Link>
                      {student.status === "archived" && student.caution_refunded ? (
                        <span className="rounded-xl bg-[#1b3022] px-3 py-2 text-xs font-black text-white cursor-pointer hover:bg-[#27452e]">Rejoin from details</span>
                      ) : null}
                      {student.status === "pending_payment" && !hasOpenInvoice ? (
                        <span className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022] cursor-pointer hover:bg-[#f0f5ec]">Invoice from details</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {optimisticStudents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-sm font-bold text-[#1b3022]">No students found</p>
                  <p className="text-xs font-medium text-[#6d7c6c] mt-1">Adjust your filters to see more results.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </form>
  );
}
