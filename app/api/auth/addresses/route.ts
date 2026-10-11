import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById, updateCustomer } from "@/lib/db";
import { newId } from "@/lib/db/memory";
import { addressSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import type { AddressDoc } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, response } = await requireCustomer();
  if (!session) return response;
  const customer = await findCustomerById(session.sub);
  return jsonOk({ addresses: customer?.addresses || [] });
}

export async function POST(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(first?.message || "Please check the address", 422);
    }
    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);

    const address: AddressDoc = {
      _id: newId("addr"),
      ...parsed.data,
      isDefault: parsed.data.isDefault || customer.addresses.length === 0,
    };
    let addresses = [...customer.addresses];
    if (address.isDefault) addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    addresses.push(address);
    const updated = await updateCustomer(customer._id, { addresses });
    return jsonOk({ addresses: updated?.addresses || addresses });
  } catch (error) {
    return handleRouteError(error);
  }
}
