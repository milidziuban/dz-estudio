import { useState } from "react";
import { cn } from "../../lib/cn";

export type TrendPoint = {
  /** Clave estable (YYYY-MM-DD o YYYY-WW) */
  key: string;
  /** Etiqueta del eje: "12 ago", "sem. 12 ago", "ago 26" */
  label: string;
  value: number;
};

type TrendChartProps = {
  points: TrendPoint[];
  formatValue: (value: number) => string;
  /** Se lee arriba a la derecha cuando no hay ninguna barra apuntada */
  summaryLabel: string;
  summaryValue: string;
  emptyLabel?: string;
};

/**
 * Serie temporal en barras. Va en HTML y no en SVG a propósito: las alturas en
 * porcentaje se adaptan a cualquier ancho sin deformar tipografías ni trazos,
 * y el hover es un elemento real (se puede tabular con el teclado).
 *
 * Una sola serie por gráfico. Facturación y visitas están en escalas distintas,
 * así que van en dos gráficos separados y nunca en dos ejes del mismo.
 */
export default function TrendChart({
  points,
  formatValue,
  summaryLabel,
  summaryValue,
  emptyLabel = "Todavía no hay datos en este período.",
}: TrendChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(...points.map((p) => p.value), 0);
  const active = hovered === null ? null : points[hovered];
  const maxIndex = points.findIndex((p) => p.value === max && max > 0);

  if (points.length === 0 || max === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-ink/45">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div>
      {/* Lectura única: en vez de un tooltip flotante que se corta en los
          bordes, el valor apuntado se muestra siempre en el mismo lugar. */}
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/45">
          {active ? active.label : summaryLabel}
        </p>
        <p className="font-mono text-sm font-medium">
          {active ? formatValue(active.value) : summaryValue}
        </p>
      </div>

      <div className="relative mt-3">
        {/* Referencia del máximo */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 border-t border-dashed border-ink/15"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 border-t border-ink/[0.07]"
        />

        <ul
          className="relative flex h-40 items-end gap-[2px]"
          onMouseLeave={() => setHovered(null)}
        >
          {points.map((point, index) => {
            const height = max === 0 ? 0 : (point.value / max) * 100;
            return (
              <li key={point.key} className="flex h-full flex-1 items-end">
                <button
                  type="button"
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${point.label}: ${formatValue(point.value)}`}
                  className="group flex h-full w-full items-end justify-center rounded-t-[4px]"
                >
                  <span
                    className={cn(
                      "w-full rounded-t-[4px] transition-colors",
                      hovered === index
                        ? "bg-ink"
                        : point.value === 0
                          ? "bg-ink/10"
                          : "bg-petroleo group-hover:bg-ink",
                    )}
                    style={{
                      // Las barras en cero se ven igual: una línea de base que
                      // aclara que ese día existió y no vendió nada.
                      height: point.value === 0 ? "2px" : `max(3px, ${height}%)`,
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink/40">
        <span>{points[0].label}</span>
        {points.length > 2 && (
          <span className="hidden sm:inline">
            {points[Math.floor(points.length / 2)].label}
          </span>
        )}
        <span>{points[points.length - 1].label}</span>
      </div>

      {maxIndex >= 0 && (
        <p className="mt-3 text-[11px] text-ink/45">
          ✦ Pico: {points[maxIndex].label} · {formatValue(max)}
        </p>
      )}
    </div>
  );
}
