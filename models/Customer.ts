import mongoose, { Schema, type Model } from "mongoose";
import type { CustomerDoc } from "@/types";

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    mobile: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const CustomerCartLineSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, default: "" },
    slug: { type: String, default: "" },
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: null },
    image: { type: String, default: "" },
    unit: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false, index: true },
    verifyToken: { type: String, default: null, index: true },
    verifyTokenExpiry: { type: Date, default: null },
    resetToken: { type: String, default: null, index: true },
    resetTokenExpiry: { type: Date, default: null },
    addresses: { type: [AddressSchema], default: [] },
    wishlist: { type: [String], default: [], index: true },
    cart: { type: [CustomerCartLineSchema], default: [] },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "customers" }
);

export const Customer: Model<CustomerDoc> =
  (mongoose.models.Customer as Model<CustomerDoc>) ||
  mongoose.model<CustomerDoc>("Customer", CustomerSchema);
