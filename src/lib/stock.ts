/** null/undefined = sin control de stock: siempre disponible. */
export function inStockFromCount(
  stock: number | null | undefined,
): boolean {
  return stock === null || stock === undefined || stock > 0;
}
