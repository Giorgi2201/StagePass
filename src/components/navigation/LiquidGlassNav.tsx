"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigation, type NavigationTab } from "@/context/NavigationContext";

export function LiquidGlassNav() {
  const { activeTab, setActiveTab, tabs } = useNavigation();
  const navRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const slidingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastZoneIndexRef = useRef<number>(-1);

  // Active optical lens state: true during continuous dragging or spring transitions
  const isLensActive = isDragging || isSliding;

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (slidingTimerRef.current) {
        clearTimeout(slidingTimerRef.current);
      }
    };
  }, []);

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
    setIsSliding(true);
    if (slidingTimerRef.current) {
      clearTimeout(slidingTimerRef.current);
    }
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
      // Keep lens active briefly while settling with spring physics
      if (slidingTimerRef.current) {
        clearTimeout(slidingTimerRef.current);
      }
      slidingTimerRef.current = setTimeout(() => {
        setIsSliding(false);
      }, 260);

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
      setIsSliding(true);
      if (slidingTimerRef.current) {
        clearTimeout(slidingTimerRef.current);
      }
      slidingTimerRef.current = setTimeout(() => {
        setIsSliding(false);
      }, 280);
      setActiveTab(tabId);
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm pointer-events-auto select-none"
      style={{
        marginBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* =========================================================
          OUTER CAPSULE BAR (Reference Picture 2)
          Soft, smoky frosted glass appearance with deep backdrop blur
          and muted semi-transparent dark charcoal tint
         ========================================================= */}
      <div
        ref={navRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchMove={handleTouchMove}
        className="relative h-16 rounded-full bg-[#232724]/60 backdrop-blur-2xl border border-white/10 p-1.5 flex items-center justify-between shadow-[0_12px_40px_0_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.1)] touch-none cursor-pointer"
      >
        {/* Subtle Specular Top Hairline Reflection */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* Navigation Tabs */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="relative flex-1 h-full rounded-full flex flex-col items-center justify-center gap-1 z-10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {/* Active Sliding Indicator (Unified Liquid Glass Capsule) */}
              {isActive && (
                <motion.div
                  layoutId="activeLiquidGlassIndicator"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 pointer-events-none z-0"
                >
                  {/* Physical Expanding Lens Bead:
                      When resting: sits flush at scale 1.0 with subtle dark backing.
                      When sliding/dragging: smoothly scales up (~132% Y, ~108% X) so its rounded
                      top and bottom lips gently bulge 2-3px beyond the capsule track. */}
                  <motion.div
                    animate={{
                      scaleY: isLensActive ? 1.32 : 1.0,
                      scaleX: isLensActive ? 1.08 : 1.0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    className="relative w-full h-full rounded-full"
                  >
                    {/* =========================================================
                        1. STATE A: FLUSH IDLE BACKING (Reference Picture 2)
                        Muted, flush, soft dark matte thumb with no rainbow lines
                       ========================================================= */}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-250 ${
                        isLensActive
                          ? "bg-black/25 shadow-none"
                          : "bg-black/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
                      }`}
                    />

                    {/* =========================================================
                        2. STATE B: UNIFIED LIQUID GLASS LENS (Reference Picture 3)
                        Active strictly during drag / sliding spring glide
                       ========================================================= */}
                    <div
                      className={`absolute inset-0 rounded-full transition-opacity duration-200 ease-out ${
                        isLensActive ? "opacity-100" : "opacity-0 pointer-events-none"
                      }`}
                    >
                      {/* Optical Glass Base: real transparency with backdrop blur, external shadow, and hairline rim */}
                      <div className="absolute inset-0 rounded-full bg-white/[0.04] backdrop-blur-md shadow-lg shadow-black/50 border border-white/[0.18]" />

                      {/* Specular edge reflections hugging the curved upper & lower lips */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_1px_rgba(255,255,255,0.1)] pointer-events-none" />

                      {/* Delicate razor-thin dark contour defining the physical glass edge against background */}
                      <div className="absolute inset-0 rounded-full border border-black/40 pointer-events-none" />

                      {/* Deep curved refractive shadow meniscus hugging the rounded top and bottom rims */}
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_7px_rgba(0,0,0,0.7),inset_0_-4px_7px_rgba(0,0,0,0.7)] pointer-events-none" />

                      {/* =====================================================
                          3. CURVED CHROMATIC MENISCUS (Natural Glass Refraction)
                          Shares the exact rounded-full pill geometry of the lens.
                          Masked to the curved upper and lower arcs at ~38% opacity.
                         ===================================================== */}
                      <div
                        className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
                        style={{
                          maskImage:
                            "linear-gradient(to bottom, black 0%, black 22%, transparent 38%, transparent 62%, black 78%, black 100%)",
                          WebkitMaskImage:
                            "linear-gradient(to bottom, black 0%, black 22%, transparent 38%, transparent 62%, black 78%, black 100%)",
                        }}
                      >
                        {/* Curved Prismatic Ring along the exact rounded-full contour */}
                        <div
                          className="absolute inset-0 rounded-full border-[2.5px] border-transparent opacity-38 blur-[1px]"
                          style={{
                            background:
                              "linear-gradient(90deg, rgba(56,189,248,0.75) 0%, rgba(168,85,247,0.7) 48%, rgba(251,191,36,0.75) 100%) border-box",
                            WebkitMask:
                              "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                          }}
                        />

                        {/* Soft ambient optical dispersion bleed through the curved crystal glass */}
                        <div
                          className="absolute inset-0 rounded-full opacity-25 blur-[3px]"
                          style={{
                            background:
                              "linear-gradient(90deg, rgba(56,189,248,0.5) 0%, rgba(192,132,252,0.45) 50%, rgba(251,191,36,0.5) 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
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
                <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
