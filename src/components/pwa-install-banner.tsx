"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed / standalone
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("pwa-banner-dismissed");
    if (dismissedAt) {
      const diff = Date.now() - Number(dismissedAt);
      if (diff < 7 * 24 * 60 * 60 * 1000) { // 7 days
        setDismissed(true);
        return;
      }
    }

    // iOS detection
    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    if (isIosDevice && isSafari && !standalone) {
      setIsIos(true);
    }

    // Android / Desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function handleInstall() {
    if (!prompt) return;
    prompt.prompt();
    prompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        setPrompt(null);
        setDismissed(true);
      }
    });
  }

  function handleDismiss() {
    localStorage.setItem("pwa-banner-dismissed", String(Date.now()));
    setDismissed(true);
    setPrompt(null);
    setIsIos(false);
  }

  if (isStandalone || dismissed) return null;
  if (!prompt && !isIos) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-[1.4rem] border border-[#d8e0d4] bg-[#1b3022] p-4 shadow-2xl shadow-[#1b3022]/40">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <span className="text-2xl font-black text-white">B</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">
            Install App
          </p>
          <p className="mt-0.5 text-sm font-black text-white">
            Bodhi Edu Hub
          </p>
          {isIos ? (
            <p className="mt-1 text-xs font-medium leading-relaxed text-white/60">
              Tap <span className="font-bold text-white/80">Share</span> then{" "}
              <span className="font-bold text-white/80">Add to Home Screen</span>
            </p>
          ) : (
            <p className="mt-1 text-xs font-medium text-white/60">
              Add to your home screen for the best experience
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-xl p-1.5 text-white/40 hover:bg-white/10 hover:text-white/80 transition"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Install button (Android/Desktop only) */}
      {!isIos && prompt && (
        <button
          onClick={handleInstall}
          className="mt-3 w-full rounded-xl bg-white py-2.5 text-[11px] font-black uppercase tracking-[0.28em] text-[#1b3022] transition hover:bg-white/90"
        >
          Install Now
        </button>
      )}
    </div>
  );
}
