import { Target, Zap, Clock, Settings2 } from "lucide-react";
import { PRESETS, type PresetId } from "./types";

type TimerPresetsProps = {
  activeId: PresetId;
  running: boolean;
  customWorkMinutes: number;
  customRestMinutes: number;
  onPresetChange: (id: PresetId) => void;
  onCustomMinutesChange: (kind: "work" | "rest", value: string) => void;
};

const ALL_PRESETS: Array<{ id: PresetId; label: string; icon: any }> = [
  { id: "pomodoro", label: "Pomodoro", icon: Clock },
  { id: "long-focus", label: "Long Focus", icon: Target },
  { id: "quick-sprint", label: "Quick Sprint", icon: Zap },
  { id: "custom", label: "Custom", icon: Settings2 },
];

export function TimerPresets({
  activeId,
  running,
  customWorkMinutes,
  customRestMinutes,
  onPresetChange,
  onCustomMinutesChange,
}: TimerPresetsProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      {/* Preset tabs — robust responsive grid */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        {ALL_PRESETS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => !running && onPresetChange(item.id)}
              disabled={running && !isActive}
              className={`
                group relative flex items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-all duration-300 sm:gap-3 sm:px-4 sm:py-3
                ${isActive 
                  ? "border-[#1b3022] bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/10" 
                  : running
                    ? "border-transparent bg-[#f5f9f3] opacity-40 cursor-not-allowed"
                    : "border-[#dde8d8] bg-white text-[#4e5d4d] hover:border-[#1b3022] hover:bg-[#fcfdfb] hover:text-[#1b3022] active:scale-95"
                }
              `}
            >
              <div className={`
                flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-8 sm:w-8
                ${isActive ? "bg-white/20 text-white" : "bg-[#f5f9f3] text-[#7a8f79] group-hover:bg-[#1b3022]/5 group-hover:text-[#1b3022]"}
              `}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              
              <div className="flex min-w-0 flex-col">
                <span className={`truncate text-xs font-black tracking-tight ${isActive ? "text-white" : "text-[#1b3022]"}`}>
                  {item.label}
                </span>
                {!isActive && !running && (
                  <span className="truncate text-[9px] font-bold text-[#9aad98]">
                    {item.id === "custom" ? "Set time" : "Select"}
                  </span>
                )}
              </div>
              
              {isActive && (
                <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom inputs — refined design */}
      {activeId === "custom" && (
        <div className="animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-6 rounded-2xl border border-[#dde8d8] bg-[#fcfdfb] p-5">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9aad98]">Work</span>
            <input
              type="number"
              min={1}
              max={180}
              disabled={running}
              value={customWorkMinutes}
              onChange={(e) => onCustomMinutesChange("work", e.target.value)}
              className="w-20 rounded-xl border border-[#dde8d8] bg-white py-2 text-center text-sm font-black text-[#1b3022] transition focus:border-[#1b3022] focus:ring-4 focus:ring-[#1b3022]/5 disabled:opacity-50"
            />
          </div>
          
          <div className="h-8 w-[1px] bg-[#dde8d8] mt-4" />
          
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#9aad98]">Rest</span>
            <input
              type="number"
              min={1}
              max={60}
              disabled={running}
              value={customRestMinutes}
              onChange={(e) => onCustomMinutesChange("rest", e.target.value)}
              className="w-20 rounded-xl border border-[#dde8d8] bg-white py-2 text-center text-sm font-black text-[#1b3022] transition focus:border-[#1b3022] focus:ring-4 focus:ring-[#1b3022]/5 disabled:opacity-50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
