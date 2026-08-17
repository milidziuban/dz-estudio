import { useEffect } from "react";
import { prefetchPath } from "../lib/routes";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/** Precarga el chunk de una página apenas el visitante muestra intención de
 *  ir: el mouse encima del link, el foco por teclado, o el primer toque en
 *  mobile. Para cuando suelta el click, el JS ya está.
 *
 *  Va por delegación en `document` en vez de envolver cada `<Link>`: cubre
 *  también las product cards y cualquier link que agreguemos después. */
export default function RoutePrefetch() {
  useEffect(() => {
    const net = (navigator as Navigator & { connection?: NetworkInfo })
      .connection;
    // Con ahorro de datos o conexión mala, adelantarse sale más caro de lo
    // que ahorra: le comemos el ancho de banda a la página que sí está viendo.
    if (net?.saveData) return;
    if (net?.effectiveType && /(^|-)2g$/.test(net.effectiveType)) return;

    const onIntent = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      // Solo navegación interna en esta misma pestaña.
      if (anchor.origin !== window.location.origin) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      prefetchPath(anchor.pathname);
    };

    const opts = { passive: true, capture: true } as const;
    document.addEventListener("mouseover", onIntent, opts);
    document.addEventListener("focusin", onIntent, opts);
    document.addEventListener("touchstart", onIntent, opts);
    return () => {
      document.removeEventListener("mouseover", onIntent, opts);
      document.removeEventListener("focusin", onIntent, opts);
      document.removeEventListener("touchstart", onIntent, opts);
    };
  }, []);

  return null;
}
