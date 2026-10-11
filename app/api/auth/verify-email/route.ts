import { findCustomerByVerifyToken, updateCustomer } from "@/lib/db";
import { publicCustomer, tokenExpired } from "@/lib/auth/customer";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { token?: string };
    const token = (body.token || "").trim();
    if (!token) return jsonError("This verification link is invalid.", 400);

    const customer = await findCustomerByVerifyToken(token);
    if (!customer) return jsonError("This verification link is invalid or already used.", 400);
    if (customer.emailVerified) {
      return jsonOk({ customer: publicCustomer(customer), alreadyVerified: true });
    }
    if (tokenExpired(customer.verifyTokenExpiry)) {
      return jsonError("This verification link has expired. Please request a new one.", 400);
    }
    const updated = await updateCustomer(customer._id, {
      emailVerified: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    });
    return jsonOk({ customer: updated ? publicCustomer(updated) : publicCustomer(customer) });
  } catch (error) {
    return handleRouteError(error);
  }
}
