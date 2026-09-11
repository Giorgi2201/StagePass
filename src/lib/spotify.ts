import type { NormalizedArtist, NormalizedTrack } from "@/types/setlist";
import { getValidSession } from "@/lib/auth";
import type {
  MatchedTrackResult,
  SpotifyAlbumImage,
  SpotifyPlaylist,
  SpotifySearchResponse,
  SpotifyTrack,
} from "@/types/spotify";

const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

/**
 * Strips common setlist annotations, quotation marks, and noise
 * that cause exact Spotify searches to fail
 */
function sanitizeTrackTitle(title: string): string {
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
 * Global rate-limit tracking for the Spotify /search endpoint
 */
let searchRateLimitUntil = 0;

/**
 * Execute a single Spotify search query with bearer token
 */
async function searchSpotify(
  query: string,
  userAccessToken: string
): Promise<SpotifyTrack[]> {
  if (Date.now() < searchRateLimitUntil) {
    return [];
  }

  const url = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
    query
  )}&type=track&limit=10`;

  try {
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
        const retryAfter = parseInt(
          response.headers.get("retry-after") || "60",
          10
        );
        searchRateLimitUntil = Date.now() + Math.max(retryAfter, 60) * 1000;
        console.warn(
          `[Spotify API Warning] /v1/search rate limit reached (429). Pausing search calls for ${retryAfter}s`
        );
      }
      return [];
    }

    const data = (await response.json()) as SpotifySearchResponse;
    return data.tracks?.items || [];
  } catch {
    return [];
  }
}

/**
 * Resolves a single setlist track to the best matching SpotifyTrack
 * using multi-tier fallback and popularity scoring
 */
async function findBestSpotifyTrack(
  trackName: string,
  performingArtist: string,
  originalArtist?: string,
  isCover = false,
  userAccessToken = ""
): Promise<SpotifyTrack | null> {
  const cleanTitle = sanitizeTrackTitle(trackName);
  if (!cleanTitle) return null;

  const token = userAccessToken || (await getActiveSpotifyToken()) || "";
  if (!token) return null;

  // Tier 1: Targeted search with field filters
  // e.g. track:"Higher Power" artist:"Coldplay"
  let candidates: SpotifyTrack[] = [];
  const tier1Query = `track:"${cleanTitle}" artist:"${performingArtist}"`;
  candidates = await searchSpotify(tier1Query, token);

  // Tier 2: Cover fallback (if isCover is true and performing artist had no match)
  if (candidates.length === 0 && isCover && originalArtist) {
    const cleanOriginal = sanitizeTrackTitle(originalArtist);
    const tier2Query = `track:"${cleanTitle}" artist:"${cleanOriginal}"`;
    candidates = await searchSpotify(tier2Query, token);
  }

  // Tier 3: Fuzzy keyword search
  if (candidates.length === 0) {
    const tier3Query = `"${cleanTitle}" "${performingArtist}"`;
    candidates = await searchSpotify(tier3Query, token);
  }

  // Tier 3b: Fallback to title only if still no match
  if (candidates.length === 0) {
    candidates = await searchSpotify(`"${cleanTitle}"`, token);
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
 * Searches and returns both the best matching SpotifyTrack and up to 5
 * candidate track IDs (matching alternate releases like singles or deluxes)
 */
export async function matchTrackWithCandidates(
  trackName: string,
  performingArtist: string,
  originalArtist?: string,
  isCover = false,
  userAccessToken = ""
): Promise<{ bestTrack: SpotifyTrack | null; candidateIds: string[] }> {
  const cleanTitle = sanitizeTrackTitle(trackName);
  if (!cleanTitle) return { bestTrack: null, candidateIds: [] };

  const token = userAccessToken || (await getActiveSpotifyToken()) || "";
  if (!token) return { bestTrack: null, candidateIds: [] };

  let candidates: SpotifyTrack[] = [];
  const tier1Query = `track:"${cleanTitle}" artist:"${performingArtist}"`;
  candidates = await searchSpotify(tier1Query, token);

  if (candidates.length === 0 && isCover && originalArtist) {
    const cleanOriginal = sanitizeTrackTitle(originalArtist);
    const tier2Query = `track:"${cleanTitle}" artist:"${cleanOriginal}"`;
    candidates = await searchSpotify(tier2Query, token);
  }

  if (candidates.length === 0) {
    const tier3Query = `"${cleanTitle}" "${performingArtist}"`;
    candidates = await searchSpotify(tier3Query, token);
  }

  if (candidates.length === 0) {
    candidates = await searchSpotify(`"${cleanTitle}"`, token);
  }

  if (candidates.length === 0) {
    return { bestTrack: null, candidateIds: [] };
  }

  // Filter candidates where song title matches closely to avoid unrelated songs by the same artist
  const normTarget = normalizeSongTitleForDeduplication(cleanTitle);
  const matchingCandidates = candidates.filter((c) => {
    const normC = normalizeSongTitleForDeduplication(c.name);
    return (
      normC === normTarget ||
      normC.includes(normTarget) ||
      normTarget.includes(normC)
    );
  });

  const finalCandidatesList =
    matchingCandidates.length > 0 ? matchingCandidates : candidates;
  finalCandidatesList.sort(
    (a, b) => (b.popularity || 0) - (a.popularity || 0)
  );

  const bestTrack = finalCandidatesList[0] || candidates[0];
  const candidateIds = Array.from(
    new Set([bestTrack.id, ...finalCandidatesList.map((c) => c.id)])
  ).slice(0, 10);

  return { bestTrack, candidateIds };
}

/**
 * Fast mapping of globally trending touring artists to verified Spotify Artist IDs
 * for instant zero-latency catalog resolution without burning search rate limits.
 */
const POPULAR_ARTIST_SPOTIFY_IDS: Record<string, string> = {
  "coldplay": "4gzpq5DPGxSnKTe4SA8HAU",
  "kendrick lamar": "2YZyLoL8N0Wb9xBt1NhZWg",
  "taylor swift": "06HL4z0CvFAxyc27GXpf02",
  "radiohead": "4Z8W4fKeB5YxbusRsdQVPb",
  "the beatles": "3WrFJ7ztbogygnTHbHJFl2",
  "foo fighters": "7jy3rLJdDQY21OgRLCZ9sD",
  "billie eilish": "6qqNVTkY8uBg9cP3Jd7DAH",
  "drake": "3TVXtAsR1Inumwj472S9r4",
  "the weeknd": "1Xyo4u8uXC1ZmMpatF05PJ",
  "dua lipa": "6M2wZ9GZgrQXHCFfjv46we",
  "ed sheeran": "6eUKZXaKkcviH0Ku9w2n3V",
  "olivia rodrigo": "1McMsnEElThX1knmY4oliG",
  "harry styles": "6KImCVD70vtIoJWnq6nGn3",
  "arctic monkeys": "7Ln80DlNuAcXZav7Ztiq6Q",
  "beyoncé": "6vWDO969PvNqNYHIOW5v0m",
  "beyonce": "6vWDO969PvNqNYHIOW5v0m",
  "oasis": "2DaxqgrOhkeH0fpeiQq2f4",
  "red hot chili peppers": "0L8ExT028jH3ioRviAhb90",
  "green day": "7oPftvlwr6VrsViSDV7fJY",
  "blink-182": "6FBDaR13swtiWwGhX1WnP9",
  "linkin park": "6XyY86QOPPrYVGvF9ch6wz",
  "paramore": "74XFHRwlV6OrjEM0A2NCMF",
  "post malone": "246dkjvS1zLTtiykYqBl6K",
  "travis scott": "0Y5tJX1MQlPlqiwlOH1tJY",
  "sza": "7tYKF4w9nC0nq9CsPZTHte",
  "adele": "4dpARuHxo51G3z768sgnrY",
  "bruno mars": "0du5cEVh5yTK9QJze8zA0C",
  "metallica": "2ye2Wgw4gimLv2eAKyk1NB",
  "queen": "1dfeR4HaWDbWqFssioeoL2",
};

/**
 * Resolves an artist's Spotify ID via fast dictionary, MusicBrainz relations, or search
 */
export async function resolveArtistSpotifyId(
  artistName: string,
  mbid?: string,
  token?: string
): Promise<string | null> {
  const clean = artistName.toLowerCase().trim();
  if (POPULAR_ARTIST_SPOTIFY_IDS[clean]) {
    return POPULAR_ARTIST_SPOTIFY_IDS[clean];
  }

  // 1. Try MusicBrainz URL relations (fast, unauthenticated, zero rate limits)
  if (mbid && mbid.trim()) {
    try {
      const mbRes = await fetch(
        `https://musicbrainz.org/ws/2/artist/${encodeURIComponent(mbid.trim())}?inc=url-rels&fmt=json`,
        {
          headers: { "User-Agent": "StagePass/1.0 (contact@stagepass.live)" },
          next: { revalidate: 86400 * 7 },
        }
      );
      if (mbRes.ok) {
        const mbData = await mbRes.json();
        const rel = mbData.relations?.find((r: { url?: { resource?: string } }) =>
          r.url?.resource?.includes("spotify.com/artist")
        );
        const resourceUrl = rel?.url?.resource;
        if (resourceUrl) {
          const match = resourceUrl.match(/\/artist\/([a-zA-Z0-9]+)/);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
    } catch (err) {
      console.warn(`[Spotify] Failed to resolve Spotify Artist ID from MusicBrainz for "${artistName}":`, err);
    }
  }

  // 2. Fallback: Search endpoint if not currently 429
  if (token && Date.now() >= searchRateLimitUntil) {
    try {
      const url = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
        `artist:"${artistName}"`
      )}&type=artist&limit=1`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const artist = data.artists?.items?.[0];
        if (artist?.id) return artist.id;
      } else if (res.status === 429) {
        const retry = parseInt(res.headers.get("retry-after") || "60", 10);
        searchRateLimitUntil = Date.now() + retry * 1000;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Fetches an artist's full catalog of tracks from their recent albums & singles
 * without using the restricted or rate-limited /search endpoint.
 */
export async function fetchArtistCatalogTracks(
  spotifyArtistId: string,
  token: string
): Promise<SpotifyTrack[]> {
  try {
    // Fetch page 1 (0-10) and page 2 (10-20) of albums in parallel
    const [res1, res2] = await Promise.all([
      fetch(`${SPOTIFY_API_BASE_URL}/artists/${spotifyArtistId}/albums?limit=10&offset=0`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        next: { revalidate: 86400 },
      }),
      fetch(`${SPOTIFY_API_BASE_URL}/artists/${spotifyArtistId}/albums?limit=10&offset=10`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        next: { revalidate: 86400 },
      }),
    ]);

    const [d1, d2] = await Promise.all([
      res1.ok ? res1.json() : { items: [] },
      res2.ok ? res2.json() : { items: [] },
    ]);

    const albums: Array<{ id: string; name: string; images?: SpotifyAlbumImage[] }> = [
      ...(d1.items || []),
      ...(d2.items || []),
    ];

    if (albums.length === 0) return [];

    // Fetch tracks for all albums in parallel
    const albumTrackPromises = albums.map(async (album) => {
      try {
        const res = await fetch(
          `${SPOTIFY_API_BASE_URL}/albums/${album.id}/tracks?limit=30`,
          {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            next: { revalidate: 86400 },
          }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).map((t: SpotifyTrack) => ({
          ...t,
          album: {
            id: album.id,
            name: album.name,
            images: album.images || [],
          },
        }));
      } catch {
        return [];
      }
    });

    const trackArrays = await Promise.all(albumTrackPromises);
    return trackArrays.flat();
  } catch (err) {
    console.warn(`[Spotify] Failed to fetch artist catalog tracks for ${spotifyArtistId}:`, err);
    return [];
  }
}

function cleanTitleForMatching(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\(\[\{].*?[\)\]\}]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestCatalogMatch(
  setlistTitle: string,
  catalogTracks: SpotifyTrack[]
): SpotifyTrack | null {
  const s = cleanTitleForMatching(setlistTitle);
  if (!s) return null;

  // 1. Exact cleaned title match (prioritizes studio release over live)
  const exact = catalogTracks.find((t) => cleanTitleForMatching(t.name) === s);
  if (exact) return exact;

  // 2. Word-boundary prefix match (e.g. "Yellow - Live in Buenos Aires" matches "Yellow")
  const prefix = catalogTracks.find((t) => {
    const c = cleanTitleForMatching(t.name);
    return c.startsWith(s + " ") || s.startsWith(c + " ");
  });
  if (prefix) return prefix;

  return null;
}

/**
 * Resilient multi-tier batch track matching:
 * 1. Checks if track already has a valid 22-char Spotify ID (0 calls)
 * 2. Matches against artist's album catalog (0 search quota used, immune to /search 429)
 * 3. Falls back to individual search only if search endpoint is not rate-limited
 */
export async function batchMatchTracks(
  tracks: NormalizedTrack[],
  performingArtist: string,
  userAccessToken: string,
  concurrency = 5,
  artistMbid?: string,
  artistSpotifyId?: string
): Promise<MatchedTrackResult[]> {
  const results: MatchedTrackResult[] = [];
  const token = userAccessToken || (await getActiveSpotifyToken()) || "";

  // 1. Fast Pass: Resolve tracks that already have valid 22-char Spotify IDs
  const pendingIndices: number[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    if (t.id && /^[a-zA-Z0-9]{22}$/.test(t.id) && !t.id.startsWith("trk_")) {
      results[i] = {
        originalQuery: t.name,
        spotifyTrack: {
          id: t.id,
          uri: `spotify:track:${t.id}`,
          name: t.name,
          popularity: t.confidenceScore || 80,
          duration_ms: 240000,
          preview_url: (t as { previewUrl?: string | null }).previewUrl || null,
          artists: [{ id: "", name: performingArtist }],
          album: { id: "", name: "", images: [] },
        },
        status: "matched",
      };
    } else {
      pendingIndices.push(i);
    }
  }

  // If all tracks were already resolved (e.g. Essential Hits), return immediately
  if (pendingIndices.length === 0) {
    return results;
  }

  // 2. Artist Catalog Strategy: Fetch artist's albums and match tracks in-memory (0 search quota used)
  const resolvedArtistId =
    artistSpotifyId ||
    (await resolveArtistSpotifyId(performingArtist, artistMbid, token));

  if (resolvedArtistId) {
    const catalogTracks = await fetchArtistCatalogTracks(resolvedArtistId, token);
    if (catalogTracks.length > 0) {
      for (const idx of [...pendingIndices]) {
        const track = tracks[idx];
        const match = findBestCatalogMatch(track.name, catalogTracks);
        if (match) {
          results[idx] = {
            originalQuery: track.name,
            spotifyTrack: match,
            status: "matched",
          };
          const removePos = pendingIndices.indexOf(idx);
          if (removePos !== -1) {
            pendingIndices.splice(removePos, 1);
          }
        }
      }
    }
  }

  // 3. Fallback: Search remaining tracks individually (only if search is not rate-limited)
  if (pendingIndices.length > 0 && Date.now() >= searchRateLimitUntil) {
    for (let i = 0; i < pendingIndices.length; i += concurrency) {
      if (Date.now() < searchRateLimitUntil) break;

      const chunk = pendingIndices.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (idx) => {
          const track = tracks[idx];
          try {
            const spotifyTrack = await findBestSpotifyTrack(
              track.name,
              performingArtist,
              track.originalArtist,
              track.isCover,
              token
            );
            results[idx] = {
              originalQuery: track.name,
              spotifyTrack,
              status: spotifyTrack ? "matched" : "unmatched",
            };
          } catch {
            results[idx] = {
              originalQuery: track.name,
              spotifyTrack: null,
              status: "unmatched",
            };
          }
        })
      );
    }
  }

  // 4. Fill in any remaining unresolved positions as unmatched
  for (let i = 0; i < tracks.length; i++) {
    if (!results[i]) {
      results[i] = {
        originalQuery: tracks[i].name,
        spotifyTrack: null,
        status: "unmatched",
      };
    }
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
 * Uploads a custom playlist cover image (JPEG base64 encoded, max 256 KB)
 * using PUT https://api.spotify.com/v1/playlists/{playlistId}/images
 */
export async function uploadPlaylistCoverImage(
  playlistId: string,
  imageBase64: string,
  userAccessToken: string
): Promise<boolean> {
  try {
    const rawBase64 = imageBase64
      .replace(/^data:image\/[a-z]+;base64,/, "")
      .trim();

    const url = `${SPOTIFY_API_BASE_URL}/playlists/${encodeURIComponent(
      playlistId
    )}/images`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        "Content-Type": "image/jpeg",
      },
      body: rawBase64,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.warn(
        `[Spotify API Warning] PUT /playlists/${playlistId}/images failed (${response.status}):`,
        errorBody
      );
      return false;
    }

    return true;
  } catch (err) {
    console.warn(
      `[Spotify API Error] Error uploading cover image to playlist ${playlistId}:`,
      err
    );
    return false;
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
async function getActiveSpotifyToken(): Promise<string | null> {
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
 * Fast Spotify search to resolve typos, slang, and unaccented names to
 * their official canonical artist name (e.g. "asap ferg" -> "A$AP Ferg", "beyonce" -> "Beyoncé").
 */
export async function resolveSpotifyCanonicalArtist(
  query: string
): Promise<{ name: string; imageUrl: string | null } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const token = await getActiveSpotifyToken();
  if (!token) return null;

  try {
    const url = `${SPOTIFY_API_BASE_URL}/search?q=${encodeURIComponent(
      trimmed
    )}&type=artist&limit=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;
    const data = (await response.json()) as SpotifyArtistSearchResponse;
    const artist = data.artists?.items?.[0];
    if (!artist || !artist.name) return null;

    const imageUrl =
      artist.images?.[1]?.url || artist.images?.[0]?.url || null;

    return {
      name: artist.name,
      imageUrl,
    };
  } catch (err) {
    console.warn(`[Spotify] Failed to resolve canonical artist for "${trimmed}":`, err);
    return null;
  }
}

