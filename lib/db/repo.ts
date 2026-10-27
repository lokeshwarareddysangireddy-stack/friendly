import { connectDb, isDbConfigured } from "./connect";
import { GROCERY_SLUG, GROCERY_TAGS, GROCERY_ALIASES, OTHER_GROCERY, groceryGroup } from "@/lib/grocery-categories";
import { getMemoryStore, newId, type WebhookEventRec } from "./memory";
import type {
  AdminUserDoc,
  CategoryDoc,
  DeliveryZoneDoc,
  EnquiryDoc,
  FAQDoc,
  OrderDoc,
  PaymentRecordDoc,
  ProductDoc,
  PromotionDoc,
  ReviewDoc,
  ReviewStatus,
  SiteSettingsDoc,
} from "@/types";
import {
  AdminUser,
  Category,
  DeliveryZone,
  Enquiry,
  FAQ,
  Order,
  PaymentRecord,
  Product,
  Promotion,
  Review,
  SiteSettings,
  WebhookEvent,
} from "@/models";

const NOW = () => new Date().toISOString();

function serialize<T>(doc: unknown): T {
  if (doc && typeof (doc as { toObject?: unknown }).toObject === "function") {
    doc = (doc as { toObject: () => unknown }).toObject();
  }
  const plain = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
  if (plain && plain._id != null) plain._id = String(plain._id);
  return plain as T;
}

function serializeMany<T>(docs: unknown[]): T[] {
  return docs.map((d) => serialize<T>(d));
}

/* ------------------------------- Products ------------------------------- */

// The same ordered tag rules power counts and product queries, without rewriting records.
function groceryGroupExpression() {
  const tags = { $ifNull: ["$tags", []] };
  return {
    $switch: {
      branches: [
        ...GROCERY_TAGS.map((tag) => ({ case: { $in: [tag, tags] }, then: tag })),
        ...Object.entries(GROCERY_ALIASES).map(([tag, aliases]) => ({
          case: { $gt: [{ $size: { $setIntersection: [tags, aliases] } }, 0] }, then: tag,
        })),
      ],
      default: OTHER_GROCERY.tag,
    },
  };
}

export async function getGroceryCounts(): Promise<{ tag: string; stored: number; active: number }[]> {
  if (isDbConfigured()) {
    await connectDb();
    const rows = await Product.aggregate([
      { $match: { categorySlug: GROCERY_SLUG } },
      { $group: { _id: groceryGroupExpression(), stored: { $sum: 1 }, active: { $sum: { $cond: ["$active", 1, 0] } } } },
    ]);
    return rows.map((row) => ({ tag: String(row._id), stored: row.stored, active: row.active }));
  }
  const counts = new Map<string, { tag: string; stored: number; active: number }>();
  for (const product of getMemoryStore().products) {
    if (product.categorySlug !== GROCERY_SLUG) continue;
    const tag = groceryGroup(product.tags);
    const count = counts.get(tag) || { tag, stored: 0, active: 0 };
    count.stored++;
    if (product.active) count.active++;
    counts.set(tag, count);
  }
  return [...counts.values()];
}

export interface ProductQuery {
  groceryGroup?: string;
  categorySlug?: string;
  q?: string;
  featured?: boolean;
  active?: boolean;
  orderingOnline?: boolean;
  ids?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "newest" | "name";
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

function sortMemoryProducts(items: ProductDoc[], sort?: ProductQuery["sort"]) {
  const arr = [...items];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => b.price - a.price);
    case "newest":
      return arr.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return arr.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.name.localeCompare(b.name)
      );
  }
}

function matchesQuery(p: ProductDoc, q: string) {
  const needle = q.toLowerCase();
  return (
    p.name.toLowerCase().includes(needle) ||
    p.description.toLowerCase().includes(needle) ||
    (p.tags || []).some((t) => t.toLowerCase().includes(needle))
  );
}

