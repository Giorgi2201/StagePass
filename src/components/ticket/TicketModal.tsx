"use client";

import React, { useState, useRef, useEffect } from "react";
import { TicketStub, type TicketTheme } from "./TicketStub";
import type { NormalizedTrack } from "@/types/setlist";
import {
  generateTicketImage,
  shareTicket,
  downloadTicketImage,
  copyTicketToClipboard,
} from "@/lib/ticket-export";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Palette,
  Sliders,
} from "lucide-react";
import { mediumTap, successPulse } from "@/lib/haptics";

import { getDefaultTicketTheme } from "@/lib/storage";

export interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistName: string;
  tourName?: string;
  venueName?: string;
  cityName?: string;
  countryName?: string;
  eventDate?: string;
  tracks?: NormalizedTrack[];
  playlistUrl?: string;
  mode?: "memory" | "rehearsal" | "essential";
  initialTheme?: TicketTheme;
}

const THEMES: { id: TicketTheme; label: string; dotColor: string }[] = [
  { id: "spotify", label: "Spotify Neon", dotColor: "#1DB954" },
  { id: "vintage", label: "Vintage Paper", dotColor: "#C5B390" },
  { id: "cyber", label: "Cyber Midnight", dotColor: "#00F0FF" },
];

export function TicketModal({
  isOpen,
  onClose,
  artistName,
  tourName,
  venueName,
  cityName,
  countryName,
  eventDate,
  tracks = [],
  mode,
  initialTheme,
}: TicketModalProps) {
  const [theme, setTheme] = useState<TicketTheme>(() => initialTheme || getDefaultTicketTheme());
  const [section, setSection] = useState("GA");
  const [row, setRow] = useState("1");
  const [seat, setSeat] = useState("042");

  // Synchronize theme when opening with specific initialTheme
  const [prevInitialTheme, setPrevInitialTheme] = useState(initialTheme);
  if (initialTheme !== prevInitialTheme) {
    setPrevInitialTheme(initialTheme);
    setTheme(initialTheme || getDefaultTicketTheme());
  }

  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const ticketRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Dynamically calculate scale factor so the 670px ticket fits any mobile viewport
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const targetWidth = 670;
      if (containerWidth < targetWidth + 24) {
        const calculatedScale = Math.max(0.48, (containerWidth - 24) / targetWidth);
        setScale(calculatedScale);
      } else {
        setScale(1);
      }
    }

    if (isOpen) {
      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Action: Native Mobile Share with automatic Download fallback
  const handleShare = async () => {
    if (!ticketRef.current) return;
    setIsSharing(true);
    setStatusMessage(null);

    try {
      const result = await generateTicketImage(ticketRef.current, artistName, 3);
      const shareResult = await shareTicket({
        file: result.file,
        dataUrl: result.dataUrl,
        filename: result.filename,
        artistName,
        venueName,
        dateStr: eventDate,
      });

      if (shareResult.shared) {
        successPulse();
      }
      if (shareResult.method === "download") {
        setStatusMessage("Downloaded ticket image to your device!");
      }
    } catch (err) {
      console.error("Error sharing ticket:", err);
      setStatusMessage("Failed to generate ticket image. Try downloading instead.");
    } finally {
      setIsSharing(false);
    }
  };

  // 2. Action: Direct PNG Download
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    setStatusMessage(null);

    try {
      const result = await generateTicketImage(ticketRef.current, artistName, 3);
      downloadTicketImage(result.dataUrl, result.filename);
      successPulse();
      setStatusMessage("Ticket saved to downloads!");
    } catch (err) {
      console.error("Error downloading ticket:", err);
      setStatusMessage("Failed to generate download. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // 3. Action: Copy Raw Image to Clipboard
  const handleCopy = async () => {
    if (!ticketRef.current) return;
    setIsCopying(true);
    setStatusMessage(null);

    try {
      const result = await generateTicketImage(ticketRef.current, artistName, 2);
      const copied = await copyTicketToClipboard(result.blob);
      if (copied) {
        setCopySuccess(true);
        successPulse();
        setStatusMessage("Ticket copied to clipboard!");
        setTimeout(() => setCopySuccess(false), 2500);
      } else {
        // Fallback to download if clipboard write isn't allowed by browser permissions
        downloadTicketImage(result.dataUrl, result.filename);
        setStatusMessage("Clipboard not supported in this browser. Ticket downloaded instead!");
      }
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      setStatusMessage("Could not copy to clipboard. Try downloading.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Digital Ticket Stub Customizer"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        // Light-dismiss on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#141414] border border-neutral-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-[#181818]/60 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                Digital Ticket Stub Studio
              </h2>
              <p className="text-xs text-[#B3B3B3]">
                Customize and export your commemorative concert pass
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Ticket Live Preview Container with dynamic responsive scaling */}
          <div
            ref={containerRef}
            className="w-full rounded-2xl bg-[#0a0a0a] border border-neutral-800/80 p-3 sm:p-6 flex items-center justify-center overflow-hidden shadow-inner min-h-[220px]"
          >
            <div
              style={{
                width: 670 * scale,
                height: 310 * scale,
                transition: "width 0.2s ease, height 0.2s ease",
              }}
              className="relative flex items-center justify-center shrink-0"
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: 670,
                  minHeight: 310,
                }}
                className="absolute top-0 left-0"
              >
                <TicketStub
                  ref={ticketRef}
                  artistName={artistName}
                  tourName={tourName}
                  venueName={venueName}
                  cityName={cityName}
                  countryName={countryName}
                  eventDate={eventDate}
                  tracks={tracks}
                  section={section}
                  row={row}
                  seat={seat}
                  theme={theme}
                  mode={mode}
                />
              </div>
            </div>
          </div>

          {/* Customizer Controls Bar */}
          <div className="space-y-4">
            {/* Theme Switcher Pills */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Palette className="w-3.5 h-3.5 text-[#1DB954]" />
                <span>Aesthetic Theme</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      mediumTap();
                      setTheme(th.id);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      theme === th.id
                        ? "bg-[#282828] border-white/60 text-white shadow-lg"
                        : "bg-[#1c1c1c] border-neutral-800 text-zinc-400 hover:text-zinc-200 hover:bg-[#222222]"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                      style={{ backgroundColor: th.dotColor }}
                    />
                    <span className="truncate">{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vanity Seating Inputs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Sliders className="w-3.5 h-3.5 text-[#1DB954]" />
                <span>Vanity Seating Details</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">
                    Section
                  </label>
                  <input
                    type="text"
                    value={section}
                    maxLength={10}
                    onChange={(e) => setSection(e.target.value.toUpperCase())}
                    placeholder="GA"
                    className="w-full h-10 px-3 rounded-xl bg-[#1f1f1f] border border-neutral-700/60 text-white text-xs font-mono font-bold focus:border-[#1DB954] outline-none transition-all text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">
                    Row
                  </label>
                  <input
                    type="text"
                    value={row}
                    maxLength={6}
                    onChange={(e) => setRow(e.target.value.toUpperCase())}
                    placeholder="1"
                    className="w-full h-10 px-3 rounded-xl bg-[#1f1f1f] border border-neutral-700/60 text-white text-xs font-mono font-bold focus:border-[#1DB954] outline-none transition-all text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">
                    Seat
                  </label>
                  <input
                    type="text"
                    value={seat}
                    maxLength={6}
                    onChange={(e) => setSeat(e.target.value.toUpperCase())}
                    placeholder="042"
                    className="w-full h-10 px-3 rounded-xl bg-[#1f1f1f] border border-neutral-700/60 text-white text-xs font-mono font-bold focus:border-[#1DB954] outline-none transition-all text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800/80 bg-[#181818]/60 backdrop-blur-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-[#B3B3B3] hidden sm:block">
            High-res retina PNG • 0KB server cost
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {/* Copy Image Button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={isCopying || isSharing || isDownloading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] disabled:opacity-50 text-white text-xs font-bold border border-neutral-700 transition-all cursor-pointer"
              title="Copy image to clipboard"
            >
              {isCopying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : copySuccess ? (
                <Check className="w-3.5 h-3.5 text-[#1DB954]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>{copySuccess ? "Copied!" : "Copy Image"}</span>
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || isSharing || isCopying}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] disabled:opacity-50 text-white text-xs font-bold border border-neutral-700 transition-all cursor-pointer"
              title="Download high-resolution PNG"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-zinc-400" />
              )}
              <span>Download PNG</span>
            </button>

            {/* Primary Action: Share Ticket */}
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing || isDownloading || isCopying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-[#1DB954]/25 transition-all cursor-pointer active:scale-[0.98]"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering Ticket...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Share Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
