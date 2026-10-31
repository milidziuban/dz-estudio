import { useMemo } from "react";
import Button from "../Button";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import { useAdminProducts } from "../../hooks/useAdminProducts";
import { useStoreSettings } from "../../hooks/useStoreSettings";
import { useVisits } from "../../hooks/useVisits";
import { downloadCsv, formatCompactPrice, formatPercent } from "../../lib/admin";
import { proyeccionDelMes, resumenMensual } from "../../lib/admin-stats";
import { ENVIO_COSTO_REAL } from "../../lib/checkout";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";
import AdminTable from "./AdminTable";
import Panel from "./Panel";
import QueryError from "./QueryError";

/**
 * El cierre de cada mes en una tabla, del más nuevo al más viejo: lo que entró,
 * lo que costó, lo que quedó y contra la meta. Es lo que antes había que armar
 * eligiendo rangos de a uno o pasando a la planilla.
 *
 * Mira toda la historia, así que no obedece al rango de arriba (la pestaña lo
 * esconde) y baja todas las visitas: hoy son unas dos mil filas.
 */
export default function MesAMes() {
  const orders = useAdminOrders();
  const visits = useVisits("all");
  const products = useAdminProducts();
  const { data: settings } = useStoreSettings();

  const meta = settings?.precios.metaGananciaMensual ?? 0;
  const costoRealEnvio = settings?.envios.costoRealEnvio ?? ENVIO_COSTO_REAL;

  const meses = useMemo(
    () =>
      products.data
        ? resumenMensual(
            orders.data ?? [],
            visits.data ?? [],
            products.data,
            costoRealEnvio,
          ).reverse()
        : [],
    [orders.data, visits.data, products.data, costoRealEnvio],
  );

  const error = orders.error ?? visits.error ?? products.error;
  if (error) return <QueryError error={error} what="el resumen por mes" />;

  const isLoading = orders.isLoading || visits.isLoading || products.isLoading;
  const maxGanancia = Math.max(meta, ...meses.map((m) => m.ganancia.profit), 1);
  const cronologico = [...meses].reverse();

  return (
    <>
      <Panel
        title="Ganancia por mes"
        aside={meta > 0 ? `la línea es la meta: ${formatPrice(meta)}` : undefined}
      >
        {isLoading ? (
          <p className="animate-pulse py-16 text-center font-mono text-xs uppercase tracking-widest text-ink/65">
            ✦ Sumando…
          </p>
        ) : cronologico.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink/65">
            Todavía no hay actividad registrada.
          </p>
        ) : (
          <div className="relative">
            {meta > 0 && (
              <div
                aria-hidden="true"
                className="absolute inset-x-0 border-t border-dashed border-verde-ink/60"
                style={{ bottom: `calc(${(meta / maxGanancia) * 100}% * 0.75 + 2.25rem)` }}
              />
            )}
            <ul className="flex h-56 items-end gap-2 sm:gap-4">
              {cronologico.map((mes) => {
                const valor = Math.max(0, mes.ganancia.profit);
                const altura = (valor / maxGanancia) * 75;
                const cumplida = meta > 0 && mes.ganancia.profit >= meta;
                return (
                  <li key={mes.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    <span className="mb-1.5 font-mono text-[11px] text-ink/65">
                      {formatCompactPrice(mes.ganancia.profit)}
                    </span>
                    <span
                      className={cn(
                        "w-full max-w-[56px] rounded-t-md",
                        mes.enCurso
                          ? "bg-petroleo/40"
                          : cumplida
                            ? "bg-verde"
                            : "bg-petroleo",
                      )}
                      style={{ height: valor === 0 ? "2px" : `${altura}%` }}
                      title={`${mes.label}: ${formatPrice(mes.ganancia.profit)}`}
                    />
                    <span className="mt-2 h-7 text-center font-mono text-[11px] uppercase leading-tight tracking-widest text-ink/65">
                      {mes.label}
                      {mes.enCurso && <span className="block normal-case tracking-normal">en curso</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="mt-4 text-[11px] leading-relaxed text-ink/65">
          Verde: mes que llegó a la meta. Claro: el mes que corre, todavía
          abierto. Las visitas se cuentan desde el 17/08 y las ventas desde el
          lanzamiento.
        </p>
      </Panel>

      <div className="mb-3 mt-8 flex items-end justify-between gap-4">
        <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
          Cierre de cada mes
        </h2>
        <Button
          variant="secondary"
          className="px-5 py-2.5"
          disabled={meses.length === 0}
          onClick={() =>
            downloadCsv(
              "dz-mes-a-mes.csv",
              meses.map((mes) => ({
                Mes: mes.key,
                Ventas: mes.ventas,
                Unidades: mes.unidades,
                Facturacion: mes.ganancia.revenue,
                Materiales: mes.ganancia.cost,
                Envio_puesto: mes.ganancia.shipping,
                Ganancia: mes.ganancia.profit,
                "Margen %": mes.ganancia.margin.toFixed(1),
                Sesiones: mes.sesiones,
                "Conversion %": mes.conversion.toFixed(2),
                "Meta %": meta ? ((mes.ganancia.profit / meta) * 100).toFixed(0) : "",
              })),
            )
          }
        >
          Bajar CSV
        </Button>
      </div>

      <AdminTable
        columns={[
          { label: "Mes" },
          { label: "Ventas", align: "right" },
          { label: "Facturado", align: "right" },
          { label: "Materiales", align: "right", hideOnMobile: true },
          { label: "Envío puesto", align: "right", hideOnMobile: true },
          { label: "Ganancia", align: "right" },
          { label: "Margen", align: "right", hideOnMobile: true },
          { label: "Sesiones", align: "right", hideOnMobile: true },
          { label: "Conversión", align: "right", hideOnMobile: true },
          { label: "Meta", align: "right" },
        ]}
        isLoading={isLoading}
        isEmpty={meses.length === 0}
      >
        {meses.map((mes) => {
          const avance = meta ? (mes.ganancia.profit / meta) * 100 : null;
          const proyeccion = mes.enCurso ? proyeccionDelMes(mes.ganancia.profit) : null;
          return (
            <tr key={mes.key} className="border-b border-ink/[0.06]">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs uppercase tracking-widest">
                {mes.label}
                {mes.enCurso && (
                  <span className="ml-2 rounded-full bg-celeste px-2 py-0.5 text-[11px] normal-case tracking-normal">
                    en curso
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {mes.ventas}
                <span className="text-ink/45"> · {mes.unidades} u</span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {mes.ganancia.revenue ? formatPrice(mes.ganancia.revenue) : "—"}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink/65 sm:table-cell">
                {mes.ganancia.cost ? formatPrice(mes.ganancia.cost) : "—"}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink/65 sm:table-cell">
                {mes.ganancia.shipping ? formatPrice(mes.ganancia.shipping) : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs font-medium">
                {mes.ganancia.revenue ? formatPrice(mes.ganancia.profit) : "—"}
                {proyeccion !== null && (
                  <span className="block text-[11px] font-normal text-ink/50">
                    cierra ~{formatCompactPrice(proyeccion)}
                  </span>
                )}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink/65 sm:table-cell">
                {mes.ganancia.revenue ? formatPercent(mes.ganancia.margin, 0) : "—"}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink/65 sm:table-cell">
                {mes.sesiones.toLocaleString("es-AR")}
              </td>
              <td className="hidden px-4 py-3 text-right font-mono text-xs text-ink/65 sm:table-cell">
                {mes.sesiones ? formatPercent(mes.conversion, 1) : "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono text-xs">
                {avance === null ? (
                  "—"
                ) : (
                  <span className={cn(avance >= 100 && "text-verde-ink font-medium")}>
                    {formatPercent(Math.max(0, avance), 0)}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </>
  );
}
