import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { logStudySessionAction } from "@/app/(dashboard)/actions";
import { 
  PRESET_LABEL_TO_ID, 
  PRESETS, 
  TIMER_STORAGE_KEY, 
  EXAM_QUOTES,
  type PresetId, 
  type StudyInsights 
} from "../timer-parts/types";
import { 
  buildSessionFormData, 
  clampMinutes, 
  formatTime, 
  getPresetConfig 
} from "../timer-parts/utils";
import { getISTDateString, getISTTimestamp } from "@/lib/date-utils";

export function useStudyTimer(insights: StudyInsights) {
  const [isPending, startTransition] = useTransition();
  const [presetId, setPresetId] = useState<PresetId>("pomodoro");
  const [customWorkMinutes, setCustomWorkMinutes] = useState(40);
  const [customRestMinutes, setCustomRestMinutes] = useState(10);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].work * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(insights.todayBlocks);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [examCategory, setExamCategory] = useState<string>("DEFAULT");
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydratedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const preset = getPresetConfig(presetId, customWorkMinutes, customRestMinutes);
  const quotes = EXAM_QUOTES[examCategory] ?? EXAM_QUOTES.DEFAULT;
  const totalPhaseSeconds = (phase === "work" ? preset.work : preset.rest) * 60;
  const progress = 1 - secondsLeft / totalPhaseSeconds;

  const persistStudySession = useCallback((input: {
    completedFocusBlocks: number;
    startedAt: string;
    endedAt?: string | null;
  }) => {
    let focusMinutes = preset.work;
    
    // If it's a partial session (0 blocks), calculate actual minutes spent
    if (input.completedFocusBlocks === 0 && input.endedAt) {
      const ms = new Date(input.endedAt).getTime() - new Date(input.startedAt).getTime();
      focusMinutes = Math.max(1, Math.round(ms / (60 * 1000)));
      
      // Don't log if less than a minute of actual focus
      if (ms < 60 * 1000) return;
    }

    const formData = buildSessionFormData({
      presetName: preset.label,
      focusMinutes,
      breakMinutes: preset.rest,
      completedFocusBlocks: input.completedFocusBlocks,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
    });

    startTransition(async () => {
      await logStudySessionAction(formData);
    });
  }, [preset.label, preset.rest, preset.work]);

  const finishWorkSession = useCallback((completedFocusBlocks: number) => {
    if (!sessionStartedAt) return;
    persistStudySession({
      completedFocusBlocks,
      startedAt: sessionStartedAt,
      endedAt: getISTTimestamp(),
    });
    setSessionStartedAt(null);
  }, [persistStudySession, sessionStartedAt]);

  function resetTimer(logPartial = false) {
    if (logPartial && running && phase === "work" && sessionStartedAt) {
      finishWorkSession(0);
    }

    setRunning(false);
    setPhase("work");
    setSecondsLeft(preset.work * 60);
    if (!logPartial) {
      setSessionStartedAt(null);
    }
  }

  function handlePresetChange(nextPresetId: PresetId) {
    if (running && phase === "work" && sessionStartedAt) {
      finishWorkSession(0);
    }

    const nextPreset = getPresetConfig(nextPresetId, customWorkMinutes, customRestMinutes);
    setPresetId(nextPresetId);
    setRunning(false);
    setPhase("work");
    setSecondsLeft(nextPreset.work * 60);
    setSessionStartedAt(null);
  }

  function handleCustomMinutesChange(kind: "work" | "rest", rawValue: string) {
    const nextValue = clampMinutes(Number(rawValue) || (kind === "work" ? customWorkMinutes : customRestMinutes), 1, kind === "work" ? 180 : 60);
    if (kind === "work") {
      setCustomWorkMinutes(nextValue);
      if (presetId === "custom" && !running) {
        setPhase("work");
        setSecondsLeft(nextValue * 60);
      }
      return;
    }

    setCustomRestMinutes(nextValue);
    if (presetId === "custom" && !running) {
      setPhase("work");
      setSecondsLeft(customWorkMinutes * 60);
    }
  }

  function toggleFullscreen() {
    setIsFullscreen((v) => !v);
  }

  // Hydration logic
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        const nextPresetId = parsed.presetId ?? PRESET_LABEL_TO_ID[parsed.presetLabel ?? "Pomodoro"] ?? "pomodoro";
        const nextCustomWork = clampMinutes(Number(parsed.customWorkMinutes) || 40, 1, 180);
        const nextCustomRest = clampMinutes(Number(parsed.customRestMinutes) || 10, 1, 60);
        const nextPreset = getPresetConfig(nextPresetId, nextCustomWork, nextCustomRest);
        const nextPhase = parsed.phase === "rest" ? "rest" : "work";
        let nextSecondsLeft = Number.isFinite(parsed.secondsLeft)
          ? Math.max(1, Number(parsed.secondsLeft))
          : (nextPhase === "work" ? nextPreset.work : nextPreset.rest) * 60;
        let nextRunning = parsed.running === true;
        let nextSessions = Number.isFinite(parsed.sessions)
          ? Math.max(insights.todayBlocks, Number(parsed.sessions))
          : insights.todayBlocks;
        const savedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : Date.now();
        const elapsed = nextRunning ? Math.floor((Date.now() - savedAt) / 1000) : 0;
        let currentPhase: "work" | "rest" = nextPhase;

        if (parsed.savedAt) {
          const savedDateStr = getISTDateString(new Date(parsed.savedAt));
          const nowStr = getISTDateString();
          const isSameDay = savedDateStr === nowStr;
          if (!isSameDay) {
            nextSessions = insights.todayBlocks;
          }
        }

        if (nextRunning && elapsed > 0) {
          if (elapsed >= nextSecondsLeft) {
            nextRunning = false;
            if (currentPhase === "work") {
              nextSessions += 1;
              currentPhase = "rest";
              nextSecondsLeft = nextPreset.rest * 60;
            } else {
              currentPhase = "work";
              nextSecondsLeft = nextPreset.work * 60;
            }
          } else {
            nextSecondsLeft -= elapsed;
          }
        }

        setPresetId(nextPresetId);
        setCustomWorkMinutes(nextCustomWork);
        setCustomRestMinutes(nextCustomRest);
        setPhase(currentPhase);
        setSecondsLeft(nextSecondsLeft);
        setRunning(nextRunning);
        setSessions(nextSessions);
        setQuoteIndex(Number.isFinite(parsed.quoteIndex) ? Number(parsed.quoteIndex) : 0);
        setExamCategory(parsed.examCategory || "DEFAULT");
        setSessionStartedAt(nextRunning && currentPhase === "work" ? parsed.sessionStartedAt ?? null : null);
      } catch {
        window.localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [insights.todayBlocks]);

  // Persistence logic
  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        presetId,
        presetLabel: preset.label,
        customWorkMinutes,
        customRestMinutes,
        phase,
        secondsLeft,
        running,
        sessions,
        quoteIndex,
        examCategory,
        savedAt: getISTTimestamp(),
        sessionStartedAt,
      }),
    );
  }, [customRestMinutes, customWorkMinutes, examCategory, phase, preset.label, presetId, quoteIndex, running, secondsLeft, sessionStartedAt, sessions]);

  // Timer loop logic
  useEffect(() => {
    function completePhase() {
      setRunning(false);
      setQuoteIndex((index) => (index + 1) % quotes.length);

      if (phase === "work") {
        finishWorkSession(1);
        setSessions((value) => value + 1);
        setPhase("rest");
        setSecondsLeft(preset.rest * 60);
        return;
      }

      setPhase("work");
      setSecondsLeft(preset.work * 60);
      setSessionStartedAt(null);
    }

    if (running) {
      const originalTitle = document.title;
      const interval = setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            clearInterval(interval);
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              gain.gain.setValueAtTime(0, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
              osc.start();
              osc.stop(ctx.currentTime + 1.5);
            } catch (e) {}
            if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
            completePhase();
            return 0;
          }
          const timeStr = formatTime(current - 1);
          document.title = `${timeStr} | ${phase === "work" ? "Focus" : "Rest"}`;
          return current - 1;
        });
      }, 1000);
      
      intervalRef.current = interval;
      return () => {
        clearInterval(interval);
        document.title = originalTitle;
      };
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [finishWorkSession, phase, preset.rest, preset.work, quotes.length, running]);

  return {
    preset,
    presetId,
    phase,
    secondsLeft,
    running,
    sessions,
    progress,
    quoteIndex,
    quotes,
    examCategory,
    customWorkMinutes,
    customRestMinutes,
    isFullscreen,
    rootRef,
    sessionStartedAt,
    setRunning,
    setQuoteIndex,
    setExamCategory,
    setSessionStartedAt,
    resetTimer,
    handlePresetChange,
    handleCustomMinutesChange,
    toggleFullscreen,
    isPending
  };
}
