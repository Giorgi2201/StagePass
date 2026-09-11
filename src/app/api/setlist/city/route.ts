import { NextResponse } from "next/server";
import { searchSetlistsByCity } from "@/lib/setlist";
import type { CitySearchResponse } from "@/types/setlist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: "Query parameter 'q' (city name) must be at least 2 characters long",
      },
      { status: 400 }
    );
  }

  const cleanQuery = q.trim();

  try {
    const shows = await searchSetlistsByCity(cleanQuery);

    const responsePayload: CitySearchResponse = {
      success: true,
      cityName: cleanQuery,
      shows,
      totalFound: shows.length,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    const isRateLimit = message.toLowerCase().includes("rate limit");

    return NextResponse.json(
      {
        success: false,
        error: isRateLimit
          ? "Setlist.fm rate limit reached. Please try again shortly."
          : message,
      },
      {
        status: isRateLimit ? 429 : 500,
        headers: isRateLimit
          ? {
              "Retry-After": "2",
            }
          : undefined,
      }
    );
  }
}
