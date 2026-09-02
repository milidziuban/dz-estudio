import type { Category } from "../types/product";
import type { ResolvedCartItem } from "./cart";
import { formatPrice } from "./format";

// Promociones reales de la tienda (sincronizado 18/08/2026).
// Los valores por defecto son los de Tienda Nube; desde /admin/precios se
// pueden cambiar y quedan guardados en store_settings.

/** Categorías sobre las que corre el descuento por combo. El mínimo se cuenta
 *  por categoría y por separado: 2 almohadones dan 10% sobre los almohadones,
 *  y 2 packs de individuales dan 10% sobre los individuales. Llevar uno de
 *  cada uno no alcanza — son dos promos que corren en paralelo, no una sola
 *  sobre el carrito entero. */
export const COMBO_CATEGORIES: Category[] = ["almohadones", "individuales"];

/** Cómo se nombra cada categoría dentro de los textos de la promo.
 *  Los individuales se venden por pack, así que "2 individuales" confundiría:
 *  lo que hay que llevar son dos packs. */
const COMBO_NOUN: Record<Category, { singular: string; plural: string }> = {
  almohadones: { singular: "almohadón", plural: "almohadones" },
  individuales: { singular: "pack", plural: "packs" },
};

export const COMBO_PROMO = {
  id: "combo",
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

/** Cómo se anuncia la promo antes de que entre: marquesina y avisos. Nombra
 *  todas las categorías que la tienen, así el texto no promete de más ni de
 *  menos aunque mañana cambien las categorías o el mínimo. */
export function comboLabel(config: PromoConfig): string {
  const partes = COMBO_CATEGORIES.map(
    (category) => `${config.combo.minQty} ${COMBO_NOUN[category].plural}`,
  );
  return `${config.combo.percent}% llevando ${partes.join(" o ")}`;
}

/** Versión corta para el badge de la grilla de productos. */
export function comboBadge(config: PromoConfig): string {
  return `${config.combo.percent}% llevando ${config.combo.minQty}`;
}

/** Frase para la ficha de producto, nombrando solo su categoría.
 *  null = a este producto no le corre la promo. */
export function comboBanner(
  category: Category,
  config: PromoConfig,
): string | null {
  if (!config.combo.enabled || !COMBO_CATEGORIES.includes(category)) return null;
  const { plural } = COMBO_NOUN[category];
  return `Llevando ${config.combo.minQty} ${plural} o más, ${config.combo.percent}% de descuento`;
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

/** Base de cálculo de la promo: el mínimo de unidades dentro de una misma
 *  categoría, contado categoría por categoría (así llevar 1 almohadón + 1 pack
 *  de individuales no alcanza). Devuelve también en cuáles entró, para poder
 *  decirle a la clienta exactamente por qué se le aplicó. */
function comboDiscount(
  items: ResolvedCartItem[],
  config: PromoConfig,
): { amount: number; categories: Category[] } {
  if (!config.combo.enabled) return { amount: 0, categories: [] };
  let amount = 0;
  const categories: Category[] = [];
  for (const category of COMBO_CATEGORIES) {
    const rows = items.filter((i) => i.product.category === category);
    const qty = rows.reduce((sum, i) => sum + i.qty, 0);
    if (qty < config.combo.minQty) continue;
    const base = rows.reduce((sum, i) => sum + i.product.price * i.qty, 0);
    amount += Math.round(base * (config.combo.percent / 100));
    categories.push(category);
  }
  return { amount, categories };
}

/** Cuánto falta para que entre la promo combo, para la primera categoría del
 *  carrito que todavía no llegó al mínimo (null = ya entró en todas o no aplica).
 *  El sustantivo ya viene en el número que corresponde, así quien lo muestra no
 *  tiene que pluralizar a mano. */
export function comboFaltan(
  items: ResolvedCartItem[],
  config: PromoConfig = DEFAULT_PROMOS,
): { noun: string; faltan: number } | null {
  if (!config.combo.enabled) return null;
  for (const category of COMBO_CATEGORIES) {
    const qty = items
      .filter((i) => i.product.category === category)
      .reduce((sum, i) => sum + i.qty, 0);
    if (qty === 0) continue;
    const faltan = Math.max(0, config.combo.minQty - qty);
    if (faltan > 0) {
      const noun = COMBO_NOUN[category];
      return { noun: faltan === 1 ? noun.singular : noun.plural, faltan };
    }
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

  // La etiqueta nombra solo las categorías por las que el descuento entró de
  // verdad: en el resumen del pedido tiene que decir por qué se aplicó, no
  // repetir el anuncio general de la promo.
  const combo = comboDiscount(items, config);
  if (combo.amount > 0) {
    const partes = combo.categories.map(
      (category) => `${config.combo.minQty} ${COMBO_NOUN[category].plural}`,
    );
    candidates.push({
      id: COMBO_PROMO.id,
      label: `${config.combo.percent}% llevando ${partes.join(" y ")}`,
      amount: combo.amount,
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
