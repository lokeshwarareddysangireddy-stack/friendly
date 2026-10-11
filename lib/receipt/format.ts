import { SITE } from "@/lib/site";

export interface ReceiptData {
  orderId: string;
  createdAt: string;
  paidAt?: string | null;
  paymentStatus: string;
  paymentMethod: string;
  razorpayPaymentId?: string | null;
  customer: {
    name: string;
    mobile: string;
    address: string;
    area?: string;
    landmark?: string;
    pincode?: string;
    city?: string;
    state?: string;
    instructions?: string;
  };
  delivery: {
    zoneName?: string | null;
    deliveryCharge: number;
    freeDeliveryApplied: boolean;
    etaText?: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    lineTotal: number;
    unit?: string;
  }[];
  subtotal: number;
  discount: number;
  total: number;
}

export function maskMobile(mobile: string) {
  const digits = (mobile || "").replace(/\D/g, "");
  if (digits.length < 4) return digits;
  return `${"\u2022".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export function formatReceiptText(data: ReceiptData): string {
  const inr = (p: number) => `${SITE.currencySymbol}${(p / 100).toFixed(2)}`;
  const lines = [
    `${SITE.name} — Order Receipt`,
    `Order ID: ${data.orderId}`,
    `Date: ${new Date(data.createdAt).toLocaleString("en-IN")}`,
    `Payment status: ${data.paymentStatus.toUpperCase()}`,
    data.razorpayPaymentId ? `Transaction: ${data.razorpayPaymentId}` : "",
    "",
    `Customer: ${data.customer.name}`,
    `Mobile: ${maskMobile(data.customer.mobile)}`,
    `Address: ${data.customer.address}, ${data.customer.area ? data.customer.area + (data.customer.landmark ? `, ${data.customer.landmark}` : "") : [data.customer.city, data.customer.state].filter(Boolean).join(", ") + (data.customer.pincode ? ` - ${data.customer.pincode}` : "")}`,
    "",
    "Items:",
    ...data.items.map(
      (i) => `- ${i.name} x${i.quantity}: ${inr(i.lineTotal)}`
    ),
    "",
    `Subtotal: ${inr(data.subtotal)}`,
    `Discount: -${inr(data.discount)}`,
    `Delivery (${data.delivery.zoneName || "n/a"}): ${inr(data.delivery.deliveryCharge)}`,
    `Total: ${inr(data.total)}`,
  ].filter(Boolean);
  return lines.join("\n");
}
