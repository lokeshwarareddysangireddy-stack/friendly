"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, UserRound } from "lucide-react";
import { useCustomer } from "@/components/auth/customer-context";
import { Field, FormError, SubmitButton } from "@/components/auth/auth-ui";
import { useToast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const { customer, refresh } = useCustomer();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setMobile(customer.mobile);
    }
  }, [customer]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile }),
      });
      const json = await res.json();
      if (json?.ok) {
        await refresh();
        toast("Profile updated", "success");
      } else {
        setError(json?.error || "Could not update your profile");
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
        <h1 className="font-display text-3xl font-extrabold text-forest">Profile</h1>
        <p className="mt-1 text-sm text-muted">Keep your contact details up to date.</p>
      </div>
      <div className="rounded-3xl border border-line bg-white p-6">
        <form onSubmit={submit} className="max-w-lg space-y-4" noValidate>
          <Field id="name" label="Full name" value={name} onChange={setName} icon={UserRound} />
          <Field
            id="mobile"
            label="Mobile number"
            type="tel"
            value={mobile}
            onChange={setMobile}
            icon={Phone}
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-forest">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={customer?.email || ""}
                readOnly
                className="h-12 w-full cursor-not-allowed rounded-2xl border border-line bg-surface pl-10 pr-4 text-sm text-muted outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-muted">Email cannot be changed. Contact support if needed.</p>
          </div>
          <FormError message={error} />
          <SubmitButton loading={loading}>Save changes</SubmitButton>
        </form>
      </div>
    </div>
  );
}
