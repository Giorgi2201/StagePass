"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useWizard } from "@/context/WizardContext";
import type { NormalizedArtist } from "@/types/setlist";
import { Search, X, Music, Disc3, Mic2, Sparkles, History } from "lucide-react";
import { lightTap } from "@/lib/haptics";

// Popular artists for quick zero-state discovery with verified MusicBrainz UUIDs and official Spotify avatars
const SUGGESTED_ARTISTS: NormalizedArtist[] = [
  {
    id: "381086ea-f511-4aba-bdf9-71c753dc5077",
    name: "Kendrick Lamar",
    disambiguation: "American rapper & songwriter",
    imageUrl: "https://i.scdn.co/image/ab6761610000517439ba6dcd4355c03de0b50918",
  },
  {
    id: "20244d07-534f-4eff-b4d4-930878889970",
    name: "Taylor Swift",
    disambiguation: "American pop / country artist",
    imageUrl: "https://i.scdn.co/image/ab67616100005174e2e8e7ff002a4afda1c7147e",
  },
  {
    id: "cc197bad-dc9c-440d-a5b5-d52ba2e14234",
    name: "Coldplay",
    disambiguation: "British rock band",
    imageUrl: "https://i.scdn.co/image/ab676161000051741ba8fc5f5c73e7e9313cc6eb",
  },
  {
    id: "a74b1b7f-71a5-4011-9441-d0b5e4122711",
    name: "Radiohead",
    disambiguation: "English alternative rock band",
    imageUrl: "https://i.scdn.co/image/ab67616100005174959527d2fabc9c64287e57b9",
  },
  {
    id: "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d",
    name: "The Beatles",
    disambiguation: "legendary rock band",
    imageUrl: "https://i.scdn.co/image/ab67616100005174119b61b35985e3b957c5ecb7",
  },
  {
    id: "67f66c07-6e61-4026-ade5-7e782fad3a5d",
    name: "Foo Fighters",
    disambiguation: "American rock band",
    imageUrl: "https://i.scdn.co/image/ab676161000051741db35bc9c01d2b1c151e44ce",
  },
];

