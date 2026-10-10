import mongoose, { Schema, type Model } from "mongoose";
import type { DeliveryZoneDoc } from "@/types";

const DeliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    zoneCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    pincodes: { type: [String], default: [], index: true },
    city: { type: String, default: "" },
    locality: { type: String, default: "" },
    deliveryCharge: { type: Number, required: true, min: 0, default: 0 },
    minOrderValue: { type: Number, default: null },
    freeDeliveryThreshold: { type: Number, default: null },
    etaText: { type: String, default: "" },
    active: { type: Boolean, default: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "delivery_zones" }
);

export const DeliveryZone: Model<DeliveryZoneDoc> =
  (mongoose.models.DeliveryZone as Model<DeliveryZoneDoc>) ||
  mongoose.model<DeliveryZoneDoc>("DeliveryZone", DeliveryZoneSchema);
