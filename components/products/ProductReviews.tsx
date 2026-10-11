"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn, formatDate } from "@/lib/utils";

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

function Stars({ rating, className, size = "h-4 w-4" }: { rating: number; className?: string; size?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(size, i < rating ? "fill-gold text-gold" : "fill-line text-line")}
        />
      ))}
    </div>
  );
}

export function ProductReviews({ productSlug, productName }: { productSlug: string; productName: string }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productSlug)}/reviews`, {
        cache: "no-store",
      });
      const json = await res.json();
      setReviews(json?.data?.reviews ?? []);
      setSummary(json?.data?.summary ?? { average: 0, count: 0 });
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, name: name.trim(), rating, title, comment }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast(
          json.data.published
            ? "Thanks! Your review is live."
            : "Thanks! Your review is pending approval."
        );
        setName("");
        setTitle("");
        setComment("");
        setRating(5);
        await load();
      } else {
        setError(json?.error || "Could not submit your review");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-line pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-forest">Ratings &amp; reviews</h2>
          <div className="mt-2 flex items-center gap-3">
            <Stars rating={Math.round(summary.average)} />
            <span className="text-sm font-semibold text-ink">
              {summary.count > 0 ? `${summary.average} / 5` : "No ratings yet"}
            </span>
            <span className="text-sm text-muted">
              {summary.count > 0 ? `· ${summary.count} review${summary.count > 1 ? "s" : ""}` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {loading ? (
            <p className="text-sm text-muted">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted">Be the first to review {productName}.</p>
          ) : (
            <ul className="space-y-5">
              {reviews.map((r) => (
                <li key={r._id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-forest to-deep text-xs font-bold text-white">
                        {r.customerName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-forest">{r.customerName}</p>
                        <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                      </span>
                    )}
                  </div>
                  <Stars rating={r.rating} className="mt-3" />
                  {r.title && <p className="mt-2 text-sm font-bold text-forest">{r.title}</p>}
                  <p className="mt-1 text-sm leading-relaxed text-muted">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-line bg-white p-6">
          <h3 className="font-display text-lg font-bold text-forest">Write a review</h3>
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="review-name" className="mb-1.5 block text-sm font-semibold text-forest">
                Your name
              </label>
              <input
                id="review-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand"
                placeholder="How should we show your name?"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-forest">Your rating</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    aria-label={`Rate ${i + 1} stars`}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition",
                        i < rating ? "fill-gold text-gold" : "fill-line text-line"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="review-title" className="mb-1.5 block text-sm font-semibold text-forest">
                Title (optional)
              </label>
              <input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand"
                placeholder="Sum it up"
              />
            </div>
            <div>
              <label htmlFor="review-comment" className="mb-1.5 block text-sm font-semibold text-forest">
                Your review
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full rounded-2xl border border-line p-4 text-sm outline-none focus:border-brand"
                placeholder="What did you think?"
              />
            </div>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
