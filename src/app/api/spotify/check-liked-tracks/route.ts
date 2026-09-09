import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/auth";
import { checkUserLikedTracks } from "@/lib/spotify";
import type {
  CheckLikedTracksRequest,
  CheckLikedTracksResponse,
} from "@/types/spotify";

export async function POST(request: Request) {
  // 1. Parse and validate incoming request body
  let body: CheckLikedTracksRequest;
  try {
    body = (await request.json()) as CheckLikedTracksRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  if (
    !body ||
    !Array.isArray(body.trackIds) ||
    body.trackIds.length === 0 ||
    !body.trackIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json(
      {
        error:
          "Field 'trackIds' is required and must be a non-empty array of strings",
      },
      { status: 400 }
    );
  }

  const { trackIds, tracks, artistName } = body;

  // 2. Authentication check
  const session = await getValidSession();

  try {
    const fs = await import("fs");
    fs.appendFileSync(
      "debug_spotify.log",
      `\n[${new Date().toISOString()}] /api/spotify/check-liked-tracks called.\n` +
        `artist: ${artistName || "unknown"}\n` +
        `trackIds count: ${trackIds.length}, concert tracks count: ${tracks?.length || 0}\n` +
        `session present: ${Boolean(session)}\n` +
        `user: ${session?.user?.id || "none"}\n`
    );
  } catch {}

  // 3. Graceful guest mode handling:
  // If unauthenticated or no valid token, return 200 with isGuest: true
  if (!session || !session.accessToken) {
    try {
      const fs = await import("fs");
      fs.appendFileSync("debug_spotify.log", "Returning isGuest: true\n");
    } catch {}

    const guestPayload: CheckLikedTracksResponse = {
      success: false,
      isGuest: true,
      likedMap: {},
      likedCount: 0,
      totalChecked: tracks?.length || trackIds.length,
      readinessPercentage: 0,
    };

    return NextResponse.json(guestPayload, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  }

  // 4. Authenticated user library check
  try {
    const result = await checkUserLikedTracks(
      trackIds,
      session.accessToken,
      tracks,
      artistName
    );

    try {
      const fs = await import("fs");
      fs.appendFileSync(
        "debug_spotify.log",
        `checkUserLikedTracks result: success=${result.success}, needsReauth=${result.needsReauth}, likedCount=${result.likedCount}, totalChecked=${result.totalChecked}, readinessPercentage=${result.readinessPercentage}\n` +
          `sample likedMap entries: ${JSON.stringify(Object.entries(result.likedMap).slice(0, 5))}\n`
      );
    } catch {}

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    try {
      const fs = await import("fs");
      fs.appendFileSync(
        "debug_spotify.log",
        `checkUserLikedTracks ERROR: ${String(error)}\n`
      );
    } catch {}
    console.error("[check-liked-tracks route] Failed to check library:", error);
    return NextResponse.json(
      {
        error: "Failed to verify tracks in user library",
      },
      { status: 500 }
    );
  }
}