export async function listProducts(
  query: ProductQuery = {}
): Promise<{ items: ProductDoc[]; total: number }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 24));

  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (!query.includeInactive) filter.active = query.active ?? true;
    else if (query.active !== undefined) filter.active = query.active;
    if (query.categorySlug) filter.categorySlug = query.categorySlug;
    if (query.groceryGroup) {
      filter.categorySlug = GROCERY_SLUG;
      filter.$expr = { $eq: [groceryGroupExpression(), query.groceryGroup] };
    }
    if (query.featured !== undefined) filter.featured = query.featured;
    if (query.orderingOnline) filter.orderingMethod = { $in: ["online", "both"] };
    if (query.ids && query.ids.length) filter._id = { $in: query.ids };
    if (query.tags && query.tags.length) filter.tags = { $in: query.tags };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const price: Record<string, number> = {};
      if (query.minPrice !== undefined) price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) price.$lte = query.maxPrice;
      filter.price = price;
    }
    if (query.q) {
      const rx = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
    }
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      featured: { featured: -1, sortOrder: 1, name: 1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      newest: { createdAt: -1 },
      name: { name: 1 },
    };
    const sort = { ...(sortMap[query.sort || "featured"] || sortMap.featured), _id: 1 as const };
    const [docs, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return { items: serializeMany<ProductDoc>(docs), total };
  }

  const store = getMemoryStore();
  let items = store.products.filter((p) =>
    query.includeInactive ? true : p.active
  );
  if (query.active !== undefined) items = items.filter((p) => p.active === query.active);
  if (query.categorySlug) items = items.filter((p) => p.categorySlug === query.categorySlug);
  if (query.groceryGroup) items = items.filter((p) => p.categorySlug === GROCERY_SLUG && groceryGroup(p.tags) === query.groceryGroup);
  if (query.featured !== undefined) items = items.filter((p) => p.featured === query.featured);
  if (query.orderingOnline)
    items = items.filter((p) => p.orderingMethod === "online" || p.orderingMethod === "both");
  if (query.ids && query.ids.length) items = items.filter((p) => query.ids!.includes(p._id));
  if (query.tags && query.tags.length)
    items = items.filter((p) => (p.tags || []).some((t) => query.tags!.includes(t)));
  if (query.minPrice !== undefined) items = items.filter((p) => p.price >= query.minPrice!);
  if (query.maxPrice !== undefined) items = items.filter((p) => p.price <= query.maxPrice!);
  if (query.q) items = items.filter((p) => matchesQuery(p, query.q!));
  const total = items.length;
  const sorted = sortMemoryProducts(items, query.sort);
  return { items: sorted.slice((page - 1) * limit, page * limit), total };
}

export interface ProductFacets {
  tags: { value: string; count: number }[];
  priceMin: number;
  priceMax: number;
}

export async function getProductFacets(
  categorySlug?: string
): Promise<ProductFacets> {
  if (isDbConfigured()) {
    await connectDb();
    const match: Record<string, unknown> = { active: true };
    if (categorySlug) match.categorySlug = categorySlug;
    const rows = await Product.aggregate<{
      tags: { _id: string; count: number }[];
      price: { min: number; max: number }[];
    }>([
      { $match: match },
      {
        $facet: {
          tags: [
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 24 },
          ],
          price: [
            { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
          ],
        },
      },
    ]);
    const facet = rows[0];
    return {
      tags: (facet?.tags || []).map((t) => ({ value: t._id, count: t.count })),
      priceMin: facet?.price?.[0]?.min ?? 0,
      priceMax: facet?.price?.[0]?.max ?? 0,
    };
  }

  const store = getMemoryStore();
  const items = store.products.filter(
    (p) => p.active && (!categorySlug || p.categorySlug === categorySlug)
  );
  const counts = new Map<string, number>();
  let min = Infinity;
  let max = 0;
  for (const p of items) {
    for (const t of p.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
  }
  return {
    tags: [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    priceMin: Number.isFinite(min) ? min : 0,
    priceMax: max,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Product.findOne({ slug }).lean();
    return doc ? serialize<ProductDoc>(doc) : null;
  }
  return getMemoryStore().products.find((p) => p.slug === slug) || null;
}

export async function getProductById(id: string): Promise<ProductDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    if (!id.match(/^[a-f0-9]{24}$/i)) return null;
    const doc = await Product.findById(id).lean();
    return doc ? serialize<ProductDoc>(doc) : null;
  }
  return getMemoryStore().products.find((p) => p._id === id) || null;
}

