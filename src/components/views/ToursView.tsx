"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useNavigation } from "@/context/NavigationContext";
import { useWizard } from "@/context/WizardContext";
import type { NormalizedArtist, NormalizedShow, CitySearchResponse } from "@/types/setlist";
import {
  Flame,
  MapPin,
  Calendar,
  Loader2,
  Search,
  X,
  Music2,
  ListMusic,
} from "lucide-react";
import { mediumTap, tickHaptic } from "@/lib/haptics";
import { useScrollFade } from "@/hooks/useScrollFade";

interface TrendingTour {
  id: string; // MusicBrainz ID (mbid)
  artistName: string;
  tourName: string;
  timeframe: string;
  keyCities: string;
  averageSongs: number;
  genre: string;
  imageUrl: string;
}

const WORLD_TOURS: TrendingTour[] = [
  {
    id: "381086ea-f511-4aba-bdf9-71c753dc5077",
    artistName: "Kendrick Lamar",
    tourName: "The Grand National Tour",
    timeframe: "2025 – 2026 World Stadium Tour",
    keyCities: "Los Angeles, London, Paris, Tokyo",
    averageSongs: 26,
    genre: "Hip-Hop",
    imageUrl: "https://i.scdn.co/image/ab6761610000517439ba6dcd4355c03de0b50918",
  },
  {
    id: "cc197bad-dc9c-440d-a5b5-d52ba2e14234",
    artistName: "Coldplay",
    tourName: "Music of the Spheres World Tour",
    timeframe: "2024 – 2025 Global Stadium Run",
    keyCities: "London, Mumbai, Seoul, Sydney",
    averageSongs: 24,
    genre: "Alternative / Pop Rock",
    imageUrl: "https://i.scdn.co/image/ab676161000051741ba8fc5f5c73e7e9313cc6eb",
  },
  {
    id: "f4abc0b5-3f7a-4eff-8f78-ac078dbce533",
    artistName: "Billie Eilish",
    tourName: "Hit Me Hard and Soft: The Tour",
    timeframe: "2024 – 2025 Arena World Tour",
    keyCities: "New York, Toronto, Berlin, London",
    averageSongs: 22,
    genre: "Alternative Pop",
    imageUrl: "https://i.scdn.co/image/ab676161000051744a21b4760d2ecb7b0dcdc8da",
  },
  {
    id: "39ab1aed-75e0-4140-bd47-540276886b60",
    artistName: "Oasis",
    tourName: "Live '25 World Tour",
    timeframe: "2025 Historic Reunion Tour",
    keyCities: "Manchester, London, Dublin, Chicago",
    averageSongs: 21,
    genre: "Britpop / Rock",
    imageUrl: "https://i.scdn.co/image/ab67616100005174b4ddbc39706ef0f2ae0f7c9b",
  },
  {
    id: "20244d07-534f-4eff-b4d4-930878889970",
    artistName: "Taylor Swift",
    tourName: "The Eras Tour",
    timeframe: "Record-Breaking Global Stadium Tour",
    keyCities: "Vancouver, London, Tokyo, Singapore",
    averageSongs: 44,
    genre: "Pop / Singer-Songwriter",
    imageUrl: "https://i.scdn.co/image/ab67616100005174e2e8e7ff002a4afda1c7147e",
  },
  {
    id: "1882fe91-cdd9-49c9-9956-8e06a3810bd4",
    artistName: "Sabrina Carpenter",
    tourName: "Short n' Sweet Tour",
    timeframe: "2024 – 2025 International Arena Tour",
    keyCities: "Los Angeles, New York, London, Paris",
    averageSongs: 21,
    genre: "Pop",
    imageUrl: "https://i.scdn.co/image/ab6761610000517478e45cfa4697ce3c437cb455",
  },
  {
    id: "6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f",
    artistName: "Dua Lipa",
    tourName: "Radical Optimism Tour",
    timeframe: "2024 – 2025 Global Arena Tour",
    keyCities: "Singapore, Tokyo, London, Madrid",
    averageSongs: 23,
    genre: "Dance Pop / Disco",
    imageUrl: "https://i.scdn.co/image/ab676161000051740c68f6c95232e716f0abee8d",
  },
  {
    id: "67f66c07-6e61-4026-ade5-7e782fad3a5d",
    artistName: "Foo Fighters",
    tourName: "Everything or Nothing at All Tour",
    timeframe: "2024 – 2025 Stadium & Festival Tour",
    keyCities: "Denver, London, Manchester, Seattle",
    averageSongs: 24,
    genre: "Hard Rock / Alternative",
    imageUrl: "https://i.scdn.co/image/ab676161000051741db35bc9c01d2b1c151e44ce",
  },
];

