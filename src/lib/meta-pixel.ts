// Pixel de Meta — mide para Facebook e Instagram el mismo embudo que GA4 mide
// en analytics.ts. No se llama desde las pantallas: cada `track*` de
// analytics.ts avisa acá después de mandar su evento a GA4, así los dos
// medidores no se pueden desincronizar.

/** El ID del pixel, escrito acá y no en una variable de entorno.
 *
 *  Es un dato público —viaja en el bundle del cliente, cualquiera lo ve con el
 *  inspector— y no cambia nunca. Configurable solo sumaba la forma de fallar
 *  que ya nos pasó con el dominio: una variable mal cargada en Vercel no rompe
 *  nada visible, simplemente deja de medir y nadie se entera hasta que el
 *  informe está vacío.
 *
 *  Para apagar el pixel: poner `null` acá. Todo el módulo pasa a ser no-op y
 *  no sale un solo pedido a Meta, igual que analytics.ts sin GA_ID. */
export const META_PIXEL_ID: string | null = "4025131947622868";

/** La función que deja el loader de Meta (`fbevents.js`) en el window. Hasta
 *  que el script baja, encola las llamadas en `queue`. */
type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push?: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let initialized = false;

/** Baja `fbevents.js` en diferido y prende el pixel. El `PageView` no se manda
 *  acá: lo manda `trackPageView` en cada cambio de ruta, como el `page_view` de
 *  GA4 (que por eso se configura con `send_page_view: false`). Si se mandara en
 *  los dos lados, la primera vista de cada visita contaría doble. */
export function initMetaPixel() {
  if (!META_PIXEL_ID || initialized) return;
  initialized = true;

  // El shim del snippet oficial de Meta, escrito prolijo: hasta que baja
  // `fbevents.js` no hay `callMethod`, así que las llamadas se encolan y el
  // script las procesa cuando llega.
  const fbq: Fbq = Object.assign(
    (...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue.push(args);
    },
    { queue: [] as unknown[], loaded: true, version: "2.0" },
  );
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = window._fbq ?? fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", META_PIXEL_ID);
}

function track(name: string, params: Record<string, unknown>) {
  if (!META_PIXEL_ID || typeof window.fbq !== "function") return;
  window.fbq("track", name, params);
}

// ── El embudo ─────────────────────────────────────────────────
//
// Los cinco eventos estándar de Meta, uno a uno con los de GA4:
// PageView ← page_view · ViewContent ← view_item · AddToCart ← add_to_cart ·
// InitiateCheckout ← begin_checkout · Purchase ← purchase.

/** Toda la tienda cobra en pesos. */
const CURRENCY = "ARS";

/** Lo mínimo que el pixel necesita de cada línea. La forma es a propósito la de
 *  los items de GA4: `analytics.ts` le pasa los suyos tal cual. */
export type PixelItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

/** El `content_ids` va con el slug del producto, el mismo valor que GA4 usa de
 *  `item_id` y el que se ve en la URL: los informes de Meta y de Google se leen
 *  al lado sin traducir nada. */
function contents(items: PixelItem[]) {
  return {
    content_type: "product",
    content_ids: items.map((item) => item.item_id),
    contents: items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity,
      item_price: item.price,
    })),
  };
}

export function metaPageView() {
  track("PageView", {});
}

export function metaViewContent(item: PixelItem) {
  track("ViewContent", {
    ...contents([item]),
    content_name: item.item_name,
    currency: CURRENCY,
    value: item.price,
  });
}

export function metaAddToCart(item: PixelItem) {
  track("AddToCart", {
    ...contents([item]),
    content_name: item.item_name,
    currency: CURRENCY,
    value: item.price * item.quantity,
  });
}

export function metaInitiateCheckout(items: PixelItem[], value: number) {
  track("InitiateCheckout", {
    ...contents(items),
    num_items: items.reduce((total, item) => total + item.quantity, 0),
    currency: CURRENCY,
    value,
  });
}

/** La compra. Se cuelga de `trackStashedPurchase`, que ya borra el pedido
 *  guardado antes de medir: el pixel no tiene su propio camino de vuelta de
 *  Mercado Pago y por eso tampoco puede contar la venta dos veces. */
export function metaPurchase(orderId: string, items: PixelItem[], value: number) {
  track("Purchase", {
    ...contents(items),
    num_items: items.reduce((total, item) => total + item.quantity, 0),
    currency: CURRENCY,
    value,
    // Meta deduplica por `eventID` cuando el mismo evento llega también por la
    // API de Conversiones. Todavía no la usamos, pero mandar el id de la orden
    // sale gratis y deja el camino hecho.
    eventID: orderId,
  });
}
