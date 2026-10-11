"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist/wishlist-context";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { PageHero } from "@/components/content/PageHero";
import type { ProductDoc } from "@/types";

export default function WishlistPage() {
  const { ids, ready } = useWishlist();
  const [products, setProducts] = useState<ProductDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    (async () => {
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/products?ids=${ids.join(",")}&limit=100`, {
          cache: "no-store",
        });
        const json = await res.json();
        const items: ProductDoc[] = json?.data?.items ?? [];
        const order = new Map(ids.map((id, i) => [id, i]));
        items.sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0));
        if (active) setProducts(items);
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ids, ready]);

  return (
    <div className="bg-cream">
      <PageHero
        title="Your Wishlist"
        description="Everything you have saved to buy later."
        breadcrumb={[{ label: "Wishlist", href: "/wishlist" }]}
      />
      <div className="container-page py-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 text-sm text-muted">Your wishlist is empty.</p>
            <Link
              href="/services"
              className="mt-4 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
            >
              Explore products
            </Link>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
