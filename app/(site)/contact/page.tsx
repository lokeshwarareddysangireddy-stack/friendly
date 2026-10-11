import type { Metadata } from "next";
import { Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/content/PageHero";
import { EnquiryForm } from "@/components/content/EnquiryForm";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { getActiveCategories, getSettingsSafe } from "@/lib/public-data";
import { WA_TEMPLATES } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Friendly Basket by WhatsApp, email or the enquiry form. We are happy to help with your everyday needs.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, categories] = await Promise.all([
    getSettingsSafe(),
    getActiveCategories(),
  ]);

  const details: {
    icon: typeof MessageCircle;
    label: string;
    value: string;
    href?: string;
  }[] = [
    { icon: MessageCircle, label: "WhatsApp", value: SITE.whatsappDisplay },
    {
      icon: Mail,
      label: "Email",
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    },
    { icon: Clock, label: "Support hours", value: settings.supportHours },
    { icon: MapPin, label: "Service area", value: settings.address },
  ];

  return (
    <>
      <PageHero
        title="Contact us"
        description="Questions, custom requests or delivery help — reach us on WhatsApp or send a detailed enquiry below."
        breadcrumb={[{ label: "Contact", href: "/contact" }]}
      />

      <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="rounded-[2rem] border border-line bg-surface p-6 sm:p-8">
            <h2 className="font-display text-xl font-extrabold text-forest">
              Reach us directly
            </h2>
            <ul className="mt-6 space-y-5">
              {details.map((d) => (
                <li key={d.label} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-deep">
                    <d.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      {d.label}
                    </p>
                    {d.href ? (
                      <a
                        href={d.href}
                        className="text-sm font-semibold text-forest hover:text-deep"
                      >
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-forest">{d.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <WhatsAppLink
              message={WA_TEMPLATES.general}
              number={settings.whatsappNumber}
              className="mt-7 w-full"
            >
              Chat on WhatsApp
            </WhatsAppLink>
          </div>
        </div>

        <div id="enquiry" className="scroll-mt-28">
          <h2 className="font-display text-xl font-extrabold text-forest">
            Send an enquiry
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tell us what you need and we will get back to you with availability and
            pricing.
          </p>
          <div className="mt-5">
            <EnquiryForm categories={categories.map((c) => c.name)} />
          </div>
        </div>
      </section>
    </>
  );
}
