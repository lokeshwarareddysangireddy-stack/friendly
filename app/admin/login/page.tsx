"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json?.ok) {
        router.replace(next.startsWith("/admin") ? next : "/admin");
        router.refresh();
      } else {
        setError(json?.error || "Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pale/60 to-white px-5 py-16">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-8 rounded-[2rem] border border-line bg-white p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pale text-deep">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-forest">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage orders, products, delivery zones and content.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-forest">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@friendlybasket.com"
                  className="h-12 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-forest"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Default credentials are configured via environment variables. Change them before
          going live.
        </p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pale/60 to-white">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
