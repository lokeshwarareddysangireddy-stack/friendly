import mongoose, { Schema, type Model } from "mongoose";
import type { PaymentRecordDoc } from "@/types";

const PaymentRecordSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    internalOrderId: { type: String, required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
      index: true,
    },
    method: { type: String, default: "" },
    signatureVerified: { type: Boolean, default: false },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "payment_records" }
);

export const PaymentRecord: Model<PaymentRecordDoc> =
  (mongoose.models.PaymentRecord as Model<PaymentRecordDoc>) ||
  mongoose.model<PaymentRecordDoc>("PaymentRecord", PaymentRecordSchema);
