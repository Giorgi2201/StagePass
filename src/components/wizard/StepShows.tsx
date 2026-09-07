"use client";

import React, { useEffect, useState } from "react";
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

export function StepShows() {
  const {
    mode,
    selectedArtist,
    selectShow,
    generateRehearsalSetlist,
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

  // Format date string "DD-MM-YYYY" into display parts (e.g. Month "OCT", Day "24", Year "2024")
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header with Circular Spotify Back Button & Artist Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          {/* Spotify Circular Back Button */}
          <button
            type="button"
            onClick={goBack}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-zinc-300 hover:text-white flex items-center justify-center border border-neutral-800 hover:border-neutral-700 transition-all active:scale-[0.95]"
            title="Go back to search"
          >
            <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
          </button>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1DB954]">
              {mode === "rehearsal" ? "Tour Consensus" : "Select Concert Date"}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {selectedArtist.name}
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#242424] text-xs text-zinc-300 border border-neutral-800">
          <Music2 className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>{selectedArtist.disambiguation || "Verified Artist"}</span>
        </div>
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
          REHEARSAL MODE VIEW
         ========================================================= */}
      {mode === "rehearsal" && (
        <div className="space-y-6">
          {/* Hero Action Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#1f1f1f] to-[#141414] border border-neutral-800 shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pre-Concert Predictive Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Predict the Rehearsal Setlist
              </h2>
              <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed max-w-xl">
                StagePass will analyze the {shows.length > 0 ? Math.min(shows.length, 5) : 5} most recent tour shows performed by {selectedArtist.name}, cross-referencing songs played across all nights to predict the consensus tracklist in emotional concert order.
              </p>
            </div>

            {/* Main Generate Button */}
            <div>
              <button
                type="button"
                onClick={() => generateRehearsalSetlist()}
                disabled={isLoadingParse}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-sm sm:text-base shadow-lg shadow-[#1DB954]/25 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
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

          {/* Sample Shows Chips */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Shows being analyzed for consensus ({Math.min(shows.length, 5)}):
            </div>

            {isLoadingShows ? (
              <div className="flex flex-wrap gap-2 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-44 rounded-full bg-[#242424]" />
                ))}
              </div>
            ) : shows.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {shows.slice(0, 5).map((show) => (
                  <div
                    key={show.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#242424] border border-neutral-800 text-xs text-zinc-300"
                  >
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-semibold text-white">{show.cityName}</span>
                    <span className="text-zinc-500">({show.eventDate})</span>
                    <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] text-zinc-400">
                      {show.songCount} songs
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#B3B3B3]">
                No recorded shows found for this artist to analyze.
              </p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MEMORY MODE VIEW (SHOWS LIST)
         ========================================================= */}
      {mode === "memory" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Select Tour Date
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-[#181818] border border-neutral-800/80 p-4 flex items-center gap-4 animate-pulse"
                >
                  <div className="w-12 h-14 rounded-lg bg-[#282828] shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-[#282828] rounded" />
                    <div className="h-3 w-1/2 bg-[#282828]/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty Shows */}
          {!isLoadingShows && shows.length === 0 && (
            <div className="p-8 rounded-xl bg-[#181818] border border-neutral-800 text-center space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-zinc-600" />
              <div className="font-semibold text-white">No recorded shows found</div>
              <p className="text-xs text-[#B3B3B3]">
                Setlist.fm has no setlist records available for {selectedArtist.name}.
              </p>
            </div>
          )}

          {/* Shows Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shows.map((show) => {
              const dateParts = formatDateBadge(show.eventDate);
              return (
                <button
                  key={show.id}
                  type="button"
                  onClick={() => selectShow(show)}
                  disabled={isLoadingParse}
                  className="group relative flex items-start gap-4 p-4 rounded-xl bg-[#181818] hover:bg-[#242424] border border-neutral-800/80 hover:border-neutral-700 active:scale-[0.98] transition-all text-left shadow-md disabled:opacity-50"
                >
                  {/* Stylized Date Badge */}
                  <div className="w-13 h-14 rounded-xl bg-[#282828] group-hover:bg-[#1DB954] border border-neutral-700/60 group-hover:border-[#1DB954] flex flex-col items-center justify-center shrink-0 transition-colors shadow">
                    <span className="text-[10px] font-bold text-zinc-400 group-hover:text-black uppercase leading-tight transition-colors">
                      {dateParts.month}
                    </span>
                    <span className="text-lg font-extrabold text-white group-hover:text-black leading-none transition-colors">
                      {dateParts.day}
                    </span>
                    <span className="text-[9px] text-zinc-500 group-hover:text-black/80 leading-tight transition-colors">
                      {dateParts.year}
                    </span>
                  </div>

                  {/* Show Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="font-bold text-sm sm:text-base text-white truncate group-hover:text-[#1DB954] transition-colors">
                      {show.venueName}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#B3B3B3] truncate">
                      <MapPin className="w-3 h-3 shrink-0 text-zinc-500" />
                      <span className="truncate">
                        {show.cityName}
                        {show.countryName ? `, ${show.countryName}` : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {show.tourName && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] font-medium text-zinc-300 truncate max-w-[180px]">
                          {show.tourName}
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-400 font-semibold">
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
    </div>
  );
}
