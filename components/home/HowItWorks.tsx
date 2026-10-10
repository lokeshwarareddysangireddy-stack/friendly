import {
  MessageCircle,
  ShoppingCart,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    icon: ShoppingCart,
    title: "Browse or tell us what you need",
    text: "Explore the catalog and add items to your cart, or send a WhatsApp message describing your request.",
  },
  {
    icon: MapPin,
    title: "Confirm your delivery location",
    text: "Enter your pincode at checkout. We match it to a configured delivery zone and show the exact charge.",
  },
  {
    icon: MessageCircle,
    title: "Pay online or finalise on WhatsApp",
    text: "Pay securely with Razorpay to confirm an online order, or continue the conversation for enquiry-only items.",
  },
  {
    icon: PackageCheck,
    title: "We prepare and deliver",
    text: "Your order is accepted, prepared and sent out for delivery. Track its status any time with Order Lookup.",
  },
];

export function HowItWorks({ compact = false }: { compact?: boolean }) {
  return (
    <section className="bg-surface py-16 lg:py-20" id="how-it-works">
      <div className="container-page">
        <SectionHeading
          eyebrow="Simple and clear"
          title="How Friendly Basket works"
          description="Two ways to order, one dependable local service."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 80}>
              <div className="relative flex h-full flex-col rounded-3xl border border-line bg-white p-6">
                <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-pale">
                  {index + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pale text-deep">
                  <step.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-forest">
                  {step.title}
                </h3>
                {!compact && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
