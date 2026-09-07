import type { NormalizedTrack } from "@/types/setlist";

/**
 * Spotify Web API Data Models
 */

export interface SpotifyArtist {
  id: string;
  name: string;
  uri?: string;
}

export interface SpotifyAlbumImage {
  url: string;
  height?: number;
  width?: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date?: string;
  images: SpotifyAlbumImage[];
  uri?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  popularity: number;
  duration_ms: number;
  preview_url: string | null;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

export interface SpotifySearchResponse {
  tracks?: {
    items: SpotifyTrack[];
    total: number;
    limit?: number;
    offset?: number;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  uri: string;
  images?: SpotifyAlbumImage[];
  snapshot_id: string;
}

/**
 * Application-Specific Request & Response Models
 */

export interface CreatePlaylistRequest {
  concertTitle: string;
  description: string;
  isPublic: boolean;
  performingArtist: string;
  tracks: NormalizedTrack[];
}

export interface MatchedTrackResult {
  originalQuery: string;
  spotifyTrack: SpotifyTrack | null;
  status: "matched" | "unmatched";
}

export interface CreatePlaylistResponse {
  success: boolean;
  playlistId: string;
  playlistUrl: string;
  playlistUri: string;
  snapshotId: string;
  matchedCount: number;
  totalRequested: number;
  unmatchedTracks: string[];
}
