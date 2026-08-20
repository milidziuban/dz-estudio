import type { Category } from "../types/product";
import type { ResolvedCartItem } from "./cart";
import { formatPrice } from "./format";

// Promociones reales de la tienda (sincronizado 18/08/2026).
// Los valores por defecto son los de Tienda Nube; desde /admin/precios se
// pueden cambiar y quedan guardados en store_settings.

/** Categorías sobre las que corre el descuento por combo (2+ del mismo tipo).
 *  Los individuales quedan afuera a propósito: ya se venden de a 2 o más por
 *  producto, así que no suman una promo aparte. */
export const COMBO_CATEGORIES: Category[] = ["almohadones"];

export const COMBO_PROMO = {
  id: "combo",
  /** Promoción "10% de descuento llevando 2 o más almohadones" */
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

/**
 * Cuotas que ofrece el checkout de Mercado Pago.
 * `sinInteres` son las que absorbe la tienda: se activan en la cuenta de MP
 * (Tu negocio → Costos y cuotas), acá solo se anuncian. De ahí hasta `max`
 * entran por Cuotas Simples, con el costo financiero a cargo del cliente.
 * `max` sí es real: es el tope que viaja en la preferencia de pago.
 * `minAmount` es el piso que pone Mercado Pago para las cuotas sin interés:
 * por debajo de ese monto, sea el producto o el carrito, no se ofrecen.
 */
const INSTALLMENTS_MIN_AMOUNT = 45000;

export const INSTALLMENTS = {
  sinInteres: 3,
  max: 6,
  minAmount: INSTALLMENTS_MIN_AMOUNT,
  /** Titular corto: marquesina, badges, grilla de producto */
  label: `3 cuotas sin interés desde ${formatPrice(INSTALLMENTS_MIN_AMOUNT)}`,
  /** Frase completa: carrito, checkout, medios de pago */
  detail: `3 cuotas sin interés desde ${formatPrice(INSTALLMENTS_MIN_AMOUNT)}, o hasta 6 con Cuotas Simples`,
} as const;

/** Configuración editable de las dos promos automáticas. Los porcentajes van
 *  en enteros (10 = 10%), igual que se cargan en el panel. */
export type PromoConfig = {
  combo: { enabled: boolean; percent: number; minQty: number };
  transferencia: { enabled: boolean; percent: number };
};

export const DEFAULT_PROMOS: PromoConfig = {
  combo: {
    enabled: true,
    percent: Math.round(COMBO_PROMO.percent * 100),
    minQty: COMBO_PROMO.minQty,
  },
  transferencia: {
    enabled: true,
    percent: Math.round(TRANSFER_PROMO.percent * 100),
  },
};

export function comboLabel(config: PromoConfig): string {
  return `${config.combo.percent}% llevando ${config.combo.minQty} o más almohadones`;
}

export function transferLabel(config: PromoConfig): string {
  return `${config.transferencia.percent}% pagando por transferencia`;
}

export type AppliedDiscount = {
  id: string;
  label: string;
  /** Monto en ARS a restar del subtotal */
  amount: number;
};

/** Base de cálculo de la promo: 2+ unidades de la misma categoría, sumadas
 *  categoría por categoría (así llevar 1 almohadón + 1 individual no cuenta). */
function comboDiscount(items: ResolvedCartItem[], config: PromoConfig): number {
  if (!config.combo.enabled) return 0;
  let total = 0;
  for (const category of COMBO_CATEGORIES) {
    const rows = items.filter((i) => i.product.category === category);
    const qty = rows.reduce((sum, i) => sum + i.qty, 0);
    if (qty < config.combo.minQty) continue;
    const base = rows.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    total += Math.round(base * (config.combo.percent / 100));
  }
  return total;
}

const CATEGORY_LABEL: Record<Category, string> = {
  almohadones: "almohadón",
  individuales: "individual",
};

/** Cuánto falta para que entre la promo combo, para la primera categoría del
 *  carrito que todavía no llegó al mínimo (null = ya entró en todas o no aplica). */
export function comboFaltan(
  items: ResolvedCartItem[],
  config: PromoConfig = DEFAULT_PROMOS,
): { categoryLabel: string; faltan: number } | null {
  if (!config.combo.enabled) return null;
  for (const category of COMBO_CATEGORIES) {
    const qty = items
      .filter((i) => i.product.category === category)
      .reduce((sum, i) => sum + i.qty, 0);
    if (qty === 0) continue;
    const faltan = Math.max(0, config.combo.minQty - qty);
    if (faltan > 0) return { categoryLabel: CATEGORY_LABEL[category], faltan };
  }
  return null;
}

/**
 * En Tienda Nube la promo por combo no se combina con otras, así que nunca
 * sumamos las dos: aplicamos la que más le conviene al cliente.
 * `pagaPorTransferencia` habilita la segunda opción.
 */
export function bestDiscount(
  items: ResolvedCartItem[],
  subtotal: number,
  pagaPorTransferencia: boolean,
  config: PromoConfig = DEFAULT_PROMOS,
): AppliedDiscount | null {
  const candidates: AppliedDiscount[] = [];

  const combo = comboDiscount(items, config);
  if (combo > 0) {
    candidates.push({
      id: COMBO_PROMO.id,
      label: comboLabel(config),
      amount: combo,
    });
  }

  if (
    pagaPorTransferencia &&
    config.transferencia.enabled &&
    subtotal > 0
  ) {
    candidates.push({
      id: TRANSFER_PROMO.id,
      label: transferLabel(config),
      amount: Math.round(subtotal * (config.transferencia.percent / 100)),
    });
  }

  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) => (c.amount > best.amount ? c : best));
}
