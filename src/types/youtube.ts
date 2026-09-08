import type { NormalizedTrack } from "@/types/setlist";

/**
 * Request payload for resolving a setlist into YouTube playlist URLs
 */
export interface YouTubePlaylistRequest {
  concertTitle: string;
  performingArtist: string;
  tracks: NormalizedTrack[];
}

/**
 * Response payload containing native queued playlist URLs for YouTube and YouTube Music
 */
export interface YouTubePlaylistResponse {
  success: boolean;
  youtubeUrl: string;
  youtubeMusicUrl: string;
  videoIds: string[];
  matchedCount: number;
  totalRequested: number;
  unmatchedTracks: string[];
}
