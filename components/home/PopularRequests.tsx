import Link from "next/link";
import { UtensilsCrossed, ShoppingBasket, Stethoscope, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { buildWhatsAppUrl, WA_TEMPLATES } from "@/lib/whatsapp";

export function PopularRequests({ whatsappNumber }: { whatsappNumber: string }) {
  const requests = [
    {
      icon: UtensilsCrossed,
      title: "Cafe-style food & biryani",
      text: "Ask what is cooking today and get current prices.",
      message: WA_TEMPLATES.food,
    },
    {
      icon: ShoppingBasket,
      title: "Grocery & daily essentials",
      text: "Send your list and we will confirm availability.",
      message: WA_TEMPLATES.grocery,
    },
    {
      icon: Stethoscope,
      title: "Medicines & health items",
      text: "Request an item and we will advise on requirements.",
      message: WA_TEMPLATES.medicine,
    },
    {
      icon: Sparkles,
      title: "Custom or unlisted request",
      text: "Something specific? Tell us and we will help.",
      message: WA_TEMPLATES.general,
    },
  ];

  return (
    <section className="container-page py-16 lg:py-20">
      <SectionHeading
        eyebrow="Send a message"
        title="Popular customer requests"
        description="Not everything needs online checkout. These are common requests people send us on WhatsApp."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {requests.map((r) => (
          <a
            key={r.title}
            href={buildWhatsAppUrl(r.message, whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-3xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-soft"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pale text-deep transition group-hover:bg-brand group-hover:text-white">
              <r.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-base font-bold text-forest">
              {r.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{r.text}</p>
            <span className="mt-4 text-sm font-bold text-[#1ebe5a]">
              Message on WhatsApp &rarr;
            </span>
          </a>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Prefer a form?{" "}
        <Link href="/contact#enquiry" className="font-bold text-deep hover:underline">
          Send a detailed enquiry
        </Link>
        .
      </p>
    </section>
  );
}
