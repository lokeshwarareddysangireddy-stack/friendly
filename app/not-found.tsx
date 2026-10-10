import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pale/60 to-white px-6 py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pale text-deep">
          <Compass className="h-8 w-8" />
        </div>
        <p className="mt-6 font-display text-5xl font-extrabold text-forest">404</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-forest">
          This page could not be found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you are looking for may have moved or no longer exists. Head back home
          or browse our services.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 items-center justify-center rounded-full border border-forest bg-white px-6 text-sm font-bold text-forest transition hover:bg-pale"
          >
            Browse services
          </Link>
        </div>
      </div>
    </main>
  );
}
