import { CompactEncrypt, compactDecrypt } from "jose";
import { cookies } from "next/headers";

export interface SpotifyUserProfile {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  product?: string;
}

export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // numeric unix timestamp (ms)
  user: SpotifyUserProfile;
}

export const SESSION_COOKIE_NAME = "stagepass_session";
export const AUTH_STATE_COOKIE_NAME = "stagepass_auth_state";

/**
 * Derives a 256-bit cryptographic key from SESSION_SECRET for AES-256-GCM JWE encryption
 */
async function getEncryptionKey(): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    console.warn(
      "Warning: SESSION_SECRET is missing or shorter than 32 characters. Falling back to default."
    );
  }
  const secretKey =
    secret || "stagepass_super_secret_session_key_32bytes_min_len";
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secretKey)
  );
  return new Uint8Array(hash);
}

/**
 * Encrypts a session payload into a compact JWE string
 */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  const key = await getEncryptionKey();
  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key);
}

/**
 * Decrypts a compact JWE string back into SessionPayload
 */
export async function decryptSession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const key = await getEncryptionKey();
    const { plaintext } = await compactDecrypt(token, key);
    return JSON.parse(new TextDecoder().decode(plaintext)) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves and decrypts the current user session from the HTTP-only cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  return decryptSession(sessionCookie);
}

/**
 * Retrieves the current session and ensures the access token is fresh.
 * If within 5 minutes of expiring, automatically triggers a token refresh,
 * updates the session cookie, and returns the refreshed session.
 */
export async function getValidSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;

  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const isExpiringSoon = Date.now() >= session.expiresAt - FIVE_MINUTES_MS;

  if (isExpiringSoon) {
    const refreshed = await refreshSpotifyToken(session.refreshToken);
    if (!refreshed) {
      await clearSessionCookie();
      return null;
    }

    const updatedSession: SessionPayload = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || session.refreshToken,
      expiresAt: Date.now() + refreshed.expiresIn * 1000,
    };

    await setSessionCookie(updatedSession);
    return updatedSession;
  }

  return session;
}

/**
 * Encrypts and writes the session payload to the HTTP-only cookie
 */
export async function setSessionCookie(
  payload: SessionPayload
): Promise<string> {
  const encrypted = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
  return encrypted;
}

/**
 * Clears the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Stores the temporary CSRF state in a short-lived cookie
 */
export async function setAuthStateCookie(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
}

/**
 * Reads the temporary CSRF state cookie
 */
export async function getAuthStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_STATE_COOKIE_NAME)?.value ?? null;
}

/**
 * Clears the temporary CSRF state cookie
 */
export async function clearAuthStateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Refreshes an expired or expiring Spotify access token using the stored refresh token
 */
export async function refreshSpotifyToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
} | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Spotify client credentials for token refresh");
    return null;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Failed to refresh Spotify token:",
        response.status,
        await response.text()
      );
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    console.error("Network error refreshing Spotify token:", error);
    return null;
  }
}
