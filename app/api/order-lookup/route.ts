import { getOrderByOrderId } from "@/lib/db";
import { normalizeMobile } from "@/lib/utils";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`lookup:${ip}`, 20, 60_000).allowed) {
      return jsonError("Too many attempts. Please try again shortly.", 429);
    }

    const body = await request.json();
    const orderId = String(body?.orderId || "").trim().toUpperCase();
    const mobile = normalizeMobile(String(body?.mobile || ""));

    if (!orderId || !mobile) {
      return jsonError("Enter your order ID and registered mobile number", 422);
    }

    const order = await getOrderByOrderId(orderId);
    if (!order || normalizeMobile(order.customer.mobile) !== mobile) {
      return jsonError("No order found for those details", 404);
    }

    return jsonOk({
      orderId: order.orderId,
      lookupToken: order.lookupToken,
      paymentStatus: order.paymentStatus,
      fulfilmentStatus: order.fulfilmentStatus,
      createdAt: order.createdAt,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
