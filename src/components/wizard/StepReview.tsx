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
  Pencil,
  Heart,
  Target,
  Trophy,
  BookOpen,
  RefreshCw,
  Play,
  Pause,
} from "lucide-react";
import { useAudio } from "@/context/AudioContext";
import { mediumTap } from "@/lib/haptics";
import { SpotifyPrivacyModal } from "@/components/modals/SpotifyPrivacyModal";
import type { CheckLikedTracksResponse } from "@/types/spotify";
import type { NormalizedTrack } from "@/types/setlist";

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
    generationStatus,
    goBack,
    errorMessage,
    savePendingWizardState,
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

  // Tour Readiness Score Reactive State
  const [readinessData, setReadinessData] =
    useState<CheckLikedTracksResponse | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [resolvedTracks, setResolvedTracks] = useState<NormalizedTrack[]>(
    parseResult?.tracks || []
  );

  // Synchronize resolvedTracks with parseResult
  useEffect(() => {
    if (parseResult?.tracks) {
      setResolvedTracks(parseResult.tracks);
    }
  }, [parseResult]);

  // Scan library when Step 3 loads with resolved concert tracks
  useEffect(() => {
    if (!parseResult || !parseResult.tracks || parseResult.tracks.length === 0) {
      return;
    }

    const currentParseResult = parseResult;
    let isMounted = true;

    async function loadTourReadiness() {
      setIsScanning(true);
      try {
        let currentTracks = currentParseResult.tracks;

        // If tracks do not have Spotify IDs or candidate IDs yet, resolve them
        const needsResolution = currentTracks.some(
          (t) => !t.id || !t.candidateIds || t.candidateIds.length === 0
        );
        if (needsResolution) {
          try {
            const resolveRes = await fetch("/api/spotify/resolve-tracks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tracks: currentTracks,
                performingArtist:
                  selectedArtist?.name || currentParseResult.artistName,
              }),
            });

            if (resolveRes.ok) {
              const resolveData = await resolveRes.json();
              if (resolveData?.tracks && Array.isArray(resolveData.tracks)) {
                currentTracks = resolveData.tracks;
                if (isMounted) {
                  setResolvedTracks(currentTracks);
                }
              }
            }
          } catch (err) {
            console.warn("Could not pre-resolve Spotify track IDs:", err);
          }
        }

        // Extract all Spotify track IDs (both primary and candidate IDs)
        const trackIds = Array.from(
          new Set(
            currentTracks
              .flatMap((t) => [t.id, ...(t.candidateIds || [])])
              .filter(
                (id): id is string => typeof id === "string" && Boolean(id.trim())
              )
          )
        );

        if (trackIds.length === 0) {
          if (isMounted) setIsScanning(false);
          return;
        }

        // Check liked tracks against user's Spotify library
        const scanRes = await fetch("/api/spotify/check-liked-tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackIds,
            artistName: selectedArtist?.name || currentParseResult.artistName,
            tracks: currentTracks,
          }),
        });

        if (scanRes.ok) {
          const scanData: CheckLikedTracksResponse = await scanRes.json();
          if (isMounted) {
            setReadinessData(scanData);
          }
        }
      } catch (err) {
        console.error("Failed to check liked tracks for tour readiness:", err);
      } finally {
        if (isMounted) {
          setIsScanning(false);
        }
      }
    }

    loadTourReadiness();

    return () => {
      isMounted = false;
    };
  }, [parseResult, selectedArtist, isAuthenticated]);

  if (!parseResult) {
    return null;
  }

  // Check if a track is liked either by primary Spotify ID or any candidate release ID
  const isTrackLiked = (t: NormalizedTrack) => {
    if (
      !readinessData ||
      readinessData.isGuest ||
      !readinessData.likedMap
    ) {
      return false;
    }
    if (t.id && readinessData.likedMap[t.id]) return true;
    if (
      t.candidateIds &&
      t.candidateIds.some((cid) => readinessData.likedMap[cid])
    ) {
      return true;
    }
    return false;
  };

  // Calculate dynamic readiness score based on included/active tracks
  const activeTracks = resolvedTracks.filter(
    (_, index) => !excludedTrackIndices.has(index)
  );

  const displayTotalChecked =
    activeTracks.length > 0
      ? activeTracks.length
      : readinessData?.totalChecked || resolvedTracks.length;

  const displayLikedCount = readinessData?.likedMap
    ? activeTracks.filter(isTrackLiked).length
    : readinessData?.likedCount || 0;

  const displayPercentage =
    displayTotalChecked > 0
      ? Math.round((displayLikedCount / displayTotalChecked) * 100)
      : readinessData?.readinessPercentage || 0;

  const displayMissingCount = Math.max(
    0,
    displayTotalChecked - displayLikedCount
  );

  const handleConnectToScan = () => {
    mediumTap();
    savePendingWizardState();
    login();
  };

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
    setIsSpotifyModalOpen(true);
  };

  const handleConfirmSpotifyCreate = () => {
    setIsSpotifyModalOpen(false);
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
    <div
      className={`space-y-6 animate-in fade-in duration-300 transition-all duration-300 ${
        activeTrack ? "pb-44 md:pb-28" : "pb-28 md:pb-12"
      }`}
    >
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Custom Title Input */}
          <div className="flex-1 relative">
            <input
              id="playlist-title-input"
              type="text"
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              placeholder="e.g. Travis Scott • Utopia Tour Live 2024"
              className="w-full h-12 px-4 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#282828] border border-neutral-700/70 focus:border-[#1DB954] text-white font-medium text-xs sm:text-sm placeholder-zinc-500 transition-all outline-none"
            />
          </div>

          {/* Action Buttons: Ticket Stub Preview + Spotify Launch + YouTube Export */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Ticket Stub Button */}
            <button
              type="button"
              onClick={handleOpenTicketStub}
              className="w-full sm:w-auto sm:min-w-[130px] h-12 px-4 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-neutral-700/80 hover:border-neutral-600 transition-all active:scale-[0.97] cursor-pointer whitespace-nowrap"
              title="Preview and download your concert ticket stub souvenir"
            >
              <Ticket className="w-4 h-4 text-[#1DB954] shrink-0" />
              <span>Ticket Stub</span>
            </button>

            {/* Spotify Direct Launch Button */}
            <button
              type="button"
              onClick={handleOpenSpotifyModal}
              disabled={isGenerating || activeTracksCount === 0}
              className="w-full sm:w-auto sm:min-w-[155px] h-12 px-5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/25 active:scale-[0.97] transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              title="Create playlist on Spotify"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                  <span>{generationStatus || "Creating..."}</span>
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
                  <span>Create on Spotify</span>
                </>
              )}
            </button>

            {/* YouTube Quick-Action Button */}
            <button
              type="button"
              onClick={handleYouTubeExportClick}
              disabled={isResolvingYouTube || isGenerating || activeTracksCount === 0}
              className="w-full sm:w-auto sm:min-w-[130px] h-12 px-4 rounded-xl bg-[#FF0000] hover:bg-[#e60000] disabled:bg-[#FF0000]/50 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FF0000]/20 active:scale-[0.97] transition-all cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
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

      {/* Tour Readiness Scorecard Banner */}
      {isScanning ? (
        /* Shimmer Loading Skeleton */
        <div className="bg-white/[0.04] border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 md:mb-6 animate-pulse">
          {/* Desktop Skeleton */}
          <div className="hidden md:flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 w-44 bg-white/10 rounded" />
                <div className="h-3 w-64 bg-white/5 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-44 space-y-1.5">
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-2.5 w-full bg-white/5 rounded-full" />
              </div>
              <div className="h-7 w-36 bg-white/10 rounded-full" />
            </div>
          </div>

          {/* Mobile Skeleton */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10" />
                <div className="h-3.5 w-32 bg-white/10 rounded" />
              </div>
              <div className="h-4 w-16 bg-white/10 rounded-full" />
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full" />
          </div>
        </div>
      ) : readinessData?.isGuest ? (
        /* Guest Mode Experience */
        <div className="bg-white/[0.04] border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 md:mb-6 shadow-md backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center text-[#1DB954] shrink-0">
                <Target className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
                  Want to see how Tour-Ready you are?
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Connect your Spotify account to scan your Liked Songs against this tour setlist.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConnectToScan}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs md:text-sm shadow-md shadow-[#1DB954]/20 active:scale-[0.97] transition-all cursor-pointer whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 fill-black shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
              </svg>
              <span>Connect to Scan Library</span>
            </button>
          </div>
        </div>
      ) : readinessData ? (
        /* Authenticated Scorecard Banner (Desktop & Mobile) */
        <>
          {/* Desktop Viewport (>= 768px) */}
          <div className="hidden md:flex items-center justify-between gap-6 bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-6 shadow-lg backdrop-blur-sm">
            {/* Left Section */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20 flex items-center justify-center text-[#1DB954] shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Tour Readiness Score
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[10px] font-bold text-[#1DB954] uppercase tracking-wider">
                    Live Library Sync
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  <span className="font-semibold text-white">
                    {displayLikedCount}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {displayTotalChecked}
                  </span>{" "}
                  concert tracks are saved in your Spotify library
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="w-48 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    Readiness
                  </span>
                  <span className="font-extrabold text-white text-sm">
                    {displayPercentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-[#1DB954] rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(29,185,84,0.4)]"
                    style={{ width: `${Math.min(displayPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0">
                {displayMissingCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {displayMissingCount}{" "}
                    {displayMissingCount === 1 ? "track" : "tracks"} to study
                    before the show
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] text-xs font-semibold">
                    <Trophy className="w-3.5 h-3.5 text-[#1DB954]" />
                    100% Pit-Ready!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Viewport (< 768px) */}
          <div className="md:hidden bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-4 space-y-2.5 shadow-md">
            {/* Top Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#1DB954]/15 border border-[#1DB954]/25 flex items-center justify-center text-[#1DB954] shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-white tracking-tight truncate">
                  Tour Readiness:{" "}
                  <span className="text-[#1DB954]">{displayPercentage}%</span>
                </span>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-zinc-300 shrink-0">
                {displayLikedCount}/{displayTotalChecked} songs
              </span>
            </div>

            {/* Bottom Row */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1DB954] rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(29,185,84,0.4)]"
                style={{ width: `${Math.min(displayPercentage, 100)}%` }}
              />
            </div>

            {displayMissingCount > 0 && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                <span>
                  {displayMissingCount}{" "}
                  {displayMissingCount === 1 ? "track" : "tracks"} to study
                </span>
                <span className="text-zinc-500 font-medium">
                  Synced with Spotify
                </span>
              </div>
            )}
          </div>
        </>
      ) : null}

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
          {resolvedTracks.map((track, index) => {
            const isExcluded = excludedTrackIndices.has(index);
            const isCurrentTrack =
              activeTrack?.name.toLowerCase() === track.name.toLowerCase();
            const isCurrentTrackLoading = isCurrentTrack && isLoadingAudio;
            const isCurrentTrackPlaying = isCurrentTrack && isPlaying;

            return (
              <div
                key={index}
                className={`group grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs sm:text-sm transition-colors ${
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
                      onClick={() =>
                        toggleAudioPlayback(
                          track,
                          selectedArtist?.name || parseResult.artistName || ""
                        )
                      }
                      className={`font-bold leading-snug break-words cursor-pointer hover:underline ${
                        isExcluded
                          ? "line-through text-zinc-400"
                          : isCurrentTrack
                          ? "text-[#1DB954]"
                          : "text-white"
                      }`}
                    >
                      {track.name}
                    </span>

                    {/* Spotify Liked Songs Status Badge */}
                    {readinessData &&
                      !readinessData.isGuest &&
                      (isTrackLiked(track) ? (
                        <span
                          className="inline-flex items-center gap-1 text-[#1DB954] shrink-0"
                          title="Saved in your Spotify Liked Songs"
                        >
                          <Heart className="w-3.5 h-3.5 fill-[#1DB954] text-[#1DB954] drop-shadow-[0_0_8px_rgba(29,185,84,0.7)]" />
                          <span className="hidden sm:inline text-[10px] font-semibold text-[#1DB954]">
                            Liked
                          </span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[11px] font-medium shrink-0"
                          title="Not found in your Spotify Liked Songs"
                        >
                          <BookOpen className="w-2.5 h-2.5 text-amber-400" />
                          Need to Study
                        </span>
                      ))}

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
        <div className="w-full max-w-md flex flex-col items-stretch gap-3">
          {/* Dedicated YouTube Export Section: Zero Login Required */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={handleYouTubeExportClick}
              disabled={isResolvingYouTube || isGenerating || activeTracksCount === 0}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-full bg-[#FF0000] hover:bg-[#E60000] disabled:bg-[#FF0000]/50 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#FF0000]/25 hover:shadow-[#FF0000]/40 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isResolvingYouTube ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
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
            <span className="text-[11px] text-zinc-400 font-medium">
              Zero login required • Works for all users
            </span>
          </div>

          {/* Prominent Spotify Button */}
          <button
            type="button"
            onClick={handleOpenSpotifyModal}
            disabled={isGenerating || isResolvingYouTube || activeTracksCount === 0}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-full bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-sm sm:text-base shadow-xl shadow-[#1DB954]/25 hover:shadow-[#1DB954]/40 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
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
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/15 hover:border-white/25 text-white font-bold text-sm sm:text-base shadow-lg backdrop-blur-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <Ticket className="w-5 h-5 text-[#1DB954] shrink-0" />
            <span>Customize & Download Ticket Stub</span>
          </button>
        </div>

        {/* Subtle helper line with calibrated bottom margin */}
        <p className="text-xs text-zinc-500 font-medium mb-5">
          {isAuthenticated
            ? "Playlists will be saved directly to your music library"
            : "Free instant ticket stubs & YouTube export • Connect Spotify anytime to sync playlists"}
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
      />
    </div>
  );
}
