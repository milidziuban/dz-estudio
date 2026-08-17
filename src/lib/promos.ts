import type { ResolvedCartItem } from "./cart";

// Promociones reales de la tienda de Tienda Nube (sincronizado 17/08/2026).
// ⚠️ Si las cambiás allá, hay que actualizarlas acá: son dos sistemas distintos.

export const ALMOHADONES_PROMO = {
  id: "almohadones-2",
  /** Promoción "10% de descuento llevando 2 productos", categoría Almohadones */
  label: "10% llevando 2 o más almohadones",
  short: "10% llevando 2",
  percent: 0.1,
  minQty: 2,
} as const;

export const TRANSFER_PROMO = {
  id: "transferencia",
  label: "10% pagando por transferencia",
  short: "10% por transferencia",
  percent: 0.1,
} as const;

/** Cuotas sin interés configuradas en la pasarela. */
export const INSTALLMENTS = { count: 3, label: "3 cuotas sin interés" } as const;

export type AppliedDiscount = {
  id: string;
  label: string;
  /** Monto en ARS a restar del subtotal */
  amount: number;
};

/** Base de cálculo de la promo: solo los almohadones del carrito. */
function almohadonesDiscount(items: ResolvedCartItem[]): number {
  const rows = items.filter((i) => i.product.category === "almohadones");
  const qty = rows.reduce((total, i) => total + i.qty, 0);
  if (qty < ALMOHADONES_PROMO.minQty) return 0;
  const base = rows.reduce((total, i) => total + i.product.price * i.qty, 0);
  return Math.round(base * ALMOHADONES_PROMO.percent);
}

/** Cuánto falta para que entre la promo de almohadones (0 = ya entró). */
export function almohadonesFaltan(items: ResolvedCartItem[]): number {
  const qty = items
    .filter((i) => i.product.category === "almohadones")
    .reduce((total, i) => total + i.qty, 0);
  if (qty === 0) return 0;
  return Math.max(0, ALMOHADONES_PROMO.minQty - qty);
}

/**
 * En Tienda Nube la promo de almohadones no se combina con otras, así que
 * nunca sumamos las dos: aplicamos la que más le conviene al cliente.
 * `pagaPorTransferencia` habilita la segunda opción.
 */
export function bestDiscount(
  items: ResolvedCartItem[],
  subtotal: number,
  pagaPorTransferencia: boolean,
): AppliedDiscount | null {
  const candidates: AppliedDiscount[] = [];

  const almohadones = almohadonesDiscount(items);
  if (almohadones > 0) {
    candidates.push({
      id: ALMOHADONES_PROMO.id,
      label: ALMOHADONES_PROMO.label,
      amount: almohadones,
    });
  }

  if (pagaPorTransferencia && subtotal > 0) {
    candidates.push({
      id: TRANSFER_PROMO.id,
      label: TRANSFER_PROMO.label,
      amount: Math.round(subtotal * TRANSFER_PROMO.percent),
    });
  }

  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) => (c.amount > best.amount ? c : best));
}
