import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TALL = [
  {
    img: "/images/products/pizza.jpg",
    label: "Wood-style pizzas",
    sub: "Cafe-style food",
    href: "/services/food",
  },
  {
    img: "/images/products/burger.jpg",
    label: "Stacked burgers",
    sub: "Cafe-style food",
    href: "/services/food",
  },
  {
    img: "/images/products/sandwich.jpg",
    label: "Grilled sandwiches",
    sub: "Cafe-style food",
    href: "/services/food",
  },
  {
    img: "/images/products/milkshake-dessert.jpg",
    label: "Thick shakes & desserts",
    sub: "Cafe-style food",
    href: "/services/food",
  },
];

const WIDE = [
  {
    img: "/images/products/chicken-biryani.jpg",
    label: "Aromatic biryanis",
    sub: "Biryanis",
    href: "/services/food",
  },
  {
    img: "/images/products/chicken-curry.jpg",
    label: "Slow-cooked curries",
    sub: "Curries & meals",
    href: "/services/food",
  },
  {
    img: "/images/products/veg-meal.jpg",
    label: "Wholesome meals",
    sub: "Curries & meals",
    href: "/services/food",
  },
];

function Tile({
  img,
  label,
  sub,
  href,
  className,
}: {
  img: string;
  label: string;
  sub: string;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[1.75rem] border border-line ${className}`}
    >
      <Image
        src={img}
        alt={label}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 300px"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/20 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime">
            {sub}
          </p>
          <h3 className="mt-1 font-display text-base font-bold text-white">
            {label}
          </h3>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-forest translate-y-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function FoodShowcase() {
  return (
    <section className="relative py-16 lg:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Food worth craving"
          title="Made fresh, delivered warm"
          description="Cafe favourites, dum biryanis and comforting curries — prepared to order and sent straight to your door."
          align="left"
          action={{ label: "Browse food", href: "/services/food" }}
        />

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TALL.map((t, i) => (
            <Reveal key={t.label} delay={i * 70}>
              <Tile {...t} className="aspect-[3/4]" />
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {WIDE.map((t, i) => (
            <Reveal key={t.label} delay={i * 70}>
              <Tile {...t} className="aspect-[16/10]" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
