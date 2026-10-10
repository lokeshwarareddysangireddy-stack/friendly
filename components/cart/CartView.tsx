"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/components/cart/cart-context";
import { formatINR } from "@/lib/utils";

export function CartView() {
  const { items, subtotal, count, setQuantity, removeItem, clear, ready } = useCart();

  if (!ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl border border-line bg-surface"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-3xl border border-line bg-surface" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Your cart is empty"
        description="Browse our services and add items, or send us a WhatsApp message for a custom request."
        action={
          <Link
            href="/services"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            Start shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-muted">
            {count} item{count === 1 ? "" : "s"} in your cart
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Remove all items from your cart?")) clear();
            }}
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            Clear cart
          </button>
        </div>

        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-4 rounded-3xl border border-line bg-white p-3 sm:p-4"
            >
              <Link href={`/product/${item.slug}`} className="shrink-0">
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  seed={item.slug}
                  className="h-20 w-20 sm:h-24 sm:w-24"
                  sizes="96px"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-display text-sm font-bold text-forest hover:text-deep sm:text-base"
                    >
                      {item.name}
                    </Link>
                    {item.unit && (
                      <p className="text-xs text-muted">{item.unit}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="rounded-full p-2 text-muted transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between pt-3">
                  <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-forest transition hover:bg-pale"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-7 text-center text-sm font-bold text-forest">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-forest transition hover:bg-pale"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-extrabold text-forest">
                      {formatINR(item.price * item.quantity)}
                    </p>
                    <p className="text-xs text-muted">{formatINR(item.price)} each</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/services"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-deep hover:underline"
        >
          &larr; Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-3xl border border-line bg-white p-6">
          <h2 className="font-display text-lg font-extrabold text-forest">
            Order summary
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-forest">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="text-right text-xs font-medium text-muted">
                Calculated by pincode at checkout
              </dd>
            </div>
            <div className="border-t border-line pt-3">
              <div className="flex justify-between text-base">
                <dt className="font-bold text-forest">Estimated total</dt>
                <dd className="font-display text-xl font-extrabold text-forest">
                  {formatINR(subtotal)}
                </dd>
              </div>
              <p className="mt-1 text-xs text-muted">
                Delivery charge and any applicable free-delivery threshold are applied
                after we match your pincode to a delivery zone.
              </p>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-bold text-white transition hover:bg-brand-600 active:scale-[0.98]"
          >
            Proceed to Checkout
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
