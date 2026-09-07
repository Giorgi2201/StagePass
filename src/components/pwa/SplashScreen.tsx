import React from "react";
import { Ticket } from "lucide-react";

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#121212] flex flex-col items-center justify-center select-none overflow-hidden animate-splash-dismiss"
      aria-hidden="true"
      role="presentation"
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
