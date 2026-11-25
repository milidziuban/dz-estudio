import { formatPercent } from "../../lib/admin";
import { formatPrice } from "../../lib/format";
import type { FilaPublico } from "../../lib/meta-ads";

/** En qué gente se fue la plata. La barra es la parte del gasto; al lado, los
 *  clics que trajo, que es lo que dice si valió la pena. */
export default function MetaPublicoList({ filas }: { filas: FilaPublico[] }) {
  const max = Math.max(...filas.map((f) => f.parte), 1);

  return (
    <ul className="space-y-3">
      {filas.map((fila) => (
        <li key={fila.valor}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{fila.valor}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums">
              {formatPercent(fila.parte, 0)}
              <span className="ml-2 text-ink/65">
                {formatPrice(Math.round(fila.gasto))} ·{" "}
                {fila.clics.toLocaleString("es-AR")}{" "}
                {fila.clics === 1 ? "clic" : "clics"}
              </span>
            </span>
          </div>
          <div
            aria-hidden="true"
            className="mt-1.5 h-1 rounded-full bg-ink/[0.07]"
          >
            <div
              className="h-full rounded-full bg-petroleo"
              style={{ width: `${(fila.parte / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
