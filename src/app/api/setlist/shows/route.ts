import { NextResponse } from "next/server";
import { getArtistShows } from "@/lib/setlist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mbid = searchParams.get("mbid");
  const pageParam = searchParams.get("p");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  if (!mbid || !mbid.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'mbid' (artist MusicBrainz ID) is required" },
      { status: 400 }
    );
  }

  if (isNaN(page) || page < 1) {
    return NextResponse.json(
      { error: "Query parameter 'p' must be a positive integer" },
      { status: 400 }
    );
  }

  try {
    const shows = await getArtistShows(mbid.trim(), page);
    return NextResponse.json(shows, {
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
