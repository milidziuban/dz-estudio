// Google Analytics 4 — el ID se configura con VITE_GA_ID en el .env.
// Si no hay ID, todo es no-op (útil en desarrollo).
//
// Cada evento del embudo se mide tres veces desde acá: en GA4, en el pixel de
// Meta (`meta-pixel.ts`) y —los dos pasos del medio— en la base de la tienda
// (`store-events.ts`), que es la única de las tres que se lee desde /admin.
// Las pantallas siguen llamando a una sola función y no saben que hay tres
// medidores; agregar un cuarto se hace en este archivo.
import type { ResolvedCartItem } from "./cart";
import type { Product, ProductVariant } from "../types/product";
import {
  initMetaPixel,
  metaAddPaymentInfo,
  metaAddToCart,
  metaContact,
  metaInitiateCheckout,
  metaPageView,
  metaPurchase,
  metaViewContent,
} from "./meta-pixel";
import { trackStoreEvent } from "./store-events";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

let initialized = false;

export function initAnalytics() {
  // Antes del corte por GA_ID: son dos medidores independientes y el pixel
  // tiene que prenderse aunque el .env no tenga cargado el ID de GA4.
  initMetaPixel();

  if (!GA_ID || initialized) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageView(path: string) {
  trackEvent("page_view", { page_path: path });
  metaPageView();
}

function trackEvent(name: string, params: Record<string, unknown>) {
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

// ── E-commerce ────────────────────────────────────────────────
//
// Los cuatro eventos del embudo, con los nombres y los parámetros que GA4
// espera. Sin esto, el informe de GA4 muestra visitas pero no puede responder
// "cuántos agregaron al carrito y cuántos compraron", que es lo que se quiere
// mirar la primera semana.

/** Toda la tienda cobra en pesos; GA4 pide la moneda en cada evento. */
const CURRENCY = "ARS";

/** Una línea de producto en el formato de GA4. */
type GaItem = {
  item_id: string;
  item_name: string;
  item_category: string;
  item_variant?: string;
  price: number;
  quantity: number;
};

/** El slug es mejor `item_id` que el id numérico de Tienda Nube: es lo que se
 *  ve en la URL, así los informes de GA4 se leen sin traducir nada. */
function gaItem(
  product: Product,
  variant: ProductVariant | undefined,
  quantity: number,
): GaItem {
  return {
    item_id: product.slug,
    item_name: product.name,
    item_category: product.category,
    ...(variant ? { item_variant: variant.label } : {}),
    price: product.price,
    quantity,
  };
}

function gaItems(items: ResolvedCartItem[]): GaItem[] {
  return items.map(({ product, variant, qty }) => gaItem(product, variant, qty));
}

export function trackViewItem(product: Product, variant?: ProductVariant) {
  const item = gaItem(product, variant, 1);
  trackEvent("view_item", {
    currency: CURRENCY,
    value: product.price,
    items: [item],
  });
  metaViewContent(item);
  // En la base también: sin esto el panel cuenta fichas por `page_views`,
  // que no distingue una ficha abierta de una que cargó y se cerró.
  void trackStoreEvent("view_item", { slug: product.slug, value: product.price });
}

export function trackAddToCart(
  product: Product,
  variant: ProductVariant | undefined,
  qty: number,
) {
  const item = gaItem(product, variant, qty);
  const value = product.price * qty;
  trackEvent("add_to_cart", {
    currency: CURRENCY,
    value,
    items: [item],
  });
  metaAddToCart(item);
  // Fire-and-forget: la fila del embudo no puede demorar el drawer.
  void trackStoreEvent("add_to_cart", { slug: product.slug, qty, value });
}

export function trackBeginCheckout(items: ResolvedCartItem[], value: number) {
  const lineas = gaItems(items);
  trackEvent("begin_checkout", {
    currency: CURRENCY,
    value,
    items: lineas,
  });
  metaInitiateCheckout(lineas, value);
  // Sin `slug`: el carrito puede tener varios productos y el paso que interesa
  // medir acá es el del checkout, no el de cada línea.
  void trackStoreEvent("begin_checkout", {
    qty: items.reduce((total, item) => total + item.qty, 0),
    value,
  });
}

// ── Adentro del checkout ──────────────────────────────────────
//
// Entre "empezó el checkout" y "compró" había un agujero: 18 sesiones
// empezaron y entraron 6 pedidos, y no se sabía dónde se quedaban las otras.
// Cada paso que se pasa queda medido, con los dos eventos estándar de GA4
// para esa parte del embudo (`add_shipping_info` y `add_payment_info`).

/** Pasó del paso 1 (datos) al 2 (envío). */
export function trackCheckoutDatos(items: ResolvedCartItem[], value: number) {
  trackEvent("checkout_datos", { currency: CURRENCY, value, items: gaItems(items) });
  void trackStoreEvent("checkout_step", { detail: "envio", value });
}

/** Pasó del paso 2 (envío) al 3 (pago), con el envío que eligió. */
export function trackCheckoutEnvio(
  items: ResolvedCartItem[],
  value: number,
  envio: string,
) {
  trackEvent("add_shipping_info", {
    currency: CURRENCY,
    value,
    shipping_tier: envio,
    items: gaItems(items),
  });
  void trackStoreEvent("checkout_step", { detail: `pago:${envio}`, value });
}

/** El pedido entró a la base. Todavía no es una venta —falta cobrarla—, pero
 *  es el último paso que la tienda controla. */
export function trackOrderCreated(
  items: ResolvedCartItem[],
  value: number,
  pago: string,
  envio: string,
) {
  const lineas = gaItems(items);
  trackEvent("add_payment_info", {
    currency: CURRENCY,
    value,
    payment_type: pago,
    items: lineas,
  });
  metaAddPaymentInfo(lineas, value);
  void trackStoreEvent("order_created", { detail: `${pago}/${envio}`, value });
}

/** El pedido no entró: stock, cupón, conexión. El título del error alcanza
 *  para saber cuál fue. */
export function trackCheckoutError(motivo: string) {
  trackEvent("checkout_error", { motivo });
  void trackStoreEvent("checkout_error", { detail: motivo });
}

// ── Lo que se toca ────────────────────────────────────────────

/** Tocó un link a WhatsApp o a Instagram. Muchas ventas se cierran por
 *  mensaje: sin esto, esa persona en el panel es un carrito abandonado. */
export function trackContactClick(canal: "whatsapp" | "instagram") {
  trackEvent("contact", { method: canal, page_path: window.location.pathname });
  metaContact(canal);
  void trackStoreEvent("contact_click", { detail: canal });
}

/** Usó un filtro o un orden en la tienda. */
export function trackFilter(tipo: "categoria" | "orden", valor: string) {
  trackEvent("filter", { filter_type: tipo, filter_value: valor });
  void trackStoreEvent("filter", { detail: `${tipo}:${valor}` });
}

/** Llegó a ese porcentaje de la página. Solo a la base y a GA4: al pixel no
 *  le sirve para nada y ensucia sus informes. */
export function trackScroll(percent: 25 | 50 | 75 | 100) {
  trackEvent("scroll_depth", { percent, page_path: window.location.pathname });
  void trackStoreEvent("scroll", { qty: percent });
}

// ── La compra ─────────────────────────────────────────────────
//
// `purchase` se dispara en la pantalla de gracias, no en el checkout: recién
// ahí la compra está cerrada. El problema es que volviendo de Mercado Pago el
// carrito ya se vació y la URL solo trae el id de la orden, así que los datos
// del pedido se guardan antes de redirigir y se leen al volver.

export type PurchasePayload = {
  transaction_id: string;
  value: number;
  shipping: number;
  discount: number;
  items: GaItem[];
};

const PURCHASE_KEY = "dz-purchase-pendiente";

/** Guarda el pedido antes de mandar a la clienta a pagar. Vive en
 *  sessionStorage: sobrevive la vuelta de Mercado Pago en la misma pestaña y
 *  se borra sola al cerrarla. */
export function stashPurchase(
  orderId: string,
  items: ResolvedCartItem[],
  totals: { value: number; shipping: number; discount: number },
) {
  try {
    const payload: PurchasePayload = {
      transaction_id: orderId,
      value: totals.value,
      shipping: totals.shipping,
      discount: totals.discount,
      items: gaItems(items),
    };
    sessionStorage.setItem(PURCHASE_KEY, JSON.stringify(payload));
  } catch {
    // Navegación privada con storage bloqueado: se pierde la medición de esa
    // compra, pero la compra se hace igual. Nunca romper el checkout por esto.
  }
}

/** Manda el `purchase` y borra el guardado, así un refresh de la pantalla de
 *  gracias no cuenta la venta dos veces. Devuelve true si midió algo. */
export function trackStashedPurchase(): boolean {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(PURCHASE_KEY);
    sessionStorage.removeItem(PURCHASE_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;

  try {
    const payload = JSON.parse(raw) as PurchasePayload;
    trackEvent("purchase", { currency: CURRENCY, ...payload });
    // El pixel se cuelga acá y no de un camino propio: el borrado de arriba es
    // el único candado contra medir la venta dos veces, y así lo comparten.
    metaPurchase(payload.transaction_id, payload.items, payload.value);
    return true;
  } catch {
    return false;
  }
}

/** Descarta el pedido guardado sin medirlo: se usa cuando Mercado Pago
 *  devuelve el pago en proceso. Ni `purchase` de GA4 ni `Purchase` del pixel:
 *  una compra que todavía no está cobrada no es una venta. */
export function discardStashedPurchase() {
  try {
    sessionStorage.removeItem(PURCHASE_KEY);
  } catch {
    // idem stashPurchase
  }
}
