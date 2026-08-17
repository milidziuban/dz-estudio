import { cartKey, type CartItem } from "../hooks/useCart";
import type { Product, ProductVariant } from "../types/product";

export type ResolvedCartItem = {
  /** Clave única de la línea: mismo producto en dos variantes = dos líneas */
  key: string;
  product: Product;
  variant?: ProductVariant;
  qty: number;
};

export function resolveCartItems(
  items: CartItem[],
  products: Product[],
): ResolvedCartItem[] {
  return items.flatMap(({ slug, variantId, qty }) => {
    const product = products.find((p) => p.slug === slug);
    if (!product) return [];
    const variant = product.variants?.find((v) => v.id === variantId);
    return [{ key: cartKey(slug, variantId), product, variant, qty }];
  });
}

export function cartSubtotal(items: ResolvedCartItem[]): number {
  return items.reduce((total, item) => total + item.product.price * item.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.qty, 0);
}
