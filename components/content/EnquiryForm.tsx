"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { cn, isValidIndianMobile, normalizeMobile } from "@/lib/utils";

interface FormState {
  name: string;
  mobile: string;
  category: string;
  items: string;
  location: string;
  instructions: string;
}

const EMPTY: FormState = {
  name: "",
  mobile: "",
  category: "",
  items: "",
  location: "",
  instructions: "",
};

export function EnquiryForm({ categories }: { categories: string[] }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState<{ message: string; whatsappUrl: string } | null>(
    null
  );

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name";
    if (!isValidIndianMobile(form.mobile))
      next.mobile = "Enter a valid 10-digit mobile number";
    if (form.items.trim().length < 3) next.items = "Please tell us what you need";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mobile: normalizeMobile(form.mobile) }),
      });
      const json = await res.json();
      if (json?.ok) {
        setSent({
          message: json.data.message,
          whatsappUrl: json.data.whatsappUrl,
        });
        setForm(EMPTY);
      } else {
        if (json?.fields) setErrors(json.fields);
        setFormError(json?.error || "We could not send your enquiry.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-[2rem] border border-brand/30 bg-pale p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-deep">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-display text-xl font-extrabold text-forest">
          Enquiry received!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          We&apos;ve got your request and will respond shortly. For the fastest reply,
          open WhatsApp with your details pre-filled.
        </p>
        <a
          href={sent.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold text-white transition hover:bg-[#1ebe5a]"
        >
          Continue on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setSent(null)}
          className="mt-3 block w-full text-sm font-semibold text-deep hover:underline"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-line bg-white p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Your name"
          id="name"
          value={form.name}
          error={errors.name}
          placeholder="Full name"
          onChange={(v) => update("name", v)}
        />
        <Field
          label="Mobile number"
          id="mobile"
          value={form.mobile}
          error={errors.mobile}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          onChange={(v) => update("mobile", v.replace(/\D/g, "").slice(0, 10))}
        />
        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-forest">
            Service category
          </label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm outline-none transition focus:border-brand"
          >
            <option value="">Select a category (optional)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Delivery location / pincode"
          id="location"
          value={form.location}
          placeholder="Area or pincode"
          onChange={(v) => update("location", v)}
        />
        <div className="sm:col-span-2">
          <label htmlFor="items" className="mb-1.5 block text-sm font-semibold text-forest">
            What do you need?
          </label>
          <textarea
            id="items"
            value={form.items}
            onChange={(e) => update("items", e.target.value)}
            rows={3}
            placeholder="List the items or describe your request"
            className={cn(
              "w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand",
              errors.items ? "border-red-300" : "border-line"
            )}
          />
          {errors.items && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.items}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="instructions"
            className="mb-1.5 block text-sm font-semibold text-forest"
          >
            Additional instructions (optional)
          </label>
          <textarea
            id="instructions"
            value={form.instructions}
            onChange={(e) => update("instructions", e.target.value)}
            rows={2}
            placeholder="Any preferences or notes"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-brand"
          />
        </div>
      </div>

      {formError && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-bold text-white transition hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        Send enquiry
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        We use your details only to respond to your enquiry.
      </p>
    </form>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
  inputMode,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  inputMode?: "text" | "numeric" | "tel";
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={cn(
          "h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition focus:border-brand",
          error ? "border-red-300" : "border-line"
        )}
      />
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
