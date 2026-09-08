"use client";

import React, { forwardRef } from "react";
import type { NormalizedTrack } from "@/types/setlist";
import { Sparkles, Music2 } from "lucide-react";

export type TicketTheme = "spotify" | "vintage" | "cyber";

export interface TicketStubProps {
  artistName: string;
  tourName?: string;
  venueName?: string;
  cityName?: string;
  countryName?: string;
  eventDate?: string;
  tracks?: NormalizedTrack[];
  section?: string;
  row?: string;
  seat?: string;
  theme?: TicketTheme;
  ticketNumber?: string;
  mode?: "memory" | "rehearsal" | "essential";
}

// Generates an authentic alternating vector barcode SVG pattern
function BarcodeSVG({ code, color }: { code: string; color: string }) {
  // Deterministic bar widths based on char codes
  const bars: { width: number; gap: number }[] = [];
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const w1 = (charCode % 3) + 1.5;
    const g1 = ((charCode >> 1) % 2) + 1.2;
    const w2 = ((charCode >> 2) % 3) + 1.2;
    const g2 = ((charCode >> 3) % 2) + 1.5;
    bars.push({ width: w1, gap: g1 }, { width: w2, gap: g2 });
  }

  let currentX = 10;
  return (
    <svg
      viewBox="0 0 240 46"
      className="w-full h-11"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {bars.map((bar, idx) => {
        const x = currentX;
        currentX += bar.width + bar.gap;
        return (
          <rect
            key={idx}
            x={x}
            y="2"
            width={bar.width}
            height="34"
            fill={color}
          />
        );
      })}
      <text
        x="120"
        y="44"
        fill={color}
        fontSize="8"
        fontFamily="monospace"
        fontWeight="600"
        letterSpacing="3"
        textAnchor="middle"
      >
        {code}
      </text>
    </svg>
  );
}

