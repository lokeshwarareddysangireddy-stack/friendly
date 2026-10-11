import bcrypt from "bcryptjs";
import {
  countAdmins,
  createAdmin,
  findAdminByEmail,
  updateAdmin,
} from "@/lib/db";
import type { AdminUserDoc } from "@/types";

export async function ensureInitialAdmin(): Promise<void> {
  const total = await countAdmins();
  if (total > 0) return;
  const email = (process.env.ADMIN_EMAIL || "friendlybasket9888@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "godiswithme";
  const passwordHash = await bcrypt.hash(password, 10);
  await createAdmin({
    email,
    name: process.env.ADMIN_NAME || "Friendly Basket Admin",
    passwordHash,
    role: "owner",
    active: true,
  });
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminUserDoc | null> {
  await ensureInitialAdmin();
  const admin = await findAdminByEmail(email);
  if (!admin || !admin.active) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;
  await updateAdmin(admin._id, { lastLoginAt: new Date().toISOString() });
  return admin;
}

export function publicAdmin(admin: AdminUserDoc) {
  const { passwordHash, ...safe } = admin;
  void passwordHash;
  return safe;
}
