/**
 * Audio Preview Resolver Service
 *
 * Provides a resilient dual-source audio preview resolver:
 * 1. Primary source: Spotify catalog track preview_url
 * 2. Guaranteed fallback: Public, unauthenticated iTunes Search API (30-second audio stream + artwork)
 */

export interface AudioPreviewResult {
  previewUrl: string | null;
  source: "spotify" | "itunes" | null;
  artworkUrl: string | null;
  trackTitle: string;
  artistName: string;
}

interface ITunesSearchResult {
  resultCount: number;
  results: Array<{
    trackName?: string;
    artistName?: string;
    previewUrl?: string;
    artworkUrl100?: string;
    artworkUrl60?: string;
  }>;
}

/**
 * Strips setlist noise, live annotations, and guest appearances to maximize search accuracy
 */
function cleanTrackTitle(title: string): string {
  if (!title) return "";

  let cleaned = title;

  // 1. Remove bracketed / parenthetical indicators (Live, Acoustic, Edit, Deluxe, etc.)
  cleaned = cleaned.replace(
    /\s*[\(\[](?:acoustic|live|solo|snippet|extended|reprise|intro|outro|jam|interlude|acoustic version|piano version|deluxe|remastered|edit)[\)\]]/gi,
    ""
  );

  // 2. Remove feat. / ft. / with guest appearances
  cleaned = cleaned.replace(/\s+(?:feat\.?|ft\.?|featuring|with)\s+.*$/i, "");

  // 3. Remove quotation marks and typographical artifacts
  cleaned = cleaned.replace(/["'“”‘’`]/g, "");

  // 4. Remove trailing punctuation
  cleaned = cleaned.replace(/[\s\-\/,:.]+$/, "");

  // 5. Collapse duplicate whitespace
  return cleaned.replace(/\s+/g, " ").trim();
}

/**
 * Resolves a 30-second preview audio stream URL and artwork for any concert track
 */
export async function resolveTrackPreview(
  trackTitle: string,
  artistName: string,
  existingSpotifyPreviewUrl?: string | null
): Promise<AudioPreviewResult> {
  const cleanTitle = cleanTrackTitle(trackTitle) || trackTitle.trim();
  const cleanArtist = artistName.trim();

  // 1. Primary Source: Existing Spotify catalog preview URL
  if (
    existingSpotifyPreviewUrl &&
    typeof existingSpotifyPreviewUrl === "string" &&
    existingSpotifyPreviewUrl.startsWith("http")
  ) {
    return {
      previewUrl: existingSpotifyPreviewUrl,
      source: "spotify",
      artworkUrl: null,
      trackTitle,
      artistName,
    };
  }

  // 2. Guaranteed Fallback: iTunes Search API
  try {
    const searchTerm = `${cleanArtist} ${cleanTitle}`;
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      searchTerm
    )}&entity=song&limit=1`;

    const response = await fetch(itunesUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 86400 }, // Cache at framework layer for 24h
    });

    if (response.ok) {
      const data = (await response.json()) as ITunesSearchResult;

      if (data && data.resultCount > 0 && data.results && data.results[0]) {
        const item = data.results[0];

        if (item.previewUrl && typeof item.previewUrl === "string") {
          // Upgrade 100x100 artwork to higher resolution (600x600) if available
          let highResArtwork: string | null = null;
          if (item.artworkUrl100) {
            highResArtwork = item.artworkUrl100.replace("100x100bb", "600x600bb");
          } else if (item.artworkUrl60) {
            highResArtwork = item.artworkUrl60.replace("60x60bb", "600x600bb");
          }

          return {
            previewUrl: item.previewUrl,
            source: "itunes",
            artworkUrl: highResArtwork,
            trackTitle,
            artistName,
          };
        }
      }
    }
  } catch (error) {
    console.warn(
      `[Audio Preview] iTunes fallback search failed for "${cleanArtist} - ${cleanTitle}":`,
      error
    );
  }

  // 3. Fallback: No preview available
  return {
    previewUrl: null,
    source: null,
    artworkUrl: null,
    trackTitle,
    artistName,
  };
}
