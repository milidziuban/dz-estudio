import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeading from "../../components/admin/PageHeading";
import QueryError from "../../components/admin/QueryError";
import RangeTabs from "../../components/admin/RangeTabs";
import StatCard from "../../components/admin/StatCard";
import StatusBadge from "../../components/admin/StatusBadge";
import TrendChart from "../../components/admin/TrendChart";
import { useAdminOrders } from "../../hooks/useAdminOrders";
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
  buildSeries,
  kpisFor,
  ordersIn,
  periodFor,
  topProducts,
  visitsIn,
} from "../../lib/admin-stats";
import { formatPrice } from "../../lib/format";

export default function AdminInicio() {
  const [range, setRange] = useState<RangeId>("30d");

  const orders = useAdminOrders();
  const visits = useVisits(range);
  const products = useAdminProducts();
  const { data: settings } = useStoreSettings();

  const allOrders = orders.data ?? [];
  const allVisits = visits.data ?? [];

  const stats = useMemo(() => {
    const period = periodFor(range, allOrders, allVisits);
    const currentOrders = ordersIn(allOrders, period.from, period.to);
    const currentVisits = visitsIn(allVisits, period.from, period.to);
    const previousOrders = ordersIn(allOrders, period.prevFrom, period.prevTo);
    const previousVisits = visitsIn(allVisits, period.prevFrom, period.prevTo);

    const bucket = bucketFor(period.from, period.to);

    return {
      period,
      bucket,
      actual: kpisFor(currentOrders, currentVisits),
      anterior: period.prevFrom
        ? kpisFor(previousOrders, previousVisits)
        : null,
      facturacionSerie: buildSeries(
        currentOrders
          .filter(isPaid)
          .map((order) => ({
            date: new Date(order.createdAt),
            value: orderRevenue(order),
          })),
        period,
        bucket,
      ),
      visitasSerie: buildSeries(
        currentVisits.map((visit) => ({
          date: new Date(visit.createdAt),
          value: 1,
        })),
        period,
        bucket,
      ),
      ranking: topProducts(currentOrders).slice(0, 5),
      ultimas: currentOrders.slice(0, 6),
    };
  }, [range, allOrders, allVisits]);

  const { actual, anterior } = stats;

  const lowStockThreshold = settings?.distribucion.lowStockThreshold ?? 3;
  const bajoStock = (products.data ?? []).filter((product) =>
    product.variants?.length
      ? product.variants.some(
          (variant) =>
            variant.stock !== null && variant.stock <= lowStockThreshold,
        )
      : product.stock !== null && product.stock <= lowStockThreshold,
  );

  const bucketLabel =
    stats.bucket === "day"
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

  return (
    <>
      <PageHeading
        title={
          <>
            Cómo va{" "}
            <em className="font-serif font-normal italic text-lila">
              la tienda
            </em>
          </>
        }
        description="Todo lo que pasó en el período elegido: lo que entró, lo que se vendió y cuánta gente pasó por el sitio."
      >
        <RangeTabs value={range} onChange={setRange} />
      </PageHeading>

      {(actual.pendientes > 0 || bajoStock.length > 0) && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          {actual.pendientes > 0 && (
            <Link
              to="/admin/ventas?estado=pending"
              className="flex-1 rounded-xl bg-amarillo px-4 py-3 text-xs leading-relaxed transition-opacity hover:opacity-90"
            >
              ✦ {actual.pendientes}{" "}
              {actual.pendientes === 1 ? "orden pendiente" : "órdenes pendientes"}{" "}
              de pago o confirmación →
            </Link>
          )}
          {bajoStock.length > 0 && (
            <Link
              to="/admin/distribucion"
              className="flex-1 rounded-xl bg-orange/15 px-4 py-3 text-xs leading-relaxed transition-opacity hover:opacity-90"
            >
              ✧ {bajoStock.length}{" "}
              {bajoStock.length === 1 ? "producto" : "productos"} con poco stock →
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Facturación"
          value={formatCompactPrice(actual.facturacion)}
          hint={
            actual.envios
              ? `${actual.ventas} ${actual.ventas === 1 ? "venta" : "ventas"} · ${formatCompactPrice(actual.envios)} de envío aparte`
              : `${actual.ventas} ${actual.ventas === 1 ? "venta" : "ventas"}`
          }
          variation={
            anterior ? variation(actual.facturacion, anterior.facturacion) : null
          }
        />
        <StatCard
          label="Ticket promedio"
          value={actual.ticket ? formatPrice(actual.ticket) : "—"}
          hint={`${actual.unidades} unidades, sin envío`}
          variation={anterior ? variation(actual.ticket, anterior.ticket) : null}
        />
        <StatCard
          label="Visitas"
          value={actual.visitas.toLocaleString("es-AR")}
          hint={`${actual.sesiones} ${actual.sesiones === 1 ? "sesión" : "sesiones"}`}
          variation={
            anterior ? variation(actual.visitas, anterior.visitas) : null
          }
        />
        <StatCard
          label="Conversión"
          value={actual.sesiones ? formatPercent(actual.conversion, 2) : "—"}
          hint="ventas sobre sesiones"
          variation={
            anterior ? variation(actual.conversion, anterior.conversion) : null
          }
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6">
          <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
            Facturación {bucketLabel}
          </h2>
          <TrendChart
            points={stats.facturacionSerie}
            formatValue={formatPrice}
            summaryLabel="Total del período"
            summaryValue={formatPrice(actual.facturacion)}
            emptyLabel="Sin ventas cobradas en este período."
          />
        </section>

        <section className="rounded-2xl bg-white p-6">
          <h2 className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.15em]">
            Visitas {bucketLabel}
          </h2>
          {visits.error ? (
            <QueryError error={visits.error} what="las visitas" />
          ) : (
            <TrendChart
              points={stats.visitasSerie}
              formatValue={(value) => `${value.toLocaleString("es-AR")} vistas`}
              summaryLabel="Total del período"
              summaryValue={`${actual.visitas.toLocaleString("es-AR")} vistas`}
              emptyLabel="Todavía no hay visitas registradas."
            />
          )}
        </section>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
              Lo que más se vende
            </h2>
            <Link
              to="/admin/productos"
              className="font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-ink"
            >
              Ver todo →
            </Link>
          </div>

          {stats.ranking.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/45">
              Sin ventas cobradas todavía.
            </p>
          ) : (
            <ol className="space-y-3">
              {stats.ranking.map((product, index) => {
                const max = stats.ranking[0].units;
                return (
                  <li key={product.slug}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">
                        <span className="font-mono text-[11px] text-ink/40">
                          {index + 1}.
                        </span>{" "}
                        {product.name}
                      </span>
                      <span className="whitespace-nowrap font-mono text-xs">
                        {product.units} u ·{" "}
                        <span className="text-ink/55">
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
        </section>

        <section className="rounded-2xl bg-white p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
              Últimas ventas
            </h2>
            <Link
              to="/admin/ventas"
              className="font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-ink"
            >
              Ver todas →
            </Link>
          </div>

          {orders.isLoading ? (
            <p className="animate-pulse py-8 text-center font-mono text-xs uppercase tracking-widest text-ink/50">
              ✦ Cargando…
            </p>
          ) : stats.ultimas.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/45">
              Sin órdenes en este período.
            </p>
          ) : (
            <ul className="divide-y divide-ink/[0.08]">
              {stats.ultimas.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{order.customerName}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                      {formatDate(order.createdAt)} ·{" "}
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <StatusBadge kind="pago" value={order.status} />
                    <span className="font-mono text-xs">
                      {formatPrice(order.total)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
