"use client";

import React, { useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { useAuth } from "@/context/AuthContext";
import { TicketModal } from "@/components/ticket/TicketModal";
import { saveTicketStub, getDefaultTicketTheme } from "@/lib/storage";
import {
  ChevronLeft,
  Music2,
  Lock,
  Globe,
  Check,
  Plus,
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  Ticket,
} from "lucide-react";
import { mediumTap } from "@/lib/haptics";

export function StepReview() {
  const {
    mode,
    parseResult,
    selectedArtist,
    selectedShow,
    excludedTrackIndices,
    toggleTrack,
    playlistTitle,
    setPlaylistTitle,
    isPublic,
    setIsPublic,
    createPlaylist,
    isGenerating,
    goBack,
    errorMessage,
    savePendingWizardState,
  } = useWizard();

  const { isAuthenticated, login } = useAuth();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  if (!parseResult) {
    return null;
  }

  const activeTracksCount =
    parseResult.tracks.length - excludedTrackIndices.size;

  const handleCreatePlaylistClick = () => {
    mediumTap();
    if (!isAuthenticated) {
      savePendingWizardState();
      login();
      return;
    }
    createPlaylist();
  };

  const handleOpenTicketStub = () => {
    mediumTap();
    if (!parseResult) return;

    try {
      const isEssential = parseResult.mode === "essential";
      const activeTracks = parseResult.tracks.filter(
        (_, index) => !excludedTrackIndices.has(index)
      );

      saveTicketStub({
        artistName: selectedArtist?.name || parseResult.artistName || "Concert Artist",
        artistImageUrl: selectedArtist?.imageUrl || null,
        tourName:
          parseResult.tourName ||
          selectedShow?.tourName ||
          (isEssential ? "Essential Hits & Fan Favorites" : "Concert Tour"),
        venueName: isEssential
          ? "STUDIO DISCOGRAPHY"
          : selectedShow?.venueName || parseResult.venueInfo || "Main Stage Arena",
        cityName: isEssential
          ? "GLOBAL ESSENTIALS"
          : selectedShow?.cityName || "Global Tour",
        eventDate: isEssential
          ? "STUDIO 2026"
          : selectedShow?.eventDate || "LIVE 2026",
        mode: parseResult.mode || "rehearsal",
        tracks: activeTracks.length > 0 ? activeTracks : parseResult.tracks,
        playlistUrl: "",
        playlistId: `stub_${Date.now()}`,
        theme: getDefaultTicketTheme(),
      });
    } catch (err) {
      console.error("Error saving ticket stub:", err);
    }

    setIsTicketModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header with Circular Spotify Back Button & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-zinc-300 hover:text-white flex items-center justify-center border border-neutral-800 hover:border-neutral-700 transition-all active:scale-[0.95] shrink-0"
            title="Back to tour selection"
          >
            <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1DB954]">
                Step 3 of 4: Review Setlist
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  parseResult.mode === "essential"
                    ? "bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954]"
                    : "bg-neutral-800 text-zinc-300"
                }`}
              >
                {parseResult.mode === "essential"
                  ? "Essential Hits Collection"
                  : mode === "rehearsal"
                  ? "Rehearsal Mode"
                  : "Memory Mode"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {parseResult.artistName}
            </h1>
          </div>
        </div>

        {/* Venue / Tour Meta */}
        <div className="text-left sm:text-right space-y-0.5">
          <div className="text-xs sm:text-sm font-semibold text-zinc-300 truncate max-w-xs">
            {parseResult.venueInfo}
          </div>
          {parseResult.tourName && (
            <div className="text-[11px] text-[#B3B3B3] truncate max-w-xs">
              {parseResult.tourName}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Playlist Customization Bar (Editable Title & Privacy) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#181818] border border-neutral-800/80 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Playlist Metadata
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={playlistTitle}
            onChange={(e) => setPlaylistTitle(e.target.value)}
            placeholder="Enter playlist name..."
            className="flex-1 h-11 px-4 rounded-xl bg-[#242424] border border-neutral-700/60 text-white placeholder:text-[#B3B3B3] text-sm font-medium focus:border-white/40 outline-none transition-all"
          />

          <div className="flex items-center gap-2.5">
            {/* Privacy Toggle Pill (Exact h-11 height matching Create button) */}
            <div className="h-11 p-1 rounded-xl bg-[#242424] border border-neutral-700/60 flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`h-full px-3.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !isPublic
                    ? "bg-[#1DB954] text-black font-bold shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`h-full px-3.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isPublic
                    ? "bg-[#1DB954] text-black font-bold shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public</span>
              </button>
            </div>

            {/* Quick-Action Create Button in Top Header */}
            <button
              type="button"
              onClick={handleCreatePlaylistClick}
              disabled={isGenerating || activeTracksCount === 0}
              className="flex-1 sm:flex-initial h-11 px-4 sm:px-5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#1DB954]/20 active:scale-[0.97] transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              title={
                isAuthenticated
                  ? `Create playlist with ${activeTracksCount} tracks`
                  : `Connect Spotify to create playlist with ${activeTracksCount} tracks`
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 fill-black shrink-0"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
                  </svg>
                  <span>{isAuthenticated ? "Create" : "Connect"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Spotify Playlist Tracklist Table */}
      <div className="rounded-2xl bg-[#181818] border border-neutral-800/80 overflow-hidden shadow-xl">
        {/* Table Header Row */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-neutral-800/80 text-[11px] font-bold uppercase tracking-wider text-[#B3B3B3]">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-7 sm:col-span-6">Title</div>
          <div className="hidden sm:block sm:col-span-4">
            {parseResult.mode === "essential"
              ? "Popularity"
              : mode === "rehearsal"
              ? "Likelihood"
              : "Set / Encore"}
          </div>
          <div className="col-span-4 sm:col-span-1 text-right sm:text-center">
            Include
          </div>
        </div>

        {/* Track Rows */}
        <div className="divide-y divide-neutral-800/40">
          {parseResult.tracks.map((track, index) => {
            const isExcluded = excludedTrackIndices.has(index);

            return (
              <div
                key={index}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs sm:text-sm transition-colors ${
                  isExcluded
                    ? "bg-[#141414] opacity-40 hover:opacity-75"
                    : "hover:bg-[#242424]"
                }`}
              >
                {/* Track Number */}
                <div className="col-span-1 text-center font-mono text-zinc-400 text-xs">
                  {index + 1}
                </div>

                {/* Song Title & Tags */}
                <div className="col-span-7 sm:col-span-6 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-bold leading-snug break-words ${
                        isExcluded ? "line-through text-zinc-400" : "text-white"
                      }`}
                    >
                      {track.name}
                    </span>

                    {track.isCover && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/50 text-[10px] font-medium text-purple-300 shrink-0">
                        <Music2 className="w-2.5 h-2.5" />
                        Cover: {track.originalArtist || "Cover"}
                      </span>
                    )}

                    {mode === "rehearsal" && track.isEncore && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-[10px] font-semibold text-emerald-400 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        Encore
                      </span>
                    )}

                    {mode === "memory" && track.isEncore && (
                      <span className="inline-flex sm:hidden items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-[10px] font-semibold text-emerald-400 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        Encore
                      </span>
                    )}
                  </div>

                  {track.info && (
                    <div className="text-[11px] text-zinc-500 italic mt-0.5 truncate">
                      {track.info}
                    </div>
                  )}

                  {/* Mobile-only metric badge since column is hidden on mobile */}
                  {parseResult.mode === "essential" && track.confidenceScore !== undefined && (
                    <div className="mt-1 sm:hidden">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[10px] font-semibold text-[#1DB954]">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {track.confidenceScore}% popular
                      </span>
                    </div>
                  )}

                  {mode === "rehearsal" && parseResult.mode !== "essential" && track.confidenceScore !== undefined && (
                    <div className="mt-1 sm:hidden">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-semibold text-[#1DB954]">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {track.confidenceScore}% likely
                      </span>
                    </div>
                  )}
                </div>

                {/* Likelihood / Details / Popularity Column */}
                <div className="hidden sm:flex sm:col-span-4 items-center">
                  {parseResult.mode === "essential" ? (
                    track.confidenceScore !== undefined && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[10px] font-semibold text-[#1DB954]">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {track.confidenceScore}% popular
                      </span>
                    )
                  ) : mode === "rehearsal" ? (
                    track.confidenceScore !== undefined && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-semibold text-[#1DB954]">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {track.confidenceScore}% likely
                      </span>
                    )
                  ) : (
                    // Memory Mode: Set / Encore
                    track.isEncore ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-[10px] font-semibold text-emerald-400">
                        <Sparkles className="w-2.5 h-2.5" />
                        Encore
                      </span>
                    ) : track.setNumber ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-medium text-zinc-400">
                        Set {track.setNumber}
                      </span>
                    ) : null
                  )}
                </div>

                {/* Include / Exclude Checkbox Button */}
                <div className="col-span-4 sm:col-span-1 flex justify-end sm:justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      mediumTap();
                      toggleTrack(index);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      !isExcluded
                        ? "bg-[#1DB954] text-black hover:bg-[#1ed760] shadow"
                        : "bg-[#282828] text-zinc-400 hover:bg-[#333333] hover:text-white"
                    }`}
                    title={isExcluded ? "Include in playlist" : "Exclude from playlist"}
                  >
                    {!isExcluded ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary & Secondary Action Section: Inline at the end of the setlist */}
      <div className="mt-8 flex flex-col items-center justify-center text-center space-y-3">
        {/* Track selection summary counter */}
        <div className="flex items-center gap-2 text-xs text-[#B3B3B3]">
          <span>{activeTracksCount} of {parseResult.tracks.length} tracks selected</span>
          <span>•</span>
          <span>Est. playlist duration: ~{activeTracksCount * 4} min</span>
        </div>

        {/* Action Buttons Container */}
        <div className="w-full max-w-md flex flex-col items-stretch gap-2.5">
          {/* Prominent Spotify Button */}
          <button
            type="button"
            onClick={handleCreatePlaylistClick}
            disabled={isGenerating || activeTracksCount === 0}
            className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-base shadow-xl shadow-[#1DB954]/25 hover:shadow-[#1DB954]/40 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Building Spotify Playlist...</span>
              </>
            ) : (
              <>
                {/* Official Spotify Icon SVG */}
                <svg
                  className="w-5 h-5 fill-black shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
                </svg>
                <span>
                  {isAuthenticated
                    ? `Create Spotify Playlist (${activeTracksCount} tracks)`
                    : `Connect Spotify & Save Playlist (${activeTracksCount} tracks)`}
                </span>
              </>
            )}
          </button>

          {/* Prominent Secondary Action Button: Customize & Download Ticket Stub */}
          <button
            type="button"
            onClick={handleOpenTicketStub}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/15 hover:border-white/25 text-white font-bold text-sm sm:text-base shadow-lg backdrop-blur-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <Ticket className="w-5 h-5 text-[#1DB954] shrink-0" />
            <span>Customize & Download Ticket Stub</span>
          </button>
        </div>

        {/* Subtle helper line with calibrated bottom margin */}
        <p className="text-xs text-zinc-500 font-medium mb-5">
          {isAuthenticated
            ? "Playlist will be saved directly to your Spotify library"
            : "Free instant ticket stubs • Connect Spotify anytime to sync playlists"}
        </p>
      </div>

      {/* Ticket Modal instance when previewing/customizing stub */}
      {isTicketModalOpen && (
        <TicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          artistName={selectedArtist?.name || parseResult.artistName || "Concert Artist"}
          tourName={
            parseResult.tourName ||
            selectedShow?.tourName ||
            (parseResult.mode === "essential" ? "Essential Hits & Fan Favorites" : undefined)
          }
          venueName={
            parseResult.mode === "essential"
              ? "STUDIO DISCOGRAPHY"
              : selectedShow?.venueName || parseResult.venueInfo || "Main Stage Arena"
          }
          cityName={
            parseResult.mode === "essential"
              ? "GLOBAL ESSENTIALS"
              : selectedShow?.cityName || "Global Tour"
          }
          countryName={parseResult.mode === "essential" ? undefined : selectedShow?.countryName}
          eventDate={
            parseResult.mode === "essential"
              ? "STUDIO 2026"
              : selectedShow?.eventDate || "LIVE 2026"
          }
          tracks={
            parseResult.tracks.filter((_, index) => !excludedTrackIndices.has(index)).length > 0
              ? parseResult.tracks.filter((_, index) => !excludedTrackIndices.has(index))
              : parseResult.tracks
          }
          playlistUrl=""
          mode={parseResult.mode}
        />
      )}
    </div>
  );
}
