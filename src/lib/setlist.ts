import type {
  NormalizedArtist,
  NormalizedShow,
  NormalizedTrack,
  RawArtist,
  RawArtistSearchResponse,
  RawSet,
  RawSetlist,
  RawSetlistsResponse,
  RawSong,
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

const FEATURE_MARKERS = /\b(feat\.?|ft\.?|featuring|with|vs\.?)\b/i;
const COLLAB_SEPARATORS =
  /\b(feat\.?|ft\.?|featuring|with|vs\.?|and)\b|[,&+/\u00d7]|(\s+[xX]\s+)/i;
const TRIBUTE_REGEX =
  /\b(tribute|impersonator|cover\s*band|cover\s*brasil|experience|bootleg|orchestra|ensemble)\b/i;

export interface ArtistRelevanceScore {
  tier: 1 | 2 | 3 | 4 | 5;
  score: number;
  reason: string;
}

/**
 * Multi-Tiered Relevance Scoring Algorithm for Setlist.fm Artists:
 * - Tier 1: Exact Name / Direct Alias in Disambiguation (e.g. "Ye" formerly Kanye West)
 * - Tier 2: Primary Solo / Band Match (starts with/contains query, no collaborative keywords)
 * - Tier 3: Established Side Projects & Duos (e.g. "¥$", "Silk Sonic", "The Postal Service")
 * - Tier 4: Collaborative Noise & One-off Guest Features ("Lil Wayne feat. Kanye West")
 * - Tier 5: Tribute & Cover Bands (demoted below all original cataloged artists)
 */
export function scoreArtistRelevance(
  name: string,
  disambiguation: string | undefined,
  query: string
): ArtistRelevanceScore {
  const lowerQuery = query.toLowerCase().trim();
  const lowerName = (name || "").toLowerCase().trim();
  const lowerDisambiguation = (disambiguation || "").toLowerCase().trim();

  const queryHasFeature = FEATURE_MARKERS.test(lowerQuery);
  const queryHasCollab = COLLAB_SEPARATORS.test(lowerQuery);

  const isTribute =
    TRIBUTE_REGEX.test(lowerName) || TRIBUTE_REGEX.test(lowerDisambiguation);
  const nameHasFeature = FEATURE_MARKERS.test(lowerName);
  const nameHasCollab = COLLAB_SEPARATORS.test(lowerName);

  // 1. Tier 1: Exact / Alias Match
  if (lowerName === lowerQuery) {
    return { tier: 1, score: 100, reason: "exact_name" };
  }

  if (lowerName === `the ${lowerQuery}` || `the ${lowerName}` === lowerQuery) {
    return { tier: 1, score: 98, reason: "exact_the_prefix" };
  }

  // Direct alias in disambiguation (e.g. "Ye" -> "formerly Kanye West")
  const isDirectAlias =
    !isTribute &&
    !nameHasCollab &&
    (lowerDisambiguation === lowerQuery ||
      lowerDisambiguation === `formerly ${lowerQuery}` ||
      lowerDisambiguation.includes(`formerly ${lowerQuery}`) ||
      lowerDisambiguation.includes(`formerly known as ${lowerQuery}`) ||
      lowerDisambiguation.includes(`aka ${lowerQuery}`) ||
      lowerDisambiguation.includes(`a.k.a. ${lowerQuery}`) ||
      lowerDisambiguation.startsWith(`formerly ${lowerQuery}`) ||
      lowerDisambiguation.startsWith(`aka ${lowerQuery}`));

  if (isDirectAlias) {
    return { tier: 1, score: 95, reason: "alias_disambiguation" };
  }

  // Demote tribute bands below all original recordings
  if (isTribute) {
    return { tier: 5, score: 10, reason: "tribute_band" };
  }

  // Tier 3: Established Side Projects / Duos with distinct project name
  // e.g. "¥$" (disambiguation: "Ye & Ty Dolla $ign"), "The Postal Service", "Silk Sonic"
  // where artist name has no collab separators, but disambiguation connects to query
  if (
    !nameHasCollab &&
    (lowerDisambiguation.includes(lowerQuery) ||
      (lowerQuery.includes("kanye") && lowerDisambiguation.includes("ye")) ||
      (lowerQuery.includes("ye") && lowerDisambiguation.includes("kanye")))
  ) {
    return { tier: 3, score: 65, reason: "established_side_project" };
  }

  // Tier 4: Guest / Feature Noise (e.g. "Lil Wayne feat. Kanye West")
  if (!queryHasFeature && nameHasFeature) {
    return { tier: 4, score: 15, reason: "guest_feature" };
  }

  // Tier 4: Collaborative noise (with, vs, &, commas) when query does not request collaboration
  if (!queryHasCollab && nameHasCollab) {
    return { tier: 4, score: 20, reason: "collaborative_noise" };
  }

  // Tier 2: Primary Solo / Band Match (clean standalone artist)
  if (!nameHasCollab) {
    if (lowerName.startsWith(lowerQuery)) {
      return { tier: 2, score: 85, reason: "clean_starts_with" };
    }
    if (lowerName.includes(lowerQuery)) {
      return { tier: 2, score: 75, reason: "clean_contains" };
    }
  }

  // If query DID have collab keywords and name matches
  if (
    queryHasCollab &&
    (lowerName.includes(lowerQuery) || lowerDisambiguation.includes(lowerQuery))
  ) {
    return { tier: 3, score: 60, reason: "requested_collaboration" };
  }

  return { tier: 4, score: 15, reason: "fallback_low_relevance" };
}

/**
 * Search artists by name with multi-tiered relevance scoring & collaborative noise filtering.
 * Returns top 6 (up to 8) highest-relevance artists, prioritizing primary solo profiles.
 */
export async function searchArtists(
  query: string,
  maxResults = 6
): Promise<NormalizedArtist[]> {
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

  const cappedMax = Math.min(Math.max(maxResults, 1), 8);

  const scored = artists.map((a) => ({
    artist: {
      id: a.mbid,
      name: a.name,
      disambiguation: a.disambiguation,
    },
    ...scoreArtistRelevance(a.name, a.disambiguation, trimmed),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Filter out Tier 4 (guest noise) and Tier 5 (tributes) if we have primary candidates (Tier 1-3)
  const primaryResults = scored.filter((item) => item.tier <= 3);
  const finalCandidates =
    primaryResults.length > 0
      ? primaryResults
      : scored.filter((item) => item.tier <= 4);

  return finalCandidates.slice(0, cappedMax).map((item) => item.artist);
}

/**
 * Safely extracts an array of RawSet objects from a RawSetlist,
 * handling Setlist.fm quirks where `sets` can be empty string, null,
 * or `sets.set` can be a single object instead of an array.
 */
export function extractRawSets(setlist: RawSetlist): RawSet[] {
  if (!setlist || !setlist.sets || typeof setlist.sets !== "object") {
    return [];
  }

  const rawSet = (setlist.sets as { set?: unknown }).set;
  if (!rawSet) {
    return [];
  }

  if (Array.isArray(rawSet)) {
    return rawSet.filter(
      (s): s is RawSet => Boolean(s && typeof s === "object")
    );
  }

  if (typeof rawSet === "object" && rawSet !== null) {
    return [rawSet as RawSet];
  }

  return [];
}

/**
 * Safely extracts an array of RawSong objects from a set.song field,
 * handling cases where `song` is a single object, an array, empty string, or undefined.
 */
export function extractRawSongs(songField: unknown): RawSong[] {
  if (!songField) {
    return [];
  }

  if (Array.isArray(songField)) {
    return songField.filter(
      (s): s is RawSong =>
        Boolean(
          s &&
            typeof s === "object" &&
            "name" in s &&
            typeof (s as { name: unknown }).name === "string"
        )
    );
  }

  if (
    typeof songField === "object" &&
    songField !== null &&
    "name" in songField &&
    typeof (songField as { name: unknown }).name === "string"
  ) {
    return [songField as RawSong];
  }

  return [];
}

/**
 * Robust helper to count valid, non-tape songs in a raw setlist.
 * Handles all Setlist.fm JSON variations without throwing runtime errors.
 */
export function countSongsInSetlist(setlist: RawSetlist): number {
  const sets = extractRawSets(setlist);
  if (sets.length === 0) return 0;

  let count = 0;
  for (const set of sets) {
    const songs = extractRawSongs(set.song);
    for (const s of songs) {
      if (!s.tape && s.name && typeof s.name === "string" && s.name.trim()) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Safely parses "DD-MM-YYYY" into a numeric timestamp for sorting descending
 */
export function parseEventDate(dateStr?: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day).getTime();
  }
  return 0;
}

/**
 * Get recent shows for an artist, filtering out shows with 0 recorded songs.
 * Automatically traverses to Page 2 if Page 1 has fewer than 5 completed shows
 * (e.g. for actively touring artists with upcoming future tour dates/empty entries).
 */
export async function getArtistShows(
  mbid: string,
  page = 1
): Promise<NormalizedShow[]> {
  const page1Data = await fetchSetlistFm<RawSetlistsResponse>(
    `/artist/${encodeURIComponent(mbid)}/setlists?p=${page}`
  );

  if (!page1Data || !page1Data.setlist) {
    return [];
  }

  const allRawSetlists: RawSetlist[] = Array.isArray(page1Data.setlist)
    ? [...page1Data.setlist]
    : [page1Data.setlist];

  // Count playable shows in page 1
  const page1PlayableCount = allRawSetlists.filter(
    (s) => countSongsInSetlist(s) > 0
  ).length;

  // If page 1 has fewer than 5 completed shows with songs, automatically fetch page 2
  if (page === 1 && page1PlayableCount < 5 && page1Data.total && page1Data.total > 20) {
    try {
      const page2Data = await fetchSetlistFm<RawSetlistsResponse>(
        `/artist/${encodeURIComponent(mbid)}/setlists?p=2`
      );
      if (page2Data?.setlist) {
        const page2Setlists = Array.isArray(page2Data.setlist)
          ? page2Data.setlist
          : [page2Data.setlist];
        allRawSetlists.push(...page2Setlists);
      }
    } catch (err) {
      console.warn("Failed to fetch page 2 setlists for artist:", err);
    }
  }

  // Filter only shows that actually have recorded songs (songCount > 0)
  const normalizedShows: NormalizedShow[] = allRawSetlists
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

  // Sort by event date descending so the most recent completed shows appear first
  normalizedShows.sort(
    (a, b) => parseEventDate(b.eventDate) - parseEventDate(a.eventDate)
  );

  // Return up to 20 completed, playable shows
  return normalizedShows.slice(0, 20);
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
 * Fetch recent completed shows with songs for consensus analysis.
 * Traverses past empty upcoming tour stops across up to 3 pages to collect
 * the 5 most recent completed concerts that actually have recorded setlists.
 */
export async function getRecentRawSetlists(
  mbid: string,
  maxShows = 5
): Promise<RawSetlist[]> {
  const collectedShows: RawSetlist[] = [];
  const MAX_PAGES = 3;

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const data = await fetchSetlistFm<RawSetlistsResponse>(
        `/artist/${encodeURIComponent(mbid)}/setlists?p=${page}`
      );

      if (!data || !data.setlist) {
        break;
      }

      const setlists: RawSetlist[] = Array.isArray(data.setlist)
        ? data.setlist
        : [data.setlist];

      for (const s of setlists) {
        if (countSongsInSetlist(s) > 0) {
          collectedShows.push(s);
        }
      }

      if (collectedShows.length >= maxShows) {
        break;
      }

      if (data.total && data.total <= page * 20) {
        break;
      }
    } catch (err) {
      console.warn(`Error fetching setlists page ${page} for artist ${mbid}:`, err);
      break;
    }
  }

  // Sort by event date descending
  collectedShows.sort(
    (a, b) => parseEventDate(b.eventDate) - parseEventDate(a.eventDate)
  );

  return collectedShows.slice(0, maxShows);
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
  const rawSets = extractRawSets(rawSetlist);

  let currentSetNumber = 1;

  for (const set of rawSets) {
    const isEncore = Boolean(set.encore);
    const songs = extractRawSongs(set.song);

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
    const rawSets = extractRawSets(show);
    let positionInShow = 1;

    for (const set of rawSets) {
      const isEncore = Boolean(set.encore);
      const songs = extractRawSongs(set.song);

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
