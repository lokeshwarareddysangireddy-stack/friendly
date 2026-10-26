import { priceCart, sanitizeLines } from "@/lib/cart/pricing";
import { isValidPincode } from "@/lib/utils";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lines = sanitizeLines(body?.items);
    const pincode = String(body?.pincode || "").replace(/\D/g, "");
    if (!lines.length) return jsonError("Your cart is empty", 400);
    if (pincode && !isValidPincode(pincode)) return jsonError("Enter a valid pincode", 422);
    if (body?.couponCode != null && (typeof body.couponCode !== "string" || body.couponCode.length > 40)) {
      return jsonError("Enter a valid coupon code", 422);
    }

    const priced = await priceCart(lines, pincode || undefined, body?.couponCode || "");
    if (priced.couponError) return jsonError(priced.couponError, 422);
    if (priced.lines.some((line) => line.error)) {
      return jsonError("Some items are unavailable. Please review your cart.", 409);
    }
    return jsonOk({ priced });
  } catch (error) {
    return handleRouteError(error);
  }
}
