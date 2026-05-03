import { createAdminClient } from "@/lib/supabase/admin";
import { getISTDateString } from "@/lib/date-utils";
import { Fingerprint } from "lucide-react";
import { BiometricLogsClient } from "./biometric-logs-client";

export const dynamic = "force-dynamic";

export default async function BiometricsPage() {
  const supabase = createAdminClient();
  const today = getISTDateString();

  // Fetch today's device logs with linked reader info
  const { data: logsRaw } = await supabase
    .from("biometric_device_logs")
    .select("id, biometric_id, punch_time, punch_date, status, readers(id, name, phone)")
    .eq("punch_date", today)
    .neq("status", "ignored")
    .order("punch_time", { ascending: false });

  // Fetch all active students for the assign dropdown
  const { data: studentsRaw } = await supabase
    .from("readers")
    .select("id, name, phone, biometric_id")
    .in("status", ["active", "pending_payment", "pending_onboarding"])
    .order("name");

  const logs = ((logsRaw ?? []) as unknown[]) as {
    id: string;
    biometric_id: string;
    punch_time: string;
    punch_date: string;
    status: string;
    readers: { id: string; name: string; phone: string } | null;
  }[];

  const students = (studentsRaw ?? []) as {
    id: string;
    name: string;
    phone: string;
    biometric_id: string | null;
  }[];

  const unmatchedCount = logs.filter((l) => l.status === "unmatched").length;
  const matchedCount = logs.filter((l) => l.status === "matched").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">
          Device Integration
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight flex items-center gap-3">
          <Fingerprint className="h-9 w-9 opacity-70" />
          Biometric Sync
        </h1>
        <p className="mt-2 text-sm font-semibold text-white/60">
          Live punch logs from the eSSL K90 Pro — assign unmatched IDs to student profiles.
        </p>

        {/* Stats */}
        <div className="mt-6 flex gap-4 flex-wrap">
          <div className="rounded-2xl bg-white/10 px-5 py-3 border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Today — Matched</p>
            <p className="mt-1 text-2xl font-black text-emerald-300">{matchedCount}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Today — Unmatched</p>
            <p className="mt-1 text-2xl font-black text-amber-300">{unmatchedCount}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Date</p>
            <p className="mt-1 text-2xl font-black text-white">{today}</p>
          </div>
        </div>
      </section>

      {/* Setup Guide Banner */}
      <div className="rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] p-5 space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-[#1b3022]">📡 Device Configuration</p>
        <p className="text-sm text-[#536352] font-semibold">
          On the K90 Pro: <strong className="text-[#1b3022]">Menu → Comm. → ADMS Setup</strong>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {[
            ["Server Address", "your-app-domain.com"],
            ["Port", "80 or 443"],
            ["Enable Domain Name", "ON"],
            ["Realtime Push", "ON"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white border border-[#e4eae0] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-[#8a9d88]">{label}</p>
              <p className="text-sm font-black text-[#1b3022] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <BiometricLogsClient logs={logs} students={students} />
    </div>
  );
}
