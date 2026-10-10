import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/orders/OrderLookupForm";

export const metadata: Metadata = {
  title: "Order Lookup",
  description:
    "Track your Friendly Basket order by entering your order ID and registered mobile number.",
  alternates: { canonical: "/order-lookup" },
};

export default function OrderLookupPage() {
  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
        <div className="container-page py-10 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
            Order Lookup
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Retrieve your order status and download your receipt.
          </p>
        </div>
      </div>
      <section className="container-page py-12">
        <OrderLookupForm />
      </section>
    </>
  );
}
