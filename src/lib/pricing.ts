/** Calculadora de precios de /admin/precios: mismo cálculo que la planilla
 *  de costos (costo → margen → combo → transferencia), en un solo lugar para
 *  no repetir la fórmula en la pantalla y en cualquier otro lado que la use. */

/** Redondea hacia arriba al múltiplo de $100 más cercano (18.222 → 18.300). */
export function roundUpToHundred(value: number): number {
  return Math.ceil(value / 100) * 100;
}

/**
 * Precio de lista sugerido para un producto.
 *
 * `isBundle` es para productos que ya se venden empaquetados (ej. "Pack x2"):
 * a esos el descuento por combo se les aplica directo sobre el precio, en vez
 * de esperar a que el cliente lleve dos unidades del mismo producto.
 */
export function computeListPrice(
  cost: number,
  marginPercent: number,
  isBundle: boolean,
  comboPercent: number,
): number {
  const withMargin = cost * (1 + marginPercent / 100);
  const withCombo = isBundle ? withMargin * (1 - comboPercent / 100) : withMargin;
  return roundUpToHundred(withCombo);
}

/** Precio con el descuento por transferencia ya aplicado, sin redondear más:
 *  es un valor informativo, no se guarda en ningún lado. */
export function computeTransferPrice(
  listPrice: number,
  transferPercent: number,
): number {
  return Math.round(listPrice * (1 - transferPercent / 100));
}
