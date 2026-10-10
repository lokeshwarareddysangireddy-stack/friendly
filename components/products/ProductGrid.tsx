import { ProductCard } from "@/components/products/ProductCard";
import type { ProductDoc } from "@/types";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  whatsappNumber,
  className,
  priorityCount = 0,
}: {
  products: ProductDoc[];
  whatsappNumber?: string;
  className?: string;
  priorityCount?: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          whatsappNumber={whatsappNumber}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
