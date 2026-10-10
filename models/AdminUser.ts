import mongoose, { Schema, type Model } from "mongoose";
import type { AdminUserDoc } from "@/types";

const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "admin", "staff"], default: "admin" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "admin_users" }
);

export const AdminUser: Model<AdminUserDoc> =
  (mongoose.models.AdminUser as Model<AdminUserDoc>) ||
  mongoose.model<AdminUserDoc>("AdminUser", AdminUserSchema);
