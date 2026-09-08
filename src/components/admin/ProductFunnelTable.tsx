import { useMemo, useState } from "react";
import AdminTable from "./AdminTable";
import Button from "../Button";
import { downloadCsv, formatPercent, type RangeId } from "../../lib/admin";
import { cn } from "../../lib/cn";
import {
  MIN_VISTAS_SENAL,
  type ProductFunnel,
  type ProductFunnelRow,
  type ProductSignal,
} from "../../lib/admin-stats";

/** Cortos a propósito: el rótulo entra en una línea en la columna de mobile,
 *  que mide 8,5rem. */
const SIGNAL_LABEL: Record<ProductSignal, string> = {
  "mirado-sin-vender": "se mira, no vende",
  "convierte-poco": "convierte poco",
};

type SortKey = "name" | "views" | "units" | "orders" | "conversion";
type Sort = { key: SortKey; dir: "asc" | "desc" };

function compare(a: ProductFunnelRow, b: ProductFunnelRow, key: SortKey) {
  if (key === "name") return a.name.localeCompare(b.name, "es-AR");
  return a[key] - b[key];
}

type ProductFunnelTableProps = {
  funnel: ProductFunnel;
  isLoading: boolean;
  /** Solo para nombrar el CSV */
  range: RangeId;
};

/**
 * Qué se mira y qué se vende, ficha por ficha.
 *
 * La fila marcada en lila es la que hay que mirar: se cruzan las dos columnas
 * sin que nadie tenga que hacer la división de cabeza. La barra abajo del
 * nombre son las vistas contra la ficha más vista del período.
 */
