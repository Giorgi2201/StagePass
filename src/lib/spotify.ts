import type { NormalizedArtist, NormalizedTrack } from "@/types/setlist";
import { getValidSession } from "@/lib/auth";
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

/**
 * In-memory cache for the Spotify client credentials token
 */
let cachedAppToken: { token: string; expiresAt: number } | null = null;

/**
 * Retrieves a client credentials access token for public Spotify catalog searches
 */
export async function getClientCredentialsToken(): Promise<string | null> {
  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt - 60000) {
    return cachedAppToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Missing Spotify client credentials (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)");
    return null;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Failed to obtain Spotify client credentials token:",
        response.status,
        await response.text()
      );
      return null;
    }

    const data = await response.json();
    cachedAppToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };
    return cachedAppToken.token;
  } catch (err) {
    console.error("Network error obtaining Spotify client credentials token:", err);
    return null;
  }
}

/**
 * Obtains an active Spotify access token using the user's session if present,
 * or falling back to the application client credentials token.
 */
export async function getActiveSpotifyToken(): Promise<string | null> {
  try {
    const session = await getValidSession();
    if (session?.accessToken) {
      return session.accessToken;
    }
  } catch {
    // Session context not available or unauthenticated
  }

  return getClientCredentialsToken();
}

interface SpotifyArtistSearchResponse {
  artists?: {
    items?: Array<{
      id: string;
      name: string;
      images?: Array<{
        url: string;
        height?: number;
        width?: number;
      }>;
    }>;
  };
}

/**
 * Searches Spotify for an artist by name and extracts their medium-sized profile image
 */
export async function fetchArtistImageUrl(
  artistName: string,
  accessToken: string
): Promise<string | null> {
  if (!artistName || !accessToken) return null;

  const cleanName = artistName.replace(/["']/g, "").trim();
  if (!cleanName) return null;

  try {
    // Primary search: exact artist field query
    const primaryUrl = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
      `artist:"${cleanName}"`
    )}&type=artist&limit=1`;

    let response = await fetch(primaryUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok && response.status === 429) {
      console.warn("Spotify artist search rate limit reached (429)");
      return null;
    }

    let data = response.ok
      ? ((await response.json()) as SpotifyArtistSearchResponse)
      : null;
    let artistItem = data?.artists?.items?.[0];

    // Fallback search: broader keyword query if exact field query returned nothing
    if (!artistItem) {
      const fallbackUrl = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
        `"${cleanName}"`
      )}&type=artist&limit=1`;

      response = await fetch(fallbackUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        next: { revalidate: 86400 },
      });

      if (response.ok) {
        data = (await response.json()) as SpotifyArtistSearchResponse;
        artistItem = data?.artists?.items?.[0];
      }
    }

    if (!artistItem?.images || artistItem.images.length === 0) {
      return null;
    }

    // Medium image preferred (images[1] is ~300x300), fallback to images[0]
    return artistItem.images[1]?.url || artistItem.images[0]?.url || null;
  } catch (err) {
    console.warn(
      `[Spotify] Error fetching profile image for artist "${artistName}":`,
      err
    );
    return null;
  }
}

/**
 * Concurrently enriches a list of NormalizedArtist models with Spotify profile photos
 */
export async function enrichArtistsWithSpotifyImages(
  artists: NormalizedArtist[],
  explicitToken?: string
): Promise<NormalizedArtist[]> {
  if (artists.length === 0) return [];

  const token = explicitToken || (await getActiveSpotifyToken());
  if (!token) {
    return artists.map((a) => ({ ...a, imageUrl: a.imageUrl ?? null }));
  }

  return Promise.all(
    artists.map(async (artist) => {
      if (artist.imageUrl !== undefined) {
        return artist;
      }

      try {
        const imageUrl = await fetchArtistImageUrl(artist.name, token);
        return {
          ...artist,
          imageUrl: imageUrl || null,
        };
      } catch {
        return {
          ...artist,
          imageUrl: null,
        };
      }
    })
  );
}

/**
 * Normalizes song titles for intelligent deduplication across album,
 * single, deluxe, remastered, and compilation versions
 */
