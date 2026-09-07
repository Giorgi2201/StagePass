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
} from "lucide-react";
import { successPulse } from "@/lib/haptics";

export function StepSuccess() {
  const {
    isGenerating,
    generationStatus,
    creationResult,
    playlistTitle,
    parseResult,
    selectedArtist,
    selectedShow,
    resetWizard,
  } = useWizard();

  const [isUnmatchedExpanded, setIsUnmatchedExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Trigger celebratory haptic sequence upon receiving playlist creation confirmation
  useEffect(() => {
    if (creationResult) {
      successPulse();
    }
  }, [creationResult]);

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
            Building Your Spotify Playlist
          </h2>
          <p className="text-sm text-[#1DB954] font-semibold animate-pulse">
            {generationStatus || "Matching live tracks with Spotify catalog..."}
          </p>
          <p className="text-xs text-[#B3B3B3]">
            Connecting verified Setlist.fm track titles directly with official Spotify audio releases.
          </p>
        </div>
      </div>
    );
  }

  if (!creationResult) {
    return null;
  }

  const matchRate = Math.round(
    (creationResult.matchedCount / creationResult.totalRequested) * 100
  );

  const handleCopyLink = async () => {
    if (creationResult.playlistUrl) {
      try {
        await navigator.clipboard.writeText(creationResult.playlistUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
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
            <span>Playlist Created Successfully</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {playlistTitle || parseResult?.artistName || "Your Concert Setlist"}
          </h1>
          <p className="text-xs sm:text-sm text-[#B3B3B3]">
            Available immediately in your Spotify library on iOS, Android, and Desktop.
          </p>
        </div>

        {/* Stats Pill Row */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-black/40 border border-neutral-800 text-center">
            <div className="text-xl font-extrabold text-[#1DB954]">
              {creationResult.matchedCount} / {creationResult.totalRequested}
            </div>
            <div className="text-[11px] text-[#B3B3B3] uppercase font-semibold tracking-wider">
              Tracks Matched ({matchRate}%)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-neutral-800 text-center">
            <div className="text-xl font-extrabold text-white">
              ~{creationResult.matchedCount * 4}m
            </div>
            <div className="text-[11px] text-[#B3B3B3] uppercase font-semibold tracking-wider">
              Total Runtime
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          {/* Open in Spotify Button */}
          <a
            href={creationResult.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold text-sm shadow-xl shadow-[#1DB954]/30 active:scale-[0.98] transition-all"
          >
            {/* Spotify SVG */}
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

          {/* Copy Share Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#282828] hover:bg-[#333333] text-white font-bold text-xs sm:text-sm border border-neutral-700 active:scale-[0.98] transition-all"
          >
            <Share2 className="w-4 h-4 text-zinc-300" />
            <span>{copiedLink ? "Copied Link!" : "Share Playlist"}</span>
          </button>
        </div>
      </div>

      {/* Unmatched Tracks Accordion (Non-intrusive) */}
      {creationResult.unmatchedTracks &&
        creationResult.unmatchedTracks.length > 0 && (
          <div className="rounded-xl bg-[#181818] border border-neutral-800/80 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsUnmatchedExpanded(!isUnmatchedExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-500" />
                <span>
                  {creationResult.unmatchedTracks.length} song
                  {creationResult.unmatchedTracks.length > 1 ? "s" : ""} could
                  not be found on Spotify
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
                  These tracks were likely unreleased live improvisations or obscure covers not available in Spotify&apos;s current catalog:
                </p>
                <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-zinc-300">
                  {creationResult.unmatchedTracks.map((title, idx) => (
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
              Generate a retro concert ticket stub featuring {selectedArtist?.name || parseResult?.artistName || "your artist"}&apos;s verified setlist. Customize themes, section/seat vanity info, and export high-res PNGs to Instagram Stories or your photos.
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
        tourName={parseResult?.tourName || selectedShow?.tourName}
        venueName={selectedShow?.venueName || parseResult?.venueInfo || "Main Stage Arena"}
        cityName={selectedShow?.cityName}
        countryName={selectedShow?.countryName}
        eventDate={selectedShow?.eventDate || "LIVE 2026"}
        tracks={parseResult?.tracks || []}
        playlistUrl={creationResult.playlistUrl}
      />
    </div>
  );
}
