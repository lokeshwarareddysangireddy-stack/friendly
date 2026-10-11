"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Lock, Mail } from "lucide-react";
import {
  AuthShell,
  Field,
  FormError,
  SubmitButton,
  Link,
} from "@/components/auth/auth-ui";
import { useCustomer } from "@/components/auth/customer-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useCustomer();
  const next = searchParams.get("next") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json?.ok) {
        await refresh();
        router.replace(next.startsWith("/") ? next : "/account");
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
    <AuthShell
      title="Sign in"
      subtitle="Track orders, save your wishlist and check out faster."
      icon={LogIn}
      footer={
        <>
          New to Friendly Basket?{" "}
          <Link href="/register" className="font-semibold text-deep hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          icon={Mail}
        />
        <div>
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Your password"
            autoComplete="current-password"
            icon={Lock}
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-semibold text-deep hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <FormError message={error} />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
