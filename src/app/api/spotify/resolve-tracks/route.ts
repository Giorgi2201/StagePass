import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/auth";
import { matchTrackWithCandidates } from "@/lib/spotify";
import type { NormalizedTrack } from "@/types/setlist";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tracks, performingArtist } = body as {
      tracks: NormalizedTrack[];
      performingArtist: string;
    };

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: "Field 'tracks' is required and must be an array" },
        { status: 400 }
      );
    }

    const session = await getValidSession();
    const token = session?.accessToken || "";

    const resolvedTracks = await Promise.all(
      tracks.map(async (track) => {
        try {
          const match = await matchTrackWithCandidates(
            track.name,
            performingArtist || "",
            track.originalArtist,
            track.isCover,
            token
          );

          if (match.bestTrack?.id) {
            return {
              ...track,
              id: match.bestTrack.id,
              candidateIds: match.candidateIds,
            };
          }
          return track;
        } catch {
          return track;
        }
      })
    );

    return NextResponse.json(
      { tracks: resolvedTracks },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error("[resolve-tracks route] Error:", error);
    return NextResponse.json(
      { error: "Failed to resolve tracks" },
      { status: 500 }
    );
  }
}
