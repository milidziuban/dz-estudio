import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  slug: string;
  /** id de variante de Tienda Nube; ausente si el producto no tiene variantes */
  variantId?: string;
  qty: number;
};

/** Un producto con dos variantes son dos líneas distintas del carrito. */
export const cartKey = (slug: string, variantId?: string) =>
  `${slug}::${variantId ?? ""}`;

const itemKey = (item: CartItem) => cartKey(item.slug, item.variantId);

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, variantId?: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      add: (slug, variantId, qty = 1) =>
        set((state) => {
          const key = cartKey(slug, variantId);
          const existing = state.items.find((item) => itemKey(item) === key);
          return {
            items: existing
              ? state.items.map((item) =>
                  itemKey(item) === key ? { ...item, qty: item.qty + qty } : item,
                )
              : [...state.items, { slug, variantId, qty }],
          };
        }),
      setQty: (key, qty) =>
        set((state) => ({
          items:
            qty < 1
              ? state.items.filter((item) => itemKey(item) !== key)
              : state.items.map((item) =>
                  itemKey(item) === key ? { ...item, qty } : item,
                ),
        })),
      remove: (key) =>
        set((state) => ({
          items: state.items.filter((item) => itemKey(item) !== key),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      // v2: los items pasaron a tener variantId, el carrito viejo ya no aplica
      name: "dz-cart-v2",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
