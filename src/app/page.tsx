"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { WizardProvider } from "@/context/WizardContext";
import { WizardContainer } from "@/components/wizard/WizardContainer";
import { StubsView } from "@/components/views/StubsView";
import { ToursView } from "@/components/views/ToursView";
import { ProfileView } from "@/components/views/ProfileView";
import {
  Ticket,
  Music2,
  Radio,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Headphones,
  Disc3,
  Flame,
  Layers,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const { activeTab } = useNavigation();

  return (
    <WizardProvider>
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-[#181818] via-[#121212] to-[#121212]">
        {/* Inline Document Skeleton */}
        {isLoading ? (
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] animate-pulse space-y-4">
              <div className="h-6 w-36 bg-[#242424] rounded-full" />
              <div className="h-10 w-2/3 bg-[#242424] rounded-lg" />
              <div className="h-4 w-1/2 bg-[#242424] rounded" />
            </div>
          </main>
        ) : activeTab === "stubs" ? (
          /* =========================================================
              MY STUBS ARCHIVE TAB VIEW
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <StubsView />
            </div>
          </main>
        ) : activeTab === "tours" ? (
          /* =========================================================
              TRENDING TOURS TAB VIEW
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <ToursView />
            </div>
          </main>
        ) : activeTab === "profile" ? (
          /* =========================================================
              USER PROFILE & SETTINGS TAB VIEW
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <ProfileView />
            </div>
          </main>
        ) : isAuthenticated && user ? (
          /* =========================================================
              AUTHENTICATED VIEW: FOCUSED SPOTIFY WIZARD WORKSPACE
              Clean, distraction-free application workspace with no
              marketing cards or duplicate headers.
             ========================================================= */
          <main className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-12 flex-1 flex flex-col relative z-10">
            <div className="p-4 sm:p-8 rounded-2xl bg-[#181818] border border-[#282828] shadow-2xl">
              <WizardContainer />
            </div>
          </main>
        ) : (
        /* =========================================================
            UNAUTHENTICATED VIEW: SPOTIFY CONNECT HERO & VALUE PROPOSITION
            Single primary CTA with 3 feature cards below.
           ========================================================= */
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 md:pb-12 flex-1 flex flex-col justify-between relative z-10 space-y-12">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-[#181818] border border-[#282828] p-6 sm:p-12 shadow-2xl">
            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/25 text-[#1DB954] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#1DB954]" />
                <span>The Live Music Companion</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Turn Live Concerts Into{" "}
                <span className="text-[#1DB954]">
                  Instant Playlists.
                </span>
              </h1>

              <p className="text-[#B3B3B3] text-sm sm:text-base leading-relaxed">
                Connect your Spotify account to discover verified setlists from
                recent tours, sync them into your Spotify library before or
                after the encore, and generate custom souvenir ticket stubs.
              </p>

              {/* Main Connect Spotify Action - Single, clear primary CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={login}
                  className="group inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm sm:text-base shadow-xl shadow-[#1DB954]/25 hover:shadow-[#1DB954]/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg
                    className="w-5 h-5 fill-black shrink-0"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.216.353-.674.467-1.027.25-2.813-1.718-6.354-2.107-10.526-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.606 11.638 1.328.353.216.467.674.25 1.027zm1.467-3.262c-.272.441-.849.582-1.29.31-3.22-1.979-8.128-2.551-11.936-1.394-.497.151-1.029-.133-1.18-.63-.151-.497.133-1.029.63-1.18 4.354-1.322 9.774-.684 13.466 1.583.441.272.582.849.31 1.291zm.126-3.41c-3.861-2.293-10.223-2.504-13.889-1.391-.592.18-1.223-.155-1.403-.747-.18-.592.155-1.223.747-1.403 4.218-1.28 11.238-1.033 15.688 1.609.533.316.707 1.009.391 1.542-.316.533-1.009.707-1.542.391z" />
                  </svg>
                  <span>Connect with Spotify</span>
                  <ArrowRight className="w-4 h-4 text-black/70 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-2 text-xs text-zinc-500 justify-center sm:justify-start">
                  <ShieldCheck className="w-4 h-4 text-[#1DB954] shrink-0" />
                  <span>Stateless JWE encrypted session. Zero database.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Showcase: Concert Prep & Memory Suite (Landing Mode Only) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-zinc-200 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1DB954]" />
                <span>Concert Prep & Memory Suite</span>
              </h2>
              <span className="text-xs text-zinc-500 font-medium">
                StagePass Features
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Setlist to Spotify */}
              <div className="group relative rounded-2xl bg-[#181818] border border-[#282828] p-5 hover:border-[#1DB954]/50 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 border border-[#1DB954]/20 text-[#1DB954] flex items-center justify-center">
                      <Music2 className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 text-[#1DB954] text-[10px] font-semibold">
                      LIVE
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#1DB954] transition-colors">
                    Setlist to Spotify
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed">
                    Search millions of real concert setlists from Setlist.fm and
                    automatically convert the verified tour tracks into a clean
                    Spotify playlist with one tap.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#282828] flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Headphones className="w-3.5 h-3.5 text-[#1DB954]" />
                    Full Track Sync
                  </span>
                  <span className="text-[#1DB954] font-medium">Active</span>
                </div>
              </div>

              {/* Card 2: Digital Ticket Stubs */}
              <div className="group relative rounded-2xl bg-[#181818] border border-[#282828] p-5 hover:border-white/20 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#242424] border border-[#282828] text-white flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#242424] border border-[#282828] text-emerald-400 text-[10px] font-semibold">
                      READY
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    Digital Ticket Stubs
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed">
                    Turn your live experiences into retro, collectible digital
                    ticket stubs featuring authentic tour artwork, custom dates,
                    and exportable high-res PNGs.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#282828] flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Disc3 className="w-3.5 h-3.5 text-amber-400" />
                    HTML5 Canvas Export
                  </span>
                  <span className="text-emerald-400 font-medium">Live Studio</span>
                </div>
              </div>

              {/* Card 3: Stadium-Ready Offline PWA */}
              <div className="group relative rounded-2xl bg-[#181818] border border-[#282828] p-5 hover:border-white/20 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#242424] border border-[#282828] text-[#1DB954] flex items-center justify-center">
                      <Radio className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#242424] border border-[#282828] text-[#1DB954] text-[10px] font-semibold">
                      PWA ACTIVE
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Stadium-Ready PWA
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed">
                    Engineered with aggressive client-side service worker caching
                    and standalone installability for iOS and Android so you can
                    access your setlists inside crowded arenas.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#282828] flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Flame className="w-3.5 h-3.5 text-[#1DB954]" />
                    Installable PWA
                  </span>
                  <span className="text-[#1DB954] font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Landing Page Footer */}
          <footer className="pt-8 pb-4 border-t border-[#282828] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <p className="text-zinc-400 font-medium">
              StagePass • Concert Setlists to Spotify Playlists
            </p>
            <p>
              Powered by Setlist.fm & Spotify Web API
            </p>
          </footer>
        </main>
      )}
    </div>
  </WizardProvider>
  );
}
