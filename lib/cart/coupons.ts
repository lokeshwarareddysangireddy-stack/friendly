import { z } from "zod";

const couponSchema = z.array(z.object({
  code: z.string().trim().min(1).max(40).transform((code) => code.toUpperCase()),
  amount: z.number().positive(),
  minOrder: z.number().nonnegative().default(0),
  expiresAt: z.string().datetime().optional(),
}));

export function resolveCoupon(
  input: string,
  subtotal: number,
  config = process.env.COUPONS_JSON || "[]",
  now = Date.now()
): { code: string | null; discount: number; error: string | null } {
  const code = input.trim().toUpperCase();
  const rejected = (error: string) => ({ code: null, discount: 0, error });
  if (!code) return { code: null, discount: 0, error: null };
  let coupons: z.infer<typeof couponSchema>;
  try {
    coupons = couponSchema.parse(JSON.parse(config));
  } catch {
    return rejected("Coupons are temporarily unavailable. Please try again later.");
  }
  const coupon = coupons.find((entry) => entry.code === code);
  if (!coupon) return rejected("This coupon code is not valid.");
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= now) {
    return rejected("This coupon has expired.");
  }
  if (subtotal < Math.round(coupon.minOrder * 100)) {
    return rejected(`This coupon requires a minimum subtotal of ₹${coupon.minOrder}.`);
  }
  // Keep a positive payable amount for the payment gateway.
  const discount = Math.min(Math.round(coupon.amount * 100), Math.max(0, subtotal - 100));
  if (discount <= 0) return rejected("This coupon cannot be applied to this cart.");
  return { code, discount, error: null };
}
