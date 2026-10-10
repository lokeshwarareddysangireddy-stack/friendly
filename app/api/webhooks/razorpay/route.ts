import {
  getOrderByOrderId,
  getPaymentByRazorpayOrderId,
  recordWebhookEvent,
  updateOrderByOrderId,
  updatePaymentRecord,
} from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        method?: string;
        amount?: number;
      };
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return jsonError("Webhook secret not configured", 503);
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return jsonError("Invalid webhook signature", 400);
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  const event = body.event || "unknown";
  const entity = body.payload?.payment?.entity;
  const eventId =
    request.headers.get("x-razorpay-event-id") ||
    `${event}:${entity?.id || entity?.order_id || Date.now()}`;

  try {
    const { created } = await recordWebhookEvent(eventId, event, body);
    if (!created) {
      return jsonOk({ received: true, duplicate: true });
    }

    const razorpayOrderId = entity?.order_id;
    if (razorpayOrderId) {
      const payment = await getPaymentByRazorpayOrderId(razorpayOrderId);
      const internalOrderId = payment?.orderId;
      if (internalOrderId) {
        const order = await getOrderByOrderId(internalOrderId);
        if (order && order.paymentStatus !== "paid") {
          if (event === "payment.captured" || event === "order.paid") {
            await updateOrderByOrderId(internalOrderId, {
              paymentStatus: "paid",
              fulfilmentStatus:
                order.fulfilmentStatus === "pending" ? "accepted" : order.fulfilmentStatus,
              razorpayPaymentId: entity?.id || order.razorpayPaymentId,
              paidAt: new Date().toISOString(),
            });
            await updatePaymentRecord(razorpayOrderId, {
              status: "captured",
              razorpayPaymentId: entity?.id || undefined,
              signatureVerified: true,
            });
          } else if (event === "payment.failed") {
            await updateOrderByOrderId(internalOrderId, { paymentStatus: "failed" });
            await updatePaymentRecord(razorpayOrderId, {
              status: "failed",
              razorpayPaymentId: entity?.id || undefined,
            });
          }
        }
      }
    }

    return jsonOk({ received: true });
  } catch (error) {
    console.error("[razorpay-webhook]", (error as Error).message);
    return jsonError("Webhook processing error", 500);
  }
}
