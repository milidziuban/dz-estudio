import { useMemo, useState } from "react";
import AdminTable from "../../components/admin/AdminTable";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import RangeTabs from "../../components/admin/RangeTabs";
import StatCard from "../../components/admin/StatCard";
import TrendChart from "../../components/admin/TrendChart";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import { useVisits } from "../../hooks/useVisits";
import {
  PAYMENT_LABEL,
  SHIPPING_METHOD_LABEL,
  dayKey,
  downloadCsv,
  formatCompactPrice,
  formatPercent,
  isPaid,
  variation,
  type RangeId,
} from "../../lib/admin";
import {
  bucketFor,
  bucketStart,
  buildSeries,
  kpisFor,
  ordersIn,
  periodFor,
  topPaths,
  topReferrers,
  visitsIn,
} from "../../lib/admin-stats";
import Button from "../../components/Button";
import { formatPrice } from "../../lib/format";

/** Barra horizontal para los rankings de tráfico. */
function RankingList({
  items,
  emptyLabel,
}: {
  items: { label: string; count: number }[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-ink/45">{emptyLabel}</p>;
  }
  const max = items[0].count;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-mono text-xs">{item.label}</span>
            <span className="shrink-0 font-mono text-xs text-ink/55">
              {item.count.toLocaleString("es-AR")}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="mt-1.5 h-1 rounded-full bg-ink/[0.07]"
          >
            <div
              className="h-full rounded-full bg-petroleo"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminEstadisticas() {
  const [range, setRange] = useState<RangeId>("30d");
  const orders = useAdminOrders();
  const visits = useVisits(range);

  const allOrders = orders.data ?? [];
  const allVisits = visits.data ?? [];

  const data = useMemo(() => {
    const period = periodFor(range, allOrders, allVisits);
    const bucket = bucketFor(period.from, period.to);
    const currentOrders = ordersIn(allOrders, period.from, period.to);
    const currentVisits = visitsIn(allVisits, period.from, period.to);

    const visitasSerie = buildSeries(
      currentVisits.map((visit) => ({
        date: new Date(visit.createdAt),
        value: 1,
      })),
      period,
      bucket,
    );

    // Sesiones únicas por bucket: no se pueden sumar como las vistas, hay que
    // contar ids distintos dentro de cada tramo.
    const sesionesPorBucket = new Map<string, Set<string>>();
    for (const visit of currentVisits) {
      const key = dayKey(bucketStart(new Date(visit.createdAt), bucket));
      const set = sesionesPorBucket.get(key) ?? new Set<string>();
      set.add(visit.sessionId);
      sesionesPorBucket.set(key, set);
    }

    const ventasSerie = buildSeries(
      currentOrders.filter(isPaid).map((order) => ({
        date: new Date(order.createdAt),
        value: 1,
      })),
      period,
      bucket,
    );
    const facturacionSerie = buildSeries(
      currentOrders.filter(isPaid).map((order) => ({
        date: new Date(order.createdAt),
        value: order.total,
      })),
      period,
      bucket,
    );

    const tabla = visitasSerie.map((point, index) => {
      const sesiones = sesionesPorBucket.get(point.key)?.size ?? 0;
      const ventas = ventasSerie[index]?.value ?? 0;
      return {
        key: point.key,
        label: point.label,
        visitas: point.value,
        sesiones,
        ventas,
        facturacion: facturacionSerie[index]?.value ?? 0,
        conversion: sesiones ? (ventas / sesiones) * 100 : 0,
      };
    });

    // Solo las páginas de producto, para ver qué se mira más
    const productos = topPaths(
      currentVisits.filter((visit) => visit.path.startsWith("/producto/")),
      6,
    ).map((item) => ({
      label: item.label.replace("/producto/", ""),
      count: item.count,
    }));

    const porPago = new Map<string, number>();
    const porEnvio = new Map<string, number>();
    const porProvincia = new Map<string, number>();
    for (const order of currentOrders.filter(isPaid)) {
      const pago = PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod;
      porPago.set(pago, (porPago.get(pago) ?? 0) + 1);
      const envio =
        SHIPPING_METHOD_LABEL[order.shippingMethod] ?? order.shippingMethod;
      porEnvio.set(envio, (porEnvio.get(envio) ?? 0) + 1);
      const provincia = order.shippingAddress?.provincia || "Sin dato";
      porProvincia.set(provincia, (porProvincia.get(provincia) ?? 0) + 1);
    }

    const toRanking = (map: Map<string, number>) =>
      [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    return {
      period,
      bucket,
      actual: kpisFor(currentOrders, currentVisits),
      anterior: period.prevFrom
        ? kpisFor(
            ordersIn(allOrders, period.prevFrom, period.prevTo),
            visitsIn(allVisits, period.prevFrom, period.prevTo),
          )
        : null,
      visitasSerie,
      tabla,
      paginas: topPaths(currentVisits, 6),
      origenes: topReferrers(currentVisits, 6),
      productos,
      porPago: toRanking(porPago),
      porEnvio: toRanking(porEnvio),
      porProvincia: toRanking(porProvincia).slice(0, 6),
    };
  }, [range, allOrders, allVisits]);

  const { actual, anterior } = data;
  const vistasPorSesion = actual.sesiones
    ? actual.visitas / actual.sesiones
    : 0;

  const bucketLabel =
    data.bucket === "day" ? "Día" : data.bucket === "week" ? "Semana" : "Mes";

  return (
    <>
      <PageHeading
        title={
          <>
            Estadísticas de{" "}
            <em className="font-serif font-normal italic text-lila">tráfico</em>
          </>
        }
        description="Visitas propias del sitio, de dónde llegan y cómo se convierten en ventas. Google Analytics sigue midiendo aparte, con más detalle."
      >
        <RangeTabs value={range} onChange={setRange} />
      </PageHeading>

      {visits.error ? (
        <QueryError error={visits.error} what="las visitas" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Vistas de página"
              value={actual.visitas.toLocaleString("es-AR")}
              variation={
                anterior ? variation(actual.visitas, anterior.visitas) : null
              }
            />
            <StatCard
              label="Sesiones"
              value={actual.sesiones.toLocaleString("es-AR")}
              hint={`${vistasPorSesion.toFixed(1)} páginas por sesión`}
              variation={
                anterior ? variation(actual.sesiones, anterior.sesiones) : null
              }
            />
            <StatCard
              label="Conversión"
              value={actual.sesiones ? formatPercent(actual.conversion, 2) : "—"}
              hint={`${actual.ventas} ${actual.ventas === 1 ? "venta" : "ventas"}`}
              variation={
                anterior
                  ? variation(actual.conversion, anterior.conversion)
                  : null
              }
            />
            <StatCard
              label="Facturación"
              value={formatCompactPrice(actual.facturacion)}
              variation={
                anterior
                  ? variation(actual.facturacion, anterior.facturacion)
                  : null
              }
            />
          </div>

          <section className="mt-3 rounded-2xl bg-white p-6">
            <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
              Visitas por {bucketLabel.toLowerCase()}
            </h2>
            <TrendChart
              points={data.visitasSerie}
              formatValue={(value) => `${value.toLocaleString("es-AR")} vistas`}
              summaryLabel="Total del período"
              summaryValue={`${actual.visitas.toLocaleString("es-AR")} vistas`}
            />
          </section>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <section className="rounded-2xl bg-white p-6">
              <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
                Páginas más vistas
              </h2>
              <RankingList
                items={data.paginas}
                emptyLabel="Sin visitas registradas."
              />
            </section>
            <section className="rounded-2xl bg-white p-6">
              <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
                De dónde llegan
              </h2>
              <RankingList
                items={data.origenes}
                emptyLabel="Sin orígenes registrados."
              />
            </section>
            <section className="rounded-2xl bg-white p-6">
              <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
                Productos más mirados
              </h2>
              <RankingList
                items={data.productos}
                emptyLabel="Sin visitas a productos."
              />
            </section>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <section className="rounded-2xl bg-white p-6">
              <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
                Cómo pagan
              </h2>
              <RankingList
                items={data.porPago}
                emptyLabel="Sin ventas cobradas."
              />
            </section>
            <section className="rounded-2xl bg-white p-6">
              <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
                Cómo lo reciben
              </h2>
              <RankingList
                items={data.porEnvio}
                emptyLabel="Sin ventas cobradas."
              />
            </section>
            <section className="rounded-2xl bg-white p-6">
              <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
                A qué provincias
              </h2>
              <RankingList
                items={data.porProvincia}
                emptyLabel="Sin ventas cobradas."
              />
            </section>
          </div>

          {/* Los mismos números del gráfico, en tabla: se leen exacto y se
              pueden bajar a un CSV. */}
          <div className="mt-8 mb-3 flex items-end justify-between gap-4">
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
              Detalle {data.bucket === "day" ? "diario" : `por ${bucketLabel.toLowerCase()}`}
            </h2>
            <Button
              variant="secondary"
              className="px-5 py-2.5"
              onClick={() =>
                downloadCsv(
                  `dz-estadisticas-${range}.csv`,
                  data.tabla.map((row) => ({
                    [bucketLabel]: row.label,
                    Visitas: row.visitas,
                    Sesiones: row.sesiones,
                    Ventas: row.ventas,
                    Facturacion: row.facturacion,
                    "Conversion %": row.conversion.toFixed(2),
                  })),
                )
              }
            >
              Bajar CSV
            </Button>
          </div>

          <AdminTable
            columns={[
              { label: bucketLabel },
              { label: "Visitas", align: "right" },
              { label: "Sesiones", align: "right" },
              { label: "Ventas", align: "right" },
              { label: "Facturación", align: "right" },
              { label: "Conversión", align: "right", hideOnMobile: true },
            ]}
            isLoading={visits.isLoading || orders.isLoading}
            isEmpty={data.tabla.length === 0}
          >
            {[...data.tabla].reverse().map((row) => (
              <tr key={row.key} className="border-b border-ink/[0.06]">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                  {row.label}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {row.visitas.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {row.sesiones.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {row.ventas}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {row.facturacion ? formatPrice(row.facturacion) : "—"}
                </td>
                <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-ink/55 sm:table-cell">
                  {row.sesiones ? formatPercent(row.conversion, 1) : "—"}
                </td>
              </tr>
            ))}
          </AdminTable>
        </>
      )}
    </>
  );
}
