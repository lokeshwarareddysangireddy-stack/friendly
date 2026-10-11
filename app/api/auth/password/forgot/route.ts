import { findCustomerByEmail } from "@/lib/db";
import { issueResetToken } from "@/lib/auth/customer";
import { sendResetEmail } from "@/lib/notifications";
import { passwordResetRequestSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`forgot:${ip}`, 6, 60_000).allowed) {
      return jsonError("Too many requests. Please try again shortly.", 429);
    }
    const body = await request.json();
    const parsed = passwordResetRequestSchema.safeParse(body);
    if (!parsed.success) return jsonError("Enter a valid email", 422);

    const customer = await findCustomerByEmail(parsed.data.email);
    let resetUrl: string | null = null;
    if (customer && customer.active) {
      const token = await issueResetToken(customer._id);
      const result = await sendResetEmail(customer, token);
      if (result.status !== "sent") {
        resetUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/reset-password?token=${token}`;
      }
    }
    // Always return the same generic message to avoid revealing registered emails.
    return jsonOk({
      message: "If an account exists for that email, a reset link has been sent.",
      resetUrl,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
