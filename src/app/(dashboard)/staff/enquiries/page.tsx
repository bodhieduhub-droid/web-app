import { blockSeatForEnquiry, convertEnquiryToStudent } from "@/app/(dashboard)/actions";
import type { EnquiryRecord, SeatRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeleteEnquiryButton } from "@/components/admin/delete-enquiry-button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

import { DebouncedSearch } from "@/components/ui/debounced-search";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
};

export default async function StaffEnquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q ?? "").trim();

  const supabase = createAdminClient();
  
  let enquiriesQuery = supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (query) {
    enquiriesQuery = enquiriesQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`);
  }

  const { data: enquiries } = await enquiriesQuery;

  const { data: seats } = await supabase
    .from("seats")
    .select("id, seat_number, status")
    .in("status", ["available", "blocked"])
    .order("seat_number", { ascending: true });

  const seatOptions = (seats ?? []) as Pick<SeatRecord, "id" | "seat_number" | "status">[];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Staff Enquiries</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Seat Follow-Up Queue</h1>
        </div>
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Quick search enquiries..." 
          className="w-full md:w-80"
        />
      </section>

      <div className="space-y-4">
        {((enquiries ?? []) as EnquiryRecord[]).map((enquiry) => (
          <article key={enquiry.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-black text-[#1b3022]">{enquiry.name}</p>
                <p className="mt-2 text-sm font-medium text-[#556455]">{enquiry.phone}</p>
                {enquiry.email ? <p className="text-sm font-medium text-[#556455]">{enquiry.email}</p> : null}
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.26em] text-[#6d7c6c]">
                  {enquiry.status.replaceAll("_", " ")}
                </p>
              </div>
              
              <DeleteEnquiryButton enquiryId={enquiry.id} className="h-10 w-10" />
            </div>

            {enquiry.status !== "converted" ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <form action={blockSeatForEnquiry} className="rounded-[1.5rem] bg-[#f5f8f3] p-4">
                  <input type="hidden" name="enquiry_id" value={enquiry.id} />
                  <div className="grid gap-3">
                    <select name="seat_id" className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" required>
                      <option value="">Choose seat</option>
                      {seatOptions.filter((seat) => seat.status === "available").map((seat) => (
                        <option key={seat.id} value={seat.id}>
                          Seat {seat.seat_number}
                        </option>
                      ))}
                    </select>
                    <input name="reason" placeholder="Reason for block" className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                    <PendingSubmitButton 
                      idleLabel="Block Seat"
                      pendingLabel="Blocking..."
                      className="rounded-2xl border border-[#d7ddd3] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#1b3022]" 
                    />
                  </div>
                </form>

                <form action={convertEnquiryToStudent} className="rounded-[1.5rem] bg-[#f5f8f3] p-4">
                  <input type="hidden" name="enquiry_id" value={enquiry.id} />
                  <div className="grid gap-3">
                    <input name="email" type="email" defaultValue={enquiry.email ?? ""} placeholder="Student email" className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" required />
                    <select name="reader_type" defaultValue="monthly" className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]">
                      <option value="daily">Daily plan (Rs 150)</option>
                      <option value="weekly">Weekly plan (Rs 650)</option>
                      <option value="monthly">Monthly plan (Rs 1650)</option>
                    </select>
                    <select name="portal_access" defaultValue="no" className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]">
                      <option value="no">No portal login</option>
                      <option value="yes">Create portal login</option>
                    </select>
                    <select name="seat_id" className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" required>
                      <option value="">Assign seat</option>
                      {seatOptions.filter((seat) => seat.status === "available").map((seat) => (
                        <option key={seat.id} value={seat.id}>
                          Seat {seat.seat_number} ({seat.status})
                        </option>
                      ))}
                    </select>
                    <input name="plan_fee" type="number" defaultValue={1650} className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                    <input name="join_date" type="date" className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                    <PendingSubmitButton 
                      idleLabel="Convert Student"
                      pendingLabel="Converting..."
                      className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white" 
                    />
                  </div>
                </form>
              </div>
            ) : null}
          </article>
        ))}
        {(enquiries ?? []).length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#d0d9cc] bg-white p-6 text-sm font-medium text-[#556455]">
            No enquiries yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
