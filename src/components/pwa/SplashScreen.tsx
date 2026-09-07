"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Ticket } from "lucide-react";

const MIN_DISPLAY_MS = 600; // Minimum time to prevent visual flashing
const HARD_SAFETY_TIMEOUT_MS = 2000; // Absolute maximum fallback (2s max)
const EXIT_DURATION_MS = 700; // Fade-out and zoom animation duration
const STORAGE_KEY = "stagepass_splash_seen";

export function SplashScreen() {
  const { isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const navEntry = window.performance?.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;
      const isReload = navEntry?.type === "reload";
      const alreadySeen = sessionStorage.getItem(STORAGE_KEY);
      if (alreadySeen && !isReload) {
        return false;
      }
      sessionStorage.setItem(STORAGE_KEY, "true");
      return true;
    } catch {
      return true;
    }
  });

  const [isExiting, setIsExiting] = useState(false);

  // Reference trackers to safeguard against React 19/StrictMode double-invocations
  const hasDismissedRef = useRef(false);
  const minDisplayElapsedRef = useRef(false);
  const mountTimeRef = useRef<number>(Date.now());

  const hardSafetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Resilient exit sequence: triggers smooth CSS transition
   * and unmounts from DOM after EXIT_DURATION_MS.
   */
  const triggerExit = useCallback(() => {
    if (hasDismissedRef.current) return;
    hasDismissedRef.current = true;

    // Clear all pending timers to avoid duplicate triggers
    if (hardSafetyTimerRef.current) {
      clearTimeout(hardSafetyTimerRef.current);
      hardSafetyTimerRef.current = null;
    }
    if (minTimerRef.current) {
      clearTimeout(minTimerRef.current);
      minTimerRef.current = null;
    }

    // Trigger smooth exit transition
    setIsExiting(true);

    // Unmount completely from React DOM once exit transition finishes
    exitTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, EXIT_DURATION_MS);
  }, []);

  // 1. Hard Safety Timeout & Minimum Display Timer on Mount
  useEffect(() => {
    if (!isVisible) return;

    // Hard Safety Fallback: after 2000ms, immediately force dismissal regardless of any state
    hardSafetyTimerRef.current = setTimeout(() => {
      triggerExit();
    }, HARD_SAFETY_TIMEOUT_MS);

    // Minimum Display Timer: mark min display elapsed after 600ms
    minTimerRef.current = setTimeout(() => {
      minDisplayElapsedRef.current = true;
      // If auth finished while we were waiting for the minimum duration
      if (!isLoading) {
        triggerExit();
      }
    }, MIN_DISPLAY_MS);

    return () => {
      // In React StrictMode development cleanup, clear pending timers if exit hasn't started
      if (!hasDismissedRef.current) {
        if (hardSafetyTimerRef.current) {
          clearTimeout(hardSafetyTimerRef.current);
        }
        if (minTimerRef.current) {
          clearTimeout(minTimerRef.current);
        }
      }
    };
  }, [isVisible, triggerExit]);

  // 2. Reactivity to Auth State (isLoading becoming false)
  useEffect(() => {
    if (!isVisible || hasDismissedRef.current) return;

    if (!isLoading) {
      const elapsed = Date.now() - mountTimeRef.current;
      if (elapsed >= MIN_DISPLAY_MS || minDisplayElapsedRef.current) {
        triggerExit();
      } else {
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
        const timer = setTimeout(() => {
          triggerExit();
        }, remaining);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, isVisible, triggerExit]);

  // Cleanup exit transition timer on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#121212] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-700 ease-out ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none"
          : "opacity-100 scale-100 pointer-events-auto"
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
