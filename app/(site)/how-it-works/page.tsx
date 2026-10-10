import type { Metadata } from "next";
import { PageHero } from "@/components/content/PageHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyChoose } from "@/components/home/WhyChoose";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { getActiveFaqs, getSettingsSafe } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how to order from Friendly Basket — browse online or message us on WhatsApp, confirm your delivery zone and pay securely.",
  alternates: { canonical: "/how-it-works" },
};

export default async function HowItWorksPage() {
  const [settings, faqs] = await Promise.all([getSettingsSafe(), getActiveFaqs()]);
  return (
    <>
      <PageHero
        title="How Friendly Basket works"
        description="A clear, two-way way to order: shop and pay online, or send us a message for anything specific. Delivery is priced by your pincode."
        breadcrumb={[{ label: "How It Works", href: "/how-it-works" }]}
      />
      <HowItWorks compact={false} />
      <WhyChoose />
      <FaqSection faqs={faqs} limit={6} />
      <FinalCta whatsappNumber={settings.whatsappNumber} />
    </>
  );
}
