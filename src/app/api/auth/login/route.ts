import { NextResponse } from "next/server";
import {
  AUTH_STATE_COOKIE_NAME,
  getAppBaseUrl,
  getSpotifyRedirectUri,
  setAuthStateCookie,
} from "@/lib/auth";

export async function GET(request: Request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    console.error("[OAuth Login] SPOTIFY_CLIENT_ID is not configured");
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID is not configured" },
      { status: 500 }
    );
  }

  // If visited via localhost in local dev, bounce to 127.0.0.1 immediately
  // so that the CSRF cookie is set on the exact origin Spotify returns to.
  const host = request.headers.get("host") || "";
  if (process.env.NODE_ENV !== "production" && host.includes("localhost")) {
    return NextResponse.redirect(new URL("/api/auth/login", "http://127.0.0.1:3000"));
  }

  // Use the exact unified helper
  const redirectUri = getSpotifyRedirectUri(request);

  // Generate cryptographically secure random state for CSRF protection
  const state = crypto.randomUUID();

  // Also set via next/headers for redundancy
  await setAuthStateCookie(state);

  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-library-read",
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

  const response = NextResponse.redirect(spotifyAuthUrl.toString());

  const baseUrl = getAppBaseUrl(request);
  const isLocal =
    baseUrl.includes("127.0.0.1") || baseUrl.includes("localhost");
  const isSecure = process.env.NODE_ENV === "production" && !isLocal;

  // Attach state cookie directly to redirect response object so browser receives Set-Cookie
  response.cookies.set({
    name: AUTH_STATE_COOKIE_NAME,
    value: state,
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });

  return response;
}
