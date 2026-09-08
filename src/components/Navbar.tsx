"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { Ticket, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
