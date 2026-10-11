import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { revalidatePublicContent } from "@/lib/admin/revalidate";
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
  SiteSettingsDoc,
} from "@/types";
import {
  SEED_CATEGORIES,
  SEED_FAQS,
  SEED_PRODUCTS,
  SEED_PROMOTIONS,
  SEED_SETTINGS,
  SEED_ZONES,
} from "./seed-data";

export interface WebhookEventRec {
  _id: string;
  eventId: string;
  type: string;
  payload: unknown;
  processedAt: string;
}

export interface MemoryStore {
  products: ProductDoc[];
  categories: CategoryDoc[];
  zones: DeliveryZoneDoc[];
  orders: OrderDoc[];
  payments: PaymentRecordDoc[];
  promotions: PromotionDoc[];
  faqs: FAQDoc[];
  enquiries: EnquiryDoc[];
  admins: AdminUserDoc[];
  settings: SiteSettingsDoc[];
  webhookEvents: WebhookEventRec[];
  reviews: ReviewDoc[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function newId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${rand}`;
}

/* --------------------------- Disk persistence ---------------------------- */
/* Without MONGODB_URI the app runs on this in-memory store. We mirror it to a
   JSON file so admin changes survive a server restart. */

const SEED_VERSION = 1;
const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

interface PersistedFile {
  seedVersion: number;
  seedIds: Record<string, string[]>;
  store: MemoryStore;
}

function readPersisted(): PersistedFile | null {
  try {
    if (!fs.existsSync(STORE_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as PersistedFile;
    if (!parsed || typeof parsed !== "object" || !parsed.store) return null;
    return parsed;
  } catch (error) {
    console.warn("[memory] could not read .data/store.json:", (error as Error).message);
    return null;
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistInFlight = false;

function persistNow() {
  if (persistInFlight) {
    schedulePersist();
    return;
  }
  persistInFlight = true;
  try {
    const store = getMemoryStore() as MemoryStore;
    const payload: PersistedFile = {
      seedVersion: SEED_VERSION,
      seedIds: {
        products: SEED_PRODUCTS.map((p) => p._id),
        categories: SEED_CATEGORIES.map((c) => c._id),
        zones: SEED_ZONES.map((z) => z._id),
        promotions: SEED_PROMOTIONS.map((p) => p._id),
        faqs: SEED_FAQS.map((f) => f._id),
      },
      store,
    };
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(payload));
    fs.renameSync(tmp, STORE_FILE);
  } catch (error) {
    console.warn("[memory] could not persist store:", (error as Error).message);
  } finally {
    persistInFlight = false;
  }
}

function schedulePersist() {
  if (typeof window !== "undefined") return;
  // Homepage / navbar are prerendered; invalidate them the moment data changes.
  try {
    revalidatePublicContent();
  } catch {
    /* outside a request scope — file write below still happens */
  }
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, 150);
}

/* ------------------------------ Tracking --------------------------------- */

const MUTATING_ARRAY_METHODS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
]);

function trackedArray<T>(items: T[]): T[] {
  return new Proxy(items, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const result = Reflect.apply(value as (...a: unknown[]) => unknown, target, args);
          if (MUTATING_ARRAY_METHODS.has(String(prop))) schedulePersist();
          return result;
        };
      }
      return value;
    },
    set(target, prop, value, receiver) {
      const ok = Reflect.set(target, prop, value, receiver);
      schedulePersist();
      return ok;
    },
  });
}

function trackedStore(store: MemoryStore): MemoryStore {
  const collections = [
    "products",
    "categories",
    "zones",
    "orders",
    "payments",
    "promotions",
    "faqs",
    "enquiries",
    "admins",
    "settings",
    "webhookEvents",
    "reviews",
  ] as const;

  const target = { ...store } as Record<string, unknown>;
  for (const key of collections) {
    target[key] = trackedArray(store[key] as unknown[]);
  }

  return new Proxy(target as unknown as MemoryStore, {
    set(t, prop, value) {
      const next = Reflect.set(t, prop, value);
      schedulePersist();
      return next;
    },
  });
}

/* ------------------------------- Seeding --------------------------------- */

function seedStore(): MemoryStore {
  const now = new Date().toISOString();
  const email = (process.env.ADMIN_EMAIL || "admin@friendlybasket.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "FriendlyBasket@2026";
  const admins: AdminUserDoc[] = [
    {
      _id: "admin_default",
      email,
      name: process.env.ADMIN_NAME || "Friendly Basket Admin",
      passwordHash: bcrypt.hashSync(password, 10),
      role: "owner",
      active: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    products: clone(SEED_PRODUCTS),
    categories: clone(SEED_CATEGORIES),
    zones: clone(SEED_ZONES),
    orders: [],
    payments: [],
    promotions: clone(SEED_PROMOTIONS),
    faqs: clone(SEED_FAQS),
    enquiries: [],
    admins,
    settings: [clone(SEED_SETTINGS)],
    webhookEvents: [],
    reviews: [],
  };
}

function mergeWithSeeds(persisted: PersistedFile): MemoryStore {
  const fresh = seedStore();
  const previous = persisted.store;
  const seedIds = persisted.seedIds || {};

  const keepUserItems = <T extends { _id: string }>(old: T[] | undefined, key: string, next: T[]) =>
    [...next, ...(old || []).filter((item) => !(seedIds[key] || []).includes(item._id))];

  return trackedStore({
    products: keepUserItems(previous.products, "products", fresh.products),
    categories: keepUserItems(previous.categories, "categories", fresh.categories),
    zones: keepUserItems(previous.zones, "zones", fresh.zones),
    promotions: keepUserItems(previous.promotions, "promotions", fresh.promotions),
    faqs: keepUserItems(previous.faqs, "faqs", fresh.faqs),
    orders: previous.orders || [],
    payments: previous.payments || [],
    enquiries: previous.enquiries || [],
    admins: previous.admins?.length ? previous.admins : fresh.admins,
    settings: previous.settings?.length ? previous.settings : fresh.settings,
    webhookEvents: previous.webhookEvents || [],
    reviews: previous.reviews || [],
  });
}

function createStore(): MemoryStore {
  const persisted = readPersisted();
  if (!persisted) return trackedStore(seedStore());
  if (persisted.seedVersion === SEED_VERSION) {
    return trackedStore({
      ...seedStore(),
      ...persisted.store,
    } as MemoryStore);
  }
  console.info("[memory] seed data changed — merging with saved admin data");
  return mergeWithSeeds(persisted);
}

const globalWithStore = globalThis as typeof globalThis & {
  _fbMemoryStore?: MemoryStore;
};

export function getMemoryStore(): MemoryStore {
  if (!globalWithStore._fbMemoryStore) {
    globalWithStore._fbMemoryStore = createStore();
  }
  return globalWithStore._fbMemoryStore;
}

export function resetMemoryStore() {
  globalWithStore._fbMemoryStore = trackedStore(seedStore());
  schedulePersist();
}
