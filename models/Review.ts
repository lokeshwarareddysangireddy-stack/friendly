import mongoose, { Schema, type Model } from "mongoose";
import type { ReviewDoc } from "@/types";

const ReviewSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    productSlug: { type: String, required: true, index: true },
    productName: { type: String, default: "" },
    customerId: { type: String, default: null, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: "", lowercase: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, required: true },
    orderId: { type: String, default: null },
    verifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true, collection: "reviews" }
);

ReviewSchema.index({ productId: 1, customerId: 1 }, { unique: true, sparse: true });

export const Review: Model<ReviewDoc> =
  (mongoose.models.Review as Model<ReviewDoc>) ||
  mongoose.model<ReviewDoc>("Review", ReviewSchema);
