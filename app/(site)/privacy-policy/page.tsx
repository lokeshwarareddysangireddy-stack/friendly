import type { Metadata } from "next";
import { LegalPage } from "@/components/content/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains what information we collect, why we collect it, and how we handle it."
      updated="1 January 2026"
      sections={[
        {
          heading: "Information we collect",
          body: [
            "When you place an order or send an enquiry, we collect the details you provide: your name, mobile number, delivery address, pincode, city, state and any delivery instructions or enquiry notes.",
            "We also create records relating to your order, such as the order ID, items requested, amounts payable, delivery zone and payment status.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "We use your information to prepare and deliver your order, to contact you about your order, to process and verify payments, and to respond to enquiries.",
            "If you contact us on WhatsApp, the conversation takes place on WhatsApp and is subject to WhatsApp's own terms and privacy policy.",
          ],
        },
        {
          heading: "Payments",
          body: [
            "Online payments are processed by Razorpay. We do not store your full card or UPI credentials. We retain payment identifiers and status information so that we can confirm and reconcile your order.",
          ],
        },
        {
          heading: "Data sharing",
          body: [
            "We share only the information necessary to fulfil your order — for example, your delivery address and contact number with our delivery personnel. We do not sell your personal information.",
          ],
        },
        {
          heading: "Data retention and security",
          body: [
            "We retain order and enquiry records for as long as needed to operate the service and meet legal or accounting requirements. We take reasonable measures to protect the information we hold.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "You may contact us to ask about, correct or request deletion of your personal information, subject to any records we are required to keep.",
          ],
        },
        {
          heading: "Contact",
          body: [
            `For privacy questions, email ${SITE.email} or message us on WhatsApp at ${SITE.whatsappDisplay}.`,
          ],
        },
      ]}
    />
  );
}