export async function getProductsByIds(ids: string[]): Promise<ProductDoc[]> {
  if (!ids.length) return [];
  const { items } = await listProducts({ ids, includeInactive: true, limit: 100 });
  return items;
}

export async function relatedProducts(
  product: ProductDoc,
  limit = 4
): Promise<ProductDoc[]> {
  const { items } = await listProducts({
    categorySlug: product.categorySlug,
    limit: limit + 1,
    sort: "featured",
  });
  return items.filter((p) => p._id !== product._id).slice(0, limit);
}

export async function createProduct(
  data: Partial<ProductDoc>
): Promise<ProductDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Product.create(data);
    return serialize<ProductDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: ProductDoc = {
    _id: newId("prod"),
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    categoryId: data.categoryId || "",
    categorySlug: data.categorySlug || "",
    images: data.images || [],
    price: data.price || 0,
    mrp: data.mrp ?? null,
    available: data.available ?? true,
    stockQty: data.stockQty ?? null,
    trackStock: data.trackStock ?? false,
    featured: data.featured ?? false,
    sku: data.sku || "",
    active: data.active ?? true,
    orderingMethod: data.orderingMethod || "both",
    requiresPrescription: data.requiresPrescription ?? false,
    unit: data.unit || "",
    tags: data.tags || [],
    sortOrder: data.sortOrder ?? store.products.length + 1,
    createdAt: now,
    updatedAt: now,
  };
  store.products.push(doc);
  return doc;
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductDoc>
): Promise<ProductDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Product.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<ProductDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.products.findIndex((p) => p._id === id);
  if (idx < 0) return null;
  store.products[idx] = { ...store.products[idx], ...patch, updatedAt: NOW() };
  return store.products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await connectDb();
    const res = await Product.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getMemoryStore();
  const before = store.products.length;
  store.products = store.products.filter((p) => p._id !== id);
  return store.products.length < before;
}

/* ------------------------------ Categories ------------------------------ */

export async function listCategories(
  opts: { active?: boolean; includeInactive?: boolean; status?: string; page?: number; limit?: number } = {}
): Promise<CategoryDoc[]> {
  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (!opts.includeInactive) filter.active = opts.active ?? true;
    const docs = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    return serializeMany<CategoryDoc>(docs);
  }
  const store = getMemoryStore();
  let items = [...store.categories];
  if (opts.active !== undefined) items = items.filter((c) => c.active === opts.active);
  else if (!opts.includeInactive) items = items.filter((c) => c.active);
  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Category.findOne({ slug }).lean();
    return doc ? serialize<CategoryDoc>(doc) : null;
  }
  return getMemoryStore().categories.find((c) => c.slug === slug) || null;
}

export async function getCategoryById(id: string): Promise<CategoryDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    if (!id.match(/^[a-f0-9]{24}$/i)) return null;
    const doc = await Category.findById(id).lean();
    return doc ? serialize<CategoryDoc>(doc) : null;
  }
  return getMemoryStore().categories.find((c) => c._id === id) || null;
}

export async function createCategory(
  data: Partial<CategoryDoc>
): Promise<CategoryDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Category.create(data);
    return serialize<CategoryDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: CategoryDoc = {
    _id: newId("cat"),
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    image: data.image ?? null,
    sortOrder: data.sortOrder ?? store.categories.length + 1,
    active: data.active ?? true,
    orderingMethod: data.orderingMethod || "both",
    highlights: data.highlights || [],
    createdAt: now,
    updatedAt: now,
  };
  store.categories.push(doc);
  return doc;
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryDoc>
): Promise<CategoryDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Category.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<CategoryDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.categories.findIndex((c) => c._id === id);
  if (idx < 0) return null;
  store.categories[idx] = { ...store.categories[idx], ...patch, updatedAt: NOW() };
  return store.categories[idx];
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await connectDb();
    const res = await Category.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getMemoryStore();
  const before = store.categories.length;
  store.categories = store.categories.filter((c) => c._id !== id);
  return store.categories.length < before;
}

