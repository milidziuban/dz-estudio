import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { PLIEGO_PATH } from "../../lib/pliego";
import { contenedor } from "../../lib/pliego-clases";

const SECCIONES = [
  { id: "soporte", label: "Soporte 24" },
  { id: "accesorios", label: "Accesorios" },
  { id: "armar", label: "Armalo" },
  { id: "preguntas", label: "Preguntas" },
];

/** La sección que está pasando por la pantalla. Cuenta la que cruza una
 *  línea a un tercio de la altura; arriba de la primera, ninguna. */
function useSeccionActual(activo: boolean): string | null {
  const [actual, setActual] = useState<string | null>(null);

  useEffect(() => {
    if (!activo) {
      setActual(null);
      return;
    }
    const secciones = SECCIONES.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!secciones.length) return;

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setActual(e.target.id);
        }
      },
      { rootMargin: "-33% 0px -66% 0px" },
    );
    secciones.forEach((el) => io.observe(el));

    // Arriba de todo (la portada) no hay sección marcada.
    const alSubir = () => {
      if (window.scrollY < secciones[0].offsetTop - window.innerHeight / 3) {
        setActual(null);
      }
    };
    window.addEventListener("scroll", alSubir, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", alSubir);
    };
  }, [activo]);

  return actual;
}

/** La franja de arriba de toda página de Pliego: la firma (que lleva a
 *  /pliego) y las secciones. En escritorio queda fija debajo del header y
 *  marca la sección en la que estás. Desde una ficha, las secciones vuelven
 *  a la página de Pliego en ese punto. */
export default function PliegoSubbarra() {
  const { pathname } = useLocation();
  const actual = useSeccionActual(pathname === PLIEGO_PATH);

  return (
    <div className="border-b border-pliego-linea bg-pliego-superficie lg:sticky lg:top-[4.5rem] lg:z-30">
      <div
        className={`${contenedor} flex flex-wrap items-center justify-between gap-x-8 gap-y-1 py-3`}
      >
        <Link to={PLIEGO_PATH} className="flex items-center gap-4">
          <img
            src="/pliego/pliego-firma.svg"
            alt="Pliego"
            width={228}
            height={56}
            className="h-8 w-auto"
          />
          <span className="text-[13px] leading-5 text-pliego-tinta-suave">
            de DZ Estudio
          </span>
        </Link>
        {/* En el celular la fila se desliza de costado: el degradé del borde
            avisa que hay más. */}
        <nav
          aria-label="Secciones de Pliego"
          className="-mx-2 flex max-w-full gap-x-4 overflow-x-auto text-sm [mask-image:linear-gradient(to_right,#000_85%,transparent)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-x-6 sm:[mask-image:none]"
        >
          {SECCIONES.map((s) => (
            <Link
              key={s.id}
              to={`${PLIEGO_PATH}#${s.id}`}
              aria-current={actual === s.id ? "location" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap px-2 py-2.5 underline-offset-[6px] transition-colors hover:text-pliego-salvia-texto sm:px-0",
                actual === s.id && "font-medium underline decoration-pliego-salvia decoration-2",
              )}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
