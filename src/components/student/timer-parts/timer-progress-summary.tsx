import { Target, Trophy, Zap } from "lucide-react";
import type { StudyInsights } from "./types";

export function TimerProgressSummary({ insights }: { insights: StudyInsights }) {
  const DAILY_GOAL = 120;
  const goalPct = Math.min((insights.todayMinutes / DAILY_GOAL) * 100, 100);
  const circumference = 2 * Math.PI * 14;

  return (
    <div className="rounded-3xl border border-[#dde8d8] bg-white p-3 sm:p-6 shadow-sm overflow-hidden relative">
      {/* Background flourish */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#f5f9f3] opacity-50 blur-3xl pointer-events-none" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#9aad98] sm:text-[10px]">Daily Goal</p>
          <h3 className="mt-0.5 text-sm font-black text-[#1b3022] sm:text-lg">Focus Progress</h3>
        </div>
        {/* Mini goal ring */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center sm:h-14 sm:w-14">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#eef4eb" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="14"
              fill="none"
              stroke="#1b3022"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (goalPct / 100) * circumference}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-[8px] font-black text-[#1b3022] sm:text-[10px]">{Math.round(goalPct)}%</span>
        </div>
      </div>

      {/* Goal stats */}
      <div className="mt-3 relative z-10">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-[10px] font-bold text-[#1b3022] sm:text-xs">{insights.todayMinutes}m focused</span>
          <span className="text-[8px] font-bold text-[#9aad98] sm:text-[10px]">Target: {DAILY_GOAL}m</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#eef4eb] sm:h-2">
          <div
            className="h-full rounded-full bg-[#1b3022] transition-all duration-1000 ease-out"
            style={{ width: `${goalPct}%` }}
          />
        </div>
      </div>

      {/* Stat grid */}
      <div className="mt-5 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:gap-3 relative z-10">
        {[
          { label: "Today", value: insights.todayMinutes, unit: "m", icon: Target, color: "bg-emerald-50 text-emerald-700" },
          { label: "Week", value: insights.weekMinutes, unit: "m", icon: Trophy, color: "bg-blue-50 text-blue-700" },
          { label: "Streak", value: insights.streakDays, unit: "d", icon: Zap, color: "bg-orange-50 text-orange-700" },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border border-[#f0f4ef] bg-[#fcfdfb] p-2 sm:gap-2 sm:p-3 transition-transform hover:scale-[1.02]">
            <div className={`w-fit rounded-lg p-1 sm:p-1.5 ${color}`}>
              <Icon className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
            </div>
            <div>
              <p className="text-[7px] font-bold uppercase tracking-wider text-[#9aad98] sm:text-[9px]">{label}</p>
              <p className="text-xs font-black text-[#1b3022] sm:text-base">
                {value}<span className="ml-0.5 text-[8px] font-bold text-[#9aad98] sm:text-[10px]">{unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
