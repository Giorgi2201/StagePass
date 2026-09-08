import { NextResponse } from "next/server";
import {
  AUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  clearAuthStateCookie,
  encryptSession,
  getAppBaseUrl,
  getAuthStateCookie,
  getSpotifyRedirectUri,
  type SessionPayload,
  type SpotifyUserProfile,
} from "@/lib/auth";

export async function GET(request: Request) {
  const baseUrl = getAppBaseUrl(request);
  const redirectUri = getSpotifyRedirectUri(request);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // 1. Catch Spotify OAuth error parameter (e.g. user canceled or developer mode sandbox rejection)
  if (error) {
    console.warn(`[OAuth Callback] Spotify returned OAuth error: ${error}`);
    return NextResponse.redirect(
      new URL("/?auth_error=developer_mode", baseUrl)
    );
  }

  if (!code || !state) {
    console.warn(
      `[OAuth Callback] Missing code or state: code=${Boolean(code)}, state=${Boolean(state)}`
    );
    return NextResponse.redirect(
      new URL("/?auth_error=developer_mode", baseUrl)
    );
  }

  // 2. Verify CSRF state token from incoming request cookies or next/headers
  const cookieState =
    (
      request as unknown as {
        cookies?: { get: (name: string) => { value?: string } | undefined };
      }
    ).cookies?.get?.(AUTH_STATE_COOKIE_NAME)?.value ||
    (await getAuthStateCookie());

  await clearAuthStateCookie();

  if (!cookieState || cookieState !== state) {
    console.error(
      `[OAuth Callback] CSRF state mismatch or missing! incoming="${state}", stored="${cookieState}"`
    );
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "[OAuth Callback] Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment"
    );
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    // 3. Exchange authorization code for user access token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
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

    if (!tokenRes.ok) {
      const tokenData = await tokenRes.text();
      console.error("Spotify token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL("/?auth_error=token_failed", baseUrl)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const refreshToken: string = tokenData.refresh_token;
    const expiresIn: number = tokenData.expires_in ?? 3600;

    // 4. Fetch user's Spotify profile using the user's freshly exchanged OAuth access token directly
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!profileRes.ok) {
      const profileData = await profileRes.text();
      console.error("Profile fetch failed:", profileData);
      return NextResponse.redirect(
        new URL("/?auth_error=profile_failed", baseUrl)
      );
    }

    const profileData = await profileRes.json();

    const user: SpotifyUserProfile = {
      id: profileData.id,
      displayName: profileData.display_name || profileData.id,
      email: profileData.email,
      avatarUrl: profileData.images?.[0]?.url,
      product: profileData.product,
    };

    // 5. Assemble and encrypt session with jose
    const sessionPayload: SessionPayload = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user,
    };

    const sessionToken = await encryptSession(sessionPayload);

    // 6. Construct redirect and dynamically determine secure cookie flag
    const response = NextResponse.redirect(new URL("/", baseUrl));

    const isLocal =
      baseUrl.includes("127.0.0.1") || baseUrl.includes("localhost");
    const isSecure = process.env.NODE_ENV === "production" && !isLocal;

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set({
      name: AUTH_STATE_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("[OAuth Callback] Unexpected error handling Spotify callback:", err);
    return NextResponse.redirect(
      new URL("/?auth_error=token_failed", baseUrl)
    );
  }
}
