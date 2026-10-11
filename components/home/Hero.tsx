import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Leaf,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { WhatsAppLink, WhatsAppGlyph } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";

export function Hero({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <section className="relative overflow-hidden">
      {/* Layered botanical background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 mesh-wash"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 grain"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 -top-28 -z-10 h-[26rem] w-[26rem] rounded-full bg-lime/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[-6rem] top-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-gold-soft/30 blur-3xl animate-aurora"
        aria-hidden
      />

      <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-[1.02fr_1fr] lg:gap-16 lg:py-24">
        {/* ---------- Copy ---------- */}
        <div className="max-w-xl animate-fade-up">
          <span className="eyebrow rounded-full border border-gold-soft/70 bg-white/80 px-4 py-2 text-gold-deep shadow-soft backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Everything you need, delivered with care
          </span>

          <h1 className="mt-6 font-editorial text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-forest sm:text-6xl lg:text-[4.4rem]">
            Everything you need.
            <span className="block italic text-gold-gradient">Delivered with care.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Cafe-style food, biryanis, curries, fresh groceries, fruits, vegetables and
            everyday essentials — from one friendly local basket. Order online or simply
            send a message on WhatsApp.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services"
              className="group btn-primary h-14 px-8 text-base"
            >
              Explore Categories
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <WhatsAppLink
              message={WA_TEMPLATES.general}
              number={whatsappNumber}
              className="h-14 px-8 text-base"
            >
              Order on WhatsApp
            </WhatsAppLink>
          </div>

          {/* Delivery information element */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="gold-edge flex items-center gap-3 rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pale text-deep">
                <Bike className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-forest">Zone-based delivery</p>
                <p className="text-xs text-muted">
                  Exact charge shown at checkout
                </p>
              </div>
            </div>
            <div className="gold-edge flex items-center gap-3 rounded-2xl border border-line bg-white/90 px-4 py-3 shadow-soft backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pale text-deep">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-forest">Secure checkout</p>
                <p className="text-xs text-muted">Payments via Razorpay</p>
              </div>
            </div>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5">
            {[
              { icon: UtensilsCrossed, label: "Food & biryanis" },
              { icon: Leaf, label: "Fresh groceries" },
              { icon: BadgeCheck, label: "Order online or WhatsApp" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-sm font-semibold text-forest/80"
              >
                <item.icon className="h-4 w-4 text-brand" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Visual ---------- */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative">
            {/* soft botanical color field */}
            <div
              className="absolute -right-4 -top-6 h-full w-full rounded-[3rem] bg-mint-deep/60"
              aria-hidden
            />
            <div
              className="absolute -bottom-6 -left-5 h-40 w-40 rounded-full bg-lime/25 blur-2xl"
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-[3rem] border border-white/60 shadow-lift">
              <Image
                src="/images/hero/friendly-basket-hero.jpg"
                alt="Friendly Basket grocery basket filled with fresh vegetables, fruits and daily essentials"
                width={1280}
                height={1600}
                priority
                fetchPriority="high"
                quality={82}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 80vw, 620px"
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/5] lg:aspect-[4/5]"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/25 via-transparent to-transparent"
                aria-hidden
              />
            </div>

            {/* Floating basket visual */}
            <div className="absolute -left-6 bottom-8 hidden w-32 overflow-hidden rounded-3xl border border-white/70 shadow-card animate-float sm:block lg:-left-8 lg:w-40">
              <Image
                src="/images/hero/floating-grocery-basket.jpg"
                alt="Assorted daily groceries"
                width={1400}
                height={2100}
                fetchPriority="low"
                sizes="160px"
                className="aspect-[3/4] w-full object-cover"
              />
            </div>

            {/* Floating chips */}
            <div className="absolute -left-3 top-8 flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3.5 py-2.5 shadow-soft backdrop-blur animate-float sm:left-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pale text-deep">
                <UtensilsCrossed className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-forest">Cafe-style food</p>
                <p className="text-[11px] text-muted">Fresh to order</p>
              </div>
            </div>

            <div
              className="absolute -right-2 top-24 flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3.5 py-2.5 shadow-soft backdrop-blur animate-float-slow sm:right-0"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pale text-deep">
                <Leaf className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-forest">Fresh produce</p>
                <p className="text-[11px] text-muted">Fruits & vegetables</p>
              </div>
            </div>

            <div
              className="absolute -bottom-5 right-4 flex items-center gap-2 rounded-2xl border border-line bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur animate-float"
              style={{ animationDelay: "1.1s" }}
            >
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/12 text-[#1ebe5a]">
                <WhatsAppGlyph className="h-5 w-5" />
                <span className="absolute inset-0 rounded-full animate-pulse-ring bg-[#25D366]/30" />
              </span>
              <div className="leading-tight">
                <p className="text-xs font-bold text-forest">One message away</p>
                <p className="text-[11px] text-muted">Chat &amp; order on WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
