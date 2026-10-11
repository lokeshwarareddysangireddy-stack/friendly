import { registerCustomer, publicCustomer } from "@/lib/auth/customer";
import { sendVerificationEmail } from "@/lib/notifications";
import { customerRegisterSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`register:${ip}`, 8, 60_000).allowed) {
      return jsonError("Too many attempts. Please try again in a minute.", 429);
    }
    const body = await request.json();
    const parsed = customerRegisterSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(first?.message || "Please check your details", 422);
    }
    const { customer, verifyToken } = await registerCustomer(parsed.data);
    const result = await sendVerificationEmail(customer, verifyToken);
    const verifyUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/verify-email?token=${verifyToken}`;
    return jsonOk({
      customer: publicCustomer(customer),
      verificationEmailSent: result.status === "sent",
      // When no email provider is configured we surface the real link so the
      // account can still be verified (never a fake "email sent" claim).
      verificationUrl: result.status === "sent" ? null : verifyUrl,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "EMAIL_EXISTS") {
      return jsonError("An account with this email already exists. Try signing in.", 409);
    }
    return handleRouteError(error);
  }
}
