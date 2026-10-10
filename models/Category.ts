import mongoose, { Schema, type Model } from "mongoose";
import type { CategoryDoc } from "@/types";

const ImageSchema = new Schema(
  { url: String, publicId: String, alt: String },
  { _id: false }
);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    image: { type: ImageSchema, default: null },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    orderingMethod: {
      type: String,
      enum: ["online", "enquiry", "both"],
      default: "both",
    },
    highlights: { type: [String], default: [] },
  },
  { timestamps: true, collection: "categories" }
);

CategorySchema.index({ active: 1, sortOrder: 1 });

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) ||
  mongoose.model<CategoryDoc>("Category", CategorySchema);
