"use client";

import React, { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  getDefaultTicketTheme,
  setDefaultTicketTheme,
} from "@/lib/storage";
import type { TicketTheme } from "@/components/ticket/TicketStub";
import {
  User,
  ShieldCheck,
  Radio,
  LogOut,
  Download,
  Palette,
  Check,
  CheckCircle2,
  Share,
  PlusSquare,
  AlertTriangle,
} from "lucide-react";
import { mediumTap, tickHaptic } from "@/lib/haptics";

function subscribeStandalone(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getServerStandaloneSnapshot(): boolean {
  return false;
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("stagepass_theme_pref_updated", callback);
  return () => window.removeEventListener("stagepass_theme_pref_updated", callback);
}

function getThemeSnapshot(): TicketTheme {
  return getDefaultTicketTheme();
}

function getServerThemeSnapshot(): TicketTheme {
  return "spotify";
}

const THEME_OPTIONS: {
  id: TicketTheme;
  title: string;
  subtitle: string;
  dotColor: string;
  borderColor: string;
}[] = [
  {
    id: "spotify",
    title: "Spotify Neon",
    subtitle: "Dark slate with vibrant Spotify Green accents",
    dotColor: "#1DB954",
    borderColor: "border-[#1DB954]/50",
  },
  {
    id: "vintage",
    title: "Vintage Paper",
    subtitle: "Classic concert ticket stock with crimson ink",
    dotColor: "#C5B390",
    borderColor: "border-[#C5B390]/50",
  },
  {
    id: "cyber",
    title: "Cyber Midnight",
    subtitle: "Electric cyan with holographic purple flares",
    dotColor: "#00F0FF",
    borderColor: "border-cyan-500/50",
  },
];

export function ProfileView() {
  const { user, isAuthenticated, logout, login } = useAuth();
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const selectedTheme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );

  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getServerStandaloneSnapshot
  );

  const handleSelectTheme = (theme: TicketTheme) => {
    tickHaptic();
    setDefaultTicketTheme(theme);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* View Header */}
      <div className="pb-4 border-b border-neutral-800/80 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] text-xs font-bold uppercase tracking-wider mb-1">
          <User className="w-3.5 h-3.5" />
          <span>Account & Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#B3B3B3]">
          Customize your default ticket aesthetic, manage your Spotify connection, and PWA configuration.
        </p>
      </div>

      {isAuthenticated && user ? (
        <div className="space-y-6">
          {/* Spotify Connected Profile Card */}
          <div className="p-6 rounded-2xl bg-[#161616] border border-neutral-800 flex items-center gap-4 shadow-xl">
            {user.avatarUrl ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-[#1DB954]/30 shrink-0 bg-neutral-900 shadow-lg">
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#1DB954] to-emerald-600 flex items-center justify-center text-xl font-black text-black shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white truncate">
                  {user.displayName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] text-[10px] font-extrabold tracking-wide">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                Spotify ID: <span className="font-mono text-zinc-300">{user.id}</span>
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#1DB954] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                <span>Stateless JWE encrypted session active</span>
              </div>
            </div>
          </div>

          {/* Default Ticket Theme Selector */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-neutral-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                <Palette className="w-4 h-4 text-[#1DB954]" />
                <span>Default Ticket Stub Aesthetic</span>
              </div>
              <span className="text-[11px] font-semibold text-zinc-400">
                Auto-applies to new stubs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = selectedTheme === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectTheme(opt.id)}
                    className={`relative p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? `bg-neutral-850 border-white/40 shadow-lg ${opt.borderColor}`
                        : "bg-[#1f1f1f]/80 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: opt.dotColor }}
                        />
                        <span className="text-xs font-bold text-white">
                          {opt.title}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#1DB954] text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {opt.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PWA / Offline Action Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#161616] border border-neutral-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-extrabold text-white">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Stadium-Ready Offline PWA</span>
              </div>
              {isStandalone ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1DB954] px-2 py-0.5 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Installed App Mode</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-neutral-800">
                  Browser Mode
                </span>
              )}
            </div>

            <p className="text-xs text-[#B3B3B3] leading-relaxed">
              StagePass includes service worker caching for offline resilience in crowded concert arenas with weak cell reception.
            </p>

            {!isStandalone && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowInstallGuide((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#1DB954]" />
                  <span>{showInstallGuide ? "Hide Installation Guide" : "Install to Home Screen"}</span>
                </button>

                {showInstallGuide && (
                  <div className="mt-3 p-4 rounded-xl bg-black/60 border border-neutral-800 text-xs text-zinc-300 space-y-2 animate-in fade-in duration-200">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Add to iPhone or Android Home Screen:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
                      <li>
                        On <strong className="text-white">iOS Safari</strong>: Tap the <Share className="w-3 h-3 inline text-blue-400 mx-1" /> Share button in the bottom bar, then tap <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3 h-3 inline mx-1 text-zinc-300" />.
                      </li>
                      <li>
                        On <strong className="text-white">Android Chrome</strong>: Tap the menu (⋮) in the top right, then tap <strong className="text-white">Install App</strong>.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Architecture Badge */}
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#1DB954] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <div className="font-bold text-white">Stateless Security</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Your Spotify OAuth access token is sealed inside an encrypted JWE cookie (`stagepass_session`). StagePass has no database and never logs your Spotify credentials.
              </p>
            </div>
          </div>

          {/* Disconnect Action with Confirmation */}
          <div className="pt-2 border-t border-neutral-800/80">
            {isConfirmingDisconnect ? (
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/60 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Disconnect Spotify Account?</span>
                </div>
                <p className="text-[11px] text-red-200/80">
                  You will need to re-authenticate with Spotify to build new playlists. Your saved ticket stubs will remain safely archived in this browser.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      mediumTap();
                      logout();
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
                  >
                    Confirm Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDisconnect(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDisconnect(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-red-800/60 text-zinc-400 hover:text-red-400 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Spotify Session</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Unauthenticated View */
        <div className="p-8 rounded-2xl bg-[#161616] border border-neutral-800 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] flex items-center justify-center mx-auto">
            <User className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">
              Connect Your Spotify Account
            </h2>
            <p className="text-xs text-[#B3B3B3] max-w-sm mx-auto leading-relaxed">
              Connect Spotify to personalize your ticket stub defaults and sync live concert setlists straight to your music library.
            </p>
          </div>
          <button
            type="button"
            onClick={login}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-sm transition-all cursor-pointer"
          >
            <span>Connect with Spotify</span>
          </button>
        </div>
      )}
    </div>
  );
}
