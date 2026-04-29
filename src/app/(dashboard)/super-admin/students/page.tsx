import Link from "next/link";

import { bulkStudentBatchAction } from "@/app/(dashboard)/actions";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { StudentListClient } from "../components/student-list-client";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLSelect } from "@/components/ui/url-select";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  status?: string;
  billing?: string;
  page?: string;
  type?: string;
};

type BillingAggregate = {
  openCount: number;
  overdueCount: number;
  totalDue: number;
};

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

const statusOptions = [
  "pending_payment",
  "pending_onboarding",
  "active",
  "inactive",
  "waitlist",
  "rejected",
  "archived",
];

function toNum(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function safeLike(input: string) {
  return input.replaceAll(",", " ").replaceAll("%", "").replaceAll("*", "").trim();
}

function computeBillingMap(
  bills: Array<{ reader_id: string; status: string; amount_due: number; amount_paid: number }>,
) {
  const map = new Map<string, BillingAggregate>();
  for (const bill of bills) {
    const prev = map.get(bill.reader_id) ?? { openCount: 0, overdueCount: 0, totalDue: 0 };
    prev.openCount += 1;
    if (bill.status === "overdue") prev.overdueCount += 1;
    prev.totalDue += Math.max(0, toNum(bill.amount_due) - toNum(bill.amount_paid));
    map.set(bill.reader_id, prev);
  }
  return map;
}

function passesBillingFilter(billing: BillingAggregate, filter: string) {
  if (filter === "overdue") return billing.overdueCount > 0;
  if (filter === "due") return billing.totalDue > 0;
  if (filter === "clear") return billing.totalDue === 0;
  return true;
}

export default async function SuperAdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireDashboardContext(["super_admin", "staff"]);

  const resolvedSearchParams = (await searchParams) ?? {};
  const supabase = createAdminClient();
  const query = (resolvedSearchParams.q ?? "").trim();
  const statusFilter = (resolvedSearchParams.status ?? "all").trim();
  const typeFilter = (resolvedSearchParams.type ?? "all").trim();
  const billingFilter = (resolvedSearchParams.billing ?? "all").trim();
  const page = Math.max(1, Number(resolvedSearchParams.page ?? 1) || 1);
  const pageSize = 25;

  let idsQuery = supabase
    .from("readers")
    .select("id", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    idsQuery = idsQuery.eq("status", statusFilter);
  }
  if (typeFilter !== "all") {
    idsQuery = idsQuery.eq("reader_type", typeFilter);
  }
  if (query) {
    const q = safeLike(query);
    idsQuery = idsQuery.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: allMatchedIdsRows, count: allMatchedCount } = await idsQuery;
  const allMatchedIds = (allMatchedIdsRows ?? []).map((row) => row.id as string);

  let filteredIds = allMatchedIds;
  let billMap = new Map<string, BillingAggregate>();

  if (billingFilter !== "all" || allMatchedIds.length > 0) {
    // Optimization: Instead of using `.in("reader_id", allMatchedIds)` which can crash on long arrays,
    // we fetch ALL open bills (usually a small subset of total bills) and filter in memory.
    const { data: allOpenBills } = await supabase
      .from("bills")
      .select("reader_id,status,amount_due,amount_paid")
      .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]);

    billMap = computeBillingMap(allOpenBills ?? []);
    
    if (billingFilter !== "all") {
      filteredIds = allMatchedIds.filter((id) => {
        const billing = billMap.get(id) ?? { openCount: 0, overdueCount: 0, totalDue: 0 };
        return passesBillingFilter(billing, billingFilter);
      });
    }
  }

  const totalCount = billingFilter === "all" ? allMatchedCount ?? 0 : filteredIds.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize;
  const pageIds = filteredIds.slice(from, to);

  const { data: studentsRaw } = pageIds.length
    ? await supabase
        .from("readers")
        .select(
          "id,name,email,phone,reader_type,status,monthly_fee,onboarding_completed,caution_refunded,fixed_seat_id,seats:fixed_seat_id(seat_number)",
        )
        .in("id", pageIds)
    : { data: [] };

  const studentsById = new Map((studentsRaw ?? []).map((row) => [row.id as string, row as StudentRow]));
  const students = pageIds
    .map((id) => studentsById.get(id))
    .filter((row): row is StudentRow => Boolean(row));

  // Removed redundant query: billMap is already populated for all open bills above

  const totals = students.reduce(
    (acc, student) => {
      const billing = billMap.get(student.id) ?? { openCount: 0, overdueCount: 0, totalDue: 0 };
      acc.visible += 1;
      acc.pendingPayment += student.status === "pending_payment" ? 1 : 0;
      acc.overdue += billing.overdueCount > 0 ? 1 : 0;
      acc.withDues += billing.totalDue > 0 ? 1 : 0;
      return acc;
    },
    { visible: 0, pendingPayment: 0, overdue: 0, withDues: 0 },
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Students Control</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Student Listing</h1>
        </div>
        <Link
          href="/super-admin/students/onboard"
          className="rounded-2xl bg-[#1b3022] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#1b3022]/20 transition hover:bg-[#27452e]"
        >
          Add Student
        </Link>
      </section>

      <div className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 md:grid-cols-[1fr_160px_160px_160px]">
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search by name, phone, email" 
          className="relative z-10"
        />
        <URLSelect
          name="status"
          defaultValue={statusFilter}
          options={[
            { value: "all", label: "All statuses" },
            ...statusOptions.map(s => ({ value: s, label: s.replaceAll("_", " ") }))
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
        <URLSelect
          name="billing"
          defaultValue={billingFilter}
          options={[
            { value: "all", label: "All billing states" },
            { value: "overdue", label: "Overdue only" },
            { value: "due", label: "Any dues" },
            { value: "clear", label: "Cleared" },
          ]}
        />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Matched", value: totalCount },
          { label: "Visible This Page", value: totals.visible },
          { label: "Pending Payment", value: totals.pendingPayment },
          { label: "With Dues", value: totals.withDues },
          { label: "Overdue", value: totals.overdue },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
          </div>
        ))}
      </section>

      <StudentListClient students={students} billMap={billMap} statusOptions={statusOptions} />

      <div className="flex items-center justify-between rounded-[1.4rem] border border-[#d8e0d4] bg-white px-4 py-3">
        <p className="text-sm font-semibold text-[#536352]">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={`?q=${encodeURIComponent(query)}&status=${encodeURIComponent(statusFilter)}&type=${encodeURIComponent(typeFilter)}&billing=${encodeURIComponent(billingFilter)}&page=${Math.max(1, currentPage - 1)}`}
            className={`rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black ${currentPage <= 1 ? "pointer-events-none opacity-40" : "text-[#1b3022]"}`}
          >
            Previous
          </Link>
          <Link
            href={`?q=${encodeURIComponent(query)}&status=${encodeURIComponent(statusFilter)}&type=${encodeURIComponent(typeFilter)}&billing=${encodeURIComponent(billingFilter)}&page=${Math.min(totalPages, currentPage + 1)}`}
            className={`rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black ${currentPage >= totalPages ? "pointer-events-none opacity-40" : "text-[#1b3022]"}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
