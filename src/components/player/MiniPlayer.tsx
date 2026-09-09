"use client";

import React, { useRef } from "react";
import { useAudio } from "@/context/AudioContext";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, X, Loader2, Music2 } from "lucide-react";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const {
    activeTrack,
    artistName,
    artworkUrl,
    isPlaying,
    isLoadingAudio,
    progress,
    currentTime,
    duration,
    pause,
    resume,
    seek,
    stop,
  } = useAudio();

  const desktopScrubberRef = useRef<HTMLDivElement>(null);

  if (!activeTrack) {
    return null;
  }

  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!desktopScrubberRef.current) return;
    const rect = desktopScrubberRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = clickPercent * (duration || 30);
    seek(targetSeconds);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="global-audio-player"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="contents"
      >
        {/* =========================================================================
            1. MOBILE LIQUID GLASS MINI-PLAYER (md:hidden)
            Pill-shaped capsule matching the liquid glass navbar, docked cleanly above
           ========================================================================= */}
        <aside
          aria-label="Mobile Audio Preview Player"
          className="md:hidden fixed left-1/2 -translate-x-1/2 z-35 w-[calc(100%-2rem)] max-w-sm bottom-[calc(5.25rem+env(safe-area-inset-bottom,16px))] pointer-events-auto select-none"
        >
          <div className="relative overflow-hidden rounded-full bg-black/80 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.65)] p-2 pl-2.5 pr-2.5 flex items-center justify-between gap-3">
            {/* Specular top hairline reflection */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Left: Circular Album Artwork Thumbnail */}
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/15 bg-neutral-900 shrink-0 flex items-center justify-center shadow-inner">
              {artworkUrl ? (
                // Using standard img for external dynamic CDNs (iTunes & Spotify)
                <img
                  src={artworkUrl}
                  alt={activeTrack.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-[#1DB954]/20 to-neutral-800 flex items-center justify-center">
                  <Music2 className="w-4 h-4 text-[#1DB954]" />
                </div>
              )}
            </div>

            {/* Middle: Track Title & Artist Name */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-xs font-bold text-white truncate leading-tight">
                {activeTrack.name}
              </span>
              <span className="text-[11px] text-neutral-400 truncate leading-tight mt-0.5">
                {artistName || "Preview"}
              </span>
            </div>

            {/* Right: Controls (Play/Pause + Close) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Circular Play / Pause Button */}
              <button
                type="button"
                onClick={handleTogglePlayPause}
                disabled={isLoadingAudio}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md cursor-pointer disabled:opacity-75"
                title={isPlaying ? "Pause Preview" : "Play Preview"}
                aria-label={isPlaying ? "Pause Preview" : "Play Preview"}
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                )}
              </button>

              {/* Close Button ('X') */}
              <button
                type="button"
                onClick={() => stop()}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white active:scale-90 transition-all cursor-pointer"
                title="Dismiss Player"
                aria-label="Dismiss Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hairline Curved Progress Bar at Bottom of Pill */}
            <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/10 overflow-hidden rounded-full pointer-events-none">
              <div
                className="h-full bg-[#1DB954] transition-all duration-100 ease-linear rounded-full shadow-[0_0_8px_rgba(29,185,84,0.6)]"
                style={{
                  width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
                }}
              />
            </div>
          </div>
        </aside>

        {/* =========================================================================
            2. DESKTOP SPOTIFY PLAYER DOCK (hidden md:flex)
            Full-width 3-column Spotify Web Player layout with 30s scrubber
           ========================================================================= */}
        <aside
          aria-label="Desktop Spotify Audio Preview Player"
          className="hidden md:flex fixed bottom-0 left-0 right-0 z-40 h-20 bg-[#181818]/95 backdrop-blur-xl border-t border-white/10 px-6 items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] select-none pointer-events-auto"
        >
          {/* Column 1 (Left - Now Playing Info) */}
          <div className="flex items-center gap-3.5 min-w-[200px] max-w-[30%] shrink-0">
            <div className="w-14 h-14 rounded-md overflow-hidden bg-neutral-900 ring-1 ring-white/10 shadow-md shrink-0 relative flex items-center justify-center">
              {artworkUrl ? (
                <img
                  src={artworkUrl}
                  alt={activeTrack.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-900 flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-[#1DB954]" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              <span
                className="font-medium text-sm text-white truncate hover:underline cursor-pointer"
                title={activeTrack.name}
              >
                {activeTrack.name}
              </span>
              <span
                className="text-xs text-neutral-400 truncate mt-0.5"
                title={artistName || ""}
              >
                {artistName || "Unknown Artist"}
              </span>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1DB954]/15 border border-[#1DB954]/30 text-[10px] font-bold text-[#1DB954] uppercase tracking-wider">
                  30s Preview
                </span>
              </div>
            </div>
          </div>

          {/* Column 2 (Center - Playback Controls & 30s Scrubber Timeline) */}
          <div className="flex-1 max-w-lg flex flex-col items-center gap-1.5 px-4">
            {/* Primary Center Playback Button */}
            <button
              type="button"
              onClick={handleTogglePlayPause}
              disabled={isLoadingAudio}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md cursor-pointer disabled:opacity-75"
              title={isPlaying ? "Pause Preview" : "Play Preview"}
              aria-label={isPlaying ? "Pause Preview" : "Play Preview"}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-black text-black" />
              ) : (
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              )}
            </button>

            {/* Scrubber Row */}
            <div className="w-full flex items-center justify-between gap-2.5">
              {/* Current Time Indicator */}
              <span className="text-[11px] text-neutral-400 font-mono tabular-nums select-none min-w-[28px] text-right">
                {formatTime(currentTime)}
              </span>

              {/* Scrubber Track Bar */}
              <div
                ref={desktopScrubberRef}
                onClick={handleScrubberClick}
                className="relative h-1 hover:h-1.5 bg-white/20 hover:bg-white/30 rounded-full flex-1 overflow-hidden cursor-pointer group transition-all"
                title="Click to seek preview"
              >
                <div
                  className="h-full bg-white group-hover:bg-[#1DB954] transition-colors rounded-full shadow-[0_0_8px_rgba(29,185,84,0.5)]"
                  style={{
                    width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
                  }}
                />
              </div>

              {/* Total Duration Indicator */}
              <span className="text-[11px] text-neutral-400 font-mono tabular-nums select-none min-w-[28px]">
                {formatTime(duration || 30)}
              </span>
            </div>
          </div>

          {/* Column 3 (Right - Dismiss & Close Action) */}
          <div className="flex items-center justify-end gap-3 min-w-[200px] max-w-[30%] shrink-0">
            <button
              type="button"
              onClick={() => stop()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Stop and Close Player"
            >
              <X className="w-4 h-4" />
              <span>Dismiss</span>
            </button>
          </div>
        </aside>
      </motion.div>
    </AnimatePresence>
  );
}
