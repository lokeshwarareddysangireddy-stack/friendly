import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Complete your Friendly Basket order with secure online payment.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  return (
    <>
      <div className="border-b border-line bg-gradient-to-b from-pale/60 to-white">
        <div className="container-page py-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Enter your delivery details and pay securely. We deliver within a 20 km
            range, and your order is confirmed only after payment is verified.
          </p>
        </div>
      </div>
      <section className="container-page py-10">
        <CheckoutForm />
      </section>
    </>
  );
}
