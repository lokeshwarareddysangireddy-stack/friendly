import { z } from "zod";

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
    area: z.string().trim().min(2, "Please enter your area"),
    landmark: z.string().trim().max(120).optional().default(""),
    instructions: z.string().trim().max(300).optional().default(""),
    // Legacy fields accepted for backward compatibility; the checkout form no longer collects them.
    pincode: pincode.optional(),
    city: z.string().trim().min(2).optional(),
    state: z.string().trim().min(2).optional(),
  }),
  items: z.array(cartLineSchema).min(1, "Your cart is empty"),
  couponCode: z.string().trim().max(40).optional().default(""),
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
  tags: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
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
});

export const promotionInputSchema = z.object({
  title: z.string().trim().min(2),
  message: z.string().trim().min(2),
  kind: z.enum(["announcement", "banner", "feature"]).default("announcement"),
  active: z.coerce.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

/* -------------------------------- Reviews -------------------------------- */

export const reviewInputSchema = z.object({
  productSlug: z.string().trim().min(1),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().default(""),
  comment: z.string().trim().min(10, "Please write at least 10 characters").max(1000),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
