import { cn } from "../../lib/cn";
import { formatPercent } from "../../lib/admin";
import type { FunnelStep } from "../../lib/admin-stats";

/**
 * El embudo, de arriba hacia abajo. Cada barra mide contra el primer paso, así
 * la forma se lee de un vistazo; el número que importa —cuántos pasaron del
 * paso anterior a éste— va en el renglón de al lado y no adentro de la barra,
 * que es donde se vuelve ilegible cuando la barra es corta.
 *
 * Una sola dupla de color: petróleo para el camino y verde para el final, que
 * es el único paso que es plata.
 */
export default function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const inicio = steps[0]?.count ?? 0;

  if (inicio === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink/65">
        Todavía no hay visitas en este período.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {steps.map((step, index) => {
        const ultimo = index === steps.length - 1;
        // Se pierde entre este paso y el anterior. En el primero no hay
        // anterior, así que no se pierde nada: no se muestra.
        const caida =
          step.desdeElAnterior === null ? null : 100 - step.desdeElAnterior;

        return (
          <li key={step.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm">
                {step.label}
                {step.nota && (
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                    {step.nota}
                  </span>
                )}
              </p>
              <p className="font-mono text-sm font-medium tracking-wider">
                {step.count.toLocaleString("es-AR")}
                <span className="ml-2 text-xs font-normal text-ink/65">
                  {formatPercent(step.desdeElInicio, 1)}
                </span>
              </p>
            </div>

            <div
              aria-hidden="true"
              className="mt-2 h-2 rounded-full bg-ink/[0.07]"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-[width]",
                  ultimo ? "bg-verde" : "bg-petroleo",
                )}
                style={{
                  // Mínimo visible: un paso con 1 sola sesión sobre 600 tiene
                  // que verse igual, o parece que no pasó nunca.
                  width:
                    step.count === 0
                      ? "0%"
                      : `max(3px, ${step.desdeElInicio}%)`,
                }}
              />
            </div>

            {caida !== null && (
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                {caida <= 0
                  ? "sin caída respecto del paso anterior"
                  : `se cae ${formatPercent(caida, 0)} del paso anterior`}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
