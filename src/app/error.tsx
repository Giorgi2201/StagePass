"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error telemetry without exposing secrets to the client
    console.error("StagePass Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      <div className="relative z-10 max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-700/50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-950/50 border border-red-800/40 text-[11px] font-bold text-red-300 uppercase tracking-wider">
            <span>Interrupted Playback</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed">
            An unexpected error occurred while loading concert setlists or connecting
            with Spotify. Your session and saved data remain secure.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-zinc-500 pt-1">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-white font-bold text-xs sm:text-sm border border-neutral-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-zinc-400" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
