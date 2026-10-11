import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery Policy",
  description: `How delivery and delivery charges work at ${SITE.name}.`,
  alternates: { canonical: "/delivery-and-cancellation-policy" },
};

export default function DeliveryPolicyPage() {
  return (
    <LegalPage
      title="Delivery Policy"
      description="How we deliver orders, how charges are calculated, and how order changes are handled."
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
          heading: "Order changes",
          body: [
            "If you need to change or cancel your order, please contact us on WhatsApp as soon as possible. Changes depend on whether preparation has already started, and once an order is out for delivery it may no longer be possible to change it.",
          ],
        },
        {
          heading: "Contact",
          body: [
            `For delivery help, message us on WhatsApp at ${SITE.whatsappDisplay}.`,
          ],
        },
      ]}
    />
  );
}