const POPULAR_CITIES = [
  "London",
  "New York",
  "Atlanta",
  "Berlin",
  "Paris",
  "Tokyo",
];

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "LIVE 2026";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const year = parts[2];
    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    const month = months[monthNum - 1] || "LIVE";
    return `${month} ${day}, ${year}`;
  }
  return dateStr;
}

export function ToursView() {
  const { setActiveTab } = useNavigation();
  const { generateRehearsalSetlist, selectShow } = useWizard();

  // Top view switcher: 'tours' vs 'city'
  const [viewMode, setViewMode] = useState<"tours" | "city">("tours");

  // World tours state
  const [loadingTourId, setLoadingTourId] = useState<string | null>(null);

  // City search state
  const [cityInput, setCityInput] = useState("");
  const [searchedCity, setSearchedCity] = useState("");
  const [cityShows, setCityShows] = useState<NormalizedShow[]>([]);
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [loadingShowId, setLoadingShowId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Dynamic smooth scroll fade observer for popular city chips
  const popularCitiesScroll = useScrollFade<HTMLDivElement>({ fadeSize: 20 });

  // Fetch concerts by city
  const fetchCityShows = useCallback(async (city: string) => {
    const trimmed = city.trim();
    if (trimmed.length < 2) return;

    setIsLoadingCity(true);
    setCityError(null);
    setSearchedCity(trimmed);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/setlist/city?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error searching concerts in ${trimmed}`);
      }
      const data: CitySearchResponse = await res.json();
      setCityShows(data.shows || []);
    } catch (err) {
      console.error("City concerts search failed:", err);
      setCityError(err instanceof Error ? err.message : "Failed to load concerts");
      setCityShows([]);
    } finally {
      setIsLoadingCity(false);
    }
  }, []);

  // Debounced search on city input changes
  useEffect(() => {
    if (viewMode !== "city") return;
    const trimmed = cityInput.trim();
    if (trimmed.length < 2) return;

    // Skip redundant search if identical to current results
    if (trimmed.toLowerCase() === searchedCity.toLowerCase() && hasSearched) return;

    const timer = setTimeout(() => {
      fetchCityShows(trimmed);
    }, 350);

    return () => clearTimeout(timer);
  }, [cityInput, viewMode, searchedCity, hasSearched, fetchCityShows]);

  // Instant search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchCityShows(cityInput);
    }
  };

  // Select chip
  const handleSelectCityChip = (city: string) => {
    mediumTap();
    setCityInput(city);
    fetchCityShows(city);
  };

  // Clear input
  const handleClearInput = () => {
    setCityInput("");
    tickHaptic();
  };

  // 1-Tap Rehearsal Consensus Action
  const handleStudyRehearsal = async (tour: TrendingTour) => {
    mediumTap();
    setLoadingTourId(tour.id);

    const artist: NormalizedArtist = {
      id: tour.id,
      name: tour.artistName,
      imageUrl: tour.imageUrl,
    };

    setActiveTab("setlists");
    try {
      await generateRehearsalSetlist(artist);
    } finally {
      setLoadingTourId(null);
    }
  };

  // 1-Tap Post-Concert Memory Mode Launch
  const handleViewConcertSetlist = async (show: NormalizedShow) => {
    mediumTap();
    setLoadingShowId(show.id);
    setActiveTab("setlists");
    try {
      await selectShow(show);
    } finally {
      setLoadingShowId(null);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="pb-4 border-b border-neutral-800/80 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
          {viewMode === "tours" ? (
            <>
              <Flame className="w-3.5 h-3.5" />
              <span>Active World Tours Radar</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-[#1DB954]" />
              <span className="text-[#1DB954]">Local Music Radar</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {viewMode === "tours" ? "Trending Concert Setlists" : "Recent Concerts by City"}
        </h1>
        <p className="text-xs sm:text-sm text-[#B3B3B3]">
          {viewMode === "tours"
            ? "Live tour tracking for headlining artists currently touring worldwide. Tap any tour to instantly analyze their average setlist consensus."
            : "Explore verified live concerts and recorded setlists recently played in cities around the world. Tap any show to view tracks and export."}
        </p>
      </div>

      {/* Top Segmented View Switcher */}
      <div className="bg-white/5 border border-white/10 rounded-full p-1 w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => {
            mediumTap();
            setViewMode("tours");
          }}
          className={`flex-1 h-10 sm:h-11 flex items-center justify-center gap-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            viewMode === "tours"
              ? "bg-white/15 text-white font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Flame className={`w-4 h-4 shrink-0 ${viewMode === "tours" ? "text-orange-400" : ""}`} />
          <span className="whitespace-nowrap">Active World Tours</span>
        </button>

        <button
          type="button"
          onClick={() => {
            mediumTap();
            setViewMode("city");
          }}
          className={`flex-1 h-10 sm:h-11 flex items-center justify-center gap-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
            viewMode === "city"
              ? "bg-white/15 text-white font-semibold shadow-sm"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <MapPin className={`w-4 h-4 shrink-0 ${viewMode === "city" ? "text-[#1DB954]" : ""}`} />
          <span className="whitespace-nowrap">Concerts by City</span>
        </button>
      </div>

      {/* VIEW: Active World Tours */}
      {viewMode === "tours" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 animate-in fade-in duration-200">
          {WORLD_TOURS.map((tour) => {
            const isLoading = loadingTourId === tour.id;

            return (
              <div
                key={tour.id}
                className="group relative rounded-2xl bg-[#161616] border border-neutral-800 hover:border-neutral-700 p-5 sm:p-6 hover:bg-[#1a1a1a] transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden"
              >
                {/* Top Row: Artist Avatar & Title */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-neutral-700 group-hover:ring-[#1DB954] transition-all shrink-0 bg-neutral-900 shadow-md">
                      <Image
                        src={tour.imageUrl}
                        alt={tour.artistName}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1DB954]">
                          {tour.genre}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-neutral-600" />
                        <span className="text-[10px] text-zinc-400 font-mono">
                          ~{tour.averageSongs} songs
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-white truncate group-hover:text-[#1DB954] transition-colors leading-tight">
                        {tour.artistName}
                      </h3>

                      <p className="text-xs font-semibold text-zinc-300 truncate">
                        {tour.tourName}
                      </p>
                    </div>
                  </div>

                  {/* Tour Info Box */}
                  <div className="p-3 rounded-xl bg-black/40 border border-neutral-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300 font-medium truncate">
                      <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="truncate">{tour.timeframe}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                      <span className="truncate">{tour.keyCities}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action: Single High-Impact Primary Button */}
                <div className="pt-3 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => handleStudyRehearsal(tour)}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Calculating Consensus...</span>
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4 fill-black text-black" />
                        <span>Study Tour Setlist</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: Concerts by City */}
      {viewMode === "city" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* City Search Bar & Popular Chips */}
          <div className="space-y-3">
            <div className="relative w-full">
              <div className="h-12 rounded-xl bg-white/[0.06] border border-white/15 px-4 text-white focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 transition-all flex items-center gap-3 w-full">
                <Search className="w-5 h-5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search concerts by city (e.g. London, Atlanta, Berlin)..."
                  className="bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base outline-none flex-1 min-w-0"
                />
                {cityInput && (
                  <button
                    type="button"
                    onClick={handleClearInput}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick-Tap City Chips */}
            <div className="flex items-center gap-2 max-w-full">
              <span className="text-xs text-neutral-400 font-medium shrink-0 select-none">
                Popular:
              </span>
              <div
                ref={popularCitiesScroll}
                className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 scroll-fade-both"
              >
                {POPULAR_CITIES.map((city) => {
                  const isSelected = Boolean(searchedCity) && city.toLowerCase() === searchedCity.toLowerCase();
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelectCityChip(city)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-white/15 border border-white/25 text-white"
                          : "bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white"
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {cityError && !isLoadingCity && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-center space-y-1 max-w-md mx-auto">
              <p className="text-xs text-red-300 font-semibold">{cityError}</p>
              <button
                type="button"
                onClick={() => fetchCityShows(searchedCity || "London")}
                className="text-xs text-white underline hover:text-neutral-200 mt-1 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoadingCity && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#181818] border border-white/10 p-4 flex flex-col justify-between space-y-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-white/10 rounded" />
                      <div className="h-3 w-1/2 bg-white/5 rounded" />
                    </div>
                    <div className="w-16 h-6 bg-white/10 rounded-lg shrink-0" />
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                    <div className="h-3 w-1/3 bg-white/5 rounded" />
                  </div>

                  <div className="h-11 w-full bg-white/10 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Results Grid */}
          {!isLoadingCity && cityShows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {cityShows.map((show) => {
                const isLoadingShow = loadingShowId === show.id;

                return (
                  <div
                    key={show.id}
                    className="group rounded-2xl bg-[#181818] border border-white/10 hover:border-white/25 p-4 flex flex-col justify-between space-y-4 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {/* Header Row: Circular artist portrait, Artist Name, Event Date Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-white/10 shrink-0 bg-neutral-900 flex items-center justify-center shadow-inner">
                          {show.artistImageUrl ? (
                            <Image
                              src={show.artistImageUrl}
                              alt={show.artistName}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Music2 className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-base truncate group-hover:text-[#1DB954] transition-colors leading-snug">
                            {show.artistName}
                          </h3>
                          {show.tourName ? (
                            <p className="text-xs text-neutral-400 truncate">
                              {show.tourName}
                            </p>
                          ) : (
                            <p className="text-xs text-neutral-400 truncate">
                              {show.cityName} Live
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Event Date Badge: Month & Day */}
                      <div className="px-2 py-1 rounded-lg bg-black/60 border border-white/10 font-mono text-[10px] font-semibold text-zinc-300 shrink-0 whitespace-nowrap">
                        {formatDisplayDate(show.eventDate)}
                      </div>
                    </div>

                    {/* Venue & Show Info */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                      <div className="font-semibold text-white text-sm truncate">
                        {show.venueName}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                          <span className="truncate">{show.cityName}{show.countryName ? `, ${show.countryName}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 font-mono text-zinc-300">
                          <Music2 className="w-3 h-3 text-[#1DB954]" />
                          <span>{show.songCount} {show.songCount === 1 ? "song" : "songs"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => handleViewConcertSetlist(show)}
                      disabled={isLoadingShow}
                      className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingShow ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Loading Setlist...</span>
                        </>
                      ) : (
                        <>
                          <ListMusic className="w-4 h-4 text-white/90" />
                          <span>View Concert Setlist</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Initial State before search */}
          {!isLoadingCity && cityShows.length === 0 && !hasSearched && !cityError && (
            <div className="p-8 sm:p-12 rounded-2xl bg-[#161616] border border-white/10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center mx-auto text-[#1DB954]">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Discover Live Concerts
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Type a city above or tap a popular hub like London, New York, or Atlanta to explore verified recent concerts and setlists.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingCity && cityShows.length === 0 && hasSearched && !cityError && (
            <div className="p-8 sm:p-12 rounded-2xl bg-[#161616] border border-white/10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  No Concerts Found
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  No completed concerts with setlists found in &apos;{searchedCity}&apos;. Try another major city or check your spelling.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
