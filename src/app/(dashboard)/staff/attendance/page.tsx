import { createAdminClient } from "@/lib/supabase/admin";
import { AttendanceRecord, StudentRecord } from "@/lib/app-types";
import { Calendar, Search } from "lucide-react";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { URLDateInput } from "@/components/ui/url-date-input";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";
import { AttendanceCountDisplay } from "@/components/dashboard/attendance-count-display";

export const dynamic = "force-dynamic";

type SearchParams = {
  date?: string;
  q?: string;
};

export default async function StaffAttendanceLogsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<SearchParams> 
}) {
  const resolved = (await searchParams) ?? {};
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const targetDate = resolved.date || today;
  const query = (resolved.q ?? "").trim();

  let attendanceQuery = supabase
    .from("attendance")
    .select("*, readers!inner(name, phone, reader_type)")
    .eq("date", targetDate)
    .order("check_in_at", { ascending: false });

  if (query) {
    attendanceQuery = attendanceQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`, { foreignTable: "readers" });
  }

  const { data: attendance } = await attendanceQuery;
  const logs = (attendance ?? []) as (AttendanceRecord & { readers: Partial<StudentRecord> })[];

  return (
    <div className="space-y-6">
      <RealtimeTableListener table="attendance" />
      <RealtimeTableListener table="readers" />
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Staff Dashboard</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight">Attendance Logs</h1>
        <p className="mt-2 text-sm font-semibold text-white/60">Real-time tracking of students currently in the hub.</p>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
         <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
           <div className="flex items-center gap-2 rounded-2xl border border-[#d8e0d4] bg-white px-4 py-2 shadow-sm w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-[#6d7c6c]" />
              <URLDateInput name="date" defaultValue={targetDate} />
           </div>
           
           <DebouncedSearch 
             defaultValue={query} 
             placeholder="Search student..." 
             className="w-full sm:w-80"
           />
         </div>
         
         <AttendanceCountDisplay count={logs.length} targetDate={targetDate} />
      </div>

      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white overflow-hidden shadow-xl shadow-[#27452e]/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7faf5] border-b border-[#e1eadc]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Student</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Check In</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Check Out</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2ec]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fcfdfb] transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-[#1b3022]">{log.readers?.name}</p>
                      <p className="text-[10px] font-bold text-[#8a9d88]">{log.readers?.phone}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-bold text-[#1b3022]">
                          {new Date(log.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {log.check_out_at ? (
                         <span className="text-sm font-bold text-[#536352]">
                          {new Date(log.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                         <span className="text-xs font-bold text-[#aab5a8] italic text-emerald-700">Currently In</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="rounded-full bg-[#f0f7ed] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1b3022]">
                        {log.readers?.reader_type}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-[#f7faf5] flex items-center justify-center text-[#aab5a8]">
                        <Search className="h-8 w-8" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-[#6d7c6c]">No attendance logs found for this date.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
