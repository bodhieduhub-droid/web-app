import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, History, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffSeatHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: seat } = await supabase
    .from("seats")
    .select("seat_number")
    .eq("id", id)
    .single();

  const { data: usage } = await supabase
    .from("readers")
    .select("id, name, phone, reader_type, join_date, status")
    .eq("fixed_seat_id", id)
    .order("join_date", { ascending: false });

  if (!seat) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-bold text-rose-600">Seat not found</p>
        <Link href="/staff/seats" className="mt-4 inline-block text-sm text-[#1b3022] underline">
          Back to seats
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex items-center gap-4">
          <Link
            href="/staff/seats"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e0d4] text-[#1b3022] transition hover:bg-[#f3f7f0]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Usage History</p>
            <h1 className="mt-1 text-3xl font-black text-[#1b3022]">Seat #{seat.seat_number}</h1>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b3022] text-white">
          <History className="h-6 w-6" />
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white overflow-hidden shadow-lg shadow-[#27452e]/6">
        <table className="w-full text-left">
          <thead className="bg-[#f5f8f3] border-bottom border-[#d8e0d4]">
            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Plan Type</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef3ea]">
            {usage && usage.length > 0 ? (
              usage.map((record) => (
                <tr key={record.id} className="transition hover:bg-[#fcfdfb]">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-[#1b3022]">
                      {format(new Date(record.join_date), "dd MMM yyyy")}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef3ea] text-[#1b3022]">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1b3022]">{record.name}</p>
                        <p className="text-[11px] text-[#6d7c6c]">{record.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-[#f3f7f0] border border-[#d8e0d4] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1b3022]">
                      {record.reader_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold capitalize text-[#556455]">
                      {record.status.replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm font-medium text-[#6d7c6c]">
                  No usage history found for this seat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
