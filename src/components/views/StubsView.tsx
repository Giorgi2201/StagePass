"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { TicketModal } from "@/components/ticket/TicketModal";
import {
  getSavedTicketStubs,
  deleteSavedTicketStub,
  type SavedTicket,
} from "@/lib/storage";
import { useNavigation } from "@/context/NavigationContext";
import {
  Ticket,
  Sparkles,
  Music2,
  ExternalLink,
  Trash2,
  MapPin,
  ArrowRight,
  Headphones,
} from "lucide-react";
import { mediumTap, tickHaptic } from "@/lib/haptics";

export function StubsView() {
  const { setActiveTab } = useNavigation();
  const [tickets, setTickets] = useState<SavedTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SavedTicket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  // Load saved tickets and listen for real-time updates
  useEffect(() => {
    function loadTickets() {
      setTickets(getSavedTicketStubs());
    }

    loadTickets();
    window.addEventListener("stagepass_tickets_updated", loadTickets);
    return () => {
      window.removeEventListener("stagepass_tickets_updated", loadTickets);
    };
  }, []);

  // Compute lifetime concert stats
  const stats = useMemo(() => {
    const totalConcerts = tickets.length;
    const totalTracks = tickets.reduce(
      (acc, t) => acc + (t.tracks?.length || 0),
      0
    );
    const uniqueArtists = new Set(
      tickets.map((t) => t.artistName.trim().toLowerCase())
    ).size;

    return { totalConcerts, totalTracks, uniqueArtists };
  }, [tickets]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedTicketStub(id);
    setTicketToDelete(null);
    tickHaptic();
  };

  const handleOpenTicket = (ticket: SavedTicket) => {
    mediumTap();
    setSelectedTicket(ticket);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Commemorative Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Ticket Box
          </h1>
          <p className="text-xs sm:text-sm text-[#B3B3B3] mt-0.5">
            Your personal digital shoebox of verified concert setlists and retro ticket stubs.
          </p>
        </div>

        {tickets.length > 0 && (
          <button
            type="button"
            onClick={() => {
              mediumTap();
              setActiveTab("setlists");
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add Another Concert</span>
          </button>
        )}
      </div>

      {/* Lifetime Concert Stats Banner */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-[#181818] to-neutral-900 border border-neutral-800 shadow-xl">
          <div className="text-center space-y-0.5 border-r border-neutral-800/80 pr-2 sm:pr-4">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-white">
              {stats.totalConcerts}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Concerts Prepped
            </div>
          </div>

          <div className="text-center space-y-0.5 border-r border-neutral-800/80 px-2 sm:px-4">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#1DB954]">
              {stats.totalTracks}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Live Tracks
            </div>
          </div>

          <div className="text-center space-y-0.5 pl-2 sm:pl-4">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-amber-400">
              {stats.uniqueArtists}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Artists Saved
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {tickets.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-14 rounded-2xl bg-gradient-to-b from-[#1c1c1c] via-[#141414] to-[#101010] border border-neutral-800 text-center space-y-6 max-w-md mx-auto shadow-2xl">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center rotate-3">
              <Ticket className="w-8 h-8 text-amber-400 -rotate-3" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1DB954] text-black flex items-center justify-center font-bold text-xs shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Your Ticket Box is Empty
            </h2>
            <p className="text-xs sm:text-sm text-[#B3B3B3] leading-relaxed">
              Every concert setlist you turn into a playlist will be collected here as a commemorative digital ticket stub.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                mediumTap();
                setActiveTab("setlists");
              }}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Find Your Next Concert</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Ticket Stubs Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((ticket) => {
            const isDeleting = ticketToDelete === ticket.id;

            return (
              <div
                key={ticket.id}
                onClick={() => handleOpenTicket(ticket)}
                className="group relative rounded-2xl bg-[#161616] border border-neutral-800 hover:border-neutral-700 p-5 hover:bg-[#1c1c1c] transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 overflow-hidden"
              >
                {/* Perforated Top Notches Aesthetic */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-2 rounded-b-full bg-[#121212] border-b border-neutral-800" />

                {/* Top Section: Artist Image + Metadata */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Artist Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-neutral-700 shrink-0 bg-neutral-900 flex items-center justify-center">
                        {ticket.artistImageUrl ? (
                          <Image
                            src={ticket.artistImageUrl}
                            alt={ticket.artistName}
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Music2 className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            {ticket.mode === "essential"
                              ? "ESSENTIALS"
                              : ticket.mode === "rehearsal"
                              ? "REHEARSAL"
                              : "VERIFIED SET"}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white truncate group-hover:text-[#1DB954] transition-colors mt-0.5">
                          {ticket.artistName}
                        </h3>
                      </div>
                    </div>

                    {/* Date Badge */}
                    <div className="px-2 py-1 rounded-lg bg-black/60 border border-neutral-800 text-right shrink-0 font-mono text-[10px] text-zinc-300">
                      {ticket.eventDate}
                    </div>
                  </div>

                  {/* Venue & Tour Excerpt */}
                  <div className="p-3 rounded-xl bg-black/40 border border-neutral-800/80 space-y-1 text-xs">
                    <div className="text-zinc-200 font-semibold truncate">
                      {ticket.tourName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                      <MapPin className="w-3 h-3 text-[#1DB954] shrink-0" />
                      <span className="truncate">{ticket.venueName} • {ticket.cityName}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                    <Headphones className="w-3 h-3 text-[#1DB954]" />
                    <span>{ticket.tracks?.length || 0} tracks</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Open in YouTube Button */}
                    {ticket.youtubeUrl && (
                      <a
                        href={ticket.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-full bg-[#FF0000]/15 hover:bg-[#FF0000]/30 border border-[#FF0000]/40 text-[#FF0000] flex items-center justify-center transition-colors"
                        title="Open playlist in YouTube"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    )}

                    {/* Open in Spotify Button */}
                    {ticket.playlistUrl && !ticket.playlistUrl.includes("youtube.com") && (
                      <a
                        href={ticket.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-7 h-7 rounded-full bg-[#1DB954]/15 hover:bg-[#1DB954]/30 border border-[#1DB954]/40 text-[#1DB954] flex items-center justify-center transition-colors"
                        title="Open playlist in Spotify"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Delete Confirmation / Trigger */}
                    {isDeleting ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 animate-in fade-in duration-150"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleDelete(ticket.id, e)}
                          className="px-2 py-1 rounded bg-red-950 border border-red-700 text-red-300 text-[10px] font-bold hover:bg-red-900"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTicketToDelete(null);
                          }}
                          className="px-1.5 py-1 rounded bg-neutral-800 text-zinc-400 text-[10px] hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTicketToDelete(ticket.id);
                        }}
                        className="w-7 h-7 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
                        title="Delete ticket stub"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
