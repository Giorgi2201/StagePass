import { NextResponse } from "next/server";
import {
  calculateRehearsalConsensus,
  getRawSetlist,
  getRecentRawSetlists,
  parseMemorySetlist,
} from "@/lib/setlist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (!mode || (mode !== "memory" && mode !== "rehearsal")) {
    return NextResponse.json(
      {
        error:
          "Query parameter 'mode' is required and must be either 'memory' or 'rehearsal'",
      },
      { status: 400 }
    );
  }

  try {
    if (mode === "memory") {
      const setlistId = searchParams.get("setlistId");
      if (!setlistId || !setlistId.trim()) {
        return NextResponse.json(
          {
            error:
              "Query parameter 'setlistId' is required when mode is 'memory'",
          },
          { status: 400 }
        );
      }

      const rawSetlist = await getRawSetlist(setlistId.trim());

      if (!rawSetlist) {
        return NextResponse.json(
          { error: `Setlist not found for ID '${setlistId}'` },
          { status: 404 }
        );
      }

      const parseResult = parseMemorySetlist(rawSetlist);

      return NextResponse.json(parseResult, {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      });
    }

    // Mode is "rehearsal"
    const mbid = searchParams.get("mbid");
    if (!mbid || !mbid.trim()) {
      return NextResponse.json(
        {
          error:
            "Query parameter 'mbid' (artist MusicBrainz ID) is required when mode is 'rehearsal'",
        },
        { status: 400 }
      );
    }

    const recentSetlists = await getRecentRawSetlists(mbid.trim(), 5);

    if (!recentSetlists || recentSetlists.length === 0) {
      return NextResponse.json(
        {
          error:
            "No recorded concert setlists found for this artist to calculate rehearsal consensus",
        },
        { status: 404 }
      );
    }

    const consensusResult = calculateRehearsalConsensus(recentSetlists);

    return NextResponse.json(consensusResult, {
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
