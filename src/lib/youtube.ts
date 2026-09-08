import YouTube from "youtube-sr";
import type { NormalizedTrack } from "@/types/setlist";
import type { YouTubePlaylistResponse } from "@/types/youtube";

// In-Memory LRU / Cache to prevent duplicate searches and provide sub-millisecond lookups
const videoCache = new Map<string, string>();
const MAX_CACHE_SIZE = 2000;

function getCacheKey(artist: string, track: string): string {
  return `${artist.toLowerCase().trim()}:${track.toLowerCase().trim()}`;
}

function getFromCache(artist: string, track: string): string | undefined {
  return videoCache.get(getCacheKey(artist, track));
}

function setInCache(artist: string, track: string, videoId: string): void {
  if (videoCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const oldestKey = videoCache.keys().next().value;
    if (oldestKey) videoCache.delete(oldestKey);
  }
  videoCache.set(getCacheKey(artist, track), videoId);
}

/**
 * Strips noise, parentheticals, and annotations from track titles
 * to ensure high-accuracy search matches on YouTube
 */
function sanitizeTrackTitle(title: string): string {
  if (!title) return "";
  let clean = title;

  // 1. Remove parenthetical / bracketed notes: (Acoustic), [Live], (Solo), (Snippet), (Extended), etc.
  clean = clean.replace(
    /\s*[\(\[](?:acoustic|live|solo|snippet|extended|reprise|intro|outro|jam|interlude|acoustic version|piano version)[\)\]]/gi,
    ""
  );

  // 2. Remove "feat. ...", "ft. ...", "featuring ...", "with ..."
  clean = clean.replace(/\s+(?:feat\.?|ft\.?|featuring|with)\s+.*$/i, "");

  // 3. Remove quotation marks and typographical artifacts
  clean = clean.replace(/["'“”‘’`]/g, "");

  // 4. Remove trailing dashes, slashes, or punctuation
  clean = clean.replace(/[\s\-\/,:.]+$/, "");

  // 5. Collapse duplicate whitespace
  return clean.replace(/\s+/g, " ").trim();
}

/**
 * Regular expression detecting non-musical, loop, tutorial, or reaction videos
 */
const JUNK_VIDEO_REGEX =
  /\b(1\s*hour|10\s*hours|hour\s*loop|loop\s*version|reaction|reacts|tutorial|lesson|how\s*to\s*play|bass\s*tab|guitar\s*tab|drum\s*cover|karaoke\s*version|parody)\b/i;

const MIN_DURATION_MS = 45 * 1000; // 45 seconds
const MAX_DURATION_MS = 900 * 1000; // 15 minutes

interface SearchCandidate {
  id?: string;
  title?: string;
  duration?: number;
}

/**
 * Checks if a candidate video meets music video quality criteria
 */
function isValidMusicVideo(candidate: SearchCandidate): boolean {
  if (!candidate.id || candidate.id.length !== 11) return false;

  // Check duration if available: reject 1-hour loops or sub-45-second soundbites
  if (typeof candidate.duration === "number" && candidate.duration > 0) {
    if (candidate.duration < MIN_DURATION_MS || candidate.duration > MAX_DURATION_MS) {
      return false;
    }
  }

  // Reject titles matching known non-musical / loop junk patterns
  if (candidate.title && JUNK_VIDEO_REGEX.test(candidate.title)) {
    return false;
  }

  return true;
}

/**
 * Searches YouTube for video candidates matching a given query string
 */
async function queryYouTube(query: string): Promise<SearchCandidate[]> {
  try {
    const results = await YouTube.search(query, {
      limit: 5,
      type: "video",
    });
    return results.map((v) => ({
      id: v.id,
      title: v.title,
      duration: v.duration,
    }));
  } catch {
    return [];
  }
}

/**
 * Resolves a single setlist track into an 11-character YouTube video ID
 * using multi-tier fallback queries and music duration/title validation
 */
export async function resolveYouTubeVideoId(
  trackTitle: string,
  performingArtist: string,
  originalArtist?: string,
  isCover = false
): Promise<string | null> {
  const cleanTitle = sanitizeTrackTitle(trackTitle);
  if (!cleanTitle || !performingArtist) return null;

  // 1. Check in-memory cache
  const cached = getFromCache(performingArtist, cleanTitle);
  if (cached) return cached;

  // 2. Build multi-tier search queries
  const queries: string[] = [];

  if (isCover && originalArtist) {
    const cleanOriginal = sanitizeTrackTitle(originalArtist);
    queries.push(`"${performingArtist}" - "${cleanTitle}"`);
    queries.push(`"${cleanOriginal}" - "${cleanTitle}" (Official Audio)`);
    queries.push(`${cleanOriginal} ${cleanTitle}`);
  } else {
    queries.push(`"${performingArtist}" - "${cleanTitle}" (Official Audio)`);
    queries.push(`"${performingArtist}" - "${cleanTitle}"`);
    queries.push(`${performingArtist} ${cleanTitle}`);
  }

  // 3. Execute queries sequentially until a valid candidate is found
  for (const query of queries) {
    const candidates = await queryYouTube(query);
    const valid = candidates.find(isValidMusicVideo);
    if (valid?.id) {
      setInCache(performingArtist, cleanTitle, valid.id);
      return valid.id;
    }
  }

  return null;
}

/**
 * Resolves a batch of tracks concurrently with controlled parallelism,
 * compiling video IDs and constructing ready-to-save YouTube / YouTube Music URLs
 */
export async function resolveYouTubePlaylist(
  tracks: NormalizedTrack[],
  performingArtist: string,
  concurrency = 5
): Promise<YouTubePlaylistResponse> {
  const videoIds: string[] = [];
  const unmatchedTracks: string[] = [];

  for (let i = 0; i < tracks.length; i += concurrency) {
    const chunk = tracks.slice(i, i + concurrency);

    const results = await Promise.all(
      chunk.map(async (track) => {
        try {
          const videoId = await resolveYouTubeVideoId(
            track.name,
            performingArtist,
            track.originalArtist,
            track.isCover
          );
          return { name: track.name, videoId };
        } catch {
          return { name: track.name, videoId: null };
        }
      })
    );

    for (const res of results) {
      if (res.videoId) {
        videoIds.push(res.videoId);
      } else {
        unmatchedTracks.push(res.name);
      }
    }
  }

  const hasMatches = videoIds.length > 0;
  const idsList = videoIds.join(",");

  return {
    success: hasMatches,
    youtubeUrl: hasMatches
      ? `https://www.youtube.com/watch_videos?video_ids=${idsList}`
      : "",
    youtubeMusicUrl: hasMatches
      ? `https://music.youtube.com/watch_videos?video_ids=${idsList}`
      : "",
    videoIds,
    matchedCount: videoIds.length,
    totalRequested: tracks.length,
    unmatchedTracks,
  };
}
