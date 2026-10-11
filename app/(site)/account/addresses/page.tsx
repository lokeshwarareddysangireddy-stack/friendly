"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Field, FormError, SubmitButton } from "@/components/auth/auth-ui";
import { useCustomer } from "@/components/auth/customer-context";
import { useToast } from "@/components/ui/Toast";
import { INDIAN_STATES } from "@/lib/site";
import type { AddressDoc } from "@/types";

const EMPTY = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  mobile: "",
  isDefault: false,
};

export default function AddressesPage() {
  const { refresh } = useCustomer();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<AddressDoc[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/addresses", { cache: "no-store" });
      const json = await res.json();
      setAddresses(json?.data?.addresses ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json?.ok) {
        setAddresses(json.data.addresses);
        setForm({ ...EMPTY });
        setShowForm(false);
        await refresh();
        toast("Address added", "success");
      } else {
        setError(json?.error || "Could not save the address");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/auth/addresses/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json?.ok) {
      setAddresses(json.data.addresses);
      await refresh();
    }
  };

  const makeDefault = async (id: string) => {
    const res = await fetch(`/api/auth/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const json = await res.json();
    if (json?.ok) {
      setAddresses(json.data.addresses);
      await refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-forest">Addresses</h1>
          <p className="mt-1 text-sm text-muted">Save addresses for quicker checkout.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Add address
        </button>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-line bg-white p-6">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field id="label" label="Label" value={form.label} onChange={(v) => set("label", v)} required={false} />
            <Field
              id="mobile"
              label="Contact number"
              type="tel"
              value={form.mobile}
              onChange={(v) => set("mobile", v)}
              required={false}
            />
            <div className="sm:col-span-2">
              <Field
                id="line1"
                label="Address line 1"
                value={form.line1}
                onChange={(v) => set("line1", v)}
                placeholder="House / flat, street"
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                id="line2"
                label="Address line 2"
                value={form.line2}
                onChange={(v) => set("line2", v)}
                placeholder="Area, landmark (optional)"
                required={false}
              />
            </div>
            <Field id="city" label="City" value={form.city} onChange={(v) => set("city", v)} />
            <div>
              <label htmlFor="state" className="mb-1.5 block text-sm font-semibold text-forest">
                State
              </label>
              <select
                id="state"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm outline-none focus:border-brand"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Field id="pincode" label="Pincode" value={form.pincode} onChange={(v) => set("pincode", v)} placeholder="6-digit" />
            <label className="flex items-center gap-2 text-sm font-semibold text-forest sm:self-end">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => set("isDefault", e.target.checked)}
                className="h-4 w-4 rounded border-line"
              />
              Set as default
            </label>
            <div className="sm:col-span-2">
              <FormError message={error} />
              <div className="mt-2">
                <SubmitButton loading={loading}>Save address</SubmitButton>
              </div>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 text-sm text-muted">No saved addresses yet.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a._id} className="relative rounded-3xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-forest">
                  <MapPin className="h-4 w-4 text-deep" /> {a.label}
                </span>
                {a.isDefault && (
                  <span className="rounded-full bg-pale px-2.5 py-0.5 text-xs font-bold text-deep">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} — {a.pincode}
                {a.mobile ? <><br />{a.mobile}</> : null}
              </p>
              <div className="mt-4 flex gap-2">
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(a._id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-bold text-forest hover:bg-pale"
                  >
                    <Star className="h-3.5 w-3.5" /> Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(a._id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
