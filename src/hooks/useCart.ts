import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  slug: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, qty?: number) => void;
  setQty: (slug: string, qty: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      add: (slug, qty = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.slug === slug);
          return {
            items: existing
              ? state.items.map((item) =>
                  item.slug === slug ? { ...item, qty: item.qty + qty } : item,
                )
              : [...state.items, { slug, qty }],
          };
        }),
      setQty: (slug, qty) =>
        set((state) => ({
          items:
            qty < 1
              ? state.items.filter((item) => item.slug !== slug)
              : state.items.map((item) =>
                  item.slug === slug ? { ...item, qty } : item,
                ),
        })),
      remove: (slug) =>
        set((state) => ({
          items: state.items.filter((item) => item.slug !== slug),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "dz-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
