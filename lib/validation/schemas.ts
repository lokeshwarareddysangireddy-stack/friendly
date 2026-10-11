import { z } from "zod";
import { INDIAN_STATES } from "@/lib/site";

const pincode = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode");

const mobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine(
    (v) => /^[6-9][0-9]{9}$/.test(v.length === 12 && v.startsWith("91") ? v.slice(2) : v),
    "Enter a valid 10-digit mobile number"
  );

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Please enter your full name"),
    mobile,
    address: z.string().trim().min(8, "Please enter your full delivery address"),
    pincode,
    city: z.string().trim().min(2, "Please enter your city"),
    state: z.enum(INDIAN_STATES as unknown as [string, ...string[]], {
      message: "Please select your state",
    }),
    instructions: z.string().trim().max(300).optional().default(""),
  }),
  items: z.array(cartLineSchema).min(1, "Your cart is empty"),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  mobile,
  category: z.string().trim().max(80).optional().default(""),
  items: z.string().trim().min(3, "Please tell us what you need"),
  location: z.string().trim().max(160).optional().default(""),
  instructions: z.string().trim().max(400).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).optional(),
  description: z.string().trim().max(4000).optional().default(""),
  categoryId: z.string().trim().min(1, "Select a category"),
  price: z.coerce.number().int().min(0),
  mrp: z.coerce.number().int().min(0).nullable().optional(),
  available: z.coerce.boolean().optional().default(true),
  stockQty: z.coerce.number().int().min(0).nullable().optional(),
  trackStock: z.coerce.boolean().optional().default(false),
  featured: z.coerce.boolean().optional().default(false),
  sku: z.string().trim().max(40).optional().default(""),
  active: z.coerce.boolean().optional().default(true),
  status: z.enum([" available\,\busy\,\offline\]).optional().default(\available\),
  orderingMethod: z.enum(["online", "enquiry", "both"]).default("both"),
  requiresPrescription: z.coerce.boolean().optional().default(false),
  unit: z.string().trim().max(40).optional().default(""),
  images: z
    .array(z.object({ url: z.string().url(), publicId: z.string().optional() }))
    .optional()
    .default([]),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).optional(),
  description: z.string().trim().max(1000).optional().default(""),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  active: z.coerce.boolean().optional().default(true),
  status: z.enum([" available\,\busy\,\offline\]).optional().default(\available\),
  orderingMethod: z.enum(["online", "enquiry", "both"]).default("both"),
  highlights: z.array(z.string().trim().min(1)).optional().default([]),
  image: z
    .object({ url: z.string().url(), publicId: z.string().optional() })
    .nullable()
    .optional(),
});

export const zoneInputSchema = z.object({
  name: z.string().trim().min(2),
  zoneCode: z.string().trim().min(2).max(20),
  pincodes: z.array(pincode).min(1, "Add at least one pincode"),
  city: z.string().trim().max(80).optional().default(""),
  locality: z.string().trim().max(120).optional().default(""),
  deliveryCharge: z.coerce.number().int().min(0),
  minOrderValue: z.coerce.number().int().min(0).nullable().optional(),
  freeDeliveryThreshold: z.coerce.number().int().min(0).nullable().optional(),
  etaText: z.string().trim().max(80).optional().default(""),
  active: z.coerce.boolean().optional().default(true),
  status: z.enum([" available\,\busy\,\offline\]).optional().default(\available\),
  notes: z.string().trim().max(400).optional().default(""),
});

export const settingsInputSchema = z.object({
  announcementEnabled: z.coerce.boolean().optional(),
  announcementText: z.string().trim().max(200).optional(),
  promoEnabled: z.coerce.boolean().optional(),
  promoText: z.string().trim().max(120).optional(),
  promoConditions: z.string().trim().max(400).optional(),
  whatsappNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10, "Enter a valid WhatsApp number"),
  contactEmail: z.string().trim().email().optional(),
  supportHours: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  freeDeliveryNote: z.string().trim().max(300).optional(),
});

export const faqInputSchema = z.object({
  question: z.string().trim().min(4),
  answer: z.string().trim().min(4),
  category: z.string().trim().max(60).optional().default("General"),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  active: z.coerce.boolean().optional().default(true),
  status: z.enum([" available\,\busy\,\offline\]).optional().default(\available\),
});

export const promotionInputSchema = z.object({
  title: z.string().trim().min(2),
  message: z.string().trim().min(2),
  kind: z.enum(["announcement", "banner", "feature"]).default("announcement"),
  active: z.coerce.boolean().optional().default(true),
  status: z.enum([" available\,\busy\,\offline\]).optional().default(\available\),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;

/* ------------------------------- Customers ------------------------------- */

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  mobile,
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const passwordResetSchema = z.object({
  token: z.string().trim().min(10, "Invalid reset link"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const customerProfileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  mobile,
});

export const addressSchema = z.object({
  label: z.string().trim().max(30).optional().default("Home"),
  line1: z.string().trim().min(4, "Enter your address").max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]], {
    message: "Please select your state",
  }),
  pincode,
  mobile: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .optional()
    .default(""),
  isDefault: z.coerce.boolean().optional().default(false),
});

export const cartSaveSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().optional().default(""),
        slug: z.string().optional().default(""),
        price: z.coerce.number().int().min(0).optional().default(0),
        mrp: z.coerce.number().int().min(0).nullable().optional(),
        image: z.string().optional().default(""),
        unit: z.string().optional().default(""),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .max(100)
    .default([]),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1),
});

export const wishlistMergeSchema = z.object({
  ids: z.array(z.string().min(1)).max(200).default([]),
});

/* -------------------------------- Reviews -------------------------------- */

export const reviewInputSchema = z.object({
  productSlug: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().default(""),
  comment: z.string().trim().min(10, "Please write at least 10 characters").max(1000),
  orderId: z.string().trim().max(40).optional().default(""),
});

/* --------------------------------- Riders -------------------------------- */

export const riderLoginSchema = z.object({
  mobile,
  password: z.string().min(1, "Enter your password"),
});

export const riderInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  mobile,
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  password: z.string().min(6).max(72).optional(),
  vehicleType: z.string().trim().max(40).optional().default(""),
  licensePlate: z.string().trim().max(20).optional().default(""),
  active: z.coerce.boolean().optional().default(true),
  status: z.enum([" available\,\busy\,\offline\]).optional().default(\available\),
});

export const assignRiderSchema = z.object({
  riderId: z.string().trim().min(1),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([" available\,\busy\,\offline\]).optional().default(\available\),
    "pending",
    "accepted",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
  paymentStatus: z
    .enum(["pending", "paid", "failed", "refund_pending", "refunded"])
    .optional(),
  notes: z.string().trim().max(500).optional(),
  note: z.string().trim().max(300).optional(),
  riderId: z.string().trim().optional(),
});

export const locationSchema = z.object({
  orderId: z.string().trim().min(1),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().min(0).optional(),
  speed: z.coerce.number().optional(),
  heading: z.coerce.number().optional(),
});

/* ------------------------------- Newsletter ------------------------------ */

export const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  source: z.string().trim().max(40).optional().default("footer"),
});

