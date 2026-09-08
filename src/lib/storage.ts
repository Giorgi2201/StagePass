"use client";

import type { NormalizedTrack } from "@/types/setlist";
import type { TicketTheme } from "@/components/ticket/TicketStub";

export interface SavedTicket {
  id: string;
  artistName: string;
  artistImageUrl: string | null;
  tourName: string;
  venueName: string;
  cityName: string;
  eventDate: string;
  mode: "rehearsal" | "memory" | "essential";
  tracks: NormalizedTrack[];
  playlistUrl: string;
  playlistId: string;
  youtubeUrl?: string | null;
  youtubeMusicUrl?: string | null;
  theme: TicketTheme;
  createdAt: number;
}

const STORAGE_KEY = "stagepass_saved_tickets_v1";
const THEME_PREF_KEY = "stagepass_default_ticket_theme";

/**
 * Safely access localStorage in SSR environments
 */
function isStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  return true;
}

/**
 * Retrieve all saved concert ticket stubs sorted by createdAt descending
 */
export function getSavedTicketStubs(): SavedTicket[] {
  if (!isStorageAvailable()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: SavedTicket[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error("Failed to parse saved tickets from localStorage:", err);
    return [];
  }
}

/**
 * Save a new ticket stub.
 * Prepends to the list and prevents duplicates by matching id, playlistId, or youtubeUrl.
 */
export function saveTicketStub(
  ticket: Omit<SavedTicket, "id" | "createdAt"> & { id?: string; createdAt?: number }
): SavedTicket {
  const existing = getSavedTicketStubs();

  // Deduplicate by id, playlistId, or youtubeUrl if already present
  const duplicateIndex = existing.findIndex(
    (item) =>
      (ticket.id && item.id === ticket.id) ||
      (ticket.playlistId && item.playlistId === ticket.playlistId) ||
      (ticket.youtubeUrl && item.youtubeUrl && item.youtubeUrl === ticket.youtubeUrl)
  );

  const fullTicket: SavedTicket = {
    ...ticket,
    youtubeUrl: ticket.youtubeUrl ?? null,
    youtubeMusicUrl: ticket.youtubeMusicUrl ?? null,
    id: ticket.id || `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: ticket.createdAt || Date.now(),
  };

  let updatedList: SavedTicket[];
  if (duplicateIndex >= 0) {
    // Update existing in-place, preserving multi-platform URLs if already present
    updatedList = [...existing];
    updatedList[duplicateIndex] = {
      ...existing[duplicateIndex],
      ...fullTicket,
      youtubeUrl: fullTicket.youtubeUrl ?? existing[duplicateIndex].youtubeUrl ?? null,
      youtubeMusicUrl:
        fullTicket.youtubeMusicUrl ?? existing[duplicateIndex].youtubeMusicUrl ?? null,
      playlistUrl: fullTicket.playlistUrl || existing[duplicateIndex].playlistUrl || "",
    };
  } else {
    // Prepend new ticket
    updatedList = [fullTicket, ...existing];
  }

  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      // Dispatch custom window event so other components/tabs can react immediately
      window.dispatchEvent(new CustomEvent("stagepass_tickets_updated"));
    } catch (err) {
      console.error("Failed to save ticket stub to localStorage:", err);
    }
  }

  return fullTicket;
}

/**
 * Remove a ticket stub by ID
 */
export function deleteSavedTicketStub(id: string): void {
  const existing = getSavedTicketStubs();
  const filtered = existing.filter((item) => item.id !== id);

  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent("stagepass_tickets_updated"));
    } catch (err) {
      console.error("Failed to delete ticket stub from localStorage:", err);
    }
  }
}

/**
 * Get user's preferred default ticket theme
 */
export function getDefaultTicketTheme(): TicketTheme {
  if (!isStorageAvailable()) return "spotify";

  try {
    const saved = window.localStorage.getItem(THEME_PREF_KEY) as TicketTheme | null;
    if (saved === "spotify" || saved === "vintage" || saved === "cyber") {
      return saved;
    }
  } catch (err) {
    console.error("Failed to read theme preference:", err);
  }

  return "spotify";
}

/**
 * Set user's preferred default ticket theme
 */
export function setDefaultTicketTheme(theme: TicketTheme): void {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.setItem(THEME_PREF_KEY, theme);
    window.dispatchEvent(new CustomEvent("stagepass_theme_pref_updated", { detail: theme }));
  } catch (err) {
    console.error("Failed to save theme preference:", err);
  }
}