/* ---------------------------- Delivery zones ---------------------------- */

export async function listZones(
  opts: { active?: boolean; includeInactive?: boolean; status?: string; page?: number; limit?: number } = {}
): Promise<DeliveryZoneDoc[]> {
  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (!opts.includeInactive) filter.active = opts.active ?? true;
    const docs = await DeliveryZone.find(filter).sort({ name: 1 }).lean();
    return serializeMany<DeliveryZoneDoc>(docs);
  }
  const store = getMemoryStore();
  let items = [...store.zones];
  if (opts.active !== undefined) items = items.filter((z) => z.active === opts.active);
  else if (!opts.includeInactive) items = items.filter((z) => z.active);
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getZoneById(id: string): Promise<DeliveryZoneDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    if (!id.match(/^[a-f0-9]{24}$/i)) return null;
    const doc = await DeliveryZone.findById(id).lean();
    return doc ? serialize<DeliveryZoneDoc>(doc) : null;
  }
  return getMemoryStore().zones.find((z) => z._id === id) || null;
}

export async function findZoneByPincode(
  pincode: string
): Promise<DeliveryZoneDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await DeliveryZone.findOne({
      active: true,
      pincodes: pincode,
    }).lean();
    return doc ? serialize<DeliveryZoneDoc>(doc) : null;
  }
  const matches = getMemoryStore().zones.filter(
    (z) => z.active && z.pincodes.includes(pincode)
  );
  if (matches.length > 1) {
    console.warn(
      `[delivery] pincode ${pincode} matches ${matches.length} active zones; using first`
    );
  }
  return matches[0] || null;
}

export async function findZonesByPincodes(
  pincodes: string[]
): Promise<DeliveryZoneDoc[]> {
  if (isDbConfigured()) {
    await connectDb();
    const docs = await DeliveryZone.find({ pincodes: { $in: pincodes } }).lean();
    return serializeMany<DeliveryZoneDoc>(docs);
  }
  return getMemoryStore().zones.filter((z) =>
    z.pincodes.some((p) => pincodes.includes(p))
  );
}

export async function createZone(
  data: Partial<DeliveryZoneDoc>
): Promise<DeliveryZoneDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await DeliveryZone.create(data);
    return serialize<DeliveryZoneDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: DeliveryZoneDoc = {
    _id: newId("zone"),
    name: data.name || "",
    zoneCode: (data.zoneCode || "").toUpperCase(),
    pincodes: data.pincodes || [],
    city: data.city || "",
    locality: data.locality || "",
    deliveryCharge: data.deliveryCharge ?? 0,
    minOrderValue: data.minOrderValue ?? null,
    freeDeliveryThreshold: data.freeDeliveryThreshold ?? null,
    etaText: data.etaText || "",
    active: data.active ?? true,
    notes: data.notes || "",
    createdAt: now,
    updatedAt: now,
  };
  store.zones.push(doc);
  return doc;
}

export async function updateZone(
  id: string,
  patch: Partial<DeliveryZoneDoc>
): Promise<DeliveryZoneDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await DeliveryZone.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<DeliveryZoneDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.zones.findIndex((z) => z._id === id);
  if (idx < 0) return null;
  store.zones[idx] = { ...store.zones[idx], ...patch, updatedAt: NOW() };
  return store.zones[idx];
}

export async function deleteZone(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await connectDb();
    const res = await DeliveryZone.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getMemoryStore();
  const before = store.zones.length;
  store.zones = store.zones.filter((z) => z._id !== id);
  return store.zones.length < before;
}

/* -------------------------------- Orders -------------------------------- */

