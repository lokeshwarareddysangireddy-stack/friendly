import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review the items in your Friendly Basket cart before checkout.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
        <div className="container-page py-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review your items, then proceed to checkout to enter delivery details.
          </p>
        </div>
      </div>
      <section className="container-page py-10">
        <CartView />
      </section>
    </>
  );
}
