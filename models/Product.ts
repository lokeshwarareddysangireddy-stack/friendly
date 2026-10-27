import mongoose, { Schema, type Model } from "mongoose";
import type { ProductDoc } from "@/types";

const ImageSchema = new Schema(
  {
    url: String,
    publicId: String,
    alt: String,
    // Provenance for automated image enrichment (see scripts/enrich-grocery-images.mjs).
    sourceUrl: String,
    sourceSite: String,
    sourceProductId: String,
    imageType: {
      type: String,
      enum: ["official", "licensed", "generated", "placeholder"],
    },
    matchStatus: {
      type: String,
      enum: ["exact", "review_required", "not_found", "generated"],
    },
    verificationStatus: { type: String, enum: ["verified", "unverified"] },
    usagePermission: {
      type: String,
      enum: ["confirmed", "unknown", "restricted"],
    },
    verifiedAt: String,
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    categoryId: { type: String, required: true, index: true },
    categorySlug: { type: String, required: true, index: true },
    images: { type: [ImageSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: null },
    available: { type: Boolean, default: true },
    stockQty: { type: Number, default: null },
    trackStock: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    sku: { type: String, default: "" },
    active: { type: Boolean, default: true },
    orderingMethod: {
      type: String,
      enum: ["online", "enquiry", "both"],
      default: "both",
    },
    requiresPrescription: { type: Boolean, default: false },
    unit: { type: String, default: "" },
    brand: { type: String, default: "" },
    tags: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "products" }
);

ProductSchema.index(
  { name: "text", description: "text", tags: "text" },
  { name: "product_text" }
);
ProductSchema.index({ active: 1, featured: 1, categorySlug: 1 });
ProductSchema.index({ active: 1, featured: 1, sortOrder: 1, name: 1 });

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", ProductSchema);
