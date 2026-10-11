import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById, updateCustomer } from "@/lib/db";
import { publicCustomer } from "@/lib/auth/customer";
import { customerProfileSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const body = await request.json();
    const parsed = customerProfileSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(first?.message || "Please check your details", 422);
    }
    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);
    const updated = await updateCustomer(customer._id, {
      name: parsed.data.name,
      mobile: parsed.data.mobile,
    });
    return jsonOk({ customer: publicCustomer(updated || customer) });
  } catch (error) {
    return handleRouteError(error);
  }
}
