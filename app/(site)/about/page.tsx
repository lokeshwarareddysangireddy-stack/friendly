import type { Metadata } from "next";
import { Sprout, HeartHandshake, ShieldCheck, MapPin } from "lucide-react";
import { PageHero } from "@/components/content/PageHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyChoose } from "@/components/home/WhyChoose";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { getActiveFaqs, getSettingsSafe } from "@/lib/public-data";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${SITE.name} — how ordering works, and the local delivery assistance service built to make everyday needs easier.`,
  alternates: { canonical: "/about" },
};

const PILLARS = [
  {
    icon: HeartHandshake,
    title: "Local and personable",
    text: "We are built around real neighbourhoods and real requests, not a faceless cart. Every order can be a conversation.",
  },
  {
    icon: MapPin,
    title: "Transparent delivery",
    text: "We deliver within a 20 km range. Your order, its availability and any charges are confirmed before you pay.",
  },
  {
    icon: ShieldCheck,
    title: "Honest about what we do",
    text: "Items requiring a prescription or licence are handled as enquiries, and prices are confirmed before an online order is placed.",
  },
  {
    icon: Sprout,
    title: "Everyday essentials, together",
    text: "Food, fresh produce, groceries and health essentials can all be part of one friendly basket.",
  },
];

export default async function AboutPage() {
  const [settings, faqs] = await Promise.all([getSettingsSafe(), getActiveFaqs()]);
  return (
    <>
      <PageHero
        title={`About ${SITE.name}`}
        description={SITE.supportingTagline}
        breadcrumb={[{ label: "About", href: "/about" }]}
      />

      <section className="container-page max-w-3xl py-12">
        <div className="space-y-4 text-base leading-relaxed text-muted">
          <p>
            {SITE.name} began with a simple idea: ordering everyday things locally should
            feel as easy as messaging a helpful friend. Instead of juggling multiple apps
            and unclear charges, you get one place to browse, ask and order.
          </p>
          <p>
            You can shop and pay online for the items that are set up for it, or send us a
            WhatsApp message for anything specific — a particular dish, a grocery list, or
            a health essential you are not sure about. We confirm availability, pricing and
            delivery before anything is finalised.
          </p>
          <p>
            We are transparent about our limits. Where the law requires a prescription for
            a medicine, we ask for it, and we do not present ourselves as a licensed
            pharmacy or a licensed medical provider unless that is separately confirmed in
            writing.
          </p>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="container-page grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-3xl border border-line bg-white p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pale text-deep">
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-forest">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <HowItWorks compact={false} />
      <WhyChoose />
      <FaqSection faqs={faqs} limit={6} />
      <FinalCta whatsappNumber={settings.whatsappNumber} />
    </>
  );
}
