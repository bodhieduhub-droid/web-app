"use client";

import { History, CheckCircle2, Clock } from "lucide-react";
import { type StudySessionRecord } from "@/lib/app-types";

type TimerHistoryProps = {
  sessions: StudySessionRecord[];
};

export function TimerHistory({ sessions }: TimerHistoryProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="rounded-3xl border border-[#dde8d8] bg-white p-3.5 sm:p-6 shadow-sm overflow-hidden relative">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f5f9f3] text-[#1b3022]">
          <History className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-black text-[#1b3022] sm:text-sm">Recent History</h3>
      </div>

      <div className="space-y-3">
        {sessions.map((s) => {
          const date = new Date(s.started_at);
          const timeStr = date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          const dayStr = date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });

          return (
            <div
              key={s.id}
              className="group flex items-center justify-between rounded-2xl border border-[#eef4eb] bg-[#fcfdfb] p-2 transition-all hover:border-[#d0dccb] hover:bg-white sm:p-3"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  s.completed_focus_blocks > 0 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "bg-orange-50 text-orange-600"
                }`}>
                  {s.completed_focus_blocks > 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#1b3022] sm:text-[11px]">
                    {s.preset_name} Session
                  </p>
                  <p className="text-[8px] font-bold text-[#9aad98] sm:text-[9px]">
                    {dayStr} • {timeStr}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-[#1b3022] sm:text-sm">
                  {s.focus_minutes * s.completed_focus_blocks}m
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#9aad98] sm:text-xs">
                  Focus
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
