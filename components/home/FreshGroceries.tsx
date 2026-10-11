import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";

const CHIPS = [
  "Fresh fruits",
  "Everyday vegetables",
  "Leafy greens",
  "Seasonal produce",
  "Dairy & bread",
  "Daily essentials",
];

export function FreshGroceries({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <section className="relative overflow-hidden py-16 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-mint/70 via-pale/50 to-white"
        aria-hidden
      />
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="eyebrow rounded-full border border-brand/25 bg-white/80 px-4 py-2 text-deep shadow-soft">
            <Leaf className="h-3.5 w-3.5 text-brand" />
            Fresh groceries
          </span>
          <h2 className="mt-5 font-editorial text-4xl font-semibold leading-tight tracking-tight text-forest sm:text-5xl">
            Market-fresh produce, at your door
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
            Handpicked fruits, crisp vegetables and everyday groceries — brought together
            with your food order. Build your basket online or send us your list on
            WhatsApp and we&apos;ll confirm what&apos;s available.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <span
                key={c}
                className="rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-forest"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services/fruits-and-vegetables"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-forest px-7 text-sm font-bold text-white transition hover:bg-[#043d19] active:scale-[0.98]"
            >
              Shop fresh produce
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <WhatsAppLink
              message={WA_TEMPLATES.grocery}
              number={whatsappNumber}
              className="h-13 px-7 text-sm"
            >
              Send your list
            </WhatsAppLink>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-lime/25 blur-2xl"
            aria-hidden
          />
          <div className="relative grid grid-cols-2 gap-4">
            <div className="col-span-2 overflow-hidden rounded-[2rem] border border-white/70 shadow-card">
              <Image
                src="/images/categories/fruits-vegetables.jpg"
                alt="Fresh fruits and vegetables"
                width={1200}
                height={800}
                sizes="(max-width: 1024px) 90vw, 600px"
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/70 shadow-card">
              <Image
                src="/images/products/fresh-vegetables.jpg"
                alt="Fresh everyday vegetables"
                width={1200}
                height={800}
                sizes="(max-width: 1024px) 45vw, 290px"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/70 shadow-card">
              <Image
                src="/images/lifestyle/kitchen-countertop.jpg"
                alt="Fresh groceries arranged on a kitchen counter"
                width={1400}
                height={934}
                sizes="(max-width: 1024px) 45vw, 290px"
                className="aspect-square w-full object-cover"
              />
            </div>
          </div>

          <div className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-4 py-2.5 shadow-card backdrop-blur">
            <Sparkles className="h-4 w-4 text-brand" />
            <p className="text-xs font-bold text-forest">Sourced for freshness</p>
          </div>
        </div>
      </div>
    </section>
  );
}
