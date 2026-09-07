import type { NormalizedTrack } from "@/types/setlist";
import type {
  MatchedTrackResult,
  SpotifyPlaylist,
  SpotifySearchResponse,
  SpotifyTrack,
} from "@/types/spotify";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

/**
 * Strips common setlist annotations, quotation marks, and noise
 * that cause exact Spotify searches to fail
 */
export function sanitizeTrackTitle(title: string): string {
  if (!title) return "";

  let cleaned = title;

  // 1. Remove parenthetical / bracketed notes: (Acoustic), [Live], (Solo), (Snippet), (Extended), etc.
  cleaned = cleaned.replace(
    /\s*[\(\[](?:acoustic|live|solo|snippet|extended|reprise|intro|outro|jam|interlude|acoustic version|piano version)[\)\]]/gi,
    ""
  );

  // 2. Remove "feat. ...", "ft. ...", "featuring ...", "with ..."
  cleaned = cleaned.replace(/\s+(?:feat\.?|ft\.?|featuring|with)\s+.*$/i, "");

  // 3. Remove quotation marks and typographical artifacts
  cleaned = cleaned.replace(/["'“”‘’`]/g, "");

  // 4. Remove trailing dashes, slashes, or punctuation
  cleaned = cleaned.replace(/[\s\-\/,:.]+$/, "");

  // 5. Collapse duplicate whitespace
  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Execute a single Spotify search query with bearer token
 */
async function searchSpotify(
  query: string,
  userAccessToken: string
): Promise<SpotifyTrack[]> {
  const url = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
    query
  )}&type=track&limit=10`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 429) {
      console.warn("Spotify search rate limit reached (429)");
    }
    return [];
  }

  const data = (await response.json()) as SpotifySearchResponse;
  return data.tracks?.items || [];
}

/**
 * Resolves a single setlist track to the best matching SpotifyTrack
 * using multi-tier fallback and popularity scoring
 */
export async function findBestSpotifyTrack(
  trackName: string,
  performingArtist: string,
  originalArtist?: string,
  isCover = false,
  userAccessToken = ""
): Promise<SpotifyTrack | null> {
  const cleanTitle = sanitizeTrackTitle(trackName);
  if (!cleanTitle) return null;

  // Tier 1: Targeted search with field filters
  // e.g. track:"Higher Power" artist:"Coldplay"
  let candidates: SpotifyTrack[] = [];
  const tier1Query = `track:"${cleanTitle}" artist:"${performingArtist}"`;
  candidates = await searchSpotify(tier1Query, userAccessToken);

  // Tier 2: Cover fallback (if isCover is true and performing artist had no match)
  if (candidates.length === 0 && isCover && originalArtist) {
    const cleanOriginal = sanitizeTrackTitle(originalArtist);
    const tier2Query = `track:"${cleanTitle}" artist:"${cleanOriginal}"`;
    candidates = await searchSpotify(tier2Query, userAccessToken);
  }

  // Tier 3: Fuzzy keyword search
  if (candidates.length === 0) {
    const tier3Query = `"${cleanTitle}" "${performingArtist}"`;
    candidates = await searchSpotify(tier3Query, userAccessToken);
  }

  // Tier 3b: Fallback to title only if still no match
  if (candidates.length === 0) {
    candidates = await searchSpotify(`"${cleanTitle}"`, userAccessToken);
  }

  if (candidates.length === 0) {
    return null;
  }

  // Select the track with the highest popularity to prioritize official studio releases
  // over karaoke, acoustic covers, or poor quality live bootlegs
  candidates.sort((a, b) => b.popularity - a.popularity);

  return candidates[0];
}

/**
 * Matches a batch of setlist tracks with controlled concurrency to respect rate limits
 */
export async function batchMatchTracks(
  tracks: NormalizedTrack[],
  performingArtist: string,
  userAccessToken: string,
  concurrency = 5
): Promise<MatchedTrackResult[]> {
  const results: MatchedTrackResult[] = [];

  for (let i = 0; i < tracks.length; i += concurrency) {
    const chunk = tracks.slice(i, i + concurrency);

    const chunkResults = await Promise.all(
      chunk.map(async (track) => {
        try {
          const spotifyTrack = await findBestSpotifyTrack(
            track.name,
            performingArtist,
            track.originalArtist,
            track.isCover,
            userAccessToken
          );

          return {
            originalQuery: track.name,
            spotifyTrack,
            status: spotifyTrack ? ("matched" as const) : ("unmatched" as const),
          };
        } catch (err) {
          console.error(`Error matching track '${track.name}':`, err);
          return {
            originalQuery: track.name,
            spotifyTrack: null,
            status: "unmatched" as const,
          };
        }
      })
    );

    results.push(...chunkResults);
  }

  return results;
}

/**
 * Creates a new playlist on the authenticated user's Spotify account
 * using modern endpoint POST https://api.spotify.com/v1/me/playlists
 */
export async function createSpotifyPlaylist(
  name: string,
  description: string,
  isPublic: boolean,
  userAccessToken: string
): Promise<SpotifyPlaylist> {
  const url = `${SPOTIFY_API_BASE_URL}/me/playlists`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      public: isPublic,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(
      `[Spotify API Error] POST /me/playlists failed with status ${response.status} (${response.statusText}):`,
      errorBody
    );
    throw new Error(
      `Failed to create Spotify playlist (${response.status} ${response.statusText}): ${errorBody}`
    );
  }

  return (await response.json()) as SpotifyPlaylist;
}

/**
 * Adds tracks to a Spotify playlist in chunks of 100
 * using modern endpoint POST https://api.spotify.com/v1/playlists/{playlistId}/items
 */
export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
  userAccessToken: string
): Promise<void> {
  if (trackUris.length === 0) return;

  const CHUNK_SIZE = 100;

  for (let i = 0; i < trackUris.length; i += CHUNK_SIZE) {
    const chunk = trackUris.slice(i, i + CHUNK_SIZE);
    const url = `${SPOTIFY_API_BASE_URL}/playlists/${encodeURIComponent(
      playlistId
    )}/items`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        uris: chunk,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(
        `[Spotify API Error] POST /playlists/${playlistId}/items failed with status ${response.status} (${response.statusText}):`,
        errorBody
      );
      throw new Error(
        `Failed to add tracks to Spotify playlist (${response.status} ${response.statusText}): ${errorBody}`
      );
    }
  }
}
