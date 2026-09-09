import { cartKey, type CartItem } from "../hooks/useCart";
import { topeDeCantidad, unidadesDisponibles } from "./stock";
import type { Product, ProductVariant } from "../types/product";

export type ResolvedCartItem = {
  /** Clave única de la línea: mismo producto en dos variantes = dos líneas */
  key: string;
  product: Product;
  variant?: ProductVariant;
  /** Ya topeada al stock: es la cantidad que se cobra y se pide */
  qty: number;
  /** Lo máximo que se puede pedir de esta línea */
  max: number;
};

/** Acá se cruza el carrito guardado con el catálogo, así que es el único
 *  lugar donde se sabe cuánto stock hay: la cantidad se topea una vez y sale
 *  topeada para el drawer, el checkout y el mensaje de WhatsApp. Importa para
 *  el carrito viejo, que quedó guardado cuando todavía había más unidades. */
export function resolveCartItems(
  items: CartItem[],
  products: Product[],
): ResolvedCartItem[] {
  return items.flatMap(({ slug, variantId, qty }) => {
    const product = products.find((p) => p.slug === slug);
    if (!product) return [];
    const variant = product.variants?.find((v) => v.id === variantId);
    const max = topeDeCantidad(unidadesDisponibles(product, variant));
    return [
      {
        key: cartKey(slug, variantId),
        product,
        variant,
        qty: Math.min(qty, max),
        max,
      },
    ];
  });
}

export function cartSubtotal(items: ResolvedCartItem[]): number {
  return items.reduce((total, item) => total + item.product.price * item.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.qty, 0);
}
