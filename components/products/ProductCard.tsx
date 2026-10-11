"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Stethoscope, Zap } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/components/cart/cart-context";
import { useToast } from "@/components/ui/Toast";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";
import { cn, discountPercent, formatINR } from "@/lib/utils";
import type { ProductDoc } from "@/types";

function categoryLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => (w === "and" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function ProductCard({
  product,
  whatsappNumber,
  priority = false,
}: {
  product: ProductDoc;
  whatsappNumber?: string;
  priority?: boolean;
}) {
  const router = useRouter();
  const { items, addItem, setQuantity } = useCart();
  const { toast } = useToast();
  const inCart = items.find((i) => i.productId === product._id);

  const href = `/product/${product.slug}`;
  const open = () => router.push(href);

  const onlineAvailable =
    product.active &&
    product.available &&
    (product.orderingMethod === "online" || product.orderingMethod === "both");

  const off = discountPercent(product.price, product.mrp);
  const outOfStock =
    product.trackStock && product.stockQty != null && product.stockQty <= 0;

  const buyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    router.push("/checkout");
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white card-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="relative block overflow-hidden">
        <ProductImage
          src={product.images?.[0]?.url}
          alt={product.name}
          seed={product.slug}
          priority={priority}
          rounded="rounded-none"
          className="aspect-[5/4] w-full"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/10 to-transparent"
          aria-hidden
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off > 0 && <Badge tone="forest">{off}% OFF</Badge>}
          {product.featured && <Badge tone="lime">Featured</Badge>}
        </div>
        {!onlineAvailable && (
          <div className="absolute right-3 top-14">
            <Badge tone="amber">
              <Stethoscope className="h-3 w-3" />
              {product.requiresPrescription ? "Rx" : "Enquiry"}
            </Badge>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-forest px-4 py-2 text-xs font-bold text-white">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-deep">
          {categoryLabel(product.categorySlug)}
        </span>
        <a
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 flex-1"
          tabIndex={-1}
          aria-hidden
        >
          <h3 className="line-clamp-2 font-display text-[15px] font-bold leading-snug text-forest transition group-hover:text-deep">
            {product.name}
          </h3>
        </a>
        {product.unit && (
          <p className="mt-1 text-xs font-medium text-muted">{product.unit}</p>
        )}

        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-extrabold text-forest">
              {formatINR(product.price)}
            </span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-sm text-muted line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-4 space-y-2">
          {!onlineAvailable ? (
            <WhatsAppLink
              message={WA_TEMPLATES.product(product.name)}
              number={whatsappNumber}
              label="Enquire on WhatsApp"
              variant="plain"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-pale px-4 py-2.5 text-sm font-bold text-forest transition hover:border-[#25D366] hover:bg-[#e6f9ec]"
            />
          ) : outOfStock ? (
            <button
              type="button"
              disabled
              className="w-full rounded-full bg-surface px-4 py-2.5 text-sm font-bold text-muted"
            >
              Out of stock
            </button>
          ) : (
            <>
              {inCart ? (
                <div
                  className="flex items-center justify-between rounded-full border border-brand bg-pale px-1.5 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <StepperButton
                    label="Decrease quantity"
                    onClick={() => setQuantity(product._id, inCart.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </StepperButton>
                  <span className="min-w-8 text-center text-sm font-bold text-forest">
                    {inCart.quantity}
                  </span>
                  <StepperButton
                    label="Increase quantity"
                    onClick={() => setQuantity(product._id, inCart.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </StepperButton>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addItem(product);
                    toast(`${product.name} added to cart`);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 active:scale-[0.98]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
              )}
              <button
                type="button"
                onClick={buyNow}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-forest/15 bg-forest px-4 py-2.5 text-sm font-bold text-white transition hover:bg-deep active:scale-[0.98]"
              >
                <Zap className="h-4 w-4" />
                Buy Now
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function StepperButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white text-forest shadow-sm transition hover:bg-brand hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
