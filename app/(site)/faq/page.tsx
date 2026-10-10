import type { Metadata } from "next";
import { PageHero } from "@/components/content/PageHero";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { getActiveFaqs, getSettingsSafe } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about ordering, delivery zones, payments, medicine enquiries and order tracking at Friendly Basket.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [settings, faqs] = await Promise.all([getSettingsSafe(), getActiveFaqs()]);
  return (
    <>
      <PageHero
        title="Frequently asked questions"
        description="Everything you need to know about ordering, delivery, payments and looking up your order."
        breadcrumb={[{ label: "FAQs", href: "/faq" }]}
      />
      <FaqSection faqs={faqs} showHeading={false} />
      <FinalCta whatsappNumber={settings.whatsappNumber} />
    </>
  );
}
