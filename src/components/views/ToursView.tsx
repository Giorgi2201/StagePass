"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useNavigation } from "@/context/NavigationContext";
import { useWizard } from "@/context/WizardContext";
import type { NormalizedArtist } from "@/types/setlist";
import {
  Flame,
  Sparkles,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";
import { mediumTap } from "@/lib/haptics";

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

export function ToursView() {
  const { setActiveTab } = useNavigation();
  const { generateRehearsalSetlist } = useWizard();
  const [loadingTourId, setLoadingTourId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="pb-4 border-b border-neutral-800/80 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Flame className="w-3.5 h-3.5" />
          <span>Active World Tours Radar</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Trending Concert Setlists
        </h1>
        <p className="text-xs sm:text-sm text-[#B3B3B3]">
          Live tour tracking for headlining artists currently touring worldwide. Tap any tour to instantly analyze their average setlist consensus.
        </p>
      </div>

      {/* World Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] disabled:bg-[#1DB954]/50 text-black font-extrabold text-sm shadow-md shadow-[#1DB954]/20 hover:shadow-[#1DB954]/35 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
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
    </div>
  );
}
