import { useCallback, useEffect, useState } from "react";

/** Cuánto hay que scrollear en una dirección antes de reaccionar: evita
 *  que un dedo que tiembla abra y cierre la fila todo el tiempo. */
const THRESHOLD = 8;
/** Arriba de esta altura la fila se queda siempre abierta. */
const MIN_Y = 80;

/** Devuelve `hidden` cuando la página scrollea hacia abajo y lo vuelve a
 *  poner en `false` apenas se scrollea hacia arriba o se llega al tope.
 *  `show()` fuerza el estado visible (por ejemplo, cuando el contenido
 *  escondido recibe foco desde el teclado). */
export function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (y <= MIN_Y) {
          setHidden(false);
        } else if (delta > THRESHOLD) {
          setHidden(true);
        } else if (delta < -THRESHOLD) {
          setHidden(false);
        }
        if (Math.abs(delta) > THRESHOLD || y <= MIN_Y) lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const show = useCallback(() => setHidden(false), []);

  return { hidden, show };
}
