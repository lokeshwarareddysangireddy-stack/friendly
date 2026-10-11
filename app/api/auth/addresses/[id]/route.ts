import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById, updateCustomer } from "@/lib/db";
import { addressSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const { id } = await params;
    const body = await request.json();
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Please check the address", 422);

    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);

    let addresses = customer.addresses.map((a) =>
      a._id === id ? { ...a, ...parsed.data } : a
    );
    if (parsed.data.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: a._id === id }));
    }
    const updated = await updateCustomer(customer._id, { addresses });
    return jsonOk({ addresses: updated?.addresses || addresses });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const { id } = await params;
    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);
    let addresses = customer.addresses.filter((a) => a._id !== id);
    if (addresses.length && !addresses.some((a) => a.isDefault)) {
      addresses = addresses.map((a, i) => ({ ...a, isDefault: i === 0 }));
    }
    const updated = await updateCustomer(customer._id, { addresses });
    return jsonOk({ addresses: updated?.addresses || addresses });
  } catch (error) {
    return handleRouteError(error);
  }
}
