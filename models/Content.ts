import mongoose, { Schema } from "mongoose";
import type {
  EnquiryDoc,
  FAQDoc,
  PromotionDoc,
  SiteSettingsDoc,
} from "@/types";

const PromotionSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    kind: {
      type: String,
      enum: ["announcement", "banner", "feature"],
      default: "announcement",
    },
    active: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "promotions" }
);

const FAQSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: "General" },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "faqs" }
);

const EnquirySchema = new Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    category: { type: String, default: "" },
    items: { type: String, required: true },
    location: { type: String, default: "" },
    instructions: { type: String, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true, collection: "enquiries" }
);

const SiteSettingsSchema = new Schema(
  {
    announcementEnabled: { type: Boolean, default: true },
    announcementText: {
      type: String,
      default: "Friendly Basket \u2014 Everything You Need. One Message Away!",
    },
    promoEnabled: { type: Boolean, default: true },
    promoText: { type: String, default: "Starts from \u20B949*" },
    promoConditions: {
      type: String,
      default:
        "Applicable on selected items and orders only. Delivery charges and minimum order values may apply.",
    },
    whatsappNumber: { type: String, default: "919888144184" },
    contactEmail: { type: String, default: "hello@friendlybasket.com" },
    supportHours: { type: String, default: "Every day, 8:00 AM \u2013 10:00 PM" },
    address: { type: String, default: "Serving your neighbourhood in Hyderabad" },
    freeDeliveryNote: {
      type: String,
      default: "Free delivery applies above the threshold set for your delivery zone.",
    },
  },
  { timestamps: true, collection: "site_settings" }
);

export const Promotion =
  mongoose.models.Promotion ||
  mongoose.model("Promotion", PromotionSchema);
export const FAQ =
  mongoose.models.FAQ || mongoose.model("FAQ", FAQSchema);
export const Enquiry =
  mongoose.models.Enquiry || mongoose.model("Enquiry", EnquirySchema);
export const SiteSettings =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);

export type { PromotionDoc, FAQDoc, EnquiryDoc, SiteSettingsDoc };
