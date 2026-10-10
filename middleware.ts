import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "fb_admin_session";

/**
 * Middleware runs in the Edge runtime, where process.env.ADMIN_AUTH_SECRET is
 * not reliably available on a self-hosted `next start` (it is only read from
 * the Node runtime). So we validate the session by asking the session route,
 * which runs in Node and does the real JWT verification.
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const url = new URL("/api/admin/session", request.url);
    const res = await fetch(url, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data?: { session?: unknown } };
    return Boolean(json?.data?.session);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Login issues the cookie; the session route validates it for us.
  if (pathname === "/api/admin/login" || pathname === "/api/admin/session") {
    return NextResponse.next();
  }

  // Every other admin API route protects itself with requireApiSession(),
  // which verifies the JWT in the Node runtime.
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(request);

  if (pathname === "/admin/login") {
    if (authed) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (!authed) {
    const url = new URL("/admin/login", request.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
