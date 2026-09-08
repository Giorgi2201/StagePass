"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { Download, X, Share, PlusSquare, Sparkles } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "stagepass_pwa_dismissed_until";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function subscribeStandalone(callback: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getStandaloneSnapshot(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getServerStandaloneSnapshot(): boolean {
  return false;
}

export function InstallPrompt() {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getServerStandaloneSnapshot
  );

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showIOSTeaser, setShowIOSTeaser] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone) return;

    // Check 7-day dismissal cooldown
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Android / Chromium: listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS Safari Detection
    const userAgent = window.navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(userAgent) &&
      !(window as unknown as { MSStream?: boolean }).MSStream;
    const isSafari =
      /Safari/.test(userAgent) &&
      !/CriOS|FxiOS|OPiOS|mercury/i.test(userAgent);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS && isSafari) {
      iosTimer = setTimeout(() => {
        setShowIOSTeaser(true);
      }, 1000);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [isStandalone]);

  const dismissPrompt = () => {
    localStorage.setItem(
      DISMISS_KEY,
      (Date.now() + SEVEN_DAYS_MS).toString()
    );
    setShowAndroidBanner(false);
    setShowIOSTeaser(false);
    setShowIOSModal(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowAndroidBanner(false);
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* =========================================================
          1. ANDROID / CHROMIUM / DESKTOP INSTALL BANNER
         ========================================================= */}
      {showAndroidBanner && (
        <aside
          role="region"
          aria-label="App Installation Prompt"
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-neutral-950/95 border border-neutral-800 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        >
          <div className="flex items-center gap-3.5">
            {/* App Icon */}
            <div className="relative w-11 h-11 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0 shadow">
              <Image
                src="/icon-192x192.png"
                alt="StagePass Icon"
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  Install StagePass
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-[9px] font-bold">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-[#B3B3B3] leading-tight truncate">
                Instant concert setlists & offline access inside stadiums
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={dismissPrompt}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismissPrompt}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs shadow-lg shadow-[#1DB954]/25 active:scale-[0.97] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install App</span>
            </button>
          </div>
        </aside>
      )}

      {/* =========================================================
          2. iOS SAFARI FLOATING TEASER PILL
         ========================================================= */}
      {showIOSTeaser && !showIOSModal && (
        <aside
          role="region"
          aria-label="iOS Installation Prompt"
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-50 p-3 rounded-2xl bg-neutral-950/95 border border-[#1DB954]/40 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 shadow">
                <Image
                  src="/icon-192x192.png"
                  alt="StagePass Icon"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  Install StagePass on iPhone
                </div>
                <div className="text-[10px] text-[#B3B3B3] truncate">
                  Add to home screen for native app feel
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="px-3 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-[11px] font-extrabold shadow-md active:scale-[0.96] transition-all cursor-pointer"
              >
                How to Install
              </button>
              <button
                type="button"
                onClick={dismissPrompt}
                className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* =========================================================
          3. iOS SAFARI STEP-BY-STEP VISUAL GUIDANCE MODAL
         ========================================================= */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install StagePass on iOS"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowIOSModal(false);
            }
          }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-neutral-800 p-5 sm:p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-250 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Install StagePass
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7 rounded-full bg-neutral-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#B3B3B3] leading-relaxed">
              Install StagePass directly to your iPhone or iPad home screen for
              fullscreen access, stadium offline caching, and instant launch:
            </p>

            {/* Step-by-Step Visual Instructions */}
            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c] border border-neutral-800">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-blue-400">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs text-zinc-200 leading-snug">
                  1. Tap the <span className="font-bold text-white">Share</span>{" "}
                  button in Safari&apos;s bottom toolbar
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c] border border-neutral-800">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-zinc-200">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs text-zinc-200 leading-snug">
                  2. Scroll down and select{" "}
                  <span className="font-bold text-white">
                    Add to Home Screen
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1c1c] border border-neutral-800">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-[#1DB954] font-extrabold text-xs">
                  ADD
                </div>
                <div className="text-xs text-zinc-200 leading-snug">
                  3. Tap <span className="font-bold text-white">Add</span> in
                  the top right corner
                </div>
              </div>
            </div>

            {/* Confirm Got It Button */}
            <button
              type="button"
              onClick={dismissPrompt}
              className="w-full py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-[#1DB954]/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
