import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  initAnalytics,
  trackContactClick,
  trackPageView,
  trackScroll,
} from "../lib/analytics";
import { trackVisit } from "../lib/visits";

const SCROLL_MARCAS = [25, 50, 75, 100] as const;

/** Inicializa GA4 y registra la vista en cada cambio de ruta: en GA4 y en
 *  nuestra tabla page_views, que es la que lee el panel.
 *
 *  Además escucha dos cosas en toda la tienda, sin tocar cada pantalla:
 *  - los clicks a WhatsApp e Instagram, estén donde estén (header, footer,
 *    carrito, checkout, contacto);
 *  - hasta dónde baja la persona en cada página (25, 50, 75 y 100%), que es lo
 *    que dice si la home se lee o se abandona arriba de todo. */
export default function Analytics() {
  const location = useLocation();
  const enTienda = !location.pathname.startsWith("/admin");

  useEffect(() => {
    // El panel no es tráfico de la tienda: no va ni a GA4 ni a page_views
    if (!enTienda) return;
    initAnalytics();
    trackPageView(location.pathname + location.search);
    void trackVisit(location.pathname);
  }, [location, enTienda]);

  // Clicks a WhatsApp e Instagram. Un solo listener en el documento: cualquier
  // link nuevo que se agregue mañana queda medido sin acordarse de nada.
  useEffect(() => {
    if (!enTienda) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (/wa\.me|whatsapp\.com/i.test(href)) trackContactClick("whatsapp");
      else if (/instagram\.com/i.test(href)) trackContactClick("instagram");
    };
    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, [enTienda]);

  // Hasta dónde baja, por página. Se reinicia en cada cambio de ruta y cada
  // marca se manda una sola vez.
  useEffect(() => {
    if (!enTienda) return;
    const alcanzadas = new Set<number>();
    let pendiente = false;

    const medir = () => {
      pendiente = false;
      const doc = document.documentElement;
      const alto = doc.scrollHeight - window.innerHeight;
      // Página más corta que la pantalla: se vio entera, pero no se mide —
      // no hubo intención de bajar.
      if (alto <= 0) return;
      const pct = ((window.scrollY + 1) / alto) * 100;
      for (const marca of SCROLL_MARCAS) {
        if (pct >= marca - 1 && !alcanzadas.has(marca)) {
          alcanzadas.add(marca);
          trackScroll(marca);
        }
      }
    };
    const onScroll = () => {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(medir);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname, enTienda]);

  return null;
}
