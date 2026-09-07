import type {
  NormalizedArtist,
  NormalizedShow,
  NormalizedTrack,
  RawArtist,
  RawArtistSearchResponse,
  RawSetlist,
  RawSetlistsResponse,
  SetlistParseResult,
} from "@/types/setlist";

const SETLIST_FM_BASE_URL = "https://api.setlist.fm/rest/1.0";

/**
 * Standard edge-cached fetch wrapper for Setlist.fm API
 */
async function fetchSetlistFm<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.SETLIST_FM_API_KEY;

  if (!apiKey) {
    throw new Error(
      "SETLIST_FM_API_KEY is not configured on the server. Please set it in .env.local"
    );
  }

  const url = `${SETLIST_FM_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      Accept: "application/json",
    },
    // Next.js 24-hour edge revalidation caching
    next: {
      revalidate: 86400,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (response.status === 429) {
    throw new Error(
      "Setlist.fm rate limit exceeded (2 req/sec). Please try again shortly."
    );
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Setlist.fm API request failed with status ${response.status}: ${errorBody}`
    );
  }

  return (await response.json()) as T;
}

/**
 * Search artists by name with exact matches prioritized
 */
export async function searchArtists(query: string): Promise<NormalizedArtist[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const data = await fetchSetlistFm<RawArtistSearchResponse>(
    `/search/artists?artistName=${encodeURIComponent(trimmed)}&p=1&sort=relevance`
  );

  if (!data || !data.artist) {
    return [];
  }

  const artists: RawArtist[] = Array.isArray(data.artist)
    ? data.artist
    : [data.artist];

  const lowerQuery = trimmed.toLowerCase();

  // Map and sort so exact artist name matches appear first
  const normalized: NormalizedArtist[] = artists.map((a) => ({
    id: a.mbid,
    name: a.name,
    disambiguation: a.disambiguation,
  }));

  return normalized.sort((a, b) => {
    const aExact = a.name.toLowerCase() === lowerQuery;
    const bExact = b.name.toLowerCase() === lowerQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return 0;
  });
}

/**
 * Helper to count valid non-tape songs in a raw setlist
 */
function countSongsInSetlist(setlist: RawSetlist): number {
  if (!setlist.sets?.set) return 0;
  return setlist.sets.set.reduce((total, set) => {
    const songs = set.song || [];
    const validSongs = songs.filter((s) => !s.tape && s.name?.trim());
    return total + validSongs.length;
  }, 0);
}

/**
 * Get recent shows for an artist, filtering out shows with 0 recorded songs
 */
export async function getArtistShows(
  mbid: string,
  page = 1
): Promise<NormalizedShow[]> {
  const data = await fetchSetlistFm<RawSetlistsResponse>(
    `/artist/${encodeURIComponent(mbid)}/setlists?p=${page}`
  );

  if (!data || !data.setlist) {
    return [];
  }

  const setlists: RawSetlist[] = Array.isArray(data.setlist)
    ? data.setlist
    : [data.setlist];

  return setlists
    .map((s) => {
      const songCount = countSongsInSetlist(s);
      return {
        id: s.id,
        eventDate: s.eventDate,
        artistName: s.artist?.name || "Unknown Artist",
        venueName: s.venue?.name || "Unknown Venue",
        cityName: s.venue?.city?.name || "Unknown City",
        countryName: s.venue?.city?.country?.name || "",
        tourName: s.tour?.name,
        songCount,
      };
    })
    .filter((show) => show.songCount > 0);
}

/**
 * Fetch a single raw setlist by its Setlist.fm ID
 */
export async function getRawSetlist(
  setlistId: string
): Promise<RawSetlist | null> {
  return fetchSetlistFm<RawSetlist>(
    `/setlist/${encodeURIComponent(setlistId)}`
  );
}

/**
 * Fetch recent completed shows with songs for consensus analysis
 */
export async function getRecentRawSetlists(
  mbid: string,
  maxShows = 5
): Promise<RawSetlist[]> {
  const data = await fetchSetlistFm<RawSetlistsResponse>(
    `/artist/${encodeURIComponent(mbid)}/setlists?p=1`
  );

  if (!data || !data.setlist) {
    return [];
  }

  const setlists: RawSetlist[] = Array.isArray(data.setlist)
    ? data.setlist
    : [data.setlist];

  const showsWithSongs = setlists.filter(
    (s) => countSongsInSetlist(s) > 0
  );

  // If page 1 had fewer than maxShows, fetch page 2 to ensure sufficient sample
  if (showsWithSongs.length < maxShows) {
    try {
      const page2 = await fetchSetlistFm<RawSetlistsResponse>(
        `/artist/${encodeURIComponent(mbid)}/setlists?p=2`
      );
      if (page2?.setlist) {
        const page2Setlists = Array.isArray(page2.setlist)
          ? page2.setlist
          : [page2.setlist];
        for (const s of page2Setlists) {
          if (countSongsInSetlist(s) > 0) {
            showsWithSongs.push(s);
            if (showsWithSongs.length >= maxShows) break;
          }
        }
      }
    } catch {
      // Ignore page 2 failure if page 1 provided enough context
    }
  }

  return showsWithSongs.slice(0, maxShows);
}

/**
 * Algorithm 1: Post-Concert Memory Mode
 * Parses a single recorded concert show:
 * - Filters out tape/intro/backing audio
 * - Tracks regular vs encore sets
 * - Normalizes titles and extracts cover info
 */
