import type { ResolvedCartItem } from "./cart";

// Promociones reales de la tienda (sincronizado 17/08/2026).
// Los valores por defecto son los de Tienda Nube; desde /admin/descuentos se
// pueden cambiar y quedan guardados en store_settings.

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

/**
 * Cuotas que ofrece el checkout de Mercado Pago.
 * `sinInteres` son las que absorbe la tienda: se activan en la cuenta de MP
 * (Tu negocio → Costos y cuotas), acá solo se anuncian. De ahí hasta `max`
 * entran por Cuotas Simples, con el costo financiero a cargo del cliente.
 * `max` sí es real: es el tope que viaja en la preferencia de pago.
 */
export const INSTALLMENTS = {
  sinInteres: 3,
  max: 6,
  /** Titular corto: marquesina, badges, grilla de producto */
  label: "3 cuotas sin interés",
  /** Frase completa: carrito, checkout, medios de pago */
  detail: "3 cuotas sin interés o hasta 6 con Cuotas Simples",
} as const;

/** Configuración editable de las dos promos automáticas. Los porcentajes van
 *  en enteros (10 = 10%), igual que se cargan en el panel. */
export type PromoConfig = {
  almohadones: { enabled: boolean; percent: number; minQty: number };
  transferencia: { enabled: boolean; percent: number };
};

export const DEFAULT_PROMOS: PromoConfig = {
  almohadones: {
    enabled: true,
    percent: Math.round(ALMOHADONES_PROMO.percent * 100),
    minQty: ALMOHADONES_PROMO.minQty,
  },
  transferencia: {
    enabled: true,
    percent: Math.round(TRANSFER_PROMO.percent * 100),
  },
};

export function almohadonesLabel(config: PromoConfig): string {
  return `${config.almohadones.percent}% llevando ${config.almohadones.minQty} o más almohadones`;
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

/** Base de cálculo de la promo: solo los almohadones del carrito. */
function almohadonesDiscount(
  items: ResolvedCartItem[],
  config: PromoConfig,
): number {
  if (!config.almohadones.enabled) return 0;
  const rows = items.filter((i) => i.product.category === "almohadones");
  const qty = rows.reduce((total, i) => total + i.qty, 0);
  if (qty < config.almohadones.minQty) return 0;
  const base = rows.reduce((total, i) => total + i.product.price * i.qty, 0);
  return Math.round(base * (config.almohadones.percent / 100));
}

/** Cuánto falta para que entre la promo de almohadones (0 = ya entró). */
export function almohadonesFaltan(
  items: ResolvedCartItem[],
  config: PromoConfig = DEFAULT_PROMOS,
): number {
  if (!config.almohadones.enabled) return 0;
  const qty = items
    .filter((i) => i.product.category === "almohadones")
    .reduce((total, i) => total + i.qty, 0);
  if (qty === 0) return 0;
  return Math.max(0, config.almohadones.minQty - qty);
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
  config: PromoConfig = DEFAULT_PROMOS,
): AppliedDiscount | null {
  const candidates: AppliedDiscount[] = [];

  const almohadones = almohadonesDiscount(items, config);
  if (almohadones > 0) {
    candidates.push({
      id: ALMOHADONES_PROMO.id,
      label: almohadonesLabel(config),
      amount: almohadones,
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
