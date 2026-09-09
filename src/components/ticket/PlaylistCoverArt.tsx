import React from "react";
import { Ticket, Sparkles, Disc, Music2 } from "lucide-react";

export interface PlaylistCoverArtProps {
  artistName: string;
  artistImageUrl: string | null;
  tourName: string;
  venueName: string;
  cityName: string;
  eventDate: string;
  trackCount: number;
  id?: string;
  className?: string;
}

/**
 * 640x640 Square Tour Poster Canvas Component
 * Engineered specifically for Spotify's 1:1 playlist cover format (640x640 px).
 * Renders an official tour archive aesthetic with high-contrast typography,
 * ambient stage lighting, circular artist portrait, and vinyl sleeve detailing.
 */
export function PlaylistCoverArt({
  artistName,
  artistImageUrl,
  tourName,
  venueName,
  cityName,
  eventDate,
  trackCount,
  id = "playlist-cover-art",
  className = "",
}: PlaylistCoverArtProps) {
  // Format concert date cleanly for poster stamp
  const formattedDate = eventDate.toUpperCase();

  return (
    <div
      id={id}
      data-testid="playlist-cover-art"
      className={`w-[640px] h-[640px] aspect-square overflow-hidden relative select-none bg-gradient-to-b from-[#181818] via-[#101010] to-[#0a0a0a] text-white flex flex-col justify-between p-8 font-sans ${className}`}
      style={{ width: "640px", height: "640px", minWidth: "640px", minHeight: "640px" }}
    >
      {/* =========================================================
          AMBIENT STAGE LIGHTING & VINYL GROOVES (BACKGROUND)
         ========================================================= */}
      {/* Ambient Spotify Green Radial Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1DB954]/12 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      {/* Deep Secondary Charcoal Ambient Light */}
      <div
        className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-950/20 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Collectible Vinyl Outer Hairline Border */}
      <div
        className="absolute inset-4 rounded-3xl border border-white/[0.08] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-5 rounded-[22px] border border-white/[0.03] pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Vinyl Concentric Arcs */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full border border-white/[0.03] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full border border-white/[0.03] pointer-events-none"
        aria-hidden="true"
      />

      {/* Lithograph Corner Registration Marks */}
      <span className="absolute top-6 left-6 text-[10px] text-white/20 font-mono select-none" aria-hidden="true">+</span>
      <span className="absolute top-6 right-6 text-[10px] text-white/20 font-mono select-none" aria-hidden="true">+</span>
      <span className="absolute bottom-6 left-6 text-[10px] text-white/20 font-mono select-none" aria-hidden="true">+</span>
      <span className="absolute bottom-6 right-6 text-[10px] text-white/20 font-mono select-none" aria-hidden="true">+</span>

      {/* =========================================================
          1. TOP HEADER: VIP ARCHIVE BADGE & DATE
         ========================================================= */}
      <div className="relative z-10 flex items-center justify-between px-2 pt-1">
        {/* Subtle VIP Archive Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#1DB954] ring-2 ring-[#1DB954]/30" />
          <span className="text-[11px] font-extrabold tracking-[0.22em] text-neutral-300 uppercase">
            StagePass Tour Archive
          </span>
        </div>

        {/* Concert Date Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
          <span className="text-[11px] font-bold tracking-widest text-neutral-300">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* =========================================================
          2. CENTER HERO AREA: PORTRAIT, ARTIST NAME, TOUR BADGE
         ========================================================= */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto px-4">
        {/* Circular Artist Portrait */}
        <div className="relative mb-2">
          <div className="w-48 h-48 rounded-full overflow-hidden ring-2 ring-[#1DB954]/40 shadow-2xl bg-neutral-900 flex items-center justify-center relative">
            {artistImageUrl ? (
              <img
                src={artistImageUrl}
                alt={artistName}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
                <Music2 className="w-16 h-16 text-[#1DB954]/60 mb-1" />
                <span className="text-[10px] tracking-widest text-neutral-400 font-bold uppercase">
                  StagePass
                </span>
              </div>
            )}
          </div>
          {/* Subtle Vinyl Disc Accent Badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-neutral-950 border border-white/15 flex items-center justify-center shadow-lg">
            <Disc className="w-4 h-4 text-[#1DB954]" />
          </div>
        </div>

        {/* Headlining Artist Name */}
        <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-white max-w-[500px] truncate leading-tight drop-shadow-sm">
          {artistName}
        </h1>

        {/* Elevated Frosted Tour Name Badge */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md shadow-lg max-w-[460px]">
          <Sparkles className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
          <span className="text-xs font-semibold tracking-wide text-neutral-200 truncate uppercase">
            {tourName}
          </span>
        </div>

        {/* Venue & City Stamp */}
        <p className="text-neutral-300 text-sm font-medium tracking-wide mt-2.5 max-w-[480px] truncate">
          {venueName}{venueName && cityName ? " • " : ""}{cityName}
        </p>
      </div>

      {/* =========================================================
          3. BOTTOM FOOTER: STAGEPASS LOGO & OFFICIAL SPEC STAMP
         ========================================================= */}
      <div className="relative z-10 flex items-center justify-between px-2 pb-1 border-t border-white/[0.07] pt-4">
        {/* Minimalist StagePass Backstage Brand Mark */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center">
            <Ticket className="w-3.5 h-3.5 text-[#1DB954]" />
          </div>
          <span className="text-xs font-black tracking-[0.25em] text-white uppercase">
            StagePass
          </span>
        </div>

        {/* Official Setlist Spec Stamp */}
        <div className="text-[10px] font-bold tracking-[0.18em] text-neutral-400 uppercase">
          Official Concert Setlist • {trackCount} {trackCount === 1 ? "Track" : "Tracks"}
        </div>
      </div>
    </div>
  );
}
