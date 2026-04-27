import { Coffee, Target, X, RotateCcw, Play, Pause } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TimerRing } from "./timer-ring";
import { formatTime } from "./utils";

type FullscreenTimerProps = {
  phase: "work" | "rest";
  progress: number;
  secondsLeft: number;
  running: boolean;
  sessions: number;
  onToggle: () => void;
  onReset: () => void;
  onExit: () => void;
};

export function FullscreenTimer({
  phase, progress, secondsLeft, running, sessions,
  onToggle, onReset, onExit,
}: FullscreenTimerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock scroll and trigger zen layout
    document.body.style.overflow = "hidden";
    document.body.classList.add("zen-mode-active");
    
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("zen-mode-active");
    };
  }, []);

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0b1a10] text-white overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-emerald-900/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Exit Button - Far Right Top */}
      <button
        onClick={onExit}
        className="absolute right-6 top-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 transition hover:bg-white/10 hover:text-white active:scale-90"
        title="Exit Zen Mode"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Main Layout - Optimized for Landscape/Portrait */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-8 px-6 landscape:flex-row landscape:gap-16 lg:gap-24">
        
        {/* Timer Visual Section */}
        <div className="relative flex flex-col items-center">
          {/* Phase Badge */}
          <div className="mb-6 flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 border border-white/5">
            {phase === "work" ? <Target className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
            {phase === "work" ? "Focusing" : "Resting"}
          </div>
          
          {/* Scaled Timer Ring */}
          <div className="transform transition-transform duration-500 scale-125 sm:scale-150 landscape:scale-110 lg:scale-150">
            <TimerRing size="fullscreen" phase={phase} progress={progress} secondsLeft={secondsLeft} />
          </div>
        </div>

        {/* Info & Controls Section */}
        <div className="flex flex-col items-center gap-8 landscape:items-start">
          <div className="text-center landscape:text-left">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              {phase === "work" ? "Deep Work" : "Recharge"}
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2.5 landscape:justify-start">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-700 ${
                    i < sessions ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-white/10"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs font-bold text-white/30 uppercase tracking-widest">
                {sessions}/4 Done
              </span>
            </div>
          </div>

          {/* Centered Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggle}
              className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                running 
                  ? "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white" 
                  : "bg-emerald-500 text-[#0b1a10] shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105"
              }`}
            >
              {running ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current translate-x-0.5" />}
            </button>
            
            <button
              onClick={onReset}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/30 transition hover:bg-white/10 hover:text-white active:scale-90"
              title="Reset Timer"
            >
              <RotateCcw className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );

  return createPortal(content, document.body);
}
