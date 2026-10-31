import { Link } from "react-router-dom";
import type { Pendientes } from "../../hooks/useAdminPendientes";
import { RESERVA_HORAS } from "../../lib/admin";
import { cn } from "../../lib/cn";
import Panel from "./Panel";

type Tarea = {
  id: string;
  count: number;
  /** Singular y plural, sin el número */
  label: [string, string];
  to: string;
  /** Lo que rompe una promesa a la clienta va en amarillo */
  urgente?: boolean;
};

/**
 * Lo que espera algo de vos, en una sola lista y con el link a donde se
 * resuelve. Reemplaza los tres avisos sueltos que había arriba de Inicio: con
 * pedidos, stock y posteos en el mismo lugar se ve de un vistazo si hoy hay
 * algo para hacer o no.
 */
export default function ParaHacerHoy({ pendientes }: { pendientes: Pendientes }) {
  const todas: Tarea[] = [
    {
      id: "vencidas",
      count: pendientes.vencidas,
      label: [
        `transferencia pasó las ${RESERVA_HORAS} h sin acreditarse`,
        `transferencias pasaron las ${RESERVA_HORAS} h sin acreditarse`,
      ],
      to: "/admin/ventas?estado=vencidas",
      urgente: true,
    },
    {
      id: "despachar",
      count: pendientes.porDespachar,
      label: ["pedido para despachar", "pedidos para despachar"],
      to: "/admin/ventas?vista=kanban",
    },
    {
      id: "entregar",
      count: pendientes.porEntregar,
      label: ["retiro para entregar en el depósito", "retiros para entregar en el depósito"],
      to: "/admin/ventas?vista=kanban",
    },
    {
      id: "confirmar",
      count: pendientes.porConfirmar,
      label: ["transferencia por confirmar", "transferencias por confirmar"],
      to: "/admin/ventas?estado=pending",
    },
    {
      id: "agotadas",
      count: pendientes.agotadas,
      label: ["producto agotado", "productos agotados"],
      to: "/admin/distribucion",
    },
    {
      id: "poco-stock",
      count: pendientes.pocoStock,
      label: [
        `producto con ${pendientes.umbral} o menos unidades`,
        `productos con ${pendientes.umbral} o menos unidades`,
      ],
      to: "/admin/distribucion",
    },
    {
      id: "posteos",
      count: pendientes.posteosHoy,
      label: ["posteo para subir hoy", "posteos para subir hoy"],
      to: "/admin/contenido",
    },
  ];
  const tareas = todas.filter((tarea) => tarea.count > 0);

  return (
    <Panel title="Para hacer hoy" className="h-full">
      {pendientes.isLoading ? (
        <p className="animate-pulse py-6 text-center font-mono text-xs uppercase tracking-widest text-ink/65">
          ✦ Revisando…
        </p>
      ) : tareas.length === 0 ? (
        <div className="py-4">
          <p className="font-serif text-2xl italic">Todo al día.</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink/65">
            No hay pedidos por despachar ni transferencias por confirmar, y el
            stock está por encima del aviso.
          </p>
        </div>
      ) : (
        <ul className="-my-1 divide-y divide-ink/[0.08]">
          {tareas.map((tarea) => (
            <li key={tarea.id}>
              <Link
                to={tarea.to}
                className="group flex items-center gap-3 rounded-lg py-2.5 text-sm"
              >
                <span
                  className={cn(
                    "flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-full px-2 font-mono text-xs font-medium",
                    tarea.urgente ? "bg-amarillo" : "bg-cream",
                  )}
                >
                  {tarea.count}
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  {tarea.count === 1 ? tarea.label[0] : tarea.label[1]}
                </span>
                <span
                  aria-hidden="true"
                  className="font-mono text-xs text-ink/40 transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
