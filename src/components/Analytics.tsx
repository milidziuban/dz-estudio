import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initAnalytics, trackPageView } from "../lib/analytics";

/** Inicializa GA4 y registra un page_view en cada cambio de ruta. */
export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}
