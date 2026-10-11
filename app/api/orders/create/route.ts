import crypto from "crypto";
import { createOrder, createPaymentRecord, updateOrderByOrderId } from "@/lib/db";
import { getCustomerSession } from "@/lib/auth/customer-session";
import { priceCart, sanitizeLines } from "@/lib/cart/pricing";
import { quoteDelivery } from "@/lib/delivery";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { checkoutSchema } from "@/lib/validation/schemas";
import { generateOrderId, normalizeMobile } from "@/lib/utils";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import type { OrderItemSnapshot } from "@/types";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const limit = rateLimit(`order-create:${ip}`, 20, 60_000);
    if (!limit.allowed) {
      return jsonError("Too many requests. Please wait a moment and try again.", 429);
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!fields[key]) fields[key] = issue.message;
      }
      return jsonError("Please correct the highlighted fields", 422, { fields });
    }

    const { customer, items } = parsed.data;
    const lines = sanitizeLines(items);
    if (!lines.length) return jsonError("Your cart is empty", 400);

    const session = await getCustomerSession();
    if (process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
      if (!session) {
        return jsonError("Please sign in to place your order.", 401, {
          reason: "auth_required",
        });
      }
      if (!session.emailVerified) {
        return jsonError("Please verify your email before placing your order.", 403, {
          reason: "email_verification_required",
        });
      }
    }

    const priced = await priceCart(lines, customer.pincode);

    const invalid = priced.lines.filter((l) => l.error || !l.product);
    if (invalid.length) {
      return jsonError("Some items are unavailable. Please review your cart.", 409, {
        issues: priced.issues,
      });
    }

    const quote = await quoteDelivery(customer.pincode, priced.subtotal);
    if (!quote.supported) {
      const message =
        quote.reason === "below_minimum"
          ? "Your order is below the minimum order value for this delivery zone."
          : "Online delivery is not currently configured for this pincode. Please send a WhatsApp enquiry.";
      return jsonError(message, 422, { reason: quote.reason });
    }

    const orderItems: OrderItemSnapshot[] = priced.lines.map((l) => ({
      productId: l.product!._id,
      name: l.product!.name,
      slug: l.product!.slug,
      price: l.product!.price,
      mrp: l.product!.mrp ?? null,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
      image: l.product!.images?.[0]?.url,
      unit: l.product!.unit,
    }));

    const subtotal = priced.subtotal;
    const discount = 0;
    const deliveryCharge = quote.deliveryCharge;
    const total = subtotal - discount + deliveryCharge;

    if (total <= 0) return jsonError("Invalid order total", 422);

    const orderId = generateOrderId();
    const lookupToken = crypto.randomBytes(24).toString("hex");

    const order = await createOrder({
      orderId,
      items: orderItems,
      subtotal,
      discount,
      deliveryCharge,
      total,
      customer: {
        name: customer.name,
        mobile: normalizeMobile(customer.mobile),
        address: customer.address,
        pincode: customer.pincode,
        city: customer.city,
        state: customer.state,
        instructions: customer.instructions || "",
      },
      customerId: session?.sub ?? null,
      customerEmail: session?.email ?? null,
      delivery: {
        zoneId: quote.zone?._id ?? null,
        zoneName: quote.zone?.name ?? null,
        zoneCode: quote.zone?.zoneCode ?? null,
        deliveryCharge,
        freeDeliveryApplied: quote.freeDeliveryApplied,
        etaText: quote.etaText,
      },
      paymentStatus: "pending",
      fulfilmentStatus: "pending",
      paymentMethod: "razorpay",
      lookupToken,
      paidAt: null,
    });

    const rzpOrder = await createRazorpayOrder({
      amount: total,
      receipt: orderId,
      notes: { orderId, pincode: customer.pincode },
    });

    await updateOrderByOrderId(orderId, { razorpayOrderId: rzpOrder.id });

    await createPaymentRecord({
      orderId,
      internalOrderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency: "INR",
      status: "created",
    });

    return jsonOk({
      orderId,
      lookupToken,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency: "INR",
      mock: rzpOrder.mock,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  return jsonOk({ configured: isRazorpayConfigured() });
}