function ArtistAvatar({ artist }: { artist: NormalizedArtist }) {
  const [hasError, setHasError] = useState(false);

  if (artist.imageUrl && !hasError) {
    return (
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 shadow-sm relative bg-[#242424]">
        <Image
          src={artist.imageUrl}
          alt={artist.name}
          width={48}
          height={48}
          className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-neutral-800 via-neutral-700 to-neutral-800 group-hover:from-purple-900 group-hover:to-pink-900 flex items-center justify-center shrink-0 shadow ring-1 ring-white/10 transition-colors">
      <Mic2 className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
    </div>
  );
}

export function StepSearch() {
  const { mode, setMode, artistQuery, setArtistQuery, selectArtist } = useWizard();
  const [results, setResults] = useState<NormalizedArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search (350ms)
  useEffect(() => {
    const trimmed = artistQuery.trim();
    if (!trimmed) {
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/setlist/artist?q=${encodeURIComponent(trimmed)}`);
        if (!ignore) {
          if (res.ok) {
            const data: NormalizedArtist[] = await res.json();
            setResults(data);
          } else {
            setResults([]);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to search artists:", err);
          setResults([]);
        }
      } finally {
        if (!ignore) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [artistQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setArtistQuery(value);
    if (!value.trim()) {
      setResults([]);
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setArtistQuery("");
    setResults([]);
    setIsSearching(false);
  };

  const hasQuery = Boolean(artistQuery.trim());
  const displayedArtists = hasQuery ? results : SUGGESTED_ARTISTS;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Spotify-Style Mode Switcher Pills */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Select Experience Mode
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Rehearsal Pill */}
          <button
            type="button"
            onClick={() => {
              lightTap();
              setMode("rehearsal");
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-[0.97] flex items-center gap-2 cursor-pointer ${
              mode === "rehearsal"
                ? "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/25"
                : "bg-[#282828] hover:bg-[#333333] text-white"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${mode === "rehearsal" ? "text-black" : "text-purple-400"}`} />
            <span>Pre-Concert Rehearsal</span>
          </button>

          {/* Memory Pill */}
          <button
            type="button"
            onClick={() => {
              lightTap();
              setMode("memory");
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-[0.97] flex items-center gap-2 cursor-pointer ${
              mode === "memory"
                ? "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/25"
                : "bg-[#282828] hover:bg-[#333333] text-white"
            }`}
          >
            <History className={`w-3.5 h-3.5 ${mode === "memory" ? "text-black" : "text-pink-400"}`} />
            <span>Post-Concert Memory</span>
          </button>
        </div>

        <p className="text-xs text-[#B3B3B3] leading-relaxed">
          {mode === "rehearsal"
            ? "Predict the tour setlist before attending so you can study the tracks and sing along to every encore."
            : "Relive an exact tour date you attended, preserving the exact live tracklist as a personalized playlist."}
        </p>
      </div>

      {/* Spotify Search Bar */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Find Performing Artist
        </div>
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={artistQuery}
            onChange={handleInputChange}
            placeholder="Search artists (e.g. Coldplay, Billie Eilish, Radiohead)..."
            className="w-full h-13 pl-12 pr-12 rounded-xl bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#282828] border border-transparent focus:border-white/30 text-white placeholder:text-[#B3B3B3] text-sm sm:text-base outline-none transition-all shadow-inner"
            autoFocus
          />
          {artistQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-neutral-700/60 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search State / Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {hasQuery ? "Search Results" : "Featured Artists"}
          </h2>
          {isSearching && (
            <span className="text-xs text-[#1DB954] flex items-center gap-1.5 font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
              Searching Setlist.fm...
            </span>
          )}
        </div>

        {/* Loading Skeletons */}
        {isSearching && results.length === 0 && (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-18 rounded-lg bg-[#181818] border border-neutral-800/80 p-3 flex items-center gap-3 animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-[#282828] shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-4 w-3/4 bg-[#282828] rounded" />
                  <div className="h-3 w-1/2 bg-[#282828]/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Search State */}
        {!isSearching && hasQuery && results.length === 0 && (
          <div className="p-8 sm:p-10 rounded-xl bg-[#181818] border border-neutral-800/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-zinc-500">
              <Music className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-white text-base">No primary artists found</div>
              <p className="text-xs sm:text-sm text-[#B3B3B3] max-w-md mx-auto leading-relaxed">
                No solo or headlining match found for &quot;{artistQuery}&quot; on Setlist.fm. Collaborative guest appearances were filtered out. Check the spelling or search another artist name.
              </p>
            </div>
          </div>
        )}

        {/* Artists Display Grid */}
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedArtists.map((artist) => {
            const isAlias =
              Boolean(artist.disambiguation) &&
              (artist.disambiguation!.toLowerCase().includes("formerly") ||
                artist.disambiguation!.toLowerCase().includes("aka") ||
                (hasQuery &&
                  artist.disambiguation!
                    .toLowerCase()
                    .includes(artistQuery.toLowerCase().trim())));

            return (
              <button
                key={artist.id}
                type="button"
                onClick={() => {
                  lightTap();
                  selectArtist(artist);
                }}
                className="group relative flex items-center gap-3.5 p-3 rounded-lg bg-[#181818] hover:bg-[#242424] active:scale-[0.98] transition-all text-left border border-neutral-800/80 hover:border-[#1DB954]/50 shadow-md cursor-pointer"
              >
                {/* Circular Avatar / Image */}
                <ArtistAvatar artist={artist} />

                {/* Text Meta */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-sm text-white truncate group-hover:text-[#1DB954] transition-colors">
                    {artist.name}
                  </div>
                  {artist.disambiguation ? (
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] max-w-full truncate ${
                          isAlias
                            ? "bg-[#1DB954]/20 text-[#1ed760] border border-[#1DB954]/40 font-semibold"
                            : "bg-neutral-800/90 text-zinc-300 border border-neutral-700/60 font-medium"
                        }`}
                        title={artist.disambiguation}
                      >
                        <span className="truncate">{artist.disambiguation}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 truncate mt-1">
                      Artist on tour
                    </div>
                  )}
                </div>

                {/* Action Indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-1 text-[#1DB954]">
                  <Disc3 className="w-4 h-4 animate-spin-slow" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
