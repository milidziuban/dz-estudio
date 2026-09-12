import type { AppliedDiscount } from "./promos";
import { formatPrice } from "./format";
import { supabase } from "./supabase";
import type { DiscountKind } from "../types/admin";

/**
 * Cupones con código, los de /admin/descuentos.
 *
 * La tienda no lee la tabla `discounts`: le pregunta por UN código a la
 * función `cupon_vigente` (migración 20260909221453), que devuelve el cupón
 * solo si existe y está vigente. Lo que se calcula acá es la estimación que
 * ve la clienta en el resumen; el precio real lo fija el trigger
 * `recalculate_order_totals` con la misma regla (migración 20260912201842),
 * y si el cupón dejó de valer entre que lo aplicó y que confirmó, el insert
 * lo rechaza con `hint` y el checkout lo dice.
 */
export type Cupon = {
  code: string;
  description: string | null;
  kind: DiscountKind;
  value: number;
  minSubtotal: number;
};

type CuponRow = {
  code: string;
  description: string | null;
  kind: DiscountKind;
  value: number;
  min_subtotal: number;
};

export type ResultadoCupon =
  | { ok: true; cupon: Cupon }
  | { ok: false; error: string };

/** Pregunta por el código. `ok: false` trae el texto para la clienta: un
 *  cupón vencido, agotado o inexistente se ve igual desde afuera —la función
 *  no distingue a propósito, así no se puede tantear la tabla—. */
export async function validarCupon(
  code: string,
  subtotal: number,
): Promise<ResultadoCupon> {
  const limpio = code.trim().toUpperCase();
  if (!limpio) return { ok: false, error: "Escribí el código del cupón." };

  const { data, error } = await supabase.rpc("cupon_vigente", {
    p_code: limpio,
  });
  if (error) {
    return {
      ok: false,
      error: "No pudimos verificar el cupón. Probá de nuevo en un momento.",
    };
  }

  const row = (data as CuponRow[] | null)?.[0];
  if (!row) {
    return { ok: false, error: "Ese cupón no existe o ya no está vigente." };
  }

  const cupon: Cupon = {
    code: row.code,
    description: row.description,
    kind: row.kind,
    value: row.value,
    minSubtotal: row.min_subtotal,
  };

  if (subtotal < cupon.minSubtotal) {
    return {
      ok: false,
      error: `Este cupón vale para compras desde ${formatPrice(cupon.minSubtotal)}.`,
    };
  }

  return { ok: true, cupon };
}

/** Cómo se nombra en el resumen y en la orden. Espejo del `discount_label`
 *  que arma el trigger: si se cambia acá, cambiarlo allá. */
export function cuponLabel(cupon: Cupon): string {
  return cupon.kind === "percent"
    ? `Cupón ${cupon.code} · ${cupon.value}%`
    : `Cupón ${cupon.code}`;
}

/** Cuánto descuenta sobre los productos. El de envío gratis no toca los
 *  productos —actúa sobre la línea de envío— y devuelve null. */
export function cuponDiscount(
  cupon: Cupon,
  subtotal: number,
): AppliedDiscount | null {
  if (cupon.kind === "free-shipping") return null;
  const amount =
    cupon.kind === "percent"
      ? Math.round(subtotal * (cupon.value / 100))
      : Math.min(subtotal, Math.max(0, cupon.value));
  if (amount <= 0) return null;
  return { id: `cupon:${cupon.code}`, label: cuponLabel(cupon), amount };
}

/**
 * El cupón no se suma a las promos automáticas: se aplica el descuento
 * mayor, igual que entre las dos promos (`bestDiscount`). En empate gana el
 * cupón, que es lo que la clienta escribió y espera ver. Devuelve también si
 * el cupón quedó afuera, para avisarle que la promo le conviene más.
 */
export function mejorDescuento(
  promo: AppliedDiscount | null,
  cupon: AppliedDiscount | null,
): { discount: AppliedDiscount | null; cuponPerdio: boolean } {
  if (!cupon) return { discount: promo, cuponPerdio: false };
  if (!promo || cupon.amount >= promo.amount) {
    return { discount: cupon, cuponPerdio: false };
  }
  return { discount: promo, cuponPerdio: true };
}
