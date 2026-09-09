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

/** Sin `max` (catálogo todavía cargando, o producto sin control de stock) no
 *  se topea nada: el carrito no inventa un límite que no conoce. */
const tope = (qty: number, max?: number) =>
  max === undefined ? qty : Math.max(1, Math.min(qty, max));

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** `max` = unidades disponibles. Sumar de más no agrega de más: la línea
   *  se corta ahí, que es donde la iba a cortar el checkout. */
  add: (slug: string, variantId?: string, qty?: number, max?: number) => void;
  setQty: (key: string, qty: number, max?: number) => void;
  /** Baja las líneas guardadas al stock real, cuando el catálogo ya cargó. */
  limitar: (maximos: Record<string, number>) => void;
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
      add: (slug, variantId, qty = 1, max) =>
        set((state) => {
          const key = cartKey(slug, variantId);
          const existing = state.items.find((item) => itemKey(item) === key);
          // El tope se mide contra el total de la línea, no contra lo que se
          // suma: dos visitas a la ficha de a 2 son 4 unidades igual.
          const total = tope((existing?.qty ?? 0) + qty, max);
          return {
            items: existing
              ? state.items.map((item) =>
                  itemKey(item) === key ? { ...item, qty: total } : item,
                )
              : [...state.items, { slug, variantId, qty: total }],
          };
        }),
      setQty: (key, qty, max) =>
        set((state) => ({
          items:
            qty < 1
              ? state.items.filter((item) => itemKey(item) !== key)
              : state.items.map((item) =>
                  itemKey(item) === key ? { ...item, qty: tope(qty, max) } : item,
                ),
        })),
      limitar: (maximos) =>
        set((state) => {
          // El carrito vive en el navegador y puede tener meses: entre que se
          // guardó y hoy, el stock pudo bajar. Si nada sobra se devuelve el
          // mismo estado, para no re-renderizar de gusto.
          const items = state.items.map((item) => {
            const max = maximos[itemKey(item)];
            return max !== undefined && item.qty > max ? { ...item, qty: max } : item;
          });
          return items.some((item, i) => item !== state.items[i]) ? { items } : state;
        }),
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
