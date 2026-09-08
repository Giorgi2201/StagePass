import { NextResponse } from "next/server";
import { searchArtists } from "@/lib/setlist";
import { enrichArtistsWithSpotifyImages } from "@/lib/spotify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' (artist name) is required" },
      { status: 400 }
    );
  }

  try {
    const limitParam = searchParams.get("limit");
    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 6, 1), 8)
      : 6;
    const rawArtists = await searchArtists(q, limit);
    const enrichedArtists = await enrichArtistsWithSpotifyImages(rawArtists);

    return NextResponse.json(enrichedArtists, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const status = message.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
