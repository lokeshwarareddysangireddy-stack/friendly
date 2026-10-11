import mongoose, { Schema, type Model } from "mongoose";
import type { OrderDoc } from "@/types";

const OrderItemSchema = new Schema(
  {
    productId: String,
    name: String,
    slug: String,
    price: Number,
    mrp: Number,
    quantity: Number,
    lineTotal: Number,
    image: String,
    unit: String,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    customer: {
      name: String,
      mobile: String,
      address: String,
      pincode: String,
      city: String,
      state: String,
      instructions: String,
    },
    delivery: {
      zoneId: { type: String, default: null },
      zoneName: { type: String, default: null },
      zoneCode: { type: String, default: null },
      deliveryCharge: { type: Number, default: 0 },
      freeDeliveryApplied: { type: Boolean, default: false },
      etaText: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refund_pending", "refunded"],
      default: "pending",
      index: true,
    },
    fulfilmentStatus: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String, enum: ["razorpay", "enquiry"], default: "razorpay" },
    customerId: { type: String, default: null, index: true },
    customerEmail: { type: String, default: null, lowercase: true },
    assignment: {
      type: new Schema(
        {
          riderId: { type: String, default: null },
          riderName: { type: String, default: "" },
          riderMobile: { type: String, default: "" },
          assignedAt: { type: Date, default: null },
          pickedUpAt: { type: Date, default: null },
          deliveredAt: { type: Date, default: null },
        },
        { _id: false }
      ),
      default: null,
    },
    statusHistory: {
      type: [
        new Schema(
          {
            status: { type: String, required: true },
            at: { type: Date, default: Date.now },
            by: { type: String, enum: ["system", "admin", "rider"], default: "system" },
            note: { type: String, default: "" },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    razorpayOrderId: { type: String, default: null, index: true },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    lookupToken: { type: String, required: true, index: true },
    notes: { type: String, default: "" },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "orders" }
);

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ||
  mongoose.model<OrderDoc>("Order", OrderSchema);
