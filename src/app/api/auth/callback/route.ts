import { NextResponse } from "next/server";
import {
  clearAuthStateCookie,
  getAuthStateCookie,
  setSessionCookie,
  type SessionPayload,
  type SpotifyUserProfile,
} from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;

  if (error) {
    console.warn("Spotify OAuth authorization error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_authorization_code`);
  }

  // Verify CSRF state token
  const storedState = await getAuthStateCookie();
  await clearAuthStateCookie();

  if (!storedState || storedState !== state) {
    console.error("State mismatch in OAuth callback");
    return NextResponse.redirect(`${baseUrl}/?error=state_mismatch`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Spotify credentials in environment");
    return NextResponse.redirect(`${baseUrl}/?error=server_configuration_error`);
  }

  const redirectUri = `${baseUrl}/api/auth/callback`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Spotify token exchange failed:", tokenResponse.status, errorText);
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken: string = tokenData.access_token;
    const refreshToken: string = tokenData.refresh_token;
    const expiresIn: number = tokenData.expires_in ?? 3600;

    // 2. Fetch user's Spotify profile
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      console.error("Failed to fetch Spotify profile:", profileResponse.status);
      return NextResponse.redirect(`${baseUrl}/?error=profile_fetch_failed`);
    }

    const profileData = await profileResponse.json();

    const user: SpotifyUserProfile = {
      id: profileData.id,
      displayName: profileData.display_name || profileData.id,
      email: profileData.email,
      avatarUrl: profileData.images?.[0]?.url,
      product: profileData.product,
    };

    // 3. Assemble and encrypt session
    const sessionPayload: SessionPayload = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.redirect(`${baseUrl}/?auth=success`);
  } catch (err) {
    console.error("Error handling Spotify callback:", err);
    return NextResponse.redirect(`${baseUrl}/?error=internal_error`);
  }
}
