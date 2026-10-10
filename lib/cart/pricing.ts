import { getProductsByIds } from "@/lib/db";
import { quoteDelivery } from "@/lib/delivery";
import type { CartLine, CartLineResolved, PricedCart } from "@/types";

export function sanitizeLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  const lines: CartLine[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const productId = String((raw as { productId?: unknown }).productId || "").trim();
    const quantity = Math.floor(Number((raw as { quantity?: unknown }).quantity));
    if (!productId || !Number.isFinite(quantity) || quantity < 1) continue;
    lines.push({ productId, quantity: Math.min(quantity, 99) });
  }
  return lines.slice(0, 50);
}

export async function priceCart(
  lines: CartLine[],
  pincode?: string
): Promise<PricedCart> {
  const ids = lines.map((l) => l.productId);
  const products = await getProductsByIds(ids);
  const byId = new Map(products.map((p) => [p._id, p]));

  const resolved: CartLineResolved[] = [];
  const issues: string[] = [];
  let subtotal = 0;

  for (const line of lines) {
    const product = byId.get(line.productId) || null;
    if (!product) {
      resolved.push({
        ...line,
        product: null,
        error: "This item is no longer available.",
        lineTotal: 0,
      });
      issues.push("Some items in your cart are no longer available.");
      continue;
    }

    const onlineOk =
      product.active &&
      product.available &&
      (product.orderingMethod === "online" || product.orderingMethod === "both");

    if (!onlineOk) {
      resolved.push({
        ...line,
        product,
        error: "This item is not available for online ordering.",
        lineTotal: 0,
      });
      issues.push(`${product.name} is not available for online ordering.`);
      continue;
    }

    if (
      product.trackStock &&
      product.stockQty != null &&
      line.quantity > product.stockQty
    ) {
      resolved.push({
        ...line,
        product,
        error: `Only ${product.stockQty} left in stock.`,
        lineTotal: 0,
      });
      issues.push(`${product.name} has limited stock.`);
      continue;
    }

    const lineTotal = product.price * line.quantity;
    subtotal += lineTotal;
    resolved.push({ ...line, product, lineTotal });
  }

  const discount = 0;
  let deliveryCharge = 0;
  let zone = null as PricedCart["zone"];
  let freeDeliveryApplied = false;

  if (pincode) {
    const quote = await quoteDelivery(pincode, subtotal - discount);
    zone = quote.zone;
    deliveryCharge = quote.supported ? quote.deliveryCharge : 0;
    freeDeliveryApplied = quote.freeDeliveryApplied;
    if (!quote.supported && quote.reason === "unknown_pincode") {
      issues.push("We do not currently have online delivery configured for this pincode.");
    }
    if (!quote.supported && quote.reason === "below_minimum" && quote.minOrderValue) {
      issues.push("Your order is below the minimum order value for this delivery zone.");
    }
  }

  const total = subtotal - discount + deliveryCharge;

  return {
    lines: resolved,
    subtotal,
    discount,
    deliveryCharge,
    total,
    issues,
    zone,
    freeDeliveryApplied,
  };
}
