import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackPageView } from "../lib/analytics";
import { trackVisit } from "../lib/visits";

/** Inicializa GA4 y registra la vista en cada cambio de ruta: en GA4 y en
 *  nuestra tabla page_views, que es la que lee el panel. */
export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    // El panel no es tráfico de la tienda: no va ni a GA4 ni a page_views
    if (location.pathname.startsWith("/admin")) return;
    initAnalytics();
    trackPageView(location.pathname + location.search);
    void trackVisit(location.pathname);
  }, [location]);

  return null;
}
