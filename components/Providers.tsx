"use client";

import { CartProvider } from "@/components/cart/cart-context";
import { CustomerProvider } from "@/components/auth/customer-context";
import { WishlistProvider } from "@/components/wishlist/wishlist-context";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CustomerProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </CustomerProvider>
    </ToastProvider>
  );
}