export async function createOrder(data: Partial<OrderDoc>): Promise<OrderDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Order.create(data);
    return serialize<OrderDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: OrderDoc = {
    _id: newId("order"),
    orderId: data.orderId || "",
    items: data.items || [],
    subtotal: data.subtotal || 0,
    discount: data.discount || 0,
    deliveryCharge: data.deliveryCharge || 0,
    total: data.total || 0,
    customer: data.customer!,
    delivery: data.delivery!,
    paymentStatus: data.paymentStatus || "pending",
    fulfilmentStatus: data.fulfilmentStatus || "pending",
    paymentMethod: data.paymentMethod || "razorpay",
    razorpayOrderId: data.razorpayOrderId ?? null,
    razorpayPaymentId: data.razorpayPaymentId ?? null,
    razorpaySignature: data.razorpaySignature ?? null,
    lookupToken: data.lookupToken || "",
    notes: data.notes || "",
    paidAt: data.paidAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.orders.unshift(doc);
  return doc;
}

export async function getOrderByOrderId(
  orderId: string
): Promise<OrderDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Order.findOne({ orderId }).lean();
    return doc ? serialize<OrderDoc>(doc) : null;
  }
  return getMemoryStore().orders.find((o) => o.orderId === orderId) || null;
}

export async function getOrderById(id: string): Promise<OrderDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    if (!id.match(/^[a-f0-9]{24}$/i)) return null;
    const doc = await Order.findById(id).lean();
    return doc ? serialize<OrderDoc>(doc) : null;
  }
  return getMemoryStore().orders.find((o) => o._id === id) || null;
}

export async function updateOrderByOrderId(
  orderId: string,
  patch: Partial<OrderDoc>
): Promise<OrderDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Order.findOneAndUpdate({ orderId }, patch, { new: true }).lean();
    return doc ? serialize<OrderDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.orders.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return null;
  store.orders[idx] = { ...store.orders[idx], ...patch, updatedAt: NOW() };
  return store.orders[idx];
}

export interface OrderQuery {
  q?: string;
  paymentStatus?: string;
  fulfilmentStatus?: string;
  zoneId?: string;
  page?: number;
  limit?: number;
}

export async function listOrders(
  query: OrderQuery = {}
): Promise<{ items: OrderDoc[]; total: number }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));

  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.fulfilmentStatus) filter.fulfilmentStatus = query.fulfilmentStatus;
    if (query.zoneId) filter["delivery.zoneId"] = query.zoneId;
    if (query.q) {
      const rx = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ orderId: rx }, { "customer.name": rx }, { "customer.mobile": rx }];
    }
    const [docs, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    return { items: serializeMany<OrderDoc>(docs), total };
  }

  const store = getMemoryStore();
  let items = [...store.orders];
  if (query.paymentStatus) items = items.filter((o) => o.paymentStatus === query.paymentStatus);
  if (query.fulfilmentStatus)
    items = items.filter((o) => o.fulfilmentStatus === query.fulfilmentStatus);
  if (query.zoneId) items = items.filter((o) => o.delivery.zoneId === query.zoneId);
  if (query.q) {
    const needle = query.q.toLowerCase();
    items = items.filter(
      (o) =>
        o.orderId.toLowerCase().includes(needle) ||
        o.customer.name.toLowerCase().includes(needle) ||
        o.customer.mobile.includes(needle)
    );
  }
  const total = items.length;
  return { items: items.slice((page - 1) * limit, page * limit), total };
}

export async function countOrders(filter: Partial<Record<string, unknown>> = {}) {
  if (isDbConfigured()) {
    await connectDb();
    return Order.countDocuments(filter);
  }
  const store = getMemoryStore();
  return store.orders.filter((o) => {
    return Object.entries(filter).every(([k, v]) => (o as never)[k as never] === v);
  }).length;
}

/* ----------------------------- Payment records --------------------------- */

export async function createPaymentRecord(
  data: Partial<PaymentRecordDoc>
): Promise<PaymentRecordDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await PaymentRecord.create(data);
    return serialize<PaymentRecordDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: PaymentRecordDoc = {
    _id: newId("pay"),
    orderId: data.orderId || "",
    internalOrderId: data.internalOrderId || "",
    razorpayOrderId: data.razorpayOrderId || "",
    razorpayPaymentId: data.razorpayPaymentId ?? null,
    amount: data.amount || 0,
    currency: data.currency || "INR",
    status: data.status || "created",
    method: data.method || "",
    signatureVerified: data.signatureVerified || false,
    raw: data.raw || {},
    createdAt: now,
    updatedAt: now,
  };
  store.payments.push(doc);
  return doc;
}

