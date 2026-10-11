import { requireCustomer } from "@/lib/auth/customer-session";
import { getOrderByOrderId } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { session, response } = await requireCustomer();
  if (!session) return response;
  const { orderId } = await params;
  const order = await getOrderByOrderId(orderId);
  if (!order) return jsonError("Order not found", 404);
  if (order.customerId !== session.sub && order.customerEmail !== session.email) {
    return jsonError("Order not found", 404);
  }
  return jsonOk({ order });
}
