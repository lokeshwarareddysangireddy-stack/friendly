import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: `The terms that govern the use of ${SITE.name} and the placing of orders.`,
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      description="By using this website or placing an order, you agree to the terms below."
      updated="1 January 2026"
      sections={[
        {
          heading: "About the service",
          body: [
            `${SITE.name} is a local ordering and delivery assistance service. Catalog listings, prices and availability are indicative and are confirmed before an online order is placed.`,
          ],
        },
        {
          heading: "Orders and pricing",
          body: [
            "An online order is confirmed only after payment is successfully verified on our server. Prices are shown in Indian Rupees and include applicable taxes unless stated otherwise.",
            "Delivery charges are determined by the delivery zone that matches your pincode and are shown before payment.",
          ],
        },
        {
          heading: "Availability and substitutions",
          body: [
            "If an item becomes unavailable after you order, we will contact you to agree on a suitable substitution or an adjustment to your order.",
          ],
        },
        {
          heading: "Medicines and restricted items",
          body: [
            "Medicine and health items are handled as enquiries. Where a valid prescription is legally required, you must provide it. We do not present ourselves as a licensed pharmacy or licensed medical provider unless separately confirmed in writing.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "You agree to provide accurate delivery and contact information and not to misuse the website, place fraudulent orders or submit unlawful requests.",
          ],
        },
        {
          heading: "Limitation of liability",
          body: [
            "To the extent permitted by law, our liability for any order is limited to the amount paid for that order. We are not liable for delays or failures caused by events beyond our reasonable control.",
          ],
        },
        {
          heading: "Changes to these terms",
          body: [
            "We may update these terms from time to time. Continued use of the service after changes are posted constitutes acceptance of the updated terms.",
          ],
        },
        {
          heading: "Contact",
          body: [`Questions about these terms? Email ${SITE.email}.`],
        },
      ]}
    />
  );
}
