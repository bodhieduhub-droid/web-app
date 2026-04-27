import { formatTime } from "./utils";

type TimerRingProps = {
  progress: number;
  secondsLeft: number;
  phase: "work" | "rest";
  running?: boolean;
  size?: "normal" | "fullscreen";
};

// viewBox is 100×100; circle centre at 50,50; r=42
const R = 42;
const C = 2 * Math.PI * R; // ≈ 263.9

export function TimerRing({ progress, secondsLeft, phase, running, size = "normal" }: TimerRingProps) {
  const dashLen = progress * C;

  if (size === "fullscreen") {
    return (
      <div className={`relative mx-auto h-72 w-72 sm:h-96 sm:w-96 transition-transform duration-1000 ${running ? "animate-pulse-subtle" : ""}`}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
          <defs>
            <linearGradient id="fullscreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke="url(#fullscreenGradient)"
            strokeWidth="10"
            strokeDasharray={`${dashLen} ${C}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-6xl font-black tabular-nums leading-none tracking-tighter text-white sm:text-8xl">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60 sm:text-xs">
            {phase === "work" ? "focusing" : "resting"}
          </span>
        </div>
      </div>
    );
  }

  /* ── Normal size ── */
  const trackStroke = "rgba(27,48,34,0.08)";
  
  return (
    <div className={`relative mx-auto h-56 w-56 sm:h-72 sm:w-72 transition-all duration-1000 ${running ? "scale-[1.02]" : ""}`}>
      <svg
        viewBox="0 0 100 100"
        className={`absolute inset-0 h-full w-full -rotate-90 ${running ? "animate-pulse-slow" : ""}`}
      >
        <defs>
          <linearGradient id="workGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1b3022" />
            <stop offset="100%" stopColor="#2d5038" />
          </linearGradient>
          <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <circle cx="50" cy="50" r={R - 4} fill="white" className="shadow-inner" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={trackStroke} strokeWidth="8" />
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke={phase === "work" ? "url(#workGradient)" : "url(#restGradient)"}
          strokeWidth="10"
          strokeDasharray={`${dashLen} ${C}`}
          strokeLinecap="round"
          filter={running ? "url(#glow)" : ""}
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span
          className={`text-5xl font-black tabular-nums leading-none tracking-tighter sm:text-6xl transition-colors duration-700 ${
            phase === "work" ? "text-[#1b3022]" : "text-emerald-600"
          }`}
        >
          {formatTime(secondsLeft)}
        </span>
        <div className="flex flex-col items-center">
          <span
            className={`text-[9px] font-black uppercase tracking-[0.4em] sm:text-[10px] ${
              phase === "work" ? "text-[#1b3022]/40" : "text-emerald-500/60"
            }`}
          >
            {phase === "work" ? "focusing" : "resting"}
          </span>
          {running && (
            <div className="mt-2 flex gap-1">
              <span className="h-1 w-1 animate-bounce rounded-full bg-current opacity-40" style={{ animationDelay: "0ms" }} />
              <span className="h-1 w-1 animate-bounce rounded-full bg-current opacity-40" style={{ animationDelay: "150ms" }} />
              <span className="h-1 w-1 animate-bounce rounded-full bg-current opacity-40" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
