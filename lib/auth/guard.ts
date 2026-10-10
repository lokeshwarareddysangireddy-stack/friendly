import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/http";

export async function requireApiSession() {
  const session = await getSession();
  if (!session) return { session: null, response: jsonError("Unauthorized", 401) };
  return { session, response: null };
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set("fb_admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set("fb_admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
