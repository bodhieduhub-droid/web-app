import { PRESETS, type PresetId } from "./types";

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

export function clampMinutes(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function getPresetConfig(presetId: PresetId, customWorkMinutes: number, customRestMinutes: number) {
  if (presetId === "custom") {
    return {
      id: "custom" as const,
      label: "Custom",
      work: clampMinutes(customWorkMinutes, 1, 180),
      rest: clampMinutes(customRestMinutes, 1, 60),
    };
  }

  return PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0];
}

export function buildSessionFormData(input: {
  presetName: string;
  focusMinutes: number;
  breakMinutes: number;
  completedFocusBlocks: number;
  startedAt: string;
  endedAt?: string | null;
}) {
  const formData = new FormData();
  formData.set("preset_name", input.presetName);
  formData.set("focus_minutes", String(input.focusMinutes));
  formData.set("break_minutes", String(input.breakMinutes));
  formData.set("completed_focus_blocks", String(input.completedFocusBlocks));
  formData.set("started_at", input.startedAt);
  if (input.endedAt) formData.set("ended_at", input.endedAt);
  formData.set("source", "portal_timer");
  return formData;
}
