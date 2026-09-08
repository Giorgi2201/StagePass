import { NextResponse } from "next/server";
import { resolveYouTubePlaylist } from "@/lib/youtube";
import type { YouTubePlaylistRequest } from "@/types/youtube";

export async function POST(request: Request) {
  try {
    let body: YouTubePlaylistRequest;
    try {
      body = (await request.json()) as YouTubePlaylistRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload" },
        { status: 400 }
      );
    }

    const { performingArtist, tracks } = body;

    // 1. Validate required fields
    if (!performingArtist || typeof performingArtist !== "string" || !performingArtist.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid 'performingArtist' parameter" },
        { status: 400 }
      );
    }

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'tracks' array" },
        { status: 400 }
      );
    }

    // 2. Resolve tracks into queued YouTube / YouTube Music playlist
    const result = await resolveYouTubePlaylist(tracks, performingArtist.trim());

    // 3. If zero tracks could be matched, return 422 Unprocessable Entity
    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          error: "Unable to match any tracks from this setlist on YouTube",
          result,
        },
        { status: 422 }
      );
    }

    // 4. Return successful playlist response with edge cache headers
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (err) {
    console.error("[YouTube API Error] Failed to generate YouTube playlist:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while generating the YouTube playlist",
      },
      { status: 500 }
    );
  }
}
