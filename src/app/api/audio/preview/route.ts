import { NextResponse } from "next/server";
import { resolveTrackPreview } from "@/lib/audio-preview";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track");
  const artist = searchParams.get("artist");
  const spotifyPreviewUrl = searchParams.get("spotifyPreviewUrl") || undefined;

  if (!track || !track.trim() || !artist || !artist.trim()) {
    return NextResponse.json(
      { error: "Query parameters 'track' and 'artist' are both required" },
      { status: 400 }
    );
  }

  try {
    const previewResult = await resolveTrackPreview(
      track.trim(),
      artist.trim(),
      spotifyPreviewUrl
    );

    return NextResponse.json(previewResult, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    console.error("[api/audio/preview] Error resolving audio preview:", error);
    return NextResponse.json(
      {
        error: "Failed to resolve track preview",
      },
      { status: 500 }
    );
  }
}
