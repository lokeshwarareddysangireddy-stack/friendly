"use client";

import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import {
  AuthShell,
  Field,
  FormError,
  FormNotice,
  SubmitButton,
  Link,
} from "@/components/auth/auth-ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json?.ok) {
        setMessage(json?.data?.message || "Check your email for a reset link.");
        setResetUrl(json?.data?.resetUrl || null);
      } else {
        setError(json?.error || "Could not process your request");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we will send you a secure reset link."
      icon={KeyRound}
      footer={
        <Link href="/login" className="font-semibold text-deep hover:underline">
          Back to sign in
        </Link>
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
        {message && <FormNotice>{message}</FormNotice>}
        {resetUrl && (
          <FormNotice>
            Email delivery is not configured on this server, so use your secure link:
            <br />
            <Link href={resetUrl} className="mt-1 inline-block break-all font-semibold text-deep hover:underline">
              Set a new password
            </Link>
          </FormNotice>
        )}
        <FormError message={error} />
        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
