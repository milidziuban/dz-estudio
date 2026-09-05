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
  RESERVA_HORAS,
  formatCompactPrice,
  formatDate,
  formatPercent,
  isPaid,
  orderRevenue,
  pendingStage,
  variation,
  type RangeId,
} from "../../lib/admin";
import {
  bucketFor,
  buildSeries,
  kpisFor,
  ordersIn,
  periodFor,
  profitFor,
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

  // La ganancia necesita el costo de cada producto, así que se calcula fuera
  // del memo de arriba: depende del catálogo, que carga por su cuenta.
  const ganancia = useMemo(() => {
    const catalogo = products.data ?? [];
    const period = periodFor(range, allOrders, allVisits);

    // El avance del mes se mide siempre sobre el mes calendario en curso, no
    // sobre el rango elegido: la meta es mensual y con "7 días" seleccionado
    // compararía siete días contra una meta de treinta.
    const inicioDeMes = new Date();
    inicioDeMes.setDate(1);
    inicioDeMes.setHours(0, 0, 0, 0);

    return {
      periodo: profitFor(
        ordersIn(allOrders, period.from, period.to),
        catalogo,
      ),
      mes: profitFor(ordersIn(allOrders, inicioDeMes, new Date()), catalogo),
    };
  }, [range, allOrders, allVisits, products.data]);

  const meta = settings?.precios.metaGananciaMensual ?? 0;
  const avanceMeta = meta ? Math.min(100, (ganancia.mes.profit / meta) * 100) : 0;

  // Las reservas vencidas se cuentan sobre todas las órdenes y no sobre el
  // período elegido: una transferencia que se cayó hace un mes sigue siendo
  // algo para cerrar, aunque el gráfico esté mostrando los últimos 7 días.
  const vencidas = useMemo(
    () => allOrders.filter((order) => pendingStage(order) === "vencida").length,
    [allOrders],
  );

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

      {(vencidas > 0 || actual.pendientes > 0 || bajoStock.length > 0) && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row">
          {/* Primero lo que rompe una promesa: el sitio dice que la reserva
              dura 48 h y hasta ahora nada avisaba cuando se cumplían */}
          {vencidas > 0 && (
            <Link
              to="/admin/ventas?estado=vencidas"
              className="flex-1 rounded-xl bg-amarillo px-4 py-3 text-xs leading-relaxed transition-opacity hover:opacity-90"
            >
              ✦ {vencidas}{" "}
              {vencidas === 1
                ? "transferencia pasó"
                : "transferencias pasaron"}{" "}
              las {RESERVA_HORAS} h reservadas sin acreditarse →
            </Link>
          )}
          {actual.pendientes > 0 && (
            <Link
              to="/admin/ventas?estado=pending"
              className="flex-1 rounded-xl bg-ink/5 px-4 py-3 text-xs leading-relaxed transition-opacity hover:opacity-90"
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

      <section className="mt-3 rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
            Ganancia del período
          </h2>
          <p className="font-mono text-[11px] text-ink/65">
            facturación − materiales, sin mano de obra
          </p>
        </div>

        {/* Sin el catálogo no hay costos, y todo se leería como ganancia
            pura: mejor no mostrar un número que va a estar mal. */}
        {products.isLoading || products.error ? (
          <p className="mt-6 text-sm text-ink/65">
            {products.error
              ? "No se pudo cargar el catálogo, así que no se puede calcular la ganancia."
              : "Cargando los costos del catálogo…"}
          </p>
        ) : (
          <>
            <p className="mt-4 font-mono text-3xl font-medium tracking-tight">
              {formatPrice(ganancia.periodo.profit)}
            </p>
            <p className="mt-1.5 text-[11px] text-ink/65">
              {formatPrice(ganancia.periodo.revenue)} facturados −{" "}
              {formatPrice(ganancia.periodo.cost)} de materiales
              {ganancia.periodo.revenue > 0 && (
                <> · margen {formatPercent(ganancia.periodo.margin, 1)}</>
              )}
            </p>

            {meta > 0 && (
              <div className="mt-6 border-t border-ink/[0.08] pt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
                    Meta del mes
                  </p>
                  <p className="font-mono text-xs">
                    {formatPrice(ganancia.mes.profit)}{" "}
                    <span className="text-ink/65">
                      de {formatPrice(meta)} ·{" "}
                      {formatPercent(avanceMeta, avanceMeta < 10 ? 1 : 0)}
                    </span>
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(avanceMeta)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Avance de la meta de ganancia del mes"
                  className="mt-2.5 h-1.5 rounded-full bg-ink/[0.07]"
                >
                  <div
                    className="h-full rounded-full bg-verde transition-[width]"
                    style={{ width: `${Math.max(avanceMeta, 0)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-ink/65">
                  Es el mes calendario en curso, no el rango de arriba.
                </p>
              </div>
            )}

            {ganancia.periodo.unitsWithoutCost > 0 && (
              <p className="mt-5 rounded-xl bg-amarillo/40 px-4 py-3 text-[11px] leading-relaxed">
                ✦ {ganancia.periodo.unitsWithoutCost}{" "}
                {ganancia.periodo.unitsWithoutCost === 1
                  ? "unidad vendida no tiene"
                  : "unidades vendidas no tienen"}{" "}
                el costo cargado ({ganancia.periodo.productsWithoutCost.join(", ")}),
                así que cuentan como costo cero y la ganancia de arriba está
                inflada.{" "}
                <Link to="/admin/precios" className="underline">
                  Cargar el costo →
                </Link>
              </p>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-ink/65">
              El costo es el que tiene el producto hoy: las órdenes guardan el
              precio cobrado, no el costo del día de la venta.
            </p>
          </>
        )}
      </section>

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
              className="font-mono text-[10px] uppercase tracking-widest text-ink/65 hover:text-ink"
            >
              Ver todo →
            </Link>
          </div>

          {stats.ranking.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/65">
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
        </section>

        <section className="rounded-2xl bg-white p-6">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-mono text-xs font-medium uppercase tracking-[0.15em]">
              Últimas ventas
            </h2>
            <Link
              to="/admin/ventas"
              className="font-mono text-[10px] uppercase tracking-widest text-ink/65 hover:text-ink"
            >
              Ver todas →
            </Link>
          </div>

          {orders.isLoading ? (
            <p className="animate-pulse py-8 text-center font-mono text-xs uppercase tracking-widest text-ink/65">
              ✦ Cargando…
            </p>
          ) : stats.ultimas.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/65">
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
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
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
