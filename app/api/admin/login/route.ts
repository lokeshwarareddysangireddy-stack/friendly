import { authenticateAdmin, ensureInitialAdmin, publicAdmin } from "@/lib/auth/admin";
import { createSessionToken } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/guard";
import { loginSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`admin-login:${ip}`, 10, 60_000).allowed) {
      return jsonError("Too many attempts. Please try again shortly.", 429);
    }

    await ensureInitialAdmin();

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Enter a valid email and password", 422);
    }

    const admin = await authenticateAdmin(parsed.data.email, parsed.data.password);
    if (!admin) return jsonError("Invalid email or password", 401);

    const token = await createSessionToken({
      sub: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
    await setSessionCookie(token);

    return jsonOk({ admin: publicAdmin(admin) });
  } catch (error) {
    return handleRouteError(error);
  }
}
