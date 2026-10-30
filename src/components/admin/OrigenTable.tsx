import { formatPercent } from "../../lib/admin";
import type { FilaDeOrigen } from "../../lib/admin-stats";

/**
 * Sesiones agrupadas (por origen, por campaña, por aparato) y qué hizo cada
 * grupo. La pregunta que contesta no es "de dónde viene más gente" sino "de
 * dónde viene la gente que compra": cien visitas que se van en la home valen
 * menos que diez que agregan al carrito.
 */
export default function OrigenTable({
  filas,
  primera,
  emptyLabel,
}: {
  filas: FilaDeOrigen[];
  /** Encabezado de la primera columna */
  primera: string;
  emptyLabel: string;
}) {
  if (filas.length === 0) {
    return <p className="py-8 text-center text-sm text-ink/65">{emptyLabel}</p>;
  }

  const max = filas[0].sesiones;
  const th =
    "px-3 py-2 text-right font-mono text-[10px] font-medium uppercase tracking-widest text-ink/65";
  const td = "px-3 py-2.5 text-right font-mono text-xs";

  return (
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-ink/10">
            <th className={`${th} text-left`}>{primera}</th>
            <th className={th}>Sesiones</th>
            <th className={th} title="Vieron más de una página">
              Siguieron
            </th>
            <th className={th}>Carrito</th>
            <th className={th}>Checkout</th>
            <th className={th} title="Tocaron WhatsApp o Instagram">
              Escribieron
            </th>
            <th className={th} title="Pedidos confirmados, desde el 30/10">
              Pedidos
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.label} className="border-b border-ink/[0.06]">
              <td className="max-w-[14rem] px-3 py-2.5">
                <span className="block truncate font-mono text-xs">
                  {fila.label}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1.5 block h-1 rounded-full bg-ink/[0.07]"
                >
                  <span
                    className="block h-full rounded-full bg-petroleo"
                    style={{ width: `${(fila.sesiones / max) * 100}%` }}
                  />
                </span>
              </td>
              <td className={td}>{fila.sesiones.toLocaleString("es-AR")}</td>
              <td className={`${td} text-ink/65`}>
                {formatPercent(fila.siguieron, 0)}
              </td>
              <td className={td}>{formatPercent(fila.agregaron, 1)}</td>
              <td className={td}>{formatPercent(fila.checkout, 1)}</td>
              <td className={td}>{formatPercent(fila.escribieron, 1)}</td>
              <td className={td}>{fila.pedidos || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
