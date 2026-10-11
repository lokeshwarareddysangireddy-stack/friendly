import { Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import type { ReviewDoc } from "@/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}

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

export function Testimonials({ reviews, total }: { reviews: ReviewDoc[]; total: number }) {
  if (!reviews.length) return null;
  const average =
    Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;

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
          description="Real reviews from customers who order food, groceries and essentials through Friendly Basket."
        />

        <div className="mt-6 flex items-center justify-center gap-3">
          <Stars rating={Math.round(average)} />
          <p className="text-sm font-semibold text-ink">
            {average.toFixed(1)} / 5{" "}
            <span className="font-medium text-muted">
              from {total} customer review{total === 1 ? "" : "s"}
            </span>
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((t, index) => (
            <Reveal key={t._id} delay={(index % 3) * 80}>
              <figure className="flex h-full flex-col rounded-[1.75rem] border border-line bg-white p-6 card-lift">
                <div className="flex items-center justify-between">
                  <Stars rating={t.rating} />
                  <Quote className="h-6 w-6 text-gold-soft" aria-hidden />
                </div>
                {t.title && (
                  <p className="mt-4 font-display text-sm font-bold text-forest">{t.title}</p>
                )}
                <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-ink">
                  &ldquo;{t.comment}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest to-deep font-display text-sm font-bold text-white ring-2 ring-gold/40">
                    {initials(t.customerName)}
                  </span>
                  <div className="min-w-0">
                    <span className="truncate font-display text-sm font-bold text-forest">
                      {t.customerName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gold-deep">
                        {t.verifiedPurchase ? "Verified order" : "Customer review"}
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