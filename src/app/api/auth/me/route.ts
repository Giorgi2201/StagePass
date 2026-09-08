import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  decryptSession,
  refreshSpotifyToken,
  setSessionCookie,
} from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
    });
  }

  const session = await decryptSession(sessionCookie);

  if (!session || !session.user?.id) {
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
    });
  }

  // Token Refresh Check: If token is within 5 minutes of expiring (or expired)
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const isExpiringSoon = Date.now() >= session.expiresAt - FIVE_MINUTES_MS;

  if (isExpiringSoon) {
    const refreshed = await refreshSpotifyToken(session.refreshToken);

    if (!refreshed) {
      console.warn(
        `[/api/auth/me] Refresh token failed or revoked for "${session.user.displayName}". Clearing session.`
      );
      await clearSessionCookie();
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
      });
    }

    const updatedSession = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || session.refreshToken,
      expiresAt: Date.now() + refreshed.expiresIn * 1000,
    };

    await setSessionCookie(updatedSession);

    return NextResponse.json({
      isAuthenticated: true,
      user: updatedSession.user,
    });
  }

  return NextResponse.json({
    isAuthenticated: true,
    user: session.user,
  });
}