export async function updatePaymentRecord(
  razorpayOrderId: string,
  patch: Partial<PaymentRecordDoc>
): Promise<PaymentRecordDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await PaymentRecord.findOneAndUpdate({ razorpayOrderId }, patch, {
      new: true,
    }).lean();
    return doc ? serialize<PaymentRecordDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.payments.findIndex((p) => p.razorpayOrderId === razorpayOrderId);
  if (idx < 0) return null;
  store.payments[idx] = { ...store.payments[idx], ...patch, updatedAt: NOW() };
  return store.payments[idx];
}

export async function getPaymentByRazorpayOrderId(
  razorpayOrderId: string
): Promise<PaymentRecordDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await PaymentRecord.findOne({ razorpayOrderId }).lean();
    return doc ? serialize<PaymentRecordDoc>(doc) : null;
  }
  return (
    getMemoryStore().payments.find((p) => p.razorpayOrderId === razorpayOrderId) || null
  );
}

/* ------------------------------ Promotions ------------------------------- */

export async function listPromotions(
  opts: { active?: boolean } = {}
): Promise<PromotionDoc[]> {
  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (opts.active) filter.active = true;
    const docs = await Promotion.find(filter).sort({ sortOrder: 1 }).lean();
    return serializeMany<PromotionDoc>(docs);
  }
  const store = getMemoryStore();
  let items = [...store.promotions];
  if (opts.active) items = items.filter((p) => p.active);
  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createPromotion(
  data: Partial<PromotionDoc>
): Promise<PromotionDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Promotion.create(data);
    return serialize<PromotionDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: PromotionDoc = {
    _id: newId("promo"),
    title: data.title || "",
    message: data.message || "",
    kind: data.kind || "announcement",
    active: data.active ?? true,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
    sortOrder: data.sortOrder ?? store.promotions.length + 1,
    createdAt: now,
    updatedAt: now,
  };
  store.promotions.push(doc);
  return doc;
}

export async function updatePromotion(
  id: string,
  patch: Partial<PromotionDoc>
): Promise<PromotionDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Promotion.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<PromotionDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.promotions.findIndex((p) => p._id === id);
  if (idx < 0) return null;
  store.promotions[idx] = { ...store.promotions[idx], ...patch, updatedAt: NOW() };
  return store.promotions[idx];
}

export async function deletePromotion(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await connectDb();
    const res = await Promotion.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getMemoryStore();
  const before = store.promotions.length;
  store.promotions = store.promotions.filter((p) => p._id !== id);
  return store.promotions.length < before;
}

/* --------------------------------- FAQs ---------------------------------- */

export async function listFaqs(
  opts: { active?: boolean; limit?: number } = {}
): Promise<FAQDoc[]> {
  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (opts.active) filter.active = true;
    let q = FAQ.find(filter).sort({ sortOrder: 1 }).lean();
    if (opts.limit) q = q.limit(Math.min(100, opts.limit));
    const docs = await q;
    return serializeMany<FAQDoc>(docs);
  }
  const store = getMemoryStore();
  let items = [...store.faqs];
  if (opts.active) items = items.filter((f) => f.active);
  items = items.sort((a, b) => a.sortOrder - b.sortOrder);
  if (opts.limit) items = items.slice(0, Math.min(100, opts.limit));
  return items;
}

export async function createFaq(data: Partial<FAQDoc>): Promise<FAQDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await FAQ.create(data);
    return serialize<FAQDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: FAQDoc = {
    _id: newId("faq"),
    question: data.question || "",
    answer: data.answer || "",
    category: data.category || "General",
    sortOrder: data.sortOrder ?? store.faqs.length + 1,
    active: data.active ?? true,
    createdAt: now,
    updatedAt: now,
  };
  store.faqs.push(doc);
  return doc;
}

export async function updateFaq(
  id: string,
  patch: Partial<FAQDoc>
): Promise<FAQDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await FAQ.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<FAQDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.faqs.findIndex((f) => f._id === id);
  if (idx < 0) return null;
  store.faqs[idx] = { ...store.faqs[idx], ...patch, updatedAt: NOW() };
  return store.faqs[idx];
}

