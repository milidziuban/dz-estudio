import { Link } from "react-router-dom";
import { PLIEGO_PATH } from "../../lib/pliego";
import { contenedor } from "../../lib/pliego-clases";

const SECCIONES = [
  { id: "soporte", label: "Soporte 24" },
  { id: "accesorios", label: "Accesorios" },
  { id: "sistema", label: "Sistema completo" },
  { id: "medidas", label: "Medidas" },
  { id: "preguntas", label: "Preguntas" },
];

/** La franja de arriba de toda página de Pliego: la firma (que lleva a
 *  /pliego) y las secciones. Desde una ficha, las secciones vuelven a la
 *  página de Pliego en ese punto. */
export default function PliegoSubbarra() {
  return (
    <div className="border-b border-pliego-linea bg-pliego-superficie">
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
        <nav
          aria-label="Secciones de Pliego"
          className="-mx-2 flex max-w-full gap-x-4 overflow-x-auto text-sm [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-x-6"
        >
          {SECCIONES.map((s) => (
            <Link
              key={s.id}
              to={`${PLIEGO_PATH}#${s.id}`}
              className="shrink-0 whitespace-nowrap px-2 py-2.5 hover:text-pliego-salvia-texto sm:px-0"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
