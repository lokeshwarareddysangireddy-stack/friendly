import mongoose, { Schema, type Model } from "mongoose";
import type { PaymentRecordDoc } from "@/types";

const WebhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "webhook_events" }
);

export const WebhookEvent =
  mongoose.models.WebhookEvent ||
  mongoose.model("WebhookEvent", WebhookEventSchema);

export type { PaymentRecordDoc };
