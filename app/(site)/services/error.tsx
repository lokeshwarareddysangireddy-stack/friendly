"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function ServicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[services]", error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <TriangleAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-extrabold text-forest">
        We could not load our services
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        Something went wrong while loading the categories and products. Please try
        again, or reach us on WhatsApp and we will help you order directly.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600 active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-6 text-sm font-bold text-forest transition hover:bg-pale"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
