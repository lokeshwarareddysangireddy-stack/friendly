import { findCustomerByResetToken, updateCustomer } from "@/lib/db";
import { hashPassword, tokenExpired } from "@/lib/auth/customer";
import { passwordResetSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`reset:${ip}`, 10, 60_000).allowed) {
      return jsonError("Too many attempts. Please try again shortly.", 429);
    }
    const body = await request.json();
    const parsed = passwordResetSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(first?.message || "Invalid reset request", 422);
    }
    const customer = await findCustomerByResetToken(parsed.data.token);
    if (!customer) return jsonError("This reset link is invalid or already used.", 400);
    if (tokenExpired(customer.resetTokenExpiry)) {
      return jsonError("This reset link has expired. Please request a new one.", 400);
    }
    const passwordHash = await hashPassword(parsed.data.password);
    await updateCustomer(customer._id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    });
    return jsonOk({ reset: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
