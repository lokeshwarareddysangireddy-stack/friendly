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
            "We deliver within a 20 km range of our location. Enter your area and a nearby landmark at checkout, and we will confirm your exact location with you before dispatch.",
            "If you are outside our 20 km range, you can still send us a WhatsApp enquiry and we will let you know if a delivery can be arranged.",
          ],
        },
        {
          heading: "Delivery charges",
          body: [
            "Delivery is free for online orders placed within our 20 km delivery range.",
          ],
        },
        {
          heading: "Delivery times",
          body: [
            "Whenever possible, we aim to deliver on the same day for orders placed during our working hours. Times may vary depending on order volume, weather and other factors outside our control.",
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
