import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AhoraMismo from "../../components/admin/AhoraMismo";
import MetaDelMes from "../../components/admin/MetaDelMes";
import PageHeading from "../../components/admin/PageHeading";
import Panel from "../../components/admin/Panel";
import ParaHacerHoy from "../../components/admin/ParaHacerHoy";
import QueryError from "../../components/admin/QueryError";
import RangeTabs from "../../components/admin/RangeTabs";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import TrendChart from "../../components/admin/TrendChart";
import { useAdminOrders } from "../../hooks/useAdminOrders";
import { useAdminPendientes } from "../../hooks/useAdminPendientes";
import { useAdminProducts } from "../../hooks/useAdminProducts";
import { useStoreSettings } from "../../hooks/useStoreSettings";
import { useVisits } from "../../hooks/useVisits";
import {
  formatCompactPrice,
  formatDate,
  formatPercent,
  isPaid,
  orderRevenue,
  variation,
  type RangeId,
} from "../../lib/admin";
import {
  bucketFor,
  bucketKey,
  bucketStart,
  buildSeries,
  kpisFor,
  ordersIn,
  periodFor,
  profitFor,
  topProducts,
  visitsIn,
} from "../../lib/admin-stats";
import { ENVIO_COSTO_REAL } from "../../lib/checkout";
import { cn } from "../../lib/cn";
import { formatPrice } from "../../lib/format";

const METRICAS = [
  { id: "facturacion", label: "Facturación" },
  { id: "ventas", label: "Ventas" },
  { id: "visitas", label: "Visitas" },
] as const;
type Metrica = (typeof METRICAS)[number]["id"];

