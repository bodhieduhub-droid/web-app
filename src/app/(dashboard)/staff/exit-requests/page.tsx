import { processExitAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { ExitRequestRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { formatDateToIST } from "@/lib/utils";

type ExitRequestRow = ExitRequestRecord & {
  readers: { name: string; phone: string; email: string | null; caution_paid: boolean; status: string } | null;
};

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

export default async function StaffExitRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();

  const supabase = createAdminClient();
  
  let exitRequestsQuery = supabase
    .from("exit_requests")
    .select("*, readers!inner(name, phone, email, caution_paid, status)")
    .order("created_at", { ascending: false });

  if (query) {
    exitRequestsQuery = exitRequestsQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`, { foreignTable: "readers" });
  }

  const { data: exitRequests } = await exitRequestsQuery;

  const pendingRequests = ((exitRequests ?? []) as ExitRequestRow[]).filter((req) => req.status === "pending");
  const processedRequests = ((exitRequests ?? []) as ExitRequestRow[]).filter((req) => req.status !== "pending").slice(0, 50);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Student Off-boarding</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Exit Requests</h1>
        </div>
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search student or phone..." 
          className="w-full md:w-80"
        />
      </section>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#1b3022]">Pending Exits</h2>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((req) => (
            <article key={req.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-[#1b3022]">{req.readers?.name || "Student"}</p>
                  <p className="mt-2 text-sm font-medium text-[#556455]">Exit Date: {formatDateToIST(req.exit_date, "date")}</p>
                  {req.refund_eligible && (
                    <span className="mt-2 inline-block rounded-full bg-[#eef5ed] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]">
                      Caution Refund Eligible
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-[#fff4df] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#b36b00]">
                  {req.status}
                </span>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-[#f5f8f3] p-4">
                <form action={processExitAction} className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
                  <input type="hidden" name="exit_request_id" value={req.id} />
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Admin Notes (Optional)</label>
                    <input name="admin_notes" placeholder="Notes for record" className="mt-2 w-full rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                  </div>
                  <PendingSubmitButton
                    idleLabel="Process Exit & Issue Refund"
                    pendingLabel="Processing..."
                    className="w-full rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                  />
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-[#f5f8f3] p-6 text-sm font-medium text-[#556455] shadow-lg shadow-[#27452e]/6">
            No pending exit requests matching your search.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="mt-8 text-xl font-black text-[#1b3022]">Recently Processed</h2>
        {processedRequests.length > 0 ? (
          processedRequests.map((req) => (
            <article key={req.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 hover:shadow-xl transition-shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-black text-[#1b3022]">{req.readers?.name || "Student"}</p>
                  <p className="mt-2 text-sm font-medium text-[#556455]">Exit Date: {formatDateToIST(req.exit_date, "date")}</p>
                </div>
                <span className="rounded-full bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
                  {req.status}
                </span>
              </div>
              {req.admin_notes && (
                <p className="mt-3 text-sm font-medium text-[#556455]">Note: {req.admin_notes}</p>
              )}
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-[#f5f8f3] p-6 text-sm font-medium text-[#556455] shadow-lg shadow-[#27452e]/6">
            No history yet.
          </div>
        )}
      </div>
    </div>
  );
}
