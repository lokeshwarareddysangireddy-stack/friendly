import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById } from "@/lib/db";
import { issueVerifyToken } from "@/lib/auth/customer";
import { sendVerificationEmail } from "@/lib/notifications";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    if (!rateLimit(`verify-resend:${session.sub}`, 4, 60_000).allowed) {
      return jsonError("Please wait a moment before requesting another email.", 429);
    }
    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);
    if (customer.emailVerified) return jsonOk({ alreadyVerified: true });

    const token = await issueVerifyToken(customer._id);
    const result = await sendVerificationEmail(customer, token);
    const verifyUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/verify-email?token=${token}`;
    return jsonOk({
      sent: result.status === "sent",
      verificationUrl: result.status === "sent" ? null : verifyUrl,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
