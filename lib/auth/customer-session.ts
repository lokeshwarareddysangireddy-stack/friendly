import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { jsonError } from "@/lib/http";

export const CUSTOMER_COOKIE = "fb_customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface CustomerSession {
  sub: string;
  email: string;
  name: string;
  mobile: string;
  emailVerified: boolean;
}

export function isCustomerAuthConfigured() {
  return Boolean(
    (process.env.CUSTOMER_AUTH_SECRET || process.env.ADMIN_AUTH_SECRET || "").length >= 16
  );
}

function getSecret() {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.ADMIN_AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CUSTOMER_AUTH_SECRET (or ADMIN_AUTH_SECRET) must be set to at least 16 characters");
    }
    return new TextEncoder().encode("dev-only-insecure-customer-secret-change-me");
  }
  return new TextEncoder().encode(secret);
}

export async function createCustomerSessionToken(session: CustomerSession) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyCustomerSessionToken(
  token: string
): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: String(payload.sub || ""),
      email: String(payload.email || ""),
      name: String(payload.name || ""),
      mobile: String(payload.mobile || ""),
      emailVerified: Boolean(payload.emailVerified),
    };
  } catch {
    return null;
  }
}

export function customerSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerSessionToken(token);
}

export async function setCustomerSessionCookie(token: string) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, token, customerSessionCookieOptions());
}

export async function clearCustomerSessionCookie() {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, "", { ...customerSessionCookieOptions(), maxAge: 0 });
}

export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session) return { session: null, response: jsonError("Please sign in to continue", 401) };
  return { session, response: null };
}
