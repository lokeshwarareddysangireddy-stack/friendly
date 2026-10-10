import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Info, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppGlyph } from "@/components/layout/WhatsAppLink";
import { buildWhatsAppUrl, WA_TEMPLATES } from "@/lib/whatsapp";

const NEEDS = [
  {
    img: "/images/categories/cafe-style-food.jpg",
    title: "Cafe-style food",
    text: "Pizzas, burgers, sandwiches, shakes and desserts, made fresh to order.",
    href: "/services/cafe-style-food",
  },
  {
    img: "/images/categories/biryani.jpg",
    title: "Biryanis",
    text: "Aromatic dum biryanis in chicken, mutton, egg and vegetarian options.",
    href: "/services/biryanis",
  },
  {
    img: "/images/categories/curries-meals.jpg",
    title: "Curries & meals",
    text: "Chicken, mutton, fish and veg curries with rice and complete meals.",
    href: "/services/curries-and-meals",
  },
  {
    img: "/images/categories/grocery-daily-needs.jpg",
    title: "Grocery & daily needs",
    text: "Groceries, snacks, beverages and household essentials for every day.",
    href: "/services/grocery-and-daily-needs",
  },
  {
    img: "/images/categories/medicines-health.jpg",
    title: "Medicines & health",
    text: "Requested medicines and health essentials, handled as enquiries.",
    href: "/services/medicines-and-health-essentials",
  },
];

export function OneBasket({ whatsappNumber }: { whatsappNumber: string }) {
  const waUrl = buildWhatsAppUrl(WA_TEMPLATES.general, whatsappNumber);
  return (
    <section className="bg-surface py-16 lg:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="One basket, many needs"
          title="Tell us once — we'll help arrange it all"
          description="Message Friendly Basket about what you need and our team helps arrange pickup and delivery for the right store, kitchen or supplier."
          align="left"
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {NEEDS.map((n, i) => (
            <Reveal key={n.title} delay={i * 60}>
              <Link
                href={n.href}
                className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white card-lift"
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={n.img}
                    alt={n.title}
                    width={1200}
                    height={800}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="aspect-[16/11] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/35 to-transparent"
                    aria-hidden
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-bold text-forest">
                    {n.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {n.text}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-deep">
                    Explore
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}

          <Reveal delay={300}>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.75rem] bg-forest p-7 text-white"
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lime/25 blur-2xl"
                aria-hidden
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-lime">
                <MessageCircle className="h-6 w-6" />
              </span>
              <div className="relative mt-6">
                <h3 className="font-display text-xl font-extrabold">
                  Something else in mind?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Send us a message with your list and we&apos;ll confirm availability,
                  pricing and delivery.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white">
                  <WhatsAppGlyph className="h-4 w-4" />
                  Message on WhatsApp
                </span>
              </div>
            </a>
          </Reveal>
        </div>

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Medicine and health items are handled as enquiries only. A valid prescription is
          required where legally necessary, and availability is confirmed before any
          order is placed.
        </p>
      </div>
    </section>
  );
}
