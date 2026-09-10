"use client";

import React, { useRef } from "react";
import { useAudio } from "@/context/AudioContext";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, SkipForward, X, Loader2, Music2 } from "lucide-react";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Mobile Mini-Player Tier:
 * Baked directly into the top of the unified Liquid Glass dock card.
 * Features full-panel translucent Spotify Green progress wash,
 * squircle album artwork, and minimalist line controls.
 */
export function MobileMiniPlayer() {
  const {
    activeTrack,
    artistName,
    artworkUrl,
    isPlaying,
    isLoadingAudio,
    progress,
    pause,
    resume,
    skipNext,
    setIsExpanded,
  } = useAudio();

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

  return (
    <div
      onClick={() => setIsExpanded(true)}
      className="relative w-full py-2.5 px-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform select-none"
      title="Tap to expand player"
    >
      {/* Full-Panel Background Progress Fill (Spotify Green wash sweeping 0% to 100%) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#1DB954]/20 via-[#1DB954]/25 to-[#1DB954]/35 border-r border-[#1DB954]/60 transition-[width] duration-150 ease-linear shadow-[0_0_15px_rgba(29,185,84,0.35)]"
          style={{
            width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
          }}
        />
      </div>

      {/* Left: Rounded squircle album artwork thumbnail */}
      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-900 shrink-0 flex items-center justify-center shadow-sm z-10 ring-1 ring-white/10">
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt={activeTrack.name}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-900 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white/80" />
          </div>
        )}
      </div>

      {/* Center: Track Title & Artist Name */}
      <div className="flex-1 min-w-0 mx-3 flex flex-col justify-center z-10">
        <span className="text-sm font-bold text-white truncate leading-snug">
          {activeTrack.name}
        </span>
        <span className="text-xs text-neutral-400 truncate leading-snug mt-0.5">
          {artistName || "Preview"}
        </span>
      </div>

      {/* Right: Minimalist Line Controls (Play/Pause & Skip Next) */}
      <div className="flex items-center gap-3 shrink-0 z-10 pr-1">
        <button
          type="button"
          onClick={handleTogglePlayPause}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={isLoadingAudio}
          className="p-1.5 text-white hover:text-white/80 active:scale-90 transition-all cursor-pointer disabled:opacity-50"
          title={isPlaying ? "Pause Preview" : "Play Preview"}
          aria-label={isPlaying ? "Pause Preview" : "Play Preview"}
        >
          {isLoadingAudio ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-white text-white" />
          ) : (
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            skipNext();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer"
          title="Skip Next"
          aria-label="Skip Next"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
}

/**
 * Desktop Spotify Player Dock:
 * Full-width 3-column Spotify Web Player layout with 30s scrubber.
 * Only renders on desktop (`hidden md:flex`).
 */
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
    setIsExpanded,
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
        key="desktop-audio-player-dock"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="contents"
      >
        {/* Desktop Spotify Player Dock (hidden md:flex) */}
        <aside
          aria-label="Desktop Spotify Audio Preview Player"
          className="hidden md:flex fixed bottom-0 left-0 right-0 z-40 h-20 bg-[#181818]/95 backdrop-blur-xl border-t border-white/10 px-6 items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] select-none pointer-events-auto"
        >
          {/* Column 1 (Left - Now Playing Info) */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3.5 min-w-[200px] max-w-[30%] shrink-0 cursor-pointer group"
            title="Click to expand Now Playing showcase"
          >
            <div className="w-14 h-14 rounded-md overflow-hidden bg-neutral-900 ring-1 ring-white/10 group-hover:ring-[#1DB954]/50 shadow-md shrink-0 relative flex items-center justify-center transition-all">
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

            <div className="w-full flex items-center justify-between gap-2.5">
              <span className="text-[11px] text-neutral-400 font-mono tabular-nums select-none min-w-[28px] text-right">
                {formatTime(currentTime)}
              </span>

              <div
                ref={desktopScrubberRef}
                onClick={handleScrubberClick}
                className="relative h-1 hover:h-1.5 bg-white/20 hover:bg-white/30 rounded-full flex-1 overflow-hidden cursor-pointer group transition-all"
                title="Click to seek preview"
              >
                <div
                  className="h-full bg-white group-hover:bg-[#1DB954] transition-colors rounded-full"
                  style={{
                    width: `${Math.min(Math.max(progress * 100, 0), 100)}%`,
                  }}
                />
              </div>

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
