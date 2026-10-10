import crypto from "crypto";
import Razorpay from "razorpay";

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
}

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured");
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID as string,
      key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });
  }
  return client;
}

export interface CreateOrderResult {
  id: string;
  amount: number;
  currency: string;
  mock: boolean;
}

export async function createRazorpayOrder(input: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<CreateOrderResult> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  if (!isRazorpayConfigured()) {
    const id = `order_MOCK${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    return { id, amount: input.amount, currency: "INR", mock: true };
  }

  const order = await getClient().orders.create({
    amount: input.amount,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes,
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    mock: false,
  };
}

export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!isRazorpayConfigured()) {
    // Sandbox/demo mode: only an explicitly mock signature is accepted so the
    // end-to-end flow can be exercised without live credentials.
    return input.signature === "mock" && input.paymentId.startsWith("pay_MOCK");
  }
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature || "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature || "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function mockPaymentId() {
  return `pay_MOCK${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

export { getClient as razorpayClient };
