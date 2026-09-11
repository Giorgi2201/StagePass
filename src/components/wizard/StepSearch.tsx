"use client";

import React, { useEffect, useState, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { useWizard } from "@/context/WizardContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import type { NormalizedArtist, NormalizedShow, CitySearchResponse } from "@/types/setlist";
import { getSavedTicketStubs, type SavedTicket } from "@/lib/storage";
import { TicketModal } from "@/components/ticket/TicketModal";
import {
  Search,
  X,
  Music,
  Disc3,
  Mic2,
  Ticket,
  MapPin,
  ExternalLink,
  ArrowRight,
  Music2,
  TrendingUp,
  Flame,
  ListMusic,
  Loader2,
} from "lucide-react";
import { lightTap, mediumTap } from "@/lib/haptics";
import { useScrollFade } from "@/hooks/useScrollFade";

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

const QUICK_TAGS = [
  "Kendrick Lamar",
  "Coldplay",
  "Taylor Swift",
  "Oasis",
  "Billie Eilish",
  "Radiohead",
];

const TRENDING_TOURS = [
  {
    id: "381086ea-f511-4aba-bdf9-71c753dc5077",
    artistName: "Kendrick Lamar",
    tourName: "The Grand National Tour",
    scaleBadge: "Global Stadium Tour",
    locationSummary: "North America, Europe & Australia",
    imageUrl: "https://i.scdn.co/image/ab6761610000517439ba6dcd4355c03de0b50918",
  },
  {
    id: "cc197bad-dc9c-440d-a5b5-d52ba2e14234",
    artistName: "Coldplay",
    tourName: "Music of the Spheres World Tour",
    scaleBadge: "Global Stadium Tour",
    locationSummary: "UK, Asia & Oceania",
    imageUrl: "https://i.scdn.co/image/ab676161000051741ba8fc5f5c73e7e9313cc6eb",
  },
  {
    id: "39ab1aed-75e0-4140-bd47-540276886b60",
    artistName: "Oasis",
    tourName: "Live '25 World Tour",
    scaleBadge: "Historic Reunion Stadium Tour",
    locationSummary: "UK, Ireland, North America",
    imageUrl: "https://i.scdn.co/image/ab67616100005174b4ddbc39706ef0f2ae0f7c9b",
  },
  {
    id: "f4abc0b5-3f7a-4eff-8f78-ac078dbce533",
    artistName: "Billie Eilish",
    tourName: "Hit Me Hard and Soft: The Tour",
    scaleBadge: "Arena World Tour",
    locationSummary: "North America, Europe, Australia",
    imageUrl: "https://i.scdn.co/image/ab676161000051744a21b4760d2ecb7b0dcdc8da",
  },
  {
    id: "6f1a58bf-9b1b-49cf-a44a-6cefad7ae04f",
    artistName: "Dua Lipa",
    tourName: "Radical Optimism Tour",
    scaleBadge: "Global Arena & Stadium Tour",
    locationSummary: "Asia, Europe, North America",
    imageUrl: "https://i.scdn.co/image/ab676161000051740c68f6c95232e716f0abee8d",
  },
  {
    id: "20244d07-534f-4eff-b4d4-930878889970",
    artistName: "Taylor Swift",
    tourName: "The Eras Tour",
    scaleBadge: "Record-Breaking Stadium Tour",
    locationSummary: "North America, Europe, Asia",
    imageUrl: "https://i.scdn.co/image/ab67616100005174e2e8e7ff002a4afda1c7147e",
  },
];

const RADAR_CITIES = ["London", "New York", "Atlanta", "Berlin", "Paris"];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }
  if (hour >= 12 && hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

function formatStubDate(dateStr: string): string {
  if (!dateStr) return "LIVE SHOW";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const year = parts[2];
    const monthNames = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    const month = monthNames[monthNum - 1] || "CON";
    return `${month} ${day}, ${year}`;
  }
  return dateStr.toUpperCase();
}

function formatShowDateBadge(dateStr: string): string {
  if (!dateStr) return "RECENT";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthNames = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    const month = monthNames[monthNum - 1] || "DATE";
    return `${month} ${day}`;
  }
  return dateStr;
}

