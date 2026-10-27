import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, ShoppingBasket, Truck, Leaf, ShieldCheck } from "lucide-react";
import { getGroceryCounts } from "@/lib/db";
import { GROCERY_CATEGORIES, GROCERY_SLUG, OTHER_GROCERY } from "@/lib/grocery-categories";

const BASE = `/services/${GROCERY_SLUG}`;

/**
 * Category-first grocery landing page.
 *
 * Every category is listed before any product so the page stays light: only
 * the 17 category covers are downloaded here. Product imagery is only
 * requested once a shopper opens a category.
 */
export async function GroceryLanding({ searchParams = {} }: { searchParams?: { q?: string } }) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 120) : "";
  const counts = await getGroceryCounts();
  const countFor = (tag: string) => counts.find((entry) => entry.tag === tag)?.active || 0;

  const categories = [...GROCERY_CATEGORIES];
  const overflow = countFor(OTHER_GROCERY.tag);
  if (overflow > 0) categories.push(OTHER_GROCERY);

  const totalProducts = categories.reduce((sum, category) => sum + countFor(category.tag), 0);

  return (
    <div className="bg-gradient-to-b from-pale/70 via-white to-white">
      <div className="container-page py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/services">Services</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Grocery &amp; Daily Needs</span>
        </nav>

        <header className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-deep">
              Your everyday essentials
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl lg:text-5xl">
              Grocery &amp; Daily Needs
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Start with a category, pick the pack you want and add it to your basket. Fresh stock,
              everyday brands and transparent pricing.
            </p>
            <dl className="mt-6 grid max-w-md grid-cols-3 gap-3">
              {[
                { label: "Categories", value: categories.length },
                { label: "Products", value: totalProducts },
                { label: "Delivery", value: "Same day" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-line bg-white px-3 py-3 shadow-soft">
                  <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-display text-lg font-extrabold text-forest sm:text-xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pale text-deep">
                <ShoppingBasket aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-extrabold text-forest">How it works</h2>
                <ol className="mt-3 space-y-3 text-sm text-muted">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                      1
                    </span>
                    Choose a category below - {categories.length} to browse.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                      2
                    </span>
                    Pick your brand, pack size and quantity.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                      3
                    </span>
                    Add to cart and we deliver to your door.
                  </li>
                </ol>
              </div>
            </div>
            <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-[11px] font-semibold text-muted">
              <li className="flex items-center gap-1.5">
                <Truck aria-hidden className="h-4 w-4 text-deep" /> Same-day slots
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck aria-hidden className="h-4 w-4 text-deep" /> Verified packs
              </li>
              <li className="flex items-center gap-1.5">
                <Leaf aria-hidden className="h-4 w-4 text-deep" /> Fresh sourcing
              </li>
            </ul>
          </div>
        </header>

        <form action={BASE} className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-soft sm:flex-row">
          <div className="relative flex-1">
            <Search aria-hidden className="absolute left-3 top-3.5 h-5 w-5 text-muted" />
            <label htmlFor="grocery-search" className="sr-only">
              Search all grocery categories
            </label>
            <input
              id="grocery-search"
              name="q"
              defaultValue={q}
              key={q}
              maxLength={120}
              placeholder="Search rice, oil, biscuits, Amul…"
              className="h-12 w-full rounded-xl bg-surface pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button className="h-12 rounded-xl bg-forest px-6 text-sm font-bold text-white transition hover:bg-deep">
            Search
          </button>
        </form>

        <section className="py-8" aria-labelledby="grocery-categories">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="grocery-categories" className="font-display text-xl font-extrabold text-forest sm:text-2xl">
                Shop by category
              </h2>
              <p className="mt-1 text-sm text-muted">
                Every category below shows its own live product list and pack sizes.
              </p>
            </div>
            <p className="text-sm font-semibold text-deep">{totalProducts} products ready to shop</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((category, index) => {
              const count = countFor(category.tag);
              return (
                <Link
                  key={category.tag}
                  href={`${BASE}/${category.slug}`}
                  prefetch={false}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition hover:-translate-y-1 hover:border-brand hover:shadow-card focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    <Image
                      src={category.image}
                      alt={`${category.name} category`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      priority={index < 4}
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-forest shadow-sm">
                      {count > 0 ? `${count} products` : "Coming soon"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <h3 className="text-sm font-bold leading-snug text-forest sm:text-base">
                      {category.name}
                    </h3>
                    <p className="mt-1 hidden text-xs leading-relaxed text-muted sm:block">
                      {category.blurb}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-deep">
                      Shop now
                      <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
