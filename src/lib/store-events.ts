import { supabase } from "./supabase";
import { seMide, sessionId } from "./visits";

/**
 * Lo que pasa adentro de la tienda, guardado en la base.
 *
 * GA4 y el pixel de Meta también lo miden, pero ninguno de los dos se lee
 * desde /admin y los dos tardan en mostrar el dato. Estas filas son las que
 * alimentan /admin/estadisticas el mismo día.
 *
 * Arrancó el 10/09 con los dos pasos del medio del embudo (carrito y
 * checkout). Desde el 30/10 suma el resto del recorrido: qué fichas se abren,
 * qué filtros se usan, quién se va a WhatsApp, hasta dónde se baja en cada
 * página y en qué paso del checkout se queda la gente.
 *
 * Comparten el id de sesión con `visits.ts`, que es lo que permite contar por
 * sesión y no por evento suelto. No identifica a nadie: el id vive en
 * sessionStorage y se borra al cerrar la pestaña.
 *
 * La lista de `kind` es cerrada en la base (`store_events_kind_check`):
 * sumar uno nuevo es una migración, no solo una línea acá.
 */
export type StoreEventKind =
  | "add_to_cart"
  | "begin_checkout"
  | "view_item"
  | "checkout_step"
  | "order_created"
  | "checkout_error"
  | "contact_click"
  | "filter"
  | "scroll";

type StoreEventPayload = {
  slug?: string;
  qty?: number;
  /** Valor en ARS de lo que se agregó o de lo que se va a pagar */
  value?: number;
  /** El dato chico del evento: el paso, el filtro, el canal */
  detail?: string;
};

export async function trackStoreEvent(
  kind: StoreEventKind,
  payload: StoreEventPayload = {},
): Promise<void> {
  if (!seMide()) return;
  try {
    await supabase.from("store_events").insert({
      kind,
      session_id: sessionId(),
      slug: payload.slug ?? null,
      qty: payload.qty ?? null,
      value: payload.value ?? null,
      path: window.location.pathname.slice(0, 300),
      detail: payload.detail?.slice(0, 120) ?? null,
    });
  } catch {
    // Medir nunca puede romper una compra. Igual que en `trackVisit`: si la
    // fila no entra, se pierde el dato y no la venta.
  }
}
