import type { CartItem } from "../hooks/useCart";
import type { Product } from "../types/product";

export type ResolvedCartItem = {
  product: Product;
  qty: number;
};

/** Estimado optimista que se muestra en el drawer (Correo Argentino) */
export const SHIPPING_ESTIMATE = 7200;

export function resolveCartItems(
  items: CartItem[],
  products: Product[],
): ResolvedCartItem[] {
  return items.flatMap(({ slug, qty }) => {
    const product = products.find((p) => p.slug === slug);
    return product ? [{ product, qty }] : [];
  });
}

export function cartSubtotal(items: ResolvedCartItem[]): number {
  return items.reduce((total, item) => total + item.product.price * item.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.qty, 0);
}
