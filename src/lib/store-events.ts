import { supabase } from "./supabase";
import { sessionId } from "./visits";

/**
 * Los dos pasos del medio del embudo, guardados en la base de la tienda.
 *
 * GA4 y el pixel de Meta ya los miden, pero ninguno de los dos se lee desde
 * /admin y los dos tardan en mostrar el dato. Estas filas son las que dejan
 * contestar el mismo día la pregunta de la primera semana: si la gente agrega
 * al carrito y no compra, o si ni siquiera llega al carrito.
 *
 * Comparten el id de sesión con `visits.ts`, que es lo que permite contar el
 * embudo por sesión y no por evento suelto. No identifica a nadie: el id vive
 * en sessionStorage y se borra al cerrar la pestaña.
 */
export type StoreEventKind = "add_to_cart" | "begin_checkout";

type StoreEventPayload = {
  slug?: string;
  qty?: number;
  /** Valor en ARS de lo que se agregó o de lo que se va a pagar */
  value?: number;
};

export async function trackStoreEvent(
  kind: StoreEventKind,
  payload: StoreEventPayload = {},
): Promise<void> {
  try {
    await supabase.from("store_events").insert({
      kind,
      session_id: sessionId(),
      slug: payload.slug ?? null,
      qty: payload.qty ?? null,
      value: payload.value ?? null,
    });
  } catch {
    // Medir nunca puede romper una compra. Igual que en `trackVisit`: si la
    // fila no entra, se pierde el dato y no la venta.
  }
}
