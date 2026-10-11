import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById, getProductsByIds, updateCustomer } from "@/lib/db";
import { wishlistToggleSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, response } = await requireCustomer();
  if (!session) return response;
  const customer = await findCustomerById(session.sub);
  const ids = customer?.wishlist || [];
  const items = await getProductsByIds(ids);
  return jsonOk({ ids, items });
}

export async function POST(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const body = await request.json();
    const parsed = wishlistToggleSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid product", 422);

    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);

    const exists = customer.wishlist.includes(parsed.data.productId);
    const wishlist = exists
      ? customer.wishlist.filter((id) => id !== parsed.data.productId)
      : [parsed.data.productId, ...customer.wishlist];
    await updateCustomer(customer._id, { wishlist });
    return jsonOk({ ids: wishlist, added: !exists });
  } catch (error) {
    return handleRouteError(error);
  }
}
