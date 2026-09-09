"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Globe, Loader2, Music2, Image as ImageIcon } from "lucide-react";
import { mediumTap, tickHaptic } from "@/lib/haptics";
import { exportPlaylistCover } from "@/lib/cover-export";

export interface SpotifyPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistTitle: string;
  trackCount: number;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  onConfirm: (includeCoverImage: boolean) => void;
  isGenerating?: boolean;
  coverDataUrl?: string | null;
}

export function SpotifyPrivacyModal({
  isOpen,
  onClose,
  playlistTitle,
  trackCount,
  isPublic,
  setIsPublic,
  onConfirm,
  isGenerating = false,
  coverDataUrl,
}: SpotifyPrivacyModalProps) {
  const [includeCoverImage, setIncludeCoverImage] = useState<boolean>(true);
  const [snapshotCoverUrl, setSnapshotCoverUrl] = useState<string | null>(null);
  const liveCoverUrl = coverDataUrl || snapshotCoverUrl;

  // Dynamically snapshot live cover preview thumbnail when modal opens if not already provided
  useEffect(() => {
    if (coverDataUrl || !isOpen) return;

    let isSubscribed = true;
    exportPlaylistCover()
      .then((res) => {
        if (isSubscribed && res?.dataUrl) {
          setSnapshotCoverUrl(res.dataUrl);
        }
      })
      .catch(() => {
        // Offscreen canvas not available yet; thumbnail fallback displays
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, coverDataUrl]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelectPrivate = () => {
    tickHaptic();
    setIsPublic(false);
  };

  const handleSelectPublic = () => {
    tickHaptic();
    setIsPublic(true);
  };

  const handleToggleCover = () => {
    tickHaptic();
    setIncludeCoverImage((prev) => !prev);
  };

  const handleConfirmClick = () => {
    mediumTap();
    onConfirm(includeCoverImage);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Glassmorphic Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="relative w-full max-w-md bg-[#161616] border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-5 text-left"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Spotify Branding */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 fill-[#1DB954]"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                  Create Spotify Playlist
                </h3>
                <p className="text-xs text-[#B3B3B3]">
                  Configure artwork and visibility before saving
                </p>
              </div>
            </div>

            {/* =========================================================
                1. LIVE COVER ART PREVIEW & PLAYLIST SUMMARY
               ========================================================= */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-neutral-800/80 flex items-center gap-3.5">
              {/* Square Tour Poster Thumbnail */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0 bg-neutral-900 flex items-center justify-center">
                {liveCoverUrl ? (
                  <img
                    src={liveCoverUrl}
                    alt="Tour Poster Preview"
                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                      includeCoverImage ? "opacity-100" : "opacity-35 grayscale"
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2 text-zinc-500">
                    <ImageIcon className="w-6 h-6 text-[#1DB954]/60 mb-1" />
                    <span className="text-[9px] uppercase font-bold tracking-wider">
                      Tour Cover
                    </span>
                  </div>
                )}
                {!includeCoverImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-1 text-center">
                    <span className="text-[9px] font-bold text-neutral-300 uppercase leading-tight">
                      Default Mosaic
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Playlist Preview
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white truncate">
                  {playlistTitle || "Live Concert Setlist"}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#1DB954] font-medium pt-0.5">
                  <Music2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{trackCount} tracks queued</span>
                </div>
              </div>
            </div>

            {/* =========================================================
                2. ARTWORK TOGGLE SWITCH ROW
               ========================================================= */}
            <div className="p-3.5 rounded-2xl bg-[#1c1c1c] border border-neutral-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-white tracking-wide">
                  Apply Custom Tour Poster Cover
                </div>
                <div className="text-[11px] text-[#B3B3B3] leading-relaxed">
                  Replaces Spotify&apos;s default 4-album mosaic with this official tour release artwork
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={includeCoverImage}
                onClick={handleToggleCover}
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 shrink-0 cursor-pointer ${
                  includeCoverImage ? "bg-[#1DB954]" : "bg-neutral-700"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    includeCoverImage ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* =========================================================
                3. PRIVACY SEGMENTED CONTROL
               ========================================================= */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Playlist Visibility
              </label>

              <div className="h-12 p-1 rounded-2xl bg-[#202020] border border-neutral-700/60 grid grid-cols-2 gap-1">
                {/* Private Toggle */}
                <button
                  type="button"
                  onClick={handleSelectPrivate}
                  className={`h-full rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !isPublic
                      ? "bg-[#1DB954] text-black font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Private</span>
                </button>

                {/* Public Toggle */}
                <button
                  type="button"
                  onClick={handleSelectPublic}
                  className={`h-full rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isPublic
                      ? "bg-[#1DB954] text-black font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </button>
              </div>

              {/* Helper note */}
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {!isPublic
                  ? "Private playlists are only visible to you in your Spotify library."
                  : "Public playlists appear on your Spotify profile and can be shared with anyone."}
              </p>
            </div>

            {/* =========================================================
                4. MODAL ACTIONS
               ========================================================= */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={isGenerating || trackCount === 0}
                className="w-full h-11 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Building Playlist...</span>
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
                    <span>Confirm & Create on Spotify</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
