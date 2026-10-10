import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "fb_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface AdminSession {
  sub: string;
  email: string;
  name: string;
  role: string;
}

function getSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_AUTH_SECRET must be set to at least 16 characters");
    }
    return new TextEncoder().encode("dev-only-insecure-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AdminSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: String(payload.sub || payload.sub),
      email: String(payload.email || ""),
      name: String(payload.name || ""),
      role: String(payload.role || "admin"),
    } as AdminSession & { sub: string };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
