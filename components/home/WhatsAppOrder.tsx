import Image from "next/image";
import { MessageSquareText, PackageCheck, ShieldCheck } from "lucide-react";
import { WhatsAppLink, WhatsAppGlyph } from "@/components/layout/WhatsAppLink";
import { WA_TEMPLATES } from "@/lib/whatsapp";

const STEPS = [
  {
    icon: MessageSquareText,
    title: "Send a message",
    text: "Tell us what you need in a quick WhatsApp message.",
  },
  {
    icon: ShieldCheck,
    title: "Confirm & pay",
    text: "We confirm availability and delivery charges first.",
  },
  {
    icon: PackageCheck,
    title: "Receive with care",
    text: "Your order is prepared and delivered to your door.",
  },
];

export function WhatsAppOrder({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <section className="container-page py-16 lg:py-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-forest via-deep to-forest px-6 py-12 sm:px-12 lg:py-16">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lime/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-brand/25 blur-3xl"
          aria-hidden
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="eyebrow rounded-full bg-white/10 px-4 py-2 text-lime">
              <WhatsAppGlyph className="h-3.5 w-3.5" />
              Order on WhatsApp
            </span>
            <h2 className="mt-5 font-editorial text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Your daily needs, one friendly message.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">
              No forms, no fuss. Send Friendly Basket a message about your groceries, meals
              or essentials and we&apos;ll take it from there.
            </p>

            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.title} className="rounded-2xl bg-white/8 p-4 backdrop-blur">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lime">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-white">{s.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/70">{s.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8">
              <WhatsAppLink
                message={WA_TEMPLATES.general}
                number={whatsappNumber}
                className="h-14 px-8 text-base"
              >
                Chat on WhatsApp
              </WhatsAppLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-[2rem] border border-white/15 shadow-lift">
              <Image
                src="/images/lifestyle/packing-groceries.jpg"
                alt="Groceries being carefully packed for delivery"
                width={1400}
                height={1120}
                sizes="(max-width: 1024px) 80vw, 34vw"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-forest/90 px-4 py-3 shadow-lift backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <WhatsAppGlyph className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-white">Packed with care</p>
                <p className="text-[11px] text-white/70">Delivered to your door</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
