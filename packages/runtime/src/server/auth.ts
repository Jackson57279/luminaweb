/**
 * Auth resolution.
 *
 * Resolves the current identity for a request. Reads:
 *   - Cookie `zapdev_session` for a stored provider identity
 *   - Query param `?zapdev_guest=<name>` for a per-tab guest
 *   - Falls back to a generated guest identity
 *
 * Google sign-in is wired through a separate endpoint; the resulting
 * identity is stored in a session cookie.
 */

import type { AuthIdentity, ServerEnv } from "./index.js";

const COOKIE_NAME = "zapdev_session";

export async function resolveAuth(req: Request, options: { env: ServerEnv }): Promise<AuthIdentity> {
  const url = new URL(req.url);
  const guestParam = url.searchParams.get("zapdev_guest");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const session = cookies[COOKIE_NAME];

  if (guestParam) {
    return guestIdentity(guestParam);
  }

  if (session) {
    try {
      const decoded = JSON.parse(Buffer.from(session, "base64url").toString("utf-8"));
      if (decoded && typeof decoded === "object" && "userId" in decoded) {
        return decoded as AuthIdentity;
      }
    } catch {
      // ignore bad cookie
    }
  }

  return guestIdentity(`guest-${shortId()}`);
}

export function guestIdentity(name: string): AuthIdentity {
  return {
    userId: `guest:${name}`,
    displayName: name,
    provider: "guest",
    isGuest: true,
    isAuthenticated: false,
  };
}

export function encodeSessionCookie(identity: AuthIdentity): string {
  const value = Buffer.from(JSON.stringify(identity), "utf-8").toString("base64url");
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = rest.join("=");
  }
  return out;
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}
