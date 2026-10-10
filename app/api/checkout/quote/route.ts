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
    if (!isValidPincode(pincode)) return jsonError("Enter a valid pincode", 422);

    const priced = await priceCart(lines, pincode);
    return jsonOk({ priced });
  } catch (error) {
    return handleRouteError(error);
  }
}
