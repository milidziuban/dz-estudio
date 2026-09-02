// Google Analytics 4 — el ID se configura con VITE_GA_ID en el .env.
// Si no hay ID, todo es no-op (útil en desarrollo).
import type { ResolvedCartItem } from "./cart";
import type { Product, ProductVariant } from "../types/product";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

let initialized = false;

export function initAnalytics() {
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
  trackEvent("view_item", {
    currency: CURRENCY,
    value: product.price,
    items: [gaItem(product, variant, 1)],
  });
}

export function trackAddToCart(
  product: Product,
  variant: ProductVariant | undefined,
  qty: number,
) {
  trackEvent("add_to_cart", {
    currency: CURRENCY,
    value: product.price * qty,
    items: [gaItem(product, variant, qty)],
  });
}

export function trackBeginCheckout(items: ResolvedCartItem[], value: number) {
  trackEvent("begin_checkout", {
    currency: CURRENCY,
    value,
    items: gaItems(items),
  });
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
    return true;
  } catch {
    return false;
  }
}

/** Descarta el pedido guardado sin medirlo: se usa cuando Mercado Pago
 *  devuelve el pago en proceso. */
export function discardStashedPurchase() {
  try {
    sessionStorage.removeItem(PURCHASE_KEY);
  } catch {
    // idem stashPurchase
  }
}
