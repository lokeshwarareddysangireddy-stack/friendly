"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Info, Loader2, Lock, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { useToast } from "@/components/ui/Toast";
import { ProductImage } from "@/components/ui/ProductImage";
import { SITE } from "@/lib/site";
import { cn, formatINR, isValidIndianMobile, normalizeMobile } from "@/lib/utils";
import type { PricedCart } from "@/types";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (payload: unknown) => void) => void;
    };
  }
}

const FIELDS = [
  { name: "name", label: "Full name", placeholder: "Your name", autoComplete: "name" },
  { name: "mobile", label: "Mobile number", placeholder: "10-digit mobile number", autoComplete: "tel" },
] as const;

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clear, ready } = useCart();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    area: "",
    landmark: "",
    instructions: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [couponQuote, setCouponQuote] = useState<{
    cartKey: string;
    priced: PricedCart;
  } | null>(null);

  const cartPayload = useMemo(
    () => items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    [items]
  );
  const cartKey = JSON.stringify(items.map((item) => [item.productId, item.quantity, item.price]));
  const appliedQuote = couponQuote?.cartKey === cartKey ? couponQuote.priced : null;
  const payable = appliedQuote?.total ?? subtotal;

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code.");
      return;
    }
    setCheckingCoupon(true);
    setCouponError("");
    setCouponQuote(null);
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartPayload, couponCode: couponCode.trim() }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        setCouponError(json.error || "Could not apply this coupon.");
        return;
      }
      setCouponQuote({ cartKey, priced: json.data.priced });
    } catch {
      setCouponError("Could not check your coupon. Please try again.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your full name";
    if (!isValidIndianMobile(form.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
    if (form.address.trim().length < 8) e.address = "Please enter your full delivery address";
    if (form.area.trim().length < 2) e.area = "Please enter your area";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const verifyPayment = useCallback(
    async (payload: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      signature: string;
    }) => {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: payload.orderId,
          razorpayOrderId: payload.razorpayOrderId,
          razorpayPaymentId: payload.razorpayPaymentId,
          signature: payload.signature,
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        clear();
        router.push(
          `/order/success?orderId=${encodeURIComponent(json.data.orderId)}&token=${json.data.lookupToken}`
        );
      } else {
        setPlacing(false);
        toast(json?.error || "Payment could not be verified. Please try again.", "error");
      }
    },
    [clear, router, toast]
  );

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const placeOrder = async () => {
    if (checkingCoupon || placing) return;
    if (couponCode.trim() && !appliedQuote?.couponCode) {
      setCouponError("Apply your coupon or clear it before paying.");
      return;
    }
    if (!validate()) {
      toast("Please correct the highlighted fields.", "error");
      return;
    }
    if (!items.length) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            mobile: normalizeMobile(form.mobile),
            address: form.address,
            area: form.area,
            landmark: form.landmark,
            instructions: form.instructions,
          },
          items: cartPayload,
          couponCode: appliedQuote?.couponCode || "",
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        if (json?.fields) setErrors(json.fields);
        toast(json?.error || "Could not create your order.", "error");
        setPlacing(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, mock, keyId } = json.data;

      if (mock) {
        const mockPaymentId = `pay_MOCK${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
        await verifyPayment({
          orderId,
          razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          signature: "mock",
        });
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        toast("Unable to load the payment gateway. Please try again.", "error");
        setPlacing(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency: "INR",
        name: SITE.name,
        description: `Order ${orderId}`,
        order_id: razorpayOrderId,
        prefill: { name: form.name, contact: normalizeMobile(form.mobile) },
        notes: { orderId },
        theme: { color: "#22C55E" },
        handler: (response: RazorpayResponse) => {
          void verifyPayment({
            orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast("Payment was cancelled. Your cart is saved.", "info");
          },
        },
      });
      rzp.on("payment.failed", () => {
        setPlacing(false);
        toast("Payment failed. You can try again.", "error");
      });
      rzp.open();
    } catch {
      toast("Something went wrong. Please try again.", "error");
      setPlacing(false);
    }
  };

  if (ready && !items.length) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-10 text-center">
        <h2 className="font-display text-xl font-bold text-forest">
          Your cart is empty
        </h2>
        <p className="mt-2 text-sm text-muted">
          Add items before proceeding to checkout.
        </p>
        <Link
          href="/services"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white"
        >
          Browse services
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void placeOrder();
        }}
        className="space-y-6"
        noValidate
      >
        <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-forest">
            Delivery details
          </h2>
          <p className="mt-1 text-sm text-muted">
            We use these details to prepare and deliver your order.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <Field
                key={field.name}
                label={field.label}
                name={field.name}
                value={form[field.name]}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                error={errors[field.name]}
                onChange={(v) => update(field.name, v)}
              />
            ))}
            <div className="sm:col-span-2">
              <Field
                label="Full delivery address"
                name="address"
                value={form.address}
                placeholder="House / flat, street, building"
                autoComplete="street-address"
                error={errors.address}
                onChange={(v) => update("address", v)}
                as="textarea"
              />
            </div>
            <Field
              label="Area"
              name="area"
              value={form.area}
              placeholder="Area or locality"
              autoComplete="address-level2"
              error={errors.area}
              onChange={(v) => update("area", v)}
            />
            <Field
              label="Landmark (optional)"
              name="landmark"
              value={form.landmark}
              placeholder="Nearby landmark"
              error={errors.landmark}
              onChange={(v) => update("landmark", v)}
            />
            <div className="sm:col-span-2">
              <Field
                label="Delivery instructions (optional)"
                name="instructions"
                value={form.instructions}
                placeholder="Preferred time, note for the delivery partner"
                onChange={(v) => update("instructions", v)}
                as="textarea"
              />
            </div>
          </div>
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-brand/30 bg-pale p-4 text-sm text-forest">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-deep" />
            <span>
              <span className="font-bold">We deliver within a 20 km range.</span>{" "}
              Our team may call you to confirm your exact location before dispatch.
            </span>
          </div>
        </section>
      </form>

      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-3xl border border-line bg-white p-6">
          <h2 className="font-display text-lg font-extrabold text-forest">
            Order summary
          </h2>

          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3">
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  seed={item.slug}
                  className="h-14 w-14 shrink-0"
                  sizes="56px"
                />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-forest">{item.name}</span>
                  <span className="text-xs text-muted">
                    Qty {item.quantity} &middot; {formatINR(item.price)}
                  </span>
                </div>
                <span className="text-sm font-bold text-forest">
                  {formatINR(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <form
            className="mt-5 border-t border-line pt-5"
            onSubmit={(event) => { event.preventDefault(); void applyCoupon(); }}
          >
            <label htmlFor="coupon-code" className="mb-2 block text-sm font-semibold text-forest">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon-code"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setCouponQuote(null);
                  setCouponError("");
                }}
                maxLength={40}
                disabled={checkingCoupon || placing}
                autoComplete="off"
                placeholder="Enter coupon code"
                aria-invalid={Boolean(couponError)}
                aria-describedby="coupon-status"
                className="h-11 min-w-0 flex-1 rounded-xl border border-line px-3 text-sm outline-none focus:border-brand"
              />
              <button type="submit" disabled={checkingCoupon || placing || !items.length}
                className="rounded-xl bg-forest px-4 text-sm font-bold text-white disabled:opacity-60">
                {checkingCoupon ? "Checking…" : "Apply"}
              </button>
            </div>
            <div id="coupon-status" role="status" className="mt-2 text-xs">
              {couponError ? <p className="text-red-600">{couponError}</p> : appliedQuote?.couponCode ? (
                <p className="text-deep">{appliedQuote.couponCode} applied. You save {formatINR(appliedQuote.discount)}.</p>
              ) : couponQuote ? <p className="text-muted">Your cart changed. Apply the coupon again.</p> : null}
            </div>
            {couponCode && (
              <button type="button" disabled={checkingCoupon || placing}
                onClick={() => { setCouponCode(""); setCouponQuote(null); setCouponError(""); }}
                className="mt-2 text-xs font-semibold text-muted underline">
                Remove coupon
              </button>
            )}
          </form>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-forest">{formatINR(appliedQuote?.subtotal ?? subtotal)}</dd>
            </div>
            {appliedQuote && appliedQuote.discount > 0 && (
              <div className="flex justify-between text-deep">
                <dt>Coupon discount</dt>
                <dd className="font-semibold">−{formatINR(appliedQuote.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="inline-flex items-center gap-1 text-brand">
                <Truck className="h-3.5 w-3.5" />
                Free within 20 km
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-forest">Total payable</dt>
              <dd className="font-display text-xl font-extrabold text-forest">
                {formatINR(payable)}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => void placeOrder()}
            disabled={placing || checkingCoupon}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-bold text-white transition hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                Pay {formatINR(payable)}
              </>
            )}
          </button>

          <div className="mt-4 space-y-2 text-xs text-muted">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-deep" />
              Payments are processed securely by Razorpay.
            </p>
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-deep" />
              Your order is confirmed only after payment is verified on our server.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  placeholder,
  error,
  onChange,
  as,
  autoComplete,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
  as?: "textarea";
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
}) {
  const classes = cn(
    "w-full rounded-2xl border bg-white px-4 text-sm outline-none transition focus:border-brand",
    error ? "border-red-300" : "border-line"
  );
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-forest">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(classes, "py-3")}
        />
      ) : (
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          className={cn(classes, "h-12")}
        />
      )}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
