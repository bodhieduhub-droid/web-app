import Link from "next/link";

import { createStaffAccountAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { createAdminClient } from "@/lib/supabase/admin";
import { DebouncedSearch } from "@/components/ui/debounced-search";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  page?: string;
};

type StaffProfileRow = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export default async function SuperAdminStaffPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();
  const requestedPage = Number.parseInt(resolved.page ?? "1", 10);
  const pageSize = 10;
  const initialPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
  const from = (initialPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();
  let staffQuery = supabase
    .from("profiles")
    .select("id, full_name, role, created_at", { count: "exact" })
    .eq("role", "staff");
    
  if (query) {
    const q = query.replaceAll(",", " ").replaceAll("%", "").replaceAll("*", "").trim();
    const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q);
    staffQuery = isUuidLike
      ? staffQuery.or(`full_name.ilike.%${q}%,id.eq.${q}`)
      : staffQuery.ilike("full_name", `%${q}%`);
  }
  const { data: staffRows, count } = await staffQuery.range(from, to);

  const pageRows = (staffRows ?? []) as StaffProfileRow[];
  const totalCount = count ?? 0;
  const staffIds = pageRows.map((member) => member.id);

  const [enquiryRes, seatsRes, verifyRes, postRes] = staffIds.length
    ? await Promise.all([
        supabase
          .from("enquiries")
          .select("id, assigned_to, status")
          .in("assigned_to", staffIds)
          .in("status", ["new", "contacted", "seat_blocked"]),
        supabase
          .from("seats")
          .select("id, blocked_by_profile_id, status")
          .in("blocked_by_profile_id", staffIds)
          .eq("status", "blocked"),
        supabase
          .from("transactions")
          .select("id, verified_by_profile_id")
          .in("verified_by_profile_id", staffIds)
          .in("verification_status", ["verified", "rejected", "closed"]),
        supabase
          .from("posts")
          .select("id, author_profile_id")
          .in("author_profile_id", staffIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const enquiryMap = new Map<string, number>();
  for (const item of enquiryRes.data ?? []) {
    if (!item.assigned_to) continue;
    enquiryMap.set(item.assigned_to, (enquiryMap.get(item.assigned_to) ?? 0) + 1);
  }

  const blockedSeatMap = new Map<string, number>();
  for (const item of seatsRes.data ?? []) {
    if (!item.blocked_by_profile_id) continue;
    blockedSeatMap.set(item.blocked_by_profile_id, (blockedSeatMap.get(item.blocked_by_profile_id) ?? 0) + 1);
  }

  const verificationMap = new Map<string, number>();
  for (const item of verifyRes.data ?? []) {
    if (!item.verified_by_profile_id) continue;
    verificationMap.set(item.verified_by_profile_id, (verificationMap.get(item.verified_by_profile_id) ?? 0) + 1);
  }

  const postMap = new Map<string, number>();
  for (const item of postRes.data ?? []) {
    if (!item.author_profile_id) continue;
    postMap.set(item.author_profile_id, (postMap.get(item.author_profile_id) ?? 0) + 1);
  }

  const totalOpenAssignments = [...enquiryMap.values()].reduce((sum, value) => sum + value, 0);
  const totalBlockedSeats = [...blockedSeatMap.values()].reduce((sum, value) => sum + value, 0);
  const totalVerifications = [...verificationMap.values()].reduce((sum, value) => sum + value, 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(initialPage, totalPages);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Staff</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Staff Control Center</h1>
        <p className="mt-2 text-sm font-semibold text-[#536352]">Create staff accounts, track workload, and open detailed performance pages.</p>
      </section>

      <form action={createStaffAccountAction} className="grid gap-3 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 md:grid-cols-4">
        <input name="full_name" placeholder="Full name" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <input name="email" type="email" placeholder="staff@email.com" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <input name="password" placeholder="Optional password" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <PendingSubmitButton
          idleLabel="Create Staff Account"
          pendingLabel="Creating..."
          className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>

      <div className="grid gap-3 rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
        <div className="premium-card-inner"></div>
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search by name or profile id" 
          className="relative z-10"
        />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active Staff", value: totalCount },
          { label: "Open Enquiries Assigned", value: totalOpenAssignments },
          { label: "Blocked Seats", value: totalBlockedSeats },
          { label: "Payment Verifications", value: totalVerifications },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-[1.6rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6">
        <table className="min-w-full text-left">
          <thead className="bg-[#f5f8f3]">
            <tr className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Open Enquiries</th>
              <th className="px-4 py-3">Blocked Seats</th>
              <th className="px-4 py-3">Verifications</th>
              <th className="px-4 py-3">Posts</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((member) => (
              <tr key={member.id} className="border-t border-[#e4eae0] hover:bg-[#fcfdfb] transition-colors">
                <td className="px-4 py-4">
                  <p className="font-black text-[#1b3022]">{member.full_name || "Staff Member"}</p>
                  <p className="text-xs font-semibold text-[#6d7c6c]">{member.id}</p>
                </td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{member.role}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{enquiryMap.get(member.id) ?? 0}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{blockedSeatMap.get(member.id) ?? 0}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{verificationMap.get(member.id) ?? 0}</td>
                <td className="px-4 py-4 text-sm font-bold text-[#1b3022]">{postMap.get(member.id) ?? 0}</td>
                <td className="px-4 py-4">
                  <Link
                    href={`/super-admin/staff/${member.id}`}
                    className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022] hover:bg-[#f5f8f3]"
                  >
                    Open Detail
                  </Link>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm font-semibold text-[#6d7c6c]">
                  No staff members found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded-[1.2rem] border border-[#d8e0d4] bg-white px-4 py-3 text-xs font-bold text-[#1b3022] shadow-lg shadow-[#27452e]/6">
        <p>
          Page {currentPage} of {totalPages} · {totalCount} results
        </p>
        <div className="flex items-center gap-2">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className="rounded-xl border border-[#d8e0d4] px-4 py-2 hover:bg-[#f5f8f3]">Prev</Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-4 py-2 text-[#9aa79a]">Prev</span>
          )}
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)} className="rounded-xl border border-[#d8e0d4] px-4 py-2 hover:bg-[#f5f8f3]">Next</Link>
          ) : (
            <span className="rounded-xl border border-[#e4eae0] px-4 py-2 text-[#9aa79a]">Next</span>
          )}
        </div>
      </div>
    </div>
  );
}
