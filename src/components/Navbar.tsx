"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { Ticket, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout, login } = useAuth();
  const { activeTab, setActiveTab, tabs } = useNavigation();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121212]/90 backdrop-blur-xl border-b border-[#282828] pt-safe transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo (Clicking switches to Setlists tab) */}
        <button
          type="button"
          onClick={() => setActiveTab("setlists")}
          className="flex items-center gap-3 cursor-pointer text-left outline-none group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 p-[1.5px] flex items-center justify-center shadow-md shadow-[#1DB954]/20 shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center">
              <Ticket className="w-4 h-4 text-[#1DB954]" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-[#1DB954] transition-colors">
              StagePass
            </span>
          </div>
        </button>

        {/* Desktop Navigation Bar (hidden md:flex) */}
        <nav
          aria-label="Desktop Navigation"
          className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full p-1 gap-1 shadow-sm"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 transition-all text-sm cursor-pointer outline-none ${
                  isActive
                    ? "bg-white/10 text-white font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-[#1DB954]" : "text-neutral-400"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Auth Action Section */}
        <div className="flex items-center gap-3 shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-zinc-400 text-xs animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              <span className="hidden sm:inline">Checking session...</span>
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* User Profile Badge (Clickable shortcut to Profile tab) */}
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                title="View Profile & Settings"
                className={`flex items-center gap-2.5 rounded-full py-1 px-1.5 sm:pr-3 backdrop-blur-md transition-all cursor-pointer text-left outline-none ${
                  activeTab === "profile"
                    ? "bg-[#1DB954]/15 border border-[#1DB954]/50 shadow-sm"
                    : "bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800/90 hover:border-neutral-700"
                }`}
              >
                {user.avatarUrl ? (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-emerald-500/60 shrink-0">
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName}
                      fill
                      sizes="28px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-200 leading-tight max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Spotify Connected
                  </span>
                </div>
              </button>

              {/* Disconnect Button */}
              <button
                onClick={() => logout()}
                title="Disconnect Spotify account"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-zinc-400 hover:text-red-400 hover:border-red-900/60 hover:bg-red-950/20 text-xs font-medium transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subtle Guest Mode Indicator Badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/90 animate-pulse" />
                Guest Mode
              </span>

              {/* Clean Connect Spotify Pill Button */}
              <button
                type="button"
                onClick={login}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-extrabold shadow-md shadow-[#1DB954]/20 hover:shadow-[#1DB954]/35 active:scale-[0.97] transition-all cursor-pointer"
                title="Connect Spotify to save playlists to your personal library"
              >
                <svg
                  className="w-3.5 h-3.5 fill-black shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
                </svg>
                <span>Connect Spotify</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
