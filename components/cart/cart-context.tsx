"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ProductDoc } from "@/types";
import { useCustomer } from "@/components/auth/customer-context";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  image?: string | null;
  unit?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  addItem: (product: ProductDoc, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fb_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useCustomer();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  const syncedCustomer = useRef<string | null>(null);

  itemsRef.current = items;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore corrupted storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full / unavailable
    }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    if (!customer) {
      syncedCustomer.current = null;
      return;
    }
    if (syncedCustomer.current === customer._id) return;
    syncedCustomer.current = customer._id;
    void (async () => {
      try {
        const res = await fetch("/api/auth/cart", { cache: "no-store" });
        const json = await res.json();
        const server: CartItem[] = Array.isArray(json?.data?.items) ? json.data.items : [];
        setItems((prev) => {
          const map = new Map<string, CartItem>();
          for (const it of [...server, ...prev]) {
            const existing = map.get(it.productId);
            map.set(
              it.productId,
              existing
                ? { ...existing, quantity: Math.min(99, existing.quantity + it.quantity) }
                : { ...it }
            );
          }
          return Array.from(map.values());
        });
      } catch {
        // keep local cart
      }
    })();
  }, [customer, ready]);

  useEffect(() => {
    if (!ready || !customer) return;
    const timer = setTimeout(() => {
      fetch("/api/auth/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsRef.current }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [items, ready, customer]);

  const addItem = useCallback((product: ProductDoc, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          mrp: product.mrp ?? null,
          image: product.images?.[0]?.url ?? null,
          unit: product.unit,
          quantity: Math.min(99, quantity),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(99, quantity) }
              : i
          )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { items, count, subtotal, ready, addItem, setQuantity, removeItem, clear };
  }, [items, ready, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
