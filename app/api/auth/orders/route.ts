import { requireCustomer } from "@/lib/auth/customer-session";
import { listOrders } from "@/lib/db";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, response } = await requireCustomer();
  if (!session) return response;
  const { items } = await listOrders({ customerId: session.sub, limit: 50 });
  return jsonOk({ orders: items });
}
