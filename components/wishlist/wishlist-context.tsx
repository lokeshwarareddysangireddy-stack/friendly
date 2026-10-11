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
import { useCustomer } from "@/components/auth/customer-context";

interface WishlistContextValue {
  ids: string[];
  count: number;
  ready: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<boolean>;
  remove: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "fb_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useCustomer();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const idsRef = useRef<string[]>([]);
  const syncedCustomer = useRef<string | null>(null);

  idsRef.current = ids;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setIds(parsed.filter((x) => typeof x === "string"));
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [ids, ready]);

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
        const res = await fetch("/api/auth/wishlist", { cache: "no-store" });
        const json = await res.json();
        const serverIds: string[] = json?.data?.ids ?? customer.wishlist ?? [];
        const union = Array.from(new Set([...idsRef.current, ...serverIds]));
        setIds(union);
        await fetch("/api/auth/wishlist/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: union }),
        });
      } catch {
        // keep local ids
      }
    })();
  }, [customer, ready]);

  const toggle = useCallback(
    async (productId: string) => {
      const exists = idsRef.current.includes(productId);
      setIds((prev) =>
        prev.includes(productId) ? prev.filter((x) => x !== productId) : [productId, ...prev]
      );
      if (customer) {
        try {
          await fetch("/api/auth/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
        } catch {
          // server sync best-effort
        }
      }
      return !exists;
    },
    [customer]
  );

  const remove = useCallback((productId: string) => {
    setIds((prev) => prev.filter((x) => x !== productId));
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      ready,
      has: (id: string) => ids.includes(id),
      toggle,
      remove,
    }),
    [ids, ready, toggle, remove]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
