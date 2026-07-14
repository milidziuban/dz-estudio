// Google Analytics 4 — el ID se configura con VITE_GA_ID en el .env.
// Si no hay ID, todo es no-op (útil en desarrollo).
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
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", { page_path: path });
}
