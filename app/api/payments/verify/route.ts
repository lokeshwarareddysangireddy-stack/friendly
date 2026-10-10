import {
  getOrderByOrderId,
  getPaymentByRazorpayOrderId,
  updateOrderByOrderId,
  updatePaymentRecord,
} from "@/lib/db";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const limit = rateLimit(`pay-verify:${ip}`, 40, 60_000);
    if (!limit.allowed) return jsonError("Too many requests", 429);

    const body = await request.json();
    const orderId = String(body?.orderId || "");
    const razorpayOrderId = String(body?.razorpayOrderId || "");
    const razorpayPaymentId = String(body?.razorpayPaymentId || "");
    const signature = String(body?.signature || "");

    if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
      return jsonError("Missing payment verification fields", 422);
    }

    const order = await getOrderByOrderId(orderId);
    if (!order) return jsonError("Order not found", 404);

    if (order.paymentStatus === "paid") {
      return jsonOk({
        orderId: order.orderId,
        lookupToken: order.lookupToken,
        paid: true,
        alreadyVerified: true,
      });
    }

    const valid = verifyCheckoutSignature({
      orderId,
      paymentId: razorpayPaymentId,
      signature,
    });

    if (!valid) {
      await updatePaymentRecord(razorpayOrderId, {
        status: "failed",
        razorpayPaymentId,
        signatureVerified: false,
      });
      return jsonError("Payment verification failed. No charge confirmation received.", 400);
    }

    const paidAt = new Date().toISOString();
    const updated = await updateOrderByOrderId(orderId, {
      paymentStatus: "paid",
      fulfilmentStatus: "accepted",
      razorpayPaymentId,
      razorpaySignature: signature,
      paidAt,
    });

    await updatePaymentRecord(razorpayOrderId, {
      status: "captured",
      razorpayPaymentId,
      signatureVerified: true,
    });

    const payment = await getPaymentByRazorpayOrderId(razorpayOrderId);
    if (payment) {
      await updatePaymentRecord(razorpayOrderId, { raw: { verifiedAt: paidAt } });
    }

    return jsonOk({
      orderId: updated?.orderId ?? orderId,
      lookupToken: updated?.lookupToken ?? order.lookupToken,
      paid: true,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
