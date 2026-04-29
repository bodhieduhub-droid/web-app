import { createAdminClient } from "@/lib/supabase/admin";
import { getOptimizedImage } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, CircleDollarSign } from "lucide-react";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";

export async function StudentBillsSection({ studentId }: { studentId: string }) {
  const supabase = createAdminClient();
  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .eq("reader_id", studentId)
    .neq("status", "paid")
    .order("created_at", { ascending: false });

  const openBills = bills ?? [];
  const totalDue = openBills.reduce((s, b) => s + (b.amount_due - b.amount_paid), 0);

  if (openBills.length === 0) return (
    <RealtimeTableListener table="bills" filter={`reader_id=eq.${studentId}`} />
  );

  return (
    <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow shadow-amber-100">
      <RealtimeTableListener table="bills" filter={`reader_id=eq.${studentId}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-700">Payment Due</p>
          <p className="mt-2 text-2xl font-black text-amber-900">₹{totalDue.toFixed(0)}</p>
          <p className="mt-1 text-xs font-medium text-amber-700">
            {openBills.length} open invoice{openBills.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/student/payments"
          className="shrink-0 rounded-2xl bg-amber-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-white transition hover:bg-amber-800"
        >
          Pay Now →
        </Link>
      </div>
    </div>
  );
}

export function BillsSkeleton() {
  return (
    <div className="h-32 w-full animate-pulse rounded-[2rem] bg-gray-100" />
  );
}
