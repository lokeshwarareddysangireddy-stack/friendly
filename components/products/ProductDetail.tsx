"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Truck,
  ShieldCheck,
  Stethoscope,
  Info,
} from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/components/cart/cart-context";
import { useToast } from "@/components/ui/Toast";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import type { ProductDoc } from "@/types";

export function ProductDetail({
  product,
  whatsappNumber,
}: {
  product: ProductDoc;
  whatsappNumber: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const images = product.images ?? [];
  const off = discountPercent(product.price, product.mrp);
  const onlineAvailable =
    product.active &&
    product.available &&
    (product.orderingMethod === "online" || product.orderingMethod === "both");
  const outOfStock =
    product.trackStock && product.stockQty != null && product.stockQty <= 0;

  const add = () => {
    addItem(product, qty);
    toast(`${product.name} added to cart`);
  };

  const buyNow = () => {
    addItem(product, qty);
    router.push("/checkout");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="overflow-hidden rounded-[2rem] border border-line bg-white">
          <ProductImage
            src={images[activeImage]?.url}
            alt={images[activeImage]?.alt || product.name}
            seed={`${product.slug}-${activeImage}`}
            rounded="rounded-none"
            className="aspect-square w-full"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  "h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition",
                  activeImage === i ? "border-brand" : "border-line hover:border-brand/50"
                )}
              >
                <ProductImage
                  src={img.url}
                  alt={img.alt || `${product.name} image ${i + 1}`}
                  seed={`${product.slug}-${i}`}
                  rounded="rounded-none"
                  className="h-full w-full"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {product.featured && <Badge tone="lime">Featured</Badge>}
          {off > 0 && <Badge tone="forest">{off}% OFF</Badge>}
          {!onlineAvailable && (
            <Badge tone="amber">
              <Stethoscope className="h-3 w-3" />
              {product.requiresPrescription ? "Prescription required" : "Enquiry only"}
            </Badge>
          )}
        </div>

        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
          {product.name}
        </h1>
        {product.unit && (
          <p className="mt-1 text-sm font-medium text-muted">{product.unit}</p>
        )}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-3xl font-extrabold text-forest">
            {formatINR(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-lg text-muted line-through">
                {formatINR(product.mrp)}
              </span>
              <span className="text-sm font-bold text-brand">
                Save {formatINR(product.mrp - product.price)}
              </span>
            </>
          )}
        </div>

        <p className="mt-5 text-base leading-relaxed text-muted">
          {product.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-pale px-3.5 py-2 text-xs font-semibold text-deep">
            <Truck className="h-4 w-4" />
            Delivery charge set by zone
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-pale px-3.5 py-2 text-xs font-semibold text-deep">
            <ShieldCheck className="h-4 w-4" />
            Secure Razorpay checkout
          </span>
        </div>

        {outOfStock ? (
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Info className="h-5 w-5 shrink-0" />
            This item is currently out of stock. Send us an enquiry and we will let you
            know when it is available.
          </div>
        ) : null}

        {onlineAvailable && !outOfStock ? (
          <>
            <div className="mt-7 flex items-center gap-4">
              <span className="text-sm font-semibold text-forest">Quantity</span>
              <div className="flex items-center gap-3 rounded-full border border-line bg-white px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-forest transition hover:bg-pale"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-8 text-center text-sm font-bold text-forest">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((n) => Math.min(99, n + 1))}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-forest transition hover:bg-pale"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {product.trackStock && product.stockQty != null && (
                <span className="text-xs text-muted">
                  {product.stockQty} in stock
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={add}
                className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full border border-forest bg-white px-6 text-base font-bold text-forest transition hover:bg-pale active:scale-[0.98]"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={buyNow}
                className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-bold text-white transition hover:bg-brand-600 active:scale-[0.98]"
              >
                <Zap className="h-5 w-5" />
                Buy Now
              </button>
            </div>
          </>
        ) : null}

        <div className="mt-4">
          <WhatsAppLink
            message={WA_TEMPLATES.product(product.name)}
            number={whatsappNumber}
            variant="plain"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-white text-sm font-bold text-forest transition hover:border-[#25D366] hover:bg-[#e6f9ec]"
          >
            <Stethoscope className="h-4 w-4" />
            Enquire about this item on WhatsApp
          </WhatsAppLink>
        </div>

        {product.requiresPrescription && (
          <p className="mt-4 rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
            A valid prescription is required for this item where legally applicable.
            Friendly Basket handles medicine requests as enquiries and does not claim
            licensed-pharmacy status unless separately confirmed.
          </p>
        )}
      </div>
    </div>
  );
}