export function normalizeSongTitleForDeduplication(title: string): string {
  if (!title) return "";
  let clean = title.toLowerCase();

  // 1. Remove bracketed / parenthetical indicators (Remastered, Live, Deluxe, Acoustic, etc.)
  clean = clean.replace(
    /\s*[\(\[](?:remastered|remaster|deluxe|live|acoustic|instrumental|edit|radio edit|single version|bonus track|anniversary|mono|stereo|expanded|original|version|edition|re-recorded|taylor's version).*?[\)\]]/gi,
    ""
  );

  // 2. Remove trailing hyphen annotations: " - Remastered 2011", " - Live", " - Radio Edit"
  clean = clean.replace(
    /\s+-\s+(?:remastered|remaster|deluxe|live|acoustic|radio edit|single version|mono|stereo|bonus track).*$/i,
    ""
  );

  // 3. Remove feat. / ft. guest appearances
  clean = clean.replace(/\s+(?:feat\.?|ft\.?|featuring|with)\s+.*$/i, "");

  // 4. Strip punctuation and non-alphanumerics
  clean = clean.replace(/[^a-z0-9\s]/g, "");

  // 5. Collapse duplicate whitespace
  return clean.replace(/\s+/g, " ").trim();
}

/**
 * Fetches an artist's top tracks from Spotify with intelligent deduplication,
 * returning up to 20 curated tracks for the Essential Hits collection.
 */
export async function fetchArtistTopTracks(
  artistName: string,
  artistId?: string
): Promise<NormalizedTrack[]> {
  const cleanName = artistName.replace(/["']/g, "").trim();
  if (!cleanName) return [];

  const token = await getActiveSpotifyToken();
  if (!token) {
    throw new Error("Unable to obtain Spotify access token");
  }

  const allTracks: SpotifyTrack[] = [];

  // Strategy A: If artistId is provided or discovered, attempt top-tracks endpoint
  if (artistId) {
    try {
      const topTracksUrl = `${SPOTIFY_API_BASE_URL}/artists/${encodeURIComponent(
        artistId
      )}/top-tracks?market=US`;
      const res = await fetch(topTracksUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks)) {
          allTracks.push(...data.tracks);
        }
      }
    } catch {
      // Endpoint may be restricted for client credentials; continue to search fallback
    }
  }

  // Strategy B: Search Spotify catalog for tracks by artist across multiple offsets
  const offsets = [0, 10, 20, 30];
  const searchResults = await Promise.all(
    offsets.map(async (offset) => {
      try {
        const searchUrl = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
          `artist:"${cleanName}"`
        )}&type=track&limit=10&offset=${offset}`;

        const res = await fetch(searchUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          next: { revalidate: 86400 },
        });

        if (!res.ok) return [];
        const data = (await res.json()) as SpotifySearchResponse;
        return data.tracks?.items || [];
      } catch {
        return [];
      }
    })
  );

  allTracks.push(...searchResults.flat());

  // If still fewer than 15 tracks, broaden query without field filter
  if (allTracks.length < 15) {
    const broaderOffsets = [0, 10];
    const broaderResults = await Promise.all(
      broaderOffsets.map(async (offset) => {
        try {
          const searchUrl = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
            `"${cleanName}"`
          )}&type=track&limit=10&offset=${offset}`;

          const res = await fetch(searchUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            next: { revalidate: 86400 },
          });

          if (!res.ok) return [];
          const data = (await res.json()) as SpotifySearchResponse;
          return data.tracks?.items || [];
        } catch {
          return [];
        }
      })
    );
    allTracks.push(...broaderResults.flat());
  }

  // Filter out tracks that do not have this performing artist
  const lowerArtist = cleanName.toLowerCase();
  const filteredTracks = allTracks.filter((t) => {
    if (!t.artists || t.artists.length === 0) return true;
    return t.artists.some((a) => {
      const aName = a.name.toLowerCase();
      return (
        aName === lowerArtist ||
        lowerArtist.includes(aName) ||
        aName.includes(lowerArtist)
      );
    });
  });

  // Intelligent Deduplication: map by normalized title, retaining the highest popularity version
  const dedupMap = new Map<string, SpotifyTrack>();
  for (const t of filteredTracks.length > 0 ? filteredTracks : allTracks) {
    const key = normalizeSongTitleForDeduplication(t.name);
    if (!key) continue;

    const existing = dedupMap.get(key);
    if (!existing) {
      dedupMap.set(key, t);
    } else {
      const existingPop =
        typeof existing.popularity === "number" ? existing.popularity : 0;
      const currentPop =
        typeof t.popularity === "number" ? t.popularity : 0;
      if (currentPop > existingPop) {
        dedupMap.set(key, t);
      }
    }
  }

  // Sort unique tracks by popularity descending
  const uniqueTracks = Array.from(dedupMap.values()).sort((a, b) => {
    const popA = typeof a.popularity === "number" ? a.popularity : 0;
    const popB = typeof b.popularity === "number" ? b.popularity : 0;
    return popB - popA;
  });

  // Slice top 15-20 tracks
  const finalTracks = uniqueTracks.slice(0, 20);

  // Map to NormalizedTrack with realistic confidenceScore / popularity metric
  return finalTracks.map((track, index) => {
    const popScore =
      typeof track.popularity === "number" && track.popularity > 0
        ? track.popularity
        : Math.max(98 - index * 2, 60);

    return {
      name: track.name,
      isCover: false,
      isEncore: false,
      setNumber: 1,
      confidenceScore: popScore,
    };
  });
}