export const TicketStub = forwardRef<HTMLDivElement, TicketStubProps>(
  (
    {
      artistName,
      tourName,
      venueName,
      cityName,
      countryName,
      eventDate,
      tracks = [],
      section = "GA",
      row = "1",
      seat = "042",
      theme = "spotify",
      ticketNumber,
      mode,
    },
    ref
  ) => {
    const isEssential = mode === "essential";
    const effectiveVenueName = isEssential
      ? (venueName && venueName !== "Main Stage Arena" ? venueName : "STUDIO DISCOGRAPHY")
      : (venueName || "Main Stage Arena");
    const effectiveCityName = isEssential
      ? (cityName && cityName !== "Global Tour" ? cityName : "GLOBAL ESSENTIALS")
      : (cityName || "Global Tour");
    const effectiveTourName = isEssential
      ? (tourName || "Essential Hits & Fan Favorites")
      : tourName;
    const effectiveEventDate = isEssential
      ? (eventDate && eventDate !== "LIVE 2026" ? eventDate : "STUDIO 2026")
      : (eventDate || "LIVE 2026");

    // Generate deterministic ticket number if not provided
    const serializedCode =
      ticketNumber ||
      `SP-${artistName.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "LIVE"}-${(Math.abs(
        artistName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 1024)
      ) % 9000) + 1000}`;

    // Format date string parts
    const dateParts = (() => {
      const parts = effectiveEventDate.split("-");
      if (parts.length === 3) {
        const day = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const year = parts[2];
        const monthNames = [
          "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
          "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
        ];
        return {
          month: monthNames[monthNum - 1] || "CON",
          day,
          year,
          full: `${monthNames[monthNum - 1] || ""} ${day}, ${year}`,
        };
      }
      if (isEssential) {
        return {
          month: "STUDIO",
          day: "HITS",
          year: "2026",
          full: "DEFINITIVE COLLECTION",
        };
      }
      return {
        month: "LIVE",
        day: "PASS",
        year: effectiveEventDate,
        full: effectiveEventDate,
      };
    })();

    // Preview up to 8 tracks on the ticket
    const previewTracks = tracks.slice(0, 8);
    const extraTracksCount = Math.max(0, tracks.length - previewTracks.length);

    // Theme Configs
    const themeStyles = {
      spotify: {
        container:
          "bg-[#141414] text-white border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(29,185,84,0.12)]",
        stubBg: "bg-[#0f0f0f] border-neutral-800",
        dividerBorder: "border-neutral-700/80",
        notchColor: "bg-[#0a0a0a]", // matches outer modal/backdrop
        accentColor: "#1DB954",
        accentBg: "bg-[#1DB954]",
        accentText: "text-[#1DB954]",
        badgeBg: "bg-[#1DB954]/15 border-[#1DB954]/40 text-[#1DB954]",
        secondaryText: "text-[#A7A7A7]",
        mutedText: "text-neutral-500",
        boxBg: "bg-neutral-900/90 border-neutral-800",
        barcodeColor: "#FFFFFF",
      },
      vintage: {
        container:
          "bg-[#FAF4E8] text-[#241C15] border-[#D4C3A3] shadow-[0_12px_35px_rgba(0,0,0,0.6),0_2px_10px_rgba(90,70,50,0.15)]",
        stubBg: "bg-[#F1E7D3] border-[#D4C3A3]",
        dividerBorder: "border-[#C5B390]",
        notchColor: "bg-[#0a0a0a]",
        accentColor: "#8C2524",
        accentBg: "bg-[#8C2524]",
        accentText: "text-[#8C2524]",
        badgeBg: "bg-[#8C2524]/10 border-[#8C2524]/30 text-[#8C2524]",
        secondaryText: "text-[#5C4F40]",
        mutedText: "text-[#8E7E6E]",
        boxBg: "bg-[#EAE0CA]/80 border-[#D4C3A3]",
        barcodeColor: "#241C15",
      },
      cyber: {
        container:
          "bg-[#090912] text-white border-cyan-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_35px_rgba(6,182,212,0.22)]",
        stubBg: "bg-[#05050A] border-cyan-900/60",
        dividerBorder: "border-cyan-500/50",
        notchColor: "bg-[#0a0a0a]",
        accentColor: "#00F0FF",
        accentBg: "bg-gradient-to-r from-cyan-400 to-purple-500",
        accentText: "text-cyan-400",
        badgeBg: "bg-cyan-950/60 border-cyan-500/40 text-cyan-300",
        secondaryText: "text-slate-400",
        mutedText: "text-slate-600",
        boxBg: "bg-[#101020]/90 border-cyan-900/60",
        barcodeColor: "#00F0FF",
      },
    };

    const t = themeStyles[theme];

    return (
      <div
        ref={ref}
        id="stagepass-ticket-stub"
        className={`relative w-[670px] min-h-[310px] rounded-2xl border flex select-none overflow-hidden transition-all duration-300 ${t.container}`}
        style={{ fontFamily: theme === "vintage" ? "Georgia, serif" : "inherit" }}
      >
        {/* =========================================================
            1. LEFT STUB SECTION (Admit One & Serial)
           ========================================================= */}
        <div
          className={`w-[185px] p-4 flex flex-col justify-between relative border-r ${t.stubBg}`}
        >
          {/* Top Brand & Serial */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`text-[9px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border ${t.badgeBg}`}
              >
                STAGEPASS
              </span>
              <span className={`text-[10px] font-mono font-bold ${t.mutedText}`}>
                {serializedCode}
              </span>
            </div>

            <div className="pt-2">
              <div
                className={`text-[9px] font-bold uppercase tracking-wider ${t.secondaryText}`}
              >
                ADMISSION
              </div>
              <div className="text-sm font-extrabold tracking-tight uppercase leading-tight">
                ADMIT ONE
              </div>
              <div className={`text-[10px] ${t.secondaryText} truncate`}>
                {effectiveVenueName}
              </div>
            </div>
          </div>

          {/* Date Big Stamp */}
          <div className={`my-3 p-2.5 rounded-xl border text-center ${t.boxBg}`}>
            <div
              className={`text-[10px] font-black tracking-widest uppercase ${t.accentText}`}
            >
              {dateParts.month}
            </div>
            <div className="text-2xl font-black leading-none my-0.5">
              {dateParts.day}
            </div>
            <div className={`text-[10px] font-bold ${t.secondaryText}`}>
              {dateParts.year}
            </div>
          </div>

          {/* Bottom Stub Info */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className={t.mutedText}>SEC: {section}</span>
              <span className={t.mutedText}>ROW: {row}</span>
              <span className={t.mutedText}>SEAT: {seat}</span>
            </div>

            <div
              className={`text-[8px] uppercase tracking-wider font-semibold text-center py-1 rounded bg-black/30 border border-white/5 ${t.secondaryText}`}
            >
              {isEssential ? "★ DEFINITIVE EDITION ★" : "★ OFFICIAL SOUVENIR ★"}
            </div>
          </div>
        </div>

        {/* =========================================================
            2. PERFORATED DIVIDER WITH CIRCULAR PUNCH-HOLE NOTCHES
           ========================================================= */}
        <div className="relative w-0 flex flex-col items-center justify-between z-10">
          {/* Top Semicircular Notch */}
          <div
            className={`absolute -top-3.5 -translate-x-1/2 w-6 h-6 rounded-full ${t.notchColor} border border-neutral-800 shadow-inner`}
          />

          {/* Vertical Perforated Dashed Line */}
          <div className={`h-full border-l-2 border-dashed ${t.dividerBorder}`} />

          {/* Bottom Semicircular Notch */}
          <div
            className={`absolute -bottom-3.5 -translate-x-1/2 w-6 h-6 rounded-full ${t.notchColor} border border-neutral-800 shadow-inner`}
          />
        </div>

        {/* =========================================================
            3. MAIN TICKET BODY
           ========================================================= */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          {/* Header Row: Live Badge & City */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${t.badgeBg}`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{isEssential ? "DEFINITIVE COLLECTION" : "CONCERT PASSPORT"}</span>
                </span>
                {effectiveTourName && (
                  <span
                    className={`text-[11px] font-semibold truncate max-w-[200px] ${t.secondaryText}`}
                  >
                    • {effectiveTourName}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] font-bold tracking-tight uppercase ${t.accentText}`}
              >
                {effectiveCityName}
                {countryName && !isEssential ? `, ${countryName}` : ""}
              </span>
            </div>

            {/* Headlining Artist */}
            <h1
              className={`text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight truncate ${
                theme === "cyber"
                  ? "bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent"
                  : ""
              }`}
            >
              {artistName}
            </h1>

            {/* Venue & Time Stamp */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="truncate">{effectiveVenueName}</span>
              <span className={t.mutedText}>•</span>
              <span className={t.secondaryText}>{dateParts.full}</span>
            </div>
          </div>

          {/* Vanity Seating Grid */}
          <div className="grid grid-cols-4 gap-2 my-2">
            <div className={`p-1.5 rounded-lg border text-center ${t.boxBg}`}>
              <div className={`text-[9px] font-bold uppercase tracking-wider ${t.mutedText}`}>
                SECTION
              </div>
              <div className="text-xs font-black truncate">{section}</div>
            </div>

            <div className={`p-1.5 rounded-lg border text-center ${t.boxBg}`}>
              <div className={`text-[9px] font-bold uppercase tracking-wider ${t.mutedText}`}>
                ROW
              </div>
              <div className="text-xs font-black truncate">{row}</div>
            </div>

            <div className={`p-1.5 rounded-lg border text-center ${t.boxBg}`}>
              <div className={`text-[9px] font-bold uppercase tracking-wider ${t.mutedText}`}>
                SEAT
              </div>
              <div className="text-xs font-black truncate">{seat}</div>
            </div>

            <div className={`p-1.5 rounded-lg border text-center ${t.boxBg}`}>
              <div className={`text-[9px] font-bold uppercase tracking-wider ${t.mutedText}`}>
                ENTRY
              </div>
              <div className={`text-xs font-black truncate ${t.accentText}`}>
                {isEssential ? "STUDIO" : "GATE A"}
              </div>
            </div>
          </div>

          {/* Setlist Preview Excerpt (2 columns) */}
          {previewTracks.length > 0 && (
            <div className={`p-2 rounded-xl border ${t.boxBg}`}>
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/5">
                <div className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${t.accentText}`}>
                  <Music2 className="w-2.5 h-2.5" />
                  <span>{isEssential ? "ESSENTIAL HITS SELECTION" : "SETLIST SELECTIONS"}</span>
                </div>
                {extraTracksCount > 0 && (
                  <span className={`text-[9px] font-semibold ${t.secondaryText}`}>
                    +{extraTracksCount} more tracks
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                {previewTracks.map((track, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 truncate leading-tight"
                  >
                    <span className={`font-mono text-[9px] ${t.mutedText}`}>
                      {i + 1}.
                    </span>
                    <span className="font-semibold truncate">
                      {track.name}
                    </span>
                    {track.isEncore && (
                      <span className="text-[8px] font-bold text-emerald-400">
                        (E)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Barcode & Spotify Stamp */}
          <div className="pt-2 flex items-end justify-between gap-4">
            <div className="flex-1 max-w-[220px]">
              <BarcodeSVG code={serializedCode} color={t.barcodeColor} />
            </div>

            {/* Spotify & StagePass Official Badge */}
            <div className="text-right space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold">
                {/* Spotify Icon */}
                <svg
                  className="w-3.5 h-3.5 fill-[#1DB954]"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
                </svg>
                <span>Spotify Playlist Generated</span>
              </div>
              <div className={`text-[9px] font-medium ${t.secondaryText}`}>
                {isEssential
                  ? "StagePass Digital Stub • Studio Anthology"
                  : "StagePass Digital Stub • Verified Setlist"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TicketStub.displayName = "TicketStub";
