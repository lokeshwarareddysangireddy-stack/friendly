"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Field, FormError, SubmitButton } from "@/components/auth/auth-ui";
import { useToast } from "@/components/ui/Toast";

export default function PasswordPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast("Password updated", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirm("");
      } else {
        setError(json?.error || "Could not change your password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-forest">Password</h1>
        <p className="mt-1 text-sm text-muted">Use a strong password you do not reuse elsewhere.</p>
      </div>
      <div className="rounded-3xl border border-line bg-white p-6">
        <form onSubmit={submit} className="max-w-lg space-y-4" noValidate>
          <Field
            id="current"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            icon={Lock}
          />
          <Field
            id="new"
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon={Lock}
          />
          <Field
            id="confirm"
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            icon={Lock}
          />
          <FormError message={error} />
          <SubmitButton loading={loading}>Update password</SubmitButton>
        </form>
      </div>
    </div>
  );
}
