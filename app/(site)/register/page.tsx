"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Phone, UserPlus, UserRound } from "lucide-react";
import {
  AuthShell,
  Field,
  FormError,
  SubmitButton,
  Link,
} from "@/components/auth/auth-ui";
import { useCustomer } from "@/components/auth/customer-context";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useCustomer();
  const next = searchParams.get("next") || "/account";
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json?.ok) {
        setError(json?.error || "Could not create your account");
        return;
      }
      const login = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (login.ok) {
        await refresh();
        router.replace(next.startsWith("/") ? next : "/account");
        router.refresh();
      } else {
        router.replace("/login?registered=1");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account for orders, wishlist and delivery tracking."
      icon={UserPlus}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-deep hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          id="name"
          label="Full name"
          value={form.name}
          onChange={set("name")}
          placeholder="Your name"
          autoComplete="name"
          icon={UserRound}
        />
        <Field
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
        />
        <Field
          id="mobile"
          label="Mobile number"
          type="tel"
          value={form.mobile}
          onChange={set("mobile")}
          placeholder="10-digit mobile"
          autoComplete="tel"
          icon={Phone}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          icon={Lock}
        />
        <FormError message={error} />
        <SubmitButton loading={loading}>Create account</SubmitButton>
        <p className="text-center text-xs text-muted">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