function ArtistAvatar({ artist }: { artist: NormalizedArtist }) {
  const [hasError, setHasError] = useState(false);

  if (artist.imageUrl && !hasError) {
    return (
      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 shadow-sm relative bg-[#242424]">
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
    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-neutral-800 via-neutral-700 to-neutral-800 group-hover:from-neutral-700 group-hover:to-neutral-600 flex items-center justify-center shrink-0 shadow ring-1 ring-white/10 transition-colors">
      <Mic2 className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
    </div>
  );
}

export function StepSearch() {
  const {
    artistQuery,
    setArtistQuery,
    selectArtist,
    generateRehearsalSetlist,
    selectShow,
  } = useWizard();
  const { user, isAuthenticated } = useAuth();
  const { setActiveTab } = useNavigation();

  const [results, setResults] = useState<NormalizedArtist[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedTickets, setSavedTickets] = useState<SavedTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SavedTicket | null>(null);

  // Trending tour & local radar interactive states
  const [rehearsingTourId, setRehearsingTourId] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState("London");
  const [cityShows, setCityShows] = useState<NormalizedShow[]>([]);
  const [isLoadingCityShows, setIsLoadingCityShows] = useState(false);
  const [loadingCityShowId, setLoadingCityShowId] = useState<string | null>(null);

  const isMac = useSyncExternalStore(
    () => () => {},
    () => /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || ""),
    () => false
  );
  const shortcutText = isMac ? "⌘K" : "Ctrl+K";
  const greeting = getTimeGreeting();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic smooth scroll fade observers for horizontal containers
  const quickTagsScroll = useScrollFade<HTMLDivElement>({ fadeSize: 20 });
  const jumpBackInScroll = useScrollFade<HTMLDivElement>({ fadeSize: 24 });
  const trendingToursScroll = useScrollFade<HTMLDivElement>({ fadeSize: 24 });
  const radarCitiesScroll = useScrollFade<HTMLDivElement>({ fadeSize: 20 });
  const cityShowsScroll = useScrollFade<HTMLDivElement>({ fadeSize: 24 });

  // Global keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load saved ticket stubs and keep updated
  useEffect(() => {
    function loadTickets() {
      setSavedTickets(getSavedTicketStubs());
    }
    loadTickets();
    window.addEventListener("stagepass_tickets_updated", loadTickets);
    return () => {
      window.removeEventListener("stagepass_tickets_updated", loadTickets);
    };
  }, []);

  // Fetch local concert radar shows when activeCity changes
  useEffect(() => {
    let ignore = false;
    async function fetchCity(city: string) {
      setIsLoadingCityShows(true);
      try {
        const res = await fetch(`/api/setlist/city?q=${encodeURIComponent(city)}`);
        if (!res.ok) throw new Error("Failed to load city concerts");
        const data: CitySearchResponse = await res.json();
        if (!ignore) {
          setCityShows(data.shows?.slice(0, 6) || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Local radar fetch error:", err);
          setCityShows([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingCityShows(false);
        }
      }
    }

    fetchCity(activeCity);

    return () => {
      ignore = true;
    };
  }, [activeCity]);

  // Debounced artist search (350ms)
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
    searchInputRef.current?.focus();
  };

  // 1-Tap Rehearse Action from Trending World Tours
  const handleRehearseTour = async (tour: (typeof TRENDING_TOURS)[number]) => {
    mediumTap();
    setRehearsingTourId(tour.id);
    const artist: NormalizedArtist = {
      id: tour.id,
      name: tour.artistName,
      imageUrl: tour.imageUrl,
    };
    try {
      await generateRehearsalSetlist(artist);
    } finally {
      setRehearsingTourId(null);
    }
  };

  // 1-Tap View Setlist Action from Local Radar
  const handleViewCityShow = async (show: NormalizedShow) => {
    mediumTap();
    setLoadingCityShowId(show.id);
    try {
      await selectShow(show);
    } finally {
      setLoadingCityShowId(null);
    }
  };

  const hasQuery = Boolean(artistQuery.trim());
  const displayedArtists = hasQuery ? results : SUGGESTED_ARTISTS;
  const recentTickets = savedTickets.slice(0, 6);

  return (
    <div className="space-y-10 md:space-y-12 animate-in fade-in duration-300">
      {/* =========================================================
          1. HERO COMMAND BAR & GREETING
         ========================================================= */}
      <div className="space-y-4">
        {/* Dynamic Greeting & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {isAuthenticated && user?.displayName ? (
              <>
                {greeting}, <span className="text-[#1DB954]">{user.displayName}</span>
              </>
            ) : (
              <>
                Welcome to StagePass <span className="text-neutral-500 font-light">•</span>{" "}
                <span className="text-[#1DB954]">Live Music Hub</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 font-medium max-w-2xl leading-relaxed">
            Turn live concert setlists into verified playlists &amp; commemorative ticket stubs.
          </p>
        </div>

        {/* Command Search Bar */}
        <div className="space-y-2.5">
          <div className="relative flex items-center w-full h-12 md:h-14 px-4 md:px-5 rounded-2xl bg-[#181818] hover:bg-[#202020] focus-within:bg-[#222222] border border-white/10 hover:border-white/20 focus-within:border-[#1DB954]/60 focus-within:ring-2 focus-within:ring-[#1DB954]/20 transition-all shadow-xl">
            <Search className="w-5 h-5 text-[#1DB954] shrink-0 mr-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="artist-search-input"
              type="text"
              value={artistQuery}
              onChange={handleInputChange}
              placeholder="Search artists, bands, or world tours (e.g. Coldplay, Kendrick Lamar)..."
              className="w-full h-full bg-transparent text-white placeholder:text-neutral-500 text-sm md:text-base outline-none truncate font-medium"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Desktop Shortcut Badge */}
            {!artistQuery && (
              <div className="hidden md:flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono font-bold text-neutral-400 pointer-events-none select-none ml-2 shrink-0">
                {shortcutText}
              </div>
            )}

            {/* Clear Button */}
            {artistQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors ml-2 shrink-0 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Suggestion Search Chips */}
          <div className="flex items-center gap-2 max-w-full">
            <span className="text-[11px] font-semibold text-neutral-400 shrink-0 uppercase tracking-wider select-none">
              Popular:
            </span>
            <div
              ref={quickTagsScroll}
              className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs scroll-fade-both"
            >
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    lightTap();
                    setArtistQuery(tag);
                    searchInputRef.current?.focus();
                  }}
                  className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs font-medium transition-all cursor-pointer select-none"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. FEATURED ARTISTS / SEARCH RESULTS (Directly after search bar)
         ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {hasQuery ? "Search Results" : "Featured Artists"}
            </h2>
          </div>

          {isSearching && (
            <span className="text-xs text-[#1DB954] flex items-center gap-1.5 font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
              Searching Setlist.fm...
            </span>
          )}
        </div>

        {/* Loading Skeletons */}
        {isSearching && results.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-2xl bg-white/[0.03] border border-white/5 p-3.5 flex items-center gap-3.5 animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Search State */}
        {!isSearching && hasQuery && results.length === 0 && (
          <div className="p-8 sm:p-10 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
              <Music className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-white text-base">
                No primary artists found
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                No solo or headlining match found for &quot;{artistQuery}&quot; on Setlist.fm.
                Collaborative guest appearances were filtered out. Check the spelling or search another artist name.
              </p>
            </div>
          </div>
        )}

        {/* Artists Display Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {displayedArtists.map((artist) => (
            <button
              key={artist.id}
              type="button"
              onClick={() => {
                lightTap();
                selectArtist(artist);
              }}
              className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-left border border-white/10 hover:border-white/25 shadow-md cursor-pointer"
            >
              {/* Circular Avatar / Image */}
              <ArtistAvatar artist={artist} />

              {/* Text Stack */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="font-bold text-white text-base truncate group-hover:text-[#1DB954] transition-colors">
                  {artist.name}
                </div>
                <div className="text-xs text-neutral-400 truncate mt-0.5">
                  {artist.disambiguation || "Artist on tour"}
                </div>
              </div>

              {/* Action Indicator */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-1 text-[#1DB954] shrink-0">
                <Disc3 className="w-4 h-4 animate-spin-slow" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================
          CONTENT SHELVES (When not actively typing search query)
         ========================================================= */}
      {!hasQuery ? (
        <>
          {/* =========================================================
              3. "JUMP BACK IN" RECENT TICKET STUBS SHELF
             ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Jump Back In
                </h2>
              </div>

              {savedTickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    mediumTap();
                    setActiveTab("stubs");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-[#1DB954] transition-colors cursor-pointer"
                >
                  <span>See all in My Stubs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Case A: User has saved tickets */}
            {savedTickets.length > 0 ? (
              <div
                ref={jumpBackInScroll}
                className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 snap-x scroll-fade-both md:[mask-image:none] md:[-webkit-mask-image:none]"
              >
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="w-[80vw] max-w-[310px] shrink-0 snap-start md:w-auto md:max-w-none rounded-2xl bg-[#181818] hover:bg-[#202020] border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between transition-all shadow-md group"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Artist Image, Mode Pill, Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-neutral-900 ring-1 ring-white/10 flex items-center justify-center">
                            {ticket.artistImageUrl ? (
                              <Image
                                src={ticket.artistImageUrl}
                                alt={ticket.artistName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music2 className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider shrink-0 ${
                              ticket.mode === "rehearsal"
                                ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                                : ticket.mode === "essential"
                                ? "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                                : "bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954]"
                            }`}
                          >
                            {ticket.mode === "rehearsal"
                              ? "REHEARSAL"
                              : ticket.mode === "essential"
                              ? "ESSENTIAL"
                              : "VERIFIED SET"}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-400 bg-black/40 border border-white/5 px-2 py-1 rounded-md shrink-0">
                          {formatStubDate(ticket.eventDate)}
                        </span>
                      </div>

                      {/* Center Details */}
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                          {ticket.artistName}
                        </h3>
                        {ticket.tourName && (
                          <div className="text-xs font-medium text-neutral-300 truncate">
                            {ticket.tourName}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                          <span className="truncate">
                            {ticket.venueName} • {ticket.cityName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          lightTap();
                          setSelectedTicket(ticket);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer"
                      >
                        <Ticket className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Ticket</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {ticket.playlistUrl && !ticket.playlistUrl.includes("youtube.com") && (
                          <a
                            href={ticket.playlistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-full bg-[#1DB954]/15 hover:bg-[#1DB954]/30 border border-[#1DB954]/40 text-[#1DB954] flex items-center justify-center transition-all active:scale-95"
                            title="Open playlist in Spotify"
                            aria-label="Open playlist in Spotify"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {ticket.youtubeUrl && (
                          <a
                            href={ticket.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-full bg-[#FF0000]/15 hover:bg-[#FF0000]/30 border border-[#FF0000]/40 text-[#FF0000] flex items-center justify-center transition-all active:scale-95"
                            title="Open playlist in YouTube"
                            aria-label="Open playlist in YouTube"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Trailing clearance spacer on mobile so last card has clean breathing room */}
                <div className="shrink-0 w-2 sm:w-4 md:hidden" aria-hidden="true" />
              </div>
            ) : (
              /* Case B: No tickets saved yet */
              <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/15 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-bold text-white">
                    Your Ticket Collection Awaits
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
                    Search for an artist above to rehearse an upcoming tour or save an attended show. Your custom digital ticket stubs and playlists will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================
              4. "TRENDING ON TOUR" SHELF
             ========================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Trending on Tour
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  mediumTap();
                  setActiveTab("tours");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-[#1DB954] transition-colors cursor-pointer"
              >
                <span>Explore all tours</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tour Cards Grid / Carousel */}
            <div
              ref={trendingToursScroll}
              className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 snap-x scroll-fade-both md:[mask-image:none] md:[-webkit-mask-image:none]"
            >
              {TRENDING_TOURS.map((tour) => (
                <div
                  key={tour.id}
                  className="w-[80vw] max-w-[310px] shrink-0 snap-start md:w-auto md:max-w-none rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between transition-all shadow-md group"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-neutral-900 ring-1 ring-white/10 shadow-sm relative">
                        <Image
                          src={tour.imageUrl}
                          alt={tour.artistName}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                          {tour.artistName}
                        </h3>
                        <p className="text-xs font-semibold text-neutral-200 truncate mt-0.5">
                          {tour.tourName}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-white/5 space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-neutral-300 uppercase tracking-wider">
                        {tour.scaleBadge}
                      </span>
                      <p className="text-xs text-neutral-400 truncate">
                        {tour.locationSummary}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRehearseTour(tour)}
                    disabled={rehearsingTourId === tour.id}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] disabled:opacity-60 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed"
                  >
                    {rehearsingTourId === tour.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Analyzing Tour Shows...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-black" />
                        <span>Rehearse Setlist</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
              {/* Trailing clearance spacer on mobile so last card has clean breathing room */}
              <div className="shrink-0 w-2 sm:w-4 md:hidden" aria-hidden="true" />
            </div>
          </div>

          {/* =========================================================
              5. "LOCAL CONCERT RADAR" SPOTLIGHT SHELF
             ========================================================= */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#1DB954]" />
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Local Concert Radar
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Recent verified concerts and live setlists from major music capitals.
                </p>
              </div>

              {/* City Selector Pills */}
              <div className="flex items-center gap-2 max-w-full sm:max-w-md">
                <span className="text-[11px] font-semibold text-neutral-400 shrink-0 uppercase tracking-wider select-none">
                  Popular:
                </span>
                <div
                  ref={radarCitiesScroll}
                  className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-fade-both"
                >
                  {RADAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        mediumTap();
                        setActiveCity(city);
                      }}
                      className={`shrink-0 px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer select-none ${
                        activeCity === city
                          ? "bg-white/15 text-white font-semibold shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* City Shows Feed */}
            {isLoadingCityShows ? (
              <div
                ref={cityShowsScroll}
                className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 snap-x scroll-fade-both md:[mask-image:none] md:[-webkit-mask-image:none]"
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="w-[80vw] max-w-[310px] shrink-0 snap-start md:w-auto md:max-w-none rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex flex-col justify-between animate-pulse space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-white/10" />
                        <div className="h-4 w-28 bg-white/10 rounded" />
                      </div>
                      <div className="h-5 w-14 bg-white/10 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-3/4 bg-white/10 rounded" />
                      <div className="h-3 w-1/3 bg-white/5 rounded" />
                    </div>
                    <div className="h-8 w-full bg-white/10 rounded-xl" />
                  </div>
                ))}
                {/* Trailing clearance spacer on mobile so last card has clean breathing room */}
                <div className="shrink-0 w-2 sm:w-4 md:hidden" aria-hidden="true" />
              </div>
            ) : cityShows.length > 0 ? (
              <div
                ref={cityShowsScroll}
                className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0 snap-x scroll-fade-both md:[mask-image:none] md:[-webkit-mask-image:none]"
              >
                {cityShows.map((show) => (
                  <div
                    key={show.id}
                    className="w-[80vw] max-w-[310px] shrink-0 snap-start md:w-auto md:max-w-none rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/10 hover:border-white/20 p-4 flex flex-col justify-between transition-all shadow-md group"
                  >
                    <div>
                      {/* Top Row: Artist Image & Date Badge */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-neutral-900 ring-1 ring-white/10 flex items-center justify-center">
                            {show.artistImageUrl ? (
                              <Image
                                src={show.artistImageUrl}
                                alt={show.artistName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music2 className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                              {show.artistName}
                            </h3>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md shrink-0">
                          {formatShowDateBadge(show.eventDate)}
                        </span>
                      </div>

                      {/* Center Details */}
                      <div className="py-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#1DB954] shrink-0" />
                          <span className="truncate">{show.venueName}</span>
                        </div>
                        <div className="text-xs text-[#1DB954] font-semibold">
                          {show.songCount} songs recorded
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewCityShow(show)}
                      disabled={loadingCityShowId === show.id}
                      className="w-full mt-2 py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingCityShowId === show.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Loading Setlist...</span>
                        </>
                      ) : (
                        <>
                          <ListMusic className="w-3.5 h-3.5 text-neutral-300" />
                          <span>View Setlist</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
                {/* Trailing clearance spacer on mobile so last card has clean breathing room */}
                <div className="shrink-0 w-2 sm:w-4 md:hidden" aria-hidden="true" />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-neutral-400">
                No recent live setlists found for {activeCity}. Try selecting another music capital.
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Ticket Modal Instance when viewing a saved ticket */}
      {selectedTicket && (
        <TicketModal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          artistName={selectedTicket.artistName}
          tourName={selectedTicket.tourName}
          venueName={selectedTicket.venueName}
          cityName={selectedTicket.cityName}
          eventDate={selectedTicket.eventDate}
          tracks={selectedTicket.tracks}
          playlistUrl={selectedTicket.playlistUrl || selectedTicket.youtubeUrl || ""}
          mode={selectedTicket.mode}
          initialTheme={selectedTicket.theme}
        />
      )}
    </div>
  );
}