export async function deleteFaq(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await connectDb();
    const res = await FAQ.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getMemoryStore();
  const before = store.faqs.length;
  store.faqs = store.faqs.filter((f) => f._id !== id);
  return store.faqs.length < before;
}

/* ------------------------------- Enquiries ------------------------------- */

export async function createEnquiry(
  data: Partial<EnquiryDoc>
): Promise<EnquiryDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Enquiry.create(data);
    return serialize<EnquiryDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: EnquiryDoc = {
    _id: newId("enq"),
    name: data.name || "",
    mobile: data.mobile || "",
    category: data.category || "",
    items: data.items || "",
    location: data.location || "",
    instructions: data.instructions || "",
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  store.enquiries.unshift(doc);
  return doc;
}

export async function listEnquiries(
  opts: { status?: string } = {}
): Promise<EnquiryDoc[]> {
  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (opts.status) filter.status = opts.status;
    const docs = await Enquiry.find(filter).sort({ createdAt: -1 }).lean();
    return serializeMany<EnquiryDoc>(docs);
  }
  const store = getMemoryStore();
  let items = [...store.enquiries];
  if (opts.status) items = items.filter((e) => e.status === opts.status);
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateEnquiry(
  id: string,
  patch: Partial<EnquiryDoc>
): Promise<EnquiryDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Enquiry.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<EnquiryDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.enquiries.findIndex((e) => e._id === id);
  if (idx < 0) return null;
  store.enquiries[idx] = { ...store.enquiries[idx], ...patch, updatedAt: NOW() };
  return store.enquiries[idx];
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await connectDb();
    const res = await Enquiry.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getMemoryStore();
  const before = store.enquiries.length;
  store.enquiries = store.enquiries.filter((e) => e._id !== id);
  return store.enquiries.length < before;
}

/* ------------------------------ Site settings ---------------------------- */

export async function getSettings(): Promise<SiteSettingsDoc> {
  if (isDbConfigured()) {
    await connectDb();
    let doc = await SiteSettings.findOne().lean();
    if (!doc) {
      const created = await SiteSettings.create({});
      doc = created.toObject();
    }
    return serialize<SiteSettingsDoc>(doc);
  }
  return getMemoryStore().settings[0];
}

export async function updateSettings(
  patch: Partial<SiteSettingsDoc>
): Promise<SiteSettingsDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await SiteSettings.findOneAndUpdate({}, patch, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();
    return serialize<SiteSettingsDoc>(doc);
  }
  const store = getMemoryStore();
  store.settings[0] = { ...store.settings[0], ...patch, updatedAt: NOW() };
  return store.settings[0];
}

/* ------------------------------ Admin users ------------------------------ */

export async function findAdminByEmail(
  email: string
): Promise<AdminUserDoc | null> {
  const normalized = email.toLowerCase().trim();
  if (isDbConfigured()) {
    await connectDb();
    const doc = await AdminUser.findOne({ email: normalized }).lean();
    return doc ? serialize<AdminUserDoc>(doc) : null;
  }
  return (
    getMemoryStore().admins.find((a) => a.email === normalized) || null
  );
}

export async function countAdmins(): Promise<number> {
  if (isDbConfigured()) {
    await connectDb();
    return AdminUser.countDocuments({});
  }
  return getMemoryStore().admins.length;
}

export async function createAdmin(
  data: Partial<AdminUserDoc>
): Promise<AdminUserDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await AdminUser.create(data);
    return serialize<AdminUserDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: AdminUserDoc = {
    _id: newId("admin"),
    email: (data.email || "").toLowerCase(),
    name: data.name || "",
    passwordHash: data.passwordHash || "",
    role: data.role || "admin",
    active: data.active ?? true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };
  store.admins.push(doc);
  return doc;
}

export async function updateAdmin(
  id: string,
  patch: Partial<AdminUserDoc>
): Promise<AdminUserDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await AdminUser.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<AdminUserDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.admins.findIndex((a) => a._id === id);
  if (idx < 0) return null;
  store.admins[idx] = { ...store.admins[idx], ...patch, updatedAt: NOW() };
  return store.admins[idx];
}

