import Image from "next/image";
import { Info, Tag } from "lucide-react";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";

export function PromoBanner({
  enabled,
  promoText,
  promoConditions,
  whatsappNumber,
}: {
  enabled: boolean;
  promoText: string;
  promoConditions: string;
  whatsappNumber: string;
}) {
  if (!enabled) return null;

  return (
    <section className="container-page py-16 lg:py-20">
      <div className="relative min-h-[20rem] overflow-hidden rounded-[2.5rem] border border-line">
        <Image
          src="/images/banners/fresh-delivery-campaign.jpg"
          alt="Friendly Basket fresh delivery promotion"
          fill
          sizes="(max-width: 1024px) 100vw, 1200px"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/80 to-forest/30 sm:to-forest/10"
          aria-hidden
        />
        <div className="relative max-w-xl p-8 sm:p-12 lg:p-16">
          <span className="eyebrow rounded-full bg-white/12 px-4 py-2 text-lime backdrop-blur">
            <Tag className="h-3.5 w-3.5" />
            Current promotion
          </span>
          <h2 className="mt-5 font-editorial text-3xl font-semibold leading-tight text-white text-balance sm:text-4xl lg:text-5xl">
            {promoText || "Great value, delivered with care"}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
            Order online or message us on WhatsApp to check what is included in the current
            offer.
          </p>
          <p className="mt-4 flex items-start gap-2 text-xs text-white/70">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {promoConditions}
          </p>
          <div className="mt-7">
            <WhatsAppLink
              message={WA_TEMPLATES.general}
              number={whatsappNumber}
              className="h-13 px-7 text-sm"
            >
              Ask about this offer
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
