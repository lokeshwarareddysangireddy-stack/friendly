import mongoose, { Schema, type Model } from "mongoose";
import type { OrderTrackDoc, RiderDoc } from "@/types";

const GeoPointSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: null },
    speed: { type: Number, default: null },
    heading: { type: Number, default: null },
    recordedAt: { type: String, required: true },
  },
  { _id: false }
);

const RiderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    vehicleType: { type: String, default: "" },
    licensePlate: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ["offline", "online", "busy"], default: "offline" },
    lastLocation: { type: GeoPointSchema, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "riders" }
);

export const Rider: Model<RiderDoc> =
  (mongoose.models.Rider as Model<RiderDoc>) ||
  mongoose.model<RiderDoc>("Rider", RiderSchema);

const OrderTrackSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    riderId: { type: String, required: true, index: true },
    points: { type: [GeoPointSchema], default: [] },
  },
  { timestamps: true, collection: "order_tracks" }
);

export const OrderTrack: Model<OrderTrackDoc> =
  (mongoose.models.OrderTrack as Model<OrderTrackDoc>) ||
  mongoose.model<OrderTrackDoc>("OrderTrack", OrderTrackSchema);
