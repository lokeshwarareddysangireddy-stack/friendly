import { authenticateCustomer, publicCustomer } from "@/lib/auth/customer";
import { createCustomerSessionToken, setCustomerSessionCookie } from "@/lib/auth/customer-session";
import { customerLoginSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`customer-login:${ip}`, 12, 60_000).allowed) {
      return jsonError("Too many attempts. Please try again shortly.", 429);
    }
    const body = await request.json();
    const parsed = customerLoginSchema.safeParse(body);
    if (!parsed.success) return jsonError("Enter a valid email and password", 422);

    const customer = await authenticateCustomer(parsed.data.email, parsed.data.password);
    if (!customer) return jsonError("Invalid email or password", 401);

    const token = await createCustomerSessionToken({
      sub: customer._id,
      email: customer.email,
      name: customer.name,
      mobile: customer.mobile,
      emailVerified: customer.emailVerified,
    });
    await setCustomerSessionCookie(token);
    return jsonOk({ customer: publicCustomer(customer) });
  } catch (error) {
    return handleRouteError(error);
  }
}
