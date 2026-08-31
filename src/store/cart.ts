"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      setOpen: (v) => set({ open: v }),
      add: (item, qty = 1) => {
        const normalized = { ...item, sku: item.sku ?? null };
        const items = [...get().items];
        const idx = items.findIndex((i) => i.productId === normalized.productId);
        if (idx >= 0)
          items[idx] = { ...items[idx], ...normalized, quantity: items[idx].quantity + qty };
        else items.push({ ...normalized, quantity: qty });
        set({ items, open: true });
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQty: (productId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
      total: () =>
        get().items.reduce((s, i) => s + i.packPrice * i.quantity, 0),
    }),
    { name: "vitex-cart" }
  )
);
