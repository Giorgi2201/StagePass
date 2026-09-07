import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSession,
  refreshSpotifyToken,
  setSessionCookie,
} from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
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
      // Refresh token is revoked or network failed; clear session
      await clearSessionCookie();
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
      });
    }

    // Update session with new token and expiry
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
