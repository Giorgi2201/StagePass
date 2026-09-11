"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useWizard } from "@/context/WizardContext";
import type { NormalizedShow } from "@/types/setlist";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Music2,
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { lightTap } from "@/lib/haptics";

export function StepShows() {
  const {
    mode,
    setMode,
    selectedArtist,
    selectShow,
    generateRehearsalSetlist,
    generateEssentialHits,
    isLoadingParse,
    goBack,
    errorMessage,
  } = useWizard();

  const [shows, setShows] = useState<NormalizedShow[]>([]);
  const [isLoadingShows, setIsLoadingShows] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedArtist) return;

    let ignore = false;
    async function fetchShows() {
      setIsLoadingShows(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `/api/setlist/shows?mbid=${encodeURIComponent(selectedArtist!.id)}&p=1`
        );
        if (!res.ok) {
          throw new Error("Failed to retrieve shows from Setlist.fm");
        }
        const data: NormalizedShow[] = await res.json();
        if (!ignore) {
          setShows(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error fetching shows:", err);
          setFetchError(
            err instanceof Error ? err.message : "Failed to load shows"
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingShows(false);
        }
      }
    }

    fetchShows();

    return () => {
      ignore = true;
    };
  }, [selectedArtist]);

  if (!selectedArtist) {
    return null;
  }

  // Format date string "DD-MM-YYYY" into display parts (e.g. Month "DEC", Day "18", Year "2025")
  const formatDateBadge = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const year = parts[2];
      const monthNames = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
      ];
      const month = monthNames[monthNum - 1] || "CON";
      return { month, day, year };
    }
    return { month: "LIVE", day: "", year: dateStr };
  };

  const analyzedShows = shows.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Selected Artist Header & Back Navigation */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
        {/* Subtle Back Button */}
        <button
          type="button"
          onClick={() => {
            lightTap();
            goBack();
          }}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
          title="Back to artist search"
          aria-label="Back to artist search"
        >
          <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
        </button>

        {/* Circular Spotify Artist Portrait */}
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 shadow-md bg-neutral-900 flex items-center justify-center">
          {selectedArtist.imageUrl ? (
            <Image
              src={selectedArtist.imageUrl}
              alt={selectedArtist.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-zinc-300" />
            </div>
          )}
        </div>

        {/* Artist Name & Step Subtitle Stack */}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight truncate">
            {selectedArtist.name}
          </h1>
          <p className="text-xs text-neutral-400 font-medium truncate mt-0.5">
            Step 2 of 4 • Choose Experience Mode & Tour
          </p>
        </div>
      </div>

      {/* 2. Experience Mode Switcher (Pill Tray) */}
      <div className="bg-white/5 border border-white/10 rounded-full p-1 max-w-lg w-full mx-auto flex items-center justify-between mb-6 select-none">
        <button
          type="button"
          onClick={() => {
            lightTap();
            setMode("rehearsal");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            mode === "rehearsal"
              ? "bg-white/15 text-white shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
          <span className="truncate">Pre-Concert Rehearsal</span>
        </button>

        <button
          type="button"
          onClick={() => {
            lightTap();
            setMode("memory");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            mode === "memory"
              ? "bg-white/15 text-white shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0 text-sky-400" />
          <span className="truncate">Post-Concert Memory</span>
        </button>
      </div>

      {/* Error Notices */}
      {(errorMessage || fetchError) && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Unable to proceed</div>
            <p className="mt-0.5 text-red-300">
              {errorMessage || fetchError}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================
          ZERO-SETLIST FALLBACK CARD (ESSENTIAL HITS ALTERNATIVE)
         ========================================================= */}
      {!isLoadingShows && shows.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-[#222222] via-[#181818] to-[#121212] border border-neutral-800 shadow-2xl text-center space-y-6 max-w-2xl mx-auto">
          {/* Artist Circular Avatar */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-[#1DB954]/40 shadow-xl bg-neutral-900 flex items-center justify-center">
            {selectedArtist.imageUrl ? (
              <Image
                src={selectedArtist.imageUrl}
                alt={selectedArtist.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-neutral-800 to-neutral-700 flex items-center justify-center">
                <Music2 className="w-10 h-10 text-zinc-300" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio Essential Collection</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              No Live Concert Setlists Recorded
            </h2>
            <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed max-w-md mx-auto">
              Setlist.fm doesn&apos;t have live tour data for{" "}
              <span className="font-semibold text-white">
                {selectedArtist.name}
              </span>{" "}
              yet. But you can still build their definitive Essential Hits
              playlist on Spotify.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => generateEssentialHits()}
              disabled={isLoadingParse}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoadingParse ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Curating Essential Hits...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Essential Hits Playlist (Top 20 Tracks)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goBack}
              disabled={isLoadingParse}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-zinc-300 hover:text-white font-semibold text-sm transition-all cursor-pointer"
            >
              Search Another Artist
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* =========================================================
              3. DYNAMIC SUB-VIEW 1: PRE-CONCERT REHEARSAL MODE (Reference Picture 2)
             ========================================================= */}
          {mode === "rehearsal" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Consensus Description Banner */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Predictive Tour Consensus Engine</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Predict the Rehearsal Setlist
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  StagePass analyzes the {shows.length > 0 ? Math.min(shows.length, 5) : 5} most recent completed tour stops by{" "}
                  <span className="font-semibold text-white">{selectedArtist.name}</span>, cross-referencing songs played across all nights to predict the consensus setlist in concert order.
                </p>
              </div>

              {/* Analyzed Shows Chips Grid (Picture 2 Inspired) */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  SHOWS BEING ANALYZED FOR CONSENSUS ({isLoadingShows ? "..." : analyzedShows.length}):
                </div>

                {isLoadingShows ? (
                  <div className="flex flex-wrap gap-2.5 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-10 w-52 rounded-xl bg-white/[0.03] border border-white/5" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {analyzedShows.map((show) => (
                      <div
                        key={show.id}
                        className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#1c1c1c] border border-white/10 hover:border-white/20 transition-colors shadow-sm select-none"
                      >
                        <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="font-bold text-white text-sm leading-none">
                          {show.cityName}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono leading-none">
                          ({show.eventDate})
                        </span>
                        <span className="text-xs text-neutral-400 font-medium leading-none ml-0.5">
                          {show.songCount} songs
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Generator Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    lightTap();
                    generateRehearsalSetlist();
                  }}
                  disabled={isLoadingParse || isLoadingShows}
                  className="w-full sm:max-w-lg mx-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] disabled:opacity-60 text-black font-bold text-sm sm:text-base transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoadingParse ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Calculating Tour Consensus...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      <span>Generate Tour Rehearsal Setlist</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              4. DYNAMIC SUB-VIEW 2: POST-CONCERT MEMORY MODE (Reference Picture 3)
             ========================================================= */}
          {mode === "memory" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  SELECT TOUR DATE
                </div>
                {isLoadingParse && (
                  <span className="text-xs text-[#1DB954] flex items-center gap-1.5 font-medium animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading concert setlist...
                  </span>
                )}
              </div>

              {/* Shows Loading Skeletons */}
              {isLoadingShows && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex items-center gap-4 animate-pulse"
                    >
                      <div className="w-14 h-16 rounded-xl bg-white/10 shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="h-4 w-3/4 bg-white/10 rounded" />
                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                        <div className="h-3 w-1/3 bg-white/5 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Concert Dates Grid (Picture 3 Inspired) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {shows.map((show) => {
                  const dateParts = formatDateBadge(show.eventDate);
                  return (
                    <button
                      key={show.id}
                      type="button"
                      onClick={() => {
                        lightTap();
                        selectShow(show);
                      }}
                      disabled={isLoadingParse}
                      className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 active:scale-[0.98] transition-all text-left shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {/* Stylized Date Badge (flips to Spotify green on card hover) */}
                      <div className="w-14 h-16 rounded-xl bg-white/[0.06] group-hover:bg-[#1DB954] border border-white/10 group-hover:border-[#1DB954] flex flex-col items-center justify-center shrink-0 transition-all shadow-sm">
                        <span className="text-[10px] font-bold text-neutral-400 group-hover:text-black uppercase leading-tight transition-colors">
                          {dateParts.month}
                        </span>
                        <span className="text-xl font-extrabold text-white group-hover:text-black leading-none my-0.5 transition-colors">
                          {dateParts.day}
                        </span>
                        <span className="text-[9px] text-neutral-500 group-hover:text-black/80 leading-tight transition-colors font-mono">
                          {dateParts.year}
                        </span>
                      </div>

                      {/* Center/Right Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-bold text-base text-white truncate group-hover:text-[#1DB954] transition-colors">
                          {show.venueName}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
                          <span className="truncate">
                            {show.cityName}
                            {show.countryName ? `, ${show.countryName}` : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          {show.tourName && (
                            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium text-neutral-300 truncate max-w-[180px]">
                              {show.tourName}
                            </span>
                          )}
                          <span className="text-xs font-medium text-[#1DB954]">
                            {show.songCount} songs
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
