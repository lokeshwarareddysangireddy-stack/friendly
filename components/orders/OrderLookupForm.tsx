"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackageSearch, Search } from "lucide-react";
import { cn, isValidIndianMobile, normalizeMobile } from "@/lib/utils";

export function OrderLookupForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const next: Record<string, string> = {};
    if (!orderId.trim()) next.orderId = "Enter your order ID";
    if (!isValidIndianMobile(mobile)) next.mobile = "Enter the registered mobile number";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim().toUpperCase(),
          mobile: normalizeMobile(mobile),
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        router.push(
          `/order/success?orderId=${encodeURIComponent(json.data.orderId)}&token=${json.data.lookupToken}`
        );
      } else {
        setFormError(json?.error || "We could not find that order.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-lg rounded-[2rem] border border-line bg-white p-6 sm:p-8"
      noValidate
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pale text-deep">
        <PackageSearch className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-xl font-extrabold text-forest">
        Find your order
      </h2>
      <p className="mt-1 text-sm text-muted">
        Enter the order ID from your confirmation and the mobile number used at checkout.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="orderId" className="mb-1.5 block text-sm font-semibold text-forest">
            Order ID
          </label>
          <input
            id="orderId"
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value.toUpperCase());
              setErrors((p) => ({ ...p, orderId: "" }));
            }}
            placeholder="FB-XXXXXX-XXXXXX"
            className={cn(
              "h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition focus:border-brand",
              errors.orderId ? "border-red-300" : "border-line"
            )}
          />
          {errors.orderId && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.orderId}</p>
          )}
        </div>
        <div>
          <label htmlFor="mobile" className="mb-1.5 block text-sm font-semibold text-forest">
            Registered mobile number
          </label>
          <input
            id="mobile"
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
              setErrors((p) => ({ ...p, mobile: "" }));
            }}
            inputMode="numeric"
            placeholder="10-digit mobile number"
            className={cn(
              "h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition focus:border-brand",
              errors.mobile ? "border-red-300" : "border-line"
            )}
          />
          {errors.mobile && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.mobile}</p>
          )}
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
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        Find my order
      </button>
    </form>
  );
}
