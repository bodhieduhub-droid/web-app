"use client";

import { useState, useTransition } from "react";
import { assignBiometricIdAction, ignoreBiometricLogAction } from "./biometric-actions";
import { formatTimeIST } from "@/lib/date-utils";

type DeviceLog = {
  id: string;
  biometric_id: string;
  punch_time: string;
  punch_date: string;
  status: string;
  readers: { id: string; name: string; phone: string } | null;
};

type StudentOption = {
  id: string;
  name: string;
  phone: string;
  biometric_id: string | null;
};

export function BiometricLogsClient({
  logs,
  students,
}: {
  logs: DeviceLog[];
  students: StudentOption[];
}) {
  const [assigning, setAssigning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const unmatchedLogs = logs.filter((l) => l.status === "unmatched");
  const matchedLogs = logs.filter((l) => l.status === "matched");

  return (
    <div className="space-y-8">
      {/* ── UNMATCHED PUNCHES ─── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-base font-black text-[#1b3022] uppercase tracking-widest">
            Unmatched Punches
          </h2>
          <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[11px] font-black text-amber-700">
            {unmatchedLogs.length}
          </span>
        </div>

        {unmatchedLogs.length === 0 ? (
          <div className="rounded-2xl border border-[#e4eae0] bg-white p-8 text-center">
            <p className="text-sm font-bold text-emerald-600">✓ All punches are matched to students</p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white overflow-hidden shadow-xl shadow-[#27452e]/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50 border-b border-amber-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Device ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Punch Time</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Assign To Student</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Ignore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2ec]">
                {unmatchedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b3022] px-3 py-1 text-xs font-black text-white">
                        ID: {log.biometric_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#1b3022]">
                        {formatTimeIST(log.punch_time)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#536352]">{log.punch_date}</span>
                    </td>
                    <td className="px-6 py-4">
                      {assigning === log.id ? (
                        <form
                          action={(fd) => {
                            startTransition(() => assignBiometricIdAction(fd));
                            setAssigning(null);
                          }}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="biometric_id" value={log.biometric_id} />
                          <select
                            name="reader_id"
                            required
                            className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-1.5 text-xs font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/20"
                          >
                            <option value="">Select student…</option>
                            {students.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} — {s.phone}
                                {s.biometric_id ? ` (Bio: ${s.biometric_id})` : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl bg-[#1b3022] px-3 py-1.5 text-[11px] font-black text-white hover:bg-[#27452e] disabled:opacity-50"
                          >
                            {isPending ? "Saving…" : "Assign"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssigning(null)}
                            className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-1.5 text-[11px] font-black text-[#1b3022] hover:bg-[#f7faf5]"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setAssigning(log.id)}
                          className="rounded-xl bg-[#1b3022] px-4 py-1.5 text-[11px] font-black text-white hover:bg-[#27452e] transition-colors"
                        >
                          Assign to Student →
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <form action={ignoreBiometricLogAction}>
                        <input type="hidden" name="log_id" value={log.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-1.5 text-[11px] font-black text-[#7d2f2f] hover:bg-[#f8eef0] transition-colors"
                        >
                          Ignore
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── MATCHED PUNCHES ─── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <h2 className="text-base font-black text-[#1b3022] uppercase tracking-widest">
            Recent Matched Punches
          </h2>
          <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">
            {matchedLogs.length}
          </span>
        </div>

        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white overflow-hidden shadow-xl shadow-[#27452e]/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7faf5] border-b border-[#e1eadc]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Student</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Device ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Punch Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2ec]">
              {matchedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#6d7c6c] font-semibold">
                    No matched punches yet today.
                  </td>
                </tr>
              ) : (
                matchedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fcfdfb] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-[#1b3022]">{log.readers?.name ?? "—"}</p>
                      <p className="text-[10px] font-bold text-[#8a9d88]">{log.readers?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-[#eef3ea] px-2 py-0.5 text-[11px] font-black text-[#1b3022]">
                        ID: {log.biometric_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[#1b3022]">{formatTimeIST(log.punch_time)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#536352]">{log.punch_date}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
