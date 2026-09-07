"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Ticket, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121212]/90 backdrop-blur-xl border-b border-[#282828] pt-safe transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1DB954] to-emerald-400 p-[1.5px] flex items-center justify-center shadow-md shadow-[#1DB954]/20 shrink-0">
            <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center">
              <Ticket className="w-4 h-4 text-[#1DB954]" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
              StagePass
            </span>
          </div>
        </div>

        {/* Auth Action Section */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-zinc-400 text-xs animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              <span className="hidden sm:inline">Checking session...</span>
            </div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* User Profile Badge */}
              <div className="flex items-center gap-2.5 bg-neutral-900/80 border border-neutral-800/90 rounded-full py-1 px-1.5 sm:pr-3 backdrop-blur-md">
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
              </div>

              {/* Disconnect Button */}
              <button
                onClick={() => logout()}
                title="Disconnect Spotify account"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-zinc-400 hover:text-red-400 hover:border-red-900/60 hover:bg-red-950/20 text-xs font-medium transition-all"
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
