import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(paise: number, opts?: { withSymbol?: boolean }) {
  const withSymbol = opts?.withSymbol ?? true;
  const rupees = (paise || 0) / 100;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return withSymbol ? `\u20B9${formatted}` : formatted;
}

export function paiseToRupees(paise: number) {
  return Math.round(paise) / 100;
}

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function discountPercent(price: number, mrp?: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizePincode(input: string) {
  const digits = (input || "").replace(/\D/g, "");
  return digits.slice(0, 6);
}

export function isValidPincode(input: string) {
  return /^[1-9][0-9]{5}$/.test(input);
}

export function isValidIndianMobile(input: string) {
  const digits = (input || "").replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9][0-9]{9}$/.test(ten);
}

export function normalizeMobile(input: string) {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function formatDate(value: string | Date | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function shortId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function generateOrderId() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `FB-${y}${m}${d}-${shortId()}`;
}

export function truncate(value: string, length = 80) {
  if (value.length <= length) return value;
  return value.slice(0, length).trimEnd() + "\u2026";
}
