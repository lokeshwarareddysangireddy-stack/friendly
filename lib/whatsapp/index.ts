import { SITE } from "@/lib/site";

export function buildWhatsAppUrl(message: string, number?: string) {
  const digits = (number || SITE.whatsappNumber).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const WA_TEMPLATES = {
  general:
    "Hi Friendly Basket! I would like to know about your available services and delivery options.",
  food: "Hi Friendly Basket! I would like to enquire about available food items and prices.",
  grocery:
    "Hi Friendly Basket! I would like to order groceries and daily essentials. Please confirm availability and pricing.",
  medicine:
    "Hi Friendly Basket! I would like to enquire about the availability of a medicine or health-essential item. Please let me know the requirements.",
  product: (productName: string) =>
    `Hi Friendly Basket! I would like to enquire about ${productName}. Please confirm availability and price.`,
};

export interface EnquiryPayload {
  name: string;
  mobile: string;
  category?: string;
  items: string;
  location?: string;
  instructions?: string;
}

export function buildEnquiryMessage(payload: EnquiryPayload) {
  const lines = [
    "Hi Friendly Basket! I would like to place an enquiry.",
    "",
    `Name: ${payload.name}`,
    `Mobile: ${payload.mobile}`,
    payload.category ? `Service category: ${payload.category}` : "",
    `Items required: ${payload.items}`,
    payload.location ? `Delivery location: ${payload.location}` : "",
    payload.instructions ? `Additional instructions: ${payload.instructions}` : "",
    "",
    "Please confirm availability, pricing and delivery.",
  ].filter(Boolean);
  return lines.join("\n");
}

export function buildOrderFollowUpMessage(input: {
  orderId: string;
  itemSummary: string;
  paymentRef?: string | null;
}) {
  const lines = [
    `Hi Friendly Basket! I have placed and paid for order ${input.orderId}.`,
    "",
    `Items: ${input.itemSummary}`,
    input.paymentRef ? `Payment reference: ${input.paymentRef}` : "",
    "",
    "Please confirm delivery coordination.",
  ].filter(Boolean);
  return lines.join("\n");
}
