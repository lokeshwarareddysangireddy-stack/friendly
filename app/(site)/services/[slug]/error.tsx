"use client";
import Link from "next/link";
export default function ErrorState({ reset }: { reset: () => void }) {
  return <div className="container-page py-20 text-center" role="alert">
    <h2 className="text-2xl font-bold text-forest">We couldn’t load this catalogue</h2>
    <p className="mt-3 text-muted">Please try again in a moment.</p>
    <button onClick={reset} className="mt-6 rounded-full bg-forest px-6 py-3 font-bold text-white">Try again</button>
    <Link href="/services" className="ml-4 text-deep underline">All services</Link>
  </div>;
}