export default function AdminInicio() {
  const [range, setRange] = useState<RangeId>("30d");
  const [metrica, setMetrica] = useState<Metrica>("facturacion");

  const orders = useAdminOrders();
  const visits = useVisits(range);
  const products = useAdminProducts();
  const { data: settings } = useStoreSettings();
  const pendientes = useAdminPendientes();

  const allOrders = orders.data ?? [];
  const allVisits = visits.data ?? [];
  const catalogo = products.data;
  const costoRealEnvio = settings?.envios.costoRealEnvio ?? ENVIO_COSTO_REAL;

  const stats = useMemo(() => {
    const period = periodFor(range, allOrders, allVisits);
    const currentOrders = ordersIn(allOrders, period.from, period.to);
    const currentVisits = visitsIn(allVisits, period.from, period.to);
    const previousOrders = ordersIn(allOrders, period.prevFrom, period.prevTo);
    const previousVisits = visitsIn(allVisits, period.prevFrom, period.prevTo);
    const pagadas = currentOrders.filter(isPaid);

    const bucket = bucketFor(period.from, period.to);
    const serie = (entries: { date: Date; value: number }[]) =>
      buildSeries(entries, period, bucket);

    const facturacionSerie = serie(
      pagadas.map((order) => ({
        date: new Date(order.createdAt),
        value: orderRevenue(order),
      })),
    );
    const ventasSerie = serie(
      pagadas.map((order) => ({ date: new Date(order.createdAt), value: 1 })),
    );
    const visitasSerie = serie(
      currentVisits.map((visit) => ({
        date: new Date(visit.createdAt),
        value: 1,
      })),
    );

    // Conversión por tramo: ventas sobre sesiones distintas de ese tramo
    const sesionesPorBucket = new Map<string, Set<string>>();
    for (const visit of currentVisits) {
      const key = bucketKey(bucketStart(new Date(visit.createdAt), bucket), bucket);
      const set = sesionesPorBucket.get(key) ?? new Set<string>();
      set.add(visit.sessionId);
      sesionesPorBucket.set(key, set);
    }
    const conversionSerie = ventasSerie.map((point) => {
      const sesiones = sesionesPorBucket.get(point.key)?.size ?? 0;
      return sesiones ? point.value / sesiones : 0;
    });

    // Sin catálogo no hay costos: la ganancia queda en null y la pantalla lo
    // dice, en vez de mostrar la facturación disfrazada de ganancia.
    let ganancia = null;
    if (catalogo) {
      const inicioDeMes = new Date();
      inicioDeMes.setDate(1);
      inicioDeMes.setHours(0, 0, 0, 0);

      ganancia = {
        periodo: profitFor(currentOrders, catalogo, costoRealEnvio),
        anterior: period.prevFrom
          ? profitFor(previousOrders, catalogo, costoRealEnvio)
          : null,
        // La meta es mensual: se mide siempre sobre el mes calendario en
        // curso, no sobre el rango elegido arriba.
        mes: profitFor(
          ordersIn(allOrders, inicioDeMes, new Date()),
          catalogo,
          costoRealEnvio,
        ),
        serie: serie(
          pagadas.map((order) => ({
            date: new Date(order.createdAt),
            value: profitFor([order], catalogo, costoRealEnvio).profit,
          })),
        ),
      };
    }

    return {
      bucket,
      actual: kpisFor(currentOrders, currentVisits),
      anterior: period.prevFrom
        ? kpisFor(previousOrders, previousVisits)
        : null,
      facturacionSerie,
      ventasSerie,
      visitasSerie,
      conversionSerie,
      ganancia,
      ranking: topProducts(currentOrders).slice(0, 5),
      ultimas: currentOrders.slice(0, 6),
    };
  }, [range, allOrders, allVisits, catalogo, costoRealEnvio]);

  const { actual, anterior, ganancia } = stats;
  const meta = settings?.precios.metaGananciaMensual ?? 0;

  const bucketLabel =
    stats.bucket === "hour"
      ? "por hora"
      : stats.bucket === "day"
        ? "por día"
        : stats.bucket === "week"
          ? "por semana"
          : "por mes";

  if (orders.error) {
    return (
      <>
        <PageHeading title="Inicio" />
        <QueryError error={orders.error} what="las ventas" />
      </>
    );
  }

  const grafico = {
    facturacion: {
      points: stats.facturacionSerie,
      format: formatPrice,
      total: formatPrice(actual.facturacion),
      empty: "Sin ventas cobradas en este período.",
    },
    ventas: {
      points: stats.ventasSerie,
      format: (v: number) => `${v} ${v === 1 ? "venta" : "ventas"}`,
      total: `${actual.ventas} ${actual.ventas === 1 ? "venta" : "ventas"}`,
      empty: "Sin ventas cobradas en este período.",
    },
    visitas: {
      points: stats.visitasSerie,
      format: (v: number) => `${v.toLocaleString("es-AR")} vistas`,
      total: `${actual.visitas.toLocaleString("es-AR")} vistas`,
      empty: "Todavía no hay visitas registradas.",
    },
  }[metrica];

  return (
    <>
      <PageHeading
        title={
          <>
            Cómo va{" "}
            <em className="font-serif font-normal italic text-lila-ink">
              la tienda
            </em>
          </>
        }
        description="Arriba, lo que espera algo de vos. Abajo, los números del período elegido comparados con el anterior."
      >
        <RangeTabs value={range} onChange={setRange} />
      </PageHeading>

      {/* Lo único sobre lo que todavía se puede hacer algo va primero: lo
          pendiente y el minuto que corre. Los números del período, después. */}
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ParaHacerHoy pendientes={pendientes} />
        </div>
        <div className="lg:col-span-3 [&>section]:h-full">
          <AhoraMismo />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Facturación"
          value={formatCompactPrice(actual.facturacion)}
          hint={
            actual.ventas
              ? `${actual.ventas} ${actual.ventas === 1 ? "venta" : "ventas"} · ticket ${formatCompactPrice(actual.ticket)}`
              : "sin ventas cobradas"
          }
          variation={
            anterior ? variation(actual.facturacion, anterior.facturacion) : null
          }
          trend={stats.facturacionSerie.map((p) => p.value)}
        />
        <StatCard
          label="Ganancia"
          value={ganancia ? formatCompactPrice(ganancia.periodo.profit) : "—"}
          hint={
            ganancia && ganancia.periodo.revenue
              ? `margen ${formatPercent(ganancia.periodo.margin, 0)} · sin mano de obra`
              : "sin mano de obra"
          }
          variation={
            ganancia?.anterior
              ? variation(ganancia.periodo.profit, ganancia.anterior.profit)
              : null
          }
          trend={ganancia?.serie.map((p) => p.value)}
        />
        <StatCard
          label="Visitas"
          value={actual.visitas.toLocaleString("es-AR")}
          hint={`${actual.sesiones.toLocaleString("es-AR")} ${actual.sesiones === 1 ? "sesión" : "sesiones"}`}
          variation={
            anterior ? variation(actual.visitas, anterior.visitas) : null
          }
          trend={stats.visitasSerie.map((p) => p.value)}
        />
        <StatCard
          label="Conversión"
          value={actual.sesiones ? formatPercent(actual.conversion, 2) : "—"}
          hint="ventas sobre sesiones"
          variation={
            anterior ? variation(actual.conversion, anterior.conversion) : null
          }
          trend={stats.conversionSerie}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={`${METRICAS.find((m) => m.id === metrica)!.label} ${bucketLabel}`}
          aside={
            <div
              role="group"
              aria-label="Qué mostrar en el gráfico"
              className="flex gap-1 rounded-full bg-cream p-1"
            >
              {METRICAS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={metrica === m.id}
                  onClick={() => setMetrica(m.id)}
                  className={cn(
                    "rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors",
                    metrica === m.id ? "bg-ink text-cream" : "text-ink/65 hover:text-ink",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          }
        >
          {metrica === "visitas" && visits.error ? (
            <QueryError error={visits.error} what="las visitas" />
          ) : (
            <TrendChart
              points={grafico.points}
              formatValue={grafico.format}
              summaryLabel="Total del período"
              summaryValue={grafico.total}
              emptyLabel={grafico.empty}
            />
          )}
        </Panel>

        <MetaDelMes mes={ganancia?.mes ?? null} meta={meta} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Cuenta de la ganancia" aside="del período">
          {products.error ? (
            <p className="text-sm text-ink/65">
              No se pudo cargar el catálogo, así que no se puede calcular la
              ganancia.
            </p>
          ) : !ganancia ? (
            <p className="text-sm text-ink/65">Cargando los costos del catálogo…</p>
          ) : (
            <>
              <dl className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/65">Facturado</dt>
                  <dd>{formatPrice(ganancia.periodo.revenue)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/65">− Materiales</dt>
                  <dd>{formatPrice(ganancia.periodo.cost)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/65">
                    − Envío puesto
                    {ganancia.periodo.shippedOrders > 0 && (
                      <span className="text-ink/45">
                        {" "}
                        · {ganancia.periodo.shippedOrders}{" "}
                        {ganancia.periodo.shippedOrders === 1 ? "envío" : "envíos"}
                      </span>
                    )}
                  </dt>
                  <dd>{formatPrice(ganancia.periodo.shipping)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-ink/10 pt-2.5 text-sm font-medium">
                  <dt>= Ganancia</dt>
                  <dd>{formatPrice(ganancia.periodo.profit)}</dd>
                </div>
              </dl>

              {ganancia.periodo.unitsWithoutCost > 0 && (
                <p className="mt-4 rounded-xl bg-amarillo/40 px-3.5 py-2.5 text-[11px] leading-relaxed">
                  ✦ {ganancia.periodo.unitsWithoutCost}{" "}
                  {ganancia.periodo.unitsWithoutCost === 1
                    ? "unidad vendida no tiene"
                    : "unidades vendidas no tienen"}{" "}
                  costo cargado ({ganancia.periodo.productsWithoutCost.join(", ")})
                  y la ganancia sale inflada.{" "}
                  <Link to="/admin/precios" className="underline">
                    Cargarlo →
                  </Link>
                </p>
              )}

              <p className="mt-4 text-[11px] leading-relaxed text-ink/65">
                El envío puesto es el costo real ({formatPrice(costoRealEnvio)})
                menos lo cobrado, en cada orden que salió por transportista. Los
                materiales son los de hoy: las órdenes no guardan el costo del
                día de la venta.
              </p>
            </>
          )}
        </Panel>

        <Panel
          title="Lo que más se vende"
          aside={
            <Link to="/admin/estadisticas?tab=productos" className="uppercase tracking-widest hover:text-ink">
              Ver todo →
            </Link>
          }
        >
          {stats.ranking.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/65">
              Sin ventas cobradas en este período.
            </p>
          ) : (
            <ol className="space-y-3">
              {stats.ranking.map((product, index) => {
                const max = stats.ranking[0].units;
                return (
                  <li key={product.slug}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">
                        <span className="font-mono text-[11px] text-ink/65">
                          {index + 1}.
                        </span>{" "}
                        {product.name}
                      </span>
                      <span className="whitespace-nowrap font-mono text-xs">
                        {product.units} u ·{" "}
                        <span className="text-ink/65">
                          {formatCompactPrice(product.revenue)}
                        </span>
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="mt-1.5 h-1 rounded-full bg-ink/[0.07]"
                    >
                      <div
                        className="h-full rounded-full bg-petroleo"
                        style={{ width: `${(product.units / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        <Panel
          title="Últimas órdenes"
          aside={
            <Link to="/admin/ventas" className="uppercase tracking-widest hover:text-ink">
              Ver todas →
            </Link>
          }
        >
          {orders.isLoading ? (
            <p className="animate-pulse py-8 text-center font-mono text-xs uppercase tracking-widest text-ink/65">
              ✦ Cargando…
            </p>
          ) : stats.ultimas.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/65">
              Sin órdenes en este período.
            </p>
          ) : (
            <ul className="-my-2.5 divide-y divide-ink/[0.08]">
              {stats.ultimas.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/admin/ventas?orden=${order.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{order.customerName}</span>
                      <span className="font-mono text-[11px] uppercase tracking-widest text-ink/65">
                        {formatDate(order.createdAt)} · {formatPrice(order.total)}
                      </span>
                    </span>
                    <StatusBadge kind="pago" value={order.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
