"use client";

import React, { useEffect } from "react";
import { useAudio } from "@/context/AudioContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Music2,
  Loader2,
  X,
  ListMusic,
} from "lucide-react";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MaximizedPlayer() {
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
    isExpanded,
    setIsExpanded,
    queue,
    isLooping,
    toggleLoop,
    skipNext,
    skipPrevious,
  } = useAudio();

  // Close desktop modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isExpanded, setIsExpanded]);

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

  // Open Horseshoe Gauge Arc Dimensions (270-degree sweep with 90-degree bottom gap)
  // Starts at bottom-left (135 deg / 7:30 o'clock), sweeps clockwise to bottom-right (45 deg / 4:30 o'clock)
  const svgSize = 300;
  const strokeWidth = 5;
  const cx = svgSize / 2; // 150
  const cy = svgSize / 2; // 150
  const r = 135;

  const startAngleRad = (135 * Math.PI) / 180;
  const endAngleRad = (45 * Math.PI) / 180;

  const startX = Number((cx + r * Math.cos(startAngleRad)).toFixed(2)); // 54.54
  const startY = Number((cy + r * Math.sin(startAngleRad)).toFixed(2)); // 245.46
  const endX = Number((cx + r * Math.cos(endAngleRad)).toFixed(2)); // 245.46
  const endY = Number((cy + r * Math.sin(endAngleRad)).toFixed(2)); // 245.46

  // Clockwise arc from bottom-left up over the top to bottom-right (bottom segment is open)
  const gaugePathD = `M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}`;

  // Arc length is exactly 270 / 360 of circumference (3/4 of 2 * PI * r)
  const arcLength = Number((1.5 * Math.PI * r).toFixed(2)); // ~636.17
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = arcLength * (1 - clampedProgress);

  // Queue Position
  const currentIndex = queue.findIndex(
    (t) =>
      (t.id && activeTrack?.id && t.id === activeTrack.id) ||
      t.name.toLowerCase() === activeTrack?.name.toLowerCase()
  );

  return (
    <AnimatePresence>
      {isExpanded && (
        <>
          {/* =========================================================================
              1. MOBILE FULL-SCREEN LIQUID GLASS PLAYER (md:hidden)
              Slides up with spring physics, dismissed via top-left chevron button
             ========================================================================= */}
          <motion.div
            key="maximized-player-mobile"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
            }}
            className="fixed inset-0 z-50 md:hidden flex flex-col justify-between bg-[#0a0a0a]/95 backdrop-blur-3xl text-white select-none overflow-hidden"
          >
            {/* Subtle Ambient Background Glow (Uniform & Seamless) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#1DB954]/10 blur-[100px] pointer-events-none -z-10" />

            {/* Top Header Bar */}
            <header className="px-6 py-2 flex items-center justify-between gap-4">
              {/* Left: Collapse Chevron */}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                title="Collapse Player"
                aria-label="Collapse Player"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              {/* Center: Song Title & Artist */}
              <div className="flex-1 min-w-0 text-center flex flex-col items-center">
                <span className="text-base font-bold text-white truncate max-w-[200px] leading-tight">
                  {activeTrack.name}
                </span>
                <span className="text-xs text-neutral-400 truncate max-w-[200px] leading-tight mt-0.5">
                  {artistName || "Concert Setlist"}
                </span>
              </div>

              {/* Right: Symmetrical Spacer to keep song title perfectly centered */}
              <div className="w-10 h-10" aria-hidden="true" />
            </header>

            {/* Centerpiece: Spinning Vinyl & Horseshoe Gauge Arc (Clean, unclipped) */}
            <div className="relative flex items-center justify-center my-auto py-4 px-4">
              {/* Outer Concentric Glass Halo & Open Horseshoe Gauge */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md flex items-center justify-center shadow-2xl z-10">
                {/* SVG Open Horseshoe Radial Gauge (Read-only, non-interactive) */}
                <svg
                  viewBox={`0 0 ${svgSize} ${svgSize}`}
                  className="absolute inset-0 w-full h-full pointer-events-none select-none"
                >
                  {/* Background Open Horseshoe Track (Bottom segment open) */}
                  <path
                    d={gaugePathD}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                  {/* Glowing Spotify Green Progress Arc */}
                  <path
                    d={gaugePathD}
                    fill="none"
                    stroke="#1DB954"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-[stroke-dashoffset] duration-150 ease-linear"
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(29, 185, 84, 0.7))",
                    }}
                  />
                </svg>

                {/* Inner Spinning Circular Vinyl Disc */}
                <div
                  className="w-52 h-52 sm:w-56 sm:h-56 rounded-full overflow-hidden relative shadow-2xl ring-2 ring-white/15 bg-neutral-900 flex items-center justify-center z-10 animate-spin-record"
                  style={{
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                >
                  {artworkUrl ? (
                    <img
                      src={artworkUrl}
                      alt={activeTrack.name}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-900 flex items-center justify-center">
                      <Music2 className="w-16 h-16 text-[#1DB954]" />
                    </div>
                  )}

                  {/* Concentric Vinyl Center Spindle (Spins with record) */}
                  <div className="absolute w-10 h-10 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-inner pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-white/80" />
                  </div>
                </div>

                {/* Time Indicator Badge (Nestled cleanly in the bottom horseshoe gap) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-black/75 border border-white/15 backdrop-blur-md text-xs font-mono font-bold tracking-wider text-white shadow-xl z-20 flex items-center gap-1.5 pointer-events-none select-none">
                  <span className="text-[#1DB954]">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-zinc-500">/</span>
                  <span className="text-zinc-400">
                    {formatTime(duration || 30)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Playback Controls - Symmetrical 5-Button Row */}
            <footer className="w-full px-6 pb-[max(2rem,env(safe-area-inset-bottom,24px))] pt-2 flex flex-col items-center gap-4">
              <div className="w-full grid grid-cols-5 items-center justify-items-center max-w-xs mx-auto">
                {/* 1. Loop / Repeat Button */}
                <button
                  type="button"
                  onClick={toggleLoop}
                  className={`p-3 rounded-full transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                    isLooping
                      ? "text-[#1DB954] bg-[#1DB954]/15 border border-[#1DB954]/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title={isLooping ? "Disable Repeat" : "Enable Single Track Repeat"}
                  aria-label={isLooping ? "Disable Repeat" : "Enable Single Track Repeat"}
                >
                  <Repeat className="w-5 h-5" />
                </button>

                {/* 2. Skip Previous Button */}
                <button
                  type="button"
                  onClick={skipPrevious}
                  className="p-3 rounded-full text-white/90 hover:text-white active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                  title="Previous Track"
                  aria-label="Previous Track"
                >
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>

                {/* 3. Primary Play / Pause Button - Centered exactly on the vertical line of the disc */}
                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  disabled={isLoadingAudio}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_25px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-75"
                  title={isPlaying ? "Pause" : "Play"}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-7 h-7 animate-spin text-black" />
                  ) : isPlaying ? (
                    <Pause className="w-7 h-7 fill-black text-black" />
                  ) : (
                    <Play className="w-7 h-7 fill-black text-black ml-1" />
                  )}
                </button>

                {/* 4. Skip Next Button */}
                <button
                  type="button"
                  onClick={skipNext}
                  className="p-3 rounded-full text-white/90 hover:text-white active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                  title="Next Track"
                  aria-label="Next Track"
                >
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>

                {/* 5. Queue / Setlist Indicator */}
                <div
                  className="p-2 text-neutral-400 flex items-center justify-center gap-1 text-xs font-mono select-none"
                  title={`Track ${currentIndex !== -1 ? currentIndex + 1 : 1} of ${queue.length || 1}`}
                >
                  <ListMusic className="w-4 h-4 text-neutral-400" />
                  <span>
                    {currentIndex !== -1 ? currentIndex + 1 : 1}/{queue.length || 1}
                  </span>
                </div>
              </div>
            </footer>
          </motion.div>

          {/* =========================================================================
              2. DESKTOP CENTERED SHOWCASE MODAL (hidden md:flex)
              Glassmorphic showcase dialog with circular vinyl art and radial scrubber
             ========================================================================= */}
          <div
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          >
            <motion.div
              key="maximized-player-desktop"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full rounded-3xl bg-[#121212]/95 backdrop-blur-3xl border border-white/10 p-7 shadow-2xl space-y-6 relative overflow-hidden select-none"
            >
              {/* Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#1DB954]/15 blur-3xl pointer-events-none -z-10" />

              {/* Desktop Header Row */}
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-[#1DB954] tracking-wider mb-0.5">
                    Now Playing Preview
                  </div>
                  <h3 className="text-lg font-bold text-white truncate">
                    {activeTrack.name}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate">
                    {artistName || "Concert Artist"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Centerpiece: Spinning Vinyl & Horseshoe Gauge Arc */}
              <div className="flex items-center justify-center py-2 relative">
                {/* Outer Concentric Halo */}
                <div className="relative w-64 h-64 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md flex items-center justify-center shadow-xl">
                  {/* SVG Open Horseshoe Radial Gauge (Read-only, non-interactive) */}
                  <svg
                    viewBox={`0 0 ${svgSize} ${svgSize}`}
                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                  >
                    {/* Background Open Horseshoe Track */}
                    <path
                      d={gaugePathD}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />
                    {/* Glowing Spotify Green Progress Arc */}
                    <path
                      d={gaugePathD}
                      fill="none"
                      stroke="#1DB954"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={arcLength}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-[stroke-dashoffset] duration-150 ease-linear"
                      style={{
                        filter: "drop-shadow(0 0 6px rgba(29, 185, 84, 0.7))",
                      }}
                    />
                  </svg>

                  {/* Inner Spinning Circular Vinyl Disc */}
                  <div
                    className="w-44 h-44 rounded-full overflow-hidden relative shadow-2xl ring-2 ring-white/15 bg-neutral-900 flex items-center justify-center z-10 animate-spin-record"
                    style={{
                      animationPlayState: isPlaying ? "running" : "paused",
                    }}
                  >
                    {artworkUrl ? (
                      <img
                        src={artworkUrl}
                        alt={activeTrack.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-900 flex items-center justify-center">
                        <Music2 className="w-12 h-12 text-[#1DB954]" />
                      </div>
                    )}
                    <div className="absolute w-8 h-8 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-inner pointer-events-none">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
                    </div>
                  </div>

                  {/* Time Badge (Nestled cleanly in bottom gap) */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-black/75 border border-white/15 backdrop-blur-md text-[11px] font-mono font-bold tracking-wider text-white shadow-xl z-20 flex items-center gap-1.5 pointer-events-none select-none">
                    <span className="text-[#1DB954]">
                      {formatTime(currentTime)}
                    </span>
                    <span className="text-zinc-500">/</span>
                    <span className="text-zinc-400">
                      {formatTime(duration || 30)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Controls - Symmetrical 5-Button Row */}
              <div className="w-full grid grid-cols-5 items-center justify-items-center max-w-xs mx-auto pt-2">
                <button
                  type="button"
                  onClick={toggleLoop}
                  className={`p-2.5 rounded-full transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                    isLooping
                      ? "text-[#1DB954] bg-[#1DB954]/15 border border-[#1DB954]/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title={isLooping ? "Disable Repeat" : "Enable Repeat"}
                  aria-label={isLooping ? "Disable Repeat" : "Enable Repeat"}
                >
                  <Repeat className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={skipPrevious}
                  className="p-2.5 rounded-full text-white/90 hover:text-white active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                  title="Previous Track"
                  aria-label="Previous Track"
                >
                  <SkipBack className="w-6 h-6 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  disabled={isLoadingAudio}
                  className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-75"
                  title={isPlaying ? "Pause" : "Play"}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-6 h-6 animate-spin text-black" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-black text-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={skipNext}
                  className="p-2.5 rounded-full text-white/90 hover:text-white active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                  title="Next Track"
                  aria-label="Next Track"
                >
                  <SkipForward className="w-6 h-6 fill-current" />
                </button>

                <div
                  className="p-2 text-neutral-400 flex items-center justify-center gap-1 text-xs font-mono select-none"
                  title={`Track ${currentIndex !== -1 ? currentIndex + 1 : 1} of ${queue.length || 1}`}
                >
                  <ListMusic className="w-4 h-4 text-neutral-400" />
                  <span>
                    {currentIndex !== -1 ? currentIndex + 1 : 1}/{queue.length || 1}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