/**
 * Searches Spotify for an artist by name and extracts their medium-sized profile image
 */
async function fetchArtistImageUrl(
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
function normalizeSongTitleForDeduplication(title: string): string {
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
  // and accumulating candidate IDs from alternate releases (singles, deluxes, compilations)
  const dedupMap = new Map<string, SpotifyTrack>();
  const candidatesMap = new Map<string, string[]>();

  for (const t of filteredTracks.length > 0 ? filteredTracks : allTracks) {
    const key = normalizeSongTitleForDeduplication(t.name);
    if (!key) continue;

    if (!candidatesMap.has(key)) {
      candidatesMap.set(key, []);
    }
    const cList = candidatesMap.get(key)!;
    if (t.id && !cList.includes(t.id)) {
      cList.push(t.id);
    }

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

  // Map to NormalizedTrack with realistic confidenceScore / popularity metric and candidate IDs
  return finalTracks.map((track, index) => {
    const key = normalizeSongTitleForDeduplication(track.name);
    const candidateIds = Array.from(
      new Set([track.id, ...(candidatesMap.get(key) || [])])
    );

    const popScore =
      typeof track.popularity === "number" && track.popularity > 0
        ? track.popularity
        : Math.max(98 - index * 2, 60);

    return {
      id: track.id,
      name: track.name,
      isCover: false,
      isEncore: false,
      setNumber: 1,
      confidenceScore: popScore,
      candidateIds,
    };
  });
}
