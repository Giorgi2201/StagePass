"use client";

import React, { useState, useEffect } from "react";
import { useWizard } from "@/context/WizardContext";
import { TicketModal } from "@/components/ticket/TicketModal";
import {
  CheckCircle2,
  ExternalLink,
  Ticket,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Music,
  Sparkles,
  Loader2,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { successPulse, tickHaptic } from "@/lib/haptics";
import { saveTicketStub, getDefaultTicketTheme } from "@/lib/storage";

export function StepSuccess() {
  const {
    isGenerating,
    generationStatus,
    creationResult,
    youtubeResult,
    playlistTitle,
    parseResult,
    selectedArtist,
    selectedShow,
    excludedTrackIndices,
    resetWizard,
  } = useWizard();

  const [isUnmatchedExpanded, setIsUnmatchedExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Trigger celebratory haptic sequence and auto-save stub upon receiving playlist creation confirmation
  useEffect(() => {
    if (creationResult || youtubeResult) {
      successPulse();

      try {
        const isEssential = parseResult?.mode === "essential";
        const activeTracks = parseResult?.tracks.filter(
          (_, index) => !excludedTrackIndices.has(index)
        ) || parseResult?.tracks || [];

        saveTicketStub({
          artistName: selectedArtist?.name || parseResult?.artistName || "Concert Artist",
          artistImageUrl: selectedArtist?.imageUrl || null,
          tourName:
            parseResult?.tourName ||
            selectedShow?.tourName ||
            (isEssential ? "Essential Hits & Fan Favorites" : "Concert Tour"),
          venueName: isEssential
            ? "STUDIO DISCOGRAPHY"
            : selectedShow?.venueName || parseResult?.venueInfo || "Main Stage Arena",
          cityName: isEssential
            ? "GLOBAL ESSENTIALS"
            : selectedShow?.cityName || "Global Tour",
          eventDate: isEssential
            ? "STUDIO 2026"
            : selectedShow?.eventDate || "LIVE 2026",
          mode: parseResult?.mode || "rehearsal",
          tracks: activeTracks,
          playlistUrl: creationResult?.playlistUrl || youtubeResult?.youtubeUrl || "",
          playlistId: creationResult?.playlistId || (youtubeResult ? `yt_${Date.now()}` : `stub_${Date.now()}`),
          youtubeUrl: youtubeResult?.youtubeUrl || null,
          youtubeMusicUrl: youtubeResult?.youtubeMusicUrl || null,
          theme: getDefaultTicketTheme(),
        });
      } catch (err) {
        console.error("Auto-save ticket stub failed:", err);
      }
    }
  }, [creationResult, youtubeResult, parseResult, selectedArtist, selectedShow, excludedTrackIndices]);

  // Loading State with real-time dynamic contextual messages
  if (isGenerating) {
    return (
      <div className="py-16 px-6 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-800" />
          <div className="absolute inset-0 rounded-full border-4 border-[#1DB954] border-t-transparent animate-spin" />
          <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center shadow-lg">
            <Loader2 className="w-6 h-6 text-[#1DB954] animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Building Your Playlist
          </h2>
          <p className="text-sm text-[#1DB954] font-semibold animate-pulse">
            {generationStatus || "Resolving tracks across catalog..."}
          </p>
          <p className="text-xs text-[#B3B3B3]">
            Matching verified Setlist.fm track titles directly with official music catalog releases.
          </p>
        </div>
      </div>
    );
  }

  if (!creationResult && !youtubeResult) {
    return null;
  }

  const matchedCount =
    creationResult?.matchedCount ?? youtubeResult?.matchedCount ?? 0;
  const totalRequested =
    creationResult?.totalRequested ?? youtubeResult?.totalRequested ?? 0;
  const matchRate = Math.round(
    (matchedCount / (totalRequested || 1)) * 100
  );

  const unmatchedList =
    creationResult?.unmatchedTracks || youtubeResult?.unmatchedTracks || [];

  const handleCopyLink = async () => {
    const url = creationResult?.playlistUrl || youtubeResult?.youtubeUrl;
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handleCopyTracklistText = async () => {
    tickHaptic();
    if (!parseResult) return;

    const artist = selectedArtist?.name || parseResult.artistName || "Artist";
    const activeTracks = parseResult.tracks.filter(
      (_, index) => !excludedTrackIndices.has(index)
    );
    const tracksToFormat = activeTracks.length > 0 ? activeTracks : parseResult.tracks;

    const formattedList = tracksToFormat
      .map((track, i) => `${i + 1}. ${artist} - ${track.name}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(formattedList);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error("Failed to copy tracklist text:", err);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
      {/* Success Notification Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#1c2c20] via-[#141d16] to-[#121212] border border-[#1DB954]/40 shadow-2xl text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/50 text-[#1DB954] flex items-center justify-center mx-auto shadow-lg shadow-[#1DB954]/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1DB954]/20 text-[#1DB954] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {youtubeResult && !creationResult
                ? "YouTube Playlist Ready"
                : "Playlist Created Successfully"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {playlistTitle || parseResult?.artistName || "Your Concert Setlist"}
          </h1>
          <p className="text-xs sm:text-sm text-[#B3B3B3]">
            {youtubeResult && !creationResult
              ? "Queued on YouTube — tap '+' or 'Save' to add to your library."
              : "Available immediately in your music library on iOS, Android, and Desktop."}
          </p>
        </div>

        {/* Stats Pill Row */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-black/40 border border-neutral-800 text-center">
            <div className="text-xl font-extrabold text-[#1DB954]">
              {matchedCount} / {totalRequested}
            </div>
            <div className="text-[11px] text-[#B3B3B3] uppercase font-semibold tracking-wider">
              Tracks Matched ({matchRate}%)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-neutral-800 text-center">
            <div className="text-xl font-extrabold text-white">
              ~{matchedCount * 4}m
            </div>
            <div className="text-[11px] text-[#B3B3B3] uppercase font-semibold tracking-wider">
              Total Runtime
            </div>
          </div>
        </div>

        {/* Multi-Platform Launcher Cards */}
        <div className="pt-2 flex flex-col items-center justify-center gap-3.5 w-full">
          {/* YouTube Single Primary Action Card */}
          {youtubeResult?.youtubeUrl && (
            <div className="w-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-black/40 border border-neutral-800">
              {/* Single High-Impact Full-Width YouTube Button */}
              <a
                href={youtubeResult.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 inline-flex items-center justify-center gap-2.5 px-6 rounded-xl bg-[#FF0000] hover:bg-[#e60000] text-white font-semibold text-base shadow-lg shadow-[#FF0000]/25 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Open in YouTube</span>
                <ExternalLink className="w-4 h-4 text-white/90 shrink-0" />
              </a>

              <p className="text-xs text-neutral-400 font-medium text-center">
                Tap the &apos;+&apos; or &apos;Save&apos; button in YouTube to permanently add this playlist to your library.
              </p>
            </div>
          )}

          {/* Spotify Action Buttons */}
          {creationResult?.playlistUrl && (
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href={creationResult.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-12 inline-flex items-center justify-center gap-2.5 px-6 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-sm shadow-xl shadow-[#1DB954]/30 active:scale-[0.98] transition-all"
              >
                <svg
                  className="w-5 h-5 fill-black shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
                </svg>
                <span>Open in Spotify</span>
                <ExternalLink className="w-4 h-4 text-black/80" />
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-[#282828] hover:bg-[#333333] text-white font-semibold text-xs sm:text-sm border border-neutral-700 active:scale-[0.98] transition-all"
              >
                <Share2 className="w-4 h-4 text-zinc-300" />
                <span>{copiedLink ? "Copied Link!" : "Share Playlist"}</span>
              </button>
            </div>
          )}

          {/* Universal "Copy Tracklist as Text" Action */}
          <div className="w-full flex flex-col items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyTracklistText}
              className="w-full h-12 inline-flex items-center justify-center gap-2.5 px-6 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/15 hover:border-white/25 text-white font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-[#1DB954]" />
                  <span className="text-[#1DB954]">Copied Tracklist to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-300" />
                  <span>Copy Tracklist as Text</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-zinc-500 text-center">
              Paste anywhere or import to Apple Music, Tidal & Amazon Music via SongShift or TuneMyMusic
            </span>
          </div>
        </div>
      </div>

      {/* Unmatched Tracks Accordion (Non-intrusive) */}
      {unmatchedList.length > 0 && (
        <div className="rounded-xl bg-[#181818] border border-neutral-800/80 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsUnmatchedExpanded(!isUnmatchedExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-500" />
              <span>
                {unmatchedList.length} song
                {unmatchedList.length > 1 ? "s" : ""} could not be found
              </span>
            </div>
            {isUnmatchedExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {isUnmatchedExpanded && (
            <div className="px-4 py-3 bg-[#141414] border-t border-neutral-800/60 text-xs text-zinc-400 space-y-1.5">
              <p className="text-[11px] text-[#B3B3B3] pb-1">
                These tracks were likely unreleased live improvisations, interludes, or obscure covers not available in the public catalog:
              </p>
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-zinc-300">
                {unmatchedList.map((title, idx) => (
                  <li key={idx} className="truncate">
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Digital Ticket Stub Showcase Teaser Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-[#1a1520] to-neutral-900 border border-pink-500/30 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-950/70 border border-pink-700/50 text-pink-300 text-[10px] font-extrabold uppercase tracking-wide">
              <Ticket className="w-3 h-3 text-pink-400" />
              <span>COMMEMORATIVE SOUVENIR</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Create Your Digital Ticket Stub
            </h2>
            <p className="text-xs text-[#B3B3B3] leading-relaxed">
              {parseResult?.mode === "essential"
                ? `Generate a retro collector stub featuring ${selectedArtist?.name || parseResult?.artistName || "your artist"}'s essential hits collection. Customize themes, section/seat vanity info, and export high-res PNGs to Instagram Stories or your photos.`
                : `Generate a retro concert ticket stub featuring ${selectedArtist?.name || parseResult?.artistName || "your artist"}'s verified setlist. Customize themes, section/seat vanity info, and export high-res PNGs to Instagram Stories or your photos.`}
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col justify-end">
            <button
              type="button"
              onClick={() => setIsTicketModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-pink-500/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>Customize & Share Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="pt-2 flex items-center justify-center">
        {/* Reset Wizard */}
        <button
          type="button"
          onClick={resetWizard}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Create Another Playlist</span>
        </button>
      </div>

      {/* Interactive Ticket Stub Studio Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        artistName={selectedArtist?.name || parseResult?.artistName || "Concert Artist"}
        tourName={
          parseResult?.tourName ||
          selectedShow?.tourName ||
          (parseResult?.mode === "essential" ? "Essential Hits & Fan Favorites" : undefined)
        }
        venueName={
          parseResult?.mode === "essential"
            ? "STUDIO DISCOGRAPHY"
            : selectedShow?.venueName || parseResult?.venueInfo || "Main Stage Arena"
        }
        cityName={
          parseResult?.mode === "essential"
            ? "GLOBAL ESSENTIALS"
            : selectedShow?.cityName
        }
        countryName={parseResult?.mode === "essential" ? undefined : selectedShow?.countryName}
        eventDate={
          parseResult?.mode === "essential"
            ? "STUDIO 2026"
            : selectedShow?.eventDate || "LIVE 2026"
        }
        tracks={
          parseResult?.tracks.filter((_, index) => !excludedTrackIndices.has(index)) ||
          parseResult?.tracks ||
          []
        }
        playlistUrl={creationResult?.playlistUrl || youtubeResult?.youtubeUrl || ""}
        mode={parseResult?.mode}
      />
    </div>
  );
}
