import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAdminUserById, type PublicAdminUser } from "@/lib/admin-users";
import { mongoConfigured } from "@/lib/mongo";

const COOKIE = "rp_admin_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_CACHE_MS = 30_000;

type CacheEntry = { user: PublicAdminUser; cachedAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __reelpermitAdminSessionCache: Map<string, CacheEntry> | undefined;
}

function sessionCache() {
  if (!globalThis.__reelpermitAdminSessionCache) {
    globalThis.__reelpermitAdminSessionCache = new Map();
  }
  return globalThis.__reelpermitAdminSessionCache;
}

/** Used only to sign session cookies (not the login password). */
function sessionSecret() {
  return (
    process.env.ADMIN_PANEL_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    ""
  );
}

export function adminAuthConfigured(): boolean {
  return sessionSecret().length >= 8 && mongoConfigured();
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/** Token format: userId.exp.signature */
export function createAdminSessionToken(userId: string): string {
  const exp = String(Date.now() + TTL_MS);
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function parseAdminSessionToken(
  token: string | undefined | null,
): { userId: string; exp: number } | null {
  if (!token || !adminAuthConfigured()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!userId || !exp || !sig) return null;
  if (Number(exp) < Date.now()) return null;
  const payload = `${userId}.${exp}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { userId, exp: Number(exp) };
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  return parseAdminSessionToken(token) !== null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSessionUser()) !== null;
}

export function invalidateAdminSessionUser(userId: string) {
  sessionCache().delete(userId);
}

export async function getAdminSessionUser(): Promise<PublicAdminUser | null> {
  const jar = await cookies();
  const parsed = parseAdminSessionToken(jar.get(COOKIE)?.value);
  if (!parsed) return null;

  const cached = sessionCache().get(parsed.userId);
  if (cached && Date.now() - cached.cachedAt < SESSION_CACHE_MS) {
    if (cached.user.status === "disabled") return null;
    return cached.user;
  }

  const user = await getAdminUserById(parsed.userId);
  if (!user || user.status === "disabled") {
    sessionCache().delete(parsed.userId);
    return null;
  }
  sessionCache().set(parsed.userId, { user, cachedAt: Date.now() });
  return user;
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  };
}

export function clearAdminSessionCookie() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
