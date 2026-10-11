import { requireCustomer } from "@/lib/auth/customer-session";
import { findCustomerById, updateCustomer } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/customer";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { session, response } = await requireCustomer();
    if (!session) return response;
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return jsonError(first?.message || "Please check your passwords", 422);
    }
    const customer = await findCustomerById(session.sub);
    if (!customer) return jsonError("Account not found", 404);

    const ok = await verifyPassword(parsed.data.currentPassword, customer.passwordHash);
    if (!ok) return jsonError("Your current password is incorrect", 400);

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await updateCustomer(customer._id, { passwordHash });
    return jsonOk({ changed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
