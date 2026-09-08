import { NextResponse } from "next/server";
import { fetchArtistTopTracks } from "@/lib/spotify";
import type { SetlistParseResult } from "@/types/setlist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get("artistName");
  const artistId = searchParams.get("artistId") || undefined;

  if (!artistName || !artistName.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'artistName' is required" },
      { status: 400 }
    );
  }

  const cleanName = artistName.trim();

  try {
    const tracks = await fetchArtistTopTracks(cleanName, artistId);

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: `No tracks found for artist "${cleanName}" on Spotify` },
        { status: 404 }
      );
    }

    const payload: SetlistParseResult = {
      mode: "essential",
      artistName: cleanName,
      tourName: "Essential Hits & Fan Favorites",
      venueInfo: "Studio Discography • Global Essentials",
      tracks,
      totalTracks: tracks.length,
    };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch artist top tracks";
    console.error(`[artist-top-tracks] Error for "${cleanName}":`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
