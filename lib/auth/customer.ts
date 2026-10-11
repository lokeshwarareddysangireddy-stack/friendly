import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  createCustomer,
  findCustomerByEmail,
  updateCustomer,
} from "@/lib/db";
import type { CustomerDoc } from "@/types";

const VERIFY_TTL_MS = 1000 * 60 * 60 * 24;
const RESET_TTL_MS = 1000 * 60 * 60;

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export interface PublicCustomer {
  _id: string;
  email: string;
  name: string;
  mobile: string;
  emailVerified: boolean;
  addresses: CustomerDoc["addresses"];
  wishlist: string[];
  cart: CustomerDoc["cart"];
  createdAt: string;
}

export function publicCustomer(customer: CustomerDoc): PublicCustomer {
  return {
    _id: customer._id,
    email: customer.email,
    name: customer.name,
    mobile: customer.mobile,
    emailVerified: customer.emailVerified,
    addresses: customer.addresses || [],
    wishlist: customer.wishlist || [],
    cart: customer.cart || [],
    createdAt: customer.createdAt,
  };
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  mobile: string;
  password: string;
}): Promise<{ customer: CustomerDoc; verifyToken: string }> {
  const email = input.email.toLowerCase().trim();
  const existing = await findCustomerByEmail(email);
  if (existing) {
    const error = new Error("An account with this email already exists") as Error & {
      code?: string;
    };
    error.code = "EMAIL_EXISTS";
    throw error;
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const verifyToken = generateToken();
  const customer = await createCustomer({
    email,
    name: input.name.trim(),
    mobile: input.mobile.trim(),
    passwordHash,
    emailVerified: false,
    verifyToken,
    verifyTokenExpiry: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
  });
  return { customer, verifyToken };
}

export async function authenticateCustomer(
  email: string,
  password: string
): Promise<CustomerDoc | null> {
  const customer = await findCustomerByEmail(email);
  if (!customer || !customer.active) return null;
  const ok = await bcrypt.compare(password, customer.passwordHash);
  if (!ok) return null;
  await updateCustomer(customer._id, { lastLoginAt: new Date().toISOString() });
  return customer;
}

export async function issueVerifyToken(customerId: string) {
  const token = generateToken();
  await updateCustomer(customerId, {
    verifyToken: token,
    verifyTokenExpiry: new Date(Date.now() + VERIFY_TTL_MS).toISOString(),
  });
  return token;
}

export async function issueResetToken(customerId: string) {
  const token = generateToken();
  await updateCustomer(customerId, {
    resetToken: token,
    resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS).toISOString(),
  });
  return token;
}

export function tokenExpired(expiry?: string | null) {
  if (!expiry) return true;
  return new Date(expiry).getTime() < Date.now();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
