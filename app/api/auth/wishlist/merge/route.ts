import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById, updateCustomer } from "@/lib/db";
import { wishlistMergeSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const body = await request.json();
    const parsed = wishlistMergeSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid wishlist", 422);
    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);
    const merged = Array.from(new Set([...parsed.data.ids, ...customer.wishlist]));
    await updateCustomer(customer._id, { wishlist: merged });
    return jsonOk({ ids: merged });
  } catch (error) {
    return handleRouteError(error);
  }
}
