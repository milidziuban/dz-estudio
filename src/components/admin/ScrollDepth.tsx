import { formatPercent } from "../../lib/admin";
import type { Profundidad } from "../../lib/admin-stats";

/**
 * Hasta dónde baja la gente en una página: de cada cien que la abren, cuántas
 * llegan a la cuarta parte, a la mitad, a tres cuartos y al final.
 *
 * Una barra por marca, todas contra el mismo 100%, así la caída se ve sola.
 * Lo que no llega al 25% es gente que miró la primera pantalla y se fue.
 */
export default function ScrollDepth({ datos }: { datos: Profundidad }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm">{datos.label}</p>
        <p className="font-mono text-[11px] text-ink/65">
          {datos.sesiones.toLocaleString("es-AR")}{" "}
          {datos.sesiones === 1 ? "sesión" : "sesiones"}
        </p>
      </div>
      <ul className="space-y-2">
        {datos.marcas.map((marca) => (
          <li key={marca.pct} className="flex items-center gap-3">
            <span className="w-16 shrink-0 font-mono text-[11px] text-ink/65">
              {marca.pct === 100 ? "el final" : `${marca.pct}%`}
            </span>
            <span
              aria-hidden="true"
              className="h-2 flex-1 rounded-full bg-ink/[0.07]"
            >
              <span
                className="block h-full rounded-full bg-petroleo"
                style={{ width: `${marca.alcanzo}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-mono text-xs">
              {formatPercent(marca.alcanzo, 0)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-ink/65">
        {formatPercent(100 - (datos.marcas[0]?.alcanzo ?? 0), 0)} no bajó ni un
        cuarto de la página.
      </p>
    </div>
  );
}
