import { Pause, Play, RotateCcw } from "lucide-react";

type TimerControlsProps = {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  size?: "normal" | "fullscreen";
};

export function TimerControls({ running, onToggle, onReset, size = "normal" }: TimerControlsProps) {
  if (size === "fullscreen") {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-2.5 rounded-2xl bg-emerald-400 px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.28em] text-[#0b1a10] shadow-lg shadow-emerald-400/25 transition hover:bg-emerald-300 active:scale-[0.97]"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          {running ? "Pause" : "Resume"}
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-2xl border border-[#1f3a27] px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.28em] text-[#3d6b4e] transition hover:border-[#2d5038] hover:text-emerald-400 active:scale-[0.97]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-3">
      <button
        onClick={onToggle}
        className={`flex h-12 flex-1 items-center justify-center gap-2.5 rounded-2xl text-sm font-black tracking-wide transition-all duration-200 active:scale-[0.97] ${
          running
            ? "border-2 border-[#1b3022] bg-white text-[#1b3022] hover:bg-[#f7faf5]"
            : "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/20 hover:bg-[#243f2c]"
        }`}
      >
        {running
          ? <Pause className="h-4 w-4 shrink-0" />
          : <Play className="h-4 w-4 shrink-0 fill-current" />
        }
        {running ? "Pause" : "Start Focusing"}
      </button>

      <button
        onClick={onReset}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#dde8d8] bg-white text-[#7a8f79] transition hover:border-[#c4d4be] hover:bg-[#f5f9f3] hover:text-[#1b3022] active:scale-95"
        title="Reset timer"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}
