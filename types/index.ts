export type OrderingMethod = "online" | "enquiry" | "both";

export type OrderPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refund_pending"
  | "refunded";

export type OrderFulfilmentStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface ProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  sourceUrl?: string;
  matchStatus?: "exact" | "review_required" | "not_found";
  verificationStatus?: "verified" | "unverified";
  usagePermission?: "confirmed" | "unknown" | "restricted";
}

export interface ProductDoc {
  _id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categorySlug: string;
  images: ProductImage[];
  price: number; // paise
  mrp?: number | null; // paise
  available: boolean;
  stockQty?: number | null;
  trackStock: boolean;
  featured: boolean;
  sku?: string;
  active: boolean;
  orderingMethod: OrderingMethod;
  requiresPrescription?: boolean;
  unit?: string;
  tags?: string[];
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDoc {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: ProductImage | null;
  sortOrder: number;
  active: boolean;
  orderingMethod: OrderingMethod;
  highlights?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryZoneDoc {
  _id: string;
  name: string;
  zoneCode: string;
  pincodes: string[];
  city?: string;
  locality?: string;
  deliveryCharge: number; // paise
  minOrderValue?: number | null; // paise
  freeDeliveryThreshold?: number | null; // paise
  etaText?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  quantity: number;
  lineTotal: number;
  image?: string;
  unit?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewDoc {
  _id: string;
  productId: string;
  productSlug: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  orderId?: string | null;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  name: string;
  mobile: string;
  address: string;
  area?: string;
  landmark?: string;
  pincode?: string;
  city?: string;
  state?: string;
  instructions?: string;
}

export interface DeliverySnapshot {
  zoneId: string | null;
  zoneName: string | null;
  zoneCode: string | null;
  deliveryCharge: number;
  freeDeliveryApplied: boolean;
  etaText?: string;
}

export interface OrderDoc {
  _id: string;
  orderId: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  customer: CustomerInfo;
  delivery: DeliverySnapshot;
  paymentStatus: OrderPaymentStatus;
  fulfilmentStatus: OrderFulfilmentStatus;
  paymentMethod: "razorpay" | "enquiry";
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  lookupToken: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
}

export interface PaymentRecordDoc {
  _id: string;
  orderId: string;
  internalOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "refunded";
  method?: string;
  signatureVerified: boolean;
  raw?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionDoc {
  _id: string;
  title: string;
  message: string;
  kind: "announcement" | "banner" | "feature";
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FAQDoc {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryDoc {
  _id: string;
  name: string;
  mobile: string;
  category?: string;
  items: string;
  location?: string;
  instructions?: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDoc {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: "owner" | "admin" | "staff";
  active: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettingsDoc {
  _id: string;
  announcementEnabled: boolean;
  announcementText: string;
  promoEnabled: boolean;
  promoText: string;
  promoConditions: string;
  whatsappNumber: string;
  contactEmail: string;
  supportHours: string;
  address: string;
  freeDeliveryNote: string;
  updatedAt: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface CartLineResolved extends CartLine {
  product: ProductDoc | null;
  error?: string;
  lineTotal: number;
}

export interface PricedCart {
  lines: CartLineResolved[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  couponError: string | null;
  deliveryCharge: number;
  total: number;
  issues: string[];
  zone: DeliveryZoneDoc | null;
  freeDeliveryApplied: boolean;
}
