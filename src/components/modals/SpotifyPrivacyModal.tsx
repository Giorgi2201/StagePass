"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Globe, Loader2, Music2 } from "lucide-react";
import { mediumTap, tickHaptic } from "@/lib/haptics";

export interface SpotifyPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistTitle: string;
  trackCount: number;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;
  onConfirm: () => void;
  isGenerating?: boolean;
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
}: SpotifyPrivacyModalProps) {
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

  const handleConfirmClick = () => {
    mediumTap();
    onConfirm();
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
            className="relative w-full max-w-md bg-[#161616] border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 space-y-6 text-left"
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
                  Select your playlist visibility before saving
                </p>
              </div>
            </div>

            {/* Playlist Summary Card */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-neutral-800/80 space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Playlist Preview
              </div>
              <div className="text-sm font-extrabold text-white truncate">
                {playlistTitle || "Live Concert Setlist"}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#1DB954] font-medium pt-0.5">
                <Music2 className="w-3.5 h-3.5" />
                <span>{trackCount} tracks queued</span>
              </div>
            </div>

            {/* Privacy Segmented Control */}
            <div className="space-y-2.5">
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
                      ? "bg-[#1DB954] text-black shadow-md"
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
                      ? "bg-[#1DB954] text-black shadow-md"
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

            {/* Modal Actions */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={isGenerating || trackCount === 0}
                className="w-full h-11 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1DB954]/20 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
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
