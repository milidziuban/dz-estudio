import type { Product, ProductVariant } from "../types/product";

/** null/undefined = sin control de stock: siempre disponible. */
export function inStockFromCount(
  stock: number | null | undefined,
): boolean {
  return stock === null || stock === undefined || stock > 0;
}

/** Tope por línea que acepta la base (`recalculate_order_totals`): más que
 *  esto se rechaza como cantidad inválida. */
export const MAX_POR_LINEA = 50;

/** Unidades que se pueden pedir de una línea. null = sin control de stock.
 *
 *  Misma regla que usa la base al validar el pedido: si hay variante elegida
 *  manda el stock de esa variante; si no, el del producto. Así la ficha y el
 *  carrito frenan donde iba a frenar el checkout. */
export function unidadesDisponibles(
  product: Pick<Product, "stock" | "variants">,
  variant?: Pick<ProductVariant, "stock">,
): number | null {
  const stock = variant ? variant.stock : product.stock;
  return stock ?? null;
}

/** Cuánto es lo máximo que se puede pedir de una línea, ya con el tope de la
 *  base aplicado. Siempre ≥ 1: el "sin stock" lo resuelve `inStock`, no el
 *  selector de cantidad. */
export function topeDeCantidad(disponibles: number | null): number {
  if (disponibles === null) return MAX_POR_LINEA;
  return Math.max(1, Math.min(disponibles, MAX_POR_LINEA));
}

/** "Queda 1" / "Quedan 3". Solo cuando hay control de stock y el número ya es
 *  chico: con 40 unidades el dato no le sirve a nadie. */
export function avisoDeUnidades(disponibles: number | null): string | null {
  if (disponibles === null || disponibles < 1 || disponibles > 5) return null;
  return `${disponibles === 1 ? "Queda" : "Quedan"} ${disponibles}`;
}
