import {
  MessageCircle,
  MapPin,
  ShieldCheck,
  Sprout,
  ClipboardList,
  Search,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const REASONS = [
  {
    icon: MessageCircle,
    title: "One message away",
    text: "Order through the website or send a WhatsApp message. Whichever is easier for you.",
  },
  {
    icon: MapPin,
    title: "Delivery within 20 km",
    text: "We deliver free across a 20 km range and confirm your location before dispatch.",
  },
  {
    icon: ShieldCheck,
    title: "Secure online checkout",
    text: "Payments are processed by Razorpay and verified on our server before an order is confirmed.",
  },
  {
    icon: Sprout,
    title: "Food and groceries together",
    text: "Meals, fresh produce and daily essentials can be requested in a single basket.",
  },
  {
    icon: ClipboardList,
    title: "Enquiry-led for special items",
    text: "Medicines and unlisted items are handled as enquiries so requirements are clear first.",
  },
  {
    icon: Search,
    title: "Order lookup",
    text: "Check your order status any time using your order ID and registered mobile number.",
  },
];

export function WhyChoose() {
  return (
    <section className="bg-surface py-16 lg:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why Friendly Basket"
          title="A friendlier way to order locally"
          description="Clear pricing, honest processes and a service built around your neighbourhood."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason, index) => (
            <Reveal key={reason.title} delay={index * 60}>
              <div className="flex h-full gap-4 rounded-3xl border border-line bg-white p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pale text-deep">
                  <reason.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-forest">
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {reason.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