export function parseMemorySetlist(rawSetlist: RawSetlist): SetlistParseResult {
  const tracks: NormalizedTrack[] = [];
  const rawSets = rawSetlist.sets?.set || [];

  let currentSetNumber = 1;

  for (const set of rawSets) {
    const isEncore = Boolean(set.encore);
    const songs = set.song || [];

    for (const song of songs) {
      // Prune background audio / tape playback
      if (song.tape) {
        continue;
      }

      const cleanName = song.name?.trim();
      if (!cleanName) {
        continue;
      }

      const isCover = Boolean(song.cover);
      const originalArtist = song.cover?.name?.trim();
      const info = song.info?.trim();

      tracks.push({
        name: cleanName,
        originalArtist: isCover ? originalArtist : undefined,
        isCover,
        isEncore,
        setNumber: isEncore ? currentSetNumber : currentSetNumber,
        info: info || undefined,
        confidenceScore: 100, // In Memory mode, 100% played
      });
    }

    if (!isEncore) {
      currentSetNumber++;
    }
  }

  const venueParts = [
    rawSetlist.venue?.name,
    rawSetlist.venue?.city?.name,
    rawSetlist.venue?.city?.country?.name,
  ].filter(Boolean);

  return {
    mode: "memory",
    artistName: rawSetlist.artist?.name || "Unknown Artist",
    tourName: rawSetlist.tour?.name,
    venueInfo: venueParts.join(", "),
    eventDate: rawSetlist.eventDate,
    tracks,
    totalTracks: tracks.length,
  };
}

interface SongStats {
  canonicalName: string;
  originalArtist?: string;
  isCover: boolean;
  info?: string;
  showIndices: Set<number>;
  positions: number[]; // 1-based order in each show
  encoreCount: number;
}

/**
 * Algorithm 2: Pre-Concert Rehearsal Mode
 * Computes tour consensus across up to 5 recent shows:
 * - Calculates song frequency across shows
 * - Filters by threshold (>= 50% or top 20)
 * - Orders by average position to mirror natural concert pacing & emotional flow
 * - Computes confidence percentage
 */
export function calculateRehearsalConsensus(
  recentSetlists: RawSetlist[],
  minShowThreshold = 0.5
): SetlistParseResult {
  const eligibleShows = recentSetlists
    .filter((s) => countSongsInSetlist(s) > 0)
    .slice(0, 5);

  const totalShows = eligibleShows.length;

  if (totalShows === 0) {
    return {
      mode: "rehearsal",
      artistName: "Unknown Artist",
      tracks: [],
      totalTracks: 0,
    };
  }

  const songMap = new Map<string, SongStats>();

  // 1. Process each eligible show
  eligibleShows.forEach((show, showIndex) => {
    const rawSets = show.sets?.set || [];
    let positionInShow = 1;

    for (const set of rawSets) {
      const isEncore = Boolean(set.encore);
      const songs = set.song || [];

      for (const song of songs) {
        if (song.tape) continue;

        const cleanName = song.name?.trim();
        if (!cleanName) continue;

        const key = cleanName.toLowerCase();
        const isCover = Boolean(song.cover);
        const originalArtist = song.cover?.name?.trim();
        const info = song.info?.trim();

        if (!songMap.has(key)) {
          songMap.set(key, {
            canonicalName: cleanName,
            originalArtist: isCover ? originalArtist : undefined,
            isCover,
            info: info || undefined,
            showIndices: new Set([showIndex]),
            positions: [positionInShow],
            encoreCount: isEncore ? 1 : 0,
          });
        } else {
          const stats = songMap.get(key)!;
          stats.showIndices.add(showIndex);
          stats.positions.push(positionInShow);
          if (isEncore) stats.encoreCount++;
          if (isCover && !stats.isCover) {
            stats.isCover = true;
            stats.originalArtist = originalArtist;
          }
        }

        positionInShow++;
      }
    }
  });

  // 2. Score songs and apply frequency threshold
  const scoredSongs = Array.from(songMap.values()).map((stats) => {
    const appearanceCount = stats.showIndices.size;
    const frequency = appearanceCount / totalShows;
    const averagePosition =
      stats.positions.reduce((sum, p) => sum + p, 0) / stats.positions.length;
    const confidenceScore = Math.round(frequency * 100);
    const isEncore = stats.encoreCount >= appearanceCount / 2;

    return {
      ...stats,
      appearanceCount,
      frequency,
      averagePosition,
      confidenceScore,
      isEncore,
    };
  });

  // Filter songs that meet threshold
  let filtered = scoredSongs.filter((s) => s.frequency >= minShowThreshold);

  // If high tour variability resulted in fewer than 5 consensus tracks (e.g., jam bands or heavy rotators),
  // fall back to taking the top 20 most frequently played tracks overall
  if (filtered.length < 5) {
    filtered = [...scoredSongs]
      .sort((a, b) => {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency;
        return a.averagePosition - b.averagePosition;
      })
      .slice(0, 20);
  }

  // 3. Sort consensus tracks by average position to mirror concert pacing & flow
  filtered.sort((a, b) => a.averagePosition - b.averagePosition);

  // 4. Map to NormalizedTrack
  const tracks: NormalizedTrack[] = filtered.map((song) => ({
    name: song.canonicalName,
    originalArtist: song.originalArtist,
    isCover: song.isCover,
    isEncore: song.isEncore,
    setNumber: song.isEncore ? 2 : 1,
    info: song.info,
    confidenceScore: song.confidenceScore,
  }));

  const primaryShow = eligibleShows[0];
  const tourName = eligibleShows.find((s) => s.tour?.name)?.tour?.name;

  return {
    mode: "rehearsal",
    artistName: primaryShow.artist?.name || "Unknown Artist",
    tourName: tourName || undefined,
    venueInfo: `Tour consensus based on ${totalShows} recent show${totalShows > 1 ? "s" : ""}`,
    eventDate: primaryShow.eventDate,
    tracks,
    totalTracks: tracks.length,
  };
}
