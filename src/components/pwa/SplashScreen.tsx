"use client";

import React, { useEffect, useRef, useState } from "react";
import { Ticket } from "lucide-react";

const ENTRANCE_DURATION_MS = 800; // Display for 800ms
const TOTAL_LIFETIME_MS = 1300; // 800ms display + 500ms fade transition
const STORAGE_KEY = "stagepass_splash_shown";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const alreadyShown = sessionStorage.getItem(STORAGE_KEY);
      if (alreadyShown) {
        return false;
      }
      sessionStorage.setItem(STORAGE_KEY, "true");
      return true;
    } catch {
      return true;
    }
  });

  const [isExiting, setIsExiting] = useState(false);
  const timerStartedRef = useRef(false);

  useEffect(() => {
    if (!isVisible) return;
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;

    // At 800ms: trigger exit transition (500ms duration)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, ENTRANCE_DURATION_MS);

    // At 1300ms: unmount completely from DOM
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, TOTAL_LIFETIME_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
      timerStartedRef.current = false;
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#121212] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-500 ease-out ${
        isExiting
          ? "opacity-0 pointer-events-none"
          : "opacity-100 pointer-events-auto"
      }`}
      aria-hidden={isExiting}
      role="dialog"
      aria-modal="true"
      aria-label="Loading StagePass"
    >
      {/* Centered Brand Content */}
      <div className="flex flex-col items-center text-center px-6">
        {/* Ticket Logo Badge with Soft Ambient Glow */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-[#1DB954]/20 rounded-full blur-2xl animate-pulse" />

          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#1DB954] via-emerald-400 to-[#1ed760] p-[2px] flex items-center justify-center shadow-2xl shadow-[#1DB954]/30">
            <div className="w-full h-full bg-[#121212] rounded-[14px] flex items-center justify-center">
              <Ticket className="w-9 h-9 sm:w-11 sm:h-11 text-[#1DB954]" />
            </div>
          </div>
        </div>

        {/* High-Contrast Typography */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1.5">
          StagePass
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide mb-8">
          Concert Setlists &bull; Live Memories
        </p>

        {/* GPU-Accelerated Audio Equalizer Bars */}
        <div
          className="flex items-end justify-center gap-1.5 h-7"
          aria-label="Loading audio visualizer"
        >
          <span className="w-1.5 h-6 bg-[#1DB954] rounded-full animate-eq-1 shadow-sm shadow-[#1DB954]/50" />
          <span className="w-1.5 h-6 bg-[#1DB954] rounded-full animate-eq-2 shadow-sm shadow-[#1DB954]/50" />
          <span className="w-1.5 h-6 bg-[#1DB954] rounded-full animate-eq-3 shadow-sm shadow-[#1DB954]/50" />
          <span className="w-1.5 h-6 bg-[#1DB954] rounded-full animate-eq-4 shadow-sm shadow-[#1DB954]/50" />
        </div>
      </div>

      {/* Safe-Area Bottom Footnote */}
      <div className="absolute bottom-8 pb-safe text-[11px] text-zinc-600 font-medium tracking-wider uppercase">
        Powered by Spotify &bull; Setlist.fm
      </div>
    </div>
  );
}
