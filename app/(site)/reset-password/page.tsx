"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import {
  AuthShell,
  Field,
  FormError,
  FormNotice,
  SubmitButton,
  Link,
} from "@/components/auth/auth-ui";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (json?.ok) {
        setDone(true);
        setTimeout(() => router.replace("/login"), 1800);
      } else {
        setError(json?.error || "Could not reset your password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Invalid reset link" icon={ShieldCheck}>
        <FormError message="This password reset link is missing its token. Please request a new one." />
        <div className="mt-4">
          <Link href="/forgot-password" className="font-semibold text-deep hover:underline">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password to secure your account." icon={ShieldCheck}>
      {done ? (
        <FormNotice>
          Your password has been updated. Redirecting you to sign in…
        </FormNotice>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            id="password"
            label="New password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon={Lock}
          />
          <Field
            id="confirm"
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            icon={Lock}
          />
          <FormError message={error} />
          <SubmitButton loading={loading}>Update password</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
