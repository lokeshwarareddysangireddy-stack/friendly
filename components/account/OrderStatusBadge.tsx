import type { OrderDoc, OrderPaymentStatus } from "@/types";
import { cn } from "@/lib/utils";

const FULFILMENT_LABEL: Record<OrderDoc["fulfilmentStatus"], string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const FULFILMENT_TONE: Record<OrderDoc["fulfilmentStatus"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  preparing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-violet-50 text-violet-700 border-violet-200",
  out_for_delivery: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_LABEL: Record<OrderPaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refund_pending: "Refund pending",
  refunded: "Refunded",
};

const PAYMENT_TONE: Record<OrderPaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refund_pending: "bg-orange-50 text-orange-700 border-orange-200",
  refunded: "bg-slate-50 text-slate-700 border-slate-200",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderDoc["fulfilmentStatus"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
        FULFILMENT_TONE[status],
        className
      )}
    >
      {FULFILMENT_LABEL[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: OrderPaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
        PAYMENT_TONE[status]
      )}
    >
      {PAYMENT_LABEL[status]}
    </span>
  );
}

export { FULFILMENT_LABEL };
