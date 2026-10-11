import mongoose, { Schema, type Model } from "mongoose";
import type { NewsletterDoc, NotificationLogDoc } from "@/types";

const NotificationLogSchema = new Schema(
  {
    channel: { type: String, enum: ["email", "whatsapp"], required: true, index: true },
    event: { type: String, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    recipient: { type: String, required: true },
    subject: { type: String, default: "" },
    preview: { type: String, default: "" },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "skipped",
      index: true,
    },
    provider: { type: String, default: "none" },
    providerMessageId: { type: String, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true, collection: "notification_logs" }
);

export const NotificationLog: Model<NotificationLogDoc> =
  (mongoose.models.NotificationLog as Model<NotificationLogDoc>) ||
  mongoose.model<NotificationLogDoc>("NotificationLog", NotificationLogSchema);

const NewsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    source: { type: String, default: "footer" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "newsletter" }
);

export const Newsletter: Model<NewsletterDoc> =
  (mongoose.models.Newsletter as Model<NewsletterDoc>) ||
  mongoose.model<NewsletterDoc>("Newsletter", NewsletterSchema);
