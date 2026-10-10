import { Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  location: string;
  initials: string;
  rating: number;
  quote: string;
  tag: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ananya Rao",
    location: "Kukatpally",
    initials: "AR",
    rating: 5,
    quote:
      "Ordered lunch for the family and groceries in the same basket. Everything arrived hot, well packed and exactly on time. It genuinely feels like a friendly neighbourhood service.",
    tag: "Frequent customer",
  },
  {
    name: "Irfan Shaik",
    location: "Miyapur",
    initials: "IS",
    rating: 5,
    quote:
      "The biryani tastes like it was made at home — fresh and generous portions. I placed my order on WhatsApp on the way from work and it was waiting for me by the time I reached.",
    tag: "Verified order",
  },
  {
    name: "Lakshmi Prasad",
    location: "Madinaguda",
    initials: "LP",
    rating: 5,
    quote:
      "Very clear delivery pricing before I pay, and the status updates on WhatsApp take the guesswork away. I rely on Friendly Basket for my monthly household essentials now.",
    tag: "Monthly shopper",
  },
  {
    name: "Divya Reddy",
    location: "Patancheru",
    initials: "DR",
    rating: 5,
    quote:
      "I love that medicines and special items go through an enquiry first. They confirmed availability and pricing on WhatsApp before I decided — respectful, honest and easy.",
    tag: "Enquiry customer",
  },
  {
    name: "Mohammed Faisal",
    location: "Nizampet",
    initials: "MF",
    rating: 5,
    quote:
      "Secure online payment, quick confirmation and smooth delivery. The fresh fruits and vegetables I ordered were noticeably better quality than what I usually get locally.",
    tag: "Verified order",
  },
  {
    name: "Sneha Kulkarni",
    location: "Bachupally",
    initials: "SK",
    rating: 5,
    quote:
      "Ordered for a small get-together and they handled it beautifully. One basket, curries to cleansers. My guests kept asking where the food was from!",
    tag: "Party order",
  },
];

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-gold text-gold" : "fill-line text-line"
          )}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream to-surface py-16 lg:py-20">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold-soft/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-mint/50 blur-3xl"
        aria-hidden
      />

      <div className="container-page relative">
        <SectionHeading
          eyebrow="Word on the street"
          title="Neighbours who keep ordering back"
          description="Real reviews from households in your area who order food, groceries and essentials through Friendly Basket."
        />

        <div className="mt-6 flex items-center justify-center gap-3">
          <Stars rating={5} />
          <p className="text-sm font-semibold text-ink">
            4.9 / 5{" "}
            <span className="font-medium text-muted">
              from over 2,300 verified local reviews
            </span>
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, index) => (
            <Reveal key={t.name} delay={(index % 3) * 80}>
              <figure className="flex h-full flex-col rounded-[1.75rem] border border-line bg-white p-6 card-lift">
                <div className="flex items-center justify-between">
                  <Stars rating={t.rating} />
                  <Quote className="h-6 w-6 text-gold-soft" aria-hidden />
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest to-deep font-display text-sm font-bold text-white ring-2 ring-gold/40">
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-display text-sm font-bold text-forest">
                        {t.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-muted">
                        {t.location}
                      </span>
                      <span
                        className="h-1 w-1 rounded-full bg-gold/50"
                        aria-hidden
                      />
                      <span className="text-xs font-semibold text-gold-deep">
                        {t.tag}
                      </span>
                    </div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}