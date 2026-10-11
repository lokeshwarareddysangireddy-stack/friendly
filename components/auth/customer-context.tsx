"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AddressDoc, CustomerCartLine } from "@/types";

export interface CustomerProfile {
  _id: string;
  email: string;
  name: string;
  mobile: string;
  emailVerified: boolean;
  addresses: AddressDoc[];
  wishlist: string[];
  cart: CustomerCartLine[];
  createdAt: string;
}

interface CustomerContextValue {
  customer: CustomerProfile | null;
  loading: boolean;
  refresh: () => Promise<CustomerProfile | null>;
  logout: () => Promise<void>;
  setCustomer: (customer: CustomerProfile | null) => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const json = await res.json();
      const next: CustomerProfile | null = json?.data?.customer ?? null;
      setCustomer(next);
      return next;
    } catch {
      setCustomer(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setCustomer(null);
  }, []);

  const value = useMemo<CustomerContextValue>(
    () => ({ customer, loading, refresh, logout, setCustomer }),
    [customer, loading, refresh, logout]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be used within CustomerProvider");
  return ctx;
}
