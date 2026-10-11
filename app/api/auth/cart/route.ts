import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById, updateCustomer } from "@/lib/db";
import { cartSaveSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, response } = await requireCustomer();
  if (!session) return response;
  const customer = await findCustomerById(session.sub);
  return jsonOk({ items: customer?.cart || [] });
}

export async function POST(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const body = await request.json();
    const parsed = cartSaveSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid cart", 422);
    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);
    const updated = await updateCustomer(customer._id, { cart: parsed.data.items });
    return jsonOk({ items: updated?.cart || parsed.data.items });
  } catch (error) {
    return handleRouteError(error);
  }
}
