"use client";

import React, { useEffect, useState } from "react";
import { useWizard } from "@/context/WizardContext";
import { useAuth } from "@/context/AuthContext";
import { TicketModal } from "@/components/ticket/TicketModal";
import { saveTicketStub, getDefaultTicketTheme } from "@/lib/storage";
import {
  ChevronLeft,
  Music2,
  Check,
  Plus,
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  Ticket,
  Play,
  Pause,
} from "lucide-react";
import { useAudio } from "@/context/AudioContext";
import { mediumTap } from "@/lib/haptics";
import { SpotifyPrivacyModal } from "@/components/modals/SpotifyPrivacyModal";
import { PlaylistCoverArt } from "@/components/ticket/PlaylistCoverArt";
import { exportPlaylistCover } from "@/lib/cover-export";

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
    createYouTubePlaylist,
    isGenerating,
    goBack,
    errorMessage,
    savePendingWizardState,
    coverDataUrl,
    setCoverDataUrl,
  } = useWizard();

  const { isAuthenticated, login } = useAuth();
  const {
    activeTrack,
    isPlaying,
    isLoadingAudio,
    toggleTrack: toggleAudioPlayback,
    stop: stopAudio,
  } = useAudio();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isResolvingYouTube, setIsResolvingYouTube] = useState(false);

  // Auto-dismiss audio preview if the setlist is cleared or parseResult resets
  useEffect(() => {
    if (!parseResult) {
      stopAudio();
    }
  }, [parseResult, stopAudio]);

  if (!parseResult) {
    return null;
  }

  const activeTracksCount =
    parseResult.tracks.length - excludedTrackIndices.size;

  const handleYouTubeExportClick = async () => {
    mediumTap();
    setIsResolvingYouTube(true);
    try {
      const res = await createYouTubePlaylist();
      if (res?.youtubeUrl) {
        try {
          window.open(res.youtubeUrl, "_blank");
        } catch {
          // Browser popup blocker handled by Step 4 launch buttons
        }
      }
    } finally {
      setIsResolvingYouTube(false);
    }
  };

  const handleOpenSpotifyModal = () => {
    mediumTap();
    if (!coverDataUrl) {
      exportPlaylistCover()
        .then((res) => {
          if (res?.dataUrl) {
            setCoverDataUrl(res.dataUrl);
          }
        })
        .catch(() => {});
    }
    setIsSpotifyModalOpen(true);
  };

  const handleConfirmSpotifyCreate = (includeCoverImage: boolean) => {
    setIsSpotifyModalOpen(false);
    if (!isAuthenticated) {
      savePendingWizardState();
      login();
      return;
    }
    createPlaylist(includeCoverImage);
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

  const isEssential = parseResult.mode === "essential";
  const coverArtistName =
    selectedArtist?.name || parseResult.artistName || "Concert Artist";
  const coverArtistImageUrl = selectedArtist?.imageUrl || null;
  const coverTourName =
    parseResult.tourName ||
    selectedShow?.tourName ||
    (isEssential ? "Essential Hits & Fan Favorites" : "Concert Tour");
  const coverVenueName = isEssential
    ? "STUDIO DISCOGRAPHY"
    : selectedShow?.venueName || parseResult.venueInfo || "Main Stage Arena";
  const coverCityName = isEssential
    ? "GLOBAL ESSENTIALS"
    : selectedShow?.cityName || "Global Tour";
  const coverEventDate = isEssential
    ? "STUDIO 2026"
    : selectedShow?.eventDate || "LIVE 2026";

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-5 sm:pb-6">
      {/* Offscreen DOM Mounting: 640x640 Tour Poster for Playlist Cover Art Snapshotting */}
      <div
        className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none"
        aria-hidden="true"
      >
        <PlaylistCoverArt
          id="playlist-cover-art"
          artistName={coverArtistName}
          artistImageUrl={coverArtistImageUrl}
          tourName={coverTourName}
          venueName={coverVenueName}
          cityName={coverCityName}
          eventDate={coverEventDate}
          trackCount={activeTracksCount}
        />
      </div>

      {/* Top Header with Circular Spotify Back Button & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors flex items-center justify-center active:scale-[0.95] shrink-0 cursor-pointer"
            title="Back to tour selection"
          >
            <ChevronLeft className="w-4 h-4 -translate-x-0.5" />
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

      {/* Playlist Customization Bar (Editable Title & Balanced Dual Quick Actions) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#181818] border border-neutral-800/80">
        {/* Card Header & Label */}
        <div className="pb-2.5">
          <label
            htmlFor="playlist-title-input"
            className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1DB954]" />
            <span>Playlist Title & Artwork</span>
          </label>
        </div>

        {/* Input & Action Buttons Group */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Custom Title Input */}
          <div className="flex-1 relative">
            <input
              id="playlist-title-input"
              type="text"
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              placeholder="e.g. Travis Scott • Utopia Tour Live 2024"
              className="w-full h-11 px-4 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#282828] border border-neutral-700/70 focus:border-[#1DB954] text-white font-medium text-xs sm:text-sm placeholder-zinc-500 transition-all outline-none"
            />
          </div>

          {/* Symmetrical Action Buttons: Spotify + YouTube */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Spotify Button */}
            <button
              type="button"
              onClick={handleOpenSpotifyModal}
              disabled={isGenerating || activeTracksCount === 0}
              className="flex-1 sm:flex-none w-full sm:w-28 h-11 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              title="Create playlist on Spotify"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
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
                  <span>Spotify</span>
                </>
              )}
            </button>

            {/* YouTube Button */}
            <button
              type="button"
              onClick={handleYouTubeExportClick}
              disabled={isResolvingYouTube || isGenerating || activeTracksCount === 0}
              className="flex-1 sm:flex-none w-full sm:w-28 h-11 px-4 rounded-xl bg-[#FF0000] hover:bg-[#e60000] disabled:bg-[#FF0000]/50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              title="Export to YouTube"
            >
              {isResolvingYouTube ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 fill-white shrink-0"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>YouTube</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Spotify Playlist Tracklist Table */}
      <div className="rounded-2xl bg-[#181818] border border-neutral-800/80 overflow-hidden shadow-xl mt-4 sm:mt-6">
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
            const isCurrentTrack =
              activeTrack?.name.toLowerCase() === track.name.toLowerCase();
            const isCurrentTrackLoading = isCurrentTrack && isLoadingAudio;
            const isCurrentTrackPlaying = isCurrentTrack && isPlaying;

            return (
              <div
                key={index}
                onClick={() =>
                  toggleAudioPlayback(
                    track,
                    selectedArtist?.name || parseResult.artistName || ""
                  )
                }
                className={`group grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs sm:text-sm transition-colors cursor-pointer select-none ${
                  isExcluded
                    ? "bg-[#141414] opacity-40 hover:opacity-75"
                    : isCurrentTrack
                    ? "bg-white/[0.06] hover:bg-white/[0.08]"
                    : "hover:bg-[#242424]"
                }`}
              >
                {/* Track Number / Playback Toggle / Animated Soundwave Equalizer */}
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAudioPlayback(
                        track,
                        selectedArtist?.name || parseResult.artistName || ""
                      );
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer focus:outline-none"
                    title={
                      isCurrentTrackPlaying
                        ? `Pause ${track.name}`
                        : `Preview ${track.name}`
                    }
                    aria-label={
                      isCurrentTrackPlaying
                        ? `Pause ${track.name}`
                        : `Preview ${track.name}`
                    }
                  >
                    {isCurrentTrackLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1DB954]" />
                    ) : isCurrentTrackPlaying ? (
                      <>
                        {/* Equalizer bars visible by default, Pause icon on hover */}
                        <div className="flex items-end justify-center gap-[2px] h-3.5 w-3.5 group-hover:hidden">
                          <span className="w-[2px] bg-[#1DB954] rounded-full h-full animate-eq-1" />
                          <span className="w-[2px] bg-[#1DB954] rounded-full h-full animate-eq-2" />
                          <span className="w-[2px] bg-[#1DB954] rounded-full h-full animate-eq-3" />
                          <span className="w-[2px] bg-[#1DB954] rounded-full h-full animate-eq-4" />
                        </div>
                        <Pause className="w-3.5 h-3.5 fill-[#1DB954] text-[#1DB954] hidden group-hover:block" />
                      </>
                    ) : isCurrentTrack ? (
                      <Play className="w-3.5 h-3.5 fill-[#1DB954] text-[#1DB954] ml-0.5" />
                    ) : (
                      <>
                        <span className="font-mono text-zinc-400 text-xs group-hover:hidden">
                          {index + 1}
                        </span>
                        <Play className="w-3.5 h-3.5 fill-white text-white hidden group-hover:block ml-0.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Song Title & Tags */}
                <div className="col-span-7 sm:col-span-6 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className={`font-bold leading-snug break-words ${
                        isExcluded
                          ? "line-through text-zinc-400"
                          : isCurrentTrack
                          ? "text-[#1DB954]"
                          : "text-white"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      mediumTap();
                      toggleTrack(index);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      !isExcluded
                        ? "bg-[#1DB954] text-black hover:bg-[#1ed760]"
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

      {/* Primary & Secondary Action Section: Inline Clean Button Ladder */}
      <div className="mt-8 flex flex-col items-center justify-center text-center">
        {/* Track selection summary counter */}
        <div className="flex items-center gap-2 text-xs text-[#B3B3B3]">
          <span>{activeTracksCount} of {parseResult.tracks.length} tracks selected</span>
          <span>•</span>
          <span>Est. playlist duration: ~{activeTracksCount * 4} min</span>
        </div>

        {/* Action Buttons: Clean Vertical Ladder */}
        <div className="flex flex-col gap-3 w-full max-w-md mx-auto mt-6">
          {/* Rung 1: Export to YouTube */}
          <button
            type="button"
            onClick={handleYouTubeExportClick}
            disabled={isResolvingYouTube || isGenerating || activeTracksCount === 0}
            className="w-full h-12 inline-flex items-center justify-center gap-2.5 px-6 rounded-xl bg-[#FF0000] hover:bg-[#e60000] disabled:bg-[#FF0000]/50 text-white font-semibold text-sm sm:text-base active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isResolvingYouTube ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                <span>Resolving YouTube audio tracks...</span>
              </>
            ) : (
              <>
                {/* Official YouTube Play Icon SVG */}
                <svg
                  className="w-5 h-5 fill-white shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>Export to YouTube</span>
              </>
            )}
          </button>

          {/* Rung 2: Create Spotify Playlist */}
          <button
            type="button"
            onClick={handleOpenSpotifyModal}
            disabled={isGenerating || isResolvingYouTube || activeTracksCount === 0}
            className="w-full h-12 inline-flex items-center justify-center gap-2.5 px-6 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-semibold text-sm sm:text-base active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
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

          {/* Rung 3: Customize & Download Ticket Stub */}
          <button
            type="button"
            onClick={handleOpenTicketStub}
            className="w-full h-12 inline-flex items-center justify-center gap-2.5 px-6 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-sm sm:text-base active:scale-[0.98] transition-all cursor-pointer"
          >
            <Ticket className="w-4 h-4 text-[#1DB954] shrink-0" />
            <span>Customize & Download Ticket Stub</span>
          </button>
        </div>
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

      {/* Hidden Offscreen Cover Art for Snapshot/Upload */}
      <div
        className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 select-none overflow-hidden"
        style={{ width: "640px", height: "640px" }}
        aria-hidden="true"
      >
        <PlaylistCoverArt
          id="playlist-cover-art"
          artistName={selectedArtist?.name || parseResult.artistName || "Concert Artist"}
          artistImageUrl={selectedArtist?.imageUrl || null}
          tourName={
            parseResult.tourName ||
            selectedShow?.tourName ||
            (parseResult.mode === "essential" ? "Essential Hits & Fan Favorites" : "World Tour")
          }
          venueName={
            parseResult.mode === "essential"
              ? "STUDIO DISCOGRAPHY"
              : selectedShow?.venueName || parseResult.venueInfo || "Main Stage Arena"
          }
          cityName={
            parseResult.mode === "essential"
              ? "GLOBAL ESSENTIALS"
              : selectedShow?.cityName || "Live Tour"
          }
          eventDate={
            parseResult.mode === "essential"
              ? "STUDIO 2026"
              : selectedShow?.eventDate || "LIVE 2026"
          }
          trackCount={activeTracksCount}
        />
      </div>

      {/* Spotify Privacy Modal */}
      <SpotifyPrivacyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        playlistTitle={playlistTitle || `${parseResult.artistName} Live Setlist`}
        trackCount={activeTracksCount}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        onConfirm={handleConfirmSpotifyCreate}
        isGenerating={isGenerating}
        coverDataUrl={coverDataUrl}
      />
    </div>
  );
}
