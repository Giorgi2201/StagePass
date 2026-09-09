import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/auth";
import {
  addTracksToPlaylist,
  batchMatchTracks,
  createSpotifyPlaylist,
  uploadPlaylistCoverImage,
} from "@/lib/spotify";
import type {
  CreatePlaylistRequest,
  CreatePlaylistResponse,
} from "@/types/spotify";

export async function POST(request: Request) {
  // 1. Verify user session and ensure active Spotify access token
  const session = await getValidSession();

  if (!session || !session.accessToken || !session.user?.id) {
    return NextResponse.json(
      {
        error:
          "Authentication required. Please connect your Spotify account to create playlists.",
      },
      { status: 401 }
    );
  }

  // 2. Parse and validate request body
  let body: CreatePlaylistRequest;
  try {
    body = (await request.json()) as CreatePlaylistRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const {
    concertTitle,
    description = "Generated with StagePass",
    isPublic = false,
    performingArtist,
    artistMbid,
    artistSpotifyId,
    tracks,
    coverImageBase64,
  } = body;

  if (!concertTitle || !concertTitle.trim()) {
    return NextResponse.json(
      { error: "Field 'concertTitle' is required" },
      { status: 400 }
    );
  }

  if (!performingArtist || !performingArtist.trim()) {
    return NextResponse.json(
      { error: "Field 'performingArtist' is required" },
      { status: 400 }
    );
  }

  if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
    return NextResponse.json(
      { error: "Field 'tracks' must be a non-empty array of tracks" },
      { status: 400 }
    );
  }

  try {
    // 3. Match tracks on Spotify with controlled concurrency & catalog strategy
    const matchResults = await batchMatchTracks(
      tracks,
      performingArtist.trim(),
      session.accessToken,
      5,
      artistMbid,
      artistSpotifyId
    );

    const matchedUris: string[] = [];
    const unmatchedTracks: string[] = [];

    for (const res of matchResults) {
      if (res.status === "matched" && res.spotifyTrack?.uri) {
        matchedUris.push(res.spotifyTrack.uri);
      } else {
        unmatchedTracks.push(res.originalQuery);
      }
    }

    // 4. If zero tracks were found, reject with 422
    if (matchedUris.length === 0) {
      return NextResponse.json(
        {
          error:
            "None of the setlist tracks could be resolved on Spotify. Unable to create playlist.",
          unmatchedTracks,
        },
        { status: 422 }
      );
    }

    // 5. Create the official playlist on the user's Spotify account (POST /me/playlists)
    const playlist = await createSpotifyPlaylist(
      concertTitle.trim(),
      description,
      isPublic,
      session.accessToken
    );

    // 6. Add the resolved track URIs in chunks of up to 100
    await addTracksToPlaylist(playlist.id, matchedUris, session.accessToken);

    // 6.5. Resilient cover art upload decoupling (failsafe: does not fail playlist creation)
    let coverUploaded: boolean | undefined = undefined;
    if (coverImageBase64) {
      try {
        const uploadSuccess = await uploadPlaylistCoverImage(
          playlist.id,
          coverImageBase64,
          session.accessToken
        );
        coverUploaded = uploadSuccess;
        if (uploadSuccess) {
          console.log(
            `[Spotify API] Custom cover art uploaded successfully for playlist ${playlist.id}`
          );
        } else {
          console.warn(
            `[Spotify API] Custom cover upload failed for playlist ${playlist.id}, playlist created successfully`
          );
        }
      } catch (coverErr) {
        console.warn(
          `[Spotify API] Non-fatal error during cover upload for playlist ${playlist.id}:`,
          coverErr
        );
        coverUploaded = false;
      }
    }

    // 7. Return complete playlist metadata and statistics
    const responsePayload: CreatePlaylistResponse = {
      success: true,
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
      playlistUri: playlist.uri,
      snapshotId: playlist.snapshot_id,
      matchedCount: matchedUris.length,
      totalRequested: tracks.length,
      unmatchedTracks,
      coverUploaded,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    console.error("Error creating Spotify playlist:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
