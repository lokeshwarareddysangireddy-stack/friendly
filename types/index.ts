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

export interface AddressDoc {
  _id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  mobile?: string;
  isDefault: boolean;
}

export interface CustomerDoc {
  _id: string;
  email: string;
  name: string;
  mobile: string;
  passwordHash: string;
  emailVerified: boolean;
  verifyToken?: string | null;
  verifyTokenExpiry?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
  addresses: AddressDoc[];
  wishlist: string[];
  cart: CustomerCartLine[];
  active: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCartLine {
  productId: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  image?: string;
  unit?: string;
  quantity: number;
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewDoc {
  _id: string;
  productId: string;
  productSlug: string;
  productName: string;
  customerId?: string | null;
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

export type RiderStatus = "offline" | "online" | "busy";

export interface RiderDoc {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  passwordHash: string;
  vehicleType?: string;
  licensePlate?: string;
  active: boolean;
  status: RiderStatus;
  lastLocation?: GeoPoint | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  recordedAt: string;
}

export interface OrderTrackDoc {
  _id: string;
  orderId: string;
  riderId: string;
  points: GeoPoint[];
  updatedAt: string;
  createdAt: string;
}

export interface RiderAssignment {
  riderId: string;
  riderName: string;
  riderMobile: string;
  assignedAt: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
}

export interface OrderStatusEvent {
  status: string;
  at: string;
  by: "system" | "admin" | "rider";
  note?: string;
}

export type NotificationChannel = "email" | "whatsapp";
export type NotificationStatus = "sent" | "failed" | "skipped";

export interface NotificationLogDoc {
  _id: string;
  channel: NotificationChannel;
  event: string;
  orderId?: string | null;
  recipient: string;
  subject: string;
  preview: string;
  status: NotificationStatus;
  provider: string;
  providerMessageId?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterDoc {
  _id: string;
  email: string;
  source: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInfo {
  name: string;
  mobile: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
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
  customerId?: string | null;
  customerEmail?: string | null;
  assignment?: RiderAssignment | null;
  statusHistory?: OrderStatusEvent[];
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
  deliveryCharge: number;
  total: number;
  issues: string[];
  zone: DeliveryZoneDoc | null;
  freeDeliveryApplied: boolean;
}