/* ---------------------------- Webhook events ----------------------------- */

export async function recordWebhookEvent(
  eventId: string,
  type: string,
  payload: unknown
): Promise<{ created: boolean }> {
  if (isDbConfigured()) {
    await connectDb();
    try {
      await WebhookEvent.create({ eventId, type, payload });
      return { created: true };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return { created: false };
      throw error;
    }
  }
  const store = getMemoryStore();
  if (store.webhookEvents.some((e) => e.eventId === eventId)) {
    return { created: false };
  }
  store.webhookEvents.push({
    _id: newId("wh"),
    eventId,
    type,
    payload,
    processedAt: NOW(),
  } as WebhookEventRec);
  return { created: true };
}

/* -------------------------------- Customers ------------------------------ */

/* --------------------------------- Reviews -------------------------------- */

export async function createReview(
  data: Partial<ReviewDoc>
): Promise<ReviewDoc> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Review.create(data);
    return serialize<ReviewDoc>(doc);
  }
  const store = getMemoryStore();
  const now = NOW();
  const doc: ReviewDoc = {
    _id: newId("rev"),
    productId: data.productId || "",
    productSlug: data.productSlug || "",
    productName: data.productName || "",
    customerName: data.customerName || "",
    customerEmail: data.customerEmail || "",
    rating: data.rating || 5,
    title: data.title || "",
    comment: data.comment || "",
    orderId: data.orderId ?? null,
    verifiedPurchase: data.verifiedPurchase ?? false,
    status: data.status || "pending",
    createdAt: now,
    updatedAt: now,
  };
  store.reviews.unshift(doc);
  return doc;
}

export async function getReviewById(id: string): Promise<ReviewDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    if (!id.match(/^[a-f0-9]{24}$/i)) return null;
    const doc = await Review.findById(id).lean();
    return doc ? serialize<ReviewDoc>(doc) : null;
  }
  return getMemoryStore().reviews.find((r) => r._id === id) || null;
}

export async function updateReview(
  id: string,
  patch: Partial<ReviewDoc>
): Promise<ReviewDoc | null> {
  if (isDbConfigured()) {
    await connectDb();
    const doc = await Review.findByIdAndUpdate(id, patch, { new: true }).lean();
    return doc ? serialize<ReviewDoc>(doc) : null;
  }
  const store = getMemoryStore();
  const idx = store.reviews.findIndex((r) => r._id === id);
  if (idx < 0) return null;
  store.reviews[idx] = { ...store.reviews[idx], ...patch, updatedAt: NOW() };
  return store.reviews[idx];
}

export async function deleteReview(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    await connectDb();
    const res = await Review.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getMemoryStore();
  const before = store.reviews.length;
  store.reviews = store.reviews.filter((r) => r._id !== id);
  return store.reviews.length < before;
}

export async function listReviews(
  query: {
    status?: ReviewStatus;
    productSlug?: string;
    approved?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ items: ReviewDoc[]; total: number }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  if (isDbConfigured()) {
    await connectDb();
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    else if (query.approved) filter.status = "approved";
    if (query.productSlug) filter.productSlug = query.productSlug;
    const [docs, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);
    return { items: serializeMany<ReviewDoc>(docs), total };
  }
  const store = getMemoryStore();
  let items = [...store.reviews];
  if (query.status) items = items.filter((r) => r.status === query.status);
  else if (query.approved) items = items.filter((r) => r.status === "approved");
  if (query.productSlug) items = items.filter((r) => r.productSlug === query.productSlug);
  const total = items.length;
  return { items: items.slice((page - 1) * limit, page * limit), total };
}

export async function getRatingSummary(
  productSlug: string
): Promise<{ average: number; count: number }> {
  const { items } = await listReviews({ productSlug, approved: true, limit: 100 });
  if (!items.length) return { average: 0, count: 0 };
  const sum = items.reduce((acc, r) => acc + r.rating, 0);
  return {
    average: Math.round((sum / items.length) * 10) / 10,
    count: items.length,
  };
}

export { isDbConfigured };
