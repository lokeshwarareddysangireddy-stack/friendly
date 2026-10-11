import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ServiceCategories } from "@/components/home/ServiceCategories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FoodShowcase } from "@/components/home/FoodShowcase";
import { FreshGroceries } from "@/components/home/FreshGroceries";
import { OneBasket } from "@/components/home/OneBasket";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PromoBanner } from "@/components/home/PromoBanner";
import { WhyChoose } from "@/components/home/WhyChoose";
import { Testimonials } from "@/components/home/Testimonials";
import { WhatsAppOrder } from "@/components/home/WhatsAppOrder";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import {
  getActiveCategories,
  getActiveFaqs,
  getApprovedReviews,
  getFeaturedProducts,
  getSettingsSafe,
} from "@/lib/public-data";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description:
    "Order cafe-style food, biryanis, curries, groceries, fruits, vegetables and health essentials from Friendly Basket. Shop online or message us on WhatsApp.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [settings, categories, featured, faqs, testimonials] = await Promise.all([
    getSettingsSafe(),
    getActiveCategories(),
    getFeaturedProducts(8),
    getActiveFaqs(),
    getApprovedReviews(6),
  ]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.friendlybasket.com",
    slogan: SITE.tagline,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${settings.whatsappNumber}`,
      contactType: "customer service",
      areaServed: "IN",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Hero whatsappNumber={settings.whatsappNumber} />
      <ServiceCategories categories={categories} />
      <FeaturedProducts
        products={featured}
        whatsappNumber={settings.whatsappNumber}
      />
      <FoodShowcase />
      <FreshGroceries whatsappNumber={settings.whatsappNumber} />
      <OneBasket whatsappNumber={settings.whatsappNumber} />
      <HowItWorks />
      <PromoBanner
        enabled={settings.promoEnabled}
        promoText={settings.promoText}
        promoConditions={settings.promoConditions}
        whatsappNumber={settings.whatsappNumber}
      />
      <WhyChoose />
      <Testimonials reviews={testimonials.reviews} total={testimonials.total} />
      <WhatsAppOrder whatsappNumber={settings.whatsappNumber} />
      <FaqSection faqs={faqs} limit={6} />
      <FinalCta whatsappNumber={settings.whatsappNumber} />
    </>
  );
}