export default function ProductFunnelTable({
  funnel,
  isLoading,
  range,
}: ProductFunnelTableProps) {
  const [sort, setSort] = useState<Sort | null>(null);

  const toggleSort = (key: string) => {
    setSort((current) => {
      if (current?.key !== key) return { key: key as SortKey, dir: "desc" };
      if (current.dir === "desc") return { key: current.key, dir: "asc" };
      // Tercer click: vuelve al orden que propone la pantalla
      return null;
    });
  };

  const rows = useMemo(() => {
    if (!sort) return funnel.rows;
    const ordenadas = [...funnel.rows].sort((a, b) =>
      compare(a, b, sort.key),
    );
    return sort.dir === "desc" ? ordenadas.reverse() : ordenadas;
  }, [funnel.rows, sort]);

  const maxViews = useMemo(
    () => funnel.rows.reduce((max, row) => Math.max(max, row.views), 0),
    [funnel.rows],
  );

  // Nada que cruzar: ni una ficha vista ni una venta cobrada en el período.
  const sinDatos = funnel.views === 0 && funnel.orders === 0;
  // Hay tráfico pero todavía no entró una venta: la columna de conversión
  // existe y da cero en todas las filas. Conviene decirlo antes de que
  // alguien lea esos ceros como un problema de los productos.
  const sinVentas = funnel.views > 0 && funnel.orders === 0;

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
            Qué se mira y qué se vende
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
            Vistas de cada ficha contra lo que salió de ella. La conversión es
            órdenes cobradas dividido vistas; el rótulo en lila marca las fichas
            que se miran y no se venden, desde las {MIN_VISTAS_SENAL} vistas
            para arriba.
          </p>
        </div>
        {!sinDatos && (
          <Button
            variant="secondary"
            className="shrink-0 px-5 py-2.5"
            onClick={() =>
              downloadCsv(
                `dz-productos-conversion-${range}.csv`,
                rows.map((row) => ({
                  Producto: row.name,
                  Slug: row.slug,
                  Vistas: row.views,
                  Sesiones: row.sessions,
                  Unidades: row.units,
                  Ordenes: row.orders,
                  "Conversion %": row.conversion.toFixed(2),
                })),
              )
            }
          >
            Bajar CSV
          </Button>
        )}
      </div>

      {sinDatos ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center">
          <p className="mx-auto max-w-md text-sm leading-relaxed text-ink/65">
            {isLoading
              ? "✦ Cargando…"
              : "En este período no hubo ni una vista de ficha ni una venta cobrada. No hay nada que cruzar: la tabla se arma sola con el primer visitante."}
          </p>
        </div>
      ) : (
        <>
          {sinVentas && (
            <p className="mb-3 rounded-2xl bg-white px-5 py-4 text-sm leading-relaxed text-ink/65">
              ✦ Hay visitas, pero todavía no entró ninguna venta cobrada en el
              período: la conversión da cero en todas las fichas y no ordena
              nada. Por ahora la tabla sirve para ver qué se mira.
            </p>
          )}

          <AdminTable
            columns={[
              { label: "Producto", sortKey: "name" },
              { label: "Vistas", align: "right", sortKey: "views" },
              {
                label: "Unidades",
                align: "right",
                sortKey: "units",
                hideOnMobile: true,
              },
              {
                label: "Órdenes",
                align: "right",
                sortKey: "orders",
                hideOnMobile: true,
              },
              { label: "Conv.", align: "right", sortKey: "conversion" },
            ]}
            sort={sort}
            onSortChange={toggleSort}
            isLoading={isLoading}
            isEmpty={rows.length === 0}
            empty="El catálogo está vacío y nadie miró ninguna ficha."
          >
            {rows.map((row) => (
              <tr
                key={row.slug}
                className="border-b border-ink/[0.06] transition-colors last:border-0 hover:bg-ink/[0.02]"
              >
                <td className="px-3 py-3 sm:px-4">
                  {/* En mobile la columna mide 8,5rem: ahí el nombre baja de
                      línea en vez de cortarse, porque "Almohadón Rombo…" no
                      distingue el celeste del rosa. */}
                  <div className="max-w-[8.5rem] text-sm sm:max-w-xs sm:truncate">
                    {row.name}
                  </div>
                  {!row.inCatalog && (
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                      fuera del catálogo
                    </p>
                  )}
                  {row.signal && (
                    <span className="mt-1.5 inline-block whitespace-nowrap rounded-full bg-lila px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
                      {SIGNAL_LABEL[row.signal]}
                    </span>
                  )}
                  <div
                    aria-hidden="true"
                    className="mt-1.5 h-1 max-w-[8.5rem] rounded-full bg-ink/[0.07] sm:max-w-xs"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        row.signal ? "bg-lila" : "bg-petroleo",
                      )}
                      style={{
                        width: maxViews ? `${(row.views / maxViews) * 100}%` : 0,
                      }}
                    />
                  </div>
                </td>
                <td className="px-3 py-3 text-right align-top font-mono text-xs sm:px-4">
                  {row.views.toLocaleString("es-AR")}
                </td>
                <td className="hidden px-3 py-3 text-right align-top font-mono text-xs sm:table-cell sm:px-4">
                  {row.units || "—"}
                </td>
                <td className="hidden px-3 py-3 text-right align-top font-mono text-xs sm:table-cell sm:px-4">
                  {row.orders || "—"}
                </td>
                <td
                  className={cn(
                    "px-3 py-3 text-right align-top font-mono text-xs sm:px-4",
                    row.signal ? "font-medium text-ink" : "text-ink/65",
                  )}
                >
                  {row.views ? formatPercent(row.conversion, 1) : "—"}
                </td>
              </tr>
            ))}
          </AdminTable>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink/50">
            {funnel.views.toLocaleString("es-AR")} vistas de ficha ·{" "}
            {funnel.units} {funnel.units === 1 ? "unidad" : "unidades"} ·{" "}
            {funnel.orders} {funnel.orders === 1 ? "orden" : "órdenes"} ·
            promedio {formatPercent(funnel.conversion, 1)}
          </p>
        </>
      )}
    </section>
  );
}
