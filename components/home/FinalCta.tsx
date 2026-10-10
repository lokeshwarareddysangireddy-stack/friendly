import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";

export function FinalCta({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <section className="container-page pb-20 pt-4">
      <div className="grain relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-deep via-forest to-[#02180c] px-6 py-14 text-center sm:px-12">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-soft/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-brand/25 blur-3xl"
          aria-hidden
        />
        <div className="gold-rule absolute inset-x-16 top-0" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <span className="eyebrow rounded-full bg-white/10 px-4 py-2 text-gold-soft">
            Ready when you are
          </span>
          <h2 className="mt-5 font-editorial text-3xl font-semibold text-white text-balance sm:text-4xl">
            Ready to order? We are one message away.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/80">
            Shop online for available items or send us a WhatsApp message for anything
            specific. Friendly Basket is here to help with your everyday needs.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/services"
              className="btn-primary h-13 px-7 text-base"
            >
              Browse services
              <ArrowRight className="h-5 w-5" />
            </Link>
            <WhatsAppLink
              message={WA_TEMPLATES.general}
              number={whatsappNumber}
              className="h-13 bg-white px-7 text-base text-forest hover:bg-pale"
            >
              Chat on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
