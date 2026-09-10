"use client";

import React, { useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigation, type NavigationTab } from "@/context/NavigationContext";
import { useAudio } from "@/context/AudioContext";
import { MobileMiniPlayer } from "@/components/player/MiniPlayer";

export function LiquidGlassNav() {
  const { activeTab, setActiveTab, tabs } = useNavigation();
  const { activeTrack } = useAudio();
  const navRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastZoneIndexRef = useRef<number>(-1);

  // Dynamic zone detection during continuous horizontal dragging/scrubbing
  const updateTabFromPointer = useCallback(
    (clientX: number) => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      if (rect.width === 0) return;

      const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const zoneWidth = rect.width / tabs.length;
      const zoneIndex = Math.min(
        tabs.length - 1,
        Math.max(0, Math.floor(relativeX / zoneWidth))
      );

      if (zoneIndex !== lastZoneIndexRef.current) {
        lastZoneIndexRef.current = zoneIndex;
        setActiveTab(tabs[zoneIndex].id);
      }
    },
    [tabs, setActiveTab]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    lastZoneIndexRef.current = tabs.findIndex((t) => t.id === activeTab);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateTabFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateTabFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Silently ignore if already released
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      updateTabFromPointer(e.touches[0].clientX);
    }
  };

  const handleTabClick = (tabId: NavigationTab) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation and Player Dock"
      className="md:hidden fixed bottom-[max(12px,calc(env(safe-area-inset-bottom,0px)-6px))] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm pointer-events-auto select-none"
      style={{
        bottom: "max(12px, calc(env(safe-area-inset-bottom, 0px) - 6px))",
      }}
    >
      {/* =========================================================
          UNIFIED TWO-TIER LIQUID GLASS DOCK
          A single continuous frosted glass card enclosing both
          the mini-player and the navigation tabs with zero seams,
          zero transparent corner cutouts, and uniform glass tone.
         ========================================================= */}
      <div className="relative w-full rounded-[28px] bg-[#1c1f1d]/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_0_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col transition-[border-radius] duration-300">
        {/* Subtle Specular Top Hairline Reflection */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none z-20" />

        {/* Tier 1: Conjoined Mobile Mini-Player (slides down/up inside the single unified card) */}
        <AnimatePresence>
          {activeTrack && (
            <motion.div
              key="unified-mobile-mini-player-tier"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="w-full overflow-hidden"
            >
              <MobileMiniPlayer />
              {/* Subtle hairline divider between mini-player and navigation */}
              <div className="w-full h-[1px] bg-white/[0.08]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tier 2: Liquid Glass Navigation Capsule Track */}
        <div
          ref={navRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchMove={handleTouchMove}
          className="relative w-full h-14 p-[3px] flex items-center justify-between touch-none cursor-pointer"
        >

        {/* Navigation Tabs */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="relative flex-1 h-full rounded-full flex flex-col items-center justify-center gap-0.5 z-10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {/* Active Sliding Indicator (Clean Dark Matte Pill as in Pic 2) */}
              {isActive && (
                <motion.div
                  layoutId="activeLiquidGlassIndicator"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                  className="absolute inset-0 pointer-events-none z-0 rounded-full bg-black/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5"
                />
              )}

              {/* Icon & Label Typography */}
              <div
                className={`relative z-10 flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "text-white font-medium scale-105"
                    : "text-white/60 hover:text-white/80 font-normal"
                }`}
              >
                <Icon className="w-5 h-5 transition-transform" />
                <span className="text-[10.5px] font-medium tracking-tight mt-0.5 leading-none">
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
