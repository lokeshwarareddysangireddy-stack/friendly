import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery and Cancellation Policy",
  description: `How delivery, delivery charges, cancellations and refunds work at ${SITE.name}.`,
  alternates: { canonical: "/delivery-and-cancellation-policy" },
};

export default function DeliveryPolicyPage() {
  return (
    <LegalPage
      title="Delivery and Cancellation Policy"
      description="How we deliver orders, how charges are calculated, and how cancellations and refunds are handled."
      updated="1 January 2026"
      sections={[
        {
          heading: "Delivery areas",
          body: [
            "We deliver to areas covered by our configured delivery zones. Enter your pincode at checkout to see whether we deliver to you and the applicable charge.",
            "If we do not yet deliver to your pincode, you can still send us a WhatsApp enquiry and we will let you know if a delivery can be arranged.",
          ],
        },
        {
          heading: "Delivery charges",
          body: [
            "Delivery charges are based on the delivery zone that matches your pincode. Where a free-delivery threshold applies and your order meets it, the charge is waived automatically at checkout.",
          ],
        },
        {
          heading: "Delivery times",
          body: [
            "Estimated delivery times are shown for each zone and are indicative. Times may vary depending on order volume, weather and other factors outside our control.",
          ],
        },
        {
          heading: "Cancellations",
          body: [
            "You can request cancellation before your order is dispatched by contacting us on WhatsApp. Once an order is out for delivery, cancellation may not be possible.",
          ],
        },
        {
          heading: "Refunds",
          body: [
            "If an item is unavailable, or an order is cancelled before dispatch, any amount already paid for the affected items is refunded to the original payment method.",
            "Refunds are processed through Razorpay and typically reflect within a few business days, depending on your bank or payment provider.",
          ],
        },
        {
          heading: "Contact",
          body: [
            `For delivery or cancellation help, message us on WhatsApp at ${SITE.whatsappDisplay}.`,
          ],
        },
      ]}
    />
  );
}
