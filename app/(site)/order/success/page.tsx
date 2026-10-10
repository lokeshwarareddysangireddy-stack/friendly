import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  PartyPopper,
  Receipt,
} from "lucide-react";
import { getOrderByOrderId } from "@/lib/db";
import { getSettingsSafe } from "@/lib/public-data";
import { WhatsAppLink } from "@/components/layout/WhatsAppLink";
import { buildOrderFollowUpMessage } from "@/lib/whatsapp";
import { formatDateTime, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; token?: string }>;
}) {
  const { orderId, token } = await searchParams;
  if (!orderId || !token) notFound();

  const order = await getOrderByOrderId(orderId.toUpperCase());
  if (!order || order.lookupToken !== token) notFound();

  const settings = await getSettingsSafe();
  const paid = order.paymentStatus === "paid";
  const itemSummary = order.items
    .map((i) => `${i.name} x${i.quantity}`)
    .join(", ");

  return (
    <section className="container-page py-14">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-line bg-white p-6 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pale text-deep">
            {paid ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
          </div>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-forest">
            {paid ? "Order confirmed!" : "Order received"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
            {paid
              ? "Thank you for your order. We have received your payment and our team will coordinate delivery on WhatsApp."
              : "We have received your order. Payment is awaiting confirmation — our team will reach out shortly."}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-bold text-forest">
            <Receipt className="h-4 w-4" />
            Order ID: {order.orderId}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <WhatsAppLink
              message={buildOrderFollowUpMessage({
                orderId: order.orderId,
                itemSummary,
                paymentRef: order.razorpayPaymentId,
              })}
              number={settings.whatsappNumber}
              className="h-12"
            >
              Confirm on WhatsApp
            </WhatsAppLink>
            {paid && (
              <a
                href={`/api/receipt/${order.orderId}?token=${order.lookupToken}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-forest bg-white px-6 text-sm font-bold text-forest transition hover:bg-pale"
              >
                <Download className="h-4 w-4" />
                Download receipt (PDF)
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 className="font-display text-lg font-extrabold text-forest">
              Order details
            </h2>
            <span className="text-xs font-semibold text-muted">
              {formatDateTime(order.createdAt)}
            </span>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
                Delivering to
              </h3>
              <p className="mt-2 text-sm font-semibold text-forest">
                {order.customer.name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {order.customer.address}
                <br />
                {order.customer.city}, {order.customer.state} — {order.customer.pincode}
              </p>
              <p className="mt-1 text-sm text-muted">{order.customer.mobile}</p>
              {order.delivery.zoneName && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-pale px-3 py-1.5 text-xs font-semibold text-deep">
                  <MapPin className="h-3.5 w-3.5" />
                  {order.delivery.zoneName}
                  {order.delivery.etaText ? ` · ${order.delivery.etaText}` : ""}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
                Payment
              </h3>
              <p className="mt-2 text-sm font-semibold capitalize text-forest">
                {order.paymentStatus.replace("_", " ")}
              </p>
              {order.razorpayPaymentId && (
                <p className="mt-1 break-all text-xs text-muted">
                  Ref: {order.razorpayPaymentId}
                </p>
              )}
              <p className="mt-1 text-sm text-muted">
                Status:{" "}
                <span className="font-semibold capitalize text-forest">
                  {order.fulfilmentStatus.replace(/_/g, " ")}
                </span>
              </p>
            </div>
          </div>

          <ul className="border-t border-line">
            {order.items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 px-6 py-3.5 text-sm"
              >
                <span className="text-forest">
                  {item.name}
                  <span className="ml-2 text-xs text-muted">x{item.quantity}</span>
                </span>
                <span className="font-semibold text-forest">
                  {formatINR(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-line px-6 py-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-forest">{formatINR(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="font-semibold text-brand">
                  -{formatINR(order.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Delivery charge</dt>
              <dd className="font-semibold text-forest">
                {order.delivery.freeDeliveryApplied
                  ? "Free"
                  : formatINR(order.deliveryCharge)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-forest">Total</dt>
              <dd className="font-display text-xl font-extrabold text-forest">
                {formatINR(order.total)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-muted">
            <PartyPopper className="h-4 w-4 text-deep" />
            Need help? Save your order ID — you can look it up anytime.
          </p>
          <Link
            href="/order-lookup"
            className="text-sm font-bold text-deep hover:underline"
          >
            Look up another order
          </Link>
        </div>
      </div>
    </section>
  );
}
