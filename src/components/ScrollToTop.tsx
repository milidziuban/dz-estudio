import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** Al cambiar de página arranca arriba. Con un ancla (`/pliego#accesorios`,
 *  desde una ficha) va a esa sección: la página es lazy y puede tardar en
 *  montarse, así que se la busca un rato antes de rendirse. Llegando de otra
 *  página el salto es directo; dentro de la misma, con el scroll suave. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const anterior = useRef(pathname);

  useEffect(() => {
    const mismaPagina = anterior.current === pathname;
    anterior.current = pathname;

    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    let intentos = 0;
    let timer: number;
    const buscar = () => {
      const destino = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (destino) {
        destino.scrollIntoView({ behavior: mismaPagina ? "smooth" : "instant" });
      } else if (intentos++ < 40) {
        timer = window.setTimeout(buscar, 50);
      }
    };
    buscar();
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}
