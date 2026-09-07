import { NextResponse } from "next/server";
import { setAuthStateCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID is not configured" },
      { status: 500 }
    );
  }

  const { origin } = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || origin;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  // Generate cryptographically secure random state for CSRF protection
  const state = crypto.randomUUID();
  await setAuthStateCookie(state);

  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-modify-public",
    "playlist-modify-private",
  ].join(" ");

  const spotifyAuthUrl = new URL("https://accounts.spotify.com/authorize");
  spotifyAuthUrl.searchParams.set("client_id", clientId);
  spotifyAuthUrl.searchParams.set("response_type", "code");
  spotifyAuthUrl.searchParams.set("redirect_uri", redirectUri);
  spotifyAuthUrl.searchParams.set("state", state);
  spotifyAuthUrl.searchParams.set("scope", scopes);
  spotifyAuthUrl.searchParams.set("show_dialog", "true");

  return NextResponse.redirect(spotifyAuthUrl.toString());
}
