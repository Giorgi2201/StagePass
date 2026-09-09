"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Ticket,
  Copy,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { useWizard } from "@/context/WizardContext";
import { TicketModal } from "@/components/ticket/TicketModal";
import { saveTicketStub, getDefaultTicketTheme } from "@/lib/storage";
import { mediumTap, successPulse } from "@/lib/haptics";

export function BetaAccessModal() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    return (
      authError === "developer_mode" ||
      authError === "profile_failed" ||
      authError === "token_failed"
    );
  });
  const [userEmail, setUserEmail] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const {
    parseResult,
    selectedArtist,
    selectedShow,
    excludedTrackIndices,
    goToStep,
  } = useWizard();

  // Clean up ?auth_error parameter from browser URL without triggering cascading renders
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.has("auth_error")) {
      params.delete("auth_error");
      const newQuery = params.toString();
      const newUrl =
        window.location.pathname +
        (newQuery ? `?${newQuery}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const handleClose = () => {
    mediumTap();
    setIsOpen(false);
  };

  const handleOpenTicketStub = () => {
    mediumTap();
    setIsOpen(false);

    if (parseResult) {
      try {
        const isEssential = parseResult.mode === "essential";
        const activeTracks = parseResult.tracks.filter(
          (_, index) => !excludedTrackIndices.has(index)
        );

        saveTicketStub({
          artistName:
            selectedArtist?.name || parseResult.artistName || "Concert Artist",
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
        console.error("Error saving ticket stub from beta modal:", err);
      }

      goToStep("review");
      setIsTicketModalOpen(true);
    } else {
      goToStep("search");
    }
  };

  const getRequestMessage = () => {
    const emailStr = userEmail.trim() ? userEmail.trim() : "[your-spotify-email]";
    return `Hey! Please add my Spotify account email (${emailStr}) to the StagePass Developer Mode whitelist so I can sync concert setlists directly to my Spotify library.`;
  };

  const handleCopyRequest = async () => {
    mediumTap();
    try {
      await navigator.clipboard.writeText(getRequestMessage());
      setIsCopied(true);
      successPulse();
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
            {/* Dark glassmorphic backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-2xl bg-[#181818]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] p-6 sm:p-8 overflow-hidden z-10 space-y-6"
            >
              {/* Specular hairline highlight on top */}
              <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

              {/* Header row with Badge & Dismiss button */}
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Spotify Developer Mode Access</span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Dismiss modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Headline & Description */}
              <div className="space-y-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  Closed Beta Access Required
                </h2>
                <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed">
                  Spotify&apos;s Web API operates in <strong className="text-zinc-200">Developer Mode</strong> for non-corporate projects. To save playlists directly to your personal library, your Spotify email must be registered on the developer whitelist.
                </p>
              </div>

              {/* Action 1: Immediate Value (Customize & Download Ticket Stub) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#1DB954]/10 to-transparent border border-[#1DB954]/25 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#1DB954]" />
                    <span>No Spotify Account Needed:</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1DB954] bg-[#1DB954]/15 px-2 py-0.5 rounded-full border border-[#1DB954]/30">
                    100% Free
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  You don&apos;t need Spotify approval to collect, customize, and export high-resolution concert ticket stubs for this setlist!
                </p>

                <button
                  type="button"
                  onClick={handleOpenTicketStub}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-black" />
                  <span>Customize & Download Ticket Stub Instead</span>
                </button>
              </div>

              {/* Action 2: Request Whitelist helper */}
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Request Developer Whitelist
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your Spotify email (optional)..."
                    className="flex-1 h-9 px-3 rounded-lg bg-black/50 border border-neutral-700/60 text-white placeholder:text-zinc-500 text-xs font-medium focus:border-white/40 outline-none transition-all"
                  />

                  <button
                    type="button"
                    onClick={handleCopyRequest}
                    className="h-9 px-3.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 border border-neutral-700 transition-all cursor-pointer shrink-0"
                    title="Copy request text to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#1DB954]" />
                        <span className="text-[#1DB954]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 leading-normal">
                  Copy this message and send it to the administrator to be added to the Spotify Developer Dashboard.
                </p>
              </div>

              {/* Action 3: Dismiss */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Modal if user chose to customize & download their stub */}
      {isTicketModalOpen && (
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
              : selectedShow?.cityName || "Global Tour"
          }
          countryName={parseResult?.mode === "essential" ? undefined : selectedShow?.countryName}
          eventDate={
            parseResult?.mode === "essential"
              ? "STUDIO 2026"
              : selectedShow?.eventDate || "LIVE 2026"
          }
          tracks={
            parseResult?.tracks
              ? parseResult.tracks.filter((_, index) => !excludedTrackIndices.has(index))
              : []
          }
          playlistUrl=""
          mode={parseResult?.mode}
        />
      )}
    </>
  );
}
